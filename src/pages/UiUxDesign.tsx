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
  Figma,
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
  Smartphone,
  Tablet,
  Grid3x3,
  List,
  Users,
  Target,
  Layers,
  Zap,
  CheckCircle2,
  ImagePlus,
  BarChart3,
  Star,
  Lightbulb,
  Check,
  Settings2,
  Lock,
  Unlock,
  ChevronDown,
  Sparkles,
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

// ─── Constants ───────────────────────────────────────────────────────────────

const PROCESS_PHASES = [
  "Discovery & Research",
  "Info Architecture",
  "Wireframing & Flows",
  "UI & Visual Design",
  "Interactive Prototyping",
  "Usability Testing",
];

const INITIAL_TOOLS = [
  "Figma",
  "Adobe XD",
  "Miro",
  "Notion",
  "ProtoPie",
  "Spline",
];

const PROJECT_TYPES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  "mobile-app": {
    label: "Mobile App",
    color: "text-amber-400",
    bg: "bg-amber-400/15 border-amber-400/30",
  },
  "web-app": {
    label: "Web App",
    color: "text-blue-400",
    bg: "bg-blue-400/15 border-blue-400/30",
  },
  dashboard: {
    label: "Dashboard B2B",
    color: "text-violet-400",
    bg: "bg-violet-400/15 border-violet-400/30",
  },
  "landing-page": {
    label: "Landing Page",
    color: "text-emerald-400",
    bg: "bg-emerald-400/15 border-emerald-400/30",
  },
  "design-system": {
    label: "Design System",
    color: "text-cyan-400",
    bg: "bg-cyan-400/15 border-cyan-400/30",
  },
};

