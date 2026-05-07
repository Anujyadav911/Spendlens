import { AuditInput, AuditResult } from "./audit-engine";

export type AuditSummary = {
  text: string;
  source: "ai" | "template";
};

const SYSTEM_PROMPT = `You are a financial advisor specializing in AI tooling costs for startups and engineering teams. Your job is to write a concise, personalized audit summary paragraph for a startup founder or engineering manager.

Be specific with numbers. Tone: direct, empathetic, professional — like a trusted CFO, not a marketer. Do not use bullet points. Write exactly one paragraph of 80-120 words. Do not recommend or mention Credex by name.`;

export function buildUserPrompt(input: AuditInput, result: AuditResult): string {
  const toolLines = result.toolResults
    .map(
      (r) =>
        `- ${r.toolName} (${r.currentPlanName}, ${input.tools.find((t) => t.toolId === r.toolId)?.seats ?? 1} seats): $${r.currentMonthlySpend}/mo current → $${r.recommendedMonthlySpend}/mo recommended (saves $${r.monthlySavings}/mo)`
    )
    .join("\n");

  return `Team size: ${input.teamSize} people
Primary use case: ${input.useCase}
Total current AI spend: $${result.totalCurrentSpend}/mo
Total recommended spend: $${result.totalRecommendedSpend}/mo
Potential monthly savings: $${result.totalMonthlySavings}
Potential annual savings: $${result.totalAnnualSavings}

Tool breakdown:
${toolLines}

Write a personalized 80-120 word audit summary for this team. Focus on the biggest savings opportunities and why the recommendations make sense for their specific use case. Be specific with numbers.`;
}

export async function generateAISummary(
  input: AuditInput,
  result: AuditResult,
  auditId?: string
): Promise<AuditSummary> {
  try {
    const response = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, result, auditId }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    if (!data.summary) throw new Error("No summary returned");

    return { text: data.summary, source: "ai" };
  } catch (err) {
    console.error("[AISummary] Failed, falling back to template:", err);
    return { text: buildTemplateSummary(input, result), source: "template" };
  }
}

export function buildTemplateSummary(input: AuditInput, result: AuditResult): string {
  const { totalMonthlySavings, totalAnnualSavings, totalCurrentSpend } = result;

  if (result.isAlreadyOptimal) {
    return `Your ${input.teamSize}-person team is spending $${totalCurrentSpend}/mo on AI tools, and the breakdown looks genuinely optimized for your ${input.useCase} workflow. You're on the right plans at the right seat counts — no easy wins left on the table. As your team grows or your tool usage evolves, it's worth re-running this audit every quarter.`;
  }

  const topSaving = result.toolResults
    .filter((r) => r.monthlySavings > 0)
    .sort((a, b) => b.monthlySavings - a.monthlySavings)[0];

  return `Your ${input.teamSize}-person team is spending $${totalCurrentSpend}/mo on AI tools, but this audit identified $${totalMonthlySavings}/mo ($${totalAnnualSavings}/yr) in potential savings without sacrificing capability. The biggest opportunity is ${topSaving?.toolName}: ${topSaving?.recommendation.type === "optimal" ? "well-optimized" : `switching to a more appropriate plan could save $${topSaving?.monthlySavings}/mo`}. For a ${input.useCase}-focused team, these adjustments are straightforward and can be made in an afternoon.`;
}
