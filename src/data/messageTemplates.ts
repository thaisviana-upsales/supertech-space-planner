import type { LeadRecord } from '../utils/leadStorage';
import { getLastStepLabel } from '../utils/leadStorage';

// ── Link da ferramenta (altere aqui se mudar o domínio) ────────────────────────
export const SPACE_PLANNER_LINK = 'https://supertech-planner.lovable.app';

// ── Template type ─────────────────────────────────────────────────────────────
export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  body: string;
}

// ── Variable replacement ───────────────────────────────────────────────────────
export function replaceTemplateVariables(body: string, lead?: Partial<LeadRecord>): string {
  const nome     = lead?.name?.trim()            || '';
  const telefone = lead?.phone?.trim()           || 'Não informado';
  const cidade   = lead?.city?.trim()            || 'Não informado';
  const uf       = lead?.uf?.trim()              || 'Não informado';
  const segmento = lead?.segment?.trim()         || 'Não informado';
  const invest   = lead?.investmentLabel?.trim() || 'Não informado';
  const cat      = lead?.investmentCategory      || 'Não informado';
  const etapa    = getLastStepLabel(lead?.lastStepNum ?? 1, lead?.sentToConsultor);

  let result = body
    .replace(/\[Telefone\]/g,    telefone)
    .replace(/\[Cidade\]/g,      cidade)
    .replace(/\[UF\]/g,          uf)
    .replace(/\[Segmento\]/g,    segmento)
    .replace(/\[Investimento\]/g, invest)
    .replace(/\[Categoria\]/g,   cat)
    .replace(/\[UltimaEtapa\]/g, etapa)
    .replace(/\[LinkFerramenta\]/g, SPACE_PLANNER_LINK);

  // Handle [Nome] — if no name, fix the greeting
  if (nome) {
    result = result.replace(/\[Nome\]/g, nome);
  } else {
    result = result
      .replace(/Olá, \[Nome\], tudo bem\?/g, 'Olá, tudo bem?')
      .replace(/\[Nome\]/g, '');
  }

  return result;
}

// ── WhatsApp helpers ───────────────────────────────────────────────────────────
export function normalizeWhatsappNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 8) return null;
  return digits.startsWith('55') ? digits : '55' + digits;
}

