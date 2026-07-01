import { google } from "googleapis";
import type { CaptureLeadInput } from "./lead-tool";

// OAuth2 client criado uma vez — googleapis gerencia refresh automático do access token
const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth });

function buildRawEmail(lead: CaptureLeadInput, timestamp: string): string {
  const from = process.env.GMAIL_SENDER_ADDRESS!;
  const to = process.env.LEAD_NOTIFICATION_EMAIL!;
  const subject = `Novo lead via widget : ${lead.area_interesse}`;

  const body = [
    `Nome:              ${lead.nome}`,
    `Contato:           ${lead.contato}`,
    `Área de interesse: ${lead.area_interesse}`,
    `Contexto:          ${lead.contexto}`,
    `Timestamp:         ${timestamp}`,
  ].join("\n");

  // Formato RFC 2822 — Gmail API exige base64url do e-mail completo
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ].join("\n");

  return Buffer.from(message).toString("base64url");
}

export async function sendLeadNotification(lead: CaptureLeadInput): Promise<void> {
  const timestamp = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "medium",
  });

  const raw = buildRawEmail(lead, timestamp);

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}
