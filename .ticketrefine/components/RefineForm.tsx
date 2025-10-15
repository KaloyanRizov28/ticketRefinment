"use client";

import { useEffect, useState, type FormEvent } from "react";
import clsx from "clsx";
import type { RefineResponse } from "@/lib/schema";

type RefineFormProps = {
  onRefined: (data: RefineResponse) => void;
};

const SAMPLE_TEXT = "LU0099574567, copy paste , not working pls fix";

export default function RefineForm({ onRefined }: RefineFormProps) {
  const [rawText, setRawText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!rawText.trim()) {
      setToast("Please paste the raw ticket text before refining.");
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rawText })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: unknown };
        const message =
          typeof payload.error === "string"
            ? `Unable to refine ticket (${payload.error}).`
            : "Unable to refine ticket. Please try again.";
        throw new Error(message);
      }

      const data = (await response.json()) as RefineResponse;
      onRefined(data);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative">
      {toast ? (
        <div className="absolute -top-14 left-0 right-0">
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 shadow-sm">
            {toast}
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="rawText" className="text-sm font-medium text-neutral-700">
            Raw ticket text
          </label>
          <textarea
            id="rawText"
            name="rawText"
            placeholder={SAMPLE_TEXT}
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            rows={12}
            className="w-full resize-y rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm leading-6 text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={clsx(
              "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2",
              isSubmitting && "cursor-not-allowed opacity-70"
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Refining…
              </span>
            ) : (
              "Refine"
            )}
          </button>
          <p className="text-xs text-neutral-500">TicketRefine keeps everything on the server—no API keys in the browser.</p>
        </div>
      </form>
    </div>
  );
}
