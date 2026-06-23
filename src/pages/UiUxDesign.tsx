import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import {
  getGalleryItemsByCategory,
  createGalleryItem,
  updateGalleryItem,
  softDeleteGalleryItem,
  restoreGalleryItem,
  deleteGalleryItem,
  getTrashedGalleryItemsByCategory,
} from '@/lib/api';
import type { GalleryItem } from '@shared/schema';
import {
  Search, Plus, Filter, ArrowUpDown, X, Edit3, Trash2, RotateCcw,
  ChevronLeft, ChevronRight, ChevronDown, Loader2, Check, AlertTriangle,
  Lock, Unlock, Star, Figma, Monitor, Smartphone, Tablet, Target, Lightbulb,
  BarChart3, Users, Layers, Sparkles, CheckCircle2, Settings, ImagePlus,
  ExternalLink, Eye, Layout, Link as LinkIcon, UploadCloud, Zap,
  Image as ImageIcon,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────
type UiUxProject = GalleryItem;

interface ProjectMeta {
  brief: string;
  problem: string;
  solution: string;
  users: string;
  role: string;
  process: string[];
  outcomes: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────
const PROCESS_PHASES = [
  'Discovery & Research',
  'Info Architecture',
  'Wireframing & Flows',
  'UI & Visual Design',
  'Interactive Prototyping',
  'Usability Testing',
];

const INITIAL_TOOLS = ['Figma', 'Adobe XD', 'Miro', 'Notion', 'ProtoPie', 'Spline'];

const PROJECT_TYPES: Record<string, { label: string; color: string; bg: string; textColor: string; gradient: string }> = {
  'mobile-app': { label: 'Mobile App', color: 'text-amber-400', bg: 'bg-amber-400/15 border-amber-400/30', textColor: '#fbbf24', gradient: 'from-amber-500 via-orange-500 to-red-500' },
  'web-app': { label: 'Web App', color: 'text-blue-400', bg: 'bg-blue-400/15 border-blue-400/30', textColor: '#60a5fa', gradient: 'from-blue-500 via-indigo-500 to-purple-600' },
  'dashboard': { label: 'Dashboard B2B', color: 'text-violet-400', bg: 'bg-violet-400/15 border-violet-400/30', textColor: '#a78bfa', gradient: 'from-purple-600 via-violet-500 to-indigo-600' },
  'landing-page': { label: 'Landing Page', color: 'text-emerald-400', bg: 'bg-emerald-400/15 border-emerald-400/30', textColor: '#34d399', gradient: 'from-emerald-500 via-teal-500 to-cyan-500' },
  'design-system': { label: 'Design System', color: 'text-cyan-400', bg: 'bg-cyan-400/15 border-cyan-400/30', textColor: '#22d3ee', gradient: 'from-cyan-500 via-blue-500 to-indigo-600' },
};

const STATUSES: Record<string, { label: string; dot: string }> = {
  concept: { label: 'Concept / Redesign', dot: 'bg-purple-400' },
  prototype: { label: 'Prototip Interactiv', dot: 'bg-amber-400' },
  implemented: { label: 'Produs Lansat (Live)', dot: 'bg-emerald-400' },
};

const PLATFORMS: Record<string, { label: string }> = {
  ios: { label: 'iOS' },
  android: { label: 'Android' },
  web: { label: 'Web' },
  desktop: { label: 'Desktop' },
  'cross-platform': { label: 'Cross-platform' },
};

const PROJECTS_PER_PAGE = 9;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Cel mai nou' },
  { value: 'oldest', label: 'Cel mai vechi' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
];

const TOOL_TAG_COLORS = [
  'text-rose-400 border-rose-400/20',
  'text-emerald-400 border-emerald-400/20',
  'text-blue-400 border-blue-400/20',
  'text-amber-400 border-amber-400/20',
  'text-violet-400 border-violet-400/20',
  'text-cyan-400 border-cyan-400/20',
  'text-orange-400 border-orange-400/20',
  'text-pink-400 border-pink-400/20',
];

const InputStyle = 'w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-slate-600';
const LabelStyle = 'block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5';

// ─── Helpers ──────────────────────────────────────────────────────────────
function parseMeta(desc: string | null | undefined): ProjectMeta {
  const empty: ProjectMeta = { brief: '', problem: '', solution: '', users: '', role: '', process: [], outcomes: '' };
  if (!desc) return empty;
  try {
    const p = JSON.parse(desc);
    if (typeof p === 'object' && p !== null) return { ...empty, ...p };
  } catch { /* legacy */ }
  return { ...empty, brief: desc };
}

function encodeMeta(m: ProjectMeta): string { return JSON.stringify(m); }

function getImages(project: UiUxProject): string[] {
  if (project.date?.includes('|')) return project.date.split('|').filter(Boolean);
  return [project.image].filter(Boolean);
}

// ─── Hooks ────────────────────────────────────────────────────────────────
function useModalEffects(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);
}

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, callback: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) callback();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, callback]);
}

