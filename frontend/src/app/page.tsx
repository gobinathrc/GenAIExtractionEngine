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
      // Hardcoded to local backend to bypass Render network limits
      const API_URL = "http://127.0.0.1:8000";
      
      const response = await fetch(`${API_URL}/api/v1/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          context: "Extract entities for database filtering.",
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Extraction failed");
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error("Extraction failed:", error);
      alert("Backend Error: " + error.message);
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

        {/* Input Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a messy paragraph here... e.g., 'I want a reasonably priced hotel in Miami with wifi.'"
            className="w-full h-32 bg-transparent text-lg resize-none outline-none placeholder:text-neutral-600"
          />
          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              onClick={handleExtract}
              disabled={loading || !text}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:bg-neutral-700 text-white px-6 py-3 rounded-full transition-all duration-300 font-medium"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Run Extraction
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Database className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-semibold">Structured Database Output</h2>
            </div>

            {/* Summary Box */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-lg space-y-4">
              <p className="text-neutral-300 leading-relaxed">
                <strong className="text-white">Summary:</strong> {result.summary}
              </p>
              
              {/* NEW: Follow-up Questions Alert Box */}
              {result.follow_up_questions && result.follow_up_questions.length > 0 && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <strong className="text-blue-400">Clarification Needed:</strong>
                  <ul className="list-disc list-inside text-neutral-300 mt-2 space-y-1">
                    {result.follow_up_questions.map((q: string, idx: number) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Entity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.entities.map((entity: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors"
                >
                  <div className="text-xs font-bold text-blue-400 tracking-wider uppercase mb-2">
                    {entity.name}
                  </div>
                  <div className="text-xl font-medium mb-4">{entity.value}</div>
                  <div className="flex justify-between items-center text-xs text-neutral-500 border-t border-white/10 pt-3">
                    <span>Confidence:</span>
                    <span className="text-neutral-300 font-mono">
                      {Math.round(entity.confidence * 100)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}