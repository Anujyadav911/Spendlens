"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuditFormSchema, AuditFormData } from "@/lib/schemas";
import { TOOLS } from "@/lib/pricing-data";
import { runAudit } from "@/lib/audit-engine";
import { Plus, Trash2, Zap, ArrowRight, Info } from "lucide-react";

const USE_CASES = [
  { value: "coding", label: "Software development / coding" },
  { value: "writing", label: "Writing & content creation" },
  { value: "data", label: "Data analysis & research" },
  { value: "research", label: "Deep research & analysis" },
  { value: "mixed", label: "Mixed / General productivity" },
];

const STORAGE_KEY = "spendlens-form-state";

export default function AuditForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AuditFormData>({
    resolver: zodResolver(AuditFormSchema) as any,
    defaultValues: {
      tools: [{ toolId: "cursor", planId: "cursor-pro", seats: 3, monthlySpend: 0 }],
      teamSize: 5,
      useCase: "coding",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "tools" });

  // Persist form state
  const formValues = watch();
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formValues));
    } catch {}
  }, [formValues]);

  // Restore form state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        reset(parsed);
      }
    } catch {}
  }, [reset]);

  // Listen for Live Market Rates drawer selection
  useEffect(() => {
    const handleAddTool = (e: any) => {
      const tool = e.detail;
      // Find matching tool in our static registry
      const existingTool = TOOLS.find(t => t.id === tool.id || t.name === tool.display_name);
      
      if (existingTool) {
        append({ 
          toolId: existingTool.id, 
          planId: existingTool.plans[0].id, 
          seats: 1, 
          monthlySpend: 0 
        });
        
        // Scroll to the bottom of the tools list
        setTimeout(() => {
          document.getElementById('run-audit-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } else {
        alert(`Tool selected: ${tool.display_name}. (Currently only full SaaS plans can be added to the audit calculator).`);
      }
    };
    
    window.addEventListener("add-tool", handleAddTool);
    return () => window.removeEventListener("add-tool", handleAddTool);
  }, [append]);

  const selectedToolIds = watch("tools").map((t) => t.toolId);

  const getAvailablePlans = useCallback(
    (toolId: string) => TOOLS.find((t) => t.id === toolId)?.plans ?? [],
    []
  );

  const onSubmit = async (data: AuditFormData) => {
    setIsSubmitting(true);
    try {
      const result = runAudit({
        tools: data.tools,
        teamSize: data.teamSize,
        useCase: data.useCase,
      });

      // Save audit to get shareable ID
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditInput: data, auditResult: result }),
      });

      if (!res.ok) {
        throw new Error("Failed to save audit to database");
      }

      const { id } = await res.json();

      // Store full result in sessionStorage for the results page
      sessionStorage.setItem(
        `audit-${id}`,
        JSON.stringify({ input: data, result })
      );

      router.push(`/audit/${id}`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert("Failed to save audit. Please check your database connection or API keys.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="audit-form" noValidate>
      {/* ─── Team Context ─────────────────────────────────────────────── */}
      <section className="form-section card" style={{ padding: "1.75rem" }}>
        <div className="form-section-header">
          <div className="form-section-icon">
            <Info size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-subheading">Your team context</h2>
            <p className="text-body" style={{ marginTop: "0.125rem", fontSize: "0.875rem" }}>
              Helps us calibrate which plans are overkill or insufficient.
            </p>
          </div>
        </div>
        <div className="form-grid-2" style={{ marginTop: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="teamSize">
              Total team size
            </label>
            <input
              id="teamSize"
              type="number"
              min={1}
              {...register("teamSize")}
              className="form-input"
              placeholder="e.g. 8"
            />
            {errors.teamSize && (
              <span className="form-error">{errors.teamSize.message}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="useCase">
              Primary use case
            </label>
            <select id="useCase" {...register("useCase")} className="form-select">
              {USE_CASES.map((uc) => (
                <option key={uc.value} value={uc.value}>
                  {uc.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ─── Tools ────────────────────────────────────────────────────── */}
      <section style={{ marginTop: "1.25rem" }}>
        <div className="tools-header">
          <div>
            <h2 className="text-subheading">Your AI tools</h2>
            <p className="text-body" style={{ fontSize: "0.875rem", marginTop: "0.125rem" }}>
              Add every tool you pay for. Monthly spend is optional — we&apos;ll compute from plan price × seats if left blank.
            </p>
          </div>
        </div>

        <div className="tools-list stagger" style={{ marginTop: "0.875rem" }}>
          {fields.map((field, index) => {
            const toolId = watch(`tools.${index}.toolId`);
            const plans = getAvailablePlans(toolId);
            const selectedPlanId = watch(`tools.${index}.planId`);
            const selectedPlan = plans.find((p) => p.id === selectedPlanId);

            return (
              <div key={field.id} className="tool-row card animate-fade-up" style={{ padding: "1.25rem" }}>
                <div className="tool-row-top">
                  <div className="form-group" style={{ flex: "1 1 180px" }}>
                    <label className="form-label" htmlFor={`tools.${index}.toolId`}>
                      Tool
                    </label>
                    <select
                      id={`tools.${index}.toolId`}
                      {...register(`tools.${index}.toolId`)}
                      className="form-select"
                    >
                      {TOOLS.map((tool) => (
                        <option key={tool.id} value={tool.id}>
                          {tool.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: "1 1 200px" }}>
                    <label className="form-label" htmlFor={`tools.${index}.planId`}>
                      Plan
                    </label>
                    <select
                      id={`tools.${index}.planId`}
                      {...register(`tools.${index}.planId`)}
                      className="form-select"
                    >
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                          {plan.pricePerSeat > 0
                            ? ` — $${plan.pricePerSeat}/seat/mo`
                            : plan.pricePerSeat === 0
                              ? " — Free / PAYG"
                              : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: "0 0 120px" }}>
                    <label className="form-label" htmlFor={`tools.${index}.seats`}>
                      Seats
                    </label>
                    <input
                      id={`tools.${index}.seats`}
                      type="number"
                      min={1}
                      {...register(`tools.${index}.seats`)}
                      className="form-input"
                      placeholder="1"
                    />
                  </div>

                  <div className="form-group" style={{ flex: "0 0 150px" }}>
                    <label className="form-label" htmlFor={`tools.${index}.monthlySpend`}>
                      Actual $/mo{" "}
                      <span
                        title="Override if your actual bill differs from plan × seats"
                        style={{ cursor: "help", color: "var(--color-text-muted)" }}
                      >
                        (optional)
                      </span>
                    </label>
                    <input
                      id={`tools.${index}.monthlySpend`}
                      type="number"
                      min={0}
                      step={0.01}
                      {...register(`tools.${index}.monthlySpend`)}
                      className="form-input"
                      placeholder={
                        selectedPlan?.pricePerSeat != null
                          ? `$${selectedPlan.pricePerSeat * (watch(`tools.${index}.seats`) || 1)}`
                          : "0"
                      }
                    />
                  </div>

                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="btn btn-danger btn-sm"
                      style={{ marginTop: "1.5rem", flexShrink: 0 }}
                      aria-label={`Remove ${toolId}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {selectedPlan && selectedPlan.features.length > 0 && (
                  <div className="plan-hint">
                    <span className="text-label" style={{ fontSize: "0.75rem" }}>
                      Includes:{" "}
                    </span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {selectedPlan.features.slice(0, 3).join(" · ")}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {errors.tools?.root && (
          <p className="form-error" style={{ marginTop: "0.5rem" }}>
            {errors.tools.root.message}
          </p>
        )}

        {fields.length < 8 && (
          <button
            type="button"
            onClick={() =>
              append({ toolId: "chatgpt", planId: "chatgpt-plus", seats: 1, monthlySpend: 0 })
            }
            className="btn btn-secondary"
            style={{ marginTop: "1rem", width: "100%" }}
          >
            <Plus size={16} />
            Add another tool
          </button>
        )}
      </section>

      {/* ─── Submit ───────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary btn-lg"
        style={{ marginTop: "1.75rem", width: "100%" }}
        id="run-audit-btn"
      >
        {isSubmitting ? (
          <>
            <span className="spinner" />
            Running your audit...
          </>
        ) : (
          <>
            <Zap size={18} />
            Run my free audit
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <p
        style={{
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "var(--color-text-muted)",
          marginTop: "0.75rem",
        }}
      >
        No account needed. Results in seconds. Email captured after, never before.
      </p>

      <style jsx>{`
        .audit-form {
          display: flex;
          flex-direction: column;
        }

        .form-section-header {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
        }

        .form-section-icon {
          width: 32px;
          height: 32px;
          background: var(--color-accent-light);
          color: var(--color-accent);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .tools-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .tools-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .tool-row-top {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: flex-end;
        }

        .plan-hint {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--color-border);
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

        @media (max-width: 640px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
          }

          .tool-row-top {
            flex-direction: column;
          }

          .tool-row-top > * {
            flex: 1 1 100% !important;
          }
        }
      `}</style>
    </form>
  );
}
