import { z } from "zod";

export const ChecklistItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  missing: z.boolean(),
  notes: z.string().trim().min(1).optional()
});

export const RefineResponseSchema = z.object({
  refined: z.object({
    title: z.string().min(1).max(200),
    descriptionMd: z.string().min(1)
  }),
  checklist: z.array(ChecklistItemSchema).min(1)
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type RefineResponse = z.infer<typeof RefineResponseSchema>;

export const DEFAULT_CHECKLIST: Array<Pick<ChecklistItem, "key" | "label">> = [
  { key: "acceptanceCriteria", label: "Acceptance criteria" },
  { key: "stepsToReproduce", label: "Steps to reproduce" },
  { key: "currentBehavior", label: "Current behavior" },
  { key: "expectedBehavior", label: "Expected behavior" },
  { key: "environment", label: "Environment" },
  { key: "attachments", label: "Attachments" },
  { key: "priority", label: "Priority" },
  { key: "businessImpact", label: "Business impact" },
  { key: "dependencies", label: "Dependencies" },
  { key: "definitionOfDone", label: "Definition of Done" }
];
