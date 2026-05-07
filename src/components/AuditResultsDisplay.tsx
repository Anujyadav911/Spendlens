"use client";

import { useState } from "react";
import {
  AuditResult,
  AuditInput,
  ToolAuditResult,
} from "@/lib/audit-engine";
import { AuditSummary } from "@/lib/ai-summary";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Share2,
  Mail,
  ExternalLink,
  Info,
  Sparkles,
} from "lucide-react";
import LeadCaptureModal from "./LeadCaptureModal";

type Props = {
  result: AuditResult;
  input: AuditInput;
  auditId: string;
  summary: AuditSummary | null;
};

const SEVERITY_CONFIG = {
  critical: {
    badge: "badge-critical",
    label: "High savings",
    icon: <AlertCircle size={13} />,
    rowBg: "#fff9f9",
    borderColor: "#fecaca",
  },
  moderate: {
    badge: "badge-moderate",
    label: "Moderate savings",
    icon: <AlertTriangle size={13} />,
    rowBg: "#fffdf5",
    borderColor: "#fde68a",
  },
  minor: {
    badge: "badge-minor",
    label: "Minor savings",
    icon: <Info size={13} />,
    rowBg: "#f8fbff",
    borderColor: "#bfdbfe",
  },
  optimal: {
    badge: "badge-optimal",
    label: "Optimized",
    icon: <CheckCircle2 size={13} />,
    rowBg: "#f6fdf9",
    borderColor: "#a7f3d0",
  },
};

function getRecommendationText(r: ToolAuditResult): string {
  const rec = r.recommendation;
  if (rec.type === "optimal") return rec.reason;
  if (rec.type === "downgrade") return `Downgrade to a lower plan`;
  if (rec.type === "switch") return `Switch to a better-fit tool`;
  if (rec.type === "credits") return `Buy credits at a discount`;
  return "";
}

