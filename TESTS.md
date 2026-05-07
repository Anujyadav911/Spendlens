## Audit Engine Tests
**File**: `tests/audit-engine.test.ts`
**How to run**: `npm test` from inside the `credex-audit/` directory.

| # | Test Name | What It Covers |
|---|---|---|
| 1 | Cursor Business downgrade for 2-person team | Verifies the engine recommends downgrading from Business ($40/seat) to Pro ($20/seat) when team ≤ 3 seats. Validates $40/mo savings. |
| 2 | Claude Team downgrade below min seats | Verifies that Claude Team (min 5 seats) flags as overkill for 3 users. Expected downgrade to individual Pro, saving $30/mo ($360/yr). |
| 3 | ChatGPT Team for single user | Single user on ChatGPT Team should downgrade to Plus. Saves $10/mo. |
| 4 | Anthropic API credits recommendation | At $500/mo API spend, engine recommends Credex-sourced credits (25–30% savings). Validates savings > $100. |
| 5 | Already-optimal detection | Solo Cursor Pro user correctly identified as optimal. `monthlySavings = 0`, `severity = "optimal"`, `isAlreadyOptimal = true`. |
| 6 | Credex CTA threshold (>$500/mo savings) | Enterprise plans for 10-seat teams across Cursor + ChatGPT generates >$500/mo savings, triggering `showCredex = true`. |
| 7 | Total savings calculation across multiple tools | Two tools with known savings ($40 + $10) = $50/mo total, $600/yr. Validates aggregation logic. |
| 8 | Copilot Enterprise for small team | 3-seat team on Copilot Enterprise ($39/seat) → Business ($19/seat). $60/mo savings. |

```bash
# Run all tests
cd credex-audit
npm test

# Watch mode
npm run test:watch

# With verbose output
npm test -- --verbose
```
