import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

type Pilar = "wibag-5g" | "ia-bi-dev";

type LeadPayload = {
  nome: string;
  email: string;
  telefone?: string;
  mensagem?: string;
  pilar: Pilar;
  consentimento: boolean;
};

const PILAR_LABELS: Record<Pilar, string> = {
  "wibag-5g": "Infraestrutura 5G (Wibag)",
  "ia-bi-dev": "IA · BI · Desenvolvimento",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function validate(
  body: unknown
): { ok: true; data: LeadPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Corpo da requisição inválido." };
  }

  const b = body as Record<string, unknown>;

  if (!b.nome || typeof b.nome !== "string" || !b.nome.trim()) {
    return { ok: false, error: "Nome é obrigatório." };
  }

  if (
    !b.email ||
    typeof b.email !== "string" ||
    !EMAIL_RE.test(b.email.trim())
  ) {
    return { ok: false, error: "E-mail inválido." };
  }

  if (b.consentimento !== true) {
    return { ok: false, error: "Consentimento LGPD obrigatório." };
  }

  if (!b.pilar || !Object.keys(PILAR_LABELS).includes(b.pilar as string)) {
    return { ok: false, error: "Pilar inválido." };
  }

  return {
    ok: true,
    data: {
      nome: b.nome.trim(),
      email: b.email.trim(),
      telefone:
        typeof b.telefone === "string" && b.telefone.trim()
          ? b.telefone.trim()
          : undefined,
      mensagem:
        typeof b.mensagem === "string" && b.mensagem.trim()
          ? b.mensagem.trim()
          : undefined,
      pilar: b.pilar as Pilar,
      consentimento: true,
    },
  };
}

function buildEmail(data: LeadPayload, gmailUser: string) {
  const pilarLabel = PILAR_LABELS[data.pilar];
  const timestamp = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "medium",
  });

  const text = [
    "Novo lead via site Seere Digital",
    "",
    `Nome:      ${data.nome}`,
    `E-mail:    ${data.email}`,
    `Telefone:  ${data.telefone ?? "(não informado)"}`,
    `Pilar:     ${pilarLabel}`,
    `Mensagem:  ${data.mensagem ?? "(não informada)"}`,
    "",
    `Consentimento LGPD: Sim — ${timestamp}`,
  ].join("\n");

  const mensagemRow = data.mensagem
    ? `<tr>
        <td style="padding:8px 0;color:#64748B;font-size:14px;vertical-align:top;width:110px;">Mensagem</td>
        <td style="padding:8px 0;white-space:pre-wrap;">${escapeHtml(data.mensagem)}</td>
       </tr>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
    <div style="background:#0F172A;padding:24px 28px;">
      <p style="margin:0;color:#94A3B8;font-size:11px;letter-spacing:.1em;text-transform:uppercase;">Seere Digital</p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:700;">Novo Lead</h1>
    </div>
    <div style="padding:28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#64748B;font-size:14px;width:110px;">Nome</td>
          <td style="padding:8px 0;font-weight:600;">${escapeHtml(data.nome)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748B;font-size:14px;">E-mail</td>
          <td style="padding:8px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#0369A1;">${escapeHtml(data.email)}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748B;font-size:14px;">Telefone</td>
          <td style="padding:8px 0;">${escapeHtml(data.telefone ?? "(não informado)")}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748B;font-size:14px;">Pilar</td>
          <td style="padding:8px 0;">
            <span style="background:#0369A1;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">${escapeHtml(pilarLabel)}</span>
          </td>
        </tr>
        ${mensagemRow}
      </table>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0;">
      <p style="margin:0;font-size:11px;color:#94A3B8;">
        Consentimento LGPD: <strong>Sim</strong> — coletado em ${timestamp}
      </p>
    </div>
  </div>
</body>
</html>`;

  return {
    from: `"Site Seere Digital" <${gmailUser}>`,
    to: gmailUser,
    subject: `[Lead] ${pilarLabel} — ${data.nome}`,
    text,
    html,
  };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido." },
      { status: 400 }
    );
  }

  const result = validate(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    console.error(
      "[api/landing-lead] Variáveis GMAIL_USER e/ou GMAIL_APP_PASSWORD não configuradas."
    );
    return NextResponse.json(
      { error: "Serviço de e-mail não configurado." },
      { status: 503 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPassword },
  });

  try {
    await transporter.sendMail(buildEmail(result.data, gmailUser));
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[api/landing-lead] Erro ao enviar e-mail:", err);
    return NextResponse.json(
      { error: "Falha ao enviar e-mail. Tente novamente." },
      { status: 500 }
    );
  }
}
