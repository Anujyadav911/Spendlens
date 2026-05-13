"use client";

import { useState } from "react";
import AuditForm from "@/components/AuditForm";
import PricingDrawer from "@/components/PricingDrawer";
import { Zap, Shield, TrendingDown, ArrowDown, Signal } from "lucide-react";

export default function HomePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <main>
      {/* ─── Nav ──────────────────────────────────────────────────────── */}
      <nav className="nav">
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="nav-logo">
            <div className="logo-mark">
              <Zap size={16} fill="currentColor" />
            </div>
            <span className="logo-text">SpendLens</span>
          </div>
          <div className="nav-right">
            <button 
              onClick={() => setDrawerOpen(true)}
              className="nav-drawer-btn"
            >
              <Signal size={14} className="signal-icon" />
              Live Market Rates
            </button>
            <span className="nav-badge">Free forever</span>
          </div>
        </div>
      </nav>

      <PricingDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onSelectTool={(tool) => {
        window.dispatchEvent(new CustomEvent('add-tool', { detail: tool }));
        setDrawerOpen(false);
      }} />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero section">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-tag animate-fade-up">
              <Shield size={13} strokeWidth={2.5} />
              No account. No credit card. Instant results.
            </div>

            <h1 className="text-display animate-fade-up" style={{ animationDelay: "60ms", marginTop: "1.25rem" }}>
              Are you overpaying for{" "}
              <span className="savings-gradient">AI tools?</span>
            </h1>

            <p
              className="animate-fade-up"
              style={{
                animationDelay: "120ms",
                marginTop: "1.25rem",
                fontSize: "1.125rem",
                lineHeight: "1.7",
                color: "var(--color-text-secondary)",
                maxWidth: "560px",
              }}
            >
              Most startups sigh and pay their AI bill. SpendLens audits every
              tool, every plan, every seat — and shows you exactly where you&apos;re
              leaving money on the table.
            </p>

            <div
              className="hero-stats animate-fade-up"
              style={{ animationDelay: "180ms", marginTop: "2rem" }}
            >
              <div className="stat">
                <div className="stat-value">$847</div>
                <div className="stat-label">Avg. monthly savings found</div>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <div className="stat-value">60s</div>
                <div className="stat-label">Time to complete audit</div>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <div className="stat-value">8 tools</div>
                <div className="stat-label">Supported at launch</div>
              </div>
            </div>

            <div
              className="hero-cta-arrow animate-fade-up"
              style={{ animationDelay: "240ms", marginTop: "2.5rem" }}
            >
              <ArrowDown size={18} style={{ color: "var(--color-accent)" }} />
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Fill in your tools below
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Form ─────────────────────────────────────────────────────── */}
      <section style={{ paddingBottom: "5rem" }}>
        <div className="container" style={{ maxWidth: "780px" }}>
          <AuditForm />
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          padding: "4rem 0",
        }}
      >
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <p className="text-label">How it works</p>
            <h2
              className="text-heading"
              style={{ marginTop: "0.5rem", fontSize: "1.75rem" }}
            >
              Three inputs. Instant audit.
            </h2>
          </div>

          <div className="how-grid">
            {[
              {
                num: "01",
                icon: <TrendingDown size={18} />,
                title: "Enter your tools",
                desc: "Select which AI tools you use, which plan, and how many seats. Takes 60 seconds.",
              },
              {
                num: "02",
                icon: <Zap size={18} />,
                title: "Get your audit",
                desc: "Our engine checks every tool against current pricing, usage-fit, and cheaper alternatives.",
              },
              {
                num: "03",
                icon: <Shield size={18} />,
                title: "Save and share",
                desc: "See your savings breakdown. Share your report. Email it to yourself.",
              },
            ].map((step) => (
              <div key={step.num} className="how-card card" style={{ padding: "1.5rem" }}>
                <div className="how-num">{step.num}</div>
                <div
                  className="how-icon"
                  style={{
                    color: "var(--color-accent)",
                    marginTop: "1rem",
                  }}
                >
                  {step.icon}
                </div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    marginTop: "0.625rem",
                  }}
                >
                  {step.title}
                </h3>
                <p className="text-body" style={{ marginTop: "0.375rem", fontSize: "0.875rem" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "1.5rem 0",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div className="nav-logo">
            <div className="logo-mark">
              <Zap size={13} fill="currentColor" />
            </div>
            <span className="logo-text" style={{ fontSize: "0.875rem" }}>
              SpendLens
            </span>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            A free tool by{" "}
            <a
              href="https://credex.rocks"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-accent)", textDecoration: "none" }}
            >
              Credex
            </a>
            {" "}· Pricing verified {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </footer>

      <style jsx>{`
        .nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-border);
          padding: 0.875rem 0;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-mark {
          width: 28px;
          height: 28px;
          background: var(--color-accent);
          color: #fff;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text-primary);
          letter-spacing: -0.02em;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-drawer-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }

        .nav-drawer-btn:hover {
          color: var(--color-accent);
        }

        .signal-icon {
          color: var(--color-accent);
        }

        .nav-badge {
          background: var(--color-success-light);
          color: var(--color-success);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.625rem;
          border-radius: 999px;
        }

        .hero {
          padding: 5rem 0 2rem;
        }

        .hero-inner {
          max-width: 680px;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          background: var(--color-accent-light);
          color: var(--color-accent);
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.375rem 0.75rem;
          border-radius: 999px;
        }

        .hero-stats {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 1.25rem 1.5rem;
          width: fit-content;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .stat {
          text-align: center;
          min-width: 100px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-primary);
          letter-spacing: -0.03em;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-top: 0.125rem;
          font-weight: 500;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: var(--color-border);
          flex-shrink: 0;
        }

        .hero-cta-arrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .how-num {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-accent);
          opacity: 0.6;
        }

        @media (max-width: 768px) {
          .hero-stats {
            width: 100%;
          }

          .stat-divider {
            display: none;
          }

          .how-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
