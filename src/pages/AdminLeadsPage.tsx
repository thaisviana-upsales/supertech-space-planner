import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, RefreshCw, Trash2 } from 'lucide-react';
import {
  readLeads, ensureMockSeeded,
  getLastStepLabel, formatDateTime,
  type LeadRecord,
} from '../utils/leadStorage';
import WhatsAppModal from '../components/WhatsAppModal';
import AdminInstallCard from '../components/AdminInstallCard';

// ── Auth ──────────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = 'supertech';
const SESSION_KEY    = 'ssp_admin_auth';

// ── Helpers ───────────────────────────────────────────────────────────────────
const NI = 'Não informado';
function ni(v: string | undefined | null) { return v && v.trim() ? v.trim() : NI; }
function brl(v: number) { return v > 0 ? 'R$ ' + v.toLocaleString('pt-BR') : NI; }

const CAT_COLORS: Record<string, string> = {
  Profissional: 'bg-supertech-500/15 text-supertech-400 border-supertech-500/30',
  Premium:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Estratégico:  'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Enterprise:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

const DATE_OPTIONS = [
  { value: 'all',    label: 'Todos os períodos' },
  { value: 'today',  label: 'Hoje' },
  { value: '7days',  label: 'Últimos 7 dias' },
  { value: 'month',  label: 'Este mês' },
];

const SEGMENT_OPTIONS = [
  'Todos os segmentos', 'Academia', 'Condomínio', 'Hotel', 'Clube',
  'Estúdio', 'Incorporadora / Construtora', 'Personal / Educação Física',
  'Outro', 'Não informado',
];

const INVEST_OPTIONS = [
  { value: 'all',           label: 'Todos os investimentos' },
  { value: 'Profissional',  label: 'Profissional (até R$ 400k)' },
  { value: 'Premium',       label: 'Premium (R$ 400k – R$ 1M)' },
  { value: 'Estratégico',   label: 'Estratégico (R$ 1M – R$ 3M)' },
  { value: 'Enterprise',    label: 'Enterprise (acima de R$ 3M)' },
];

const ETAPA_OPTIONS = [
  'Todas as etapas', 'Início', 'Objetivo', 'Investimento', 'Prazo',
  'Perfil', 'Equipamentos', 'Prévia do projeto', 'Consultor Direto', 'Enviado',
];

const UF_LIST = [
  'Todos os estados','AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT',
  'MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

function matchesDate(lead: LeadRecord, filter: string): boolean {
  if (filter === 'all') return true;
  const d  = new Date(lead.createdAt);
  const now = new Date();
  if (filter === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (filter === '7days') {
    return (now.getTime() - d.getTime()) <= 7 * 86400_000;
  }
  if (filter === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  return true;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function KpiCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? 'bg-supertech-500/10 border-supertech-500/40' : 'bg-surface-card border-surface-border'}`}>
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-3xl font-black ${accent ? 'text-supertech-400' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function Sel({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="label-upper mb-1.5">{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-dark-900 border border-surface-border text-slate-200 text-sm rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-supertech-500"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Admin nav shared ─────────────────────────────────────────────────────────
function AdminNav({ active }: { active: 'leads' | 'messages' }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-1 bg-dark-900 rounded-xl p-1 border border-surface-border">
      {([['leads', 'Leads'], ['messages', 'Biblioteca de Mensagens']] as const).map(([key, label]) => (
        <button
          key={key}
          onClick={() => navigate(`/admin/${key}`)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            active === key
              ? 'bg-supertech-500 text-dark-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminLeadsPage() {
  const [authed,       setAuthed]      = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [password,     setPassword]    = useState('');
  const [pwError,      setPwError]     = useState(false);
  const [leads,        setLeads]       = useState<LeadRecord[]>([]);
  const [modalLead,    setModalLead]   = useState<LeadRecord | null>(null);

  // Filters
  const [dateFilter,    setDateFilter]    = useState('all');
  const [cityFilter,    setCityFilter]    = useState('');
  const [ufFilter,      setUfFilter]      = useState('Todos os estados');
  const [segFilter,     setSegFilter]     = useState('Todos os segmentos');
  const [investFilter,  setInvestFilter]  = useState('all');
  const [valMin,        setValMin]        = useState('');
  const [valMax,        setValMax]        = useState('');
  const [etapaFilter,   setEtapaFilter]   = useState('Todas as etapas');
  const [statusFilter,  setStatusFilter]  = useState('Todos');
  const [sortFilter,    setSortFilter]    = useState('recent');
  const [vendedorFilter,setVendedorFilter]= useState('Todos');

  useEffect(() => {
    if (!authed) return;
    ensureMockSeeded();
    const loaded = readLeads();
    setLeads(loaded);
    console.log('ADMIN LEADS CARREGADOS:', loaded.length, loaded);

    // Auto-refresh leads every 60s (only while authed)
    const interval = setInterval(() => {
      const refreshed = readLeads();
      setLeads(refreshed);
      console.log('ADMIN LEADS ATUALIZADOS:', refreshed.length);
    }, 60_000);
    return () => clearInterval(interval);
  }, [authed]);

  function handleRefresh() {
    setLeads(readLeads());
  }

  function handleClearAll() {
    if (!window.confirm('⚠️ Isso vai apagar TODOS os leads do painel permanentemente. Continuar?')) return;
    localStorage.removeItem('ssp_leads');
    localStorage.removeItem('ssp_leads_seeded');
    setLeads([]);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  }

  function clearFilters() {
    setDateFilter('all'); setCityFilter(''); setUfFilter('Todos os estados');
    setSegFilter('Todos os segmentos'); setInvestFilter('all');
    setValMin(''); setValMax('');
    setEtapaFilter('Todas as etapas'); setStatusFilter('Todos');
    setSortFilter('recent'); setVendedorFilter('Todos');
  }

  // ── Filtered + sorted leads (calculado ANTES dos KPIs) ──────────────────────
  const filtered = useMemo(() => {
    let out = [...leads];

    out = out.filter(l => matchesDate(l, dateFilter));

    if (cityFilter.trim())
      out = out.filter(l => l.city?.toLowerCase().includes(cityFilter.toLowerCase()));

    if (ufFilter !== 'Todos os estados')
      out = out.filter(l => l.uf === ufFilter);

    if (segFilter !== 'Todos os segmentos')
      out = out.filter(l => (l.segment || NI) === segFilter);

    if (investFilter !== 'all')
      out = out.filter(l => l.investmentCategory === investFilter);

    const min = parseFloat(valMin.replace(/\D/g, ''));
    const max = parseFloat(valMax.replace(/\D/g, ''));
    if (!isNaN(min)) out = out.filter(l => l.investmentMidpoint >= min);
    if (!isNaN(max)) out = out.filter(l => l.investmentMidpoint <= max);

    if (etapaFilter !== 'Todas as etapas')
      out = out.filter(l => getLastStepLabel(l.lastStepNum, l.sentToConsultor) === etapaFilter);

    if (statusFilter === 'Enviados')     out = out.filter(l => l.sentToConsultor);
    if (statusFilter === 'Não enviados') out = out.filter(l => !l.sentToConsultor);

    if (vendedorFilter !== 'Todos')
      out = out.filter(l => (l.vendedorNome ?? '') === vendedorFilter);

    out.sort((a, b) => {
      if (sortFilter === 'recent')  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortFilter === 'highInv') return b.investmentMidpoint - a.investmentMidpoint;
      if (sortFilter === 'lowInv')  return a.investmentMidpoint - b.investmentMidpoint;
      return 0;
    });

    return out;
  }, [leads, dateFilter, cityFilter, ufFilter, segFilter, investFilter, valMin, valMax, etapaFilter, statusFilter, sortFilter, vendedorFilter]);

  // ── KPIs — calculados sobre `filtered`, não sobre `leads` ─────────────────
  //
  // totalAcessos      = leads únicos dentro do filtro ativo
  // preencheramTudo   = chegou à etapa Prévia (step >= 7) ou Confirmação (step 8) OU enviou
  // enviaramConsultor = sentToConsultor === true
  // abandonaram       = totalAcessos - enviaramConsultor
  //   (quem preencheu tudo mas não enviou é abandono tardio — conta em abandonaram)
  const kpiTotal     = filtered.length;
  const kpiSent      = filtered.filter(l => l.sentToConsultor).length;
  const kpiComplete  = filtered.filter(l => l.lastStepNum >= 7 || l.sentToConsultor).length;
  const kpiAbandoned = Math.max(0, kpiTotal - kpiSent);

  // ── Diagnóstico — sempre ativo para confirmar dados em produção ──────────────
  console.log('[AdminLeads] leads no banco (deduplicados):', leads.length);
  console.log('[AdminLeads] leads filtrados:', filtered.length);
  console.log('[AdminLeads] métricas:', { kpiTotal, kpiComplete, kpiSent, kpiAbandoned });
  if (filtered.length > 0) console.log('[AdminLeads] sample lead:', filtered[0]);
  if (leads.length > 0) console.log('[AdminLeads] raw leads[0]:', leads[0]);

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-surface-card border border-surface-border rounded-2xl p-8 flex flex-col gap-4">
          <h1 className="text-white font-bold text-xl text-center">Painel Interno</h1>
          <input
            type="password"
            placeholder="Senha de acesso"
            value={password}
            onChange={e => { setPassword(e.target.value); setPwError(false); }}
            className={`input-dark ${pwError ? 'border-red-500' : ''}`}
            autoFocus
          />
          {pwError && <p className="text-red-400 text-xs text-center">Senha incorreta</p>}
          <button type="submit" className="btn-primary py-3 font-bold">Entrar</button>
        </form>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <>
      {modalLead && <WhatsAppModal lead={modalLead} onClose={() => setModalLead(null)} />}

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h1 className="text-2xl font-black text-white flex-1">Painel de Leads</h1>
          <AdminNav active="leads" />
          <button onClick={handleRefresh} className="text-slate-500 text-sm hover:text-white transition-colors flex items-center gap-1.5">
            <RefreshCw size={13} /> Atualizar
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-400 transition-colors"
            title="Apagar todos os leads"
          >
            <Trash2 size={13} /> Zerar dados
          </button>
          <button onClick={handleLogout} className="text-slate-500 text-sm hover:text-white transition-colors">Sair</button>
        </div>

        {/* PWA install card — admin only, never visible to leads */}
        <AdminInstallCard />

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <KpiCard label="Total de acessos"      value={kpiTotal}    />
          <KpiCard label="Preencheram tudo"       value={kpiComplete} />
          <KpiCard label="Enviaram ao consultor"  value={kpiSent}     accent />
          <KpiCard label="Abandonaram"            value={kpiAbandoned} />
        </div>

        {/* Filters */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Sel label="Data" value={dateFilter} onChange={setDateFilter}
              options={DATE_OPTIONS} />

            <div>
              <div className="label-upper mb-1.5">Cidade</div>
              <input
                type="text"
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                placeholder="Buscar cidade..."
                className="input-dark text-sm py-2.5"
              />
            </div>

            <Sel label="Estado" value={ufFilter} onChange={setUfFilter}
              options={UF_LIST.map(u => ({ value: u, label: u }))} />

            <Sel label="Segmento" value={segFilter} onChange={setSegFilter}
              options={SEGMENT_OPTIONS.map(s => ({ value: s, label: s }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Sel label="Investimento" value={investFilter} onChange={setInvestFilter}
              options={INVEST_OPTIONS} />

            <div>
              <div className="label-upper mb-1.5">Valor mínimo</div>
              <input type="text" value={valMin} onChange={e => setValMin(e.target.value)}
                placeholder="R$ 0" className="input-dark text-sm py-2.5" />
            </div>

            <div>
              <div className="label-upper mb-1.5">Valor máximo</div>
              <input type="text" value={valMax} onChange={e => setValMax(e.target.value)}
                placeholder="R$ 0" className="input-dark text-sm py-2.5" />
            </div>

            <Sel label="Última etapa" value={etapaFilter} onChange={setEtapaFilter}
              options={ETAPA_OPTIONS.map(e => ({ value: e, label: e }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 items-end">
            <Sel label="Status" value={statusFilter} onChange={setStatusFilter}
              options={['Todos','Enviados','Não enviados'].map(s => ({ value: s, label: s }))} />

            <Sel label="Ordenação" value={sortFilter} onChange={setSortFilter}
              options={[
                { value: 'recent',  label: 'Mais recentes' },
                { value: 'highInv', label: 'Maior investimento' },
                { value: 'lowInv',  label: 'Menor investimento' },
              ]} />

            <Sel label="Vendedor / Representante" value={vendedorFilter} onChange={setVendedorFilter}
              options={[
                { value: 'Todos',           label: 'Todos os vendedores' },
                { value: 'Pedro',           label: 'Pedro (Interno)' },
                { value: 'Robson',          label: 'Robson (Interno)' },
                { value: 'Juan',            label: 'Juan (Interno)' },
                { value: 'Alef',            label: 'Alef (Interno / DDD 34-35)' },
                { value: 'Valter',          label: 'Valter (Interno)' },
                { value: 'Renan / Diego',   label: 'Renan/Diego – Globo Sports' },
                { value: 'Igor',            label: 'Igor – Firetech (RJ)' },
                { value: 'Mateus',          label: 'Mateus – ES' },
                { value: 'Gustavo',         label: 'Gustavo – BH Fitness (MG)' },
                { value: 'Danilo',          label: 'Danilo – PR' },
                { value: 'Valmir',          label: 'Valmir – VJK (Cascavel)' },
                { value: 'Alessandro',      label: 'Alessandro – RS' },
                { value: 'Rodrigo Gomes',   label: 'Rodrigo Gomes – Orange (GO)' },
                { value: 'Marcelo',         label: 'Marcelo – MC Superfitness (AM/AC)' },
                { value: 'Alan',            label: 'Alan – Triplle (BA/SE/NE)' },
                { value: 'Wellington',      label: 'Wellington – Superfitness (PE)' },
                { value: 'Felipe',          label: 'Felipe – PB' },
                { value: 'Arlindo',         label: 'Arlindo – Brazil Bike (CE)' },
                { value: 'Mauricio Borges', label: 'Mauricio Borges – MB (PA)' },
              ]} />

            <div className="lg:col-start-4 flex justify-end items-end">
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors">
                <X size={13} /> Limpar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Data/Hora','Nome','Telefone','Cidade/UF','Segmento','Investimento','Categoria','Última etapa','Enviou?','Vendedor/Região','Critério','Ação']
                    .map(col => (
                      <th key={col} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-slate-600 text-sm">
                      Nenhum lead encontrado com os filtros aplicados.
                    </td>
                  </tr>
                )}
                {filtered.map((lead, i) => {
                  const etapa = getLastStepLabel(lead.lastStepNum, lead.sentToConsultor);
                  const catStyle = CAT_COLORS[lead.investmentCategory] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                  const hasPhone = !!(lead.phone && lead.phone.replace(/\D/g,'').length >= 8);
                  return (
                    <tr key={lead.id} className={`border-b border-surface-border last:border-0 hover:bg-surface-elevated transition-colors ${i % 2 === 1 ? 'bg-dark-900/30' : ''}`}>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{formatDateTime(lead.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-200 font-medium whitespace-nowrap">{ni(lead.name)}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{ni(lead.phone)}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {lead.city && lead.uf ? `${lead.city}/${lead.uf}` : NI}
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-[120px]">
                        <span className="truncate block">{ni(lead.segment)}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{brl(lead.investmentMidpoint)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {lead.investmentCategory && lead.investmentCategory !== '—' ? (
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${catStyle}`}>
                            {lead.investmentCategory}
                          </span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{etapa}</td>
                      <td className="px-4 py-3 text-center">
                        {lead.sentToConsultor
                          ? <span className="text-supertech-400 font-bold">✓</span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                      {/* Routing info */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {lead.vendedorNome ? (
                          <div>
                            <p className="text-slate-200 text-xs font-semibold">{lead.vendedorNome}</p>
                            {lead.regiaoAtendimento && (
                              <p className="text-slate-500 text-[10px]">{lead.regiaoAtendimento}</p>
                            )}
                          </div>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {lead.roteamentoCriterio ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/50 text-slate-400 border border-slate-600/40">
                            {lead.roteamentoCriterio}
                          </span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setModalLead(lead)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                            hasPhone
                              ? 'border-supertech-500/40 text-supertech-400 hover:bg-supertech-500/10'
                              : 'border-surface-border text-slate-600 cursor-default'
                          }`}
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-4 py-3 border-t border-surface-border flex items-center justify-between">
            <span className="text-xs text-slate-600">{filtered.length} lead{filtered.length !== 1 ? 's' : ''} exibido{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-xs text-slate-700">Total no banco: {leads.length}</span>
          </div>
        </div>

        {/* Page footer */}
        <footer className="mt-16 border-t border-surface-border pt-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-supertech-500 flex items-center justify-center">
                  <span className="text-dark-950 font-black text-sm">S</span>
                </div>
                <span className="text-white font-bold text-sm tracking-wide">SPACE PLANNER™</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">Fábrica nacional de equipamentos fitness profissionais para academias, condomínios, hotéis e clubes.</p>
            </div>
            <div>
              <p className="label-upper mb-3">Ferramenta</p>
              <ul className="flex flex-col gap-2">
                {['Space Planner™','A Fábrica','Falar com consultor'].map(i => (
                  <li key={i} className="text-slate-500 text-xs">{i}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label-upper mb-3">Atendimento</p>
              <ul className="flex flex-col gap-2">
                {['Consultoria comercial em todo o Brasil','Showroom · Visitas à fábrica'].map(i => (
                  <li key={i} className="text-slate-500 text-xs">{i}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-surface-border pt-5">
            <span className="text-[10px] text-slate-700 uppercase tracking-widest">© Space Planner™ · Prévia Visual de Projeto</span>
            <span className="text-[10px] text-slate-700 uppercase tracking-widest">Fabricação Nacional</span>
          </div>
        </footer>
      </div>
    </>
  );
}
