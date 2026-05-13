import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") || "";
  
  let dbQuery = supabase
    .from("ai_tools_registry")
    .select("*")
    .order("display_name", { ascending: true })
    .limit(50);

  if (query.trim().length > 0) {
    dbQuery = dbQuery.or(`display_name.ilike.%${query}%,provider.ilike.%${query}%`);
  }

  try {
    const { data, error } = await dbQuery;

    if (error) throw error;

    // Standardization Layer & Smart Matching Logic
    const processedData = (data as any[]).map((tool) => {
      // SpendLens Index: Monthly Cost per Developer (MCPD)
      // Assumption: Heavy dev uses 4M Input / 1M Output tokens per month.
      let mcpd = 0;
      if (tool.billing_type === 'seat') {
        mcpd = tool.price_monthly;
      } else {
        mcpd = (tool.price_input * 4) + (tool.price_output * 1);
      }
      return { ...tool, mcpd };
    });

    // Sort: SaaS first, then by MCPD ascending
    processedData.sort((a, b) => {
      if (a.billing_type === 'seat' && b.billing_type !== 'seat') return -1;
      if (a.billing_type !== 'seat' && b.billing_type === 'seat') return 1;
      return a.mcpd - b.mcpd;
    });

    return NextResponse.json({ results: processedData });
  } catch (err) {
    const error = err as Error;
    console.error("[Search API Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
