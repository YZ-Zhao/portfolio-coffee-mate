"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function UnsubscribeContent() {
  const params = useSearchParams();
  const done = params.get("done") === "1";
  const email = params.get("email") ?? "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf9f6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "#fff",
          border: "1px solid #e8e4d9",
          borderRadius: "16px",
          padding: "48px 40px",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        {done ? (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>👋</div>
            <h1
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "1.5rem",
                color: "#1a1a2e",
                marginBottom: "12px",
              }}
            >
              You&apos;ve been unsubscribed.
            </h1>
            {email && (
              <p
                style={{
                  fontFamily: "Arial, sans-serif",
                  color: "#888",
                  fontSize: "0.9rem",
                  marginBottom: "8px",
                }}
              >
                <strong>{email}</strong> has been removed from Portfolio Coffee Mate.
              </p>
            )}
            <p
              style={{
                fontFamily: "Arial, sans-serif",
                color: "#aaa",
                fontSize: "0.85rem",
                lineHeight: "1.6",
                marginBottom: "32px",
              }}
            >
              No more emails will be sent. If you change your mind, you can always
              resubscribe on the homepage.
            </p>
            <a
              href="/"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "#1a1a2e",
                color: "#f5c842",
                textDecoration: "none",
                borderRadius: "8px",
                fontFamily: "Arial, sans-serif",
                fontSize: "0.9rem",
                fontWeight: "bold",
              }}
            >
              Back to homepage
            </a>
          </>
        ) : (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>❓</div>
            <h1
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "1.5rem",
                color: "#1a1a2e",
                marginBottom: "12px",
              }}
            >
              Invalid unsubscribe link.
            </h1>
            <p
              style={{
                fontFamily: "Arial, sans-serif",
                color: "#888",
                fontSize: "0.9rem",
                lineHeight: "1.6",
                marginBottom: "32px",
              }}
            >
              This link may have expired or already been used. Use the unsubscribe
              link from a recent email, or contact us for help.
            </p>
            <a
              href="/"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "#1a1a2e",
                color: "#f5c842",
                textDecoration: "none",
                borderRadius: "8px",
                fontFamily: "Arial, sans-serif",
                fontSize: "0.9rem",
                fontWeight: "bold",
              }}
            >
              Back to homepage
            </a>
          </>
        )}
      </div>

      <p
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "0.7rem",
          color: "#ccc",
          marginTop: "24px",
        }}
      >
        ☕ Portfolio Coffee Mate · For informational purposes only. Not financial advice.
      </p>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}
