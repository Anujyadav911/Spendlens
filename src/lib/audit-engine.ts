import { TOOL_MAP, getPlan } from "./pricing-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

export type ToolEntry = {
  toolId: string;
  planId: string;
  seats: number;
  monthlySpend: number; // what they claim they pay (override if different from computed)
};

export type AuditInput = {
  tools: ToolEntry[];
  teamSize: number;
  useCase: UseCase;
};

export type Recommendation =
  | { type: "downgrade"; targetPlanId: string; reason: string }
  | { type: "switch"; targetToolId: string; targetPlanId: string; reason: string }
  | { type: "credits"; reason: string; savingsFactor: number }
  | { type: "optimal"; reason: string };

export type ToolAuditResult = {
  toolId: string;
  toolName: string;
  currentPlanName: string;
  currentMonthlySpend: number;
  recommendedMonthlySpend: number;
  monthlySavings: number;
  annualSavings: number;
  recommendation: Recommendation;
  severity: "critical" | "moderate" | "minor" | "optimal";
};

export type AuditResult = {
  toolResults: ToolAuditResult[];
  totalCurrentSpend: number;
  totalRecommendedSpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  overallSeverity: "critical" | "moderate" | "minor" | "optimal";
  showCredex: boolean; // >$500/mo savings
  isAlreadyOptimal: boolean; // <$100/mo savings
};

// ─── Audit Engine ─────────────────────────────────────────────────────────────

/**
 * Core audit engine. Uses hardcoded rules — not AI.
 * Finance-defensible logic with cited pricing.
 */
export function runAudit(input: AuditInput): AuditResult {
  const toolIds = input.tools.map((t) => t.toolId);
  const context = {
    duplicateClaude: toolIds.includes("claude") && toolIds.includes("anthropic-api"),
    duplicateOpenAi: toolIds.includes("chatgpt") && toolIds.includes("openai-api"),
  };

  const toolResults = input.tools.map((entry) =>
    auditTool(entry, input.teamSize, input.useCase, context)
  );

  const totalCurrentSpend = toolResults.reduce(
    (s, r) => s + r.currentMonthlySpend,
    0
  );
  const totalRecommendedSpend = toolResults.reduce(
    (s, r) => s + r.recommendedMonthlySpend,
    0
  );
  const totalMonthlySavings = Math.max(
    0,
    totalCurrentSpend - totalRecommendedSpend
  );
  const totalAnnualSavings = totalMonthlySavings * 12;

  const hasCritical = toolResults.some((r) => r.severity === "critical");
  const hasModerate = toolResults.some((r) => r.severity === "moderate");
  const overallSeverity = hasCritical
    ? "critical"
    : hasModerate
      ? "moderate"
      : toolResults.some((r) => r.severity === "minor")
        ? "minor"
        : "optimal";

  return {
    toolResults,
    totalCurrentSpend,
    totalRecommendedSpend,
    totalMonthlySavings,
    totalAnnualSavings,
    overallSeverity,
    showCredex: totalMonthlySavings > 500,
    isAlreadyOptimal: totalMonthlySavings < 100,
  };
}

