import { describe, expect, it } from "vitest";

import type { ChatMessage } from "./api";
import {
  DEFAULT_SYSTEM_PROMPT,
  TITLE_FALLBACK,
  buildRequestMessages,
  buildTitleFromContent,
  createThread,
  sanitizeSystemPrompt,
} from "./chat";

describe("sanitizeSystemPrompt", () => {
  it("returns the default prompt when input is blank", () => {
    expect(sanitizeSystemPrompt("   ")).toBe(DEFAULT_SYSTEM_PROMPT);
  });

  it("trims whitespace when input is present", () => {
    expect(sanitizeSystemPrompt("  Keep it concise.  ")).toBe("Keep it concise.");
  });
});

describe("buildTitleFromContent", () => {
  it("falls back to default when content is empty", () => {
    expect(buildTitleFromContent("")).toBe(TITLE_FALLBACK);
  });

  it("adds an ellipsis when more than eight words are present", () => {
    const title = buildTitleFromContent(
      "One two three four five six seven eight nine ten"
    );
    expect(title).toBe("One two three four five six seven eight…");
  });
});

describe("buildRequestMessages", () => {
  const history: ChatMessage[] = [
    { role: "user", content: "Hello" },
    { role: "assistant", content: "Hi there" },
  ];

  it("prepends the sanitized system prompt", () => {
    const result = buildRequestMessages(history, "   ");
    expect(result[0]).toEqual({ role: "system", content: DEFAULT_SYSTEM_PROMPT });
    expect(result.slice(1)).toEqual(history);
  });

  it("does not mutate the original history array", () => {
    const clone = [...history];
    buildRequestMessages(history, DEFAULT_SYSTEM_PROMPT);
    expect(history).toEqual(clone);
  });
});

describe("createThread", () => {
  it("initialises a thread with sanitized prompt and metadata", () => {
    const thread = createThread({
      id: "thread-1",
      model: "llama",
      systemPrompt: "   ",
      firstMessage: { role: "user", content: "Let's begin" },
      createdAt: "2024-03-01T00:00:00.000Z",
    });

    expect(thread.id).toBe("thread-1");
    expect(thread.model).toBe("llama");
    expect(thread.systemPrompt).toBe(DEFAULT_SYSTEM_PROMPT);
    expect(thread.title).toBe("Let's begin");
    expect(thread.messages).toEqual([
      { role: "user", content: "Let's begin" },
    ]);
    expect(thread.createdAt).toBe("2024-03-01T00:00:00.000Z");
    expect(thread.updatedAt).toBe("2024-03-01T00:00:00.000Z");
  });
});