export function openLeadWhatsapp(phone: string, message: string): void {
  const num = normalizeWhatsappNumber(phone);
  if (!num) return;
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ── Templates ─────────────────────────────────────────────────────────────────
export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'template-01',
    name: 'Cadastro recebido — convite para ferramenta',
    category: 'Primeiro contato',
    description: 'Mensagem inicial para lead que demonstrou interesse.',
    body:
`Olá, [Nome], tudo bem? 👋

Aqui é da Supertech. ✅ Recebemos seu cadastro de interesse nos nossos equipamentos fitness. 🏋️‍♂️

Temos uma ferramenta interativa onde você consegue conhecer melhor nossos equipamentos e montar uma primeira visão do seu projeto: 👇

🔗 [LinkFerramenta]

A partir disso, nosso consultor consegue te atender com mais precisão e indicar a melhor composição para o seu espaço. 🚀`,
  },
  {
    id: 'template-02',
    name: 'Começou a ferramenta e não concluiu',
    category: 'Lead não finalizou',
    description: 'Para lead que iniciou mas abandonou antes de concluir.',
    body:
`Olá, [Nome], tudo bem? 👋

Vi que você começou a acessar a ferramenta da Supertech, mas não finalizou sua prévia.

Você realmente tem interesse em entender melhor os equipamentos da Supertech para o seu projeto fitness?

Se preferir, posso te ajudar por aqui mesmo e tirar suas dúvidas antes de você continuar. 🏋️‍♂️

A ferramenta está aqui, caso queira seguir:
🔗 [LinkFerramenta]

Mas me chama por aqui também, que eu consigo te orientar no melhor caminho.`,
  },
  {
    id: 'template-03',
    name: 'Preencheu parte e parou',
    category: 'Lead parou no meio',
    description: 'Para lead que avançou algumas etapas mas não concluiu.',
    body:
`Olá, [Nome], tudo bem? 👋

Vi que você avançou em algumas etapas do Supertech Space Planner™, mas acabou não concluindo.

Você conseguiu ter uma visão melhor dos equipamentos e valores pela ferramenta que te enviei?

Se ficou alguma dúvida sobre investimento, modelos ou composição ideal para o seu espaço, posso te ajudar a partir daqui. ✅

Também pode continuar sua prévia por aqui:
🔗 [LinkFerramenta]`,
  },
  {
    id: 'template-04',
    name: 'Parou na etapa de investimento',
    category: 'Lead chegou no investimento',
    description: 'Para lead que chegou até a etapa de investimento.',
    body:
`Olá, [Nome], tudo bem? 👋

Vi que você chegou até a parte de investimento do seu projeto, mas não continuou a prévia.

Ficou alguma dúvida sobre faixa de valores, equipamentos ou sobre o que faz mais sentido para o seu espaço?

Posso te ajudar por aqui para entender melhor o seu objetivo e te direcionar para uma composição mais adequada. 🏋️‍♂️

Se quiser continuar pela ferramenta, o link é este:
🔗 [LinkFerramenta]`,
  },
  {
    id: 'template-05',
    name: 'Parou antes dos equipamentos',
    category: 'Lead chegou no perfil',
    description: 'Para lead que informou dados mas não chegou aos equipamentos.',
    body:
`Olá, [Nome], tudo bem? 👋

Vi que você chegou a informar parte dos dados do seu projeto, mas ainda não avançou para a escolha dos equipamentos.

Essa próxima etapa ajuda bastante, porque você consegue conhecer melhor as opções da Supertech e montar uma primeira visão do seu espaço fitness.

Ficou com alguma dúvida ou prefere que eu te ajude por aqui mesmo? 📲

Se quiser continuar, é só acessar:
🔗 [LinkFerramenta]`,
  },
  {
    id: 'template-06',
    name: 'Selecionou equipamentos e não enviou',
    category: 'Lead selecionou equipamentos',
    description: 'Para lead que selecionou equipamentos mas não enviou a prévia.',
    body:
`Olá, [Nome], tudo bem? 👋

Vi que você chegou a selecionar alguns equipamentos no Supertech Space Planner™, mas não enviou a prévia para análise.

Você conseguiu ter uma visão melhor dos equipamentos e valores?

Se quiser, posso te ajudar a revisar essa seleção e entender se ela faz sentido para o seu espaço, objetivo e investimento previsto. ✅

Para finalizar o envio da prévia, acesse:
🔗 [LinkFerramenta]

Ou me responde por aqui que eu continuo seu atendimento.`,
  },
  {
    id: 'template-07',
    name: 'Revisar seleção com consultor',
    category: 'Lead selecionou equipamentos',
    description: 'Para lead em dúvida sobre a composição de equipamentos.',
    body:
`Olá, [Nome], tudo bem? 👋

Vi sua seleção de equipamentos na ferramenta da Supertech e queria entender uma coisa:

Você ficou com alguma dúvida sobre quais equipamentos escolher ou sobre a melhor composição para o seu projeto?

Às vezes, um pequeno ajuste na seleção já muda bastante o aproveitamento do espaço e o investimento final.

Posso te ajudar a partir daqui. Quer que eu revise com você? 🏋️‍♂️`,
  },
  {
    id: 'template-08',
    name: 'Confirmar se ainda tem interesse',
    category: 'Retomada',
    description: 'Para lead pouco engajado que precisa de requalificação.',
    body:
`Olá, [Nome], tudo bem? 👋

Vi que você acessou a ferramenta da Supertech, mas não concluiu sua prévia.

Só para eu entender melhor: você ainda está avaliando equipamentos para montar ou renovar seu espaço fitness?

Se sim, posso te ajudar a tirar dúvidas sobre modelos, valores e melhor composição para o seu projeto.

Se preferir continuar pela ferramenta, segue o link:
🔗 [LinkFerramenta]`,
  },
  {
    id: 'template-09',
    name: 'Prévia recebida — próximos passos',
    category: 'Lead concluiu',
    description: 'Para lead que enviou a prévia pelo Space Planner™.',
    body:
`Olá, [Nome], tudo bem? 👋

Recebi sua prévia pelo Supertech Space Planner™. Obrigado por enviar as informações do seu projeto. ✅

Já consegui visualizar sua seleção de equipamentos, o perfil do espaço e a estimativa inicial.

Agora posso te ajudar a revisar se essa composição faz sentido para o seu objetivo e entender os próximos passos.

Para eu te orientar melhor: você pretende iniciar esse projeto em qual prazo?`,
  },
  {
    id: 'template-10',
    name: 'Projeto com potencial interessante',
    category: 'Lead qualificado',
    description: 'Para lead qualificado com projeto de alto valor.',
    body:
`Olá, [Nome], tudo bem? 👋

Recebi sua prévia pelo Supertech Space Planner™ e vi que seu projeto tem um potencial interessante. 🚀

Antes de te passar qualquer condição ou orientação mais específica, quero entender se a composição escolhida está alinhada ao seu espaço e ao prazo que você tem em mente.

Posso te ajudar a revisar os equipamentos e ajustar o melhor caminho para o seu projeto.

Você já tem uma previsão de início?`,
  },
  {
    id: 'template-11',
    name: 'Analisar composição do projeto',
    category: 'Follow-up consultivo',
    description: 'Mensagem consultiva para revisar a seleção com o lead.',
    body:
`Olá, [Nome], tudo bem? 👋

A sua prévia já me ajuda a entender melhor o que você está buscando.

O próximo passo é avaliarmos se os equipamentos selecionados fazem sentido para o seu espaço, perfil de uso e investimento previsto.

Às vezes, pequenos ajustes na composição já melhoram bastante o aproveitamento do projeto.

Posso te ajudar com essa análise. Qual seria o melhor horário para falarmos hoje? 📲`,
  },
  {
    id: 'template-12',
    name: 'Avançar enquanto está fresco',
    category: 'Follow-up comercial',
    description: 'Urgência leve para lead que demonstrou interesse recente.',
    body:
`Olá, [Nome], tudo bem? 👋

Passei para acompanhar sua prévia no Supertech Space Planner™.

Como você já demonstrou interesse nos equipamentos, vale avançarmos enquanto as informações ainda estão frescas para ajustar a composição e entender as melhores condições.

Consigo te ajudar com isso hoje.

Prefere que eu te chame por ligação ou seguimos por aqui mesmo? 📲`,
  },
  {
    id: 'template-13',
    name: 'Retomar atendimento',
    category: 'Retomada',
    description: 'Para lead que parou há algum tempo e precisa ser reaquecido.',
    body:
`Olá, [Nome], tudo bem? 👋

Estou retomando seu atendimento aqui pela Supertech.

Você chegou a demonstrar interesse nos nossos equipamentos e pode montar uma prévia rápida do seu projeto pela nossa ferramenta interativa:

🔗 [LinkFerramenta]

Com isso, você conhece melhor as opções e eu consigo te orientar com mais precisão sobre a melhor composição para o seu espaço. 🏋️‍♂️`,
  },
  {
    id: 'template-14',
    name: 'Encerramento de tentativa',
    category: 'Última tentativa',
    description: 'Última mensagem antes de encerrar o acompanhamento.',
    body:
`Olá, [Nome], tudo bem? 👋

Passei para saber se você ainda tem interesse em entender melhor os equipamentos da Supertech para o seu projeto fitness.

Você chegou a receber nossa ferramenta para montar uma primeira visão do seu projeto:

🔗 [LinkFerramenta]

Se ainda fizer sentido, posso te ajudar por aqui mesmo com dúvidas sobre equipamentos, valores e melhor composição para o seu espaço.

Quer que eu siga com seu atendimento?`,
  },
];

export const ALL_CATEGORIES = Array.from(new Set(MESSAGE_TEMPLATES.map(t => t.category)));
