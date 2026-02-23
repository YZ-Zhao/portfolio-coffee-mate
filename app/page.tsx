"use client";

import { useState } from "react";

interface FormState {
  email: string;
  tickers: string;
  wantsUrgentAlerts: boolean;
}

export default function LandingPage() {
  const [form, setForm] = useState<FormState>({
    email: "",
    tickers: "",
    wantsUrgentAlerts: true,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json() as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "8px",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "Arial, sans-serif",
    fontSize: "0.8rem",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#a8a8c0",
    marginBottom: "6px",
  };

  return (
    <div className="min-h-screen" style={{ background: "#faf9f6" }}>
      {/* Header */}
      <header style={{ background: "#1a1a2e" }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "1.4rem" }}>☕</span>
          <span style={{ color: "#f5c842", fontFamily: "Georgia, serif", fontSize: "1.1rem", letterSpacing: "0.5px" }}>
            Portfolio Coffee Mate
          </span>
        </div>
        <span style={{ color: "#a8a8c0", fontFamily: "Arial, sans-serif", fontSize: "0.8rem" }}>
          Calm investing, one morning at a time.
        </span>
      </header>

      {/* Hero */}
      <section style={{ background: "#1a1a2e" }} className="px-6 pb-16 pt-12 text-center">
        <div className="max-w-2xl mx-auto">
          <div style={{
            display: "inline-block", background: "#f5c842", color: "#1a1a2e",
            fontSize: "0.75rem", fontFamily: "Arial, sans-serif", fontWeight: "bold",
            letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 14px",
            borderRadius: "20px", marginBottom: "20px",
          }}>
            Free Morning Newsletter
          </div>
          <h1 style={{
            color: "#fff", fontFamily: "Georgia, serif", fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            lineHeight: "1.25", fontWeight: "normal", marginBottom: "16px",
          }}>
            Start your morning with what actually affects your investments.
          </h1>
          <p style={{
            color: "#a8a8c0", fontFamily: "Arial, sans-serif", fontSize: "1.1rem",
            lineHeight: "1.7", marginBottom: "40px",
          }}>
            Personalized to your holdings.{" "}
            <span style={{ color: "#f5c842" }}>Simple explanations.</span>{" "}
            Calm, low-noise alerts.
          </p>

          {/* Subscribe Form */}
          {status === "success" ? (
            <div style={{
              background: "rgba(245, 200, 66, 0.1)", border: "1px solid #f5c842",
              borderRadius: "12px", padding: "32px", color: "#fff",
            }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>☕</div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", marginBottom: "8px", color: "#f5c842" }}>
                You&apos;re on the list!
              </h2>
              <p style={{ fontFamily: "Arial, sans-serif", color: "#a8a8c0", lineHeight: "1.6" }}>
                Check your inbox for a welcome email. Your first morning brief arrives tomorrow.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px", padding: "32px", textAlign: "left",
            }}>
              <div style={{ marginBottom: "16px" }}>
                <label htmlFor="email" style={labelStyle}>
                  Email address <span style={{ color: "#f5c842" }}>*</span>
                </label>
                <input
                  id="email" type="email" required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label htmlFor="tickers" style={labelStyle}>
                  Your holdings{" "}
                  <span style={{ color: "#666", fontSize: "0.75rem", textTransform: "none", letterSpacing: 0 }}>
                    (optional)
                  </span>
                </label>
                <input
                  id="tickers" type="text"
                  value={form.tickers}
                  onChange={(e) => setForm({ ...form, tickers: e.target.value })}
                  placeholder="e.g. NVDA, VTI, BND, AAPL"
                  style={inputStyle}
                />
                <p style={{ fontFamily: "Arial, sans-serif", fontSize: "0.75rem", color: "#666", marginTop: "4px" }}>
                  Just the ticker symbols, separated by commas. You can add dollar amounts after signup.
                </p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "flex", alignItems: "center", gap: "10px", cursor: "pointer",
                  fontFamily: "Arial, sans-serif", fontSize: "0.9rem", color: "#a8a8c0",
                }}>
                  <input
                    type="checkbox"
                    checked={form.wantsUrgentAlerts}
                    onChange={(e) => setForm({ ...form, wantsUrgentAlerts: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "#f5c842" }}
                  />
                  <span>
                    Send urgent alerts for high-impact events{" "}
                    <span style={{ color: "#666", fontSize: "0.8rem" }}>(rare — only score ≥ 8/10)</span>
                  </span>
                </label>
              </div>

              {status === "error" && (
                <div style={{
                  background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "6px",
                  padding: "10px 14px", color: "#b91c1c", fontFamily: "Arial, sans-serif",
                  fontSize: "0.875rem", marginBottom: "16px",
                }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  width: "100%", padding: "14px", background: "#f5c842", color: "#1a1a2e",
                  border: "none", borderRadius: "8px", fontFamily: "Arial, sans-serif",
                  fontSize: "1rem", fontWeight: "bold", cursor: status === "loading" ? "wait" : "pointer",
                  opacity: status === "loading" ? 0.7 : 1, letterSpacing: "0.3px",
                }}
              >
                {status === "loading" ? "Setting up your brief..." : "Start my morning brief ☕"}
              </button>

              <p style={{
                fontFamily: "Arial, sans-serif", fontSize: "0.75rem", color: "#555",
                textAlign: "center", marginTop: "12px",
              }}>
                Free. No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.75rem", textAlign: "center", marginBottom: "40px", color: "#1a1a2e" }}>
            One email. Every morning. Just what matters.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            {[
              { icon: "📰", title: "Personalized news scan", desc: "We scan financial news each morning and filter for what actually affects your specific holdings." },
              { icon: "🔍", title: "Plain-English summaries", desc: "No jargon. Each event gets a simple \"what happened\" + \"why it matters for your portfolio\" summary." },
              { icon: "📊", title: "Impact scoring", desc: "Each event is scored 1–10 so you can instantly see what deserves attention (High / Moderate / Low)." },
              { icon: "🚨", title: "Rare urgent alerts", desc: "Only truly high-impact events (score ≥ 8) trigger an immediate alert. Designed to be rare." },
            ].map((item) => (
              <div key={item.title} style={{ background: "#fff", border: "1px solid #e8e4d9", borderRadius: "12px", padding: "24px" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>{item.icon}</div>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", marginBottom: "8px", color: "#1a1a2e" }}>{item.title}</h3>
                <p style={{ fontFamily: "Arial, sans-serif", fontSize: "0.875rem", color: "#666", lineHeight: "1.6", margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Email Preview */}
      <section style={{ background: "#fff", borderTop: "1px solid #e8e4d9" }} className="px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#aaa", textAlign: "center", marginBottom: "12px" }}>
            Example Morning Brief
          </p>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", textAlign: "center", marginBottom: "32px", color: "#1a1a2e" }}>
            Here&apos;s what you&apos;ll get every morning
          </h2>
          <div style={{ border: "1px solid #e8e4d9", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div style={{ background: "#1a1a2e", padding: "20px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.4rem" }}>☕</span>
              <div>
                <div style={{ color: "#f5c842", fontFamily: "Georgia, serif", fontSize: "1rem" }}>Portfolio Coffee Mate</div>
                <div style={{ color: "#a8a8c0", fontFamily: "Arial, sans-serif", fontSize: "0.75rem" }}>Monday, February 22, 2026</div>
              </div>
            </div>
            <div style={{ padding: "24px" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", color: "#1a1a2e", marginBottom: "4px" }}>Good morning.</p>
              <p style={{ fontFamily: "Arial, sans-serif", fontSize: "0.875rem", color: "#777", marginBottom: "20px" }}>
                Here are the <strong>3 things that matter today</strong> for your portfolio.
              </p>
              <hr style={{ border: "none", borderTop: "2px solid #f5c842", marginBottom: "20px" }} />
              {[
                { title: "NVIDIA reports record quarterly earnings", summary: "NVDA posted revenue of $36B, surpassing expectations as AI chip demand surged.", level: "High", score: 9, tickers: "NVDA", pct: "15%", badgeBg: "#fee2e2", badgeColor: "#b91c1c" },
                { title: "10-year Treasury yield climbs to 4.6%", summary: "Bond prices fell as investors repriced rate cut expectations after hotter CPI data.", level: "Moderate", score: 5, tickers: "BND", pct: "25%", badgeBg: "#fef3c7", badgeColor: "#b45309" },
                { title: "Fed holds rates steady, signals cautious outlook", summary: "The Federal Reserve kept its benchmark rate unchanged, citing persistent inflation.", level: "Low", score: 3, tickers: "VTI, BND", pct: "85%", badgeBg: "#d1fae5", badgeColor: "#047857" },
              ].map((event, i) => (
                <div key={i} style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: i < 2 ? "1px solid #e8e4d9" : "none" }}>
                  <h3 style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", color: "#1a1a2e", marginBottom: "6px", lineHeight: "1.4" }}>{event.title}</h3>
                  <p style={{ fontFamily: "Arial, sans-serif", fontSize: "0.8rem", color: "#555", marginBottom: "8px", lineHeight: "1.5" }}>{event.summary}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "12px", background: event.badgeBg, color: event.badgeColor, fontSize: "0.7rem", fontWeight: "bold", fontFamily: "Arial, sans-serif" }}>
                      {event.level} · {event.score}/10
                    </span>
                    <span style={{ fontFamily: "Arial, sans-serif", fontSize: "0.75rem", color: "#777" }}>
                      Affects: <strong>{event.tickers}</strong> (~{event.pct} of your portfolio)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#1a1a2e", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: "Georgia, serif", color: "#f5c842", fontSize: "1.1rem", marginBottom: "8px" }}>
          ☕ Portfolio Coffee Mate
        </p>
        <p style={{ fontFamily: "Arial, sans-serif", color: "#666", fontSize: "0.75rem", lineHeight: "1.6", maxWidth: "480px", margin: "0 auto" }}>
          For informational purposes only. Not financial advice. Past performance is not indicative of future results.
          Always consult a qualified financial advisor before making investment decisions.
        </p>
      </footer>
    </div>
  );
}
