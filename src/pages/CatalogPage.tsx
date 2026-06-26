import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Plus, Minus, Trash2,
  MessageCircle, CheckCircle2, Activity, Dumbbell, Zap, X, ZoomIn,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { CATALOG, formatPrice, type TabKey, type CatalogProduct } from '../data/catalog';
import { CONSULTOR_WHATSAPP } from '../constants';
import { saveEquipmentsToSheets } from '../services/googleSheets';

// ── Category icon fallback ─────────────────────────────────────────────────────
const CategoryIcon = ({ cat, size = 28 }: { cat: string; size?: number }) => {
  const Icon = cat === 'cardio' ? Activity : cat === 'strong' ? Zap : Dumbbell;
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Icon size={size} strokeWidth={1.4} color="rgba(255,255,255,0.15)" />
    </div>
  );
};

// ── Helper: encode image path so spaces/accents load in browser ──────────────
function encodeImagePath(path: string): string {
  // Split on last '/' to encode only the filename, keeping the /products/originais/ prefix
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) return encodeURIComponent(path);
  return path.slice(0, lastSlash + 1) + encodeURIComponent(path.slice(lastSlash + 1));
}

// ── Premium image area in card ─────────────────────────────────────────────────
interface CardImageProps {
  src?: string;
  alt: string;
  cat: string;
  onClick?: () => void;
}
const CardImage = ({ src, alt, cat, onClick }: CardImageProps) => {
  const [failed, setFailed] = useState(false);
  const hasImage = src && !failed;

  return (
    <div
      onClick={hasImage ? onClick : undefined}
      style={{
        width: '110px',
        height: '100%',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        background: hasImage
          ? 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(139,195,74,0.07) 0%, rgba(12,17,12,0.95) 100%)'
          : 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        cursor: hasImage ? 'zoom-in' : 'default',
        transition: 'background 0.2s',
      }}
      title={hasImage ? `Ver ${alt} em tamanho maior` : undefined}
    >
      {hasImage ? (
        <>
          {/* Green glow behind image */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 60% 55% at 50% 55%, rgba(139,195,74,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <img
            src={encodeImagePath(src)}
            alt={alt}
            onError={() => setFailed(true)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              padding: '8px',
              transition: 'transform 0.25s ease',
            }}
            className="catalog-card-img"
          />
          {/* Zoom hint overlay */}
          <div style={{
            position: 'absolute', bottom: 4, right: 4,
            opacity: 0,
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
          }} className="catalog-zoom-hint">
            <ZoomIn size={13} color="rgba(139,195,74,0.7)" strokeWidth={2} />
          </div>
        </>
      ) : (
        <CategoryIcon cat={cat} />
      )}
    </div>
  );
};

