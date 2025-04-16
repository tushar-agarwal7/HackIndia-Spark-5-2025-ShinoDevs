// app/page.js
"use client";

import { useState } from "react";

export default function HomePage() {
  const [inputText, setInputText] = useState("");
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTranslate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call the API route created in app/api/inference/route.js
      const response = await fetch("/api/inference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: inputText }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setOutput(data);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Bloomz‑560m Inference with Next.js App Router</h1>
      <form onSubmit={handleTranslate}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter your prompt"
          style={{ width: "300px", padding: "0.5rem", marginRight: "1rem" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Running..." : "Run Inference"}
        </button>
      </form>
      {error && (
        <p style={{ color: "red", marginTop: "1rem" }}>Error: {error}</p>
      )}
      {output && (
        <pre style={{ marginTop: "1rem", background: "#f4f4f4", padding: "1rem" }}>
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  );
}
