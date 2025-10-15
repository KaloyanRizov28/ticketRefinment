import { NextResponse } from "next/server";
import { z } from "zod";
import { ModelError, SchemaValidationError, refineWithGPT } from "@/lib/openai";

const RequestSchema = z.object({
  rawText: z.string()
});

const MAX_INPUT_CHARS = 8000;

export async function POST(request: Request) {
  let payload: z.infer<typeof RequestSchema>;

  try {
    payload = RequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const trimmed = payload.rawText.trim();

  if (!trimmed) {
    return NextResponse.json({ error: "empty_request" }, { status: 400 });
  }

  let processed = trimmed;
  if (processed.length > MAX_INPUT_CHARS) {
    processed = `${processed.slice(0, MAX_INPUT_CHARS)}\n\n[Note: input truncated after ${MAX_INPUT_CHARS} characters.]`;
  }

  try {
    const result = await refineWithGPT(processed);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      return NextResponse.json(
        { error: "schema_validation", details: error.issues },
        { status: 502 }
      );
    }

    if (error instanceof ModelError) {
      return NextResponse.json({ error: "model_error" }, { status: 502 });
    }

    return NextResponse.json({ error: "unknown_error" }, { status: 500 });
  }
}
