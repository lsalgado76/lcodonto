import { NextRequest, NextResponse } from "next/server";
import { processLead } from "@/lib/process-lead";

interface ClinicLeadPayload {
  nome: string;
  whatsapp: string;
  unidade: string;
  servico: string;
  mensagem?: string;
}

function validate(body: unknown): ClinicLeadPayload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  if (typeof b.nome !== "string" || !b.nome.trim()) return null;
  if (typeof b.whatsapp !== "string" || !b.whatsapp.trim()) return null;
  if (typeof b.unidade !== "string" || !b.unidade.trim()) return null;
  if (typeof b.servico !== "string" || !b.servico.trim()) return null;

  return {
    nome: b.nome.trim(),
    whatsapp: b.whatsapp.trim(),
    unidade: b.unidade.trim(),
    servico: b.servico.trim(),
    mensagem: typeof b.mensagem === "string" && b.mensagem.trim() ? b.mensagem.trim() : undefined,
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const data = validate(body);
  if (!data) {
    return NextResponse.json(
      { error: "Preencha nome, WhatsApp, unidade e serviço." },
      { status: 400 }
    );
  }

  const contexto = [
    `Unidade: ${data.unidade}`,
    `Serviço de interesse: ${data.servico}`,
    data.mensagem ? `Mensagem: ${data.mensagem}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  // processLead nunca lança — falha de e-mail/Supabase é absorvida internamente
  await processLead({
    nome: data.nome,
    contato: data.whatsapp,
    area_interesse: "geral",
    contexto,
    clientId: process.env.WIDGET_CLIENT_ID,
  });

  return NextResponse.json({ ok: true });
}
