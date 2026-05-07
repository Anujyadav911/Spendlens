import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch("https://openrouter.ai/api/v1/models", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error("Failed to fetch OpenRouter models");
    const data = await res.json();

    const tools = data.data.map((model: any) => {
      // OpenRouter returns price per token as strings in pricing.prompt/completion
      // We convert them to floats and multiply by 1M
      const priceInput = parseFloat(model.pricing.prompt) * 1000000;
      const priceOutput = parseFloat(model.pricing.completion) * 1000000;

      return {
        id: model.id,
        display_name: model.name,
        provider: model.architecture?.provider || model.id.split('/')[0] || "OpenRouter",
        billing_type: "token",
        price_input: isNaN(priceInput) ? 0 : priceInput,
        price_output: isNaN(priceOutput) ? 0 : priceOutput,
        price_monthly: 0,
        last_synced_at: new Date().toISOString(),
      };
    });

    // Data Source B: Managed SaaS Master Registry
    const now = new Date().toISOString();
    const saasTools = [
      // Cursor
      { id: "cursor-free", display_name: "Cursor Free", provider: "Cursor", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 0, last_synced_at: now },
      { id: "cursor-pro", display_name: "Cursor Pro", provider: "Cursor", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 20, last_synced_at: now },
      { id: "cursor-team", display_name: "Cursor Team", provider: "Cursor", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 40, last_synced_at: now },
      
      // Windsurf
      { id: "windsurf-free", display_name: "Windsurf Free", provider: "Codeium", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 0, last_synced_at: now },
      { id: "windsurf-pro", display_name: "Windsurf Pro", provider: "Codeium", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 15, last_synced_at: now },
      { id: "windsurf-team", display_name: "Windsurf Team", provider: "Codeium", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 35, last_synced_at: now },

      // v0.dev
      { id: "v0-free", display_name: "v0 Free", provider: "Vercel", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 0, last_synced_at: now },
      { id: "v0-premium", display_name: "v0 Premium", provider: "Vercel", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 20, last_synced_at: now },
      { id: "v0-team", display_name: "v0 Team", provider: "Vercel", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 50, last_synced_at: now },

      // Replit
      { id: "replit-free", display_name: "Replit Free", provider: "Replit", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 0, last_synced_at: now },
      { id: "replit-core", display_name: "Replit Core", provider: "Replit", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 20, last_synced_at: now },
      { id: "replit-teams", display_name: "Replit Teams", provider: "Replit", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 40, last_synced_at: now },

      // Standard AI Chat
      { id: "chatgpt-plus", display_name: "ChatGPT Plus", provider: "OpenAI", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 20, last_synced_at: now },
      { id: "chatgpt-team", display_name: "ChatGPT Team", provider: "OpenAI", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 30, last_synced_at: now },
      { id: "claude-pro", display_name: "Claude Pro", provider: "Anthropic", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 20, last_synced_at: now },
      { id: "claude-team", display_name: "Claude Team", provider: "Anthropic", billing_type: "seat", price_input: 0, price_output: 0, price_monthly: 30, last_synced_at: now }
    ];

    const allTools = [...tools, ...saasTools];

    // Upsert to Supabase
    const { error } = await supabase.from("ai_tools_registry").upsert(allTools, { onConflict: "id" });

    if (error) throw error;

    return NextResponse.json({ success: true, count: allTools.length });
  } catch (error: any) {
    console.error("[Sync API Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
