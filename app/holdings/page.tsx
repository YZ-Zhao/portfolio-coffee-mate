"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface HoldingRow {
  ticker: string;
  amount: string; // dollar amount as string, e.g. "15000"
}

interface HoldingsData {
  email: string;
  timezone: string;
  sendTime: string;
  wantsUrgentAlerts: boolean;
  holdings: { ticker: string; weightPct: number | null }[];
}

const PLACEHOLDER_TICKERS = ["NVDA", "VTI", "AAPL", "BND", "AMZN"];

function toRows(holdings: HoldingsData["holdings"]): HoldingRow[] {
  // weightPct was stored as a percentage; we display a representative dollar amount
  // Since we only stored %, we reverse-engineer a display amount out of $100k base
  const BASE = 100000;
  return holdings.map((h) => ({
    ticker: h.ticker,
    amount: h.weightPct != null ? String(Math.round((h.weightPct / 100) * BASE)) : "",
  }));
}

function calcWeights(rows: HoldingRow[]): { ticker: string; weightPct: number }[] {
  const valid = rows.filter((r) => r.ticker.trim() && parseFloat(r.amount) > 0);
  const total = valid.reduce((s, r) => s + parseFloat(r.amount), 0);
  if (total === 0) return valid.map((r) => ({ ticker: r.ticker.toUpperCase(), weightPct: 0 }));
  return valid.map((r) => ({
    ticker: r.ticker.toUpperCase().trim(),
    weightPct: Math.round((parseFloat(r.amount) / total) * 1000) / 10, // 1 decimal
  }));
}