// ─── CustomSelect ─────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, icon: Icon }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ElementType;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));
  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative w-full sm:w-auto min-w-[170px] z-20">
      <div onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full bg-[#09090b] border ${open ? 'border-purple-500/50' : 'border-white/5'} hover:border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-300 cursor-pointer transition-all shadow-sm`}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          <span className="truncate">{selected?.label || 'Selectează'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-full bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 py-1.5 z-50">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map(o => (
              <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === o.value ? 'bg-purple-500/10 text-purple-400 font-medium' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                {o.label}
                {value === o.value && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────
function ConfirmModal({ title, desc, onClose, onConfirm, confirmLabel, danger }: {
  title: string; desc: string; onClose: () => void; onConfirm: () => void;
  confirmLabel: string; danger?: boolean;
}) {
  useModalEffects(true);
  return (
    <div className="fixed inset-0 z-[10020] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
            {danger ? <AlertTriangle className="w-7 h-7 text-red-400" /> : <RotateCcw className="w-7 h-7 text-emerald-400" />}
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-center">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors">Anulează</button>
          <button onClick={onConfirm}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${danger ? 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────────
function UiCard({ p, admin, onClick, onEdit, onDel, onRestore, isTrashView }: {
  p: UiUxProject; admin: boolean; onClick: () => void; onEdit: () => void;
  onDel: () => void; onRestore?: () => void; isTrashView: boolean;
}) {
  const meta = parseMeta(p.description);
  const typeInfo = PROJECT_TYPES[(p.subcategory as string) || 'mobile-app'] || PROJECT_TYPES['mobile-app'];
  const statusInfo = STATUSES[(p as any).medium || 'concept'] || STATUSES.concept;
  const tools: string[] = (p as any).materials || [];
  const images = getImages(p);
  const isLive = (p as any).medium === 'implemented';
  const isFeatured = (p as any).featured || false;

  return (
    <div className="group relative bg-[#12121a] border border-white/5 rounded-[1.25rem] overflow-hidden cursor-pointer transition-all duration-[350ms]"
      style={{ transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)' }}
      onClick={onClick}
      onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translateY(-5px)'; el.style.borderColor = 'rgba(255,255,255,0.15)'; el.style.boxShadow = '0 8px 30px rgba(139,92,246,0.12)'; }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'translateY(0)'; el.style.borderColor = 'rgba(255,255,255,0.05)'; el.style.boxShadow = 'none'; }}
    >
      {/* Image area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#0d0d15]">
        {p.image ? (
          <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${typeInfo.gradient} flex items-center justify-center`}>
            <Figma className="w-12 h-12 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${typeInfo.bg} ${typeInfo.color} backdrop-blur-sm`}>
            {typeInfo.label}
          </span>
          {images.length > 1 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-black/50 text-white border border-white/10 backdrop-blur-sm">
              <ImageIcon className="w-3 h-3" /> {images.length}
            </span>
          )}
        </div>

        {/* Status top-right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {isFeatured && <Star className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow" />}
          {isLive && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 backdrop-blur-sm">
              <Zap className="w-3 h-3" /> Live
            </span>
          )}
          {p.isPrivate && (
            <span className="p-1.5 rounded-lg bg-black/40 border border-white/10 backdrop-blur-sm">
              <Lock className="w-3 h-3 text-white/70" />
            </span>
          )}
        </div>

        {/* Admin actions */}
        {admin && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isTrashView ? (
              <>
                <button type="button" onClick={e => { e.stopPropagation(); onRestore?.(); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-white/10" title="Restaurează">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); onDel(); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm text-red-400 hover:bg-red-500/20 transition-colors border border-white/10" title="Șterge definitiv">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={e => { e.stopPropagation(); onEdit(); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm text-white hover:bg-white/20 transition-colors border border-white/10" title="Editează">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); onDel(); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm text-red-400 hover:bg-red-500/20 transition-colors border border-white/10" title="Mută în coș">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="text-[15px] font-bold text-white line-clamp-1">{p.title}</h3>
        <p className="text-[11px] text-slate-400 font-mono mt-1 line-clamp-1">{meta.brief || meta.problem || '—'}</p>

        <div className="flex items-center gap-2 mt-4">
          <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
          <span className="text-[11px] text-slate-400">{statusInfo.label}</span>
          {(p as any).device && (
            <span className="text-[11px] text-slate-500 ml-auto">{PLATFORMS[(p as any).device]?.label || (p as any).device}</span>
          )}
        </div>

        {tools.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tools.slice(0, 4).map((t, i) => (
              <span key={t} className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white/[0.03] border ${TOOL_TAG_COLORS[i % TOOL_TAG_COLORS.length]}`}>{t}</span>
            ))}
            {tools.length > 4 && <span className="text-[10px] text-slate-500">+{tools.length - 4}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Project Detail Modal (keeps image-forward split layout) ───────────────
function ProjectModal({ project, projects, onClose, onEdit, onDelete, isAdmin }: {
  project: UiUxProject; projects: UiUxProject[]; onClose: () => void;
  onEdit?: () => void; onDelete?: () => void; isAdmin: boolean;
}) {
  useModalEffects(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'casestudy' | 'process'>('overview');
  const meta = parseMeta(project.description);
  const images = getImages(project);
  const typeInfo = PROJECT_TYPES[(project.subcategory as string) || 'mobile-app'] || PROJECT_TYPES['mobile-app'];
  const statusInfo = STATUSES[(project as any).medium || 'concept'] || STATUSES.concept;
  const tools: string[] = (project as any).materials || [];

  const currentIdx = projects.findIndex(p => p.id === project.id);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setImgIdx(i => (i + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && images.length > 1) setImgIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight' && images.length > 1) setImgIdx(i => (i + 1) % images.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative w-full max-w-7xl h-[92vh] sm:h-[88vh] flex flex-col lg:flex-row rounded-2xl overflow-hidden shadow-2xl bg-[#0e0e16] border border-white/10 animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}>

        {/* LEFT: Image Gallery */}
        <div className="relative h-[40vh] lg:h-full lg:w-[58%] flex flex-col bg-[#08080f] border-b lg:border-b-0 lg:border-r border-white/5">
          <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
            {images[imgIdx] ? (
              <img src={images[imgIdx]} alt={`${project.title} — ecran ${imgIdx + 1}`}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${typeInfo.gradient} rounded-xl flex items-center justify-center`}>
                <Figma className="w-24 h-24 text-white/20" />
              </div>
            )}

            {images.length > 1 && (
              <>
                <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors border border-white/10">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors border border-white/10">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Badges overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border ${typeInfo.bg} ${typeInfo.color} backdrop-blur-sm`}>
                {typeInfo.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-black/40 backdrop-blur-sm border border-white/10 text-white`}>
                <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} /> {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 px-4 pb-4 overflow-x-auto custom-scrollbar shrink-0">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`h-14 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-purple-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Details */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0e0e16] relative">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5 flex items-start justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{project.title}</h2>
              {meta.brief && <p className="text-sm text-slate-400 mt-1 leading-relaxed font-mono">{meta.brief}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isAdmin && onEdit && (
                <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {isAdmin && onDelete && (
                <button onClick={onDelete} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-white/5 px-6 shrink-0">
            {(['overview', 'casestudy', 'process'] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={`pb-3 pt-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                {tab === 'overview' ? 'Despre Proiect' : tab === 'casestudy' ? 'Case Study' : 'Proces & Tools'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-5">
            {activeTab === 'overview' && (
              <div className="animate-in fade-in space-y-5">
                {meta.brief && <p className="text-base text-slate-300 leading-relaxed">{meta.brief}</p>}
                <div className="grid grid-cols-2 gap-4">
                  {meta.users && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5"><Users className="h-3 w-3" /> Target Users</p>
                      <p className="text-sm font-semibold text-slate-200">{meta.users}</p>
                    </div>
                  )}
                  {meta.role && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5"><Star className="h-3 w-3" /> Rolul Meu</p>
                      <p className="text-sm font-semibold text-slate-200">{meta.role}</p>
                    </div>
                  )}
                </div>
                {(project as any).dimensions && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Monitor className="w-4 h-4" /> {(project as any).dimensions} ecrane
                  </div>
                )}
                {(project as any).location && (
                  <a href={(project as any).location} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1ABCFE] hover:bg-[#1ABCFE]/90 text-black font-bold text-sm transition-all">
                    <Figma className="h-5 w-5" /> Deschide Prototip Interactiv
                  </a>
                )}
              </div>
            )}

            {activeTab === 'casestudy' && (
              <div className="animate-in fade-in space-y-6">
                {meta.problem ? (
                  <div className="relative pl-4 border-l-2 border-red-500/50">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><Target className="h-4 w-4 text-red-400" /> Problema & Context</h4>
                    <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{meta.problem}</p>
                  </div>
                ) : <p className="text-slate-500 italic text-sm">Nu a fost definită o problemă.</p>}
                {meta.solution && (
                  <div className="relative pl-4 border-l-2 border-emerald-500/50">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><Lightbulb className="h-4 w-4 text-emerald-400" /> Soluția Propusă</h4>
                    <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{meta.solution}</p>
                  </div>
                )}
                {meta.outcomes && (
                  <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-1.5"><BarChart3 className="h-4 w-4" /> Impact & Rezultate</h4>
                    <p className="text-sm leading-relaxed text-slate-200 font-medium whitespace-pre-wrap">{meta.outcomes}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'process' && (
              <div className="animate-in fade-in space-y-6">
                {meta.process && meta.process.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Layers className="h-4 w-4" /> Etape Parcurse</h4>
                    <div className="relative pl-3">
                      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/5" />
                      <div className="space-y-4">
                        {meta.process.map(step => (
                          <div key={step} className="flex items-center gap-4 relative z-10">
                            <div className="w-6 h-6 rounded-full bg-[#0e0e16] border-2 border-purple-500 flex items-center justify-center">
                              <Check className="h-3 w-3 text-purple-400" />
                            </div>
                            <span className="font-medium text-sm text-slate-300">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {tools.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Instrumente</h4>
                    <div className="flex flex-wrap gap-2">
                      {tools.map((t, i) => (
                        <span key={t} className={`text-xs px-3 py-1.5 rounded-lg bg-white/[0.03] border font-medium font-mono ${TOOL_TAG_COLORS[i % TOOL_TAG_COLORS.length]}`}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 bg-[#08080f] shrink-0">
            <div className="text-center text-[11px] text-slate-600 font-mono">{currentIdx + 1} / {projects.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit/Add Form Modal ───────────────────────────────────────────────────
const EMPTY_FORM = {
  title: '', brief: '', problem: '', solution: '', users: '', role: '',
  process: [] as string[], outcomes: '', type: 'mobile-app', platform: 'web',
  status: 'concept', tools: [] as string[], screens: '', prototypeUrl: '', isPrivate: false,
};
type FormState = typeof EMPTY_FORM;

function EditModal({ project, onClose, onSave, availableTools, onManageTools }: {
  project?: UiUxProject; onClose: () => void;
  onSave: (form: FormState, imageFiles: File[], imagePreviews: string[]) => void;
  availableTools: string[]; onManageTools: () => void;
}) {
  useModalEffects(true);
  const isEdit = !!project;
  const [activeTab, setActiveTab] = useState<'info' | 'process' | 'media'>('info');
  const [form, setForm] = useState<FormState>(() => {
    if (!project) return { ...EMPTY_FORM };
    const meta = parseMeta(project.description);
    return {
      title: project.title,
      brief: meta.brief,
      problem: meta.problem,
      solution: meta.solution,
      users: meta.users,
      role: meta.role,
      process: meta.process || [],
      outcomes: meta.outcomes,
      type: project.subcategory || 'mobile-app',
      platform: (project as any).device || 'web',
      status: (project as any).medium || 'concept',
      tools: (project as any).materials || [],
      screens: (project as any).dimensions || '',
      prototypeUrl: (project as any).location || '',
      isPrivate: project.isPrivate || false,
    };
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>(project ? getImages(project) : []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [toolSearch, setToolSearch] = useState('');
  const [showToolDrop, setShowToolDrop] = useState(false);
  const toolRef = useRef<HTMLDivElement>(null);
  useOutsideClick(toolRef, () => setShowToolDrop(false));

  const togglePhase = (phase: string) => setForm(f => ({ ...f, process: f.process.includes(phase) ? f.process.filter(p => p !== phase) : [...f.process, phase] }));
  const toggleTool = (tool: string) => setForm(f => ({ ...f, tools: f.tools.includes(tool) ? f.tools.filter(t => t !== tool) : [...f.tools, tool] }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const r = new FileReader();
      r.onloadend = () => setImagePreviews(prev => [...prev, r.result as string]);
      r.readAsDataURL(f);
    });
  };

  const filteredTools = availableTools.filter(t => t.toLowerCase().includes(toolSearch.toLowerCase()));

  const tabs = [
    { id: 'info' as const, label: 'Informații', icon: Layout },
    { id: 'process' as const, label: 'Proces & Tools', icon: Layers },
    { id: 'media' as const, label: 'Media & Linkuri', icon: LinkIcon },
  ];

  return (
    <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[5vh] overflow-y-auto p-4" onClick={onClose}>
      <form id="uiux-form" onSubmit={e => { e.preventDefault(); if (form.title.trim()) onSave(form, imageFiles, imagePreviews); }}
        className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-4"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0 rounded-t-3xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isEdit ? <Edit3 className="w-5 h-5 text-purple-400" /> : <Figma className="w-5 h-5 text-purple-400" />}
            {isEdit ? 'Editează Design' : 'Adaugă Design UI/UX'}
          </h2>
          <div className="flex gap-2 items-center">
            {/* Featured */}
            <button type="button" onClick={() => setForm(f => ({ ...f, isPrivate: !f.isPrivate }))}
              title={form.isPrivate ? 'Proiect Privat 🔒' : 'Proiect Public'}
              className={`p-2.5 rounded-xl border transition-all duration-300 ${form.isPrivate ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
              {form.isPrivate ? <Lock className="w-5 h-5 text-rose-400" /> : <Unlock className="w-5 h-5 text-slate-500" />}
            </button>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-6 pt-4 gap-6 bg-[#0c0c0c] overflow-x-auto custom-scrollbar shrink-0">
          {tabs.map(t => {
            const TIcon = t.icon;
            return (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <TIcon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5">

          {/* TAB 1: Informații */}
          {activeTab === 'info' && (
            <>
              <div>
                <label className={LabelStyle}>Titlu proiect <span className="text-red-400">*</span></label>
                <input type="text" className={InputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="ex: EcoTrack App" required />
              </div>
              <div>
                <label className={LabelStyle}>Descriere scurtă</label>
                <textarea className={`${InputStyle} resize-none`} value={form.brief} onChange={e => setForm(f => ({ ...f, brief: e.target.value }))} rows={2} placeholder="O frază care rezumă proiectul..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className={LabelStyle}>Tip proiect</label>
                  <select className={`${InputStyle} appearance-none pr-10 cursor-pointer`} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(PROJECT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-[30px] w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                <div className="relative">
                  <label className={LabelStyle}>Status</label>
                  <select className={`${InputStyle} appearance-none pr-10 cursor-pointer`} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-[30px] w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className={LabelStyle}>Platformă</label>
                  <select className={`${InputStyle} appearance-none pr-10 cursor-pointer`} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                    {Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-[30px] w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                <div>
                  <label className={LabelStyle}>Număr ecrane</label>
                  <input type="text" className={InputStyle} value={form.screens} onChange={e => setForm(f => ({ ...f, screens: e.target.value }))} placeholder="ex: 24+" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LabelStyle}>Utilizatori țintă</label>
                  <input type="text" className={InputStyle} value={form.users} onChange={e => setForm(f => ({ ...f, users: e.target.value }))} placeholder="ex: Studenți 18-25 ani" />
                </div>
                <div>
                  <label className={LabelStyle}>Rolul tău</label>
                  <input type="text" className={InputStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="ex: Lead UX Designer" />
                </div>
              </div>
            </>
          )}

          {/* TAB 2: Proces & Tools */}
          {activeTab === 'process' && (
            <>
              <div>
                <label className={LabelStyle}>Etape parcurse în proiect</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PROCESS_PHASES.map(phase => {
                    const isActive = form.process.includes(phase);
                    return (
                      <button key={phase} type="button" onClick={() => togglePhase(phase)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all text-left font-medium ${isActive ? 'border-purple-500/40 bg-purple-500/10 text-purple-400' : 'border-white/10 bg-[#09090b] text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-600'}`} />
                        {phase}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={LabelStyle}>Instrumente (Tools)</label>
                <div ref={toolRef} className="relative">
                  <div className={`flex items-center bg-[#09090b] border ${showToolDrop ? 'border-purple-500/50' : 'border-white/10'} rounded-xl px-4 py-2.5 gap-2 transition-all`}>
                    <Search className="w-4 h-4 text-slate-500 shrink-0" />
                    <input className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
                      placeholder="Caută sau adaugă instrument..."
                      value={toolSearch}
                      onChange={e => { setToolSearch(e.target.value); setShowToolDrop(true); }}
                      onFocus={() => setShowToolDrop(true)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const t = toolSearch.trim();
                          if (t) { toggleTool(t); setToolSearch(''); setShowToolDrop(false); }
                        }
                      }}
                    />
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform cursor-pointer ${showToolDrop ? 'rotate-180' : ''}`} onClick={() => setShowToolDrop(!showToolDrop)} />
                  </div>
                  {showToolDrop && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="max-h-44 overflow-y-auto custom-scrollbar py-1.5">
                        {filteredTools.map(t => (
                          <div key={t} onMouseDown={e => { e.preventDefault(); toggleTool(t); setToolSearch(''); setShowToolDrop(false); }}
                            className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${form.tools.includes(t) ? 'bg-purple-500/10 text-purple-400' : 'text-slate-300 hover:bg-white/5'}`}>
                            {t} {form.tools.includes(t) && <Check className="w-4 h-4" />}
                          </div>
                        ))}
                        {toolSearch.trim() && !availableTools.some(t => t.toLowerCase() === toolSearch.toLowerCase()) && (
                          <div onMouseDown={e => { e.preventDefault(); toggleTool(toolSearch.trim()); setToolSearch(''); setShowToolDrop(false); }}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer text-purple-400 hover:bg-white/5 transition-colors font-medium">
                            <Plus className="w-4 h-4" /> Adaugă "{toolSearch.trim()}"
                          </div>
                        )}
                      </div>
                      <div className="border-t border-white/5">
                        <div onMouseDown={e => { e.preventDefault(); setShowToolDrop(false); onManageTools(); }}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                          <Settings className="w-4 h-4 shrink-0" /> Gestionează instrumente
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {form.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {form.tools.map((t, i) => (
                      <span key={t} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-white/[0.03] border ${TOOL_TAG_COLORS[i % TOOL_TAG_COLORS.length]}`}>
                        {t}
                        <button type="button" onClick={() => toggleTool(t)} className="hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={LabelStyle}>Problema / Provocarea</label>
                <textarea className={`${InputStyle} resize-none`} value={form.problem} onChange={e => setForm(f => ({ ...f, problem: e.target.value }))} rows={3} placeholder="Ce problemă rezolvă acest design?" />
              </div>
              <div>
                <label className={LabelStyle}>Soluția Propusă</label>
                <textarea className={`${InputStyle} resize-none`} value={form.solution} onChange={e => setForm(f => ({ ...f, solution: e.target.value }))} rows={3} placeholder="Cum ai abordat problema?" />
              </div>
              <div>
                <label className={LabelStyle}>Impact & Rezultate</label>
                <textarea className={`${InputStyle} resize-none`} value={form.outcomes} onChange={e => setForm(f => ({ ...f, outcomes: e.target.value }))} rows={2} placeholder="Metrici, feedback, impact..." />
              </div>
            </>
          )}

          {/* TAB 3: Media & Linkuri */}
          {activeTab === 'media' && (
            <>
              <div>
                <label className={LabelStyle}>Link Prototip (Figma / Live)</label>
                <input type="text" className={InputStyle} value={form.prototypeUrl} onChange={e => setForm(f => ({ ...f, prototypeUrl: e.target.value }))} placeholder="https://figma.com/proto/..." />
              </div>
              <div>
                <label className={LabelStyle}>Imagini proiect <span className="normal-case tracking-normal text-slate-600">— selectare multiplă</span></label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-purple-500/30 transition-colors cursor-pointer">
                  <UploadCloud className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500">Click pentru a adăuga imagini (cover + ecrane)</p>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              {imagePreviews.length > 0 && (
                <div>
                  <label className={LabelStyle}>Previzualizare ({imagePreviews.length} imagini)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/5 bg-[#09090b] group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">{i === 0 ? 'Cover' : i + 1}</div>
                        <button type="button" onClick={() => { setImagePreviews(prev => prev.filter((_, j) => j !== i)); setImageFiles(prev => prev.length > i ? prev.filter((_, j) => j !== i) : prev); }}
                          className="absolute top-1.5 right-1.5 bg-red-500/90 hover:bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-[#09090b] flex gap-3 justify-end shrink-0 rounded-b-3xl">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors">Anulează</button>
          <button type="submit" form="uiux-form" className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all">
            {isEdit ? 'Salvează Modificările' : 'Adaugă Design'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Manage Tools Modal ────────────────────────────────────────────────────
function ManageToolsModal({ tools, onClose, onSave }: { tools: string[]; onClose: () => void; onSave: (tools: string[]) => void }) {
  useModalEffects(true);
  const [local, setLocal] = useState<string[]>([...tools]);
  const [newTool, setNewTool] = useState('');
  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Gestionează Instrumente</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {local.map(t => (
            <div key={t} className="flex items-center gap-3 bg-[#09090b] border border-white/5 rounded-xl px-3 py-2">
              <span className="flex-1 text-sm text-slate-200">{t}</span>
              <button type="button" onClick={() => setLocal(local.filter(x => x !== t))} className="text-slate-600 hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input type="text" value={newTool} onChange={e => setNewTool(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const t = newTool.trim(); if (t && !local.includes(t)) { setLocal([...local, t]); setNewTool(''); } } }} placeholder="Adaugă instrument nou..." className={InputStyle} />
            <button type="button" onClick={() => { const t = newTool.trim(); if (t && !local.includes(t)) { setLocal([...local, t]); setNewTool(''); } }} className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-xl text-sm font-bold hover:bg-purple-600/30 transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-5 border-t border-white/5 bg-[#09090b] flex gap-3 justify-end rounded-b-3xl">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors">Anulează</button>
          <button type="button" onClick={() => onSave(local)} className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all">Salvează</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function UiUxDesign() {
  const { isAdmin } = useAdmin();
  const { toast } = useToast();

  const [projects, setProjects] = useState<UiUxProject[]>([]);
  const [trashed, setTrashed] = useState<UiUxProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & sort
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showTrashView, setShowTrashView] = useState(false);
  const [page, setPage] = useState(1);

  // Modals
  const [selected, setSelected] = useState<UiUxProject | null>(null);
  const [editProject, setEditProject] = useState<UiUxProject | undefined>(undefined);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageTools, setShowManageTools] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<UiUxProject | null>(null);
  const [pendingHardDelete, setPendingHardDelete] = useState<UiUxProject | null>(null);
  const [uploading, setUploading] = useState(false);

  // Tools
  const [availableTools, setAvailableTools] = useState<string[]>(INITIAL_TOOLS);

  useEffect(() => {
    const saved = localStorage.getItem('ui_ux_tools');
    if (saved) try { setAvailableTools(JSON.parse(saved)); } catch { }
  }, []);

  const saveTools = (t: string[]) => { setAvailableTools(t); localStorage.setItem('ui_ux_tools', JSON.stringify(t)); };

  // Data loading
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const items = await getGalleryItemsByCategory('ui-ux');
      setProjects(isAdmin ? items : items.filter(p => !p.isPrivate));
    } catch {
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca proiectele.', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [isAdmin, toast]);

  const reloadTrash = useCallback(async () => {
    if (!isAdmin) return;
    try { setTrashed((await getTrashedGalleryItemsByCategory('ui-ux')) as UiUxProject[]); } catch { }
  }, [isAdmin]);

  useEffect(() => { reload(); reloadTrash(); }, [reload, reloadTrash]);

  // Filtered & sorted
  const visible = useMemo(() => {
    let list = showTrashView ? trashed : projects;
    if (!showTrashView) {
      if (search) list = list.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase()));
      if (filterType !== 'all') list = list.filter(p => p.subcategory === filterType);
      if (filterStatus !== 'all') list = list.filter(p => (p as any).medium === filterStatus);
      if (filterPlatform !== 'all') list = list.filter(p => (p as any).device === filterPlatform);
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
      if (sortBy === 'oldest') return (a.id || 0) - (b.id || 0);
      if (sortBy === 'az') return a.title.localeCompare(b.title);
      if (sortBy === 'za') return b.title.localeCompare(a.title);
      return 0;
    });
    return list;
  }, [projects, trashed, search, filterType, filterStatus, filterPlatform, sortBy, showTrashView]);

  const totalPages = Math.ceil(visible.length / PROJECTS_PER_PAGE);
  const paginated = visible.slice((page - 1) * PROJECTS_PER_PAGE, page * PROJECTS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, filterType, filterStatus, filterPlatform, sortBy, showTrashView]);

  // Stats

  // CRUD
  const buildPayload = (form: FormState, imageUrl: string, allImages: string) => ({
    category: 'ui-ux' as const,
    subcategory: form.type,
    title: form.title,
    image: imageUrl,
    description: encodeMeta({ brief: form.brief, problem: form.problem, solution: form.solution, users: form.users, role: form.role, process: form.process, outcomes: form.outcomes }),
    device: form.platform,
    materials: form.tools,
    dimensions: form.screens,
    location: form.prototypeUrl,
    medium: form.status,
    isPrivate: form.isPrivate,
    date: allImages,
  });

  const handleSave = async (form: FormState, imageFiles: File[], imagePreviews: string[]) => {
    try {
      setUploading(true);
      const existingUrls = imagePreviews.filter(p => p.startsWith('http'));
      let allUrls = [...existingUrls];
      for (const file of imageFiles) {
        const fd = new FormData(); fd.append('file', file); fd.append('folder', 'ui-ux');
        const res = await fetch('/api/upload/image', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Upload failed');
        allUrls.push((await res.json()).url);
      }
      const imageUrl = allUrls[0] || '';
      if (editProject) {
        await updateGalleryItem(editProject.id!, buildPayload(form, imageUrl, allUrls.join('|')) as any);
        toast({ title: 'Actualizat', description: 'Proiectul a fost salvat.' });
        setShowEditModal(false);
        setSelected(null);
      } else {
        if (!imageUrl) { toast({ title: 'Eroare', description: 'Adaugă cel puțin o imagine.', variant: 'destructive' }); return; }
        await createGalleryItem(buildPayload(form, imageUrl, allUrls.join('|')) as any);
        toast({ title: 'Publicat!', description: 'Design-ul a fost adăugat.' });
        setShowAddModal(false);
      }
      await reload();
    } catch { toast({ title: 'Eroare', description: 'Nu s-a putut salva proiectul.', variant: 'destructive' }); }
    finally { setUploading(false); setEditProject(undefined); }
  };

  const handleSoftDelete = async () => {
    if (!pendingDelete) return;
    try { await softDeleteGalleryItem(pendingDelete.id!); toast({ title: 'Mutat în coș', description: pendingDelete.title }); setPendingDelete(null); setSelected(null); await reload(); await reloadTrash(); }
    catch { toast({ title: 'Eroare', description: 'Ștergere eșuată.', variant: 'destructive' }); }
  };

  const handleRestore = async (p: UiUxProject) => {
    try { await restoreGalleryItem(p.id!); toast({ title: 'Restaurat', description: p.title }); await reload(); await reloadTrash(); }
    catch { toast({ title: 'Eroare', variant: 'destructive' }); }
  };

  const handleHardDelete = async () => {
    if (!pendingHardDelete) return;
    try { await deleteGalleryItem(pendingHardDelete.id!); toast({ title: 'Șters definitiv', description: pendingHardDelete.title }); setPendingHardDelete(null); await reloadTrash(); }
    catch { toast({ title: 'Eroare', variant: 'destructive' }); }
  };

  const typeOptions = [{ value: 'all', label: 'Toate tipurile' }, ...Object.entries(PROJECT_TYPES).map(([k, v]) => ({ value: k, label: v.label }))];
  const statusOptions = [{ value: 'all', label: 'Toate statusurile' }, ...Object.entries(STATUSES).map(([k, v]) => ({ value: k, label: v.label }))];
  const platformOptions = [{ value: 'all', label: 'Toate platformele' }, ...Object.entries(PLATFORMS).map(([k, v]) => ({ value: k, label: v.label }))];

  return (
    <PageLayout>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:6px;height:6px}.custom-scrollbar::-webkit-scrollbar-track{background:rgba(255,255,255,0.02);border-radius:8px}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.3);border-radius:8px}`}</style>

      <div className="min-h-screen bg-[#080810]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-10 space-y-10">

          {/* ── HEADER & STATS — identic Database ─── */}
          <div className="flex flex-col xl:flex-row gap-10 mb-2">
            {/* Left: title + subtitle */}
            <div className="xl:w-1/3 flex flex-col justify-center">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-white">
                Design{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                  UI/UX
                </span>
              </h1>
              <p className="text-slate-400 leading-relaxed text-sm md:text-base max-w-md">
                Interfețe, wireframes și concepte de experiență a utilizatorului —{' '}
                {projects.length} proiecte,{' '}
                {projects.filter(p => (p as any).medium === 'implemented').length} lansate.
              </p>
            </div>

            {/* Right: 4 stat cards */}
            <div className="xl:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Proiecte', value: projects.length, color: 'text-white' },
                { label: 'Mobile App', value: projects.filter(p => p.subcategory === 'mobile-app').length, color: 'text-amber-400' },
                { label: 'Web App', value: projects.filter(p => p.subcategory === 'web-app').length, color: 'text-blue-400' },
                { label: 'Lansate Live', value: projects.filter(p => (p as any).medium === 'implemented').length, color: 'text-emerald-400' },
              ].map(m => (
                <div key={m.label}
                  className="group relative bg-[#12121a] border border-white/5 rounded-[1.25rem] p-5 flex flex-col justify-between transition-all duration-500 hover:border-purple-500/30 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)] hover:-translate-y-1 overflow-hidden">
                  <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-indigo-500/5 transition-all duration-500 rounded-[1.25rem] pointer-events-none" />
                  <Figma className="w-5 h-5 text-slate-500 mb-3 group-hover:text-purple-400 transition-colors duration-300" />
                  <div className="relative z-10 mt-1">
                    <div className={`text-3xl font-black font-mono tracking-tighter mb-1 transition-colors group-hover:text-purple-50 ${m.color}`}>
                      {m.value}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-purple-200/70 transition-colors">
                      {m.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* ── Toolbar ──────────────────────────── */}
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-2 md:p-3">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input type="search" placeholder="Caută designuri..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#09090b] border border-white/5 hover:border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-slate-600" />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <CustomSelect value={filterType} onChange={setFilterType} options={typeOptions} icon={Filter} />
                <CustomSelect value={filterStatus} onChange={setFilterStatus} options={statusOptions} />
                <CustomSelect value={filterPlatform} onChange={setFilterPlatform} options={platformOptions} icon={Smartphone} />
                <CustomSelect value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} icon={ArrowUpDown} />
              </div>

              {/* Actions */}
              {isAdmin && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setShowTrashView(v => !v)}
                    className={`relative px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${showTrashView ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-[#09090b] text-slate-400 border-white/10 hover:bg-white/5'}`}>
                    <Trash2 className="w-4 h-4" />
                    {showTrashView ? 'Ieși din coș' : 'Coș'}
                    {!showTrashView && trashed.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center font-bold">{trashed.length}</span>
                    )}
                  </button>
                  {!showTrashView && (
                    <button onClick={() => { setEditProject(undefined); setShowAddModal(true); }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all">
                      <Plus className="w-4 h-4" /> Adaugă Design
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Grid ─────────────────────────────── */}
          {loading ? (
            <div className="text-center py-20 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-slate-400 text-sm">Se încarcă portofoliul...</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-3xl bg-[#0b0b10]">
              <Figma className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-base font-medium">
                {showTrashView ? 'Coșul de gunoi este gol.' : (search || filterType !== 'all' || filterStatus !== 'all' || filterPlatform !== 'all') ? 'Niciun proiect nu corespunde filtrelor.' : 'Nu există proiecte UI/UX încă.'}
              </p>
              {isAdmin && !showTrashView && !search && filterType === 'all' && (
                <button onClick={() => { setEditProject(undefined); setShowAddModal(true); }}
                  className="mt-6 flex items-center gap-2 mx-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all">
                  <Plus className="w-4 h-4" /> Adaugă primul design
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginated.map(p => (
                  <UiCard key={p.id} p={p} admin={isAdmin} isTrashView={showTrashView}
                    onClick={() => !showTrashView && setSelected(p)}
                    onEdit={() => { setEditProject(p); setShowEditModal(true); }}
                    onDel={() => showTrashView ? setPendingHardDelete(p) : setPendingDelete(p)}
                    onRestore={() => handleRestore(p)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-10 h-10 rounded-xl bg-[#12121a] border border-white/5 text-slate-400 hover:text-white hover:border-purple-500/30 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all border ${n === page ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'bg-[#12121a] border-white/5 text-slate-400 hover:text-white hover:border-purple-500/30'}`}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-10 h-10 rounded-xl bg-[#12121a] border border-white/5 text-slate-400 hover:text-white hover:border-purple-500/30 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────── */}

      {/* Detail view */}
      {selected && !showEditModal && !pendingDelete && (
        <ProjectModal project={selected} projects={visible} onClose={() => setSelected(null)} isAdmin={isAdmin}
          onEdit={isAdmin ? () => { setEditProject(selected); setSelected(null); setShowEditModal(true); } : undefined}
          onDelete={isAdmin ? () => { setPendingDelete(selected); setSelected(null); } : undefined}
        />
      )}

      {/* Add modal */}
      {isAdmin && showAddModal && (
        <EditModal onClose={() => setShowAddModal(false)} onSave={handleSave} availableTools={availableTools} onManageTools={() => { setShowAddModal(false); setShowManageTools(true); }} />
      )}

      {/* Edit modal */}
      {isAdmin && showEditModal && editProject && (
        <EditModal project={editProject} onClose={() => { setShowEditModal(false); setEditProject(undefined); }} onSave={handleSave} availableTools={availableTools} onManageTools={() => { setShowEditModal(false); setShowManageTools(true); }} />
      )}

      {/* Manage tools */}
      {showManageTools && (
        <ManageToolsModal tools={availableTools} onClose={() => setShowManageTools(false)} onSave={t => { saveTools(t); setShowManageTools(false); }} />
      )}

      {/* Soft delete confirm */}
      {pendingDelete && (
        <ConfirmModal title="Mută în coș" desc={`Ești sigur că vrei să muți „${pendingDelete.title}" în coșul de gunoi?`}
          onClose={() => setPendingDelete(null)} onConfirm={handleSoftDelete} confirmLabel="Mută în coș" danger />
      )}

      {/* Hard delete confirm */}
      {pendingHardDelete && (
        <ConfirmModal title="Ștergere permanentă" desc={`Ești sigur că vrei să ștergi definitiv „${pendingHardDelete.title}"? Acțiunea nu poate fi anulată.`}
          onClose={() => setPendingHardDelete(null)} onConfirm={handleHardDelete} confirmLabel="Șterge definitiv" danger />
      )}

      {/* Uploading overlay */}
      {uploading && (
        <div className="fixed inset-0 z-[10030] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-slate-300 text-sm font-medium">Se procesează...</p>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
