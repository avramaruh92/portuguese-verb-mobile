import type { ProductFeedbackCategory } from "./types";

export const categoryLabels: Record<ProductFeedbackCategory, string> = {
  bug: "Bug",
  idea: "Idea",
  other: "Other",
};

export const CATEGORY_OPTIONS: {
  value: ProductFeedbackCategory;
  label: string;
}[] = (["bug", "idea", "other"] as const).map((value) => ({
  value,
  label: categoryLabels[value],
}));
