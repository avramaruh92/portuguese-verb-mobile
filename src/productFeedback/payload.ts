import type {
  ProductFeedbackCategory,
  ProductFeedbackPayload,
  ProductFeedbackScreen,
} from "./types";

export function buildProductFeedbackPayload(params: {
  category: ProductFeedbackCategory;
  message: string;
  screen: ProductFeedbackScreen;
  appVersion: string;
  platform: "ios" | "android";
}): ProductFeedbackPayload {
  return {
    category: params.category,
    message: params.message.trim(),
    screen: params.screen,
    appVersion: params.appVersion,
    platform: params.platform,
  };
}