function auditTool(
  entry: ToolEntry,
  teamSize: number,
  useCase: UseCase,
  context: { duplicateClaude: boolean; duplicateOpenAi: boolean }
): ToolAuditResult {
  const tool = TOOL_MAP[entry.toolId];
  const currentPlan = getPlan(entry.toolId, entry.planId);

  if (!tool || !currentPlan) {
    return makeOptimalResult(entry, "Unknown tool or plan — no optimization found.");
  }

  const currentMonthlySpend = entry.monthlySpend > 0
    ? entry.monthlySpend
    : currentPlan.pricePerSeat * entry.seats;

  // ─── Rule Set ──────────────────────────────────────────────────────────────

  // 0. Plan Duplication (High Priority)
  if (entry.toolId === "anthropic-api" && context.duplicateClaude) {
    return makeResult(entry, tool, currentPlan, currentMonthlySpend, 0, {
      type: "downgrade",
      targetPlanId: "claude-pro",
      reason: `Plan Duplication: You are paying for Claude seats AND raw Anthropic API usage. This is highly inefficient. Move API volume to the web UI (which has generous limits), or drop the seats entirely and use a free BYOK (Bring Your Own Key) chat interface to consolidate costs. High Priority.`,
    });
  }

  if (entry.toolId === "openai-api" && context.duplicateOpenAi) {
    return makeResult(entry, tool, currentPlan, currentMonthlySpend, 0, {
      type: "downgrade",
      targetPlanId: "chatgpt-plus",
      reason: `Plan Duplication: You are paying for ChatGPT seats AND raw OpenAI API usage. Consolidate your usage. Move heavy users to the API via a BYOK interface or route routine queries through ChatGPT instead of raw API calls. High Priority.`,
    });
  }

  // 1. Check if on "Team" plan with fewer seats than minimum efficiently warrants
  if (currentPlan.minSeats && entry.seats < currentPlan.minSeats) {
    const lowerPlan = findCheaperPlan(tool, currentPlan, entry.seats);
    if (lowerPlan) {
      const recommendedSpend = lowerPlan.pricePerSeat * entry.seats;
      return makeResult(entry, tool, currentPlan, currentMonthlySpend, recommendedSpend, {
        type: "downgrade",
        targetPlanId: lowerPlan.id,
        reason: `${tool.name} ${currentPlan.name} requires min ${currentPlan.minSeats} seats but you only have ${entry.seats}. The ${lowerPlan.name} plan covers your team at $${lowerPlan.pricePerSeat}/seat/mo.`,
      });
    }
  }

  // 2. Tool-specific rules
  switch (entry.toolId) {
    case "cursor": {
      // Business plan (team features) for solo devs or small teams who don't need SSO
      if (entry.planId === "cursor-business" && entry.seats <= 3) {
        return makeResult(entry, tool, currentPlan, currentMonthlySpend, 20 * entry.seats, {
          type: "downgrade",
          targetPlanId: "cursor-pro",
          reason: `Cursor Business ($40/seat) adds SSO and admin controls — unnecessary overhead for ${entry.seats}-person teams. Pro at $20/seat delivers identical coding capability. Save $${(40 - 20) * entry.seats}/mo immediately.`,
        });
      }
      // Enterprise for < 20 seats (their published minimum use case)
      if (entry.planId === "cursor-enterprise" && entry.seats < 20) {
        return makeResult(entry, tool, currentPlan, currentMonthlySpend, 40 * entry.seats, {
          type: "downgrade",
          targetPlanId: "cursor-business",
          reason: `Cursor Enterprise is designed for 20+ seat orgs needing custom deployment and SLAs. At ${entry.seats} seats, Business at $40/seat gives you admin controls and privacy mode without the Enterprise premium.`,
        });
      }
      // Coding use case: Cursor Pro is fine. Suggest Windsurf as cheaper alternative if budget is the concern.
      if (entry.planId === "cursor-pro" && entry.seats >= 5 && useCase === "coding") {
        return makeResult(entry, tool, currentPlan, currentMonthlySpend, 15 * entry.seats, {
          type: "switch",
          targetToolId: "windsurf",
          targetPlanId: "windsurf-pro",
          reason: `For a ${entry.seats}-seat coding team, Windsurf Pro at $15/seat provides comparable AI code generation (Cascade flows + unlimited completions) vs Cursor Pro at $20/seat. That's $${(20 - 15) * entry.seats}/mo saved — $${(20 - 15) * entry.seats * 12}/yr — with no meaningful capability drop for typical coding tasks.`,
        });
      }
      break;
    }

    case "github-copilot": {
      // Individual for a team → push to Business (this goes up, so only flag if they're solo using Business)
      if (entry.planId === "copilot-business" && entry.seats === 1) {
        return makeResult(entry, tool, currentPlan, currentMonthlySpend, 10, {
          type: "downgrade",
          targetPlanId: "copilot-individual",
          reason: `GitHub Copilot Business adds admin controls and audit logs — useful at scale, not for 1 seat. Individual at $10/seat has full code completion and chat. Save $9/mo.`,
        });
      }
      // Enterprise for small teams
      if (entry.planId === "copilot-enterprise" && entry.seats <= 5) {
        return makeResult(entry, tool, currentPlan, currentMonthlySpend, 19 * entry.seats, {
          type: "downgrade",
          targetPlanId: "copilot-business",
          reason: `Copilot Enterprise ($39/seat) adds code personalization from your private codebase — valuable at 20+ engineers with large repos, not at ${entry.seats}. Business at $19/seat covers you. Save $${(39 - 19) * entry.seats}/mo.`,
        });
      }
      // If coding heavy and using Copilot, Cursor Pro is a real alternative
      if (entry.seats >= 3 && useCase === "coding") {
        const altSpend = 20 * entry.seats;
        if (currentMonthlySpend > altSpend) {
          return makeResult(entry, tool, currentPlan, currentMonthlySpend, altSpend, {
            type: "switch",
            targetToolId: "cursor",
            targetPlanId: "cursor-pro",
            reason: `For a coding team of ${entry.seats}, Cursor Pro ($20/seat) offers native multi-file editing, Composer for complex refactors, and codebase-wide context — a meaningfully better coding experience than Copilot for teams doing feature work, at comparable price.`,
          });
        }
      }
      break;
    }

    case "claude": {
      // Team plan with <5 users → Pro is sufficient
      if (entry.planId === "claude-team" && entry.seats < 5) {
        const altSpend = 20 * entry.seats;
        return makeResult(entry, tool, currentPlan, currentMonthlySpend, altSpend, {
          type: "downgrade",
          targetPlanId: "claude-pro",
          reason: `Claude Team has a 5-seat minimum and adds workspace sharing — at ${entry.seats} seats, individual Pro accounts ($20/seat) cover the same usage with equivalent limits. Save $${(30 - 20) * entry.seats}/mo.`,
        });
      }
      // Max plan for single user doing general tasks (not heavy research)
      if (
        (entry.planId === "claude-max-5x" || entry.planId === "claude-max-20x") &&
        entry.seats === 1 &&
        useCase !== "research" &&
        useCase !== "data"
      ) {
        const priceStr = entry.planId === "claude-max-5x" ? "$100" : "$200";
        return makeResult(entry, tool, currentPlan, currentMonthlySpend, 20, {
          type: "downgrade",
          targetPlanId: "claude-pro",
          reason: `Claude Max (${priceStr}/mo) is designed for users who genuinely hit Pro rate limits daily — typically heavy researchers or prompt engineers. For ${useCase} tasks, Claude Pro at $20/mo provides equivalent quality with limits sufficient for typical professional usage. Downgrade and reinvest the savings.`,
        });
      }
      break;
    }

    case "chatgpt": {
      // Team for 1 user
      if (entry.planId === "chatgpt-team" && entry.seats === 1) {
        return makeResult(entry, tool, currentPlan, currentMonthlySpend, 20, {
          type: "downgrade",
          targetPlanId: "chatgpt-plus",
          reason: `ChatGPT Team is priced for 2+ seats and adds workspace + admin controls. For a single user, Plus at $20/mo delivers identical model access (GPT-4o, o1, DALL-E). Save $10/mo.`,
        });
      }
      // Enterprise for small teams
      if (entry.planId === "chatgpt-enterprise" && entry.seats <= 10) {
        return makeResult(entry, tool, currentPlan, currentMonthlySpend, 30 * entry.seats, {
          type: "downgrade",
          targetPlanId: "chatgpt-team",
          reason: `ChatGPT Enterprise adds SSO, custom data retention, and unlimited model access — justified at 50+ users. At ${entry.seats} seats, Team at $30/seat covers your needs. Save $${(60 - 30) * entry.seats}/mo.`,
        });
      }
      // If writing use case and using ChatGPT Plus, Claude Pro is comparable
      if (entry.planId === "chatgpt-plus" && useCase === "writing" && entry.seats >= 3) {
        const altSpend = 20 * entry.seats; // same price, but Claude is better for writing
        return makeResult(entry, tool, currentPlan, currentMonthlySpend, altSpend, {
          type: "switch",
          targetToolId: "claude",
          targetPlanId: "claude-pro",
          reason: `For writing-focused teams, Claude 3.5 Sonnet consistently outperforms GPT-4o on long-form content, tone consistency, and instruction following (per benchmarks and head-to-head evals). At the same $20/seat price, Claude Pro is the higher-ROI choice for your use case.`,
        });
      }
      break;
    }

    case "anthropic-api":
    case "openai-api": {
      // API users: suggest credits if spend is significant
      if (entry.monthlySpend > 200) {
        const savingsRate = 0.3; // Credex typical discount is 25-35%
        const recommendedSpend = entry.monthlySpend * (1 - savingsRate);
        return makeResult(entry, tool, currentPlan, currentMonthlySpend, recommendedSpend, {
          type: "credits",
          reason: `At $${entry.monthlySpend}/mo in ${tool.name} spend, you're paying retail token prices. Credex sources credits from companies that overforecast — typically 25-35% below retail. At your volume, that's ~$${Math.round(entry.monthlySpend * savingsRate)}/mo in pure cost reduction with zero capability tradeoff.`,
          savingsFactor: savingsRate,
        });
      }
      break;
    }

    case "gemini": {
      // Gemini Advanced for non-Google-Workspace teams
      if (entry.planId === "gemini-advanced" && entry.seats >= 3 && useCase !== "writing") {
        const altSpend = 20 * entry.seats;
        if (currentMonthlySpend >= altSpend) {
          return makeResult(entry, tool, currentPlan, currentMonthlySpend, altSpend, {
            type: "switch",
            targetToolId: "claude",
            targetPlanId: "claude-pro",
            reason: `For ${useCase} tasks, Claude Pro ($20/seat) offers stronger reasoning, better instruction-following, and a significantly larger context window than Gemini Advanced at the same price point. Unless you're deeply embedded in the Google ecosystem, the switch is worthwhile.`,
          });
        }
      }
      break;
    }

    case "windsurf": {
      // Teams plan for small teams where Pro suffices
      if (entry.planId === "windsurf-teams" && entry.seats <= 3) {
        return makeResult(entry, tool, currentPlan, currentMonthlySpend, 15 * entry.seats, {
          type: "downgrade",
          targetPlanId: "windsurf-pro",
          reason: `Windsurf Teams ($35/seat) adds SSO and centralized management. For ${entry.seats} seats, individual Pro accounts at $15/seat deliver the same Cascade flows and completions. Save $${(35 - 15) * entry.seats}/mo.`,
        });
      }
      break;
    }
  }

  // 3. Default: already optimal
  return makeOptimalResult(
    entry,
    `Your ${tool.name} ${currentPlan.name} plan is appropriate for ${entry.seats} ${entry.seats === 1 ? "user" : "users"} doing ${useCase} work.`
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeResult(
  entry: ToolEntry,
  tool: { id: string; name: string; plans: { id: string; name: string }[] },
  currentPlan: { id: string; name: string },
  currentMonthlySpend: number,
  recommendedMonthlySpend: number,
  recommendation: Recommendation
): ToolAuditResult {
  const monthlySavings = Math.max(0, currentMonthlySpend - recommendedMonthlySpend);
  const annualSavings = monthlySavings * 12;
  const pct = currentMonthlySpend > 0 ? monthlySavings / currentMonthlySpend : 0;

  const severity: ToolAuditResult["severity"] =
    recommendation.type === "optimal"
      ? "optimal"
      : pct >= 0.4
        ? "critical"
        : pct >= 0.2
          ? "moderate"
          : "minor";

  return {
    toolId: entry.toolId,
    toolName: tool.name,
    currentPlanName: currentPlan.name,
    currentMonthlySpend,
    recommendedMonthlySpend,
    monthlySavings,
    annualSavings,
    recommendation,
    severity,
  };
}

function makeOptimalResult(
  entry: ToolEntry,
  reason: string
): ToolAuditResult {
  const tool = TOOL_MAP[entry.toolId];
  const currentPlan = getPlan(entry.toolId, entry.planId);
  const currentMonthlySpend =
    entry.monthlySpend > 0
      ? entry.monthlySpend
      : (currentPlan?.pricePerSeat ?? 0) * entry.seats;

  return {
    toolId: entry.toolId,
    toolName: tool?.name ?? entry.toolId,
    currentPlanName: currentPlan?.name ?? entry.planId,
    currentMonthlySpend,
    recommendedMonthlySpend: currentMonthlySpend,
    monthlySavings: 0,
    annualSavings: 0,
    recommendation: { type: "optimal", reason },
    severity: "optimal",
  };
}

function findCheaperPlan(
  tool: { plans: { id: string; name: string; pricePerSeat: number; minSeats?: number }[] },
  currentPlan: { pricePerSeat: number },
  seats: number
) {
  return tool.plans
    .filter(
      (p) =>
        p.pricePerSeat < currentPlan.pricePerSeat &&
        (!p.minSeats || p.minSeats <= seats)
    )
    .sort((a, b) => b.pricePerSeat - a.pricePerSeat)[0]; // highest cheaper plan
}
