import { useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Minus, Package, Search } from 'lucide-react';
import { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import type { Equipment } from '../types';
import StepHeader from '../components/StepHeader';
import StepNavigation from '../components/StepNavigation';
import { clsx } from 'clsx';

// Equipment catalog — will be expanded in next phases with real data/images
const CATALOG: (Equipment & { desc: string })[] = [
  // Musculação
  { id: 'supino-reto',        name: 'Supino Reto',              category: 'Musculação', categoryLabel: 'Musculação', price: 0, quantity: 1, desc: 'Banco de supino com regulagem de inclinação' },
  { id: 'rack-olimpico',      name: 'Rack Olímpico',            category: 'Musculação', categoryLabel: 'Musculação', price: 0, quantity: 1, desc: 'Estrutura para treinos de força e levantamento' },
  { id: 'polia-dupla',        name: 'Polia Dupla',              category: 'Musculação', categoryLabel: 'Musculação', price: 0, quantity: 1, desc: 'Polia ajustável para múltiplos exercícios' },
  { id: 'leg-press',          name: 'Leg Press 45°',            category: 'Musculação', categoryLabel: 'Musculação', price: 0, quantity: 1, desc: 'Equipamento para membros inferiores' },
  { id: 'cadeira-extensora',  name: 'Cadeira Extensora',        category: 'Musculação', categoryLabel: 'Musculação', price: 0, quantity: 1, desc: 'Isolamento de quadríceps' },
  { id: 'mesa-flexora',       name: 'Mesa Flexora',             category: 'Musculação', categoryLabel: 'Musculação', price: 0, quantity: 1, desc: 'Isolamento de isquiotibiais' },
  { id: 'smith-machine',      name: 'Smith Machine',            category: 'Musculação', categoryLabel: 'Musculação', price: 0, quantity: 1, desc: 'Barra guiada para treinos seguros' },
  { id: 'remada-baixa',       name: 'Remada Baixa',             category: 'Musculação', categoryLabel: 'Musculação', price: 0, quantity: 1, desc: 'Fortalecimento das costas' },
  // Cardio
  { id: 'esteira',            name: 'Esteira Motorizada',       category: 'Cardio',       categoryLabel: 'Cardio',       price: 0, quantity: 1, desc: 'Esteira com inclinação automática e painel digital' },
  { id: 'bicicleta-ergom',    name: 'Bicicleta Ergométrica',    category: 'Cardio',       categoryLabel: 'Cardio',       price: 0, quantity: 1, desc: 'Ciclismo indoor com resistência ajustável' },
  { id: 'eliptico',           name: 'Elíptico',                 category: 'Cardio',       categoryLabel: 'Cardio',       price: 0, quantity: 1, desc: 'Treino de baixo impacto articular' },
  { id: 'remo-indoor',        name: 'Remo Indoor',              category: 'Cardio',       categoryLabel: 'Cardio',       price: 0, quantity: 1, desc: 'Treino aeróbico completo com resistência a ar' },
  // Funcional
  { id: 'colchao-yoga',       name: 'Colchão Yoga / Pilates',   category: 'Funcional',    categoryLabel: 'Funcional',    price: 0, quantity: 1, desc: 'Base para exercícios de solo' },
  { id: 'kettlebell-set',     name: 'Set Kettlebells',          category: 'Funcional',    categoryLabel: 'Funcional',    price: 0, quantity: 1, desc: 'Kit de kettlebells 4 a 32kg' },
  { id: 'barra-fixa',         name: 'Torre Barra Fixa',         category: 'Funcional',    categoryLabel: 'Funcional',    price: 0, quantity: 1, desc: 'Barra para treinos de calistenia' },
  { id: 'corda-naval',        name: 'Corda Naval',              category: 'Funcional',    categoryLabel: 'Funcional',    price: 0, quantity: 1, desc: 'Corda para HIIT e treino funcional' },
  { id: 'slam-ball',          name: 'Slam Ball Set',            category: 'Funcional',    categoryLabel: 'Funcional',    price: 0, quantity: 1, desc: 'Bolas de impacto para treino dinâmico' },
  // Suporte
  { id: 'painel-espelho',     name: 'Painel de Espelhos',       category: 'Suporte',      categoryLabel: 'Suporte',      price: 0, quantity: 1, desc: 'Espelhos de parede para monitoramento postural' },
  { id: 'tapete-borracha',    name: 'Piso de Borracha',         category: 'Suporte',      categoryLabel: 'Suporte',      price: 0, quantity: 1, desc: 'Piso antiderrapante e amortecedor de impacto' },
  { id: 'bebedouro',          name: 'Bebedouro Industrial',     category: 'Suporte',      categoryLabel: 'Suporte',      price: 0, quantity: 1, desc: 'Hidratação para o ambiente' },
];

const CATEGORIES = Array.from(new Set(CATALOG.map(e => e.category)));

export default function EquipamentosPage() {
  const navigate = useNavigate();
  const { state, addEquipment, removeEquipment, updateEquipmentQty, setStep } = usePlanner();
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [search, setSearch] = useState('');

  const selected = state.data.selectedEquipment ?? [];

  const filtered = CATALOG.filter(eq => {
    const matchCat = activeCategory === 'Todos' || eq.category === activeCategory;
    const matchSearch = eq.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function getQty(id: string) {
    return selected.find(e => e.id === id)?.quantity ?? 0;
  }

  function isSelected(id: string) {
    return selected.some(e => e.id === id);
  }

  function handleToggle(eq: typeof CATALOG[0]) {
    if (isSelected(eq.id)) {
      removeEquipment(eq.id);
    } else {
      addEquipment({ id: eq.id, name: eq.name, category: eq.category, categoryLabel: eq.categoryLabel, price: eq.price, quantity: 1 });
    }
  }

  function handleQtyChange(id: string, delta: number) {
    const current = getQty(id);
    const next = current + delta;
    if (next <= 0) { removeEquipment(id); return; }
    updateEquipmentQty(id, next);
  }

  function handleNext() {
    setStep(6);
    navigate('/revisao');
  }

  function handleBack() {
    setStep(4);
    navigate('/perfil');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 page-enter">
      <StepHeader
        stepNumber={5}
        title="Selecione os Equipamentos"
        subtitle="Escolha os equipamentos para compor seu projeto. Você pode ajustar as quantidades."
        icon={<Dumbbell size={22} />}
      />

      {/* Selected summary */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-supertech-500/10 border border-supertech-500/20">
          <Package size={15} className="text-supertech-400" />
          <span className="text-sm font-semibold text-supertech-400">
            {selected.length} {selected.length === 1 ? 'equipamento selecionado' : 'equipamentos selecionados'}
          </span>
          <span className="text-xs text-supertech-600 ml-auto">
            {selected.reduce((s, e) => s + e.quantity, 0)} unidades no total
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          className="input-dark pl-9"
          placeholder="Buscar equipamentos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['Todos', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
              activeCategory === cat
                ? 'bg-supertech-500 text-dark-950'
                : 'bg-surface-card border border-surface-border text-slate-400 hover:border-supertech-700 hover:text-white',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Equipment grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {filtered.map(eq => {
          const qty = getQty(eq.id);
          const sel = isSelected(eq.id);
          return (
            <div
              key={eq.id}
              className={clsx(
                'card p-4 transition-all duration-200',
                sel && 'border-supertech-500/60 bg-surface-elevated shadow-green-sm',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white">{eq.name}</span>
                    <span className="badge-dark text-[10px]">{eq.category}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{eq.desc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
                <button
                  onClick={() => handleToggle(eq)}
                  className={clsx(
                    'text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150',
                    sel
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                      : 'text-supertech-400 hover:bg-supertech-500/10',
                  )}
                >
                  {sel ? 'Remover' : '+ Adicionar'}
                </button>

                {sel && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQtyChange(eq.id, -1)}
                      className="w-7 h-7 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-slate-400 hover:text-white hover:border-supertech-600 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-bold text-white w-4 text-center">{qty}</span>
                    <button
                      onClick={() => handleQtyChange(eq.id, +1)}
                      className="w-7 h-7 rounded-lg bg-supertech-500/20 border border-supertech-500/30 flex items-center justify-center text-supertech-400 hover:bg-supertech-500/30 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <StepNavigation
        onBack={handleBack}
        onNext={handleNext}
        canGoNext={selected.length > 0}
        nextLabel={selected.length > 0 ? `Continuar com ${selected.length} equipamento${selected.length > 1 ? 's' : ''}` : 'Selecione ao menos 1'}
      />
    </div>
  );
}
