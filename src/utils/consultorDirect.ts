/**
 * consultorDirect.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Lógica centralizada para o botão "Falar com consultor" antes da finalização.
 *
 * Reaproveitamos exatamente a mesma função resolveWhatsappDestination já usada
 * no envio final do orçamento (PreviaPage / ConfirmacaoPage).
 *
 * NUNCA duplica mapa de DDD. NUNCA usa número fixo/teste.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import {
  resolveWhatsappDestination,
  openWhatsappWithDestination,
  extractDDDFromPhone,
  buildDestinationSuffix,
  type RoutingDestination,
} from '../data/whatsappRouting';
import { upsertLeadFromData } from './leadStorage';
import { saveLeadToSheets, saveEventToSheets } from '../services/googleSheets';
import type { ProjectData, InvestmentRange } from '../types';

// ── Números proibidos / de teste ──────────────────────────────────────────────
const FORBIDDEN_NUMBERS = new Set([
  '11964634949',
  '5511964634949',
  '11992354185',
  '5511992354185',
]);

/**
 * Valida que o destino final não é um número proibido.
 * Retorna true se for seguro, false se bloqueado.
 */
export function isDestinationSafe(destination: RoutingDestination): boolean {
  const num = destination.whatsapp.replace(/\D/g, '');
  if (FORBIDDEN_NUMBERS.has(num)) {
    console.error(
      `[ConsultorDireto] Destino inválido: número de teste/comercial geral não pode ser usado. Número bloqueado: ${num}`,
    );
    return false;
  }
  return true;
}

// ── Dados mínimos para rotear ─────────────────────────────────────────────────
export interface ConsultorDirectLeadData {
  name?: string;
  phone?: string;
  telefone?: string;
  whatsapp?: string;
  city?: string;
  uf?: string;
  codigoPrevia?: string;
  // Dados opcionais já preenchidos em etapas anteriores
  objectiveLabel?: string;
  investmentLabel?: string;
  deadlineLabel?: string;
  profileLabel?: string;
  segment?: string;
  investmentRange?: InvestmentRange | string;
}

// ── Mensagem para consultor direto (sem prévia finalizada) ────────────────────
export function buildConsultorDirectMessage(
  lead: ConsultorDirectLeadData,
  destination?: RoutingDestination,
): string {
  const ddd = destination?.leadDdd || extractDDDFromPhone(lead.phone || lead.telefone || lead.whatsapp) || 'não identificado';

  const lines: string[] = [
    'Olá, equipe Supertech! Tudo bem? 👋',
    '',
    'Tenho interesse em falar com um consultor sobre equipamentos fitness.',
    '',
    '📌 Origem: Supertech Space Planner™',
    `👤 Nome: ${lead.name || 'Não informado'}`,
    `📲 WhatsApp: ${lead.phone || lead.telefone || lead.whatsapp || 'Não informado'}`,
    `📍 Localidade: ${lead.city || '—'}/${lead.uf || '—'}`,
    `☎️ DDD identificado: ${ddd}`,
    '',
    'Ainda não finalizei a prévia completa, mas gostaria de atendimento comercial para tirar dúvidas e avançar no projeto.',
  ];

  // Adicionar dados já preenchidos, se existirem
  const hasExtraData =
    lead.objectiveLabel || lead.investmentLabel || lead.deadlineLabel ||
    lead.profileLabel || lead.segment;

  if (hasExtraData) {
    lines.push('');
    lines.push('🏋️ Dados já informados:');
    if (lead.objectiveLabel) lines.push(`• Objetivo: ${lead.objectiveLabel}`);
    if (lead.investmentLabel) lines.push(`• Investimento estimado: ${lead.investmentLabel}`);
    if (lead.deadlineLabel) lines.push(`• Prazo: ${lead.deadlineLabel}`);
    const seg = lead.profileLabel || lead.segment;
    if (seg) lines.push(`• Segmento: ${seg}`);
  }

  lines.push('');
  lines.push('Aguardo o contato de um consultor Supertech. 🚀');

  if (destination) {
    lines.push(buildDestinationSuffix(destination));
  }

  return lines.join('\n');
}

