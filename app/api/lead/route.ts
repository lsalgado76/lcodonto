import { NextRequest, NextResponse } from "next/server";
import type { CaptureLeadInput } from "@/lib/lead-tool";
import { processLead } from "@/lib/process-lead";

interface LeadResponse {
  ok: boolean;
}

export async function POST(req: NextRequest): Promise<NextResponse<LeadResponse>> {
  try {
    const body: CaptureLeadInput = await req.json();

    if (!body.nome || !body.contato || !body.area_interesse || !body.contexto) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // processLead absorve falhas de e-mail internamente (RF11) — nunca lança aqui
    await processLead(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Só chega aqui por erro de parse do JSON (payload inválido)
    console.error("[/api/lead]", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}