// ── Lightbox modal — premium zoom ────────────────────────────────────────────
interface LightboxProps {
  product: CatalogProduct | null;
  onClose: () => void;
}
const Lightbox = ({ product, onClose }: LightboxProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [visible, setVisible]     = useState(false);

  // Reset image error state when product changes
  useEffect(() => { setImgFailed(false); }, [product]);

  // Animate in/out + body scroll lock + ESC handler
  useEffect(() => {
    if (!product) { setVisible(false); return; }
    // Tiny delay so CSS transition fires after mount
    const t = requestAnimationFrame(() => setVisible(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(t);
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [product, onClose]);

  if (!product) return null;

  const hasImg = !!product.imageUrl && !imgFailed;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 24px)',
        // Overlay fade
        background: visible ? 'rgba(4,8,4,0.88)' : 'rgba(4,8,4,0)',
        backdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
        transition: 'background 0.28s ease, backdrop-filter 0.28s ease',
      }}
    >
      {/* Modal card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          // Glass-effect dark card
          background: 'linear-gradient(160deg, rgba(22,32,22,0.97) 0%, rgba(10,15,10,0.98) 100%)',
          border: '1px solid rgba(139,195,74,0.20)',
          borderRadius: '22px',
          boxShadow: [
            '0 40px 100px rgba(0,0,0,0.75)',
            '0 0 0 1px rgba(255,255,255,0.04)',
            'inset 0 1px 0 rgba(255,255,255,0.06)',
          ].join(', '),
          // Responsive sizing — much larger than before
          width: '100%',
          maxWidth: 'min(90vw, 820px)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          // Scale + fade entrance
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(16px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.30s cubic-bezier(0.34,1.28,0.64,1), opacity 0.26s ease',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '18px 22px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: '9.5px', fontWeight: 700, color: '#8BC34A',
              letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px',
            }}>
              {product.categoryLabel}
            </p>
            <p style={{
              fontSize: '17px', fontWeight: 800, color: '#fff',
              lineHeight: 1.2, marginBottom: '3px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {product.name}
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.32)', fontFamily: 'monospace' }}>
              {product.code}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar visualização"
            style={{
              flexShrink: 0, marginLeft: '16px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)';
              (e.currentTarget as HTMLElement).style.color = '#fff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            <X size={17} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Image area — takes all remaining space ── */}
        <div style={{
          flex: 1,
          minHeight: 0,           // critical: lets flex child shrink below content size
          position: 'relative',
          background: [
            'radial-gradient(ellipse 65% 60% at 50% 50%, rgba(139,195,74,0.07) 0%, transparent 70%)',
            'rgba(8,12,8,0.98)',
          ].join(', '),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          overflow: 'hidden',
        }}>
          {/* Subtle grid texture */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.025,
            backgroundImage: 'linear-gradient(rgba(139,195,74,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,195,74,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }} />

          {hasImg ? (
            <img
              src={encodeImagePath(product.imageUrl!)}
              alt={product.name}
              onError={() => setImgFailed(true)}
              style={{
                // Fills available space without cropping
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block',
                filter: [
                  'drop-shadow(0 12px 40px rgba(0,0,0,0.6))',
                  'drop-shadow(0 0 1px rgba(0,0,0,0.3))',
                ].join(' '),
                // Subtle reveal
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.35s ease 0.12s',
              }}
            />
          ) : (
            <CategoryIcon cat={product.category} size={72} />
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          flexShrink: 0,
          padding: '14px 22px 18px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '12px',
          flexWrap: 'wrap',
          background: 'rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            {product.bateriaKg && product.bateriaKg !== 'X' && (
              <div>
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Bateria</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>{product.bateriaKg} kg</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>À vista</p>
              <p style={{ fontSize: '18px', color: '#8BC34A', fontWeight: 900, letterSpacing: '-0.02em' }}>{formatPrice(product.price)}</p>
            </div>
          </div>
          <p style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.18)',
            lineHeight: 1.5, textAlign: 'right',
          }}>
            ESC ou clique fora para fechar
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
interface ToastState { visible: boolean; name: string }

// ── Main component ────────────────────────────────────────────────────────────
export default function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, setStep, addEquipment, removeEquipment, updateEquipmentQty } = usePlanner();

  const initialTab = (searchParams.get('line') as TabKey) ?? 'cardio';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [toast, setToast] = useState<ToastState>({ visible: false, name: '' });
  const [lightboxProduct, setLightboxProduct] = useState<CatalogProduct | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setStep(5); }, [setStep]);

  const closeLightbox = useCallback(() => setLightboxProduct(null), []);

  const selected = state.data.selectedEquipment ?? [];
  const total    = selected.reduce((sum, e) => sum + e.price * e.quantity, 0);
  const count    = selected.reduce((sum, e) => sum + e.quantity, 0);

  function getQty(id: string) {
    return selected.find(e => e.id === id)?.quantity ?? 0;
  }

  function handleAdd(p: CatalogProduct) {
    const item = { id: p.id, code: p.code, name: p.name, category: p.category, categoryLabel: p.categoryLabel, price: p.price, bateriaKg: p.bateriaKg, imageUrl: p.imageUrl, quantity: 1 };
    addEquipment(item);
    triggerToast(p.name);
    const updatedList = [...selected.filter(e => e.id !== p.id), item];
    saveEquipmentsToSheets(state.data.codigoPrevia ?? '', updatedList);
  }

  function handleInc(p: CatalogProduct) {
    const qty = getQty(p.id);
    updateEquipmentQty(p.id, qty + 1);
    const updatedList = selected.map(e => e.id === p.id ? { ...e, quantity: qty + 1 } : e);
    saveEquipmentsToSheets(state.data.codigoPrevia ?? '', updatedList);
  }

  function handleDec(p: CatalogProduct) {
    const qty = getQty(p.id);
    if (qty <= 1) {
      removeEquipment(p.id);
      saveEquipmentsToSheets(state.data.codigoPrevia ?? '', selected.filter(e => e.id !== p.id));
    } else {
      updateEquipmentQty(p.id, qty - 1);
      saveEquipmentsToSheets(state.data.codigoPrevia ?? '', selected.map(e => e.id === p.id ? { ...e, quantity: qty - 1 } : e));
    }
  }

  function triggerToast(name: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, name });
    toastTimer.current = setTimeout(() => setToast({ visible: false, name: '' }), 2500);
  }

  function handleSendConsultor() {
    const { data } = state;
    const items = selected.map(e => `• ${e.name} (×${e.quantity}) — ${formatPrice(e.price * e.quantity)}`).join('\n');
    const msg = encodeURIComponent(
      `Olá! Minha prévia do Space Planner:\n\n` +
      `*Nome:* ${data.name ?? '-'}\n*WhatsApp:* ${data.phone ?? '-'}\n` +
      `*Objetivo:* ${data.objectiveLabel ?? '-'}\n*Investimento:* ${data.investmentLabel ?? '-'}\n` +
      `*Prazo:* ${data.deadlineLabel ?? '-'}\n*Cidade:* ${data.uf ?? '-'} / ${data.city ?? '-'}\n\n` +
      `*Equipamentos:*\n${items}\n\n*Estimativa: ${formatPrice(total)}*`
    );
    window.open(`https://wa.me/${CONSULTOR_WHATSAPP}?text=${msg}`, '_blank');
  }

  const products = CATALOG[activeTab];

  return (
    <div
      className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse 70% 55% at 30% 35%, rgba(100,180,60,0.07) 0%, transparent 65%), #0c110c' }}
    >
      {/* CSS for hover effects */}
      <style>{`
        .catalog-card-wrap:hover .catalog-card-img { transform: scale(1.06) !important; }
        .catalog-card-wrap:hover .catalog-zoom-hint { opacity: 1 !important; }
        .catalog-card-wrap { transition: box-shadow 0.2s; }
        .catalog-card-wrap:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.35); }

        /* Lightbox responsive sizing */
        @media (max-width: 600px) {
          .lb-modal {
            max-width: 94vw !important;
            max-height: 85vh !important;
          }
        }
      `}</style>

      {/* Lightbox */}
      <Lightbox product={lightboxProduct} onClose={closeLightbox} />

      {/* Toast */}
      <div
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 px-5 py-3.5 rounded-xl pointer-events-none transition-all duration-300"
        style={{
          background: 'rgba(20,30,20,0.97)',
          border: '1px solid rgba(139,195,74,0.25)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          opacity: toast.visible ? 1 : 0,
          transform: `translateX(-50%) translateY(${toast.visible ? '0' : '-12px'})`,
        }}
      >
        <CheckCircle2 size={18} color="#8BC34A" strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <p className="text-[13px] font-bold text-white leading-tight">Adicionado ao projeto.</p>
          <p className="text-[12px] text-white/50 mt-0.5">{toast.name}</p>
        </div>
      </div>

      <main className="max-w-[1360px] mx-auto w-full px-4 sm:px-8 py-5 sm:py-7">

        {/* Label + Title */}
        <p className="text-[10px] font-bold text-[#8BC34A] uppercase tracking-[0.14em] mb-1.5">
          Etapa 5 de 6 · Equipamentos
        </p>
        <h1 className="text-page-title font-black text-white leading-tight tracking-tight mb-4">
          Selecione os equipamentos para compor seu espaço.
        </h1>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* LEFT: Tabs + Grid */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex gap-0 border-b mb-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              {(['cardio', 'musculacao', 'strong'] as TabKey[]).map(tab => {
                const label = tab === 'musculacao' ? 'MUSCULAÇÃO' : tab.toUpperCase();
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 sm:flex-none px-3 sm:px-5 py-3 text-[11px] sm:text-[11px] font-bold tracking-wide border-b-2 transition-all duration-150 -mb-px whitespace-nowrap"
                    style={{
                      borderBottomColor: isActive ? '#8BC34A' : 'transparent',
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.38)',
                      background: isActive ? 'rgba(139,195,74,0.04)' : 'transparent',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map(p => {
                const qty = getQty(p.id);
                const isIn = qty > 0;
                return (
                  <div
                    key={p.id}
                    className="catalog-card-wrap flex rounded-xl overflow-hidden border transition-all duration-150"
                    style={{
                      background: isIn ? 'rgba(139,195,74,0.06)' : 'rgba(255,255,255,0.025)',
                      borderColor: isIn ? '#8BC34A' : 'rgba(255,255,255,0.08)',
                      borderLeftWidth: isIn ? '3px' : '1px',
                    }}
                  >
                    {/* Premium image area */}
                    <div className="catalog-card-img-wrap" style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, width: 'clamp(80px, 22vw, 110px)', alignSelf: 'stretch' }}>
                      <CardImage
                        src={p.imageUrl}
                        alt={p.name}
                        cat={p.category}
                        onClick={() => setLightboxProduct(p)}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                      {/* Top row */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className="font-bold text-[13px] text-white leading-snug">{p.name}</p>
                          <span className="text-[9px] text-white/40 font-mono shrink-0 mt-0.5">{p.code}</span>
                        </div>
                        <p className="text-[11px] text-white/32 mb-1 leading-snug">{p.description}</p>
                        {p.bateriaKg && p.bateriaKg !== 'X' && (
                          <p className="text-[10px] text-white/28 mb-1">Bateria: {p.bateriaKg} kg</p>
                        )}
                        <p className="text-[12px] font-bold mb-2.5" style={{ color: '#8BC34A' }}>
                          À vista: {formatPrice(p.price)}
                        </p>
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Ver ficha — always clickable, opens modal */}
                        <button
                          onClick={() => setLightboxProduct(p)}
                          className="px-3 py-2 rounded-lg text-[11px] font-semibold text-white/50 border border-white/[0.10] hover:border-white/25 hover:text-white/70 transition-all shrink-0"
                          style={{ minHeight: '36px' }}
                        >
                          Ver ficha
                        </button>

                        {/* Add / Qty control */}
                        {!isIn ? (
                          <button
                            onClick={() => handleAdd(p)}
                            className="flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg text-[12px] font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ background: '#8BC34A', minHeight: '36px' }}
                          >
                            <Plus size={13} strokeWidth={3} />
                            Adicionar
                          </button>
                        ) : (
                          <div
                            className="flex items-center rounded-lg overflow-hidden flex-1"
                            style={{ border: '1px solid #8BC34A', minHeight: '36px' }}
                          >
                            <button
                              onClick={() => handleDec(p)}
                              className="px-3 py-2 text-white/70 hover:text-white transition-colors hover:bg-white/5 flex-shrink-0"
                            >
                              <Minus size={13} strokeWidth={2.5} />
                            </button>
                            <span className="flex-1 text-center text-[13px] font-bold text-white">
                              {qty}
                            </span>
                            <button
                              onClick={() => handleInc(p)}
                              className="px-3 py-2 text-white/70 hover:text-white transition-colors hover:bg-white/5 flex-shrink-0"
                            >
                              <Plus size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back link */}
            <button
              onClick={() => navigate('/lead')}
              className="flex items-center gap-1.5 mt-8 text-[13px] font-semibold text-white/35 hover:text-white/60 transition-colors"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Voltar para o perfil
            </button>
          </div>

          {/* RIGHT: Sidebar — desktop only; mobile uses fixed bottom bar */}
          <div className="hidden lg:block w-full lg:w-[300px] shrink-0 sticky top-20">
            <div
              className="rounded-2xl border p-5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.09)',
              }}
            >
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.14em] mb-2">
                Meu Projeto
              </p>

              {selected.length === 0 ? (
                <>
                  <p className="text-[15px] font-bold text-white/40 mb-1">Nenhum equipamento</p>
                  <p className="text-[12px] text-white/25 leading-relaxed mb-5">
                    Nenhum equipamento adicionado. Selecione para compor seu projeto.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[14px] font-bold text-white mb-4">
                    {count} {count === 1 ? 'equipamento selecionado' : 'equipamentos selecionados'}
                  </p>
                  <div className="flex flex-col gap-3 mb-4">
                    {selected.map(eq => (
                      <div key={eq.id} className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-white leading-tight truncate">{eq.name}</p>
                          <p className="text-[11px] text-white/35 mt-0.5">×{eq.quantity} · {eq.categoryLabel}</p>
                        </div>
                        <p className="text-[13px] font-bold shrink-0" style={{ color: '#8BC34A' }}>
                          {formatPrice(eq.price * eq.quantity)}
                        </p>
                        <button
                          onClick={() => removeEquipment(eq.id)}
                          className="shrink-0 text-white/25 hover:text-red-400/70 transition-colors mt-0.5"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mb-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />
                </>
              )}

              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.14em] mb-1">
                Estimativa Parcial
              </p>
              <p
                className="text-[1.25rem] font-black leading-tight mb-1"
                style={{ color: selected.length ? '#ffffff' : 'rgba(255,255,255,0.25)' }}
              >
                {formatPrice(total)}
              </p>
              <p className="text-[11px] text-white/25 leading-relaxed mb-5">
                Valores estimados. Condições finais com consultor Supertech.
              </p>

              <button
                disabled={selected.length === 0}
                onClick={() => navigate('/project')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-[14px] mb-2.5 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: '#8BC34A', color: '#0c110c', boxShadow: selected.length ? '0 0 20px rgba(139,195,74,0.22)' : 'none' }}
              >
                Ver prévia do meu projeto
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>

              <button
                disabled={selected.length === 0}
                onClick={handleSendConsultor}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-[13px] border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.04]"
                style={{
                  background: 'transparent',
                  borderColor: selected.length ? '#8BC34A' : 'rgba(255,255,255,0.12)',
                  color: selected.length ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.30)',
                }}
              >
                <MessageCircle size={14} strokeWidth={2} />
                Enviar prévia para consultor
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ── Mobile fixed bottom bar "Meu Projeto" ── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(10,15,10,0.97)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(139,195,74,0.18)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {/* Count + total */}
          <div className="flex-1 min-w-0">
            {count > 0 ? (
              <>
                <p className="text-[12px] font-bold text-white leading-tight">
                  {count} {count === 1 ? 'equipamento' : 'equipamentos'}
                </p>
                <p className="text-[12px] font-black" style={{ color: '#8BC34A' }}>
                  {formatPrice(total)}
                </p>
              </>
            ) : (
              <p className="text-[12px] text-white/35 leading-tight">Nenhum item selecionado</p>
            )}
          </div>
          {/* CTA */}
          <button
            disabled={count === 0}
            onClick={() => navigate('/project')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97]"
            style={{
              background: '#8BC34A',
              boxShadow: count > 0 ? '0 0 18px rgba(139,195,74,0.30)' : 'none',
              minHeight: '44px',
            }}
          >
            <ArrowRight size={15} strokeWidth={2.5} />
            Ver meu projeto
          </button>
        </div>
      </div>

      {/* Spacer so content doesn't hide behind mobile bar */}
      <div className="lg:hidden h-[72px]" />
    </div>
  );
}