// ── Salvar lead parcial ───────────────────────────────────────────────────────
/**
 * Salva o lead como registro parcial de "consultor direto".
 * Usa o mesmo mecanismo que o fluxo final (upsertLeadFromData + Sheets).
 */
export function saveConsultorDirectLead(
  lead: ConsultorDirectLeadData,
  destination: RoutingDestination,
): void {
  const phoneVal = lead.phone || lead.telefone || lead.whatsapp || '';
  const projectData: Partial<ProjectData> = {
    name:               lead.name,
    phone:              phoneVal,
    city:               lead.city,
    uf:                 lead.uf,
    codigoPrevia:       lead.codigoPrevia,
    objectiveLabel:     lead.objectiveLabel,
    investmentLabel:    lead.investmentLabel,
    investmentRange:    lead.investmentRange as InvestmentRange | undefined,
    deadlineLabel:      lead.deadlineLabel,
    profileLabel:       lead.profileLabel,
    sentToConsultor:    true,
    // Routing
    vendedorNome:       destination.vendedorNome,
    vendedorWhatsapp:   destination.whatsapp,
    regiaoAtendimento:  destination.regiaoAtendimento,
    roteamentoCriterio: destination.roteamentoCriterio,
    roteamentoChave:    destination.roteamentoChave,
  };

  // Salvar no localStorage (passo 9 = consultor_direto, mais avançado que qualquer etapa normal)
  upsertLeadFromData(projectData as ProjectData, 9);

  // Salvar no Google Sheets (non-blocking)
  const ddd = destination.leadDdd || extractDDDFromPhone(phoneVal) || '';
  saveLeadToSheets({
    codigoPrevia:         lead.codigoPrevia ?? '',
    nome:                 lead.name,
    telefone:             phoneVal,
    cidade:               lead.city,
    uf:                   lead.uf,
    segmento:             lead.profileLabel || lead.segment,
    objetivo:             lead.objectiveLabel,
    investimentoEstimado: lead.investmentLabel,
    prazo:                lead.deadlineLabel,
    ultimaEtapa:          'consultor_direto',
    status:               'consultor_direto',
    enviouConsultor:      true,
    vendedorNome:         destination.vendedorNome,
    vendedorWhatsapp:     destination.whatsapp,
    regiaoAtendimento:    destination.regiaoAtendimento,
    roteamentoCriterio:   destination.roteamentoCriterio,
    roteamentoChave:      destination.roteamentoChave,
    origem:               'botao_falar_com_consultor',
    consentimentoLgpd:    true,
  });

  saveEventToSheets(
    lead.codigoPrevia ?? '',
    'FalarConsultor',
    'clicou',
    `DDD:${ddd} | Destino:${destination.vendedorNome}`,
  );
}

// ── Função principal ──────────────────────────────────────────────────────────
/**
 * Abre WhatsApp para o consultor correto baseado no DDD do lead.
 * Usa exatamente a mesma função resolveWhatsappDestination do envio final.
 *
 * @returns true se abriu com sucesso, false se bloqueado.
 */
export function openConsultorDirect(lead: ConsultorDirectLeadData): boolean {
  const phoneVal = lead.phone || lead.telefone || lead.whatsapp || '';

  const destination = resolveWhatsappDestination({
    phone:        phoneVal,
    telefone:     phoneVal,
    city:         lead.city,
    uf:           lead.uf,
    codigoPrevia: lead.codigoPrevia,
  });

  // ── Trava de segurança ──────────────────────────────────────────────────
  if (!isDestinationSafe(destination)) {
    return false;
  }

  // ── Montar mensagem ───────────────────────────────────────────────────────
  const message = buildConsultorDirectMessage(lead, destination);

  // ── Salvar lead parcial ───────────────────────────────────────────────────
  saveConsultorDirectLead(lead, destination);

  // ── Abrir WhatsApp com logs obrigatórios ──────────────────────────────────
  openWhatsappWithDestination(destination, message, {
    phone:        phoneVal,
    telefone:     phoneVal,
    city:         lead.city,
    uf:           lead.uf,
    codigoPrevia: lead.codigoPrevia,
  });

  return true;
}

