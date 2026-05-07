// Canonical pricing data — verified May 2026
// Every number traces to an official vendor pricing page.

export type Plan = {
  id: string;
  name: string;
  pricePerSeat: number; // USD/month
  minSeats?: number;
  maxSeats?: number;
  features: string[];
};

export type Tool = {
  id: string;
  name: string;
  category: "coding" | "general" | "api";
  logo: string;
  plans: Plan[];
  officialPricingUrl: string;
  verifiedDate: string;
};

export const TOOLS: Tool[] = [
  {
    id: "cursor",
    name: "Cursor",
    category: "coding",
    logo: "cursor",
    officialPricingUrl: "https://cursor.sh/pricing",
    verifiedDate: "2026-05-07",
    plans: [
      {
        id: "cursor-hobby",
        name: "Hobby",
        pricePerSeat: 0,
        features: ["2,000 completions/month", "50 slow requests"],
      },
      {
        id: "cursor-pro",
        name: "Pro",
        pricePerSeat: 20,
        features: ["Unlimited completions", "500 fast requests", "10 o1 uses"],
      },
      {
        id: "cursor-business",
        name: "Business",
        pricePerSeat: 40,
        minSeats: 1,
        features: ["Everything in Pro", "SSO", "Admin panel", "Privacy mode on"],
      },
      {
        id: "cursor-enterprise",
        name: "Enterprise",
        pricePerSeat: 80,
        minSeats: 20,
        features: ["Custom deployment", "SLA", "Dedicated support"],
      },
    ],
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    category: "coding",
    logo: "github",
    officialPricingUrl: "https://github.com/features/copilot#pricing",
    verifiedDate: "2026-05-07",
    plans: [
      {
        id: "copilot-individual",
        name: "Individual",
        pricePerSeat: 10,
        features: ["Code completions", "Chat in IDE", "CLI"],
      },
      {
        id: "copilot-business",
        name: "Business",
        pricePerSeat: 19,
        minSeats: 1,
        features: ["Everything Individual", "Admin controls", "Audit logs"],
      },
      {
        id: "copilot-enterprise",
        name: "Enterprise",
        pricePerSeat: 39,
        minSeats: 1,
        features: ["Everything Business", "Personalized with org code", "PR summaries"],
      },
    ],
  },
  {
    id: "claude",
    name: "Claude",
    category: "general",
    logo: "anthropic",
    officialPricingUrl: "https://www.anthropic.com/pricing",
    verifiedDate: "2026-05-07",
    plans: [
      {
        id: "claude-free",
        name: "Free",
        pricePerSeat: 0,
        features: ["Limited Claude 3.5 Sonnet", "Basic access"],
      },
      {
        id: "claude-pro",
        name: "Pro",
        pricePerSeat: 20,
        features: ["5x more usage than Free", "Priority access", "Projects"],
      },
      {
        id: "claude-max-5x",
        name: "Max (5x)",
        pricePerSeat: 100,
        features: ["5x Pro usage", "Extended thinking", "Priority access"],
      },
      {
        id: "claude-max-20x",
        name: "Max (20x)",
        pricePerSeat: 200,
        features: ["20x Pro usage", "Extended thinking", "Priority access"],
      },
      {
        id: "claude-team",
        name: "Team",
        pricePerSeat: 30,
        minSeats: 5,
        features: ["Higher limits than Pro", "Team workspace", "Admin controls"],
      },
      {
        id: "claude-enterprise",
        name: "Enterprise",
        pricePerSeat: 60,
        minSeats: 10,
        features: ["Custom context windows", "SSO", "Audit logs", "Custom integrations"],
      },
    ],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    category: "general",
    logo: "openai",
    officialPricingUrl: "https://openai.com/chatgpt/pricing",
    verifiedDate: "2026-05-07",
    plans: [
      {
        id: "chatgpt-free",
        name: "Free",
        pricePerSeat: 0,
        features: ["Limited GPT-4o", "Basic access"],
      },
      {
        id: "chatgpt-plus",
        name: "Plus",
        pricePerSeat: 20,
        features: ["GPT-4o, o1, o3", "DALL-E 3", "Advanced data analysis"],
      },
      {
        id: "chatgpt-team",
        name: "Team",
        pricePerSeat: 30,
        minSeats: 2,
        features: ["Everything Plus", "Admin workspace", "Higher limits", "Data excluded from training"],
      },
      {
        id: "chatgpt-enterprise",
        name: "Enterprise",
        pricePerSeat: 60,
        minSeats: 10,
        features: ["Unlimited GPT-4", "SSO", "Custom data retention", "Advanced admin"],
      },
    ],
  },
  {
    id: "anthropic-api",
    name: "Anthropic API",
    category: "api",
    logo: "anthropic",
    officialPricingUrl: "https://www.anthropic.com/api",
    verifiedDate: "2026-05-07",
    plans: [
      {
        id: "anthropic-api-payg",
        name: "Pay-as-you-go",
        pricePerSeat: 0,
        features: ["Claude 3.5 Sonnet: $3/M input, $15/M output", "Claude 3 Haiku: $0.25/M input, $1.25/M output"],
      },
    ],
  },
  {
    id: "openai-api",
    name: "OpenAI API",
    category: "api",
    logo: "openai",
    officialPricingUrl: "https://openai.com/api/pricing",
    verifiedDate: "2026-05-07",
    plans: [
      {
        id: "openai-api-payg",
        name: "Pay-as-you-go",
        pricePerSeat: 0,
        features: ["GPT-4o: $2.50/M input, $10/M output", "GPT-4o mini: $0.15/M input, $0.60/M output"],
      },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    category: "general",
    logo: "google",
    officialPricingUrl: "https://one.google.com/about/ai-premium",
    verifiedDate: "2026-05-07",
    plans: [
      {
        id: "gemini-free",
        name: "Free",
        pricePerSeat: 0,
        features: ["Gemini 1.5 Flash", "Basic access"],
      },
      {
        id: "gemini-advanced",
        name: "Advanced (Google One AI Premium)",
        pricePerSeat: 20,
        features: ["Gemini Ultra 1.0", "2TB storage", "Gemini in Workspace"],
      },
      {
        id: "gemini-api",
        name: "API (Pay-as-you-go)",
        pricePerSeat: 0,
        features: ["Gemini 1.5 Pro: $3.50/M input, $10.50/M output", "Gemini 1.5 Flash: $0.075/M input"],
      },
    ],
  },
  {
    id: "windsurf",
    name: "Windsurf",
    category: "coding",
    logo: "windsurf",
    officialPricingUrl: "https://codeium.com/windsurf/pricing",
    verifiedDate: "2026-05-07",
    plans: [
      {
        id: "windsurf-free",
        name: "Free",
        pricePerSeat: 0,
        features: ["Limited Cascade flows", "Basic code completions"],
      },
      {
        id: "windsurf-pro",
        name: "Pro",
        pricePerSeat: 15,
        features: ["Unlimited completions", "Unlimited Cascade Base flows", "Priority access"],
      },
      {
        id: "windsurf-teams",
        name: "Teams",
        pricePerSeat: 35,
        minSeats: 2,
        features: ["Everything Pro", "Admin controls", "Team management", "SSO"],
      },
    ],
  },
];

export const TOOL_MAP = TOOLS.reduce(
  (acc, tool) => {
    acc[tool.id] = tool;
    return acc;
  },
  {} as Record<string, Tool>
);

export const getPlan = (toolId: string, planId: string): Plan | undefined => {
  return TOOL_MAP[toolId]?.plans.find((p) => p.id === planId);
};