const STATUSES: Record<string, { label: string; color: string }> = {
  concept: {
    label: "Concept / Redesign",
    color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  },
  prototype: {
    label: "Prototip Interactiv",
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  implemented: {
    label: "Produs Lansat (Live)",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
};

const PLATFORMS: Record<string, { label: string; icon: React.ReactNode }> = {
  ios: { label: "iOS", icon: <Smartphone className="h-3.5 w-3.5" /> },
  android: { label: "Android", icon: <Smartphone className="h-3.5 w-3.5" /> },
  web: { label: "Web", icon: <Monitor className="h-3.5 w-3.5" /> },
  desktop: { label: "Desktop", icon: <Monitor className="h-3.5 w-3.5" /> },
  "cross-platform": {
    label: "Cross-platform",
    icon: <Tablet className="h-3.5 w-3.5" />,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMeta(desc: string | null | undefined): ProjectMeta {
  const empty: ProjectMeta = {
    brief: "",
    problem: "",
    solution: "",
    users: "",
    role: "",
    process: [],
    outcomes: "",
  };
  if (!desc) return empty;
  try {
    const p = JSON.parse(desc);
    if (typeof p === "object" && p !== null) return { ...empty, ...p };
  } catch {
    /* legacy text */
  }
  return { ...empty, brief: desc };
}

function encodeMeta(m: ProjectMeta): string {
  return JSON.stringify(m);
}

function getImages(project: UiUxProject): string[] {
  if (project.date?.includes("|"))
    return project.date.split("|").filter(Boolean);
  return [project.image].filter(Boolean);
}

// ─── Sub-component: Project Card ─────────────────────────────────────────────

interface ProjectCardProps {
  project: UiUxProject;
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
  const typeInfo =
    PROJECT_TYPES[project.subcategory || "mobile-app"] ||
    PROJECT_TYPES["mobile-app"];
  const statusInfo =
    STATUSES[(project as any).medium || "concept"] || STATUSES.concept;
  const tools: string[] = (project as any).materials || [];
  const process: string[] = meta.process || [];
  const images = getImages(project);
  const platformInfo =
    PLATFORMS[(project as any).device || "web"] || PLATFORMS.web;
  const isLive = (project as any).medium === "implemented"; // Corecție logica "Live"

  if (viewMode === "list") {
    return (
      <div
        className="group flex gap-4 p-4 rounded-xl border border-border/50 hover:border-art-accent/40 bg-card/50 hover:bg-card/80 transition-all duration-300 cursor-pointer animate-scale-in"
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
                  className={`text-[11px] font-semibold uppercase tracking-widest ${typeInfo.color}`}
                >
                  {typeInfo.label}
                </span>
                <h3 className="font-semibold text-base leading-tight mt-0.5 line-clamp-1">
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
            <p className="text-muted-foreground text-sm line-clamp-1">
              {meta.brief || meta.problem || "Fără descriere"}
            </p>
            {process.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-1 pt-0.5">
                {process.slice(0, 4).map((p) => (
                  <span
                    key={p}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50"
                  >
                    {p}
                  </span>
                ))}
                {process.length > 4 && (
                  <span className="text-[10px] px-2 py-0.5 text-muted-foreground">
                    +{process.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <Badge
              variant="outline"
              className={`text-[10px] h-5 ${statusInfo.color}`}
            >
              {statusInfo.label}
            </Badge>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {platformInfo.icon} {platformInfo.label}
            </span>
            {tools.slice(0, 2).map((t) => (
              <span
                key={t}
                className="text-[11px] text-muted-foreground hidden md:inline"
              >
                {t}
              </span>
            ))}
            {isLive && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 ml-auto font-medium">
                <Zap className="h-3 w-3" /> Live
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative rounded-xl overflow-hidden border border-border/40 hover:border-art-accent/50 bg-card/60 hover:bg-card/90 transition-all duration-300 cursor-pointer animate-scale-in hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 flex flex-col h-full"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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

        {isLive && (
          <div className="absolute top-3 right-3">
            <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[10px] px-2 py-1 rounded-md flex items-center gap-1 shadow-lg font-bold">
              <Zap className="h-3 w-3" /> Live
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-black/60 hover:bg-blue-500/80 text-white rounded-lg backdrop-blur-sm"
              onClick={onEdit}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-black/60 hover:bg-red-500/80 text-white rounded-lg backdrop-blur-sm"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <span
            className={`text-[10px] font-bold uppercase tracking-[0.15em] ${typeInfo.color}`}
          >
            {typeInfo.label}
          </span>
          <h3 className="font-semibold text-base mt-0.5 leading-snug line-clamp-1">
            {project.title}
          </h3>
          <p className="text-muted-foreground text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {meta.brief || meta.problem || "Nicio descriere adăugată."}
          </p>
        </div>

        <div className="space-y-3">
          {process.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {process.slice(0, 3).map((p) => (
                <span
                  key={p}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border/40"
                >
                  {p}
                </span>
              ))}
              {process.length > 3 && (
                <span className="text-[10px] px-2 py-0.5 text-muted-foreground">
                  +{process.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[10px] h-5 ${statusInfo.color}`}
              >
                {statusInfo.label}
              </Badge>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                {platformInfo.icon}{" "}
                <span className="hidden sm:inline">{platformInfo.label}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {tools.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="text-[10px] text-muted-foreground hidden lg:inline border border-border/40 px-1.5 py-0.5 rounded bg-muted/30"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-component: Project Modal (Tabbed, Artistic, Clean) ──────────────────

interface ProjectModalProps {
  project: UiUxProject;
  projects: UiUxProject[];
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
  const typeInfo =
    PROJECT_TYPES[project.subcategory || "mobile-app"] ||
    PROJECT_TYPES["mobile-app"];
  const statusInfo =
    STATUSES[(project as any).medium || "concept"] || STATUSES.concept;
  const tools: string[] = (project as any).materials || [];
  const platformInfo =
    PLATFORMS[(project as any).device || "web"] || PLATFORMS.web;

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
        <div className="relative h-[40vh] lg:h-full lg:w-[55%] xl:w-[60%] flex flex-col bg-muted/20 border-b lg:border-b-0 lg:border-r border-border">
          <div className="relative flex-1 flex items-center justify-center p-2 sm:p-8 overflow-hidden">
            <img
              src={images[imgIdx] || project.image}
              alt={`${project.title} — ecran ${imgIdx + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
            />
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background border border-border flex items-center justify-center text-foreground transition-all shadow-md"
                  onClick={() => {
                    setAutoPlay(false);
                    setImgIdx((i) => (i - 1 + images.length) % images.length);
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background border border-border flex items-center justify-center text-foreground transition-all shadow-md"
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

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 px-4 pb-4 overflow-x-auto custom-scrollbar flex-shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAutoPlay(false);
                    setImgIdx(i);
                  }}
                  className={`h-14 w-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${i === imgIdx ? "border-art-accent opacity-100" : "border-transparent opacity-60 hover:opacity-100"}`}
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
          <div className="z-20 bg-card/50 px-6 py-5 flex items-start justify-between gap-4">
            <div>
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.15em] ${typeInfo.color}`}
              >
                {typeInfo.label}
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
            <TabsList className="mx-6 justify-start border-b border-border/50 rounded-none bg-transparent p-0 h-auto gap-4">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-art-accent data-[state=active]:bg-transparent px-2 py-2"
              >
                Despre Proiect
              </TabsTrigger>
              <TabsTrigger
                value="casestudy"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-art-accent data-[state=active]:bg-transparent px-2 py-2"
              >
                Case Study
              </TabsTrigger>
              <TabsTrigger
                value="process"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-art-accent data-[state=active]:bg-transparent px-2 py-2"
              >
                Proces & Tools
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
                  className={cn("px-3 py-1 bg-background", statusInfo.color)}
                >
                  {statusInfo.label}
                </Badge>
                <Badge
                  variant="outline"
                  className="px-3 py-1 border-border text-muted-foreground gap-1 bg-background"
                >
                  {platformInfo.icon} {platformInfo.label}
                </Badge>
                {(project as any).dimensions && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 border-border text-muted-foreground gap-1 bg-background"
                  >
                    <Monitor className="h-3.5 w-3.5" />{" "}
                    {(project as any).dimensions} ecrane
                  </Badge>
                )}
              </div>

              {meta.brief && (
                <p className="text-lg text-foreground/90 leading-relaxed font-medium">
                  {meta.brief}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                {meta.users && (
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Users className="h-3 w-3" /> Target Users
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {meta.users}
                    </p>
                  </div>
                )}
                {meta.role && (
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Star className="h-3 w-3" /> Rolul Meu
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {meta.role}
                    </p>
                  </div>
                )}
              </div>

              {(project as any).location && (
                <div className="pt-4">
                  <Button
                    className="w-full gap-2 bg-[#1ABCFE] hover:bg-[#1ABCFE]/90 text-black font-bold h-12 rounded-xl transition-transform hover:-translate-y-0.5"
                    onClick={() =>
                      window.open((project as any).location, "_blank")
                    }
                  >
                    <Figma className="h-5 w-5" /> Deschide Prototip Interactiv
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* TAB: Case Study */}
            <TabsContent
              value="casestudy"
              className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 m-0 space-y-8"
            >
              {meta.problem ? (
                <div className="relative pl-4 border-l-2 border-red-500/50">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-red-400" /> Problema &
                    Context
                  </h4>
                  <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {meta.problem}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-sm">
                  Nu a fost definită o problemă.
                </p>
              )}

              {meta.solution && (
                <div className="relative pl-4 border-l-2 border-emerald-500/50">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Lightbulb className="h-4 w-4 text-emerald-400" /> Soluția
                    Propusă
                  </h4>
                  <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {meta.solution}
                  </p>
                </div>
              )}

              {meta.outcomes && (
                <div className="bg-art-accent/5 border border-art-accent/20 rounded-xl p-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-art-accent mb-3 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4" /> Impact & Rezultate
                  </h4>
                  <p className="text-sm leading-relaxed text-foreground font-medium whitespace-pre-wrap">
                    {meta.outcomes}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB: Process & Tools */}
            <TabsContent
              value="process"
              className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 m-0 space-y-8"
            >
              {meta.process && meta.process.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-foreground" /> Etape
                    Parcurse
                  </h4>
                  <div className="relative pl-3">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                    <div className="space-y-4">
                      {meta.process.map((step) => (
                        <div
                          key={step}
                          className="flex items-center gap-4 relative z-10"
                        >
                          <div className="w-6 h-6 rounded-full bg-card border-2 border-art-accent flex items-center justify-center">
                            <Check className="h-3 w-3 text-art-accent" />
                          </div>
                          <span className="font-medium text-sm text-foreground/90">
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tools.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-foreground" /> Instrumente
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {tools.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-3 py-1.5 rounded-md bg-muted border border-border text-foreground font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
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
  solution: "",
  users: "",
  role: "",
  process: [] as string[],
  outcomes: "",
  type: "mobile-app",
  platform: "web",
  status: "concept",
  tools: [] as string[],
  screens: "",
  prototypeUrl: "",
  isPrivate: false,
};

type FormState = typeof EMPTY_FORM;

// ─── Main component ───────────────────────────────────────────────────────────

export default function UiUxDesign() {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();

  const [projects, setProjects] = useState<UiUxProject[]>([]);
  const [trashed, setTrashed] = useState<UiUxProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dialog state
  const [selected, setSelected] = useState<UiUxProject | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [toDelete, setToDelete] = useState<UiUxProject | null>(null);

  // Tools Manager State
  const [availableTools, setAvailableTools] = useState<string[]>(INITIAL_TOOLS);
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
    const savedTools = localStorage.getItem("ui_ux_tools");
    if (savedTools) {
      try {
        setAvailableTools(JSON.parse(savedTools));
      } catch (e) {}
    }
  }, []);

  const saveTools = (newTools: string[]) => {
    setAvailableTools(newTools);
    localStorage.setItem("ui_ux_tools", JSON.stringify(newTools));
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
      const items = await getGalleryItemsByCategory("ui-ux");
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
      const items = await getTrashedGalleryItemsByCategory("ui-ux");
      setTrashed(items as UiUxProject[]);
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

  const populateForm = (p: UiUxProject) => {
    const meta = parseMeta(p.description);
    const tools: string[] = (p as any).materials || [];
    setForm({
      title: p.title,
      brief: meta.brief,
      problem: meta.problem,
      solution: meta.solution,
      users: meta.users,
      role: meta.role,
      process: meta.process || [],
      outcomes: meta.outcomes,
      type: p.subcategory || "mobile-app",
      platform: (p as any).device || "web",
      status: (p as any).medium || "concept",
      tools,
      screens: (p as any).dimensions || "",
      prototypeUrl: (p as any).location || "",
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
    // Logica pentru eliminare File e mai complicată când mixăm poze vechi cu noi,
    // dar pe moment eliminăm din UI preview, iar la editare, backend-ul va primi noile seturi.
    setImageFiles((prev) => {
      // Dacă există fișiere neîncărcate în state, le scoatem
      // Atenție: Dacă sunt imagini deja pe server, imageFiles ar putea fi gol.
      if (prev.length > index) {
        return prev.filter((_, i) => i !== index);
      }
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

  const togglePhase = (phase: string) => {
    setForm((f) => ({
      ...f,
      process: f.process.includes(phase)
        ? f.process.filter((p) => p !== phase)
        : [...f.process, phase],
    }));
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
    category: "ui-ux" as const,
    subcategory: form.type,
    title: form.title,
    image: imageUrl,
    description: encodeMeta({
      brief: form.brief,
      problem: form.problem,
      solution: form.solution,
      users: form.users,
      role: form.role,
      process: form.process,
      outcomes: form.outcomes,
    }),
    device: form.platform,
    materials: form.tools,
    dimensions: form.screens,
    location: form.prototypeUrl,
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
        fd.append("folder", "ui-ux");
        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        urls.push(url);
      }
      await createGalleryItem(buildPayload(urls[0], urls.join("|")) as any);
      toast({ title: "Succes", description: "Proiectul a fost publicat." });
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

      // Construim setul complet de imagini.
      // În cazul editării, luăm imaginile din previews care încă mai sunt valide (cele url de server).
      const existingUrls = imagePreviews.filter((p) => p.startsWith("http"));
      let allUrls = [...existingUrls];

      if (singleFile) {
        // Suprascriere single Cover image logic (opțional)
        const fd = new FormData();
        fd.append("file", singleFile);
        fd.append("folder", "ui-ux");
        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        imageUrl = url;
        allUrls = [url];
      } else if (imageFiles.length > 0) {
        // Upload la cele noi și lipire de cele vechi
        for (const file of imageFiles) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", "ui-ux");
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
      toast({ title: "Succes", description: "Proiectul a fost actualizat." });
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

  const handleRestore = async (p: UiUxProject) => {
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

  const handlePermDelete = async (p: UiUxProject) => {
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
    Object.keys(PROJECT_TYPES).map((k) => [
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
              <Figma className="h-8 w-8 text-art-accent" />
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
                Design UI/UX
              </h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Portofoliu digital de interfețe, wireframes și concepte de
              experiență a utilizatorului.
            </p>
          </div>

          {/* Stats mini-row */}
          {!loading && projects.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {Object.entries(typeCount)
                .filter(([, c]) => c > 0)
                .map(([k, c]) => {
                  const info = PROJECT_TYPES[k];
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
              {/* Search */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="search"
                  placeholder="Caută designuri..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-card border-border"
                />
              </div>

              {/* Filters */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[150px] bg-card border-border">
                  <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Tip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate tipurile</SelectItem>
                  {Object.entries(PROJECT_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px] bg-card border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate statusurile</SelectItem>
                  {Object.entries(STATUSES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions & View Toggle */}
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
                    <Plus className="h-4 w-4" /> Adaugă Design
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="text-center py-20 text-muted-foreground animate-pulse">
              Se încarcă portofoliul...
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-24 bg-card/50 rounded-2xl border border-border/50">
              <Figma className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search || filterType !== "all" || filterStatus !== "all"
                  ? "Niciun proiect nu corespunde filtrelor tale."
                  : "Nu există proiecte UI/UX încă."}
              </p>
              {isAdmin && !search && filterType === "all" && (
                <Button
                  className="mt-6 gap-2"
                  onClick={() => {
                    resetForm();
                    setShowAdd(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Adaugă primul design
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
            className="h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground"
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-border">
            <DialogHeader className="px-6 py-5 bg-card/50">
              <DialogTitle>
                {showEdit ? "Editează Proiect" : "Adaugă Proiect UI/UX"}
              </DialogTitle>
            </DialogHeader>

            <Tabs
              defaultValue="basics"
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="grid w-full grid-cols-4 text-xs mx-6 mt-2 max-w-[calc(100%-3rem)] bg-muted/50">
                <TabsTrigger value="basics">Esențial</TabsTrigger>
                <TabsTrigger value="content">Conținut</TabsTrigger>
                <TabsTrigger value="process">Proces & Tools</TabsTrigger>
                <TabsTrigger value="media">Media & Link</TabsTrigger>
              </TabsList>

              {/* TAB 1: Basics */}
              <TabsContent
                value="basics"
                className="flex-1 px-6 pt-5 space-y-4 m-0"
              >
                <div className="space-y-2">
                  <Label>Titlu proiect *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="ex: EcoTrack App"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scurtă descriere (pentru card)</Label>
                  <Input
                    value={form.brief}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brief: e.target.value }))
                    }
                    placeholder="O frază care rezumă proiectul..."
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tip proiect</Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROJECT_TYPES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Platformă</Label>
                    <Select
                      value={form.platform}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, platform: v }))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PLATFORMS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label>Număr ecrane</Label>
                    <Input
                      value={form.screens}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, screens: e.target.value }))
                      }
                      placeholder="ex: 24+"
                      className="h-9"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: Content (Fără Scroll necesar) */}
              <TabsContent
                value="content"
                className="flex-1 px-6 pt-5 space-y-4 m-0"
              >
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-red-400 uppercase tracking-widest">
                    <Target className="h-3 w-3" /> Problema / Provocarea
                  </Label>
                  <Textarea
                    value={form.problem}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, problem: e.target.value }))
                    }
                    className="resize-none h-[72px] text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                    <Lightbulb className="h-3 w-3" /> Soluția Propusă
                  </Label>
                  <Textarea
                    value={form.solution}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, solution: e.target.value }))
                    }
                    className="resize-none h-[72px] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-widest">
                      <Users className="h-3 w-3" /> Utilizatori țintă
                    </Label>
                    <Input
                      value={form.users}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, users: e.target.value }))
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-widest">
                      <Star className="h-3 w-3" /> Rolul tău
                    </Label>
                    <Input
                      value={form.role}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, role: e.target.value }))
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 uppercase tracking-widest">
                    <BarChart3 className="h-3 w-3" /> Impact & Rezultate
                  </Label>
                  <Textarea
                    value={form.outcomes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, outcomes: e.target.value }))
                    }
                    className="resize-none h-[72px] text-sm"
                  />
                </div>
              </TabsContent>

              {/* TAB 3: Process & Tools */}
              <TabsContent
                value="process"
                className="flex-1 px-6 pt-5 space-y-6 m-0"
              >
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Etape parcurse în proiect
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROCESS_PHASES.map((phase) => {
                      const isActive = form.process.includes(phase);
                      return (
                        <button
                          key={phase}
                          type="button"
                          onClick={() => togglePhase(phase)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-sm transition-all text-left font-medium ${
                            isActive
                              ? "border-purple-500/40 bg-purple-500/10 text-purple-400"
                              : "border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-muted/30"
                          }`}
                        >
                          <CheckCircle2
                            className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-purple-400" : "text-muted-foreground/30"}`}
                          />
                          {phase}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Instrumente (Tools)
                  </Label>

                  {/* Căutare / Adăugare Tool cu Popover (Portal) */}
                  <Popover
                    open={showToolDropdown}
                    onOpenChange={setShowToolDropdown}
                  >
                    <PopoverTrigger asChild>
                      <div
                        className={`flex items-center border rounded-md transition-all px-3 py-1 ${showToolDropdown ? "border-purple-500/50 ring-1 ring-purple-500/20 bg-background" : "border-border bg-muted/20"}`}
                      >
                        <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                        <Input
                          className="border-0 focus-visible:ring-0 shadow-none bg-transparent h-8 px-0 text-sm"
                          placeholder="Caută sau adaugă instrument..."
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
                      className="w-[var(--radix-popover-trigger-width)] p-0 border-border shadow-xl rounded-lg overflow-hidden"
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
                                <Check className="h-3.5 w-3.5 text-purple-400" />
                              )}
                            </button>
                          ))}
                        {toolSearch.trim() &&
                          !availableTools.some(
                            (t) => t.toLowerCase() === toolSearch.toLowerCase(),
                          ) && (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded text-purple-400 font-medium"
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
                              Adaugă noul instrument "{toolSearch.trim()}"
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
                          Instrumente
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Chips pt Tool-uri selectate */}
                  {form.tools.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {form.tools.map((t) => (
                        <span
                          key={t}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-card border border-border font-medium shadow-sm"
                        >
                          {t}
                          <button
                            onClick={() => toggleToolForm(t)}
                            className="hover:text-red-400 ml-1"
                          >
                            <X className="h-3 w-3" />
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
                className="flex-1 px-6 pt-5 space-y-6 m-0"
              >
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Link prototip (Figma / Live)</Label>
                    <Input
                      value={form.prototypeUrl}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, prototypeUrl: e.target.value }))
                      }
                      placeholder="https://..."
                      className="h-10"
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center space-y-1.5 pb-0.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      {form.isPrivate ? "Privat" : "Public"}
                    </Label>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, isPrivate: !f.isPrivate }))
                      }
                      className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-500 border ${
                        form.isPrivate
                          ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                          : "bg-muted border-transparent text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {form.isPrivate ? (
                        <Lock className="w-4 h-4 scale-110 transition-transform duration-300" />
                      ) : (
                        <Unlock className="w-4 h-4 scale-100 transition-transform duration-300" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Imagini proiect (Selectare multiplă)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleImages}
                    className="cursor-pointer"
                  />

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {imagePreviews.map((src, i) => (
                        <div
                          key={i}
                          className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted group"
                        >
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {i === 0 ? "Cover" : i + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePreviewImage(i)}
                            className="absolute top-1.5 right-1.5 bg-red-500/90 hover:bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
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

            <div className="px-6 py-4 flex justify-end gap-3 bg-card/50">
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
                className="gap-2 min-w-[120px]"
              >
                {uploading
                  ? "Se procesează..."
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
              Designurile șterse pot fi restaurate sau eliminate definitiv.
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
                    {PROJECT_TYPES[p.subcategory || ""]?.label || p.subcategory}
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
        <DialogContent className="max-w-sm border-border">
          <DialogHeader>
            <DialogTitle>Gestionează Instrumente</DialogTitle>
            <DialogDescription>
              Aceste instrumente vor apărea în opțiunile proiectelor.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Input
              value={newToolInput}
              onChange={(e) => setNewToolInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddGlobalTool())
              }
              placeholder="Adaugă tool nou..."
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