function HoldingsContent() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const token = params.get("token") ?? "";

  const [data, setData] = useState<HoldingsData | null>(null);
  const [rows, setRows] = useState<HoldingRow[]>([{ ticker: "", amount: "" }]);
  const [wantsUrgentAlerts, setWantsUrgentAlerts] = useState(true);
  const [loadStatus, setLoadStatus] = useState<"loading" | "error" | "ok">("loading");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    if (!id || !token) {
      setLoadStatus("error");
      setErrorMsg("Invalid link. Please use the link from your email.");
      return;
    }

    const res = await fetch(
      `/api/holdings?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`
    );
    if (!res.ok) {
      setLoadStatus("error");
      setErrorMsg("This link is invalid or expired. Use the link from a recent email.");
      return;
    }

    const json = await res.json() as HoldingsData;
    setData(json);
    setWantsUrgentAlerts(json.wantsUrgentAlerts);
    setRows(json.holdings.length > 0 ? toRows(json.holdings) : [{ ticker: "", amount: "" }]);
    setLoadStatus("ok");
  }, [id, token]);

  useEffect(() => { load(); }, [load]);

  function updateRow(index: number, field: keyof HoldingRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ticker: "", amount: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  // Real-time weight preview
  const weights = calcWeights(rows);
  const total = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  // Build the tickers string for the API (e.g. "NVDA:15, VTI:40")
  function buildTickerString(): string {
    return weights.map((w) => `${w.ticker}:${w.weightPct}`).join(", ");
  }

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault();
    const filledRows = rows.filter((r) => r.ticker.trim());
    if (filledRows.length === 0) return;

    setSaveStatus("saving");
    const res = await fetch("/api/holdings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, token, tickers: buildTickerString(), wantsUrgentAlerts }),
    });

    if (!res.ok) { setSaveStatus("error"); return; }
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 3000);
  }

  // ── Styles ──────────────────────────────────────────────
  const card: React.CSSProperties = {
    maxWidth: "560px", width: "100%", background: "#fff",
    border: "1px solid #e8e4d9", borderRadius: "16px",
    padding: "36px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  };
  const col: React.CSSProperties = {
    fontFamily: "Arial, sans-serif", fontSize: "0.72rem", fontWeight: "bold",
    textTransform: "uppercase", letterSpacing: "1px", color: "#bbb", paddingBottom: "6px",
  };
  const tickerInput: React.CSSProperties = {
    padding: "10px 12px", background: "#f9f9f7", border: "1px solid #e0ddd6",
    borderRadius: "8px", fontFamily: "Arial, sans-serif", fontSize: "0.95rem",
    color: "#1a1a2e", outline: "none", width: "100%", boxSizing: "border-box",
    textTransform: "uppercase",
  };
  const amountInput: React.CSSProperties = {
    ...tickerInput, textTransform: "none",
    paddingLeft: "28px", // room for $ symbol
  };

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
        <span style={{ fontSize: "1.3rem" }}>☕</span>
        <span style={{ fontFamily: "Georgia, serif", color: "#1a1a2e", fontSize: "1rem" }}>Portfolio Coffee Mate</span>
      </div>

      <div style={card}>
        {/* ── Loading ── */}
        {loadStatus === "loading" && (
          <p style={{ fontFamily: "Arial, sans-serif", color: "#aaa", textAlign: "center" }}>
            Loading your holdings…
          </p>
        )}

        {/* ── Error ── */}
        {loadStatus === "error" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⚠️</div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", color: "#1a1a2e", marginBottom: "8px" }}>Invalid link</h1>
            <p style={{ fontFamily: "Arial, sans-serif", color: "#888", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "24px" }}>{errorMsg}</p>
            <a href="/" style={{ color: "#1a6ed4", fontFamily: "Arial, sans-serif", fontSize: "0.9rem" }}>← Back to homepage</a>
          </div>
        )}

        {/* ── Form ── */}
        {loadStatus === "ok" && data && (
          <form onSubmit={handleSave}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", color: "#1a1a2e", marginBottom: "4px" }}>
              Your holdings
            </h1>
            <p style={{ fontFamily: "Arial, sans-serif", fontSize: "0.85rem", color: "#888", marginBottom: "28px" }}>
              Subscribed as <strong>{data.email}</strong>
            </p>

            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr auto auto", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
              <span style={col}>Ticker</span>
              <span style={col}>Amount you own</span>
              <span style={{ ...col, textAlign: "right" }}>% of total</span>
              <span />
            </div>

            {/* Rows */}
            {rows.map((row, i) => {
              const w = weights.find((ww) => ww.ticker === row.ticker.toUpperCase().trim());
              const pct = w && total > 0 ? w.weightPct : null;
              const placeholder = PLACEHOLDER_TICKERS[i] ?? "TICKER";
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr auto auto", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
                  {/* Ticker */}
                  <input
                    type="text"
                    value={row.ticker}
                    onChange={(e) => updateRow(i, "ticker", e.target.value.toUpperCase().slice(0, 5))}
                    placeholder={placeholder}
                    maxLength={5}
                    style={tickerInput}
                  />

                  {/* Dollar amount */}
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
                      fontFamily: "Arial, sans-serif", fontSize: "0.9rem", color: "#aaa", pointerEvents: "none",
                    }}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={row.amount}
                      onChange={(e) => updateRow(i, "amount", e.target.value)}
                      placeholder="10,000"
                      style={amountInput}
                    />
                  </div>

                  {/* Live % badge */}
                  <div style={{
                    minWidth: "48px", textAlign: "right",
                    fontFamily: "Arial, sans-serif", fontSize: "0.85rem",
                    color: pct != null ? "#1a1a2e" : "#ddd", fontWeight: pct != null ? "bold" : "normal",
                  }}>
                    {pct != null ? `${pct}%` : "—"}
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                    style={{
                      background: "none", border: "none", cursor: rows.length === 1 ? "default" : "pointer",
                      color: rows.length === 1 ? "#ddd" : "#ccc", fontSize: "1.1rem", padding: "4px",
                      lineHeight: 1,
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {/* Add row */}
            <button
              type="button"
              onClick={addRow}
              style={{
                width: "100%", padding: "9px", marginTop: "4px",
                background: "none", border: "2px dashed #e0ddd6", borderRadius: "8px",
                fontFamily: "Arial, sans-serif", fontSize: "0.85rem", color: "#aaa",
                cursor: "pointer",
              }}
            >
              + Add another holding
            </button>

            {/* Total bar */}
            {total > 0 && (
              <div style={{
                marginTop: "16px", padding: "10px 14px", background: "#faf9f6",
                borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontFamily: "Arial, sans-serif", fontSize: "0.8rem", color: "#888" }}>
                  Total portfolio value
                </span>
                <span style={{ fontFamily: "Arial, sans-serif", fontSize: "0.95rem", fontWeight: "bold", color: "#1a1a2e" }}>
                  ${total.toLocaleString()}
                </span>
              </div>
            )}

            <div style={{ marginTop: "8px", marginBottom: "4px" }}>
              <p style={{ fontFamily: "Arial, sans-serif", fontSize: "0.75rem", color: "#bbb", lineHeight: "1.5" }}>
                Enter approximately how much you own in each. Used only to weight news relevance — not stored exactly, converted to percentages.
              </p>
            </div>

            {/* Divider */}
            <hr style={{ border: "none", borderTop: "1px solid #e8e4d9", margin: "20px 0" }} />

            {/* Urgent alerts toggle */}
            <label style={{
              display: "flex", alignItems: "center", gap: "10px", cursor: "pointer",
              fontFamily: "Arial, sans-serif", fontSize: "0.9rem", color: "#555", marginBottom: "24px",
            }}>
              <input
                type="checkbox"
                checked={wantsUrgentAlerts}
                onChange={(e) => setWantsUrgentAlerts(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#1a1a2e" }}
              />
              <span>
                Send urgent alerts for high-impact events{" "}
                <span style={{ color: "#aaa", fontSize: "0.8rem" }}>(rare — only score ≥ 8/10)</span>
              </span>
            </label>

            {/* Feedback banners */}
            {saveStatus === "error" && (
              <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "6px", padding: "10px 14px", color: "#b91c1c", fontFamily: "Arial, sans-serif", fontSize: "0.875rem", marginBottom: "16px" }}>
                Something went wrong. Please try again.
              </div>
            )}
            {saveStatus === "saved" && (
              <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: "6px", padding: "10px 14px", color: "#047857", fontFamily: "Arial, sans-serif", fontSize: "0.875rem", marginBottom: "16px" }}>
                ✓ Holdings updated! Changes will be reflected in your next morning brief.
              </div>
            )}

            {/* Save button */}
            <button
              type="submit"
              disabled={saveStatus === "saving" || rows.filter(r => r.ticker.trim()).length === 0}
              style={{
                width: "100%", padding: "13px", background: "#1a1a2e", color: "#f5c842",
                border: "none", borderRadius: "8px", fontFamily: "Arial, sans-serif",
                fontSize: "0.95rem", fontWeight: "bold",
                cursor: saveStatus === "saving" ? "wait" : "pointer",
                opacity: saveStatus === "saving" ? 0.7 : 1,
              }}
            >
              {saveStatus === "saving" ? "Saving…" : "Save holdings"}
            </button>

            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #e8e4d9", textAlign: "center" }}>
              <a href="/" style={{ fontFamily: "Arial, sans-serif", fontSize: "0.8rem", color: "#aaa", textDecoration: "none" }}>
                ← Back to homepage
              </a>
            </div>
          </form>
        )}
      </div>

      <p style={{ fontFamily: "Arial, sans-serif", fontSize: "0.7rem", color: "#ccc", marginTop: "20px" }}>
        For informational purposes only. Not financial advice.
      </p>
    </div>
  );
}

export default function HoldingsPage() {
  return (
    <Suspense>
      <HoldingsContent />
    </Suspense>
  );
}
