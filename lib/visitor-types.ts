export type InterestPillar = string | null;

export interface VisitorContext {
  visitor_id: string;
  interest: InterestPillar;
  stage: "novo" | "qualificado" | "convertido";
  context_summary: string | null;
  last_visit: string;
  visit_count: number;
  converted: boolean;
  expires_at: string;
}

export type SaveContextFn = (
  updates: Partial<Omit<VisitorContext, "visitor_id" | "expires_at">>
) => void;
