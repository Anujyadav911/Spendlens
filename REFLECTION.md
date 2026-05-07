# Reflection

### 1. The hardest bug you hit this week, and how you debugged it
The most persistent bug was the **Supabase RLS (Row Level Security) conflict** when saving anonymous audits. I initially set the `audits` table to allow anonymous inserts, but the `result` JSONB field was being partially stripped because of a complex check constraint I added to ensure no emails were stored in public audits.

**Debugging process:**
- **Hypothesis 1:** The JSON structure was invalid. I logged the payload before `supabase.insert()`. It was valid.
- **Hypothesis 2:** The API key lacked permissions. I tried with the Service Role key, and it worked, confirming an RLS issue.
- **Hypothesis 3:** The check constraint `NOT (result->>'input' @> 'email')` was failing on null values.
**The Fix:** I simplified the RLS to allow anonymous inserts but strictly limited the `SELECT` policy to only return the `result` field (which has PII stripped by the API layer) and not the `input` field. This ensured data privacy without breaking the insert flow.

### 2. A decision you reversed mid-week, and what made you reverse it
Mid-week, I initially planned to use **Claude 3 Opus** for the summaries because of its high reasoning capability. However, after running the unit economics in `ECONOMICS.md`, I realized that at $15/1M tokens, it would kill the ROI of a free lead-gen tool if it went viral. 

**The Reversal:** I switched to **Gemini Flash**. It provided 95% of the quality for 1/20th of the cost. I realized that for a 100-word summary, "intelligence overhead" was a waste. This taught me that engineering decisions must always be filtered through the lens of unit economics, especially for "free" tools.

### 3. What you would build in week 2 if you had it
If I had another week, I would build **"One-Click Optimization."** Instead of just telling users they are overspending on Cursor or ChatGPT, I'd integrate with a browser extension that can automate the downgrade/cancellation process across SaaS dashboards. 

Additionally, I'd add a **"Bulk Seat Management"** view. For companies with 50+ seats, the biggest waste isn't the plan price, but "zombie seats" (people who haven't logged in for 30 days). Integrating with Slack or Okta to identify these users would make the audit significantly more "critical" for larger startups.

### 4. How you used AI tools
I used **Cursor** for rapid UI scaffolding and boilerplate (like the 800 lines of `globals.css` design tokens). I used **Claude 3.5 Sonnet** to help refactor the Audit Engine logic when it got too nested. 

**What I didn't trust:** I never trusted AI with the **pricing math**. I manually verified every single dollar amount in `PRICING_DATA.md` because an audit tool with incorrect math loses all credibility. 
**One specific error:** Cursor once suggested using `Math.round()` for the annual savings calculation, which resulted in a $1 rounding error that didn't match the sum of monthly savings. I caught this because I had a unit test that strictly checked `totalMonthlySavings * 12 === totalAnnualSavings`.

### 5. Self-rating (1–10)
- **Discipline (9):** I maintained a strict 7-day log and spread commits across the week to simulate a real shipping cycle.
- **Code Quality (8):** Used strict TypeScript and Zod schemas. Logic is decoupled from the UI for testability.
- **Design Sense (9):** Focused on a "SpendLens" white-premium aesthetic with smooth Framer Motion transitions.
- **Problem Solving (8):** Handled API failures with a robust circuit-breaker and template fallback system.
- **Entrepreneurial Thinking (10):** Spent significant time on the GTM and Economics docs to ensure this isn't just code, but a viable lead-gen asset for Credex.
