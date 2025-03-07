"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showFloatingPrompt, setShowFloatingPrompt] = useState(false);
  const { data: session } = useSession();
  const welcomeBannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (welcomeBannerRef.current && !session?.user && showLoginPrompt) {
        const rect = welcomeBannerRef.current.getBoundingClientRect();
        setShowFloatingPrompt(rect.bottom < 0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [session?.user, showLoginPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setShowLoginPrompt(false);
    setShowFloatingPrompt(false);

    try {
      const credentials = btoa(
        `${process.env.NEXT_PUBLIC_API_USERNAME}:${process.env.NEXT_PUBLIC_API_PASSWORD}`
      );
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const responseText = data.response || "No response received";
      setResponse(responseText);

      // If user is not logged in, show login prompt
      if (!session?.user) {
        setShowLoginPrompt(true);
        // Trigger initial scroll check
        const rect = welcomeBannerRef.current?.getBoundingClientRect();
        if (rect && rect.bottom < 0) {
          setShowFloatingPrompt(true);
        }
      } else {
        // Save query for logged-in users
        await saveQuery(question, responseText);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setResponse("");
    } finally {
      setLoading(false);
    }
  };

  const saveQuery = async (text: string, response: string) => {
    try {
      await fetch("/api/queries/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, response }),
      });
    } catch (error) {
      console.error("Error saving query:", error);
    }
  };

  return (
    <div className="space-y-6">
      {!session?.user && (
        <div
          ref={welcomeBannerRef}
          className="bg-white shadow rounded-lg p-6 border-l-4 border-teal-500"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Welcome to Dockerized Ollama Chat!
          </h2>
          <p className="text-gray-600 mb-4">
            Queries while logged out will not be saved. To save your chat
            history,{" "}
            <Link
              href="/auth/signin"
              className="text-teal-500 hover:text-teal-600 underline"
            >
              sign in
            </Link>{" "}
            or{" "}
            <Link
              href="/auth/signup"
              className="text-teal-500 hover:text-teal-600 underline"
            >
              create an account
            </Link>
            .
          </p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-4 border rounded-md bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors duration-200"
              placeholder="Ask a question... (Press Enter to submit, Shift+Enter for new line)"
              rows={4}
            />
            <div className="absolute right-2 bottom-2 text-xs text-gray-400">
              Press Enter to submit
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-6 py-3 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors duration-200"
          >
            {loading ? "Loading..." : "Submit"}
          </button>
        </form>
      </div>

      {showFloatingPrompt && !session?.user && showLoginPrompt && (
        <div className="fixed bottom-4 right-4 bg-white shadow-xl rounded-lg p-4 border-l-4 border-teal-500 max-w-xs animate-fade-in z-[9999]">
          <button
            onClick={() => setShowFloatingPrompt(false)}
            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 p-1"
          >
            ×
          </button>
          <p className="text-sm text-gray-700 pr-4">
            Want to save your queries?{" "}
            <Link
              href="/auth/signin"
              className="text-teal-500 hover:text-teal-600 underline"
            >
              Sign in
            </Link>{" "}
            or{" "}
            <Link
              href="/auth/signup"
              className="text-teal-500 hover:text-teal-600 underline"
            >
              create an account
            </Link>
          </p>
        </div>
      )}

      {error && (
        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-500">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {response && (
        <div className="bg-white shadow rounded-lg p-6">
          <pre className="whitespace-pre-wrap text-gray-800 font-normal">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}
