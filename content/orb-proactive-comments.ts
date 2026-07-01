// Disparado quando o visitante permanece 20s numa seção sem abrir o chat
// (ver useTracker.ts / SeereWidget.tsx). Chaves = valores de data-section em app/page.tsx.
export const proactiveComments: Record<string, string> = {
  hero: "Olá! Notei que você está conhecendo a LC Odontologia — posso te ajudar a agendar sua consulta?",
  diferenciais: "Você merece um atendimento que entenda o seu ritmo e cuide de você sem pressa. Qual região fica mais prática na sua rotina: Centro ou Fazenda Rio Grande?",
  servicos: "Imagino que você esteja buscando o melhor resultado para o seu sorriso. Qual desses tratamentos mais chamou a sua atenção até agora?",
  "dra-lygia": "É muito bom saber com quem estamos tratando, não é? A Dra. Lygia é reconhecida por transformar a ida ao dentista em um momento leve. Quer que eu te conte como é a primeira consulta com ela?",
  agendamento: "Garantir o seu horário leva menos de um minuto e poupa você de adiar o cuidado com a sua saúde. Vamos escolher o melhor dia para você juntos?",
  unidades: "Para facilitar a sua vida, a estrutura da Dra. Lygia está pronta para te receber em dois pontos. Me conta: onde fica melhor para encaixar no seu dia?",
  depoimentos: "Mais do que dentes, nós cuidamos de pessoas. Quer ver o que os nossos pacientes dizem sobre a sensação de recuperar a segurança para sorrir?",
  faq: "Se tem alguma dúvida que ainda está te fazendo adiar o seu cuidado, me conta. Estou aqui justamente para te dar essa clareza.",
}
