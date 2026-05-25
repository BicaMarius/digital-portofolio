import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { useAdmin } from '@/contexts/AdminContext';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useSoftDeleteProject,
  useRestoreProject,
  usePermanentDeleteProject,
} from '@/hooks/useProjects';
import type { Project } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import {
  Database as DatabaseIcon,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  RotateCcw,
  Plus,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Table2,
  FileText,
  GitBranch,
  Zap,
  HardDrive,
  Activity,
  Settings,
  BarChart3,
  Loader2,
  Check,
  AlertTriangle,
  FolderKanban,
  Lock,
  Unlock,
  Star,
  Layout,
  Link as LinkIcon,
  UploadCloud,
  Maximize2,
} from 'lucide-react';

// ================= HELPERS =================
function parseTagValue(
  tags: string[] | undefined,
  key: string,
  fallback: string = '',
): string {
  const entry = (tags || []).find((t) =>
    t.toLowerCase().startsWith(`${key.toLowerCase()}:`),
  );
  if (!entry) return fallback;
  return entry.split(':').slice(1).join(':').trim();
}

// ================= TYPES & CONSTANTS =================
interface DBProject {
  id: number;
  title: string;
  description: string;
  engine: string;
  status: string;
  tables: number;
  records: string;
  indexes: number;
  avgQueryTime: string;
  normalization: string;
  size: string;
  maxQps: string;
  tablesList: { name: string; columns: number }[];
  featured: boolean;
  isPrivate: boolean;
  isDeleted: boolean;
  createdAt?: string;
}

interface FilterOption {
  id: string;
  label: string;
  color?: string;
}

type PendingAction =
  | { type: 'soft-delete'; project: DBProject }
  | { type: 'hard-delete'; project: DBProject }
  | { type: 'restore-all'; count: number }
  | { type: 'delete-all'; count: number };

const PROJECTS_PER_PAGE = 9;

const INITIAL_ENGINES: FilterOption[] = [
  { id: 'postgresql', label: 'PostgreSQL', color: '#336791' },
  { id: 'mysql', label: 'MySQL', color: '#F29111' },
  { id: 'mongodb', label: 'MongoDB', color: '#47A248' },
  { id: 'redis', label: 'Redis', color: '#DC382D' },
  { id: 'sqlite', label: 'SQLite', color: '#0F80CC' },
  { id: 'mariadb', label: 'MariaDB', color: '#003545' },
  { id: 'oracle', label: 'Oracle', color: '#F80000' },
  { id: 'sqlserver', label: 'SQL Server', color: '#CC2927' },
];

const INITIAL_STATUSES: FilterOption[] = [
  { id: 'production', label: 'Production', color: '#34d399' },
  { id: 'development', label: 'Development', color: '#fbbf24' },
  { id: 'archived', label: 'Archived', color: '#94a3b8' },
];

