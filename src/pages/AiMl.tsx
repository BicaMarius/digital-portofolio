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
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  X,
  Edit3,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Check,
  AlertTriangle,
  Settings,
  Lock,
  Unlock,
  Star,
  BrainCircuit,
  Activity,
  Zap,
  Database,
  BarChart3,
  Cpu,
  HardDrive,
  Github,
  ExternalLink,
  Eye,
  MessageSquare,
  Table2,
  FolderKanban,
  Layout,
  Link as LinkIcon,
  UploadCloud,
} from 'lucide-react';

// ================= HELPERS =================
interface AIMLMeta {
  brief: string;
  problem: string;
  dataset: string;
  architecture: string;
  metrics: string;
  repoUrl: string;
  accuracy: string;
  inferenceTime: string;
  modelSize: string;
  trainingTime: string;
}

function parseMeta(desc: string | null | undefined): AIMLMeta {
  const empty: AIMLMeta = {
    brief: '',
    problem: '',
    dataset: '',
    architecture: '',
    metrics: '',
    repoUrl: '',
    accuracy: '',
    inferenceTime: '',
    modelSize: '',
    trainingTime: '',
  };
  if (!desc) return empty;
  try {
    const p = JSON.parse(desc);
    if (typeof p === 'object' && p !== null) return { ...empty, ...p };
  } catch {
    /* legacy plain text */
  }
  return { ...empty, brief: desc };
}

function encodeMeta(m: AIMLMeta): string {
  return JSON.stringify(m);
}

// ================= TYPES & CONSTANTS =================
interface MLProject {
  id: number;
  title: string;
  brief: string;
  problem: string;
  dataset: string;
  architecture: string;
  metricsText: string;
  repoUrl: string;
  demoUrl: string;
  accuracy: string;
  inferenceTime: string;
  modelSize: string;
  trainingTime: string;
  task: string;
  status: string;
  stack: string[];
  gradient: string;
  featured: boolean;
  isPrivate: boolean;
  isDeleted: boolean;
  compute: string;
  image: string;
}

interface FilterOption {
  id: string;
  label: string;
  color?: string;
}

type PendingAction =
  | { type: 'soft-delete'; project: MLProject }
  | { type: 'hard-delete'; project: MLProject }
  | { type: 'restore-all'; count: number }
  | { type: 'delete-all'; count: number };

const PROJECTS_PER_PAGE = 9;

const INITIAL_TASKS: FilterOption[] = [
  { id: 'nlp', label: 'NLP & LLMs', color: '#818cf8' },
  { id: 'cv', label: 'Computer Vision', color: '#34d399' },
  { id: 'predictive', label: 'Predictive Modeling', color: '#fbbf24' },
  { id: 'gen-ai', label: 'Generative AI', color: '#c084fc' },
  { id: 'data-science', label: 'Data Science / EDA', color: '#22d3ee' },
];

const INITIAL_STATUSES: FilterOption[] = [
  { id: 'deployed', label: 'Deployed (API)', color: '#34d399' },
  { id: 'model', label: 'Model Antrenat', color: '#fbbf24' },
  { id: 'experiment', label: 'Experiment', color: '#94a3b8' },
];

