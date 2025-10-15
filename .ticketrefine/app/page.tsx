"use client";

import { useState } from "react";
import RefineForm from "@/components/RefineForm";
import ResultCard from "@/components/ResultCard";
import type { RefineResponse } from "@/lib/schema";

export default function HomePage() {
  const [result, setResult] = useState<RefineResponse | null>(null);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-12 lg:flex-row lg:gap-12">
      <section className="flex-1 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-neutral-900">TicketRefine</h1>
          <p className="max-w-xl text-sm text-neutral-600">
            Paste any messy Jira ticket text and get back a clean title, markdown description, and a checklist of what&apos;s still
            missing.
          </p>
        </div>
        <RefineForm onRefined={setResult} />
      </section>

      <aside className="flex-1 lg:pt-12">
        <ResultCard result={result} />
      </aside>
    </div>
  );
}
