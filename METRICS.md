# Metrics & Measurement

## ⭐️ North Star Metric
**Qualified Leads Generated (QLG):** The number of unique audits completed that show > $500/mo in potential savings AND capture a valid corporate email.
- **Why?** This is the only metric that directly correlates with Credex's revenue goal (selling discounted credits to high-spend users).

## 📈 Input Metrics
1.  **Audit Completion Rate:** (Audits Completed / Landing Page Visits). Measures if the form UX is frictionless.
2.  **Viral Coefficient (k):** (Visits from Shareable URLs / Total Audits Completed). Measures if the "Shareable Link" feature is actually driving organic growth.
3.  **High-Savings Ratio:** (Audits with > $500 savings / Total Audits). Measures if we are reaching the "right" high-spend startups or just hobbyists.

## 🛠 Instrumentation Plan (Phase 1)
- **Vercel Web Analytics:** For general traffic and conversion funnels.
- **Supabase Logs:** To track which recommendations (Downgrade vs. Switch vs. Credits) are triggered most often.
- **Custom Event Tracking:** "Share Link Clicked" and "Credex Consultation Clicked."

## 🛑 The Pivot Decision
We will pivot or kill the tool if:
- **Qualified Lead Conversion is < 2%** after 500 completed audits. 
- **The "High-Savings Ratio" is < 10%.** If everyone using the tool is already optimal or only saving $10/mo, the tool is a poor lead-gen asset for Credex's specific product (discounted credits).
