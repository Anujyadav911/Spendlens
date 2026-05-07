import { z } from "zod";
import { TOOLS } from "./pricing-data";

const toolIds = TOOLS.map((t) => t.id) as [string, ...string[]];

export const ToolEntrySchema = z.object({
  toolId: z.enum(toolIds),
  planId: z.string().min(1, "Please select a plan"),
  seats: z.coerce.number().min(1, "Minimum 1 seat").max(10000),
  monthlySpend: z.coerce.number().min(0).default(0),
});

export const AuditFormSchema = z.object({
  tools: z
    .array(ToolEntrySchema)
    .min(1, "Add at least one tool to audit")
    .max(20),
  teamSize: z.coerce.number().min(1, "Team size must be at least 1").max(100000),
  useCase: z.enum(["coding", "writing", "data", "research", "mixed"]),
});

export type AuditFormData = z.infer<typeof AuditFormSchema>;

export const LeadCaptureSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  companyName: z.string().optional(),
  role: z.string().optional(),
  teamSize: z.coerce.number().optional(),
  // Honeypot field — must be empty
  website: z.string().max(0, "Bot detected").optional(),
});

export type LeadCaptureData = z.infer<typeof LeadCaptureSchema>;
