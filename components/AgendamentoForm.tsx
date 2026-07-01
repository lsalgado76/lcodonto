"use client";

import { useState, type FormEvent } from "react";
import { SERVICOS, UNIDADES } from "@/content/site-config";
import { BUTTON_MICRO } from "@/lib/ui";

type Status = "idle" | "loading" | "success" | "error";

export function AgendamentoForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/clinic-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: data.get("nome"),
          whatsapp: data.get("whatsapp"),
          unidade: data.get("unidade"),
          servico: data.get("servico"),
          mensagem: data.get("mensagem"),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Não foi possível enviar. Tente novamente.");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Erro inesperado.");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-rose-light bg-white p-8 text-center shadow-sm"
      >
        <p className="font-serif text-xl text-charcoal">
          Recebemos sua solicitação!
        </p>
        <p className="mt-2 text-charcoal/70">
          A Dra. Lygia entrará em contato em breve pelo WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-rose-light bg-white p-6 shadow-sm sm:p-8">
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-charcoal">
          Nome completo <span className="text-rose-dark">*</span>
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          autoComplete="name"
          className="mt-1.5 w-full rounded-xl border border-charcoal/15 px-4 py-3 text-base outline-none transition-colors duration-200 focus:border-rose-dark"
        />
      </div>

      <div>
        <label htmlFor="whatsapp" className="block text-sm font-medium text-charcoal">
          WhatsApp <span className="text-rose-dark">*</span>
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          required
          autoComplete="tel"
          placeholder="(41) 90000-0000"
          className="mt-1.5 w-full rounded-xl border border-charcoal/15 px-4 py-3 text-base outline-none transition-colors duration-200 focus:border-rose-dark"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-charcoal">
          Unidade <span className="text-rose-dark">*</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {UNIDADES.map((u) => (
            <label
              key={u.nome}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-charcoal/15 px-4 py-2.5 text-sm has-checked:border-rose-dark has-checked:bg-rose-light has-checked:text-charcoal"
            >
              <input
                type="radio"
                name="unidade"
                value={u.nome}
                required
                className="accent-rose-dark"
              />
              {u.nome}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="servico" className="block text-sm font-medium text-charcoal">
          Serviço de interesse <span className="text-rose-dark">*</span>
        </label>
        <select
          id="servico"
          name="servico"
          required
          defaultValue=""
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-base outline-none transition-colors duration-200 focus:border-rose-dark"
        >
          <option value="" disabled>
            Selecione um serviço
          </option>
          {SERVICOS.map((s) => (
            <option key={s.nome} value={s.nome}>
              {s.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="mensagem" className="block text-sm font-medium text-charcoal">
          Mensagem <span className="text-charcoal/50">(opcional)</span>
        </label>
        <textarea
          id="mensagem"
          name="mensagem"
          rows={3}
          className="mt-1.5 w-full resize-none rounded-xl border border-charcoal/15 px-4 py-3 text-base outline-none transition-colors duration-200 focus:border-rose-dark"
        />
      </div>

      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className={`w-full cursor-pointer rounded-full bg-rose px-7 py-3.5 text-sm font-semibold text-charcoal shadow-sm transition-colors duration-200 hover:bg-rose-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:brightness-100 ${BUTTON_MICRO}`}
      >
        {status === "loading" ? "Enviando..." : "Solicitar agendamento"}
      </button>
    </form>
  );
}
