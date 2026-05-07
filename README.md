# SpendLens: AI Spend Audit Tool

SpendLens is a high-converting lead-gen tool for **Credex** that helps startups audit their AI tool spend, surface hidden costs, and get personalized, finance-defensible switch recommendations.

![SpendLens Demo](https://placehold.co/1200x600/white/000?text=SpendLens+Audit+Results+Page+Mockup)

## 🚀 Quick Start

### 1. Install & Run Locally
```bash
# Clone and enter directory
cd credex-audit

# Install dependencies
npm install

# Run dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the tool.

### 2. Run Tests
```bash
npm test
```

## 🛠 Decisions & Trade-offs

1.  **Next.js 14 (App Router):** Chosen for fast server-side rendering of audit results and built-in API routes. The App Router makes dynamic Open Graph image generation much simpler for the "viral loop" requirement.
2.  **Pure TypeScript Audit Engine:** I decided *not* to use AI for the audit math. Hardcoded rules are finance-defensible and predictable. AI is reserved only for the personalized summary paragraph where creativity adds value.
3.  **Supabase for Persistence:** Used Supabase (PostgreSQL) to store audits and leads. This ensures shareable URLs work across sessions and provides a real backend for Credex to follow up on high-savings cases.
4.  **Honeypot Abuse Protection:** Opted for a "Honeypot" field instead of a CAPTCHA. At this stage, frictionless UX is more important for lead conversion, and a honeypot catches 95% of basic bots.
5.  **Gemini Flash over Claude Haiku:** While Claude is preferred, I used Gemini Flash for the summary generation as it offered faster response times and a generous free tier during development, while still maintaining high quality for 100-word summaries.

## 🔗 Live Deployed URL
[https://spendlens-audit.vercel.app](https://spendlens-audit.vercel.app) (Replace with your actual URL)

---
*Built for the Credex Round 1 Internship Assignment.*
