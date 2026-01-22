import type { UserType } from "@/app/(auth)/auth";
import type { ChatModel } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 10,
    availableChatModelIds: [
      "chat-model",
      "fastest-model",
      "code-model",
      "vision-model",
      "uncensored-model",
      "chat-model-reasoning",
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 50,
    availableChatModelIds: [
      "chat-model",
      "fastest-model",
      "code-model",
      "vision-model",
      "uncensored-model",
      "chat-model-reasoning",
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
  premium: {
    maxMessagesPerDay: 500,
    availableChatModelIds: [
      "chat-model",
      "fastest-model",
      "code-model",
      "vision-model",
      "uncensored-model",
      "chat-model-reasoning",
    ],
  },
};
