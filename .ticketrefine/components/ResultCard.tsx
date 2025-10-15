import ReactMarkdown from "react-markdown";
import type { RefineResponse } from "@/lib/schema";

type ResultCardProps = {
  result?: RefineResponse | null;
};

export default function ResultCard({ result }: ResultCardProps) {
  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white/60 p-6 text-sm text-neutral-500 shadow-inner">
        The refined ticket will appear here after you submit the raw text.
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">{result.refined.title}</h2>
        <ReactMarkdown
          className="space-y-3 text-sm leading-6 text-neutral-800"
          components={{
            h1: ({ node, ...props }) => (
              <h3 className="text-base font-semibold text-neutral-900" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h3 className="text-base font-semibold text-neutral-900" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h4 className="text-sm font-semibold text-neutral-900" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc space-y-1 pl-5" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal space-y-1 pl-5" {...props} />
            ),
            li: ({ node, ...props }) => <li className="text-neutral-800" {...props} />,
            code: ({ node, inline, ...props }) => (
              <code
                className={inline ? "rounded bg-neutral-100 px-1 py-0.5" : "block rounded bg-neutral-100 p-3"}
                {...props}
              />
            ),
            p: ({ node, ...props }) => <p className="text-neutral-800" {...props} />
          }}
        >
          {result.refined.descriptionMd}
        </ReactMarkdown>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Checklist</h3>
        <ul className="mt-3 space-y-3">
          {result.checklist.map((item) => (
            <li key={item.key} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg" aria-hidden>
                  {item.missing ? "❌" : "✅"}
                </span>
                <div className="space-y-1">
                  <p className="font-medium text-neutral-800">{item.label}</p>
                  <p className="text-xs text-neutral-500">
                    {item.missing
                      ? item.notes ?? "Provide additional details for this item."
                      : item.notes ?? "Looks good."}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
