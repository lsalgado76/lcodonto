// Tipos compartilhados entre os dois providers e o restante do código
export interface CaptureLeadInput {
  nome: string;
  contato: string;
  area_interesse: "wibag" | "ai-customer-service" | "bi" | "software-dev" | "geral";
  contexto: string;
}

// Tipo de retorno unificado de callGemini / callClaude — mantém o contrato da Seção 4
export interface LLMResult {
  reply: string;
  leadCaptured?: CaptureLeadInput;
}

// ─── Texto compartilhado ────────────────────────────────────────────────────

const DESCRIPTION =
  "Registra um lead qualificado quando o visitante demonstrou interesse comercial real " +
  "e forneceu (ou está disposto a fornecer) nome e contato. Use apenas quando houver " +
  "intenção clara, não em toda mensagem.";

const REQUIRED = ["nome", "contato", "area_interesse", "contexto"] as const;

// ─── Schema para Gemini (@google/genai) ────────────────────────────────────
// Gemini usa wrapper functionDeclarations[] e tipos em SCREAMING_CASE ("OBJECT", "STRING")

export const captureLeadToolGemini = {
  functionDeclarations: [
    {
      name: "capture_lead",
      description: DESCRIPTION,
      parameters: {
        type: "OBJECT",
        properties: {
          nome: { type: "STRING", description: "Nome informado pelo visitante" },
          contato: { type: "STRING", description: "E-mail ou WhatsApp informado pelo visitante" },
          area_interesse: {
            type: "STRING",
            enum: ["wibag", "ai-customer-service", "bi", "software-dev", "geral"],
            description: "Pilar de negócio identificado como interesse principal",
          },
          contexto: {
            type: "STRING",
            description: "Resumo curto (1-2 frases) da necessidade/contexto relatado pelo visitante",
          },
        },
        required: REQUIRED,
      },
    },
  ],
};

// ─── Schema para Anthropic (@anthropic-ai/sdk) ─────────────────────────────
// Anthropic usa definição plana com input_schema e tipos em lowercase ("object", "string")

export const captureLeadToolAnthropic = {
  name: "capture_lead",
  description: DESCRIPTION,
  input_schema: {
    type: "object" as const,
    properties: {
      nome: { type: "string", description: "Nome informado pelo visitante" },
      contato: { type: "string", description: "E-mail ou WhatsApp informado pelo visitante" },
      area_interesse: {
        type: "string",
        enum: ["wibag", "ai-customer-service", "bi", "software-dev", "geral"],
        description: "Pilar de negócio identificado como interesse principal",
      },
      contexto: {
        type: "string",
        description: "Resumo curto (1-2 frases) da necessidade/contexto relatado pelo visitante",
      },
    },
    required: [...REQUIRED],
  },
};
