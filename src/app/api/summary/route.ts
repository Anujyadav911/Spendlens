import { NextRequest, NextResponse } from "next/server";
import { buildUserPrompt, buildTemplateSummary } from "@/lib/ai-summary";
import { AuditInput, AuditResult } from "@/lib/audit-engine";
import { supabase } from "@/lib/supabase";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const SYSTEM = `You are a financial advisor specializing in AI tooling costs for startups and engineering teams. Your job is to write a concise, personalized audit summary paragraph for a startup founder or engineering manager.

Be specific with numbers. Tone: direct, empathetic, professional — like a trusted CFO, not a marketer. Do not use bullet points. Do not recommend or mention Credex by name. Write a high-density summary under 60 words for the SpendLens dashboard. You MUST finish the sentence and end with a period.`;

// Layer 3: Smart Retry with Exponential Backoff + Jitter & Delay Parsing
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    const response = await fetch(url, options);
    
    // If successful or not a retryable error, return immediately.
    if (response.ok || (response.status !== 503 && response.status !== 429)) {
      return response;
    }
    
    let waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 500;
    
    // Smart parsing of Gemini's RetryInfo delay if available
    if (response.status === 429) {
      try {
        const clone = response.clone();
        const errData = await clone.json();
        const retryInfo = errData.error?.details?.find(
          (d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
        );
        if (retryInfo?.retryDelay) {
          const delayStr = retryInfo.retryDelay.replace('s', '');
          waitTime = parseFloat(delayStr) * 1000;
          // If the wait time is unreasonable for a synchronous UI request (e.g., > 10s), 
          // we should trip the circuit breaker early instead of hanging the server.
          if (waitTime > 10000) {
            return response; // Return the 429 to trigger the Circuit Breaker
          }
        }
      } catch (e) {
        // Ignore clone parsing errors
      }
    }

    attempt++;
    if (attempt >= maxRetries) {
      return response;
    }
    
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  throw new Error("Max retries reached");
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Layer 2: Rate Limiter (Token Bucket)
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let input: AuditInput;
  let result: AuditResult;
  let auditId: string | undefined;

  try {
    const body = await req.json();
    input = body.input;
    result = body.result;
    auditId = body.auditId;
    if (!input || !result) throw new Error("Missing input or result");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Layer 1: Global Cache (Supabase)
  if (auditId) {
    const { data: cachedAudit } = await supabase
      .from("audits")
      .select("ai_summary")
      .eq("id", auditId)
      .single();

    if (cachedAudit?.ai_summary) {
      const response = NextResponse.json({ summary: cachedAudit.ai_summary });
      response.headers.set("X-Cache", "HIT");
      return response;
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return handleCircuitBreaker(input, result, auditId, "SERVICE_UNAVAILABLE", null);
  }

  try {
    const userPrompt = buildUserPrompt(input, result);

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { 
            maxOutputTokens: 1024,
            temperature: 0.8,
            thinking_config: { include_thoughts: false }
          },
          safetySettings: [
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }
          ]
        }),
      }
    );

    const data = await response.json();
    
    // Layer 4: Circuit Breaker for Errors
    if (data.error) {
      console.error("[Gemini API Error]", data.error);
      return handleCircuitBreaker(input, result, auditId, "API_ERROR_429", null);
    }

    const finishReason = data?.candidates?.[0]?.finishReason || "UNKNOWN";
    const usageMetadata = data?.usageMetadata || null;
    
    // Validation: Prevent MAX_TOKENS truncation
    if (finishReason === "MAX_TOKENS") {
      console.error("[Gemini Truncated] FinishReason:", finishReason);
      return handleCircuitBreaker(input, result, auditId, "MAX_TOKENS_TRUNCATION", usageMetadata);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    
    if (!text) {
      console.error("[Gemini Empty] FinishReason:", finishReason);
      return handleCircuitBreaker(input, result, auditId, "EMPTY_RESPONSE", usageMetadata);
    }

    // Layer 5: Telemetry & Cache Population
    if (auditId) {
      // Async fire-and-forget to not block the response
      supabase.from("audits").update({ ai_summary: text }).eq("id", auditId).then();
      supabase.from("api_logs").insert({
        audit_id: auditId,
        finish_reason: finishReason,
        usage_metadata: usageMetadata,
      }).then();
    }

    return NextResponse.json({ summary: text });
  } catch (err) {
    console.error("[/api/summary Fatal Error]", err);
    return handleCircuitBreaker(input, result, auditId, "FATAL_EXCEPTION", null);
  }
}

// Layer 4: Graceful Degradation Helper
function handleCircuitBreaker(
  input: AuditInput, 
  result: AuditResult, 
  auditId: string | undefined, 
  reason: string,
  usageMetadata: any
) {
  const fallbackText = buildTemplateSummary(input, result);
  
  if (auditId) {
    // Log the circuit breaker trip
    supabase.from("api_logs").insert({
      audit_id: auditId,
      finish_reason: `CIRCUIT_BREAKER_TRIPPED_${reason}`,
      usage_metadata: usageMetadata,
    }).then();
  }

  // We return 200 OK so the UI doesn't know it failed, it just gracefully displays the fallback.
  return NextResponse.json({ summary: fallbackText });
}
