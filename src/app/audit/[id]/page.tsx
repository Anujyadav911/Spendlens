"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuditResult, AuditInput } from "@/lib/audit-engine";
import { AuditSummary, generateAISummary } from "@/lib/ai-summary";
import AuditResultsDisplay from "@/components/AuditResultsDisplay";
import { Zap, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AuditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<{
    input: AuditInput;
    result: AuditResult;
  } | null>(null);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Try sessionStorage first (fresh audit)
    const cached = sessionStorage.getItem(`audit-${id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setData(parsed);
        setLoading(false);
        // Generate AI summary in background
        generateAISummary(parsed.input, parsed.result, id).then(setSummary);
        return;
      } catch {}
    }

    // Fallback: fetch from API (shareable URL case)
    fetch(`/api/audits?id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Audit not found");
        return res.json();
      })
      .then((result: unknown) => {
        // For public shareable URLs, we only have the result (no input PII)
        // Build a minimal input from the result for the display
        const r = result as AuditResult & { teamSize?: number; useCase?: string };
        const minimalInput: AuditInput = {
          tools: r.toolResults.map((tr: { toolId: string }) => ({
            toolId: tr.toolId,
            planId: "",
            seats: 1,
            monthlySpend: 0,
          })),
          teamSize: r.teamSize ?? 1,
          useCase: (r.useCase as UseCase) ?? "mixed",
        };
        setData({ input: minimalInput, result: r });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 size={32} className="spin-icon" />
        <p>Loading your audit…</p>
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            color: var(--color-text-muted);
          }
          .spin-icon {
            animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="error-screen">
        <h1>Audit not found</h1>
        <p>This link may have expired or the audit doesn&apos;t exist.</p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
          Run a new audit
        </Link>
        <style jsx>{`
          .error-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
            gap: 0.75rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <main>
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--color-border)",
          padding: "0.875rem 0",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: "var(--color-accent)",
                color: "#fff",
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={16} fill="currentColor" />
            </div>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              SpendLens
            </span>
          </Link>
          <button
            onClick={() => router.push("/")}
            className="btn btn-ghost btn-sm"
          >
            <ArrowLeft size={15} />
            New audit
          </button>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: "780px", padding: "2.5rem 1.5rem 5rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <p className="text-label">Your AI Spend Audit</p>
          <h1 className="text-heading" style={{ marginTop: "0.25rem" }}>
            Here&apos;s where your money is going
          </h1>
        </div>

        <AuditResultsDisplay
          result={data.result}
          input={data.input}
          auditId={id}
          summary={summary}
        />
      </div>
    </main>
  );
}
