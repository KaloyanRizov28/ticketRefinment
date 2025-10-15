import OpenAI from "openai";
import {
  DEFAULT_CHECKLIST,
  RefineResponseSchema,
  type ChecklistItem,
  type RefineResponse
} from "@/lib/schema";

const checklistFallbackNotes: Record<string, string> = {
  acceptanceCriteria: "List Given/When/Then scenarios or bullet acceptance criteria.",
  stepsToReproduce: "Provide numbered steps to reproduce the issue.",
  currentBehavior: "Describe what happens today when the issue occurs.",
  expectedBehavior: "Clarify what should happen instead.",
  environment: "Specify environment, URLs, versions, or feature flags.",
  attachments: "Link screenshots, recordings, or relevant files.",
  priority: "State the priority (e.g., P0/P1/P2 or High/Medium/Low).",
  businessImpact: "Explain how this affects customers or the business.",
  dependencies: "Note related services, teams, or blockers.",
  definitionOfDone: "Describe what must be true for this ticket to be complete."
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class ModelError extends Error {
  constructor(message = "model_error", options?: ErrorOptions) {
    super(message, options);
    this.name = "ModelError";
  }
}

export class SchemaValidationError extends Error {
  constructor(message: string, public readonly issues: unknown) {
    super(message);
    this.name = "SchemaValidationError";
  }
}

function mergeChecklist(items: ChecklistItem[]): ChecklistItem[] {
  const map = new Map<string, ChecklistItem>();

  for (const item of items) {
    if (!item.key) continue;
    map.set(item.key, {
      ...item,
      label: DEFAULT_CHECKLIST.find((def) => def.key === item.key)?.label ?? item.label
    });
  }

  const ordered: ChecklistItem[] = [];

  for (const def of DEFAULT_CHECKLIST) {
    const existing = map.get(def.key);
    if (existing) {
      ordered.push({ ...existing, key: def.key, label: def.label });
    } else {
      ordered.push({
        key: def.key,
        label: def.label,
        missing: true,
        notes: checklistFallbackNotes[def.key] ?? "Add the missing details."
      });
    }
  }

  for (const [key, item] of map.entries()) {
    if (!DEFAULT_CHECKLIST.some((def) => def.key === key)) {
      ordered.push(item);
    }
  }

  return ordered;
}

export async function refineWithGPT(rawText: string): Promise<RefineResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new ModelError("model_error");
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      max_output_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are an expert Jira ticket editor for a software team. Your goal is to turn messy, copy-pasted tickets into clear, developer-ready artifacts and to identify missing critical details.\nOutput ONLY valid JSON that matches the provided JSON schema. Do not include markdown fences.\nBe concise and practical. Avoid corporate fluff. Use simple, direct language."
        },
        {
          role: "user",
          content:
            "RAW_TICKET_TEXT:\n<<<\n" +
            rawText +
            "\n>>>\n\nRequirements:\n- Create a concise, informative title (<= 90 chars).\n- Produce a markdown description that includes only sections supported by the input: Summary, Current behavior, Expected behavior, Steps to reproduce, Environment, Attachments, Notes.\n- Generate a checklist with these exact keys and labels:\n  - acceptanceCriteria (Acceptance criteria)\n  - stepsToReproduce (Steps to reproduce)\n  - currentBehavior (Current behavior)\n  - expectedBehavior (Expected behavior)\n  - environment (Environment)\n  - attachments (Attachments)\n  - priority (Priority)\n  - businessImpact (Business impact)\n  - dependencies (Dependencies)\n  - definitionOfDone (Definition of Done)\n- For each checklist item set `missing=true` if absent or ambiguous. Add brief `notes` telling the requester exactly what to provide.\n- If the text is extremely short (e.g., \"LU0099574567, copy paste ,\"), infer a plausible baseline Summary and maximize helpful `notes` in the checklist.\n\nReturn ONLY a single JSON object for the schema:\n{\n  \"refined\": { \"title\": string, \"descriptionMd\": string },\n  \"checklist\": [{ \"key\": string, \"label\": string, \"missing\": boolean, \"notes\"?: string }]\n}"
        }
      ]
    });

    const rawOutput = response.output_text;
    const parsedJson = JSON.parse(rawOutput);
    const parsed = RefineResponseSchema.safeParse(parsedJson);

    if (!parsed.success) {
      throw new SchemaValidationError(
        "LLM response failed schema validation",
        parsed.error.flatten()
      );
    }

    const mergedChecklist = mergeChecklist(parsed.data.checklist);
    const refined: RefineResponse = {
      refined: {
        title: parsed.data.refined.title.trim(),
        descriptionMd: parsed.data.refined.descriptionMd.trim()
      },
      checklist: mergedChecklist
    };

    return RefineResponseSchema.parse(refined);
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new SchemaValidationError("LLM response was not valid JSON", error.message);
    }

    throw new ModelError("model_error", { cause: error });
  }
}
