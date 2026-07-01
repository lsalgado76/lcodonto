import { GoogleGenAI } from "@google/genai";
import type { Content } from "@google/genai";
import {
  captureLeadToolGemini,
  type CaptureLeadInput,
  type LLMResult,
} from "./lead-tool";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function callGemini(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<LLMResult> {
  const contents: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: system,
      maxOutputTokens: 400,
      temperature: 0.85,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [captureLeadToolGemini as any],
    },
  });

  // Detecta function call no primeiro candidato
  const candidate = response.candidates?.[0];
  const fnPart = candidate?.content?.parts?.find((p) => p.functionCall != null);

  if (fnPart?.functionCall?.name === "capture_lead") {
    const leadInput = fnPart.functionCall.args as unknown as CaptureLeadInput;
    const modelContent = candidate!.content;

    // Devolve o resultado da tool para o modelo gerar a resposta final ao usuário
    const toolResultContent: Content = {
      role: "user",
      parts: [
        {
          functionResponse: {
            name: "capture_lead",
            response: { result: "Lead registrado com sucesso." },
          },
        },
      ],
    };

    const followUp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contents: [...contents, modelContent, toolResultContent] as any,
      config: {
        systemInstruction: system,
        maxOutputTokens: 400,
        temperature: 0.85,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [captureLeadToolGemini as any],
      },
    });

    return { reply: followUp.text ?? "", leadCaptured: leadInput };
  }

  const text = response.text;
  if (!text) throw new Error("Resposta vazia da Gemini API");
  return { reply: text };
}
