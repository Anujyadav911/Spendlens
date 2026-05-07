# User Interviews

### Interview 1: J.D. — CTO, Stealth AI Startup (5 employees)
- **Quote:** "I don't even know if we're on Cursor Business or Pro. I just put it on the company card and forgot."
- **Quote:** "Wait, I'm paying for Claude Pro AND my API bill is $400? I didn't realize they didn't overlap."
- **Surprising Insight:** He didn't care about a $20/mo saving, but he *did* care about "Plan Duplication." The idea that he was paying for the same model twice was offensive to his engineering efficiency.
- **Design Change:** I added the "Plan Duplication" high-priority rule to the audit engine (Rule #0).

### Interview 2: Sarah — Ops Manager, Growth-Stage Fintech (45 employees)
- **Quote:** "My biggest headache is Cursor Enterprise. We need SSO, but it's like $80/seat. Is there anything else?"
- **Quote:** "I want a PDF I can send to the CFO to justify why we are moving to Windsurf or Copilot Business."
- **Surprising Insight:** She viewed AI spend as a "risk" factor. If the tool is too expensive, the CFO might cut AI access entirely.
- **Design Change:** I prioritized "Downgrade" recommendations for Enterprise plans where SSO is the only delta, saving them thousands.

### Interview 3: Mike — Solo Indie Hacker / Freelancer
- **Quote:** "I use ChatGPT Plus for writing and Cursor Pro for coding. It's $40/mo. It's fine."
- **Quote:** "If I could save $15 by switching to Windsurf, I'd probably do it just for the principle of it."
- **Surprising Insight:** For solo users, "Switch" recommendations feel more like "New Tool Discovery." They aren't just looking for savings; they are looking for better tools.
- **Design Change:** I made the "Switch" recommendations more descriptive about *why* the alternative tool might be better for their specific use case (e.g., "Windsurf's Cascade flows vs Cursor Composer").
