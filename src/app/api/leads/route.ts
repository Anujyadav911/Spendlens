import { NextRequest, NextResponse } from "next/server";
import { LeadCaptureSchema } from "@/lib/schemas";
import { supabase } from "@/lib/supabase";

// Simple rate limiter
const leadRateMap = new Map<string, { count: number; resetAt: number }>();

function checkLeadRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = leadRateMap.get(ip);
  if (!entry || entry.resetAt < now) {
    leadRateMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 }); // 1 hour window
    return true;
  }
  if (entry.count >= 3) return false; // 3 leads per hour per IP
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkLeadRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    // Honeypot check
    if (body.website && body.website.length > 0) {
      // Silently succeed — don't tell bots they were caught
      return NextResponse.json({ success: true });
    }

    const parsed = LeadCaptureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { email, companyName, role, teamSize } = parsed.data;
    const { auditId } = body;

    // Store in Supabase
    const { error } = await supabase.from("leads").insert({
      email,
      company_name: companyName ?? null,
      role: role ?? null,
      team_size: teamSize ?? null,
      audit_id: auditId ?? null,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/leads POST]", err);
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
