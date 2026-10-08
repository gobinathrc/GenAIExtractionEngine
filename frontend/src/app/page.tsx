"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Database } from "lucide-react";

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleExtract = async () => {
    if (!text) return;
    setLoading(true);
    setResult(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/api/v1/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          context: "Extract entities for database filtering.",
        }),
      });
      
      const data = await response.json();
      
      // SAFETY CHECK: Handle backend errors gracefully so the page doesn't crash
      if (!response.ok || !data.entities) {
        alert("Backend Error: " + (data.detail || "Unable to extract data. Please check OpenAI API keys on Render."));
        return;
      }
      
      setResult(data);
    } catch (error) {
      console.error("Extraction failed:", error);
      alert("Network Error: Could not connect to the backend. Please check if your backend URL is correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto space-y-12 pt-12">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight">
            GenAI <span className="font-semibold text-blue-400">Extraction Engine</span>
          </h1>
          <p className="text-neutral-400 text-lg">
            Translating unstructured human text into strict JSON for backend systems.
          </p>
        </div>

        {/* Input Section (Glassmorphism) */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a messy paragraph here... e.g., 'I want a cheap hotel in Paris for 2 adults that allows dogs.'"
            className="w-full h-32 bg-transparent text-lg resize-none outline-none placeholder:text-neutral-600"
          />
          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              onClick={handleExtract}
              disabled={loading || !text}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:bg-neutral-700 text-white px-6 py-3 rounded-full transition-all duration-300 font-medium"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
              {loading ? "Extracting..." : "Run Extraction"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && result.entities && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Database className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-medium">Structured Database Output</h2>
            </div>

            <p className="text-neutral-300 bg-white/5 p-4 rounded-xl border border-white/10">
              <span className="font-semibold text-white">Summary: </span>
              {result.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.entities.map((entity: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 p-5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <p className="text-sm text-blue-400 font-mono uppercase tracking-wider mb-1">
                    {entity.name}
                  </p>
                  <p className="text-xl font-medium truncate">{entity.value}</p>
                  <p className="text-xs text-neutral-500 mt-3 flex justify-between">
                    <span>Confidence:</span>
                    <span className="text-white">{Math.round(entity.confidence * 100)}%</span>
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}