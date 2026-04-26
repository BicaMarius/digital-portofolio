import React, { useState, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Filter,
  EyeOff,
  ExternalLink,
  Edit,
  Trash2,
  Trash,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Monitor,
  Grid3x3,
  List,
  Target,
  Layers,
  Zap,
  CheckCircle2,
  ImagePlus,
  BarChart3,
  Check,
  Settings2,
  Lock,
  Unlock,
  ChevronDown,
  BrainCircuit,
  Database,
  Network,
  Cpu,
  Github,
  Activity,
  Terminal,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  getGalleryItemsByCategory,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  softDeleteGalleryItem,
  restoreGalleryItem,
  getTrashedGalleryItemsByCategory,
} from "@/lib/api";
import type { GalleryItem } from "@shared/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

type AiMlProject = GalleryItem;

interface AIMLMeta {
  brief: string;
  problem: string;
  dataset: string;
  architecture: string;
  metrics: string;
  repoUrl: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const INITIAL_STACK = [
  "Python",
  "PyTorch",
  "TensorFlow",
  "Scikit-learn",
  "Pandas",
  "HuggingFace",
  "FastAPI",
  "Streamlit",
  "CUDA",
  "OpenCV",
];

const AI_TYPES: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  nlp: {
    label: "NLP & LLMs",
    color: "text-blue-400",
    bg: "bg-blue-400/15 border-blue-400/30",
    icon: <Terminal className="w-3.5 h-3.5" />,
  },
  cv: {
    label: "Computer Vision",
    color: "text-emerald-400",
    bg: "bg-emerald-400/15 border-emerald-400/30",
    icon: <EyeOff className="w-3.5 h-3.5" />,
  },
  predictive: {
    label: "Predictive Modeling",
    color: "text-amber-400",
    bg: "bg-amber-400/15 border-amber-400/30",
    icon: <Activity className="w-3.5 h-3.5" />,
  },
  "gen-ai": {
    label: "Generative AI",
    color: "text-purple-400",
    bg: "bg-purple-400/15 border-purple-400/30",
    icon: <BrainCircuit className="w-3.5 h-3.5" />,
  },
  "data-science": {
    label: "Data Science / EDA",
    color: "text-cyan-400",
    bg: "bg-cyan-400/15 border-cyan-400/30",
    icon: <Database className="w-3.5 h-3.5" />,
  },
};