const ENGINE_BADGE_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  postgresql: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  mysql: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
  },
  mongodb: {
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
  redis: {
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  sqlite: {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
  },
  mariadb: {
    bg: 'bg-teal-500/15',
    text: 'text-teal-400',
    border: 'border-teal-500/30',
  },
  oracle: {
    bg: 'bg-red-600/15',
    text: 'text-red-300',
    border: 'border-red-600/30',
  },
  sqlserver: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
};

const STATUS_DOT_COLORS: Record<string, string> = {
  production: 'bg-emerald-400',
  development: 'bg-yellow-400',
  archived: 'bg-slate-400',
};

const STATUS_LABELS: Record<string, string> = {
  production: 'Production',
  development: 'Development',
  archived: 'Archived',
};

const TABLE_TAG_COLORS = [
  'text-rose-400 border-rose-500/30',
  'text-emerald-400 border-emerald-500/30',
  'text-blue-400 border-blue-500/30',
  'text-amber-400 border-amber-500/30',
  'text-violet-400 border-violet-500/30',
  'text-cyan-400 border-cyan-500/30',
  'text-orange-400 border-orange-500/30',
  'text-pink-400 border-pink-500/30',
];

const TABLE_TAG_DOT_COLORS = [
  'bg-rose-400',
  'bg-emerald-400',
  'bg-blue-400',
  'bg-amber-400',
  'bg-violet-400',
  'bg-cyan-400',
  'bg-orange-400',
  'bg-pink-400',
];

const PROJECT_CARD_GRADIENTS = [
  'from-indigo-600 via-purple-600 to-violet-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-amber-500 via-orange-500 to-red-500',
  'from-rose-500 via-pink-500 to-purple-600',
  'from-cyan-500 via-blue-500 to-indigo-600',
  'from-purple-600 via-fuchsia-500 to-pink-500',
  'from-green-500 via-emerald-600 to-teal-700',
  'from-orange-400 via-red-500 to-rose-600',
  'from-blue-500 via-indigo-500 to-purple-600',
  'from-teal-400 via-cyan-500 to-blue-600',
];

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
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);
}

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
) {
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
  value,
  onChange,
  options,
  icon: Icon,
  placeholder = 'Selectează',
  onManage,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ElementType;
  placeholder?: string;
  onManage?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useOutsideClick(wrapperRef, () => setIsOpen(false));

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={wrapperRef} className="relative w-full sm:w-auto min-w-[170px] z-20">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full bg-[#09090b] border ${isOpen ? 'border-purple-500/50' : 'border-white/5'} hover:border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-300 cursor-pointer transition-all shadow-sm`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 py-1.5 z-50 flex flex-col">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt.value ? 'bg-purple-500/10 text-purple-400 font-medium' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                {opt.label}
                {value === opt.value && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>

          {onManage && (
            <div className="mt-1 shrink-0">
              <div className="h-px w-full bg-white/10 mb-1" />
              <div
                onClick={() => { onManage(); setIsOpen(false); }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
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
function ManageFiltersModal({
  title,
  items,
  onClose,
  onSave,
}: {
  title: string;
  items: FilterOption[];
  onClose: () => void;
  onSave: (items: FilterOption[]) => void;
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

  const handleRemove = (id: string) => {
    setLocal(local.filter((i) => i.id !== id));
  };

  const handleRename = (id: string, newName: string) => {
    setLocal(
      local.map((i) => (i.id === id ? { ...i, label: newName } : i)),
    );
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {local.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-[#09090b] border border-white/5 rounded-xl px-3 py-2"
            >
              {item.color && (
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <input
                type="text"
                value={item.label}
                onChange={(e) => handleRename(item.id, e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-200 outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="text-slate-600 hover:text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Adaugă opțiune nouă..."
              className={InputStyle}
            />
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-xl text-sm font-bold hover:bg-purple-600/30 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-5 border-t border-white/5 bg-[#09090b] flex gap-3 justify-end rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={() => onSave(local)}
            className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all"
          >
            Salvează
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= ACTION CONFIRMATION MODAL =================
function ActionConfirmationModal({
  action,
  onClose,
  onConfirm,
  isProcessing,
}: {
  action: PendingAction;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}) {
  useModalEffects(true);

  const config = useMemo(() => {
    switch (action.type) {
      case 'soft-delete':
        return {
          title: 'Mută în coș',
          desc: `Ești sigur că vrei să muți „${action.project.title}" în coșul de gunoi? Poți restaura mai târziu.`,
          icon: Trash2,
          confirmLabel: 'Mută în coș',
          color: 'red' as const,
        };
      case 'hard-delete':
        return {
          title: 'Ștergere permanentă',
          desc: `Ești sigur că vrei să ștergi definitiv „${action.project.title}"? Această acțiune nu poate fi anulată.`,
          icon: AlertTriangle,
          confirmLabel: 'Șterge definitiv',
          color: 'red' as const,
        };
      case 'restore-all':
        return {
          title: 'Restaurează toate',
          desc: `Vrei să restaurezi ${action.count} proiecte din coșul de gunoi?`,
          icon: RotateCcw,
          confirmLabel: 'Restaurează toate',
          color: 'emerald' as const,
        };
      case 'delete-all':
        return {
          title: 'Golește coșul',
          desc: `Vrei să ștergi definitiv ${action.count} proiecte? Această acțiune nu poate fi anulată.`,
          icon: AlertTriangle,
          confirmLabel: 'Șterge tot definitiv',
          color: 'red' as const,
        };
    }
  }, [action]);

  const IconComp = config.icon;
  const isRed = config.color === 'red';

  return (
    <div
      className="fixed inset-0 z-[10020] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => !isProcessing && onClose()}
    >
      <div
        className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isRed ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}
          >
            <IconComp
              className={`w-7 h-7 ${isRed ? 'text-red-400' : 'text-emerald-400'}`}
            />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{config.title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {config.desc}
          </p>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${
              isRed
                ? 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
                : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
            }`}
          >
            {isProcessing && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= DB PROJECT CARD =================
function DBCard({
  p,
  admin,
  onClick,
  onEdit,
  onDel,
  onRestore,
  isTrashView,
  enginesList,
}: {
  p: DBProject;
  admin: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDel: () => void;
  onRestore?: () => void;
  isTrashView: boolean;
  enginesList: FilterOption[];
}) {
  const engineStyle = ENGINE_BADGE_STYLES[p.engine] || {
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  };
  const engineLabel =
    enginesList.find((e) => e.id === p.engine)?.label || p.engine;
  const statusDot = STATUS_DOT_COLORS[p.status] || 'bg-slate-400';
  const statusLabel = STATUS_LABELS[p.status] || p.status;

  return (
    <div
      className={`group relative bg-[#12121a] border border-white/5 rounded-[1.25rem] p-5 cursor-pointer transition-all duration-[350ms] overflow-hidden ${
        p.isDeleted && !isTrashView ? 'opacity-50' : ''
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(-5px)';
        el.style.borderColor = 'rgba(255,255,255,0.15)';
        el.style.boxShadow = '0 8px 30px rgba(139,92,246,0.12)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(0)';
        el.style.borderColor = 'rgba(255,255,255,0.05)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Accent gradient stripe */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${PROJECT_CARD_GRADIENTS[p.id % PROJECT_CARD_GRADIENTS.length]} opacity-80`} />
      {/* Top row: Engine badge + Status + Admin actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold ${engineStyle.bg} ${engineStyle.text} border ${engineStyle.border}`}
          >
            {engineLabel}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${statusDot}`} />
            <span className="text-[11px] text-slate-400 font-medium">
              {statusLabel}
            </span>
          </div>
        </div>
        {admin && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isTrashView ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore?.();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                  title="Restaurează"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDel();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  title="Șterge definitiv"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/5 hover:text-white transition-colors"
                  title="Editează"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDel();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  title="Mută în coș"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="text-[15px] font-bold text-white mt-3 line-clamp-1">
        {p.title}
      </h3>
      <p className="text-[11px] text-slate-400 font-mono mt-1 line-clamp-1">
        {p.description || '—'}
      </p>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {[
          {
            icon: Table2,
            value: p.tables || 0,
            label: 'Tabele',
          },
          {
            icon: FileText,
            value: p.records || '—',
            label: 'Recorduri',
          },
          {
            icon: GitBranch,
            value: p.indexes || 0,
            label: 'Indexuri',
          },
          {
            icon: Zap,
            value: p.avgQueryTime || '—',
            label: 'Avg query',
          },
        ].map((m) => {
          const MIcon = m.icon;
          return (
            <div
              key={m.label}
              className="bg-[#0d0d15] border border-white/5 rounded-xl p-2.5 text-center flex flex-col items-center"
            >
              <MIcon className="w-3.5 h-3.5 text-slate-500 mb-1" />
              <div className="text-[15px] font-bold text-white font-mono leading-tight">
                {m.value}
              </div>
              <div className="text-[8px] text-slate-500 uppercase tracking-wide mt-0.5">
                {m.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Tags */}
      {p.tablesList.length > 0 && (
        <div className="mt-4 bg-[#0d0d15] rounded-xl p-3">
          <div className="flex flex-wrap gap-1.5">
            {p.tablesList.map((t, i) => {
              const colorIdx = i % TABLE_TAG_COLORS.length;
              return (
                <span
                  key={`${t.name}-${i}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-white/[0.03] border ${TABLE_TAG_COLORS[colorIdx]}`}
                >
                  <Table2 className="w-2.5 h-2.5" />
                  {t.name} ({t.columns})
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${TABLE_TAG_DOT_COLORS[colorIdx]}`}
                  />
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Metadata */}
      {(p.normalization || p.size || p.maxQps) && (
        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 font-mono pt-3 border-t border-white/5">
          <span>{p.normalization || '—'}</span>
          <span>{p.size || '—'}</span>
          <span>{p.maxQps || '—'}</span>
        </div>
      )}

      {/* Featured badge */}
      {p.featured && (
        <div className="absolute top-3 right-14 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[9px] font-bold">
          <Star className="w-2.5 h-2.5" /> Featured
        </div>
      )}
    </div>
  );
}

// ================= UNIT HELPERS =================
const RECORD_UNITS = ['K', 'M', 'B'] as const;
const RECORD_UNIT_HINTS: Record<string, string> = { K: 'Mii (Thousands)', M: 'Milioane (Millions)', B: 'Miliarde (Billions)' };
const QUERY_UNITS = ['μs', 'ms', 's'] as const;
const QUERY_UNIT_HINTS: Record<string, string> = { 'μs': 'Microsecunde', ms: 'Milisecunde', s: 'Secunde' };
const SIZE_UNITS = ['MB', 'GB', 'TB'] as const;
const SIZE_UNIT_HINTS: Record<string, string> = { MB: 'Megabytes', GB: 'Gigabytes', TB: 'Terabytes' };

function splitValueUnit(val: string, units: readonly string[], defaultUnit: string): { num: string; unit: string } {
  if (!val) return { num: '', unit: defaultUnit };
  const trimmed = val.trim();
  for (const u of units) {
    if (trimmed.toUpperCase().endsWith(u.toUpperCase())) {
      return { num: trimmed.slice(0, trimmed.length - u.length).trim(), unit: u };
    }
  }
  const numMatch = trimmed.match(/^[\d.]+/);
  return { num: numMatch ? numMatch[0] : trimmed, unit: defaultUnit };
}

// ================= EDIT MODAL =================
function EditModal({
  project,
  onClose,
  onSave,
  enginesList,
}: {
  project?: DBProject;
  onClose: () => void;
  onSave: (data: DBProject) => void;
  enginesList: FilterOption[];
}) {
  const isEdit = !!project;
  useModalEffects(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'tehnic' | 'media'>('general');

  const [f, setF] = useState<DBProject & { erdDiagram?: string }>({
    id: project?.id || 0,
    title: project?.title || '',
    description: project?.description || '',
    engine: project?.engine || 'postgresql',
    status: project?.status || 'development',
    tables: project?.tables || 0,
    records: project?.records || '',
    indexes: project?.indexes || 0,
    avgQueryTime: project?.avgQueryTime || '',
    normalization: project?.normalization || '',
    size: project?.size || '',
    maxQps: project?.maxQps || '',
    tablesList: project?.tablesList || [],
    featured: project?.featured || false,
    isPrivate: project?.isPrivate || false,
    isDeleted: false,
    erdDiagram: (project as any)?.erdDiagram || '',
  });

  const initRec = splitValueUnit(f.records, RECORD_UNITS, 'M');
  const initQuery = splitValueUnit(f.avgQueryTime, QUERY_UNITS, 'ms');
  const initSize = splitValueUnit(f.size, SIZE_UNITS, 'GB');

  const [recordsNum, setRecordsNum] = useState(initRec.num);
  const [recordsUnit, setRecordsUnit] = useState(initRec.unit);
  const [queryNum, setQueryNum] = useState(initQuery.num);
  const [queryUnit, setQueryUnit] = useState(initQuery.unit);
  const [sizeNum, setSizeNum] = useState(initSize.num);
  const [sizeUnit, setSizeUnit] = useState(initSize.unit);

  const [tablesInput, setTablesInput] = useState(() => {
    const tl = project?.tablesList || [];
    return tl.map((t) => `${t.name}(${t.columns})`).join(', ');
  });

  const parsedTables = useMemo(() => {
    if (!tablesInput.trim()) return [];
    return tablesInput
      .split(',')
      .map((seg) => {
        const m = seg.trim().match(/^(\S+)\((\d+)\)$/);
        if (!m) return null;
        return { name: m[1], columns: parseInt(m[2], 10) };
      })
      .filter(Boolean) as { name: string; columns: number }[];
  }, [tablesInput]);

  const blockNeg = (e: React.KeyboardEvent) => {
    if (e.key === '-' || e.key === 'e') e.preventDefault();
  };

  const handleAutoDetect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`?\w+`?\.)?`?(\w+)`?\s*\(([^;]*?)\)/gi;
      const tables: { name: string; columns: number }[] = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        const name = match[1];
        const body = match[2];
        const cols = body.split(',').filter((line) => {
          const trimmed = line.trim().toUpperCase();
          return (
            trimmed &&
            !trimmed.startsWith('PRIMARY') &&
            !trimmed.startsWith('KEY') &&
            !trimmed.startsWith('INDEX') &&
            !trimmed.startsWith('UNIQUE') &&
            !trimmed.startsWith('CONSTRAINT') &&
            !trimmed.startsWith('FOREIGN') &&
            !trimmed.startsWith(')')
          );
        }).length;
        tables.push({ name, columns: cols });
      }
      if (tables.length > 0) {
        setTablesInput(tables.map((t) => `${t.name}(${t.columns})`).join(', '));
        toast({ title: 'Auto-detectare', description: `${tables.length} tabele detectate din fișier.` });
      } else {
        toast({ variant: 'destructive', title: 'Nu s-au găsit tabele', description: 'Fișierul nu conține CREATE TABLE statements.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    const combinedRecords = recordsNum ? `${recordsNum}${recordsUnit}` : '';
    const combinedQuery = queryNum ? `${queryNum}${queryUnit}` : '';
    const combinedSize = sizeNum ? `${sizeNum} ${sizeUnit}` : '';
    onSave({
      ...f,
      records: combinedRecords,
      avgQueryTime: combinedQuery,
      size: combinedSize,
      tablesList: parsedTables,
    });
  };

  const tabs = [
    { id: 'general' as const, label: 'Informații', icon: Layout },
    { id: 'tehnic' as const, label: 'Stack Tehnic', icon: Table2 },
    { id: 'media' as const, label: 'Media & Linkuri', icon: LinkIcon },
  ];

  return (
    <div
      className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[5vh] overflow-y-auto p-4"
      onClick={onClose}
    >
      <form
        id="db-project-form"
        onSubmit={handleSubmit}
        className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0 rounded-t-3xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isEdit ? (
              <Edit3 className="w-5 h-5 text-purple-400" />
            ) : (
              <DatabaseIcon className="w-5 h-5 text-purple-400" />
            )}
            {isEdit ? 'Editează Proiectul' : 'Adaugă Proiect DB'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-white/5 px-6 pt-4 gap-6 bg-[#0c0c0c] overflow-x-auto custom-scrollbar shrink-0">
          {tabs.map((t) => {
            const TIcon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === t.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <TIcon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5">
          {activeTab === 'general' && (
            <>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className={LabelStyle}>
                    Titlu proiect <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className={InputStyle}
                    value={f.title}
                    onChange={(e) => setF({ ...f, title: e.target.value })}
                    placeholder="E-Commerce Analytics DWH"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => setF({ ...f, featured: !f.featured })}
                    title={f.featured ? 'Featured ✓' : 'Setează ca Featured'}
                    className={`p-2.5 rounded-xl border transition-all duration-300 ${
                      f.featured
                        ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Star
                      className={`w-5 h-5 transition-all duration-300 ${
                        f.featured ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setF({ ...f, isPrivate: !f.isPrivate })}
                    title={f.isPrivate ? 'Proiect Privat 🔒' : 'Proiect Public'}
                    className={`p-2.5 rounded-xl border transition-all duration-300 ${
                      f.isPrivate
                        ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {f.isPrivate ? (
                      <Lock className="w-5 h-5 text-rose-400" />
                    ) : (
                      <Unlock className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className={LabelStyle}>Descriere</label>
                <textarea
                  className={`${InputStyle} resize-none`}
                  value={f.description}
                  onChange={(e) => setF({ ...f, description: e.target.value })}
                  rows={3}
                  placeholder="Data warehouse Star Schema OLAP pentru analiză vânzări"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className={LabelStyle}>Engine</label>
                  <select
                    className={`${InputStyle} appearance-none pr-10 cursor-pointer`}
                    value={f.engine}
                    onChange={(e) => setF({ ...f, engine: e.target.value })}
                  >
                    {enginesList.map((eng) => (
                      <option key={eng.id} value={eng.id}>
                        {eng.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-[30px] w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                <div className="relative">
                  <label className={LabelStyle}>Status</label>
                  <select
                    className={`${InputStyle} appearance-none pr-10 cursor-pointer`}
                    value={f.status}
                    onChange={(e) => setF({ ...f, status: e.target.value })}
                  >
                    <option value="production">Production</option>
                    <option value="development">Development</option>
                    <option value="archived">Archived</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-[30px] w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </>
          )}

          {activeTab === 'tehnic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LabelStyle}>Nr. Tabele</label>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={blockNeg}
                    className={InputStyle}
                    value={f.tables || ''}
                    onChange={(e) =>
                      setF({ ...f, tables: parseInt(e.target.value) || 0 })
                    }
                    placeholder="12"
                  />
                </div>

                <div>
                  <label className={LabelStyle}>Recorduri</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      onKeyDown={blockNeg}
                      className={`${InputStyle} flex-1`}
                      value={recordsNum}
                      onChange={(e) => setRecordsNum(e.target.value)}
                      placeholder="4.8"
                    />
                    <div className="relative">
                      <select
                        className={`${InputStyle} w-[72px] appearance-none cursor-pointer text-center pr-7`}
                        value={recordsUnit}
                        onChange={(e) => setRecordsUnit(e.target.value)}
                        title={RECORD_UNIT_HINTS[recordsUnit] || ''}
                      >
                        {RECORD_UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={LabelStyle}>Indexuri</label>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={blockNeg}
                    className={InputStyle}
                    value={f.indexes || ''}
                    onChange={(e) =>
                      setF({ ...f, indexes: parseInt(e.target.value) || 0 })
                    }
                    placeholder="28"
                  />
                </div>

                <div>
                  <label className={LabelStyle}>Avg Query Time</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      onKeyDown={blockNeg}
                      className={`${InputStyle} flex-1`}
                      value={queryNum}
                      onChange={(e) => setQueryNum(e.target.value)}
                      placeholder="45"
                    />
                    <div className="relative">
                      <select
                        className={`${InputStyle} w-[72px] appearance-none cursor-pointer text-center pr-7`}
                        value={queryUnit}
                        onChange={(e) => setQueryUnit(e.target.value)}
                        title={QUERY_UNIT_HINTS[queryUnit] || ''}
                      >
                        {QUERY_UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={LabelStyle}>Normalizare</label>
                  <input
                    type="text"
                    className={InputStyle}
                    value={f.normalization}
                    onChange={(e) => setF({ ...f, normalization: e.target.value })}
                    placeholder="3NF, OLAP Star"
                  />
                </div>

                <div>
                  <label className={LabelStyle}>Dimensiune DB</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      onKeyDown={blockNeg}
                      className={`${InputStyle} flex-1`}
                      value={sizeNum}
                      onChange={(e) => setSizeNum(e.target.value)}
                      placeholder="2.3"
                    />
                    <div className="relative">
                      <select
                        className={`${InputStyle} w-[72px] appearance-none cursor-pointer text-center pr-7`}
                        value={sizeUnit}
                        onChange={(e) => setSizeUnit(e.target.value)}
                        title={SIZE_UNIT_HINTS[sizeUnit] || ''}
                      >
                        {SIZE_UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={LabelStyle}>Max QPS</label>
                  <input
                    type="text"
                    className={InputStyle}
                    value={f.maxQps}
                    onChange={(e) => setF({ ...f, maxQps: e.target.value })}
                    placeholder="120 QPS max"
                  />
                </div>
              </div>

              <div>
                <label className={LabelStyle}>
                  Lista tabele{' '}
                  <span className="normal-case tracking-normal text-slate-600">
                    — format: table_name(columns), separate cu virgulă
                  </span>
                </label>
                <textarea
                  className={`${InputStyle} resize-none font-mono`}
                  value={tablesInput}
                  onChange={(e) => setTablesInput(e.target.value)}
                  rows={3}
                  placeholder="fact_sales(14), dim_product(18), dim_customer(15)"
                />
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="file"
                    accept=".sql,.mysql,.txt"
                    id="autoDetectInput"
                    className="hidden"
                    onChange={handleAutoDetect}
                  />
                  <label
                    htmlFor="autoDetectInput"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-xl text-xs font-bold border border-purple-500/20 hover:bg-purple-500/20 cursor-pointer transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Auto-Detectare din SQL
                  </label>
                  <span className="text-[10px] text-slate-600">
                    Încarcă un fișier .sql/.mysql/.txt
                  </span>
                </div>
              </div>

              {parsedTables.length > 0 && (
                <div>
                  <label className={LabelStyle}>Previzualizare tabele</label>
                  <div className="bg-[#0d0d15] rounded-xl p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {parsedTables.map((t, i) => {
                        const colorIdx = i % TABLE_TAG_COLORS.length;
                        return (
                          <span
                            key={`${t.name}-${i}`}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-white/[0.03] border ${TABLE_TAG_COLORS[colorIdx]}`}
                          >
                            <Table2 className="w-2.5 h-2.5" />
                            {t.name} ({t.columns})
                            <span className={`w-1.5 h-1.5 rounded-full ${TABLE_TAG_DOT_COLORS[colorIdx]}`} />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'media' && (
            <>
              <div>
                <label className={LabelStyle}>Diagrama ERD</label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-purple-500/30 transition-colors">
                  {f.erdDiagram ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img
                          src={f.erdDiagram}
                          alt="ERD Diagram"
                          className="max-h-40 rounded-lg border border-white/10"
                        />
                        <button
                          type="button"
                          onClick={() => setF({ ...f, erdDiagram: '' })}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">Click pe X pentru a înlocui diagrama</p>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setF({ ...f, erdDiagram: ev.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                      />
                      <UploadCloud className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-400 font-medium">Încarcă diagrama ERD</p>
                      <p className="text-[11px] text-slate-600 mt-1">PNG, JPG, SVG — max 5MB</p>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className={LabelStyle}>Imagini adiționale</label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-purple-500/30 transition-colors">
                  <UploadCloud className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Drag & drop sau click pentru a adăuga imagini</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={LabelStyle}>URL Repository</label>
                  <input
                    type="url"
                    className={InputStyle}
                    placeholder="https://github.com/..."
                    value=""
                    onChange={() => {}}
                  />
                </div>
                <div>
                  <label className={LabelStyle}>URL Documentație</label>
                  <input
                    type="url"
                    className={InputStyle}
                    placeholder="https://docs.example.com"
                    value=""
                    onChange={() => {}}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-white/5 bg-[#09090b] flex gap-3 justify-end shrink-0 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors"
          >
            Anulează
          </button>
          <button
            type="submit"
            form="db-project-form"
            className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all"
          >
            {isEdit ? 'Salvează Modificările' : 'Adaugă Proiectul'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ================= PROJECT DETAIL MODAL =================
function ProjectDetailModal({
  p,
  onClose,
  allProjects,
  onNavigate,
  enginesList,
}: {
  p: DBProject;
  onClose: () => void;
  allProjects: DBProject[];
  onNavigate: (project: DBProject) => void;
  enginesList: FilterOption[];
}) {
  useModalEffects(true);
  const [activeTab, setActiveTab] = useState<'despre' | 'tehnic' | 'diagrame'>('despre');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const currentIdx = allProjects.findIndex((pr) => pr.id === p.id);
  const canPrev = currentIdx > 0;
  const canNext = currentIdx < allProjects.length - 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreenImage) setFullscreenImage(null);
        else onClose();
      }
      if (e.key === 'ArrowLeft' && canPrev) onNavigate(allProjects[currentIdx - 1]);
      if (e.key === 'ArrowRight' && canNext) onNavigate(allProjects[currentIdx + 1]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [p, currentIdx, canPrev, canNext, allProjects, onNavigate, onClose, fullscreenImage]);

  const engineStyle = ENGINE_BADGE_STYLES[p.engine] || { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' };
  const engineLabel = enginesList.find((e) => e.id === p.engine)?.label || p.engine;
  const statusDot = STATUS_DOT_COLORS[p.status] || 'bg-slate-400';
  const statusLabel = STATUS_LABELS[p.status] || p.status;
  const hasERD = !!(p as any).erdDiagram;

  return (
    <>
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
          className="relative w-full max-w-[1100px] h-[85vh] bg-[#0b0b12] border border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">

          {/* Close button */}
          <button onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 text-white/70 hover:text-white rounded-full backdrop-blur-md transition-all border border-transparent hover:border-white/10">
            <X className="w-5 h-5" />
          </button>

          {/* Left side — ERD Diagram or gradient banner */}
          {hasERD ? (
            <div className="w-full md:w-[45%] h-[30vh] md:h-full shrink-0 border-b md:border-b-0 md:border-r border-white/10 relative bg-black/40 flex items-center justify-center">
              <img src={(p as any).erdDiagram} alt="ERD Diagram" className="w-full h-full object-contain p-4" />
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 bg-black/60 backdrop-blur-md border ${engineStyle.border} ${engineStyle.text}`}>
                  {engineLabel}
                </span>
                <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-white">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} /> {statusLabel}
                </span>
              </div>
              <button type="button" onClick={() => setFullscreenImage((p as any).erdDiagram)}
                className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg hover:bg-black/80 text-white/70 hover:text-white transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 hover:opacity-100"
                title="Fullscreen">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden" />
          )}

          {/* Right side — content */}
          <div className={`flex flex-col flex-1 overflow-hidden ${hasERD ? '' : 'w-full'}`}>
            <div className="p-6 md:p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar relative z-10 pr-2">
              {/* Title area */}
              <div className="mb-6 shrink-0">
                {!hasERD && (
                  <div className="flex gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 bg-white/5 border ${engineStyle.border} ${engineStyle.text}`}>
                      {engineLabel}
                    </span>
                    <span className="bg-white/5 px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-white">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} /> {statusLabel}
                    </span>
                  </div>
                )}
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                  {p.title}
                  {p.isPrivate && <Lock className="w-6 h-6 text-white/30" />}
                  {p.featured && <Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
                </h2>
                {p.description && (
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{p.description}</p>
                )}
              </div>

              {/* Metrics grid — WebDev style */}
              <div className={`grid gap-3 mb-8 shrink-0 ${hasERD ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'}`}>
                {[
                  { l: 'Tabele', v: p.tables || '—', i: Table2 },
                  { l: 'Recorduri', v: p.records || '—', i: FileText },
                  { l: 'Indexuri', v: p.indexes || '—', i: GitBranch },
                  { l: 'Avg Query', v: p.avgQueryTime || '—', i: Zap },
                  { l: 'Dimensiune', v: p.size || '—', i: HardDrive },
                  { l: 'Max QPS', v: p.maxQps || '—', i: Activity },
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
                {['despre', 'tehnic', 'diagrame'].map((tab) => (
                  <button type="button" key={tab} onClick={() => setActiveTab(tab as any)}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-[150px] pb-24">
                {activeTab === 'despre' && (
                  <div className="animate-in fade-in space-y-4">
                    {p.description && (
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{p.description}</p>
                    )}
                    {p.normalization && (
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-start gap-3">
                        <DatabaseIcon className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Normalizare</div>
                          <div className="text-sm text-slate-200 font-mono">{p.normalization}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'tehnic' && (
                  <div className="animate-in fade-in space-y-6">
                    {/* Table structure */}
                    {p.tablesList.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                          <Table2 className="w-3 h-3" /> Structura Tabelelor ({p.tablesList.length})
                        </div>
                        <div className="bg-[#0d0d15] rounded-xl p-4 border border-white/5">
                          <div className="flex flex-wrap gap-2">
                            {p.tablesList.map((t, i) => {
                              const colorIdx = i % TABLE_TAG_COLORS.length;
                              return (
                                <span key={`${t.name}-${i}`}
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-mono font-medium bg-white/[0.03] border ${TABLE_TAG_COLORS[colorIdx]}`}>
                                  <Table2 className="w-3 h-3" />
                                  {t.name} ({t.columns})
                                  <span className={`w-2 h-2 rounded-full ${TABLE_TAG_DOT_COLORS[colorIdx]}`} />
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Engine info card */}
                    <div className="rounded-xl border p-4" style={{ background: 'linear-gradient(180deg, rgba(147,51,234,0.08) 0%, rgba(255,255,255,0.04) 100%)', borderColor: 'rgba(147,51,234,0.2)' }}>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400/70 mb-3">Engine & Configurare</div>
                      <div className="flex flex-col gap-1.5">
                        {[
                          { k: 'Engine', v: engineLabel },
                          { k: 'Normalizare', v: p.normalization },
                          { k: 'Max QPS', v: p.maxQps },
                        ].filter(x => x.v).map((item) => (
                          <div key={item.k} className="text-xs font-mono px-2 py-1 rounded-md border w-fit" style={{ color: '#a78bfa', background: 'rgba(147,51,234,0.08)', borderColor: 'rgba(147,51,234,0.2)' }}>
                            <span className="text-slate-500">{item.k}:</span> {item.v}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'diagrame' && (
                  <div className="animate-in fade-in space-y-6">
                    {hasERD ? (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                          <Layout className="w-3 h-3" /> Diagrama ERD
                        </div>
                        <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-video flex items-center justify-center">
                          <img src={(p as any).erdDiagram} alt="ERD Diagram" className="w-full h-full object-contain" />
                          <button type="button" onClick={() => setFullscreenImage((p as any).erdDiagram)}
                            className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg hover:bg-black/80 text-white/70 hover:text-white transition-all backdrop-blur-md opacity-0 group-hover:opacity-100"
                            title="Fullscreen">
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">Nu a fost adăugată o diagramă ERD.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 pt-4 border-t border-white/10 bg-[#08080f] shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-slate-600 font-mono">{currentIdx + 1} / {allProjects.length}</div>
                <div className="flex gap-2 text-[10px]">
                  {canPrev && (
                    <button type="button" onClick={() => onNavigate(allProjects[currentIdx - 1])}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1">
                      <ChevronLeft className="w-3 h-3" /> Prev
                    </button>
                  )}
                  {canNext && (
                    <button type="button" onClick={() => onNavigate(allProjects[currentIdx + 1])}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1">
                      Next <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen overlay */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setFullscreenImage(null)}>
          <button type="button" className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <img src={fullscreenImage} alt="Fullscreen" className="max-w-full max-h-[95vh] object-contain animate-in zoom-in-95 duration-200" />
        </div>
      )}
    </>
  );
}

// ================= PAGINATION =================
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const pages: (number | string)[] = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
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
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            currentPage === 1
              ? 'bg-[#12121a] border border-white/5 text-slate-600 cursor-not-allowed'
              : 'bg-[#12121a] border border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((page, i) =>
          typeof page === 'string' ? (
            <span
              key={`ellipsis-${i}`}
              className="w-10 h-10 flex items-center justify-center text-slate-600 text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300 ${
                currentPage === page
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                  : 'bg-[#12121a] border border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {page}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() =>
            onPageChange(Math.min(totalPages, currentPage + 1))
          }
          disabled={currentPage === totalPages}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            currentPage === totalPages
              ? 'bg-[#12121a] border border-white/5 text-slate-600 cursor-not-allowed'
              : 'bg-[#12121a] border border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="text-[11px] text-slate-500 font-mono">
        Pagina {currentPage} din {totalPages} · {totalItems} proiecte
      </div>
    </div>
  );
}

// ================= PAGINA PRINCIPALĂ (CLOUD CRUD) =================
export default function Database() {
  const { data: cloudProjects = [], isLoading } = useProjects();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const softDeleteMutation = useSoftDeleteProject();
  const restoreMutation = useRestoreProject();
  const permanentDeleteMutation = usePermanentDeleteProject();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();

  const [engines, setEngines] = useState<FilterOption[]>(INITIAL_ENGINES);
  const [statuses, setStatuses] = useState<FilterOption[]>(INITIAL_STATUSES);

  const [sel, setSel] = useState<DBProject | null>(null);
  const [editingProj, setEditingProj] = useState<DBProject | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [manageFilterType, setManageFilterType] = useState<
    'engine' | 'status' | null
  >(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  const [search, setSearch] = useState('');
  const [fEngine, setFEngine] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // ---- Map cloud data → DBProject ----
  const processedProjects: DBProject[] = useMemo(() => {
    return cloudProjects
      .filter((p: any) => p.subcategory === 'database')
      .map((p: any) => {
        let tablesList: { name: string; columns: number }[] = [];
        let featured = false;
        try {
          tablesList = JSON.parse(p.additionalFiles?.[0] || '[]');
        } catch {}
        featured = p.additionalFiles?.[1] === 'true';

        return {
          id: p.id,
          title: p.title || '',
          description: p.description || '',
          engine: p.projectType || 'postgresql',
          status: parseTagValue(p.tags, 'status', 'development'),
          tables: parseInt(parseTagValue(p.tags, 'tables', '0'), 10) || 0,
          records: parseTagValue(p.tags, 'records', ''),
          indexes: parseInt(parseTagValue(p.tags, 'indexes', '0'), 10) || 0,
          avgQueryTime: parseTagValue(p.tags, 'avgQuery', ''),
          normalization: parseTagValue(p.tags, 'normalization', ''),
          size: parseTagValue(p.tags, 'dbSize', ''),
          maxQps: parseTagValue(p.tags, 'maxQps', ''),
          tablesList,
          featured,
          isPrivate: p.isPrivate || false,
          isDeleted: !!p.deletedAt,
          createdAt: p.createdAt,
        };
      });
  }, [cloudProjects]);

  const activeProjects = processedProjects.filter((p) => !p.isDeleted);
  const deletedProjects = processedProjects.filter((p) => p.isDeleted);
  const visibleProjects = isAdmin
    ? (showTrash ? deletedProjects : activeProjects)
    : activeProjects.filter((p) => !p.isPrivate);

  // ---- Filter & Sort ----
  const filtered = useMemo(() => {
    let result = visibleProjects.filter((p) => {
      const ms =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return (
        ms &&
        (fEngine === 'all' || p.engine === fEngine) &&
        (fStatus === 'all' || p.status === fStatus)
      );
    });
    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'tables') return b.tables - a.tables;
      return b.id - a.id; // newest
    });
    return result;
  }, [visibleProjects, search, fEngine, fStatus, sortBy]);

  // ---- Pagination ----
  const totalPages = Math.ceil(filtered.length / PROJECTS_PER_PAGE);
  const paginatedProjects = filtered.slice(
    (currentPage - 1) * PROJECTS_PER_PAGE,
    currentPage * PROJECTS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, fEngine, fStatus, sortBy, showTrash]);

  // ---- Stats ----
  const totalTables = activeProjects.reduce((s, p) => s + p.tables, 0);
  const inProduction = activeProjects.filter(
    (p) => p.status === 'production',
  ).length;
  const uniqueEngines = new Set(activeProjects.map((p) => p.engine));

  const statsData = [
    { l: 'Proiecte DB', v: activeProjects.length, icon: FolderKanban },
    { l: 'Tabele Proiectate', v: totalTables, icon: Table2 },
    { l: 'În Producție', v: inProduction, icon: Activity },
    { l: 'Engines Diferite', v: uniqueEngines.size, icon: HardDrive },
  ];

  // ---- CRUD Operations ----
  const handleSaveProject = async (proj: DBProject) => {
    const tags = [
      `status:${proj.status}`,
      proj.tables ? `tables:${proj.tables}` : '',
      proj.records ? `records:${proj.records}` : '',
      proj.indexes ? `indexes:${proj.indexes}` : '',
      proj.avgQueryTime ? `avgQuery:${proj.avgQueryTime}` : '',
      proj.normalization ? `normalization:${proj.normalization}` : '',
      proj.size ? `dbSize:${proj.size}` : '',
      proj.maxQps ? `maxQps:${proj.maxQps}` : '',
    ].filter(Boolean);

    const apiPayload = {
      title: proj.title,
      description: proj.description,
      image: '',
      category: 'tech',
      subcategory: 'database',
      isPrivate: proj.isPrivate,
      tags,
      projectType: proj.engine,
      icon: undefined as string | undefined,
      images: [] as string[],
      additionalFiles: [
        JSON.stringify(proj.tablesList || []),
        proj.featured ? 'true' : 'false',
      ],
    };

    try {
      if (editingProj && editingProj.id > 0) {
        await updateMutation.mutateAsync({
          id: proj.id,
          updates: apiPayload as any,
        });
        toast({
          title: 'Actualizat',
          description: 'Proiectul a fost salvat în cloud.',
        });
      } else {
        await createMutation.mutateAsync(apiPayload as any);
        toast({
          title: 'Creat',
          description: 'Noul proiect a fost adăugat în cloud.',
        });
      }
      setShowAdd(false);
      setEditingProj(null);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Eroare',
        description: 'Salvarea în cloud a eșuat.',
      });
    }
  };

  const handleSoftDelete = (id: number) => {
    const project = processedProjects.find((p) => p.id === id);
    if (!project) return;
    setPendingAction({ type: 'soft-delete', project });
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreMutation.mutateAsync(id);
      toast({
        title: 'Restaurat',
        description: 'Proiectul a fost recuperat.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Eroare',
        description: 'Operațiunea a eșuat.',
      });
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
        await softDeleteMutation.mutateAsync(pendingAction.project.id);
        toast({
          title: 'Arhivat',
          description: 'Proiectul a fost mutat în coș.',
        });
      } else if (pendingAction.type === 'hard-delete') {
        await permanentDeleteMutation.mutateAsync(
          pendingAction.project.id,
        );
        toast({
          title: 'Șters Definitiv',
          description: 'Proiectul a fost eliminat din cloud.',
        });
      } else if (pendingAction.type === 'restore-all') {
        const results = await Promise.allSettled(
          deletedProjects.map((p) => restoreMutation.mutateAsync(p.id)),
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) {
          toast({
            variant: 'destructive',
            title: 'Eroare',
            description: `${failed} proiecte nu au putut fi restaurate.`,
          });
        } else {
          toast({
            title: 'Restaurate',
            description: `${deletedProjects.length} proiecte au fost recuperate.`,
          });
        }
      } else if (pendingAction.type === 'delete-all') {
        const results = await Promise.allSettled(
          deletedProjects.map((p) =>
            permanentDeleteMutation.mutateAsync(p.id),
          ),
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) {
          toast({
            variant: 'destructive',
            title: 'Eroare',
            description: `${failed} proiecte nu au putut fi șterse.`,
          });
        } else {
          toast({
            title: 'Șterse Definitiv',
            description: `${deletedProjects.length} proiecte au fost eliminate din cloud.`,
          });
        }
      }
      setPendingAction(null);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Eroare',
        description: 'Operațiunea a eșuat.',
      });
    } finally {
      setIsActionProcessing(false);
    }
  };

  useEffect(() => {
    if (showTrash && deletedProjects.length === 0) setShowTrash(false);
  }, [deletedProjects.length, showTrash]);

  // ---- Filter Options ----
  const engineOptions = [
    { value: 'all', label: 'Toate Engines' },
    ...engines.map((e) => ({ value: e.id, label: e.label })),
  ];
  const statusOptions = [
    { value: 'all', label: 'Toate Statusurile' },
    ...statuses.map((s) => ({ value: s.id, label: s.label })),
  ];
  const sortOptions = [
    { value: 'newest', label: 'Cele mai noi' },
    { value: 'title', label: 'Alfabetic (A-Z)' },
    { value: 'tables', label: 'Nr. Tabele ↓' },
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
              Database{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                Portofoliu
              </span>
            </h1>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base max-w-md">
              Schema design, optimizare query, data warehousing —{' '}
              {activeProjects.length} proiecte, {totalTables} tabele
              proiectate.
            </p>
          </div>

          <div className="xl:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsData.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.l}
                  className="group relative bg-[#12121a] border border-white/5 rounded-[1.25rem] p-5 flex flex-col justify-between transition-all duration-500 hover:border-purple-500/30 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)] hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-indigo-500/5 transition-all duration-500 rounded-[1.25rem] pointer-events-none" />
                  <Icon className="w-5 h-5 text-slate-500 mb-3 group-hover:text-purple-400 transition-colors duration-300" />
                  <div className="relative z-10 mt-1">
                    <div className="text-3xl font-black text-white group-hover:text-purple-50 font-mono tracking-tighter mb-1 transition-colors">
                      {m.v}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-purple-200/70 transition-colors">
                      {m.l}
                    </div>
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
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Caută proiecte DB..."
                  className="w-full bg-[#09090b] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white outline-none focus:border-purple-500/50 hover:border-white/20 transition-all placeholder:text-slate-600 shadow-sm"
                />
              </div>
              <div className="flex gap-3 flex-wrap sm:flex-nowrap w-full md:w-auto">
                <CustomSelect
                  value={fEngine}
                  onChange={setFEngine}
                  options={engineOptions}
                  icon={Filter}
                  onManage={() => setManageFilterType('engine')}
                />
                <CustomSelect
                  value={fStatus}
                  onChange={setFStatus}
                  options={statusOptions}
                  onManage={() => setManageFilterType('status')}
                />
                <div className="hidden sm:block">
                  <CustomSelect
                    value={sortBy}
                    onChange={setSortBy}
                    options={sortOptions}
                    icon={ArrowUpDown}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 w-full lg:w-auto mt-2 lg:mt-0">
              {isAdmin && deletedProjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTrash(!showTrash)}
                  title={
                    showTrash
                      ? 'Înapoi la Proiecte Active'
                      : 'Coș de Gunoi'
                  }
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                    showTrash
                      ? 'bg-red-500/20 text-red-400 border-red-500/50'
                      : 'bg-[#09090b] text-slate-400 border-white/10 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>({deletedProjects.length})</span>
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(true);
                    setShowTrash(false);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all whitespace-nowrap transform hover:scale-[1.02]"
                >
                  <DatabaseIcon className="w-4 h-4" /> Adaugă DB
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TRASH VIEW HEADER */}
        {showTrash && (
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-red-400">
              Proiecte Șterse
            </h2>
            <p className="text-sm text-slate-500 ml-2">
              Restaurează sau șterge definitiv proiectele din cloud.
            </p>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreAll}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border bg-[#09090b] text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restabilește toate</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border bg-[#09090b] text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
                <span>Șterge toate</span>
              </button>
            </div>
          </div>
        )}

        {/* PROJECT GRID */}
        <div className="pb-4">
          {paginatedProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProjects.map((p, index) => (
                <div
                  key={p.id}
                  className="animate-in fade-in zoom-in-95"
                  style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both', animationDuration: '400ms' }}
                >
                  <DBCard
                    p={p}
                    admin={isAdmin}
                    onClick={() => !showTrash && setSel(p)}
                    onEdit={() => {
                      setEditingProj(p);
                      setShowTrash(false);
                    }}
                    onDel={() =>
                      showTrash
                        ? handleHardDelete(p.id)
                        : handleSoftDelete(p.id)
                    }
                    onRestore={() => handleRestore(p.id)}
                    isTrashView={showTrash}
                    enginesList={engines}
                  />
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-3xl bg-[#0b0b10]">
              <div className="text-4xl mb-4 opacity-50">🗄️</div>
              <div className="text-slate-400 font-medium">
                {showTrash
                  ? 'Nu există proiecte în coșul de gunoi.'
                  : 'Niciun proiect nu corespunde filtrelor aplicate.'}
              </div>
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        {/* MODALS */}
        {sel && (
          <ProjectDetailModal
            p={sel}
            onClose={() => setSel(null)}
            allProjects={filtered}
            onNavigate={(p) => setSel(p)}
            enginesList={engines}
          />
        )}

        {(showAdd || editingProj) && (
          <EditModal
            key={editingProj ? editingProj.id : 'add'}
            project={editingProj || undefined}
            onClose={() => {
              setShowAdd(false);
              setEditingProj(null);
            }}
            onSave={handleSaveProject}
            enginesList={engines}
          />
        )}

        {manageFilterType && (
          <ManageFiltersModal
            title={
              manageFilterType === 'engine'
                ? 'Gestionează Engines'
                : 'Gestionează Statusuri'
            }
            items={manageFilterType === 'engine' ? engines : statuses}
            onClose={() => setManageFilterType(null)}
            onSave={(newItems) => {
              if (manageFilterType === 'engine') setEngines(newItems);
              else setStatuses(newItems);
              setManageFilterType(null);
            }}
          />
        )}

        {pendingAction && (
          <ActionConfirmationModal
            action={pendingAction}
            onClose={() => {
              if (!isActionProcessing) setPendingAction(null);
            }}
            onConfirm={executePendingAction}
            isProcessing={isActionProcessing}
          />
        )}
      </div>
    </PageLayout>
  );
}
