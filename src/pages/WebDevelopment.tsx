import React, { useState, useMemo, useEffect, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  X,
  Edit2,
  Trash2,
  Layout,
  Database,
  Link as LinkIcon,
  FolderKanban,
  Activity,
  Clock,
  Cpu,
  Code2,
  ChevronDown,
  RotateCcw,
  Check,
  Star,
  Lock,
  Unlock,
  Loader2,
  Github,
  ExternalLink,
  CalendarDays,
  Users,
  GitCommit,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  UploadCloud,
  Settings,
} from "lucide-react";

// ================= TYPES & INITIAL DATA =================

interface SWProject {
  id: number;
  title: string;
  tagline: string;
  description: string;
  platform: string;
  status: string;
  tech: string[];
  frontend: string[];
  backend: string[];
  devops: string[];
  liveUrl?: string;
  gitUrl?: string;
  gradient: string;
  accent: string;
  version: string;
  hours: number;
  since: string;
  highlights: string[];
  featured: boolean;
  isPrivate?: boolean;
  stars?: number;
  users?: string;
  isDeleted?: boolean;
  images?: string[];
  architectureDiagram?: string;
  lastModified?: string;
}

export interface FilterOption {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

const INITIAL_PLATFORMS: FilterOption[] = [
  { id: "web", label: "Web App", icon: "🌐" },
  { id: "mobile", label: "Mobile", icon: "📱" },
  { id: "desktop", label: "Desktop", icon: "🖥️" },
  { id: "cli", label: "CLI Tool", icon: "⌨️" },
  { id: "game", label: "Game", icon: "🎮" },
  { id: "api", label: "API", icon: "⚡" },
  { id: "cross", label: "Cross-platform", icon: "🔀" },
];

const INITIAL_STATUSES: FilterOption[] = [
  { id: "live", label: "Live", color: "#34d399" },
  { id: "wip", label: "In Progress", color: "#fbbf24" },
  { id: "archived", label: "Archived", color: "#94a3b8" },
  { id: "concept", label: "Concept", color: "#a78bfa" },
];

const INITIAL_PROJECTS: SWProject[] = [
  {
    id: 1,
    title: "CodeLensAI",
    tagline: "Analizează orice repo GitHub în 10 secunde",
    description:
      "Tool browser-based React care analizează repository-uri publice GitHub și generează automat diagrame interactive de arhitectură, analiză dependențe și detectare tech stack. GitHub API, jsdelivr CDN, suport monorepo, docker-compose parsing și fallback LLM via Claude Haiku.",
    platform: "web",
    status: "live",
    tech: ["React 18", "TypeScript", "D3.js", "GitHub API", "Claude API"],
    frontend: ["React 18", "TypeScript", "Recharts", "D3.js", "Vite"],
    backend: ["GitHub API", "Claude Haiku", "jsdelivr CDN"],
    devops: ["GitHub Pages", "GitHub Actions"],
    liveUrl: "#",
    gitUrl: "https://github.com/facebook/react",
    gradient: "linear-gradient(135deg,#4f46e5,#7c3aed)",
    accent: "#818cf8",
    version: "1.7.0",
    hours: 120,
    since: "2024-11",
    highlights: [
      "Diagrame arhitectură auto-generate",
      "Detectare tech stack 95%+ acuratețe",
      "Suport monorepo & docker-compose",
      "AI fallback pentru repo-uri sparse",
    ],
    featured: true,
    isPrivate: false,
    stars: 220000,
    users: "2.3k",
    isDeleted: false,
    lastModified: "12.05.2024",
    images: [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    ],
    architectureDiagram:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 2,
    title: "3MEK Platform",
    tagline: "Platforma operațională full-stack pentru 3MEK",
    description:
      "Dashboard full-stack pentru managementul operațional — CRM, facturare, task management, rapoarte financiare. JWT auth, roluri granulare, export PDF automat. Arhitectură microservicii cu integrare API-uri externe.",
    platform: "web",
    status: "wip",
    tech: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
    frontend: ["React", "TypeScript", "Tailwind CSS", "shadcn/ui"],
    backend: ["Node.js", "Express", "Drizzle ORM", "JWT"],
    devops: ["Docker", "Nginx", "GitHub Actions", "Neon DB"],
    gitUrl: "#",
    gradient: "linear-gradient(135deg,#7c3aed,#a21caf)",
    accent: "#c084fc",
    version: "0.8.2",
    hours: 340,
    since: "2024-08",
    highlights: [
      "Multi-tenant cu izolare date completă",
      "Dashboard analytics real-time",
      "Export PDF cu template custom",
    ],
    featured: true,
    isPrivate: true,
    stars: 0,
    isDeleted: false,
    images: [],
  },
];

const G = { inset: 0, position: "absolute" as const };

// ================= CUSTOM HOOKS =================

function useModalEffects(onClose: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const originalOverflow = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);
}

function useOutsideClick(ref: React.RefObject<any>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node))
        callback();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

// ================= COMPONENTS =================

