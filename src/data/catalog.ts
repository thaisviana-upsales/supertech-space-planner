// ── catalog.ts — Base oficial de produtos Supertech ───────────────────────────
// Fonte: src/data/supertechProducts.ts (gerado a partir de MAPA DE EQUIPAMENTOS.ANTIGRAVITY.SUBIDA 25.06.xlsx)
// Os produtos fictícios foram removidos. Esta base usa apenas equipamentos oficiais.

import type { Equipment } from '../types';
import { supertechProducts, type SupertechProduct } from './supertechProducts';

export type TabKey = 'cardio' | 'musculacao' | 'strong';

export interface CatalogProduct extends Omit<Equipment, 'quantity'> {
  code: string;
  description: string;
  bateriaKg?: string | number | null;
  precoFormatado?: string;
}

// ── Map SupertechProduct → CatalogProduct ────────────────────────────────────
function mapCategory(cat: SupertechProduct['categoria']): { category: string; categoryLabel: string } {
  switch (cat) {
    case 'Cardio':     return { category: 'cardio',     categoryLabel: 'Cardio' };
    case 'Musculação': return { category: 'musculacao', categoryLabel: 'Musculação' };
    case 'Strong':     return { category: 'strong',     categoryLabel: 'Strong' };
  }
}

function toCatalogProduct(p: SupertechProduct): CatalogProduct {
  const { category, categoryLabel } = mapCategory(p.categoria);
  return {
    id:             p.id,
    code:           p.codigo,
    name:           p.nome,
    category,
    categoryLabel,
    price:          p.preco,
    description:    p.descricao,
    bateriaKg:      p.bateriaKg,
    precoFormatado: p.precoFormatado,
    imageUrl:       p.image || undefined,  // campo image → imageUrl (Equipment)
  };
}

// ── CATALOG agrupado por aba ──────────────────────────────────────────────────
export const CATALOG: Record<TabKey, CatalogProduct[]> = {
  cardio:     supertechProducts.filter(p => p.categoria === 'Cardio').map(toCatalogProduct),
  musculacao: supertechProducts.filter(p => p.categoria === 'Musculação').map(toCatalogProduct),
  strong:     supertechProducts.filter(p => p.categoria === 'Strong').map(toCatalogProduct),
};

export const ALL_CATALOG = Object.values(CATALOG).flat();

export function formatPrice(n: number): string {
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
