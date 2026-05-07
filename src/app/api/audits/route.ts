import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { auditInput, auditResult } = body;

    if (!auditInput || !auditResult) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const id = nanoid(10);

    // Prepare public data structure
    const publicData = {
      id,
      teamSize: auditInput.teamSize,
      useCase: auditInput.useCase,
      toolResults: auditResult.toolResults,
      totalCurrentSpend: auditResult.totalCurrentSpend,
      totalRecommendedSpend: auditResult.totalRecommendedSpend,
      totalMonthlySavings: auditResult.totalMonthlySavings,
      totalAnnualSavings: auditResult.totalAnnualSavings,
      overallSeverity: auditResult.overallSeverity,
      showCredex: auditResult.showCredex,
      isAlreadyOptimal: auditResult.isAlreadyOptimal,
    };

    // Store in Supabase
    const { error } = await supabase.from("audits").insert({
      id,
      input: auditInput,
      result: publicData,
    });

    if (error) throw error;

    return NextResponse.json({ id, url: `/audit/${id}` });
  } catch (err) {
    console.error("[/api/audits POST]", err);
    return NextResponse.json({ error: "Failed to save audit" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabase
    .from("audits")
    .select("result")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  return NextResponse.json(data.result);
}
