import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Copy, Check, ChevronDown, BookOpen } from 'lucide-react';
import AdminInstallCard from '../components/AdminInstallCard';
import {
  MESSAGE_TEMPLATES, ALL_CATEGORIES,
  replaceTemplateVariables,
} from '../data/messageTemplates';

// ── Auth constants ────────────────────────────────────────────────────────────
const SESSION_KEY    = 'ssp_admin_auth';
const ADMIN_PASSWORD = 'supertech';

// ── Admin nav ─────────────────────────────────────────────────────────────────
function AdminNav({ active }: { active: 'leads' | 'messages' }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-1 bg-dark-900 rounded-xl p-1 border border-surface-border">
      {([['leads', 'Leads'], ['messages', 'Biblioteca de Mensagens']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => navigate(`/admin/${key}`)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              active === key ? 'bg-supertech-500 text-dark-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))
      }
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({ template }: { template: typeof MESSAGE_TEMPLATES[number] }) {
  const [expanded, setExpanded] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const preview = replaceTemplateVariables(template.body);

  function handleCopy() {
    navigator.clipboard.writeText(preview).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-supertech-500/10 text-supertech-400 border border-supertech-500/20 mb-2">
              {template.category}
            </span>
            <h3 className="text-white font-semibold text-sm leading-snug">{template.name}</h3>
            <p className="text-slate-500 text-xs mt-1">{template.description}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border text-slate-400 text-xs font-semibold hover:border-supertech-500/40 hover:text-supertech-400 transition-colors flex-shrink-0"
          >
            {copied ? <Check size={12} className="text-supertech-400" /> : <Copy size={12} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {['[Nome]','[Cidade]','[UF]','[Segmento]','[Investimento]','[LinkFerramenta]']
            .filter(v => template.body.includes(v))
            .map(v => (
              <span key={v} className="px-1.5 py-0.5 rounded text-[10px] text-slate-600 bg-dark-900 border border-surface-border font-mono">
                {v}
              </span>
            ))}
        </div>
      </div>

      <div className="border-t border-surface-border">
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span>{expanded ? 'Ocultar mensagem' : 'Ver mensagem completa'}</span>
          <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {expanded && (
          <div className="px-5 pb-5">
            <pre className="whitespace-pre-wrap text-xs text-slate-300 leading-relaxed font-mono bg-dark-900 rounded-xl p-4 max-h-64 overflow-y-auto border border-surface-border">
              {preview}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Login screen (inline, no hooks conditionally) ─────────────────────────────
function LoginScreen() {
  const [password, setPassword] = useState('');
  const [pwError,  setPwError]  = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      window.location.reload();
    } else {
      setPwError(true);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-surface-card border border-surface-border rounded-2xl p-8 flex flex-col gap-4">
        <h1 className="text-white font-bold text-xl text-center">Painel Interno</h1>
        <input type="password" placeholder="Senha de acesso" value={password}
          onChange={e => { setPassword(e.target.value); setPwError(false); }}
          className={`input-dark ${pwError ? 'border-red-500' : ''}`} autoFocus />
        {pwError && <p className="text-red-400 text-xs text-center">Senha incorreta</p>}
        <button type="submit" className="btn-primary py-3 font-bold">Entrar</button>
      </form>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminMessagesPage() {
  const navigate = useNavigate();
  const [search,     setSearch]  = useState('');
  const [catFilter,  setCat]     = useState('Todas as categorias');

  const isAuthed = sessionStorage.getItem(SESSION_KEY) === '1';
  if (!isAuthed) return <LoginScreen />;

  const categories = ['Todas as categorias', ...ALL_CATEGORIES];

  const filtered = MESSAGE_TEMPLATES.filter(t => {
    const matchSearch = !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.body.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'Todas as categorias' || t.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} className="text-supertech-400" />
            <h1 className="text-2xl font-black text-white">Biblioteca de Mensagens</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Templates comerciais para abordagem e follow-up dos leads do Space Planner™.
          </p>
        </div>
        <AdminNav active="messages" />
        <button
          onClick={() => { sessionStorage.removeItem(SESSION_KEY); navigate('/admin/leads'); }}
          className="text-slate-500 text-sm hover:text-white transition-colors"
        >
          Sair
        </button>
      </div>

      {/* PWA install card — admin only, never visible to leads */}
      <AdminInstallCard />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input type="text" placeholder="Buscar por nome da mensagem..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-dark pl-9 text-sm py-2.5 w-full" />
        </div>
        <div className="relative sm:w-64">
          <select value={catFilter} onChange={e => setCat(e.target.value)}
            className="w-full bg-dark-900 border border-surface-border text-slate-200 text-sm rounded-xl px-3 py-2.5 pr-8 appearance-none focus:outline-none focus:border-supertech-500">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      <p className="text-xs text-slate-600 mb-4">
        {filtered.length} template{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0
        ? <div className="text-center py-16 text-slate-600 text-sm">Nenhum template encontrado para esta busca.</div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{filtered.map(t => <TemplateCard key={t.id} template={t} />)}</div>
      }

      {/* Footer */}
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
              {['Space Planner™','A Fábrica','Falar com consultor'].map(i => <li key={i} className="text-slate-500 text-xs">{i}</li>)}
            </ul>
          </div>
          <div>
            <p className="label-upper mb-3">Atendimento</p>
            <ul className="flex flex-col gap-2">
              {['Consultoria comercial em todo o Brasil','Showroom · Visitas à fábrica'].map(i => <li key={i} className="text-slate-500 text-xs">{i}</li>)}
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-surface-border pt-5">
          <span className="text-[10px] text-slate-700 uppercase tracking-widest">© Space Planner™ · Prévia Visual de Projeto</span>
          <span className="text-[10px] text-slate-700 uppercase tracking-widest">Fabricação Nacional</span>
        </div>
      </footer>
    </div>
  );
}
