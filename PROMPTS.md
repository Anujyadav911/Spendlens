## Prompt: AI Audit Summary

**Model**: `claude-3-5-haiku-20241022`

### System Prompt

```
You are a financial advisor specializing in AI tooling costs for startups and engineering teams. Your job is to write a concise, personalized audit summary paragraph for a startup founder or engineering manager.

Be specific with numbers. Tone: direct, empathetic, professional — like a trusted CFO, not a marketer. Do not use bullet points. Write exactly one paragraph of 80-120 words. Do not recommend or mention Credex by name.
```

### User Prompt Template

```
Team size: {teamSize} people
Primary use case: {useCase}
Total current AI spend: ${totalCurrentSpend}/mo
Total recommended spend: ${totalRecommendedSpend}/mo
Potential monthly savings: ${totalMonthlySavings}
Potential annual savings: ${totalAnnualSavings}

Tool breakdown:
- {toolName} ({planName}, {seats} seats): ${currentSpend}/mo current → ${recommendedSpend}/mo recommended (saves ${savings}/mo)
...

Write a personalized 80-120 word audit summary for this team. Focus on the biggest savings opportunities and why the recommendations make sense for their specific use case. Be specific with numbers.
```

---

## Why This Prompt Design

**Specific numbers over vague patterns**: Instructing the model to "be specific with numbers" prevents generic advice like "you could save money." It forces grounding in the actual audit data.

**CFO tone, not marketer**: "Like a trusted CFO" prevents the model from being promotional. Without this, Claude tends to pepper summaries with phrases like "maximize your ROI" and "unlock savings potential." Tested without this instruction — the output reads like an ad.

**Explicit format**: "One paragraph, 80-120 words, no bullet points" is necessary because Claude defaults to bullet lists for structured data like this. The summary is meant to be readable and shareable, not a secondary breakdown.

**No mention of Credex by name**: The AI summary is meant to feel neutral and trustworthy. Mentioning Credex in the AI-generated copy would feel like the tool is biased. Credex is surfaced separately as a human-designed CTA, only for high-savings cases.

---

## What I Tried That Didn't Work

1. **Including plan details in the prompt**: Added full feature lists from each plan. Result: summaries became too technical ("you're on a plan with SSO and audit logs..."). Stripped features, kept only spend numbers.

2. **Asking for "actionable advice"**: Prompted the model to provide specific next steps. Result: it invented steps that weren't in the audit (e.g., "consider switching to Gemini" when the audit didn't suggest this). Now constrained to summarize what the audit found, not generate new recommendations.

3. **Using GPT-4o**: Tested both. Claude's summaries were more concise and had better tone adherence to the CFO instruction. Switched to Claude Haiku as it's also significantly cheaper for high-volume usage.

4. **No system prompt**: Without it, Claude formats the response as a report with sections. The system prompt is critical to getting a single clean paragraph.