const TASK_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ElementType; gradient: string }> = {
  nlp: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30', icon: MessageSquare, gradient: 'from-indigo-600 via-purple-600 to-violet-500' },
  cv: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: Eye, gradient: 'from-rose-500 via-pink-500 to-purple-600' },
  predictive: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', icon: Activity, gradient: 'from-amber-500 via-orange-500 to-red-500' },
  'gen-ai': { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', icon: BrainCircuit, gradient: 'from-purple-600 via-fuchsia-500 to-pink-500' },
  'data-science': { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', icon: Database, gradient: 'from-cyan-500 via-blue-500 to-indigo-600' },
};

const STATUS_DOT_COLORS: Record<string, string> = {
  deployed: 'bg-emerald-400',
  model: 'bg-amber-400',
  experiment: 'bg-slate-400',
};

const STATUS_LABELS: Record<string, string> = {
  deployed: 'Deployed',
  model: 'Model Antrenat',
  experiment: 'Experiment',
};

// Colored stack tags
const STACK_TAG_COLORS = [
  'text-rose-400 border-rose-400/20',
  'text-emerald-400 border-emerald-400/20',
  'text-blue-400 border-blue-400/20',
  'text-amber-400 border-amber-400/20',
  'text-violet-400 border-violet-400/20',
  'text-cyan-400 border-cyan-400/20',
  'text-orange-400 border-orange-400/20',
  'text-pink-400 border-pink-400/20',
];

// Unit constants
const ACC_UNITS = [{ v: '%', l: '%' }];
const DATASET_UNITS = [{ v: 'K', l: 'K' }, { v: 'M', l: 'M' }, { v: 'B', l: 'B' }];
const QUERY_UNITS = [{ v: 'μs', l: 'μs' }, { v: 'ms', l: 'ms' }, { v: 's', l: 's' }];
const SIZE_UNITS = [{ v: 'KB', l: 'KB' }, { v: 'MB', l: 'MB' }, { v: 'GB', l: 'GB' }];
const TRAIN_UNITS = [{ v: 'min', l: 'min' }, { v: 'h', l: 'h' }, { v: 'zile', l: 'zile' }];

function splitValUnit(val: string, units: { v: string; l: string }[], defUnit: string): [string, string] {
  if (!val) return ['', defUnit];
  for (const u of units) {
    if (val.endsWith(u.v)) return [val.slice(0, -u.v.length).trim(), u.v];
  }
  return [val.replace(/[^0-9.]/g, ''), defUnit];
}

const InputStyle =
  'w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-slate-600';
const LabelStyle =
  'block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5';

// ================= HOOKS =================
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

// ================= CUSTOM SELECT =================
function CustomSelect({
  value, onChange, options, icon: Icon, onManage,
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ElementType; onManage?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative w-full sm:w-auto min-w-[170px] z-20">
      <div
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full bg-[#09090b] border ${open ? 'border-purple-500/50' : 'border-white/5'} hover:border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-300 cursor-pointer transition-all shadow-sm`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          <span className="truncate">{selected?.label || 'Selectează'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-full bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 py-1.5 z-50 flex flex-col">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((o) => (
              <div key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === o.value ? 'bg-purple-500/10 text-purple-400 font-medium' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                {o.label}
                {value === o.value && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
          {onManage && (
            <div className="mt-1 shrink-0">
              <div className="h-px w-full bg-white/10 mb-1" />
              <div
                onClick={() => { onManage(); setOpen(false); }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                <Settings className="w-4 h-4 shrink-0" />
                <span>Gestionează filtre</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ================= MANAGE FILTERS MODAL =================
function ManageFiltersModal({ title, items, onClose, onSave }: {
  title: string; items: FilterOption[]; onClose: () => void; onSave: (items: FilterOption[]) => void;
}) {
  const [local, setLocal] = useState<FilterOption[]>([...items]);
  const [newLabel, setNewLabel] = useState('');
  useModalEffects(true);

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const id = newLabel.trim().toLowerCase().replace(/\s+/g, '-');
    if (local.find((i) => i.id === id)) return;
    setLocal([...local, { id, label: newLabel.trim() }]);
    setNewLabel('');
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {local.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-[#09090b] border border-white/5 rounded-xl px-3 py-2">
              {item.color && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />}
              <input type="text" value={item.label} onChange={(e) => setLocal(local.map((i) => (i.id === item.id ? { ...i, label: e.target.value } : i)))} className="flex-1 bg-transparent text-sm text-slate-200 outline-none" />
              <button type="button" onClick={() => setLocal(local.filter((i) => i.id !== item.id))} className="text-slate-600 hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="Adaugă opțiune nouă..." className={InputStyle} />
            <button type="button" onClick={handleAdd} className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-xl text-sm font-bold hover:bg-purple-600/30 transition-colors whitespace-nowrap"><Plus className="w-4 h-4" /></button>
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

// ================= ACTION CONFIRMATION MODAL =================
function ActionConfirmationModal({ action, onClose, onConfirm, isProcessing }: {
  action: PendingAction; onClose: () => void; onConfirm: () => void; isProcessing: boolean;
}) {
  useModalEffects(true);
  const config = useMemo(() => {
    switch (action.type) {
      case 'soft-delete': return { title: 'Mută în coș', desc: `Ești sigur că vrei să muți „${action.project.title}" în coșul de gunoi?`, icon: Trash2, confirmLabel: 'Mută în coș', color: 'red' as const };
      case 'hard-delete': return { title: 'Ștergere permanentă', desc: `Ești sigur că vrei să ștergi definitiv „${action.project.title}"? Acțiunea nu poate fi anulată.`, icon: AlertTriangle, confirmLabel: 'Șterge definitiv', color: 'red' as const };
      case 'restore-all': return { title: 'Restaurează toate', desc: `Vrei să restaurezi ${action.count} modele din coșul de gunoi?`, icon: RotateCcw, confirmLabel: 'Restaurează toate', color: 'emerald' as const };
      case 'delete-all': return { title: 'Golește coșul', desc: `Vrei să ștergi definitiv ${action.count} modele?`, icon: AlertTriangle, confirmLabel: 'Șterge tot definitiv', color: 'red' as const };
    }
  }, [action]);
  const IconComp = config.icon;
  const isRed = config.color === 'red';

  return (
    <div className="fixed inset-0 z-[10020] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !isProcessing && onClose()}>
      <div className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isRed ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
            <IconComp className={`w-7 h-7 ${isRed ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{config.title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{config.desc}</p>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-center">
          <button type="button" onClick={onClose} disabled={isProcessing} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50">Anulează</button>
          <button type="button" onClick={onConfirm} disabled={isProcessing}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${isRed ? 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'}`}>
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= ML PROJECT CARD =================
function MLCard({ p, admin, onClick, onEdit, onDel, onRestore, isTrashView, tasksList }: {
  p: MLProject; admin: boolean; onClick: () => void; onEdit: () => void;
  onDel: () => void; onRestore?: () => void; isTrashView: boolean; tasksList: FilterOption[];
}) {
  const ts = TASK_STYLES[p.task] || TASK_STYLES.nlp;
  const TaskIcon = ts.icon;
  const taskLabel = tasksList.find((t) => t.id === p.task)?.label || p.task;
  const statusDot = STATUS_DOT_COLORS[p.status] || 'bg-slate-400';
  const statusLabel = STATUS_LABELS[p.status] || p.status;
  const accNum = parseFloat(p.accuracy) || 0;

  return (
    <div className="group relative bg-[#12121a] border border-white/5 rounded-[1.25rem] overflow-hidden cursor-pointer transition-all duration-[350ms]"
      style={{ transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)' }}
      onClick={onClick}
      onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = 'translateY(-5px)'; el.style.borderColor = 'rgba(255,255,255,0.15)'; el.style.boxShadow = '0 8px 30px rgba(139,92,246,0.12)'; }}
      onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = 'translateY(0)'; el.style.borderColor = 'rgba(255,255,255,0.05)'; el.style.boxShadow = 'none'; }}
    >
      {/* Gradient Header */}
      <div className={`relative h-32 bg-gradient-to-r ${ts.gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50" />
        {/* Task badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-[11px] font-bold border border-white/10">
            <TaskIcon className="w-3 h-3" /> {taskLabel}
          </span>
        </div>
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-[11px] font-bold border border-white/10">
            <span className={`w-2 h-2 rounded-full ${statusDot}`} /> {statusLabel}
          </span>
        </div>
        {/* Accuracy badge */}
        {p.accuracy && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[13px] font-bold font-mono border border-white/10">
              {p.accuracy} accuracy
            </span>
          </div>
        )}
        {/* Admin actions */}
        {admin && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isTrashView ? (
              <>
                <button type="button" onClick={(e) => { e.stopPropagation(); onRestore?.(); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-white/10" title="Restaurează"><RotateCcw className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={(e) => { e.stopPropagation(); onDel(); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm text-red-400 hover:bg-red-500/20 transition-colors border border-white/10" title="Șterge"><Trash2 className="w-3.5 h-3.5" /></button>
              </>
            ) : (
              <>
                <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm text-white hover:bg-white/20 transition-colors border border-white/10" title="Editează"><Edit3 className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={(e) => { e.stopPropagation(); onDel(); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm text-red-400 hover:bg-red-500/20 transition-colors border border-white/10" title="Coș"><Trash2 className="w-3.5 h-3.5" /></button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5">
        <h3 className="text-[15px] font-bold text-white line-clamp-1">{p.title}</h3>
        <p className="text-[11px] text-slate-400 font-mono mt-1 line-clamp-1">{p.brief || p.problem || '—'}</p>

        {/* Accuracy Bar */}
        {p.accuracy && accNum > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Accuracy</span>
              <span className={`text-[12px] font-bold font-mono ${ts.text}`}>{p.accuracy}</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${ts.gradient} transition-all duration-700`}
                style={{ width: `${Math.min(accNum, 100)}%` }} />
            </div>
          </div>
        )}

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { value: p.dataset || '—', label: 'Dataset' },
            { value: p.inferenceTime || '—', label: 'Inferență' },
            { value: p.modelSize || '—', label: 'Model' },
          ].map((m) => (
            <div key={m.label} className="bg-[#0d0d15] border border-white/5 rounded-xl p-2.5 text-center">
              <div className="text-[13px] font-bold text-white font-mono leading-tight">{m.value}</div>
              <div className="text-[8px] text-slate-500 uppercase tracking-wide mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Tech Stack Pills — colored */}
        {p.stack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {p.stack.map((t, i) => (
              <span key={t} className={`px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.03] border font-mono ${STACK_TAG_COLORS[i % STACK_TAG_COLORS.length]}`}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Featured badge */}
      {p.featured && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 backdrop-blur-sm text-amber-400 text-[9px] font-bold border border-amber-500/30">
          <Star className="w-2.5 h-2.5" /> Featured
        </div>
      )}
    </div>
  );
}

// ================= EDIT MODAL =================
function EditModal({ project, onClose, onSave, tasksList }: {
  project?: MLProject; onClose: () => void;
  onSave: (data: MLProject) => void; tasksList: FilterOption[];
}) {
  const isEdit = !!project;
  useModalEffects(true);
  const [activeTab, setActiveTab] = useState<'general' | 'tehnic' | 'media'>('general');

  // Unit states
  const [accNum, setAccNum] = useState(() => splitValUnit(project?.accuracy || '', ACC_UNITS, '%')[0]);
  const [accUnit] = useState('%');
  const [dataNum, setDataNum] = useState(() => splitValUnit(project?.dataset || '', DATASET_UNITS, 'K')[0]);
  const [dataUnit, setDataUnit] = useState(() => splitValUnit(project?.dataset || '', DATASET_UNITS, 'K')[1]);
  const [infNum, setInfNum] = useState(() => splitValUnit(project?.inferenceTime || '', QUERY_UNITS, 'ms')[0]);
  const [infUnit, setInfUnit] = useState(() => splitValUnit(project?.inferenceTime || '', QUERY_UNITS, 'ms')[1]);
  const [sizeNum, setSizeNum] = useState(() => splitValUnit(project?.modelSize || '', SIZE_UNITS, 'MB')[0]);
  const [sizeUnit, setSizeUnit] = useState(() => splitValUnit(project?.modelSize || '', SIZE_UNITS, 'MB')[1]);
  const [trainNum, setTrainNum] = useState(() => splitValUnit(project?.trainingTime || '', TRAIN_UNITS, 'h')[0]);
  const [trainUnit, setTrainUnit] = useState(() => splitValUnit(project?.trainingTime || '', TRAIN_UNITS, 'h')[1]);

  const [f, setF] = useState<MLProject>({
    id: project?.id || 0,
    title: project?.title || '',
    brief: project?.brief || '',
    problem: project?.problem || '',
    dataset: project?.dataset || '',
    architecture: project?.architecture || '',
    metricsText: project?.metricsText || '',
    repoUrl: project?.repoUrl || '',
    demoUrl: project?.demoUrl || '',
    accuracy: project?.accuracy || '',
    inferenceTime: project?.inferenceTime || '',
    modelSize: project?.modelSize || '',
    trainingTime: project?.trainingTime || '',
    task: project?.task || 'nlp',
    status: project?.status || 'experiment',
    stack: project?.stack || [],
    gradient: project?.gradient || '',
    featured: project?.featured || false,
    isPrivate: project?.isPrivate || false,
    isDeleted: false,
    compute: project?.compute || '',
    image: project?.image || '',
  });

  const [stackInput, setStackInput] = useState(project?.stack.join(', ') || '');

  const parsedStack = useMemo(() => {
    return stackInput.split(',').map((s) => s.trim()).filter(Boolean);
  }, [stackInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    const combined = {
      ...f,
      stack: parsedStack,
      accuracy: accNum ? `${accNum}${accUnit}` : '',
      dataset: dataNum ? `${dataNum}${dataUnit}` : '',
      inferenceTime: infNum ? `${infNum}${infUnit}` : '',
      modelSize: sizeNum ? `${sizeNum}${sizeUnit}` : '',
      trainingTime: trainNum ? `${trainNum}${trainUnit}` : '',
    };
    onSave(combined);
  };

  const tabs = [
    { id: 'general' as const, label: 'Informații', icon: Layout },
    { id: 'tehnic' as const, label: 'Stack Tehnic', icon: BrainCircuit },
    { id: 'media' as const, label: 'Media & Linkuri', icon: LinkIcon },
  ];

  return (
    <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[5vh] overflow-y-auto p-4" onClick={onClose}>
      <form id="ml-project-form" onSubmit={handleSubmit}
        className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-4"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0 rounded-t-3xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isEdit ? <Edit3 className="w-5 h-5 text-purple-400" /> : <BrainCircuit className="w-5 h-5 text-purple-400" />}
            {isEdit ? 'Editează Modelul' : 'Adaugă Model AI/ML'}
          </h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Underline Tabs */}
        <div className="flex border-b border-white/5 px-6 pt-4 gap-6 bg-[#0c0c0c] overflow-x-auto custom-scrollbar shrink-0">
          {tabs.map((t) => {
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
          {/* ========== TAB 1: INFORMAȚII ========== */}
          {activeTab === 'general' && (
            <>
              {/* Title + Icon Toggles */}
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className={LabelStyle}>Titlu model <span className="text-red-400">*</span></label>
                  <input type="text" className={InputStyle} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="RoSentiment NLP" required />
                </div>
                <div className="flex gap-2 pt-6 shrink-0">
                  <button type="button" onClick={() => setF({ ...f, featured: !f.featured })} title={f.featured ? 'Featured ✓' : 'Setează ca Featured'}
                    className={`p-2.5 rounded-xl border transition-all duration-300 ${f.featured ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    <Star className={`w-5 h-5 transition-all duration-300 ${f.featured ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                  </button>
                  <button type="button" onClick={() => setF({ ...f, isPrivate: !f.isPrivate })} title={f.isPrivate ? 'Proiect Privat 🔒' : 'Proiect Public'}
                    className={`p-2.5 rounded-xl border transition-all duration-300 ${f.isPrivate ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    {f.isPrivate ? <Lock className="w-5 h-5 text-rose-400" /> : <Unlock className="w-5 h-5 text-slate-500" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LabelStyle}>Descriere scurtă</label>
                <textarea className={`${InputStyle} resize-none`} value={f.brief} onChange={(e) => setF({ ...f, brief: e.target.value })} rows={2} placeholder="Analiză sentiment text românesc — BERT fine-tuned" />
              </div>
              <div>
                <label className={LabelStyle}>Problemă / Obiectiv</label>
                <textarea className={`${InputStyle} resize-none`} value={f.problem} onChange={(e) => setF({ ...f, problem: e.target.value })} rows={3} placeholder="Clasificare binară a sentimentului..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className={LabelStyle}>Task AI</label>
                  <select className={`${InputStyle} appearance-none pr-10 cursor-pointer`} value={f.task} onChange={(e) => setF({ ...f, task: e.target.value })}>
                    {tasksList.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-[30px] w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                <div className="relative">
                  <label className={LabelStyle}>Status</label>
                  <select className={`${InputStyle} appearance-none pr-10 cursor-pointer`} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                    <option value="deployed">Deployed (API)</option>
                    <option value="model">Model Antrenat</option>
                    <option value="experiment">Experiment</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-[30px] w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={LabelStyle}>Arhitectură model</label>
                <textarea className={`${InputStyle} resize-none`} value={f.architecture} onChange={(e) => setF({ ...f, architecture: e.target.value })} rows={2} placeholder="BERT-base-multilingual → fine-tuned pe RoSentiment..." />
              </div>
            </>
          )}

          {/* ========== TAB 2: STACK TEHNIC ========== */}
          {activeTab === 'tehnic' && (
            <>
              {/* Accuracy */}
              <div>
                <label className={LabelStyle}>Accuracy <span className="normal-case tracking-normal text-slate-600">— 0 la 100</span></label>
                <div className="flex gap-2">
                  <input type="number" min="0" max="100" step="0.1" className={`${InputStyle} flex-1`} value={accNum} onChange={(e) => setAccNum(e.target.value)} placeholder="91.4" />
                  <div className="bg-[#09090b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-400 font-mono shrink-0">%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Dataset */}
                <div>
                  <label className={LabelStyle}>Dataset</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" className={`${InputStyle} flex-1`} value={dataNum} onChange={(e) => setDataNum(e.target.value)} placeholder="280" />
                    <select className="bg-[#09090b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-purple-500/50 shrink-0 cursor-pointer" value={dataUnit} onChange={(e) => setDataUnit(e.target.value)}>
                      {DATASET_UNITS.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
                    </select>
                  </div>
                </div>
                {/* Inference */}
                <div>
                  <label className={LabelStyle}>Inferență</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" step="0.1" className={`${InputStyle} flex-1`} value={infNum} onChange={(e) => setInfNum(e.target.value)} placeholder="45" />
                    <select className="bg-[#09090b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-purple-500/50 shrink-0 cursor-pointer" value={infUnit} onChange={(e) => setInfUnit(e.target.value)}>
                      {QUERY_UNITS.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Model Size */}
                <div>
                  <label className={LabelStyle}>Model Size</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" step="0.1" className={`${InputStyle} flex-1`} value={sizeNum} onChange={(e) => setSizeNum(e.target.value)} placeholder="438" />
                    <select className="bg-[#09090b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-purple-500/50 shrink-0 cursor-pointer" value={sizeUnit} onChange={(e) => setSizeUnit(e.target.value)}>
                      {SIZE_UNITS.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
                    </select>
                  </div>
                </div>
                {/* Training Time */}
                <div>
                  <label className={LabelStyle}>Timp Antrenare</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" step="0.5" className={`${InputStyle} flex-1`} value={trainNum} onChange={(e) => setTrainNum(e.target.value)} placeholder="8" />
                    <select className="bg-[#09090b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-purple-500/50 shrink-0 cursor-pointer" value={trainUnit} onChange={(e) => setTrainUnit(e.target.value)}>
                      {TRAIN_UNITS.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className={LabelStyle}>Compute</label>
                <input type="text" className={InputStyle} value={f.compute} onChange={(e) => setF({ ...f, compute: e.target.value })} placeholder="NVIDIA A100" />
              </div>
              <div>
                <label className={LabelStyle}>Metrici detaliate</label>
                <textarea className={`${InputStyle} resize-none`} value={f.metricsText} onChange={(e) => setF({ ...f, metricsText: e.target.value })} rows={3} placeholder="F1: 0.91, Precision: 0.92, Recall: 0.90" />
              </div>
              <div>
                <label className={LabelStyle}>Tech Stack <span className="normal-case tracking-normal text-slate-600">— separat cu virgulă</span></label>
                <textarea className={`${InputStyle} resize-none font-mono`} value={stackInput} onChange={(e) => setStackInput(e.target.value)} rows={2} placeholder="PyTorch, HuggingFace Transformers, FastAPI" />
              </div>
              {parsedStack.length > 0 && (
                <div>
                  <label className={LabelStyle}>Previzualizare stack</label>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedStack.map((t, i) => (
                      <span key={t} className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-white/[0.03] border ${STACK_TAG_COLORS[i % STACK_TAG_COLORS.length]}`}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========== TAB 3: MEDIA & LINKURI ========== */}
          {activeTab === 'media' && (
            <>
              <div>
                <label className={LabelStyle}>Imagini Proiect</label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-purple-500/30 transition-colors">
                  <UploadCloud className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Drag & drop sau click pentru a adăuga imagini</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LabelStyle}>URL Demo Live</label>
                  <input type="text" className={InputStyle} value={f.demoUrl} onChange={(e) => setF({ ...f, demoUrl: e.target.value })} placeholder="https://demo.example.com" />
                </div>
                <div>
                  <label className={LabelStyle}>URL GitHub / Repo</label>
                  <input type="text" className={InputStyle} value={f.repoUrl} onChange={(e) => setF({ ...f, repoUrl: e.target.value })} placeholder="https://github.com/..." />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-[#09090b] flex gap-3 justify-end shrink-0 rounded-b-3xl">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors">Anulează</button>
          <button type="submit" form="ml-project-form" className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all">
            {isEdit ? 'Salvează Modificările' : 'Adaugă Modelul'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ================= PROJECT DETAIL MODAL =================
function ProjectDetailModal({ p, onClose, allProjects, onNavigate, tasksList }: {
  p: MLProject; onClose: () => void; allProjects: MLProject[];
  onNavigate: (p: MLProject) => void; tasksList: FilterOption[];
}) {
  useModalEffects(true);
  const [activeTab, setActiveTab] = useState<'despre' | 'tehnic' | 'highlights'>('despre');

  const currentIdx = allProjects.findIndex((pr) => pr.id === p.id);
  const canPrev = currentIdx > 0;
  const canNext = currentIdx < allProjects.length - 1;
  const ts = TASK_STYLES[p.task] || TASK_STYLES.nlp;
  const TaskIcon = ts.icon;
  const taskLabel = tasksList.find((t) => t.id === p.task)?.label || p.task;
  const accNum = parseFloat(p.accuracy) || 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && canPrev) onNavigate(allProjects[currentIdx - 1]);
      if (e.key === 'ArrowRight' && canNext) onNavigate(allProjects[currentIdx + 1]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [p, currentIdx, canPrev, canNext, allProjects, onNavigate, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Nav arrows */}
      {canPrev && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onNavigate(allProjects[currentIdx - 1]); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-[10001] w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canNext && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onNavigate(allProjects[currentIdx + 1]); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-[10001] w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[1100px] h-[85vh] bg-[#0b0b12] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 text-white/70 hover:text-white rounded-full backdrop-blur-md transition-all border border-transparent hover:border-white/10">
          <X className="w-5 h-5" />
        </button>

        {/* Gradient banner */}
        <div className={`relative h-28 bg-gradient-to-r ${ts.gradient} shrink-0 overflow-hidden`}>
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-[12px] font-bold border border-white/10">
              <TaskIcon className="w-3.5 h-3.5" /> {taskLabel}
            </span>
          </div>
          {p.accuracy && (
            <div className="absolute bottom-4 left-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[14px] font-bold font-mono border border-white/10">{p.accuracy} accuracy</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 md:p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar relative z-10 pr-2">
            {/* Title area */}
            <div className="mb-6 shrink-0">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                {p.title}
                {p.isPrivate && <Lock className="w-6 h-6 text-white/30" />}
                {p.featured && <Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
              </h2>
              {p.brief && <p className="text-sm text-slate-400 mt-2 font-mono">{p.brief}</p>}
            </div>

            {/* Accuracy bar */}
            {p.accuracy && accNum > 0 && (
              <div className="mb-6 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Accuracy</span>
                  <span className={`text-[14px] font-bold font-mono ${ts.text}`}>{p.accuracy}</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${ts.gradient}`} style={{ width: `${Math.min(accNum, 100)}%` }} />
                </div>
              </div>
            )}

            {/* Metrics grid — WebDev style */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8 shrink-0">
              {[
                { l: 'Dataset', v: p.dataset || '—', i: Database },
                { l: 'Inferență', v: p.inferenceTime || '—', i: Zap },
                { l: 'Model Size', v: p.modelSize || '—', i: HardDrive },
                { l: 'Antrenare', v: p.trainingTime || '—', i: Activity },
                { l: 'Compute', v: p.compute || '—', i: Cpu },
                { l: 'Status', v: STATUS_LABELS[p.status] || p.status, i: FolderKanban },
              ].map((m, idx) => (
                <div key={idx}
                  className="bg-[#12121a] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-colors hover:border-purple-500/30 hover:bg-purple-500/5 group">
                  <m.i className="w-4 h-4 text-purple-400/60 group-hover:text-purple-400 mb-1.5 transition-colors" />
                  <div className="text-sm font-bold text-slate-200 group-hover:text-white font-mono transition-colors">{m.v}</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 group-hover:text-purple-300/70 transition-colors">{m.l}</div>
                </div>
              ))}
            </div>

            {/* Tabbed content */}
            <div className="flex gap-6 border-b border-white/10 mb-5 shrink-0">
              {(['despre', 'tehnic', 'highlights'] as const).map((tab) => (
                <button type="button" key={tab} onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-[150px] pb-24">
              {activeTab === 'despre' && (
                <div className="animate-in fade-in space-y-4">
                  {p.problem && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Problemă / Obiectiv</h4>
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{p.problem}</p>
                    </div>
                  )}
                  {p.architecture && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Arhitectură Model</h4>
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">{p.architecture}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tehnic' && (
                <div className="animate-in fade-in space-y-6">
                  {/* Tech stack cards */}
                  {p.stack.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Tech Stack</div>
                      <div className="rounded-xl border p-4" style={{ background: 'linear-gradient(180deg, rgba(147,51,234,0.08) 0%, rgba(255,255,255,0.04) 100%)', borderColor: 'rgba(147,51,234,0.2)' }}>
                        <div className="flex flex-wrap gap-1.5">
                          {p.stack.map((t, i) => (
                            <span key={t} className={`text-xs font-mono px-2 py-1 rounded-md border w-fit bg-white/[0.03] ${STACK_TAG_COLORS[i % STACK_TAG_COLORS.length]}`}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detailed metrics */}
                  {p.metricsText && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Metrici Detaliate</h4>
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">{p.metricsText}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'highlights' && (
                <div className="animate-in fade-in space-y-4">
                  {/* Accuracy highlight */}
                  {p.accuracy && accNum > 0 && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Performanță Model</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">Accuracy</span>
                        <span className={`text-lg font-bold font-mono ${ts.text}`}>{p.accuracy}</span>
                      </div>
                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${ts.gradient} transition-all duration-1000`} style={{ width: `${Math.min(accNum, 100)}%` }} />
                      </div>
                    </div>
                  )}
                  {/* Key stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { k: 'Dataset', v: p.dataset },
                      { k: 'Timp Antrenare', v: p.trainingTime },
                      { k: 'Inferență', v: p.inferenceTime },
                      { k: 'Model Size', v: p.modelSize },
                    ].filter(x => x.v).map((item) => (
                      <div key={item.k} className="flex gap-3 items-start bg-white/5 p-3 rounded-xl border border-white/5">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest">{item.k}</div>
                          <div className="text-sm text-slate-200 font-mono mt-0.5">{item.v}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer with action buttons */}
          <div className="p-6 md:p-8 pt-4 border-t border-white/10 bg-[#08080f] shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              {p.demoUrl && (
                <a href={p.demoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl bg-white text-black hover:bg-slate-200 text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                  <ExternalLink className="w-4 h-4" /> Live Demo
                </a>
              )}
              {p.repoUrl && (
                <a href={p.repoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 text-sm font-bold transition-all">
                  <Github className="w-4 h-4" /> Cod Sursă
                </a>
              )}
              {!p.demoUrl && !p.repoUrl && (
                <div className="w-full flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-mono">Niciun link public disponibil.</div>
                  <div className="text-[11px] text-slate-600 font-mono">{currentIdx + 1} / {allProjects.length}</div>
                </div>
              )}
            </div>
            {(p.demoUrl || p.repoUrl) && (
              <div className="text-center mt-3 text-[11px] text-slate-600 font-mono">{currentIdx + 1} / {allProjects.length}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= PAGINATION =================
function Pagination({ currentPage, totalPages, totalItems, onPageChange }: {
  currentPage: number; totalPages: number; totalItems: number; onPageChange: (page: number) => void;
}) {
  const pages: (number | string)[] = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const p: (number | string)[] = [1];
    if (currentPage > 3) p.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) p.push(i);
    if (currentPage < totalPages - 2) p.push('...');
    p.push(totalPages);
    return p;
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col items-center gap-3 mt-12 mb-8">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${currentPage === 1 ? 'bg-[#12121a] border border-white/5 text-slate-600 cursor-not-allowed' : 'bg-[#12121a] border border-white/5 text-slate-400 hover:border-white/20 hover:text-white'}`}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((page, i) => typeof page === 'string' ? (
          <span key={`e-${i}`} className="w-10 h-10 flex items-center justify-center text-slate-600 text-sm">…</span>
        ) : (
          <button key={page} type="button" onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300 ${currentPage === page ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]' : 'bg-[#12121a] border border-white/5 text-slate-400 hover:border-white/20 hover:text-white'}`}>
            {page}
          </button>
        ))}
        <button type="button" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${currentPage === totalPages ? 'bg-[#12121a] border border-white/5 text-slate-600 cursor-not-allowed' : 'bg-[#12121a] border border-white/5 text-slate-400 hover:border-white/20 hover:text-white'}`}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="text-[11px] text-slate-500 font-mono">Pagina {currentPage} din {totalPages} · {totalItems} modele</div>
    </div>
  );
}

// ================= PAGINA PRINCIPALĂ =================
export default function AiMl() {
  const { isAdmin } = useAdmin();
  const { toast } = useToast();

  const [cloudProjects, setCloudProjects] = useState<GalleryItem[]>([]);
  const [trashedCloud, setTrashedCloud] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [tasks, setTasks] = useState<FilterOption[]>(INITIAL_TASKS);
  const [statuses, setStatuses] = useState<FilterOption[]>(INITIAL_STATUSES);

  const [sel, setSel] = useState<MLProject | null>(null);
  const [editingProj, setEditingProj] = useState<MLProject | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [manageFilterType, setManageFilterType] = useState<'task' | 'status' | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  const [search, setSearch] = useState('');
  const [fTask, setFTask] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // ---- Data Loading ----
  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await getGalleryItemsByCategory('ai-ml');
      setCloudProjects(items);
    } catch {
      toast({ variant: 'destructive', title: 'Eroare', description: 'Nu s-au putut încărca modelele.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const reloadTrash = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const items = await getTrashedGalleryItemsByCategory('ai-ml');
      setTrashedCloud(items);
    } catch { /* silent */ }
  }, [isAdmin]);

  useEffect(() => { reload(); reloadTrash(); }, [reload, reloadTrash]);

  // ---- Map cloud data → MLProject ----
  const processedProjects: MLProject[] = useMemo(() => {
    const allItems = showTrash ? trashedCloud : cloudProjects;
    const source = isAdmin ? allItems : allItems.filter((p) => !p.isPrivate);

    return source.map((p: any) => {
      const meta = parseMeta(p.description);
      const stack: string[] = p.materials || [];
      // featured encoded in date field as prefix "featured:" or in location for demo URL
      const isFeatured = (p.date || '').includes('featured:true');

      return {
        id: p.id,
        title: p.title || '',
        brief: meta.brief,
        problem: meta.problem,
        dataset: meta.dataset,
        architecture: meta.architecture,
        metricsText: meta.metrics,
        repoUrl: meta.repoUrl,
        demoUrl: p.location || '',
        accuracy: meta.accuracy || '',
        inferenceTime: meta.inferenceTime || '',
        modelSize: meta.modelSize || '',
        trainingTime: meta.trainingTime || '',
        task: p.subcategory || 'nlp',
        status: p.medium || 'experiment',
        stack,
        gradient: '',
        featured: isFeatured,
        isPrivate: p.isPrivate || false,
        isDeleted: !!p.deletedAt,
        compute: p.device || '',
        image: p.image || '',
      };
    });
  }, [cloudProjects, trashedCloud, showTrash, isAdmin]);

  const activeProjects = processedProjects.filter((p) => !p.isDeleted);
  const deletedProjects = processedProjects.filter((p) => p.isDeleted);
  const visibleProjects = showTrash ? deletedProjects : activeProjects;

  // ---- Filter & Sort ----
  const filtered = useMemo(() => {
    let result = visibleProjects.filter((p) => {
      const ms = p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.brief.toLowerCase().includes(search.toLowerCase());
      return ms && (fTask === 'all' || p.task === fTask) && (fStatus === 'all' || p.status === fStatus);
    });
    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'accuracy') return (parseFloat(b.accuracy) || 0) - (parseFloat(a.accuracy) || 0);
      return b.id - a.id;
    });
    return result;
  }, [visibleProjects, search, fTask, fStatus, sortBy]);

  const totalPages = Math.ceil(filtered.length / PROJECTS_PER_PAGE);
  const paginatedProjects = filtered.slice((currentPage - 1) * PROJECTS_PER_PAGE, currentPage * PROJECTS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, fTask, fStatus, sortBy, showTrash]);

  // ---- Stats ----
  // For stats, always use non-trashed projects from cloud
  const allActiveFromCloud: MLProject[] = useMemo(() => {
    return cloudProjects.filter((p: any) => !p.deletedAt).map((p: any) => {
      const meta = parseMeta(p.description);
      return {
        id: p.id, title: p.title || '', brief: meta.brief, problem: meta.problem, dataset: meta.dataset,
        architecture: meta.architecture, metricsText: meta.metrics, repoUrl: meta.repoUrl, demoUrl: p.location || '',
        accuracy: meta.accuracy || '', inferenceTime: meta.inferenceTime || '', modelSize: meta.modelSize || '',
        trainingTime: meta.trainingTime || '', task: p.subcategory || 'nlp', status: p.medium || 'experiment',
        stack: p.materials || [], gradient: '', featured: false, isPrivate: p.isPrivate || false, isDeleted: false,
        compute: p.device || '', image: p.image || '',
      };
    });
  }, [cloudProjects]);

  const deployedCount = allActiveFromCloud.filter((p) => p.status === 'deployed').length;
  const avgAccuracy = allActiveFromCloud.length > 0
    ? (allActiveFromCloud.reduce((s, p) => s + (parseFloat(p.accuracy) || 0), 0) / allActiveFromCloud.filter(p => parseFloat(p.accuracy) > 0).length).toFixed(1)
    : '0';
  const totalTrainingHours = allActiveFromCloud.reduce((s, p) => {
    const match = p.trainingTime.match(/(\d+)/);
    return s + (match ? parseInt(match[1], 10) : 0);
  }, 0);

  const statsData = [
    { l: 'Modele ML', v: allActiveFromCloud.length, icon: BrainCircuit },
    { l: 'Deployate Live', v: deployedCount, icon: Activity },
    { l: 'Acuratețe Medie', v: `${avgAccuracy}%`, icon: BarChart3 },
    { l: 'Timp Antrenare', v: `${totalTrainingHours}h`, icon: Cpu },
  ];

  // ---- CRUD Operations ----
  const handleSaveProject = async (proj: MLProject) => {
    const meta: AIMLMeta = {
      brief: proj.brief,
      problem: proj.problem,
      dataset: proj.dataset,
      architecture: proj.architecture,
      metrics: proj.metricsText,
      repoUrl: proj.repoUrl,
      accuracy: proj.accuracy,
      inferenceTime: proj.inferenceTime,
      modelSize: proj.modelSize,
      trainingTime: proj.trainingTime,
    };

    const apiPayload: any = {
      title: proj.title,
      image: proj.image || 'placeholder',
      category: 'ai-ml',
      subcategory: proj.task,
      isPrivate: proj.isPrivate,
      medium: proj.status,
      description: encodeMeta(meta),
      materials: proj.stack,
      dimensions: proj.dataset,
      device: proj.compute,
      location: proj.demoUrl,
      date: proj.featured ? 'featured:true' : '',
    };

    try {
      if (editingProj && editingProj.id > 0) {
        await updateGalleryItem(proj.id, apiPayload);
        toast({ title: 'Actualizat', description: 'Modelul a fost salvat.' });
      } else {
        await createGalleryItem(apiPayload);
        toast({ title: 'Creat', description: 'Noul model a fost adăugat.' });
      }
      setShowAdd(false);
      setEditingProj(null);
      reload();
    } catch {
      toast({ variant: 'destructive', title: 'Eroare', description: 'Salvarea a eșuat.' });
    }
  };

  const handleSoftDelete = (id: number) => {
    const project = processedProjects.find((p) => p.id === id);
    if (!project) return;
    setPendingAction({ type: 'soft-delete', project });
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreGalleryItem(id);
      toast({ title: 'Restaurat', description: 'Modelul a fost recuperat.' });
      reload();
      reloadTrash();
    } catch {
      toast({ variant: 'destructive', title: 'Eroare', description: 'Operațiunea a eșuat.' });
    }
  };

  const handleHardDelete = (id: number) => {
    const project = processedProjects.find((p) => p.id === id);
    if (!project) return;
    setPendingAction({ type: 'hard-delete', project });
  };

  const handleRestoreAll = () => {
    if (deletedProjects.length === 0) return;
    setPendingAction({ type: 'restore-all', count: deletedProjects.length });
  };

  const handleDeleteAll = () => {
    if (deletedProjects.length === 0) return;
    setPendingAction({ type: 'delete-all', count: deletedProjects.length });
  };

  const executePendingAction = async () => {
    if (!pendingAction || isActionProcessing) return;
    setIsActionProcessing(true);
    try {
      if (pendingAction.type === 'soft-delete') {
        await softDeleteGalleryItem(pendingAction.project.id);
        toast({ title: 'Arhivat', description: 'Modelul a fost mutat în coș.' });
      } else if (pendingAction.type === 'hard-delete') {
        await deleteGalleryItem(pendingAction.project.id);
        toast({ title: 'Șters Definitiv', description: 'Modelul a fost eliminat.' });
      } else if (pendingAction.type === 'restore-all') {
        await Promise.allSettled(deletedProjects.map((p) => restoreGalleryItem(p.id)));
        toast({ title: 'Restaurate', description: `${deletedProjects.length} modele recuperate.` });
      } else if (pendingAction.type === 'delete-all') {
        await Promise.allSettled(deletedProjects.map((p) => deleteGalleryItem(p.id)));
        toast({ title: 'Șterse Definitiv', description: `${deletedProjects.length} modele eliminate.` });
      }
      setPendingAction(null);
      reload();
      reloadTrash();
    } catch {
      toast({ variant: 'destructive', title: 'Eroare', description: 'Operațiunea a eșuat.' });
    } finally {
      setIsActionProcessing(false);
    }
  };

  useEffect(() => {
    if (showTrash && trashedCloud.length === 0) setShowTrash(false);
  }, [trashedCloud.length, showTrash]);

  // ---- Filter Options ----
  const taskOptions = [{ value: 'all', label: 'Toate Task-urile' }, ...tasks.map((t) => ({ value: t.id, label: t.label }))];
  const statusOptions = [{ value: 'all', label: 'Toate Statusurile' }, ...statuses.map((s) => ({ value: s.id, label: s.label }))];
  const sortOptions = [
    { value: 'newest', label: 'Cele mai noi' },
    { value: 'title', label: 'Alfabetic (A-Z)' },
    { value: 'accuracy', label: 'Accuracy ↓' },
  ];

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center bg-[#080810]">
          <Loader2 className="animate-spin w-12 h-12 text-purple-500" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.5); }
      `}</style>

      <div className="min-h-screen bg-[#080810] text-white overflow-hidden font-sans pt-24 sm:pt-32 px-4 sm:px-6 md:px-10">
        {/* HEADER & STATS */}
        <div className="flex flex-col xl:flex-row gap-10 mb-12">
          <div className="xl:w-1/3 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              AI &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                Machine Learning
              </span>
            </h1>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base max-w-md">
              NLP, Computer Vision, Recommendation & Anomaly Detection — {allActiveFromCloud.length} modele antrenate și deployate.
            </p>
          </div>

          <div className="xl:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsData.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.l} className="group relative bg-[#12121a] border border-white/5 rounded-[1.25rem] p-5 flex flex-col justify-between transition-all duration-500 hover:border-purple-500/30 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)] hover:-translate-y-1 overflow-hidden">
                  <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-indigo-500/5 transition-all duration-500 rounded-[1.25rem] pointer-events-none" />
                  <Icon className="w-5 h-5 text-slate-500 mb-3 group-hover:text-purple-400 transition-colors duration-300" />
                  <div className="relative z-10 mt-1">
                    <div className="text-3xl font-black text-white group-hover:text-purple-50 font-mono tracking-tighter mb-1 transition-colors">{m.v}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-purple-200/70 transition-colors">{m.l}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="mb-12">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-2 md:p-3 flex flex-col lg:flex-row gap-3 items-center justify-between shadow-lg">
            <div className="flex flex-col md:flex-row w-full lg:w-auto gap-3 flex-1 items-center">
              <div className="relative flex-1 min-w-[200px] w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută modele AI/ML..."
                  className="w-full bg-[#09090b] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white outline-none focus:border-purple-500/50 hover:border-white/20 transition-all placeholder:text-slate-600 shadow-sm" />
              </div>
              <div className="flex gap-3 flex-wrap sm:flex-nowrap w-full md:w-auto">
                <CustomSelect value={fTask} onChange={setFTask} options={taskOptions} icon={Filter} onManage={() => setManageFilterType('task')} />
                <CustomSelect value={fStatus} onChange={setFStatus} options={statusOptions} onManage={() => setManageFilterType('status')} />
                <div className="hidden sm:block">
                  <CustomSelect value={sortBy} onChange={setSortBy} options={sortOptions} icon={ArrowUpDown} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 w-full lg:w-auto mt-2 lg:mt-0">
              {isAdmin && trashedCloud.length > 0 && (
                <button type="button" onClick={() => { setShowTrash(!showTrash); }}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${showTrash ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-[#09090b] text-slate-400 border-white/10 hover:bg-white/5 hover:text-white'}`}>
                  <Trash2 className="w-4 h-4" /><span>({trashedCloud.length})</span>
                </button>
              )}
              {isAdmin && (
                <button type="button" onClick={() => { setShowAdd(true); setShowTrash(false); }}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all whitespace-nowrap transform hover:scale-[1.02]">
                  <BrainCircuit className="w-4 h-4" /> Adaugă Model
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TRASH VIEW HEADER */}
        {showTrash && (
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <div className="p-2 bg-red-500/20 rounded-lg"><Trash2 className="w-5 h-5 text-red-400" /></div>
            <h2 className="text-xl font-bold text-red-400">Modele Șterse</h2>
            <p className="text-sm text-slate-500 ml-2">Restaurează sau șterge definitiv modelele.</p>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={handleRestoreAll}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border bg-[#09090b] text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                <RotateCcw className="w-4 h-4" /><span>Restabilește toate</span>
              </button>
              <button type="button" onClick={handleDeleteAll}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border bg-[#09090b] text-red-400 border-red-500/20 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" /><span>Șterge toate</span>
              </button>
            </div>
          </div>
        )}

        {/* PROJECT GRID */}
        <div className="pb-4">
          {paginatedProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProjects.map((p, index) => (
                <div key={p.id} className="animate-in fade-in zoom-in-95"
                  style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both', animationDuration: '400ms' }}>
                  <MLCard p={p} admin={isAdmin} onClick={() => !showTrash && setSel(p)}
                    onEdit={() => { setEditingProj(p); setShowTrash(false); }}
                    onDel={() => showTrash ? handleHardDelete(p.id) : handleSoftDelete(p.id)}
                    onRestore={() => handleRestore(p.id)} isTrashView={showTrash} tasksList={tasks} />
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-3xl bg-[#0b0b10]">
              <div className="text-4xl mb-4 opacity-50">🧠</div>
              <div className="text-slate-400 font-medium">
                {showTrash ? 'Nu există modele în coșul de gunoi.' : 'Niciun model nu corespunde filtrelor aplicate.'}
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} onPageChange={setCurrentPage} />
          )}
        </div>

        {/* MODALS */}
        {sel && <ProjectDetailModal p={sel} onClose={() => setSel(null)} allProjects={filtered} onNavigate={(p) => setSel(p)} tasksList={tasks} />}
        {(showAdd || editingProj) && (
          <EditModal key={editingProj ? editingProj.id : 'add'} project={editingProj || undefined}
            onClose={() => { setShowAdd(false); setEditingProj(null); }} onSave={handleSaveProject} tasksList={tasks} />
        )}
        {manageFilterType && (
          <ManageFiltersModal
            title={manageFilterType === 'task' ? 'Gestionează Task-uri AI' : 'Gestionează Statusuri'}
            items={manageFilterType === 'task' ? tasks : statuses}
            onClose={() => setManageFilterType(null)}
            onSave={(newItems) => { if (manageFilterType === 'task') setTasks(newItems); else setStatuses(newItems); setManageFilterType(null); }}
          />
        )}
        {pendingAction && (
          <ActionConfirmationModal action={pendingAction} onClose={() => { if (!isActionProcessing) setPendingAction(null); }}
            onConfirm={executePendingAction} isProcessing={isActionProcessing} />
        )}
      </div>
    </PageLayout>
  );
}
