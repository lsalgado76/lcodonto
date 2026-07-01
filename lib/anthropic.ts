import Anthropic from "@anthropic-ai/sdk";
import {
  captureLeadToolAnthropic,
  type CaptureLeadInput,
  type LLMResult,
} from "./lead-tool";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callClaude(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<LLMResult> {
  const systemWithCache = [
    {
      type: "text" as const,
      text: system,
      cache_control: { type: "ephemeral" as const },
    },
  ];

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    temperature: 0.85,
    system: systemWithCache,
    messages: messages as any,
    tools: [captureLeadToolAnthropic],
  });

  if (response.stop_reason === "tool_use") {
    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (toolBlock?.type === "tool_use" && toolBlock.name === "capture_lead") {
      const leadInput = toolBlock.input as CaptureLeadInput;

      const followUpMessages: Anthropic.MessageParam[] = [
        ...messages,
        { role: "assistant", content: response.content as any },
        {
          role: "user",
          content: [
            {
              type: "tool_result" as const,
              tool_use_id: toolBlock.id,
              content: "Lead registrado com sucesso.",
            },
          ],
        },
      ];

      const final = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        temperature: 0.85,
        system: systemWithCache,
        messages: followUpMessages,
        tools: [captureLeadToolAnthropic],
      });

      console.log("[Anthropic Caching Usage - Turno 2]:", final.usage);

      const textBlock = final.content.find((b) => b.type === "text");
      return {
        reply: textBlock?.type === "text" ? textBlock.text : "",
        leadCaptured: leadInput,
      };
    }
  }

  console.log("[Anthropic Caching Usage - Turno 1]:", response.usage);

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Resposta não-texto inesperada da Anthropic API");
  }
  return { reply: textBlock.text };
}