function CustomSelect({
  value,
  onChange,
  options,
  icon: Icon,
  placeholder = "Selectează",
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
    <div
      ref={wrapperRef}
      className="relative w-full sm:w-auto min-w-[170px] z-20"
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full bg-[#09090b] border ${isOpen ? "border-purple-500/50" : "border-white/5"} hover:border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-300 cursor-pointer transition-all shadow-sm`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-300 shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 py-1.5 z-50 flex flex-col">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt.value ? "bg-purple-500/10 text-purple-400 font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
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
                onClick={() => {
                  onManage();
                  setIsOpen(false);
                }}
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

function ManageFiltersModal({
  title,
  items,
  onSave,
  onClose,
}: {
  title: string;
  items: FilterOption[];
  onSave: (items: FilterOption[]) => void;
  onClose: () => void;
}) {
  useModalEffects(onClose);
  const [localItems, setLocalItems] = useState<FilterOption[]>(items);
  const [newItemLabel, setNewItemLabel] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemLabel.trim()) return;
    const newId = newItemLabel
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    setLocalItems([
      ...localItems,
      { id: newId, label: newItemLabel.trim(), color: "#8b5cf6", icon: "✨" },
    ]);
    setNewItemLabel("");
  };
  const handleRemove = (id: string) =>
    setLocalItems(localItems.filter((i) => i.id !== id));
  const handleRename = (id: string, newLabel: string) =>
    setLocalItems(
      localItems.map((i) => (i.id === id ? { ...i, label: newLabel } : i)),
    );

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" /> {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar flex flex-col gap-3">
          {localItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-[#09090b] border border-white/5 p-2.5 rounded-xl"
            >
              <input
                type="text"
                value={item.label}
                onChange={(e) => handleRename(item.id, e.target.value)}
                className="flex-1 bg-transparent text-sm text-white outline-none focus:border-b focus:border-purple-500/50 px-1"
              />
              <button
                onClick={() => handleRemove(item.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <form
            onSubmit={handleAdd}
            className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5"
          >
            <input
              type="text"
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
              placeholder="Adaugă un filtru nou..."
              className="flex-1 bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
            />
            <button
              type="submit"
              disabled={!newItemLabel.trim()}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>
        </div>
        <div className="p-5 border-t border-white/5 bg-[#09090b] flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-colors"
          >
            Anulează
          </button>
          <button
            onClick={() => onSave(localItems)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all"
          >
            Salvează
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({
  p,
  onClick,
  onEdit,
  onDel,
  onRestore,
  admin,
  isTrashView,
  platformsList,
  statusesList,
}: {
  p: SWProject;
  onClick: () => void;
  onEdit?: () => void;
  onDel: () => void;
  onRestore?: () => void;
  admin: boolean;
  isTrashView?: boolean;
  platformsList: FilterOption[];
  statusesList: FilterOption[];
}) {
  const [h, setH] = useState(false);
  const s = statusesList.find((st) => st.id === p.status) || {
    label: p.status,
    color: "#94a3b8",
  };
  const pl = platformsList.find((pt) => pt.id === p.platform) || {
    label: p.platform,
    icon: "⚡",
  };
  const formattedStars =
    p.stars && p.stars > 999 ? (p.stars / 1000).toFixed(1) + "k" : p.stars;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        transform: h ? "translateY(-7px)" : "none",
        boxShadow: h
          ? `0 28px 64px ${p.accent}22,0 0 0 1px ${p.accent}28`
          : "none",
        transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        opacity: p.isDeleted && !isTrashView ? 0.5 : 1,
      }}
    >
      <div
        style={{
          height: 144,
          background: isTrashView
            ? "linear-gradient(135deg, #1f2937, #0f172a)"
            : p.gradient,
          position: "relative",
          overflow: "hidden",
          filter: isTrashView ? "grayscale(80%)" : "none",
        }}
      >
        <div
          style={{
            ...G,
            opacity: 0.12,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          style={{
            ...G,
            background:
              "radial-gradient(circle at 80% -20%,rgba(255,255,255,0.18) 0%,transparent 55%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="flex gap-2">
            <span
              style={{
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                color: "rgba(255,255,255,0.9)",
                fontWeight: 600,
              }}
            >
              {pl.icon} {pl.label}
            </span>
            {p.isPrivate && (
              <span
                style={{
                  background: "rgba(225,29,72,0.2)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(225,29,72,0.3)",
                  borderRadius: 20,
                  padding: "3px 8px",
                  color: "#fda4af",
                }}
              >
                <Lock className="w-3 h-3" />
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: "3px 10px",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: s.color,
                boxShadow: `0 0 8px ${s.color}`,
              }}
            />
            <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>
              {isTrashView ? "Șters" : s.label}
            </span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 12,
            right: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {p.featured && !isTrashView && (
            <span
              style={{
                background: "rgba(251,191,36,0.2)",
                border: "1px solid rgba(251,191,36,0.35)",
                borderRadius: 20,
                padding: "2px 10px",
                fontSize: 10,
                color: "#fbbf24",
                fontWeight: 700,
              }}
            >
              ★ Featured
            </span>
          )}
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "monospace",
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              background: "rgba(0,0,0,0.5)",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            v{p.version}
          </span>
        </div>

        {admin && h && (
          <div
            style={{
              position: "absolute",
              top: 44,
              right: 12,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {isTrashView ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore?.();
                  }}
                  style={{
                    background: "rgba(0,0,0,0.65)",
                    border: "1px solid rgba(52,211,153,0.3)",
                    borderRadius: 8,
                    padding: "4px 8px",
                    color: "#34d399",
                    fontSize: 11,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Restaurează"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDel();
                  }}
                  style={{
                    background: "rgba(0,0,0,0.65)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 8,
                    padding: "4px 8px",
                    color: "#f87171",
                    fontSize: 11,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Șterge definitiv"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                  style={{
                    background: "rgba(0,0,0,0.65)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    padding: "4px 8px",
                    color: "#fff",
                    fontSize: 11,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Editează"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDel();
                  }}
                  style={{
                    background: "rgba(0,0,0,0.65)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 8,
                    padding: "4px 8px",
                    color: "#f87171",
                    fontSize: 11,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Mută în coș"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 9,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: isTrashView ? "#94a3b8" : "#fff",
            }}
          >
            {p.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.32)",
              marginTop: 2,
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {p.tagline}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {p.tech.slice(0, 5).map((t) => (
            <span
              key={t}
              style={{
                background: isTrashView
                  ? "rgba(255,255,255,0.05)"
                  : p.accent + "18",
                color: isTrashView ? "#94a3b8" : p.accent,
                border: isTrashView
                  ? "1px solid rgba(255,255,255,0.1)"
                  : `1px solid ${p.accent}28`,
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 5,
                fontFamily: "monospace",
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 7,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              fontSize: 11,
              color: "rgba(255,255,255,0.28)",
              fontFamily: "monospace",
            }}
          >
            <span>⏱ {p.hours}h</span>
            {p.stars !== undefined && p.stars > 0 && (
              <span>⭐ {formattedStars}</span>
            )}
            {p.users && <span>👤 {p.users}</span>}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {p.liveUrl && (
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
                🔗
              </span>
            )}
            {p.gitUrl && (
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
                ⌥
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length, isPaused]);

  const next = () => setCurrent((prev) => (prev + 1) % images.length);
  const prev = () =>
    setCurrent((prev) => (prev - 1 + images.length) % images.length);

  if (!images || images.length === 0) return null;

  return (
    <div
      className="relative w-full h-full min-h-[250px] bg-black overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <img
        src={images[current]}
        alt="Screenshot"
        className="w-full h-full object-cover object-top transition-opacity duration-500 ease-in-out"
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white/70 hover:text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all border border-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white/70 hover:text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all border border-white/10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {images.map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white w-4" : "bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        </>
      )}
      <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] pointer-events-none" />
    </div>
  );
}

function ProjectModal({
  p,
  onClose,
  platformsList,
  statusesList,
}: {
  p: SWProject;
  onClose: () => void;
  platformsList: FilterOption[];
  statusesList: FilterOption[];
}) {
  useModalEffects(onClose);
  const [activeTab, setActiveTab] = useState<
    "despre" | "tehnic" | "highlights"
  >("despre");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const s = statusesList.find((st) => st.id === p.status) || {
    label: p.status,
    color: "#94a3b8",
  };
  const pl = platformsList.find((pt) => pt.id === p.platform) || {
    label: p.platform,
    icon: "⚡",
  };
  const stack = [
    { l: "Frontend", items: p.frontend, c: "#818cf8" },
    { l: "Backend", items: p.backend, c: "#c084fc" },
    { l: "DevOps", items: p.devops, c: "#f472b6" },
  ].filter((x) => x.items.length);

  const formattedStars =
    p.stars && p.stars > 999 ? (p.stars / 1000).toFixed(1) + "k" : p.stars;
  const hasImages = p.images && p.images.length > 0;

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[1100px] h-[85vh] bg-[#0b0b12] border border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 text-white/70 hover:text-white rounded-full backdrop-blur-md transition-all border border-transparent hover:border-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {hasImages && (
            <div className="w-full md:w-[45%] h-[30vh] md:h-full shrink-0 border-b md:border-b-0 md:border-r border-white/10 relative">
              <ImageCarousel images={p.images!} />
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                  {pl.icon} {pl.label}
                </span>
                <span
                  style={{ color: s.color, borderColor: s.color + "40" }}
                  className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                >
                  <div
                    style={{ background: s.color }}
                    className="w-1.5 h-1.5 rounded-full"
                  />{" "}
                  {s.label}
                </span>
              </div>
            </div>
          )}

          <div
            className={`flex flex-col flex-1 overflow-hidden relative ${!hasImages ? "w-full" : ""}`}
          >
            {!hasImages && (
              <div
                style={{ background: p.gradient }}
                className="absolute top-0 left-0 right-0 h-32 opacity-20 pointer-events-none blur-3xl"
              />
            )}
            <div className="p-6 md:p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar relative z-10 pr-2">
              <div className="mb-6 shrink-0">
                {!hasImages && (
                  <div className="flex gap-2 mb-3">
                    <span className="bg-white/5 px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                      {pl.icon} {pl.label}
                    </span>
                    <span
                      style={{ color: s.color, borderColor: s.color + "40" }}
                      className="bg-white/5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <div
                        style={{ background: s.color }}
                        className="w-1.5 h-1.5 rounded-full"
                      />{" "}
                      {s.label}
                    </span>
                  </div>
                )}
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                  {p.title}{" "}
                  {p.isPrivate && <Lock className="w-6 h-6 text-white/30" />}
                </h2>
                <p className="text-sm text-slate-400 mt-2 font-mono">
                  {p.tagline}
                </p>
              </div>

              <div
                className={`grid gap-3 mb-8 shrink-0 ${hasImages ? "grid-cols-3 xl:grid-cols-3" : "grid-cols-3 sm:grid-cols-6"}`}
              >
                {[
                  { l: "Ore", v: p.hours ? `${p.hours}h` : "—", i: Clock },
                  { l: "Versiune", v: `v${p.version}`, i: Code2 },
                  { l: "Start", v: p.since, i: CalendarDays },
                  { l: "Stars", v: p.stars ? formattedStars : "—", i: Star },
                  { l: "Utilizatori", v: p.users || "—", i: Users },
                  {
                    l: "Ultimul Update",
                    v: p.lastModified || "—",
                    i: GitCommit,
                  },
                ].map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-[#12121a] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-colors hover:border-purple-500/30 hover:bg-purple-500/5 group"
                  >
                    <m.i className="w-4 h-4 text-purple-400/60 group-hover:text-purple-400 mb-1.5 transition-colors" />
                    <div className="text-sm font-bold text-slate-200 group-hover:text-white font-mono transition-colors">
                      {m.v}
                    </div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 group-hover:text-purple-300/70 transition-colors">
                      {m.l}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-6 border-b border-white/10 mb-5 shrink-0">
                {["despre", "tehnic", "highlights"].map((tab) => (
                  <button
                    type="button"
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab ? "border-purple-500 text-purple-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-[150px]">
                {activeTab === "despre" && (
                  <div className="animate-in fade-in">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {p.description}
                    </p>
                  </div>
                )}
                {activeTab === "tehnic" && (
                  <div className="animate-in fade-in flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {stack.length > 0 ? (
                        stack.map((sec) => (
                          <div
                            key={sec.l}
                            className="bg-white/5 border border-white/10 rounded-xl p-4"
                          >
                            <div
                              style={{ color: sec.c }}
                              className="text-[10px] font-bold uppercase tracking-widest mb-3"
                            >
                              {sec.l}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {sec.items.map((i) => (
                                <div
                                  key={i}
                                  className="text-xs text-slate-300 font-mono bg-black/40 px-2 py-1 rounded-md border border-white/5 w-fit"
                                >
                                  {i}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-sm text-slate-500">
                          Stack principal: {p.tech.join(", ")}
                        </div>
                      )}
                    </div>
                    {p.architectureDiagram && (
                      <div className="mt-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                          <Layout className="w-3 h-3" /> Diagramă Arhitectură
                        </div>
                        <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-video flex items-center justify-center">
                          <img
                            src={p.architectureDiagram}
                            alt="Architecture Diagram"
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFullscreenImage(p.architectureDiagram!)
                            }
                            className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg hover:bg-black/80 text-white/70 hover:text-white transition-all backdrop-blur-md opacity-0 group-hover:opacity-100"
                            title="Fullscreen"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "highlights" && (
                  <div className="animate-in fade-in space-y-3">
                    {p.highlights && p.highlights.length > 0 ? (
                      p.highlights.map((h, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 items-start bg-white/5 p-3 rounded-xl border border-white/5"
                        >
                          <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          <span className="text-sm text-slate-200 leading-tight">
                            {h}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">
                        Nu au fost adăugate highlights.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 md:p-8 pt-4 border-t border-white/10 bg-[#08080f] shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                {p.liveUrl && (
                  <a
                    href={p.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl bg-white text-black hover:bg-slate-200 text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                  >
                    <ExternalLink className="w-4 h-4" /> Live Demo
                  </a>
                )}
                {p.gitUrl && (
                  <a
                    href={p.gitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 text-sm font-bold transition-all"
                  >
                    <Github className="w-4 h-4" /> Cod Sursă
                  </a>
                )}
                {!p.liveUrl && !p.gitUrl && (
                  <div className="w-full text-center text-xs text-slate-500 font-mono py-2">
                    Niciun link public disponibil.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen"
            className="max-w-full max-h-[95vh] object-contain animate-in zoom-in-95 duration-200"
          />
        </div>
      )}
    </>
  );
}

function EditModal({
  project,
  onClose,
  onSave,
  platformsList,
  statusesList,
}: {
  project?: SWProject;
  onClose: () => void;
  onSave: (p: SWProject) => void;
  platformsList: FilterOption[];
  statusesList: FilterOption[];
}) {
  useModalEffects(onClose);
  const isEdit = !!project;
  const [activeTab, setActiveTab] = useState<"general" | "tehnic" | "metrici">(
    "general",
  );
  const [isFetchingGit, setIsFetchingGit] = useState(false);

  const [f, setF] = useState<Partial<SWProject>>(
    project || {
      title: "",
      tagline: "",
      description: "",
      platform: platformsList[0]?.id || "web",
      status: statusesList[0]?.id || "concept",
      tech: [],
      frontend: [],
      backend: [],
      devops: [],
      highlights: [],
      images: [],
      architectureDiagram: "",
      gitUrl: "",
      liveUrl: "",
      version: "1.0.0",
      hours: 0,
      since: new Date().toISOString().slice(0, 7),
      stars: 0,
      users: "",
      featured: false,
      isPrivate: false,
      isDeleted: false,
      lastModified: "",
    },
  );

  useEffect(() => {
    if (!f.gitUrl || !f.gitUrl.includes("github.com/")) return;
    const fetchGitData = async () => {
      const match = f.gitUrl?.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        setIsFetchingGit(true);
        try {
          const owner = match[1];
          const repo = match[2].replace(/\/$/, "");
          const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}`,
          );
          if (res.ok) {
            const data = await res.json();
            const dateObj = new Date(data.pushed_at || data.updated_at);
            const formattedDate = `${dateObj.getDate().toString().padStart(2, "0")}.${(dateObj.getMonth() + 1).toString().padStart(2, "0")}.${dateObj.getFullYear()}`;
            setF((prev) => ({
              ...prev,
              stars: data.stargazers_count,
              lastModified: formattedDate,
            }));
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsFetchingGit(false);
        }
      }
    };
    const timeoutId = setTimeout(fetchGitData, 1000);
    return () => clearTimeout(timeoutId);
  }, [f.gitUrl]);

  const GRADS = [
    "linear-gradient(135deg,#4f46e5,#7c3aed)",
    "linear-gradient(135deg,#7c3aed,#a21caf)",
    "linear-gradient(135deg,#be185d,#9f1239)",
    "linear-gradient(135deg,#0891b2,#0d9488)",
    "linear-gradient(135deg,#ea580c,#dc2626)",
  ];
  const ACCS = ["#818cf8", "#c084fc", "#f472b6", "#22d3ee", "#fb923c"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title) return;
    const idx = Math.floor(Math.random() * GRADS.length);
    const finalProject: SWProject = {
      ...(f as SWProject),
      id: isEdit ? project!.id : Date.now(),
      gradient: isEdit ? project!.gradient : GRADS[idx],
      accent: isEdit ? project!.accent : ACCS[idx],
      isDeleted: f.isDeleted || false,
      isPrivate: f.isPrivate || false,
      featured: f.featured || false,
      highlights: f.highlights?.filter((h) => h.trim().length > 0) || [],
      images: f.images || [],
      architectureDiagram: f.architectureDiagram?.trim() || undefined,
    };
    onSave(finalProject);
  };

  const handleArrayChange = (
    key: "tech" | "frontend" | "backend" | "devops",
    value: string,
  ) => {
    setF({
      ...f,
      [key]: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };
  const blockNegative = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e") e.preventDefault();
  };

  // ================= UPLOAD HANDLERS =================
  const handleDiagramUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setF({ ...f, architectureDiagram: url });
    }
  };

  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => URL.createObjectURL(file));
    setF((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...newImages],
    }));
  };

  const handleRemoveImage = (index: number) => {
    setF((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index),
    }));
  };

  const InputStyle =
    "w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all";
  const LabelStyle =
    "block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isEdit ? (
              <Edit2 className="w-5 h-5 text-purple-400" />
            ) : (
              <Code2 className="w-5 h-5 text-purple-400" />
            )}{" "}
            {isEdit ? "Editează Proiectul" : "Adaugă Proiect"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex border-b border-white/5 px-6 pt-4 gap-6 bg-[#0c0c0c] overflow-x-auto custom-scrollbar shrink-0">
          {[
            { id: "general", label: "Informații", icon: Layout },
            { id: "tehnic", label: "Stack Tehnic", icon: Database },
            { id: "metrici", label: "Media & Linkuri", icon: LinkIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-purple-500 text-purple-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
        <form
          id="project-form"
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* GENERAL TAB */}
            <div
              className={
                activeTab === "general"
                  ? "flex flex-col gap-4 animate-in fade-in h-full"
                  : "hidden"
              }
            >
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className={LabelStyle}>Titlu Proiect *</label>
                  <input
                    required
                    type="text"
                    className={InputStyle}
                    value={f.title || ""}
                    onChange={(e) => setF({ ...f, title: e.target.value })}
                    placeholder="Ex: E-commerce Dashboard"
                  />
                </div>

                {/* Toggles Minimaliste (Featured & Private) */}
                <div className="flex gap-2 pt-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => setF({ ...f, featured: !f.featured })}
                    title="Setează ca Featured"
                    className={`p-2.5 rounded-xl border transition-all ${f.featured ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                  >
                    <Star
                      className={`w-5 h-5 ${f.featured ? "fill-amber-400 text-amber-400" : "text-slate-500"}`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setF({ ...f, isPrivate: !f.isPrivate })}
                    title={f.isPrivate ? "Proiect Privat" : "Proiect Public"}
                    className={`p-2.5 rounded-xl border transition-all ${f.isPrivate ? "bg-rose-500/10 border-rose-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
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
                <label className={LabelStyle}>Tagline (Subtitlu curat)</label>
                <input
                  type="text"
                  className={InputStyle}
                  value={f.tagline || ""}
                  onChange={(e) => setF({ ...f, tagline: e.target.value })}
                  placeholder="Scurtă descriere catchy..."
                />
              </div>
              <div>
                <label className={LabelStyle}>Descriere Detaliată</label>
                <textarea
                  required
                  rows={4}
                  className={`${InputStyle} resize-none custom-scrollbar`}
                  value={f.description || ""}
                  onChange={(e) => setF({ ...f, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="relative">
                  <label className={LabelStyle}>Platformă</label>
                  <select
                    className={`${InputStyle} appearance-none pr-10 cursor-pointer`}
                    value={f.platform}
                    onChange={(e) =>
                      setF({ ...f, platform: e.target.value as Platform })
                    }
                  >
                    {platformsList.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.label}
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
                    onChange={(e) =>
                      setF({ ...f, status: e.target.value as ProjStatus })
                    }
                  >
                    {statusesList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-[30px] w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* TEHNIC TAB */}
            <div
              className={
                activeTab === "tehnic"
                  ? "space-y-4 animate-in fade-in"
                  : "hidden"
              }
            >
              <div>
                <label className={LabelStyle}>
                  Main Tech Stack (Separate prin virgulă)
                </label>
                <input
                  type="text"
                  className={InputStyle}
                  value={f.tech?.join(", ") || ""}
                  onChange={(e) => handleArrayChange("tech", e.target.value)}
                  placeholder="React, Node.js, Docker..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LabelStyle}>Frontend Stack</label>
                  <input
                    type="text"
                    className={InputStyle}
                    value={f.frontend?.join(", ") || ""}
                    onChange={(e) =>
                      handleArrayChange("frontend", e.target.value)
                    }
                    placeholder="Tailwind, Redux..."
                  />
                </div>
                <div>
                  <label className={LabelStyle}>Backend Stack</label>
                  <input
                    type="text"
                    className={InputStyle}
                    value={f.backend?.join(", ") || ""}
                    onChange={(e) =>
                      handleArrayChange("backend", e.target.value)
                    }
                    placeholder="Express, PostgreSQL..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <label className={LabelStyle}>DevOps / Hosting</label>
                  <input
                    type="text"
                    className={InputStyle}
                    value={f.devops?.join(", ") || ""}
                    onChange={(e) =>
                      handleArrayChange("devops", e.target.value)
                    }
                    placeholder="AWS, GitHub Actions, Vercel..."
                  />
                </div>

                {/* Upload Diagrama */}
                <div>
                  <label className={LabelStyle}>Diagramă Arhitectură</label>
                  <div className="flex flex-col gap-2">
                    {f.architectureDiagram ? (
                      <div className="relative w-full h-[46px] bg-black/40 rounded-xl border border-white/10 overflow-hidden group">
                        <img
                          src={f.architectureDiagram}
                          alt="Preview Diagrama"
                          className="w-full h-full object-cover opacity-80"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setF({ ...f, architectureDiagram: undefined })
                          }
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        >
                          <Trash2 className="w-5 h-5 text-rose-400" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative w-full">
                        <input
                          type="file"
                          accept="image/*"
                          id="diagramUpload"
                          className="hidden"
                          onChange={handleDiagramUpload}
                        />
                        <label
                          htmlFor="diagramUpload"
                          className="flex items-center justify-center gap-2 w-full h-[46px] border-2 border-dashed border-white/20 rounded-xl hover:border-purple-500/50 hover:bg-white/5 transition-colors cursor-pointer text-slate-400 hover:text-white"
                        >
                          <UploadCloud className="w-4 h-4" />{" "}
                          <span className="text-xs font-bold">
                            Încarcă Imagine
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className={LabelStyle}>
                  Highlights / Funcții (Apasă Enter pentru o funcție nouă)
                </label>
                <textarea
                  rows={4}
                  className={`${InputStyle} resize-none custom-scrollbar`}
                  value={f.highlights?.join("\n") || ""}
                  onChange={(e) =>
                    setF({ ...f, highlights: e.target.value.split("\n") })
                  }
                  placeholder="Autentificare biometrică&#10;Plăți cu Stripe&#10;Sistem multi-tenant"
                />
              </div>
            </div>

            {/* METRICI & MEDIA TAB */}
            <div
              className={
                activeTab === "metrici"
                  ? "space-y-4 animate-in fade-in"
                  : "hidden"
              }
            >
              {/* Galerie Imagini Proiect */}
              <div>
                <label className={LabelStyle}>
                  Imagini Proiect (Mockup UI, Screenshots)
                </label>
                <div className="flex flex-col gap-3">
                  {f.images && f.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {f.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-video bg-black/40 rounded-xl border border-white/10 overflow-hidden group"
                        >
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover opacity-80"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                          >
                            <Trash2 className="w-5 h-5 text-rose-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative w-full">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      id="imagesUpload"
                      className="hidden"
                      onChange={handleImagesUpload}
                    />
                    <label
                      htmlFor="imagesUpload"
                      className="flex items-center justify-center gap-2 w-full h-[46px] border-2 border-dashed border-white/20 rounded-xl hover:border-purple-500/50 hover:bg-white/5 transition-colors cursor-pointer text-slate-400 hover:text-white"
                    >
                      <UploadCloud className="w-4 h-4" />{" "}
                      <span className="text-xs font-bold">
                        Încarcă Imagini Noi
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LabelStyle}>URL Proiect Live</label>
                  <input
                    type="url"
                    className={InputStyle}
                    value={f.liveUrl || ""}
                    onChange={(e) => setF({ ...f, liveUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className={LabelStyle}>URL GitHub / Repo</label>
                  <input
                    type="url"
                    className={InputStyle}
                    value={f.gitUrl || ""}
                    onChange={(e) => setF({ ...f, gitUrl: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={LabelStyle}>Ore Lucrate</label>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={blockNegative}
                    className={InputStyle}
                    value={f.hours || 0}
                    onChange={(e) =>
                      setF({ ...f, hours: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label className={LabelStyle}>Versiune</label>
                  <input
                    type="text"
                    className={InputStyle}
                    value={f.version || ""}
                    onChange={(e) => setF({ ...f, version: e.target.value })}
                    placeholder="1.0.0"
                  />
                </div>
                <div className="relative">
                  <label className={LabelStyle}>Stele (GitHub)</label>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={blockNegative}
                    className={`${InputStyle} ${isFetchingGit ? "pr-10" : ""}`}
                    value={f.stars || 0}
                    onChange={(e) =>
                      setF({ ...f, stars: parseInt(e.target.value) || 0 })
                    }
                  />
                  {isFetchingGit && (
                    <div className="absolute right-3 top-[26px]">
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className={LabelStyle}>Ultima modif.</label>
                  <input
                    type="text"
                    className={`${InputStyle} ${isFetchingGit ? "pr-10" : ""}`}
                    value={f.lastModified || ""}
                    onChange={(e) =>
                      setF({ ...f, lastModified: e.target.value })
                    }
                    placeholder="ex. 12.05.2024"
                  />
                  {isFetchingGit && (
                    <div className="absolute right-3 top-[26px]">
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LabelStyle}>Nr. Utilizatori</label>
                  <input
                    type="text"
                    className={InputStyle}
                    value={f.users || ""}
                    onChange={(e) => setF({ ...f, users: e.target.value })}
                    placeholder='ex: "10k+"'
                  />
                </div>
                <div>
                  <label className={LabelStyle}>Data Începerii</label>
                  <input
                    type="month"
                    className={InputStyle}
                    value={f.since || ""}
                    onChange={(e) => setF({ ...f, since: e.target.value })}
                  />
                </div>
              </div>
            </div>
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
              form="project-form"
              className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all"
            >
              {isEdit ? "Salvează Modificările" : "Adaugă Proiectul"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= PAGINA PRINCIPALĂ =================
export default function WebDevelopment() {
  const [projs, setProjs] = useState<SWProject[]>(INITIAL_PROJECTS);
  const [platforms, setPlatforms] = useState<FilterOption[]>(INITIAL_PLATFORMS);
  const [statuses, setStatuses] = useState<FilterOption[]>(INITIAL_STATUSES);

  const [sel, setSel] = useState<SWProject | null>(null);
  const [editingProj, setEditingProj] = useState<SWProject | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [manageFilterType, setManageFilterType] = useState<
    "platform" | "status" | null
  >(null);

  const [search, setSearch] = useState("");
  const [fPlat, setFPlat] = useState("all");
  const [fStat, setFStat] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const activeProjects = projs.filter((p) => !p.isDeleted);
  const deletedProjects = projs.filter((p) => p.isDeleted);
  const projectsToDisplay = showTrash ? deletedProjects : activeProjects;

  const filtered = useMemo(() => {
    let result = projectsToDisplay.filter((p) => {
      const ms =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.tagline.toLowerCase().includes(search.toLowerCase());
      return (
        ms &&
        (fPlat === "all" || p.platform === fPlat) &&
        (fStat === "all" || p.status === fStat)
      );
    });
    result.sort((a, b) => {
      if (sortBy === "hours") return b.hours - a.hours;
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return b.id - a.id;
    });
    return result;
  }, [projectsToDisplay, search, fPlat, fStat, sortBy]);

  const featured = filtered.filter((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  const totalH = activeProjects.reduce((s, p) => s + p.hours, 0);
  const formattedHours =
    totalH >= 1000 ? `${(totalH / 1000).toFixed(1)}k` : totalH.toString();
  const liveC = activeProjects.filter((p) => p.status === "live").length;
  const techSet = new Set(activeProjects.flatMap((p) => p.tech));

  const statsData = [
    {
      l: "Proiecte Active",
      v: activeProjects.length,
      icon: FolderKanban,
      color: "text-white",
    },
    { l: "Live în Producție", v: liveC, icon: Activity, color: "text-white" },
    { l: "Ore Investite", v: formattedHours, icon: Clock, color: "text-white" },
    { l: "Tehnologii", v: techSet.size, icon: Cpu, color: "text-white" },
  ];

  const handleSaveProject = (newOrUpdatedProj: SWProject) => {
    if (editingProj) {
      setProjs((prev) =>
        prev.map((p) => (p.id === newOrUpdatedProj.id ? newOrUpdatedProj : p)),
      );
    } else {
      setProjs([newOrUpdatedProj, ...projs]);
    }
    setShowAdd(false);
    setEditingProj(null);
  };

  const handleSoftDelete = (id: number) =>
    setProjs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isDeleted: true } : p)),
    );
  const handleRestore = (id: number) =>
    setProjs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isDeleted: false } : p)),
    );
  const handleHardDelete = (id: number) => {
    if (
      window.confirm("Ești sigur că vrei să ștergi DEFINITIV acest proiect?")
    ) {
      setProjs((prev) => prev.filter((x) => x.id !== id));
    }
  };

  useEffect(() => {
    if (showTrash && deletedProjects.length === 0) setShowTrash(false);
  }, [deletedProjects.length, showTrash]);

  const platformOptions = [
    { value: "all", label: "Toate Platformele" },
    ...platforms.map((p) => ({ value: p.id, label: p.label })),
  ];
  const statusOptions = [
    { value: "all", label: "Toate Statusurile" },
    ...statuses.map((s) => ({ value: s.id, label: s.label })),
  ];
  const sortOptions = [
    { value: "newest", label: "Cele mai noi" },
    { value: "hours", label: "Complexitate (Ore)" },
    { value: "title", label: "Alfabetic (A-Z)" },
  ];

  return (
    <PageLayout>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.5); }
      `}</style>

      <div className="min-h-screen bg-[#080810] text-white overflow-hidden font-sans pt-24 sm:pt-32 px-4 sm:px-6 md:px-10">
        {/* HEADER & STATS */}
        <div className="flex flex-col xl:flex-row gap-10 mb-12">
          <div className="xl:w-1/3 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              Software{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                Portofoliu
              </span>
            </h1>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base max-w-md">
              Aplicații web scalabile, utilitare desktop, arhitectură backend și
              ecosisteme de date.
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
                    <div
                      className={`text-3xl font-black ${m.color} group-hover:text-purple-50 font-mono tracking-tighter mb-1 transition-colors`}
                    >
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
                  placeholder="Caută tehnologie sau nume..."
                  className="w-full bg-[#09090b] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white outline-none focus:border-purple-500/50 hover:border-white/20 transition-all placeholder:text-slate-600 shadow-sm custom-scrollbar"
                />
              </div>
              <div className="flex gap-3 flex-wrap sm:flex-nowrap w-full md:w-auto">
                <CustomSelect
                  value={fPlat}
                  onChange={setFPlat}
                  options={platformOptions}
                  icon={Filter}
                  onManage={() => setManageFilterType("platform")}
                />
                <CustomSelect
                  value={fStat}
                  onChange={setFStat}
                  options={statusOptions}
                  onManage={() => setManageFilterType("status")}
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
              {deletedProjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTrash(!showTrash)}
                  title={
                    showTrash ? "Înapoi la Proiecte Active" : "Coș de Gunoi"
                  }
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${showTrash ? "bg-red-500/20 text-red-400 border-red-500/50" : "bg-[#09090b] text-slate-400 border-white/10 hover:bg-white/5 hover:text-white"}`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>({deletedProjects.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowAdd(true);
                  setShowTrash(false);
                }}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all whitespace-nowrap transform hover:scale-[1.02]"
              >
                <Code2 className="w-4 h-4" /> Adaugă
              </button>
            </div>
          </div>
        </div>

        {showTrash && (
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-red-400">Proiecte Șterse</h2>
            <p className="text-sm text-slate-500 ml-2">
              Aici poți restaura proiectele sau le poți șterge definitiv.
            </p>
          </div>
        )}

        {/* GRID PROIECTE */}
        <div className="pb-16 flex flex-col gap-12">
          {featured.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-amber-400">★</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Featured Projects
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((p) => (
                  <Card
                    key={p.id}
                    p={p}
                    admin={true}
                    onClick={() => !showTrash && setSel(p)}
                    onEdit={() => setEditingProj(p)}
                    onDel={() =>
                      showTrash
                        ? handleHardDelete(p.id)
                        : handleSoftDelete(p.id)
                    }
                    onRestore={() => handleRestore(p.id)}
                    isTrashView={showTrash}
                    platformsList={platforms}
                    statusesList={statuses}
                  />
                ))}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section>
              {featured.length > 0 && (
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6">
                  Alte Proiecte
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((p) => (
                  <Card
                    key={p.id}
                    p={p}
                    admin={true}
                    onClick={() => !showTrash && setSel(p)}
                    onEdit={() => setEditingProj(p)}
                    onDel={() =>
                      showTrash
                        ? handleHardDelete(p.id)
                        : handleSoftDelete(p.id)
                    }
                    onRestore={() => handleRestore(p.id)}
                    isTrashView={showTrash}
                    platformsList={platforms}
                    statusesList={statuses}
                  />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-3xl bg-[#0b0b10]">
              <div className="text-4xl mb-4 opacity-50">📂</div>
              <div className="text-slate-400 font-medium">
                {showTrash
                  ? "Nu există proiecte în coșul de gunoi."
                  : "Niciun proiect nu corespunde filtrelor aplicate."}
              </div>
            </div>
          )}
        </div>

        {/* OVERLAYS / MODALS */}
        {sel && (
          <ProjectModal
            p={sel}
            onClose={() => setSel(null)}
            platformsList={platforms}
            statusesList={statuses}
          />
        )}

        {(showAdd || editingProj) && (
          <EditModal
            key={editingProj ? editingProj.id : "add"}
            project={editingProj || undefined}
            onClose={() => {
              setShowAdd(false);
              setEditingProj(null);
            }}
            onSave={handleSaveProject}
            platformsList={platforms}
            statusesList={statuses}
          />
        )}

        {manageFilterType && (
          <ManageFiltersModal
            title={
              manageFilterType === "platform"
                ? "Gestionează Platforme"
                : "Gestionează Statusuri"
            }
            items={manageFilterType === "platform" ? platforms : statuses}
            onClose={() => setManageFilterType(null)}
            onSave={(newItems) => {
              if (manageFilterType === "platform") setPlatforms(newItems);
              else setStatuses(newItems);
              setManageFilterType(null);
            }}
          />
        )}
      </div>
    </PageLayout>
  );
}