export default function AuditResultsDisplay({ result, input, auditId, summary }: Props) {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/audit/${auditId}`
      : `/audit/${auditId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="results-wrapper">
      {/* ─── Hero Savings Banner ─────────────────────────────────────── */}
      <div className="savings-hero">
        {result.isAlreadyOptimal ? (
          <div className="optimal-hero">
            <div className="optimal-icon">
              <CheckCircle2 size={28} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-heading" style={{ fontSize: "1.75rem" }}>
                You&apos;re spending well.
              </h1>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  marginTop: "0.375rem",
                  fontSize: "1rem",
                }}
              >
                Current spend:{" "}
                <strong>{formatCurrency(result.totalCurrentSpend)}/mo</strong>.
                No major optimizations found right now.
              </p>
            </div>
          </div>
        ) : (
          <div className="savings-hero-inner">
            <p className="text-label" style={{ color: "var(--color-text-muted)" }}>
              Potential savings identified
            </p>
            <div className="savings-numbers">
              <div>
                <div
                  className="savings-gradient"
                  style={{
                    fontSize: "clamp(2.5rem, 6vw, 4rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  {formatCurrency(result.totalMonthlySavings)}
                  <span style={{ fontSize: "1.5rem", fontWeight: 600 }}>/mo</span>
                </div>
                <div
                  style={{
                    fontSize: "1.125rem",
                    color: "var(--color-text-secondary)",
                    marginTop: "0.25rem",
                  }}
                >
                  {formatCurrency(result.totalAnnualSavings)}{" "}
                  <span style={{ color: "var(--color-text-muted)" }}>per year</span>
                </div>
              </div>
              <div className="current-vs">
                <div className="cv-item">
                  <span className="cv-label">Current</span>
                  <span className="cv-value">
                    {formatCurrency(result.totalCurrentSpend)}/mo
                  </span>
                </div>
                <ArrowRight size={16} style={{ color: "var(--color-text-muted)" }} />
                <div className="cv-item">
                  <span className="cv-label">After audit</span>
                  <span className="cv-value" style={{ color: "var(--color-success)" }}>
                    {formatCurrency(result.totalRecommendedSpend)}/mo
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── AI Summary ──────────────────────────────────────────────── */}
      {summary && (
        <div className="ai-summary-card card" style={{ padding: "1.25rem 1.5rem" }}>
          <div className="ai-summary-header">
            <Sparkles size={15} style={{ color: "var(--color-accent)" }} />
            <span className="text-label">AI Audit Summary</span>
            {summary.source === "template" && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  marginLeft: "auto",
                }}
              >
                (Generated from template)
              </span>
            )}
          </div>
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.9375rem",
              lineHeight: 1.7,
              color: "var(--color-text-secondary)",
            }}
          >
            {summary.text}
          </p>
        </div>
      )}

      {/* ─── Per-tool Breakdown ──────────────────────────────────────── */}
      <div style={{ marginTop: "1.5rem" }}>
        <h2 className="text-subheading" style={{ marginBottom: "0.875rem" }}>
          Tool breakdown
        </h2>
        <div className="tool-results-list">
          {result.toolResults.map((r) => {
            const config = SEVERITY_CONFIG[r.severity];
            return (
              <div
                key={r.toolId}
                className="tool-result-card"
                style={{
                  background: config.rowBg,
                  borderColor: config.borderColor,
                }}
              >
                <div className="tool-result-top">
                  <div className="tool-result-name">
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                      {r.toolName}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {r.currentPlanName}
                    </span>
                  </div>
                  <div className="tool-result-right">
                    {r.monthlySavings > 0 && (
                      <span className="savings-pill">
                        Save {formatCurrency(r.monthlySavings)}/mo
                      </span>
                    )}
                    <span className={`badge ${config.badge}`}>
                      {config.icon}
                      {config.label}
                    </span>
                  </div>
                </div>

                <div className="tool-result-numbers">
                  <div className="tn-item">
                    <span className="tn-label">Current</span>
                    <span className="tn-value">
                      {formatCurrency(r.currentMonthlySpend)}/mo
                    </span>
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--color-text-muted)" }} />
                  <div className="tn-item">
                    <span className="tn-label">Recommended</span>
                    <span
                      className="tn-value"
                      style={{
                        color:
                          r.monthlySavings > 0
                            ? "var(--color-success)"
                            : "var(--color-text-primary)",
                      }}
                    >
                      {formatCurrency(r.recommendedMonthlySpend)}/mo
                    </span>
                  </div>
                  {r.annualSavings > 0 && (
                    <>
                      <div
                        style={{
                          width: 1,
                          height: 20,
                          background: "var(--color-border)",
                        }}
                      />
                      <div className="tn-item">
                        <span className="tn-label">Annual savings</span>
                        <span
                          className="tn-value"
                          style={{ color: "var(--color-success)" }}
                        >
                          {formatCurrency(r.annualSavings)}/yr
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <p
                  style={{
                    marginTop: "0.75rem",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {r.recommendation.reason}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Credex CTA (high-value) ─────────────────────────────────── */}
      {result.showCredex && (
        <div className="credex-cta">
          <div className="credex-cta-inner">
            <div className="credex-cta-text">
              <div className="credex-badge">Unlock more savings</div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginTop: "0.5rem",
                  color: "#fff",
                }}
              >
                Get the same tools at{" "}
                <span style={{ color: "#c4b5fd" }}>25–40% off retail</span>
              </h3>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "rgba(255,255,255,0.75)",
                  marginTop: "0.5rem",
                  lineHeight: 1.6,
                }}
              >
                Credex sources unused AI credits from companies that
                overforecast. Real discounts on Cursor, Claude, ChatGPT, and
                more — applied on top of the optimizations above.
              </p>
            </div>
            <div className="credex-cta-actions">
              <a
                href="https://credex.rocks"
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  background: "#fff",
                  color: "#6d28d9",
                  padding: "0.875rem 1.75rem",
                  fontWeight: 700,
                  borderRadius: "var(--radius-md)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  textDecoration: "none",
                }}
                id="credex-cta-btn"
              >
                Book a free consultation
                <ExternalLink size={15} />
              </a>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.55)",
                  marginTop: "0.5rem",
                  textAlign: "center",
                }}
              >
                No commitment. 15-minute call.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Lead Capture + Share ─────────────────────────────────────── */}
      <div className="actions-row">
        <button
          onClick={() => setShowLeadModal(true)}
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: "center" }}
          id="email-report-btn"
        >
          <Mail size={16} />
          Email me this report
        </button>
        <button
          onClick={handleCopyLink}
          className="btn btn-secondary"
          style={{ flex: 1, justifyContent: "center" }}
          id="share-link-btn"
        >
          <Share2 size={16} />
          {copied ? "Copied!" : "Copy shareable link"}
        </button>
      </div>

      {/* ─── Already optimal: notify CTA ─────────────────────────────── */}
      {result.isAlreadyOptimal && (
        <div
          className="card"
          style={{
            padding: "1.5rem",
            textAlign: "center",
            marginTop: "1rem",
            background: "var(--color-surface)",
          }}
        >
          <p
            style={{
              fontWeight: 600,
              fontSize: "1rem",
              color: "var(--color-text-primary)",
            }}
          >
            Get notified when new optimizations apply to your stack
          </p>
          <p
            className="text-body"
            style={{ fontSize: "0.875rem", marginTop: "0.375rem" }}
          >
            We monitor pricing changes and new tools weekly.
          </p>
          <button
            onClick={() => setShowLeadModal(true)}
            className="btn btn-primary"
            style={{ marginTop: "1rem" }}
            id="notify-btn"
          >
            <Mail size={16} />
            Notify me
          </button>
        </div>
      )}

      {showLeadModal && (
        <LeadCaptureModal
          auditId={auditId}
          totalMonthlySavings={result.totalMonthlySavings}
          onClose={() => setShowLeadModal(false)}
        />
      )}

      <style jsx>{`
        .results-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .savings-hero {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 2rem 2.25rem;
        }

        .optimal-hero {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .optimal-icon {
          width: 56px;
          height: 56px;
          background: var(--color-success-light);
          color: var(--color-success);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .savings-hero-inner {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .savings-numbers {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 2rem;
        }

        .current-vs {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          align-self: flex-end;
        }

        .cv-item {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .cv-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .cv-value {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .ai-summary-card {
          border-left: 3px solid var(--color-accent);
        }

        .ai-summary-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tool-results-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .tool-result-card {
          border: 1px solid;
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }

        .tool-result-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tool-result-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tool-result-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .savings-pill {
          background: var(--color-success-light);
          color: var(--color-success);
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.25rem 0.625rem;
          border-radius: 999px;
        }

        .tool-result-numbers {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-top: 0.875rem;
          flex-wrap: wrap;
        }

        .tn-item {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .tn-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .tn-value {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .credex-cta {
          border-radius: var(--radius-xl);
          background: linear-gradient(135deg, #6d28d9 0%, #4338ca 100%);
          padding: 2rem;
          margin-top: 0.5rem;
        }

        .credex-cta-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .credex-cta-text {
          flex: 1;
          min-width: 260px;
        }

        .credex-badge {
          display: inline-flex;
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
        }

        .credex-cta-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .actions-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 0.5rem;
        }

        @media (max-width: 640px) {
          .savings-hero {
            padding: 1.5rem;
          }

          .credex-cta-inner {
            flex-direction: column;
          }

          .actions-row {
            flex-direction: column;
          }

          .actions-row > button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
