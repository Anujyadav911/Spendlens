import {
  runAudit,
  AuditInput,
} from "../src/lib/audit-engine";

// ─── Test Suite: Audit Engine ─────────────────────────────────────────────────

describe("Audit Engine", () => {
  // Test 1: Cursor Business on small team → downgrade to Pro
  it("flags Cursor Business for a 2-person team as overkill (should downgrade to Pro)", () => {
    const input: AuditInput = {
      tools: [{ toolId: "cursor", planId: "cursor-business", seats: 2, monthlySpend: 0 }],
      teamSize: 2,
      useCase: "coding",
    };
    const result = runAudit(input);
    const cursorResult = result.toolResults.find((r) => r.toolId === "cursor");

    expect(cursorResult).toBeDefined();
    expect(cursorResult!.recommendation.type).toBe("downgrade");
    expect(cursorResult!.monthlySavings).toBe((40 - 20) * 2); // $40/seat → $20/seat
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
  });

  // Test 2: Claude Team with <5 seats → downgrade to individual Pro
  it("flags Claude Team for 3 users as below minimum (downgrade to Pro)", () => {
    const input: AuditInput = {
      tools: [{ toolId: "claude", planId: "claude-team", seats: 3, monthlySpend: 90 }],
      teamSize: 3,
      useCase: "writing",
    };
    const result = runAudit(input);
    const claudeResult = result.toolResults.find((r) => r.toolId === "claude");

    expect(claudeResult).toBeDefined();
    expect(claudeResult!.recommendation.type).toBe("downgrade");
    // $90/mo → $60/mo (3 × $20)
    expect(claudeResult!.monthlySavings).toBe(30);
    expect(claudeResult!.annualSavings).toBe(360);
  });

  // Test 3: ChatGPT Team for 1 user → downgrade to Plus
  it("flags ChatGPT Team for a single user (should use Plus)", () => {
    const input: AuditInput = {
      tools: [{ toolId: "chatgpt", planId: "chatgpt-team", seats: 1, monthlySpend: 30 }],
      teamSize: 1,
      useCase: "writing",
    };
    const result = runAudit(input);
    const chatgptResult = result.toolResults.find((r) => r.toolId === "chatgpt");

    expect(chatgptResult).toBeDefined();
    expect(chatgptResult!.recommendation.type).toBe("downgrade");
    expect(chatgptResult!.monthlySavings).toBe(10); // $30 → $20
  });

  // Test 4: Anthropic API at >$200/mo → credits recommendation
  it("recommends credits for high-volume Anthropic API users", () => {
    const input: AuditInput = {
      tools: [{ toolId: "anthropic-api", planId: "anthropic-api-payg", seats: 1, monthlySpend: 500 }],
      teamSize: 5,
      useCase: "data",
    };
    const result = runAudit(input);
    const apiResult = result.toolResults.find((r) => r.toolId === "anthropic-api");

    expect(apiResult).toBeDefined();
    expect(apiResult!.recommendation.type).toBe("credits");
    expect(apiResult!.monthlySavings).toBeGreaterThan(100); // at least $150 savings on $500
    expect(result.showCredex).toBe(false); // need >$500 total savings to show Credex
  });

  // Test 5: Already optimal setup returns optimal severity
  it("returns optimal for a well-configured single Cursor Pro user", () => {
    const input: AuditInput = {
      tools: [{ toolId: "cursor", planId: "cursor-pro", seats: 1, monthlySpend: 20 }],
      teamSize: 1,
      useCase: "coding",
    };
    const result = runAudit(input);
    const cursorResult = result.toolResults.find((r) => r.toolId === "cursor");

    expect(cursorResult).toBeDefined();
    expect(cursorResult!.severity).toBe("optimal");
    expect(cursorResult!.monthlySavings).toBe(0);
    expect(result.isAlreadyOptimal).toBe(true);
  });

  // Test 6: >$500/mo savings triggers Credex promotion
  it("shows Credex CTA when monthly savings exceed $500", () => {
    const input: AuditInput = {
      tools: [
        { toolId: "cursor", planId: "cursor-enterprise", seats: 10, monthlySpend: 800 },
        { toolId: "chatgpt", planId: "chatgpt-enterprise", seats: 10, monthlySpend: 600 },
      ],
      teamSize: 10,
      useCase: "coding",
    };
    const result = runAudit(input);

    expect(result.showCredex).toBe(true);
    expect(result.totalMonthlySavings).toBeGreaterThan(500);
  });

  // Test 7: Total savings calculation is correct
  it("computes correct total savings across multiple tools", () => {
    const input: AuditInput = {
      tools: [
        { toolId: "cursor", planId: "cursor-business", seats: 2, monthlySpend: 80 }, // saves $40
        { toolId: "chatgpt", planId: "chatgpt-team", seats: 1, monthlySpend: 30 },   // saves $10
      ],
      teamSize: 2,
      useCase: "coding",
    };
    const result = runAudit(input);

    expect(result.totalMonthlySavings).toBe(50);
    expect(result.totalAnnualSavings).toBe(600);
  });

  // Test 8: Copilot Enterprise for small team → downgrade to Business
  it("flags Copilot Enterprise for a 3-person team (overkill)", () => {
    const input: AuditInput = {
      tools: [{ toolId: "github-copilot", planId: "copilot-enterprise", seats: 3, monthlySpend: 117 }],
      teamSize: 3,
      useCase: "coding",
    };
    const result = runAudit(input);
    const copilotResult = result.toolResults.find((r) => r.toolId === "github-copilot");

    expect(copilotResult).toBeDefined();
    expect(copilotResult!.recommendation.type).toBe("downgrade");
    expect(copilotResult!.monthlySavings).toBe((39 - 19) * 3); // $60
  });
});