const STATUSES: Record<string, { label: string; color: string }> = {
  experiment: {
    label: "Experiment / Notebook",
    color: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  },
  model: {
    label: "Model Antrenat",
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  deployed: {
    label: "Produs Lansat (API)",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMeta(desc: string | null | undefined): AIMLMeta {
  const empty: AIMLMeta = {
    brief: "",
    problem: "",
    dataset: "",
    architecture: "",
    metrics: "",
    repoUrl: "",
  };
  if (!desc) return empty;
  try {
    const p = JSON.parse(desc);
    if (typeof p === "object" && p !== null) return { ...empty, ...p };
  } catch {
    /* legacy */
  }
  return { ...empty, brief: desc };
}

function encodeMeta(m: AIMLMeta): string {
  return JSON.stringify(m);
}

function getImages(project: AiMlProject): string[] {
  if (project.date?.includes("|"))
    return project.date.split("|").filter(Boolean);
  return [project.image].filter(Boolean);
}

// ─── Sub-component: Project Card ─────────────────────────────────────────────

interface ProjectCardProps {
  project: AiMlProject;
  index: number;
  isAdmin: boolean;
  viewMode: "grid" | "list";
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index,
  isAdmin,
  viewMode,
  onClick,
  onEdit,
  onDelete,
}) => {
  const meta = parseMeta(project.description);
  const typeInfo = AI_TYPES[project.subcategory || "nlp"] || AI_TYPES["nlp"];
  const statusInfo =
    STATUSES[(project as any).medium || "experiment"] || STATUSES.experiment;
  const stack: string[] = (project as any).materials || [];
  const images = getImages(project);
  const isDeployed = (project as any).medium === "deployed";

  if (viewMode === "list") {
    return (
      <div
        className="group flex gap-4 p-4 rounded-xl border border-border/50 hover:border-blue-500/40 bg-card/50 hover:bg-card/80 transition-all duration-300 cursor-pointer animate-scale-in"
        style={{ animationDelay: `${index * 40}ms` }}
        onClick={onClick}
      >
        <div className="relative w-32 sm:w-48 flex-shrink-0 aspect-[4/3] rounded-lg overflow-hidden bg-muted border border-border/50">
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {images.length > 1 && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
              +{images.length - 1}
            </div>
          )}
          {project.isPrivate && (
            <div className="absolute top-1.5 left-1.5 bg-black/70 p-1 rounded">
              <EyeOff className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-widest flex items-center gap-1.5 ${typeInfo.color}`}
                >
                  {typeInfo.icon} {typeInfo.label}
                </span>
                <h3 className="font-semibold text-base leading-tight mt-1 line-clamp-1">
                  {project.title}
                </h3>
              </div>
              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-blue-500/10 hover:text-blue-400"
                    onClick={onEdit}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {meta.brief || meta.problem || "Fără descriere"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-2 mt-auto">
            <Badge
              variant="outline"
              className={`text-[10px] h-5 ${statusInfo.color}`}
            >
              {statusInfo.label}
            </Badge>
            {(project as any).dimensions && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Database className="w-3 h-3" /> {(project as any).dimensions}
              </span>
            )}
            {stack.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[10px] text-muted-foreground border border-border/40 px-1.5 py-0.5 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative rounded-xl overflow-hidden border border-border/40 hover:border-blue-500/50 bg-card/60 hover:bg-card/90 transition-all duration-300 cursor-pointer animate-scale-in hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 flex flex-col h-full"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onClick}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] z-10 ${typeInfo.bg.replace("bg-", "bg-").replace("/15", "/80").split(" ")[0]}`}
      />

      <div className="relative aspect-[16/10] overflow-hidden bg-muted border-b border-border/20">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-3 left-3 flex gap-2">
          {images.length > 1 && (
            <div className="bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md font-mono flex items-center gap-1 border border-white/10">
              <ImagePlus className="h-3 w-3" /> {images.length}
            </div>
          )}
          {project.isPrivate && (
            <div className="bg-black/70 backdrop-blur-sm p-1.5 rounded-md border border-white/10">
              <EyeOff className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="flex gap-2">
            {(project as any).location && (
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none gap-1">
                <ExternalLink className="w-3 h-3" /> Demo
              </Badge>
            )}
            {meta.repoUrl && (
              <Badge className="bg-slate-700 hover:bg-slate-600 text-white border-none gap-1">
                <Github className="w-3 h-3" /> Repo
              </Badge>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-black/60 hover:bg-blue-500/80 text-white rounded-md backdrop-blur-sm"
                onClick={onEdit}
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-black/60 hover:bg-red-500/80 text-white rounded-md backdrop-blur-sm"
                onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <span
            className={`text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 ${typeInfo.color}`}
          >
            {typeInfo.icon} {typeInfo.label}
          </span>
          <h3 className="font-bold text-base mt-1.5 leading-snug line-clamp-1">
            {project.title}
          </h3>
          <p className="text-muted-foreground text-xs mt-2 line-clamp-2 leading-relaxed">
            {meta.brief || meta.problem || "Nicio descriere adăugată."}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <Badge
              variant="outline"
              className={`text-[10px] h-5 px-2 ${statusInfo.color}`}
            >
              {statusInfo.label}
            </Badge>
            <div className="flex items-center gap-1.5">
              {stack.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-medium text-muted-foreground border border-border/60 px-1.5 py-0.5 rounded bg-muted/20"
                >
                  {t}
                </span>
              ))}
              {stack.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{stack.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-component: Project Modal (Tabbed, Artistic, Clean) ──────────────────

interface ProjectModalProps {
  project: AiMlProject;
  projects: AiMlProject[];
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdmin: boolean;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  projects,
  onClose,
  onEdit,
  onDelete,
  isAdmin,
}) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const meta = parseMeta(project.description);
  const images = getImages(project);
  const typeInfo = AI_TYPES[project.subcategory || "nlp"] || AI_TYPES["nlp"];
  const statusInfo =
    STATUSES[(project as any).medium || "experiment"] || STATUSES.experiment;
  const stack: string[] = (project as any).materials || [];

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;
    const t = setInterval(
      () => setImgIdx((i) => (i + 1) % images.length),
      4000,
    );
    return () => clearInterval(t);
  }, [autoPlay, images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && images.length > 1) {
        setAutoPlay(false);
        setImgIdx((i) => (i - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight" && images.length > 1) {
        setAutoPlay(false);
        setImgIdx((i) => (i + 1) % images.length);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col lg:flex-row rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl bg-card border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT: Image Gallery */}
        <div className="relative h-[40vh] lg:h-full lg:w-[50%] xl:w-[55%] flex flex-col bg-[#0a0a0a] border-b lg:border-b-0 lg:border-r border-border">
          <div className="relative flex-1 flex items-center justify-center p-2 sm:p-8 overflow-hidden">
            <img
              src={images[imgIdx] || project.image}
              alt={`${project.title} — slide ${imgIdx + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black border border-white/10 flex items-center justify-center text-white transition-all shadow-md"
                  onClick={() => {
                    setAutoPlay(false);
                    setImgIdx((i) => (i - 1 + images.length) % images.length);
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black border border-white/10 flex items-center justify-center text-white transition-all shadow-md"
                  onClick={() => {
                    setAutoPlay(false);
                    setImgIdx((i) => (i + 1) % images.length);
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 px-4 pb-4 overflow-x-auto custom-scrollbar flex-shrink-0 bg-[#0a0a0a]">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAutoPlay(false);
                    setImgIdx(i);
                  }}
                  className={`h-14 w-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${i === imgIdx ? "border-blue-500 opacity-100" : "border-transparent opacity-50 hover:opacity-100"}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Tabbed Details Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-card/80 backdrop-blur-sm relative">
          {/* Header Sticky */}
          <div className="z-20 bg-card/50 px-6 py-5 flex items-start justify-between gap-4 border-b border-border/50">
            <div>
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 ${typeInfo.color}`}
              >
                {typeInfo.icon} {typeInfo.label}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight mt-1">
                {project.title}
              </h2>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isAdmin && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-400"
                  onClick={onEdit}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {isAdmin && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-muted hover:bg-muted/80 rounded-full ml-1"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs
            defaultValue="overview"
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="mx-6 justify-start border-b border-border/50 rounded-none bg-transparent p-0 h-auto gap-6 mt-2">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-1 py-3 text-sm"
              >
                Prezentare
              </TabsTrigger>
              <TabsTrigger
                value="arch"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-1 py-3 text-sm"
              >
                Model & Date
              </TabsTrigger>
              <TabsTrigger
                value="stack"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-1 py-3 text-sm"
              >
                Stack Tehnic
              </TabsTrigger>
            </TabsList>

            {/* TAB: Overview */}
            <TabsContent
              value="overview"
              className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 m-0 space-y-6"
            >
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "px-3 py-1 bg-background shadow-sm",
                    statusInfo.color,
                  )}
                >
                  {statusInfo.label}
                </Badge>
                {(project as any).dimensions && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 border-border text-muted-foreground gap-1.5 shadow-sm bg-background"
                  >
                    <Database className="w-3.5 h-3.5 text-blue-400" /> Size:{" "}
                    {(project as any).dimensions}
                  </Badge>
                )}
                {(project as any).device && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 border-border text-muted-foreground gap-1.5 shadow-sm bg-background"
                  >
                    <Cpu className="w-3.5 h-3.5 text-purple-400" /> Compute:{" "}
                    {(project as any).device}
                  </Badge>
                )}
              </div>

              {meta.brief && (
                <p className="text-lg text-foreground/90 leading-relaxed font-medium">
                  {meta.brief}
                </p>
              )}

              {meta.problem && (
                <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/20 mt-4 relative overflow-hidden">
                  <BrainCircuit className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-500/5 pointer-events-none" />
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" /> Problema / Obiectivul
                  </h4>
                  <p className="text-sm font-medium text-foreground/90 whitespace-pre-wrap relative z-10">
                    {meta.problem}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {(project as any).location && (
                  <Button
                    className="flex-1 gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold h-12 rounded-xl transition-transform hover:-translate-y-0.5 shadow-lg shadow-blue-500/20"
                    onClick={() =>
                      window.open((project as any).location, "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4" /> Live Demo
                  </Button>
                )}
                {meta.repoUrl && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 h-12 rounded-xl border-border bg-background hover:bg-muted transition-transform hover:-translate-y-0.5"
                    onClick={() => window.open(meta.repoUrl, "_blank")}
                  >
                    <Github className="h-4 w-4" /> Cod Sursă (Repo)
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* TAB: Arch & Data */}
            <TabsContent
              value="arch"
              className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 m-0 space-y-6"
            >
              {meta.dataset && (
                <div className="relative pl-4 border-l-2 border-emerald-500/50 py-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1.5">
                    <Database className="h-4 w-4" /> Setul de Date (Dataset)
                  </h4>
                  <p className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {meta.dataset}
                  </p>
                </div>
              )}

              {meta.architecture && (
                <div className="relative pl-4 border-l-2 border-purple-500/50 py-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-1.5">
                    <Network className="h-4 w-4" /> Arhitectură & Model
                  </h4>
                  <p className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {meta.architecture}
                  </p>
                </div>
              )}

              {meta.metrics && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4" /> Performanță / Metrici
                  </h4>
                  <p className="text-sm leading-relaxed text-foreground font-medium whitespace-pre-wrap">
                    {meta.metrics}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB: Stack */}
            <TabsContent
              value="stack"
              className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 m-0"
            >
              {stack.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-400" /> Tehnologii
                    Utilizate
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {stack.map((t) => (
                      <div
                        key={t}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border shadow-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="font-semibold text-sm">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-sm">
                  Niciun tool specificat.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// ─── Form state type ──────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "",
  brief: "",
  problem: "",
  dataset: "",
  architecture: "",
  metrics: "",
  type: "nlp",
  modelSize: "",
  compute: "",
  status: "experiment",
  tools: [] as string[],
  demoUrl: "",
  repoUrl: "",
  isPrivate: false,
};

type FormState = typeof EMPTY_FORM;

// ─── Main component ───────────────────────────────────────────────────────────

export default function AiMl() {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();

  const [projects, setProjects] = useState<AiMlProject[]>([]);
  const [trashed, setTrashed] = useState<AiMlProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dialog state
  const [selected, setSelected] = useState<AiMlProject | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [toDelete, setToDelete] = useState<AiMlProject | null>(null);

  // Tools Manager State
  const [availableTools, setAvailableTools] = useState<string[]>(INITIAL_STACK);
  const [showToolManager, setShowToolManager] = useState(false);
  const [newToolInput, setNewToolInput] = useState("");
  const [toolSearch, setToolSearch] = useState("");
  const [showToolDropdown, setShowToolDropdown] = useState(false);

  // Form
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── Init Tools ────────────────────────────────────────────────────────────

  useEffect(() => {
    const savedTools = localStorage.getItem("aiml_tools");
    if (savedTools) {
      try {
        setAvailableTools(JSON.parse(savedTools));
      } catch (e) {}
    }
  }, []);

  const saveTools = (newTools: string[]) => {
    setAvailableTools(newTools);
    localStorage.setItem("aiml_tools", JSON.stringify(newTools));
  };

  const handleAddGlobalTool = () => {
    const t = newToolInput.trim();
    if (t && !availableTools.includes(t)) {
      saveTools([...availableTools, t]);
      setNewToolInput("");
    }
  };

  const handleRemoveGlobalTool = (tool: string) => {
    saveTools(availableTools.filter((x) => x !== tool));
  };

  // ── Data loading ──────────────────────────────────────────────────────────

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const items = await getGalleryItemsByCategory("ai-ml");
      setProjects(isAdmin ? items : items.filter((p) => !p.isPrivate));
    } catch {
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca proiectele.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const reloadTrash = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const items = await getTrashedGalleryItemsByCategory("ai-ml");
      setTrashed(items as AiMlProject[]);
    } catch {
      /* silent */
    }
  }, [isAdmin]);

  useEffect(() => {
    reload();
    reloadTrash();
  }, [reload, reloadTrash]);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const visible = projects.filter((p) => {
    const mSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());
    const mType = filterType === "all" || p.subcategory === filterType;
    const mStatus =
      filterStatus === "all" || (p as any).medium === filterStatus;
    return mSearch && mType && mStatus;
  });

  // ── Form helpers ──────────────────────────────────────────────────────────

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setImageFiles([]);
    setImagePreviews([]);
    setSingleFile(null);
    setToolSearch("");
  };

  const populateForm = (p: AiMlProject) => {
    const meta = parseMeta(p.description);
    const tools: string[] = (p as any).materials || [];
    setForm({
      title: p.title,
      brief: meta.brief,
      problem: meta.problem,
      dataset: meta.dataset,
      architecture: meta.architecture,
      metrics: meta.metrics,
      type: p.subcategory || "nlp",
      status: (p as any).medium || "experiment",
      modelSize: (p as any).dimensions || "",
      compute: (p as any).device || "",
      tools,
      demoUrl: (p as any).location || "",
      repoUrl: meta.repoUrl || "",
      isPrivate: p.isPrivate || false,
    });
    setImagePreviews(getImages(p));
    setSingleFile(null);
    setImageFiles([]);
  };

  const handleMultipleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageFiles((prev) => [...prev, ...files]);

    files.forEach((f) => {
      const r = new FileReader();
      r.onloadend = () =>
        setImagePreviews((prev) => [...prev, r.result as string]);
      r.readAsDataURL(f);
    });
  };

  const handleRemovePreviewImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => {
      if (prev.length > index) return prev.filter((_, i) => i !== index);
      return prev;
    });
  };

  const handleSingleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSingleFile(f);
    const r = new FileReader();
    r.onloadend = () => setImagePreviews([r.result as string]);
    r.readAsDataURL(f);
  };

  const toggleToolForm = (tool: string) => {
    setForm((f) => ({
      ...f,
      tools: f.tools.includes(tool)
        ? f.tools.filter((t) => t !== tool)
        : [...f.tools, tool],
    }));
  };

  // ── CRUD operations ───────────────────────────────────────────────────────

  const buildPayload = (imageUrl: string, allImages: string) => ({
    category: "ai-ml" as const,
    subcategory: form.type,
    title: form.title,
    image: imageUrl,
    description: encodeMeta({
      brief: form.brief,
      problem: form.problem,
      dataset: form.dataset,
      architecture: form.architecture,
      metrics: form.metrics,
      repoUrl: form.repoUrl,
      role: "",
      process: [],
      solution: "",
      users: "",
      outcomes: "", // filler for old schema
    }),
    device: form.compute,
    dimensions: form.modelSize,
    materials: form.tools,
    location: form.demoUrl,
    medium: form.status,
    isPrivate: form.isPrivate,
    date: allImages,
  });

  const handleAdd = async () => {
    if (!form.title || imageFiles.length === 0) {
      toast({
        title: "Eroare",
        description: "Titlul și cel puțin o imagine sunt obligatorii.",
        variant: "destructive",
      });
      return;
    }
    try {
      setUploading(true);
      const urls: string[] = [];
      for (const file of imageFiles) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "aiml");
        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        urls.push(url);
      }
      await createGalleryItem(buildPayload(urls[0], urls.join("|")) as any);
      toast({ title: "Succes", description: "Proiectul AI a fost publicat." });
      setShowAdd(false);
      resetForm();
      await reload();
    } catch {
      toast({
        title: "Eroare",
        description: "Nu s-a putut salva proiectul.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!selected || !form.title) return;
    try {
      setUploading(true);
      let imageUrl = selected.image;

      const existingUrls = imagePreviews.filter((p) => p.startsWith("http"));
      let allUrls = [...existingUrls];

      if (singleFile) {
        const fd = new FormData();
        fd.append("file", singleFile);
        fd.append("folder", "aiml");
        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        imageUrl = url;
        allUrls = [url];
      } else if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", "aiml");
          const res = await fetch("/api/upload/image", {
            method: "POST",
            body: fd,
          });
          if (!res.ok) throw new Error("Upload failed");
          const { url } = await res.json();
          allUrls.push(url);
        }
      }

      if (allUrls.length > 0 && !singleFile) imageUrl = allUrls[0];

      await updateGalleryItem(
        selected.id!,
        buildPayload(imageUrl, allUrls.join("|")) as any,
      );
      toast({
        title: "Succes",
        description: "Proiectul AI a fost actualizat.",
      });
      setShowEdit(false);
      setSelected(null);
      resetForm();
      await reload();
    } catch {
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza proiectul.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await softDeleteGalleryItem(toDelete.id!);
      toast({ title: "Succes", description: "Mutat în coș." });
      setShowDeleteConfirm(false);
      setToDelete(null);
      setSelected(null);
      await reload();
      await reloadTrash();
    } catch {
      toast({
        title: "Eroare",
        description: "Ștergere eșuată.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (p: AiMlProject) => {
    try {
      await restoreGalleryItem(p.id!);
      toast({ title: "Restaurat", description: p.title });
      await reload();
      await reloadTrash();
    } catch {
      toast({
        title: "Eroare",
        description: "Restaurare eșuată.",
        variant: "destructive",
      });
    }
  };

  const handlePermDelete = async (p: AiMlProject) => {
    try {
      await deleteGalleryItem(p.id!);
      toast({ title: "Șters definitiv", description: p.title });
      await reloadTrash();
    } catch {
      toast({
        title: "Eroare",
        description: "Ștergere permanentă eșuată.",
        variant: "destructive",
      });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const typeCount = Object.fromEntries(
    Object.keys(AI_TYPES).map((k) => [
      k,
      projects.filter((p) => p.subcategory === k).length,
    ]),
  );

  return (
    <PageLayout>
      {/* Hero */}
      <section className="page-hero-section">
        <div className="page-container">
          <div className="text-center mb-6 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-3">
              <BrainCircuit className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
                AI & Machine Learning
              </h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Modele, experimente data science și aplicații inteligente
              construite de la zero sau prin fine-tuning.
            </p>
          </div>

          {/* Stats mini-row */}
          {!loading && projects.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {Object.entries(typeCount)
                .filter(([, c]) => c > 0)
                .map(([k, c]) => {
                  const info = AI_TYPES[k];
                  return (
                    <div
                      key={k}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${info.bg} shadow-sm`}
                    >
                      <span className={`font-bold ${info.color}`}>{c}</span>
                      <span className="text-foreground/80">{info.label}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </section>

      <section className="page-content-section flex-1 mt-4">
        <div className="page-container">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="search"
                  placeholder="Caută modele, dataset-uri..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-card border-border"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[160px] bg-card border-border">
                  <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Domeniu AI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate domeniile</SelectItem>
                  {Object.entries(AI_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[160px] bg-card border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Orice Status</SelectItem>
                  {Object.entries(STATUSES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-3">
              <div className="flex items-center border border-border bg-card rounded-md p-1 gap-0.5">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-7 w-7 p-0 rounded-sm"
                >
                  <Grid3x3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-7 w-7 p-0 rounded-sm"
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && !isMobile && trashed.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTrash(true)}
                    className="relative gap-2 bg-card"
                  >
                    <Trash className="h-4 w-4" />
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center font-bold">
                      {trashed.length}
                    </span>
                  </Button>
                )}
                {isAdmin && !isMobile && (
                  <Button
                    onClick={() => {
                      resetForm();
                      setShowAdd(true);
                    }}
                    className="gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" /> Adaugă Model AI
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="text-center py-20 text-muted-foreground animate-pulse">
              Se încarcă modelele...
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-24 bg-card/50 rounded-2xl border border-border/50">
              <BrainCircuit className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search || filterType !== "all" || filterStatus !== "all"
                  ? "Niciun proiect AI nu corespunde filtrelor tale."
                  : "Nu ai încărcat niciun proiect AI/ML."}
              </p>
              {isAdmin && !search && filterType === "all" && (
                <Button
                  className="mt-6 gap-2"
                  onClick={() => {
                    resetForm();
                    setShowAdd(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Adaugă primul model
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  isAdmin={isAdmin}
                  viewMode="grid"
                  onClick={() => setSelected(p)}
                  onEdit={(e) => {
                    e.stopPropagation();
                    populateForm(p);
                    setSelected(p);
                    setShowEdit(true);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    setToDelete(p);
                    setShowDeleteConfirm(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {visible.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  isAdmin={isAdmin}
                  viewMode="list"
                  onClick={() => setSelected(p)}
                  onEdit={(e) => {
                    e.stopPropagation();
                    populateForm(p);
                    setSelected(p);
                    setShowEdit(true);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    setToDelete(p);
                    setShowDeleteConfirm(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAB (mobile admin) */}
      {isAdmin && isMobile && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-3">
          {trashed.length > 0 && (
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full shadow-lg bg-background relative border-border"
              onClick={() => setShowTrash(true)}
            >
              <Trash className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center font-bold">
                {trashed.length}
              </span>
            </Button>
          )}
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Project Modal View */}
      {selected && !showEdit && !showDeleteConfirm && (
        <ProjectModal
          project={selected}
          projects={visible}
          onClose={() => setSelected(null)}
          isAdmin={isAdmin}
          onEdit={
            isAdmin
              ? () => {
                  populateForm(selected);
                  setShowEdit(true);
                }
              : undefined
          }
          onDelete={
            isAdmin
              ? () => {
                  setToDelete(selected);
                  setSelected(null);
                  setShowDeleteConfirm(true);
                }
              : undefined
          }
        />
      )}

      {/* =========================================================================
          INLINED FORM DIALOG (Add/Edit)
          ========================================================================= */}
      {isAdmin && (
        <Dialog
          open={showAdd || showEdit}
          onOpenChange={(v) => {
            if (!v) {
              setShowAdd(false);
              setShowEdit(false);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-border bg-card">
            <DialogHeader className="px-6 py-5 bg-card border-b border-border/50 shadow-sm z-10">
              <DialogTitle className="flex items-center gap-2 text-blue-400">
                <BrainCircuit className="h-5 w-5" />
                {showEdit ? "Editează Model AI" : "Adaugă Proiect AI / ML"}
              </DialogTitle>
            </DialogHeader>

            <Tabs
              defaultValue="basics"
              className="flex-1 flex flex-col min-h-0 bg-muted/10"
            >
              <TabsList className="grid w-full grid-cols-4 text-xs mx-6 mt-4 max-w-[calc(100%-3rem)] bg-muted/50 border border-border/50">
                <TabsTrigger value="basics">Esențial</TabsTrigger>
                <TabsTrigger value="model">Model & Date</TabsTrigger>
                <TabsTrigger value="stack">Stack Tehnic</TabsTrigger>
                <TabsTrigger value="media">Media & Link</TabsTrigger>
              </TabsList>

              {/* TAB 1: Basics */}
              <TabsContent
                value="basics"
                className="flex-1 px-6 pt-5 space-y-4 m-0"
              >
                <div className="space-y-1.5">
                  <Label>Titlu Proiect *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="ex: Ro-LLM Fine-Tuned"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Scurtă descriere (pentru card)</Label>
                  <Input
                    value={form.brief}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brief: e.target.value }))
                    }
                    placeholder="Ce face modelul pe scurt..."
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Domeniu AI</Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AI_TYPES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, status: v }))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUSES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-muted-foreground">
                      <Database className="h-3 w-3" /> Dimensiune Model
                    </Label>
                    <Input
                      value={form.modelSize}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, modelSize: e.target.value }))
                      }
                      placeholder="ex: 7B params / 2.5 GB"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-muted-foreground">
                      <Cpu className="h-3 w-3" /> Hardware (Compute)
                    </Label>
                    <Input
                      value={form.compute}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, compute: e.target.value }))
                      }
                      placeholder="ex: 1x RTX 4090 / Cloud TPU"
                      className="h-9"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: Model & Date (Fără Scroll necesar) */}
              <TabsContent
                value="model"
                className="flex-1 px-6 pt-5 space-y-4 m-0"
              >
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-widest">
                    <Target className="h-3 w-3" /> Obiectivul / Problema
                  </Label>
                  <Textarea
                    value={form.problem}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, problem: e.target.value }))
                    }
                    placeholder="Ce prezice sau ce generează acest model?"
                    className="resize-none h-[64px] text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                    <Database className="h-3 w-3" /> Setul de Date (Dataset)
                  </Label>
                  <Textarea
                    value={form.dataset}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dataset: e.target.value }))
                    }
                    placeholder="ex: Kaggle Titanic, 50k imagini custom scraped, curățate cu Pandas..."
                    className="resize-none h-[64px] text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 uppercase tracking-widest">
                    <Network className="h-3 w-3" /> Arhitectură Model
                  </Label>
                  <Textarea
                    value={form.architecture}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, architecture: e.target.value }))
                    }
                    placeholder="ex: ResNet-50 modificat cu 3 head-uri dense, LoRA Fine-Tuning pe Mistral 7B..."
                    className="resize-none h-[64px] text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-widest">
                    <BarChart3 className="h-3 w-3" /> Performanță / Metrici
                  </Label>
                  <Input
                    value={form.metrics}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, metrics: e.target.value }))
                    }
                    placeholder="ex: 95% Accuracy, F1-Score: 0.92, 50ms Inference"
                    className="h-9 text-sm"
                  />
                </div>
              </TabsContent>

              {/* TAB 3: Process & Tools */}
              <TabsContent
                value="stack"
                className="flex-1 px-6 pt-5 space-y-6 m-0"
              >
                <div className="space-y-2 relative">
                  <Label className="text-sm font-semibold">
                    Tehnologii și Framework-uri
                  </Label>

                  {/* Căutare / Adăugare Tool cu Popover (Portal) pt a scapa de z-index issues */}
                  <Popover
                    open={showToolDropdown}
                    onOpenChange={setShowToolDropdown}
                  >
                    <PopoverTrigger asChild>
                      <div
                        className={`flex items-center border rounded-md transition-all px-3 py-1 cursor-text ${showToolDropdown ? "border-blue-500/50 ring-1 ring-blue-500/20 bg-background" : "border-border bg-card"}`}
                      >
                        <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                        <Input
                          className="border-0 focus-visible:ring-0 shadow-none bg-transparent h-8 px-0 text-sm"
                          placeholder="Caută framework (ex: PyTorch)..."
                          value={toolSearch}
                          onChange={(e) => {
                            setToolSearch(e.target.value);
                            setShowToolDropdown(true);
                          }}
                          onFocus={() => setShowToolDropdown(true)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (toolSearch.trim()) {
                                if (
                                  !availableTools.includes(toolSearch.trim())
                                ) {
                                  saveTools([
                                    ...availableTools,
                                    toolSearch.trim(),
                                  ]);
                                }
                                toggleToolForm(toolSearch.trim());
                                setToolSearch("");
                              }
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1 text-muted-foreground shrink-0"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowToolDropdown(!showToolDropdown);
                          }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0 border-border shadow-xl rounded-lg overflow-hidden z-[100]"
                      align="start"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar bg-card">
                        {availableTools
                          .filter((t) =>
                            t.toLowerCase().includes(toolSearch.toLowerCase()),
                          )
                          .map((t) => (
                            <button
                              key={t}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded flex items-center justify-between"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                toggleToolForm(t);
                                setToolSearch("");
                                setShowToolDropdown(false);
                              }}
                            >
                              {t}{" "}
                              {form.tools.includes(t) && (
                                <Check className="h-3.5 w-3.5 text-blue-400" />
                              )}
                            </button>
                          ))}
                        {toolSearch.trim() &&
                          !availableTools.some(
                            (t) => t.toLowerCase() === toolSearch.toLowerCase(),
                          ) && (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded text-blue-400 font-medium"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                saveTools([
                                  ...availableTools,
                                  toolSearch.trim(),
                                ]);
                                toggleToolForm(toolSearch.trim());
                                setToolSearch("");
                                setShowToolDropdown(false);
                              }}
                            >
                              <Plus className="inline w-3.5 h-3.5 mr-1" />{" "}
                              Adaugă noul framework "{toolSearch.trim()}"
                            </button>
                          )}
                      </div>
                      <div className="border-t border-border p-1 bg-muted/30">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded flex items-center gap-1.5 text-muted-foreground font-bold uppercase tracking-wider"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setShowToolDropdown(false);
                            setShowToolManager(true);
                          }}
                        >
                          <Settings2 className="h-3.5 w-3.5" /> Gestionează
                          Lista
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Chips pt Tool-uri selectate */}
                  {form.tools.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3">
                      {form.tools.map((t) => (
                        <span
                          key={t}
                          className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium"
                        >
                          {t}
                          <button
                            onClick={() => toggleToolForm(t)}
                            className="hover:text-red-400 ml-1.5 text-blue-400/50 hover:bg-red-500/10 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 4: Media & Links */}
              <TabsContent
                value="media"
                className="flex-1 px-6 pt-5 space-y-5 m-0"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-blue-400">
                      <ExternalLink className="w-3.5 h-3.5" /> Live Demo URL
                    </Label>
                    <Input
                      value={form.demoUrl}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, demoUrl: e.target.value }))
                      }
                      placeholder="https://..."
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-slate-400">
                      <Github className="w-3.5 h-3.5" /> Repository URL (Cod)
                    </Label>
                    <Input
                      value={form.repoUrl}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, repoUrl: e.target.value }))
                      }
                      placeholder="https://github.com/..."
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-card border border-border p-3 rounded-xl shadow-sm">
                  <Label className="text-sm font-semibold pl-1">
                    Vizibilitate Proiect
                  </Label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, isPrivate: !f.isPrivate }))
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 border font-bold text-xs uppercase tracking-wider ${
                      form.isPrivate
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-muted border-transparent text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {form.isPrivate ? (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Privat
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" /> Public
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Imagini proiect (Prima e Cover)</Label>
                  {showEdit ? (
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleSingleImage}
                      className="cursor-pointer"
                    />
                  ) : (
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImages}
                      className="cursor-pointer"
                    />
                  )}

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                      {imagePreviews.map((src, i) => (
                        <div
                          key={i}
                          className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group shadow-sm"
                        >
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                            {i === 0 ? "Cover" : i + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePreviewImage(i)}
                            className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-md backdrop-blur-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="px-6 py-4 flex justify-end gap-3 bg-card border-t border-border/50">
              <Button
                variant="ghost"
                onClick={() => {
                  showEdit ? setShowEdit(false) : setShowAdd(false);
                  resetForm();
                }}
                disabled={uploading}
              >
                Anulează
              </Button>
              <Button
                onClick={showEdit ? handleEdit : handleAdd}
                disabled={uploading}
                className="gap-2 min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white"
              >
                {uploading
                  ? "Se salvează..."
                  : showEdit
                    ? "Salvează"
                    : "Publică"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirm */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge proiect</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" va fi mutat în coșul de gunoi. Poți să îl
              restaurezi oricând de acolo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Mută în coș
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Trash dialog */}
      <Dialog open={showTrash} onOpenChange={setShowTrash}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Coș de gunoi
            </DialogTitle>
            <DialogDescription>
              Modelele șterse pot fi restaurate sau eliminate definitiv.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {trashed.length === 0 && (
              <p className="text-center text-muted-foreground py-10 bg-muted/30 rounded-lg">
                Coșul e gol.
              </p>
            )}
            {trashed.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 border border-border rounded-xl bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="w-full sm:w-24 h-24 sm:h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {AI_TYPES[p.subcategory || ""]?.label || p.subcategory}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(p)}
                    className="flex-1 sm:flex-none gap-1.5 h-8 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restaurează
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handlePermDelete(p)}
                    className="flex-1 sm:flex-none gap-1.5 h-8 text-xs"
                  >
                    <Trash className="h-3.5 w-3.5" /> Șterge definitiv
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Gestionează Tools Dialog */}
      <Dialog open={showToolManager} onOpenChange={setShowToolManager}>
        <DialogContent className="max-w-sm border-border z-[110]">
          <DialogHeader>
            <DialogTitle>Gestionează Instrumente AI</DialogTitle>
            <DialogDescription>
              Acestea apar automat la scrierea unui framework.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Input
              value={newToolInput}
              onChange={(e) => setNewToolInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddGlobalTool())
              }
              placeholder="Adaugă framework..."
            />
            <Button onClick={handleAddGlobalTool}>Adaugă</Button>
          </div>
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {availableTools.map((t) => (
              <div
                key={t}
                className="flex items-center justify-between p-2 border border-border rounded-lg bg-card"
              >
                <span className="text-sm font-medium">{t}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-red-500"
                  onClick={() => handleRemoveGlobalTool(t)}
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
