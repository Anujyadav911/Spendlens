"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LeadCaptureSchema, LeadCaptureData } from "@/lib/schemas";
import { X, Mail, CheckCircle2 } from "lucide-react";

type Props = {
  auditId: string;
  totalMonthlySavings: number;
  onClose: () => void;
};

export default function LeadCaptureModal({ auditId, totalMonthlySavings, onClose }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadCaptureData>({
    resolver: zodResolver(LeadCaptureSchema) as any,
  });

  const onSubmit = async (data: LeadCaptureData) => {
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, auditId, totalMonthlySavings }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card card">
        <button
          className="modal-close btn btn-ghost btn-sm"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className="modal-success">
            <div className="success-icon">
              <CheckCircle2 size={32} strokeWidth={2} />
            </div>
            <h2 id="modal-title" className="text-heading" style={{ fontSize: "1.375rem", marginTop: "1rem" }}>
              Report sent!
            </h2>
            <p className="text-body" style={{ marginTop: "0.5rem" }}>
              Check your inbox for your audit summary.{" "}
              {totalMonthlySavings > 500 &&
                "Given your savings potential, our team may reach out about Credex credits."}
            </p>
            <button
              onClick={onClose}
              className="btn btn-primary"
              style={{ marginTop: "1.5rem", width: "100%" }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <div className="modal-icon">
                <Mail size={18} />
              </div>
              <div>
                <h2 id="modal-title" className="text-subheading">
                  Get your audit report
                </h2>
                <p className="text-body" style={{ fontSize: "0.875rem", marginTop: "0.125rem" }}>
                  We&apos;ll email you a copy of this report. No spam, ever.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {/* Honeypot — hidden from real users */}
              <div style={{ display: "none" }} aria-hidden="true">
                <input
                  type="text"
                  {...register("website")}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lead-email">
                  Work email <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  id="lead-email"
                  type="email"
                  {...register("email")}
                  className="form-input"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
                {errors.email && (
                  <span className="form-error">{errors.email.message}</span>
                )}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="lead-company">
                    Company name{" "}
                    <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    id="lead-company"
                    type="text"
                    {...register("companyName")}
                    className="form-input"
                    placeholder="Acme Inc"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lead-role">
                    Your role{" "}
                    <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    id="lead-role"
                    type="text"
                    {...register("role")}
                    className="form-input"
                    placeholder="e.g. CTO, EM"
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    background: "var(--color-danger-light)",
                    color: "var(--color-danger)",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.875rem",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Send my report
                  </>
                )}
              </button>

              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  textAlign: "center",
                }}
              >
                Your email is only used to send this report. We don&apos;t sell or share it.
              </p>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        .modal-card {
          position: relative;
          width: 100%;
          max-width: 460px;
          padding: 2rem;
          animation: fadeUp 0.25s ease;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
        }

        .modal-icon {
          width: 40px;
          height: 40px;
          background: var(--color-accent-light);
          color: var(--color-accent);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .modal-success {
          text-align: center;
          padding: 0.5rem 0;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          background: var(--color-success-light);
          color: var(--color-success);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
