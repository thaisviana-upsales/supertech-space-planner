import { Shield, Lock } from 'lucide-react';

// Hidden admin panel — accessed via triple-click on version badge in header
// Full implementation will be added in a later phase
export default function AdminPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Shield size={20} className="text-amber-400" />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-0.5">Restrito</div>
          <h1 className="text-xl font-bold text-white">Painel Administrativo</h1>
        </div>
        <div className="ml-auto flex items-center gap-1.5 badge-dark">
          <Lock size={11} />
          <span>Acesso Interno</span>
        </div>
      </div>

      {/* Placeholder */}
      <div className="card p-12 text-center">
        <Shield size={40} className="text-slate-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Painel em Desenvolvimento</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          O painel administrativo será implementado na próxima fase do projeto,
          com visualização de leads, projetos enviados, filtros e exportação de dados.
        </p>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total de Projetos', value: '—' },
            { label: 'Enviados Hoje', value: '—' },
            { label: 'Esta Semana', value: '—' },
            { label: 'Este Mês', value: '—' },
          ].map(stat => (
            <div key={stat.label} className="card-elevated p-4 text-center">
              <div className="text-2xl font-black text-supertech-400 mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
