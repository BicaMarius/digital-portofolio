import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  getSkillTree, 
  getTrashedSkillTree, 
  createSkillNode, 
  updateSkillNode, 
  softDeleteSkillNode, 
  restoreSkillNode, 
  deleteSkillNode 
} from '@/lib/api';
import type { SkillTreeNode } from '@shared/schema';
import { 
  ZoomIn, ZoomOut, Maximize, Minimize2, Plus, Leaf, Download, Edit2, 
  Trash2, X, ExternalLink, ChevronLeft, ChevronRight, RotateCcw 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface SkillTreeProps {
  isAdmin: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  root: '#8b5cf6',
  it: '#6366f1',
  arta: '#ec4899',
  cariera: '#10b981',
  sport: '#f59e0b',
  muzica: '#8b5cf6',
  limbi: '#06b6d4',
  invatare: '#84cc16',
};

const SEED_DATA: Omit<SkillTreeNode, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[] = [
  { parentId: null, label: 'Bica Marius', icon: '🌟', description: 'Root node', level: 0, category: 'root', acquiredDate: null, linkUrl: null, nodeOrder: 0, posX: 1000, posY: 60 },
  
  // Branches
  { parentId: 1, label: 'IT & Dev', icon: '🖥️', description: 'Tech skills', level: 0, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 1, posX: 280, posY: 240 },
  { parentId: 1, label: 'Artă & Design', icon: '🎨', description: 'Creative skills', level: 0, category: 'arta', acquiredDate: null, linkUrl: null, nodeOrder: 2, posX: 680, posY: 240 },
  { parentId: 1, label: 'Carieră', icon: '💼', description: 'Career achievements', level: 0, category: 'cariera', acquiredDate: null, linkUrl: null, nodeOrder: 3, posX: 1040, posY: 240 },
  { parentId: 1, label: 'Sport & Fitness', icon: '🏋️', description: 'Physical activities', level: 0, category: 'sport', acquiredDate: null, linkUrl: null, nodeOrder: 4, posX: 1380, posY: 240 },
  { parentId: 1, label: 'Muzică', icon: '🎸', description: 'Musical instruments and theory', level: 0, category: 'muzica', acquiredDate: null, linkUrl: null, nodeOrder: 5, posX: 1720, posY: 240 },

  // IT
  { parentId: 2, label: 'React', icon: '⚛️', description: 'Frontend library', level: 5, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 1, posX: 140, posY: 390 },
  { parentId: 2, label: 'TypeScript', icon: '📘', description: 'Typed JavaScript', level: 4, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 2, posX: 280, posY: 390 },
  { parentId: 2, label: 'PostgreSQL', icon: '🐘', description: 'Relational Database', level: 4, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 3, posX: 420, posY: 390 },
  { parentId: 2, label: 'Python', icon: '🐍', description: 'Scripting and Data', level: 3, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 4, posX: 140, posY: 530 },
  { parentId: 2, label: 'Node.js', icon: '🟩', description: 'Backend runtime', level: 4, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 5, posX: 280, posY: 530 },
  { parentId: 2, label: 'Docker', icon: '🐳', description: 'Containerization', level: 3, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 6, posX: 420, posY: 530 },

  // Arta
  { parentId: 3, label: 'Fotografie', icon: '📷', description: 'DSLR and Editing', level: 5, category: 'arta', acquiredDate: null, linkUrl: null, nodeOrder: 1, posX: 610, posY: 390 },
  { parentId: 3, label: 'Digital Art', icon: '🖌️', description: 'Procreate, Photoshop', level: 4, category: 'arta', acquiredDate: null, linkUrl: null, nodeOrder: 2, posX: 750, posY: 390 },
  { parentId: 3, label: 'UI/UX Design', icon: '🎯', description: 'Figma, User Research', level: 4, category: 'arta', acquiredDate: null, linkUrl: null, nodeOrder: 3, posX: 680, posY: 530 },

  // Cariera
  { parentId: 4, label: 'Certificare AWS', icon: '☁️', description: 'Solutions Architect Associate', level: 3, category: 'cariera', acquiredDate: null, linkUrl: null, nodeOrder: 1, posX: 970, posY: 390 },
  { parentId: 4, label: 'Proiecte Live', icon: '🚀', description: 'Multiple apps in production', level: 4, category: 'cariera', acquiredDate: null, linkUrl: null, nodeOrder: 2, posX: 1110, posY: 390 },

  // Sport
  { parentId: 5, label: 'Fitness', icon: '💪', description: 'Weight lifting', level: 3, category: 'sport', acquiredDate: null, linkUrl: null, nodeOrder: 1, posX: 1310, posY: 390 },
  { parentId: 5, label: 'Ciclism', icon: '🚴', description: 'Road cycling', level: 4, category: 'sport', acquiredDate: null, linkUrl: null, nodeOrder: 2, posX: 1450, posY: 390 },

  // Muzica
  { parentId: 6, label: 'Chitară', icon: '🎸', description: 'Acoustic and Electric', level: 3, category: 'muzica', acquiredDate: null, linkUrl: null, nodeOrder: 1, posX: 1650, posY: 390 },
  { parentId: 6, label: 'Compoziție', icon: '🎵', description: 'Music theory and writing', level: 3, category: 'muzica', acquiredDate: null, linkUrl: null, nodeOrder: 2, posX: 1790, posY: 390 },
];

const SkillNodeCircle = ({ node, color, isAdmin, onEdit, onDelete, onAddChild, editMode, isActionActive, onClick, onDragStart }: any) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div 
      className="relative node-element flex flex-col items-center" 
      style={{ width: 80, height: 86 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={(e) => onDragStart(node.id, e)}
      onClick={(e) => onClick(node, e)}
    >
      {/* Hover tooltip */}
      {hovered && !editMode && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
          style={{ whiteSpace: 'nowrap' }}>
          <div className="bg-[#1a1a2e] border border-white/20 rounded-xl px-3 py-2 shadow-2xl">
            <p className="text-white text-xs font-semibold">{node.label}</p>
            <div className="flex gap-0.5 mt-0.5">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={s <= node.level ? 'text-amber-400 text-[10px]' : 'text-white/10 text-[10px]'}>★</span>
              ))}
            </div>
          </div>
          {/* Arrow */}
          <div className="w-2 h-2 bg-[#1a1a2e] border-r border-b border-white/20 rotate-45 mx-auto -mt-1" />
        </div>
      )}

      {/* Circle node */}
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110 active:scale-95 border-2 ${editMode ? (isActionActive ? 'border-purple-400 scale-110 shadow-[0_0_20px_rgba(168,85,247,0.6)]' : 'cursor-grab active:cursor-grabbing') : 'cursor-pointer'}`}
        style={{
          background: `${color}20`,
          borderColor: (hovered || isActionActive) ? color : `${color}40`,
          boxShadow: (hovered || isActionActive) ? `0 0 20px ${color}50, 0 0 8px ${color}30` : `0 0 8px ${color}20`,
        }}
      >
        {node.icon || '⚡'}
      </div>

      {/* Subtle label below circle */}
      <span className="text-[11px] font-semibold text-slate-300 mt-1 text-center truncate max-w-[80px] leading-tight select-none pointer-events-none drop-shadow-sm">
        {node.label}
      </span>

      {/* Edit mode mini toolbar — stays visible when clicked (isActionActive) or hovered */}
      {editMode && isAdmin && (isActionActive || hovered) && (
        <div 
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 bg-[#161626] border border-purple-500/60 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.6)] z-50 pointer-events-auto animate-in zoom-in-95 duration-150"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(node, e); }} 
            className="w-7 h-7 rounded-lg bg-indigo-500/30 hover:bg-indigo-500 text-white flex items-center justify-center transition-all hover:scale-105"
            title="Editează"
          >
            ✏️
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(node, e); }} 
            className="w-7 h-7 rounded-lg bg-rose-500/30 hover:bg-rose-500 text-white flex items-center justify-center transition-all hover:scale-105"
            title="Șterge"
          >
            🗑️
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddChild(node.id, e); }} 
            className="w-7 h-7 rounded-lg bg-emerald-500/30 hover:bg-emerald-500 text-white flex items-center justify-center transition-all hover:scale-105"
            title="Adaugă sub-abilitate"
          >
            ➕
          </button>
        </div>
      )}
    </div>
  );
};

export const SkillTree: React.FC<SkillTreeProps> = ({ isAdmin }) => {
  const [nodes, setNodes] = useState<SkillTreeNode[]>([]);
  const [trashedNodes, setTrashedNodes] = useState<SkillTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeEditNodeId, setActiveEditNodeId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag node state & movement tracker
  const [draggedNodeId, setDraggedNodeId] = useState<number | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Modal states
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editNodeData, setEditNodeData] = useState<Partial<SkillTreeNode> | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<SkillTreeNode | null>(null);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  useEffect(() => {
    loadNodes();
    loadTrashedNodes();
  }, []);

  // 1. Scroll Isolation with native centered zoom event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      
      setZoom(prevZoom => {
        const newZoom = Math.min(Math.max(0.3, prevZoom * zoomFactor), 2.5);
        if (container && newZoom !== prevZoom) {
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const ratio = newZoom / prevZoom;
          setPan(prevPan => ({
            x: mouseX - (mouseX - prevPan.x) * ratio,
            y: mouseY - (mouseY - prevPan.y) * ratio
          }));
        }
        return newZoom;
      });
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // 2. Global mouse move & mouse up listeners for smooth, glitch-free dragging
  useEffect(() => {
    if (draggedNodeId === null && !isPanning) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      // Check if left mouse button is still held down; if released outside, cancel drag immediately!
      if (e.buttons === 0) {
        handleWindowMouseUp();
        return;
      }

      if (isPanning) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
      } else if (draggedNodeId !== null && isEditMode) {
        const dist = Math.hypot(e.clientX - dragStartPosRef.current.x, e.clientY - dragStartPosRef.current.y);
        if (dist > 4) {
          hasMovedRef.current = true;
        }
        if (hasMovedRef.current) {
          const dx = (e.clientX - lastMousePos.x) / zoom;
          const dy = (e.clientY - lastMousePos.y) / zoom;
          setNodes((prev) =>
            prev.map((n) =>
              n.id === draggedNodeId
                ? { ...n, posX: Math.round(n.posX + dx), posY: Math.round(n.posY + dy) }
                : n
            )
          );
          setLastMousePos({ x: e.clientX, y: e.clientY });
        }
      }
    };

    const handleWindowMouseUp = async () => {
      setIsPanning(false);
      if (draggedNodeId !== null) {
        const currentId = draggedNodeId;
        setDraggedNodeId(null);
        if (hasMovedRef.current && isEditMode) {
          setNodes((currentNodes) => {
            const node = currentNodes.find((n) => n.id === currentId);
            if (node) {
              updateSkillNode(node.id, {
                posX: Math.round(node.posX),
                posY: Math.round(node.posY),
              }).catch((err) => console.error('Failed to update node pos', err));
            }
            return currentNodes;
          });
        }
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [draggedNodeId, isPanning, isEditMode, lastMousePos, zoom]);

  // 3. Sibling navigation & ESC key handler
  const siblings = useMemo(() => {
    if (!selectedNode) return [];
    return nodes.filter(n => n.parentId === selectedNode.parentId);
  }, [nodes, selectedNode]);

  const currentSiblingIndex = useMemo(() => {
    if (!selectedNode) return -1;
    return siblings.findIndex(s => s.id === selectedNode.id);
  }, [siblings, selectedNode]);

  const handleNavigateSibling = (direction: number) => {
    if (siblings.length <= 1 || currentSiblingIndex === -1) return;
    const nextIndex = (currentSiblingIndex + direction + siblings.length) % siblings.length;
    setSelectedNode(siblings[nextIndex]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedNode) {
          setSelectedNode(null);
        } else if (nodeToDelete) {
          setNodeToDelete(null);
        } else if (isTrashOpen) {
          setIsTrashOpen(false);
        } else if (showAddForm) {
          setShowAddForm(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      } else if (selectedNode) {
        if (e.key === 'ArrowLeft') {
          handleNavigateSibling(-1);
        } else if (e.key === 'ArrowRight') {
          handleNavigateSibling(1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, nodeToDelete, isTrashOpen, showAddForm, isFullscreen, siblings, currentSiblingIndex]);

  const handleZoomChange = (delta: number) => {
    setZoom(prevZoom => {
      const newZoom = Math.min(Math.max(0.3, prevZoom + delta), 2.5);
      if (containerRef.current && newZoom !== prevZoom) {
        const rect = containerRef.current.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const ratio = newZoom / prevZoom;
        setPan(prevPan => ({
          x: cx - (cx - prevPan.x) * ratio,
          y: cy - (cy - prevPan.y) * ratio
        }));
      }
      return newZoom;
    });
  };

  const handleResetOrFullscreen = () => {
    const isAtDefault = zoom === 1 && pan.x === 0 && pan.y === 0;
    if (!isAtDefault) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setIsFullscreen(prev => !prev);
    }
  };

  const loadNodes = async () => {
    setLoading(true);
    try {
      const data = await getSkillTree();
      // Ensure root node label is "Bica Marius"
      const updated = data.map(n => {
        if ((n.parentId === null || n.category === 'root') && n.label === 'Marius Bică') {
          updateSkillNode(n.id, { label: 'Bica Marius' }).catch(() => {});
          return { ...n, label: 'Bica Marius' };
        }
        return n;
      });
      setNodes(updated);
    } catch (error) {
      console.error('Failed to load skill tree:', error);
      toast({ title: 'Eroare', description: 'Nu am putut încărca arborele de abilități.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadTrashedNodes = async () => {
    try {
      const trashed = await getTrashedSkillTree();
      setTrashedNodes(trashed);
    } catch (error) {
      console.error('Failed to load trashed skill tree nodes:', error);
    }
  };

  const handleAutoArrange = async () => {
    if (!isAdmin || nodes.length === 0) return;
    try {
      const root = nodes.find(n => n.parentId === null || n.category === 'root');
      const updatedNodes = [...nodes];
      
      if (root) {
        const branches = updatedNodes.filter(n => n.parentId === root.id);
        let currentBranchX = 140; // initial margin
        const branchPositions: { branchId: number; branchCenterX: number; colCount: number }[] = [];

        for (const b of branches) {
          const children = updatedNodes.filter(n => n.parentId === b.id);
          const colCount = children.length <= 4 ? 2 : 3;
          const branchWidth = colCount === 2 ? 320 : 440;
          const branchCenterX = currentBranchX + branchWidth / 2;
          branchPositions.push({ branchId: b.id, branchCenterX, colCount });
          currentBranchX += branchWidth + 80; // 80px gap between branches
        }

        const totalWidth = currentBranchX - 80 - 140;
        const treeCenterX = 140 + totalWidth / 2;
        root.posX = Math.round(treeCenterX - 40);
        root.posY = 80;

        branchPositions.forEach(({ branchId, branchCenterX, colCount }) => {
          const b = updatedNodes.find(n => n.id === branchId);
          if (!b) return;
          b.posX = Math.round(branchCenterX - 50);
          b.posY = 240;

          const children = updatedNodes.filter(n => n.parentId === branchId);
          const colSpacing = 140; // ample space between columns to prevent overlaps
          const startColX = branchCenterX - ((colCount - 1) * colSpacing) / 2;

          children.forEach((c, idx) => {
            const row = Math.floor(idx / colCount);
            const col = idx % colCount;
            c.posX = Math.round(startColX + col * colSpacing - 40);
            c.posY = 390 + row * 140;
          });
        });
      }

      setNodes(updatedNodes);
      for (const n of updatedNodes) {
        await updateSkillNode(n.id, { posX: Math.round(n.posX), posY: Math.round(n.posY), label: n.label }).catch(() => {});
      }
      toast({ title: 'Rearanjare automată completată', description: 'Nodurile au fost aranjate proporțional fără suprapuneri.' });
    } catch (err) {
      toast({ title: 'Eroare la rearanjare', variant: 'destructive' });
    }
  };

  const handleSeed = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      let createdNodes: Record<number, number> = {}; 
      
      for (let i = 0; i < SEED_DATA.length; i++) {
        const seedItem = SEED_DATA[i];
        const payload = { ...seedItem };
        if (payload.parentId !== null && createdNodes[payload.parentId]) {
          payload.parentId = createdNodes[payload.parentId];
        }
        const created = await createSkillNode(payload as any);
        createdNodes[i + 1] = created.id;
      }
      await loadNodes();
      toast({ title: 'Skill Tree inițializat', description: 'Datele de bază au fost populate cu succes.' });
    } catch (err) {
      console.error('Seed failed', err);
      toast({ title: 'Eroare la seed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.node-element')) return; 
    
    setActiveEditNodeId(null);
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleNodeClick = (node: SkillTreeNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMovedRef.current) return; 

    if (isEditMode) {
      setActiveEditNodeId(prev => prev === node.id ? null : node.id);
      return; 
    }

    if (node.level === 0 && node.parentId !== null) {
      setSelectedBranch(prev => prev === node.id ? null : node.id);
    } else if (node.level === 0 && node.parentId === null) {
      setSelectedBranch(null);
      setFilterCategory(null);
    } else {
      setSelectedNode(node);
    }
  };

  const handleNodeDragStart = (id: number, e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    setDraggedNodeId(id);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleRequestDelete = (node: SkillTreeNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNodeToDelete(node);
  };

  const confirmSoftDelete = async () => {
    if (!nodeToDelete) return;
    try {
      await softDeleteSkillNode(nodeToDelete.id);
      toast({ title: 'Nod mutat în coșul de reciclare', description: `«${nodeToDelete.label}» a fost mutat în coș.` });
      setNodes(prev => prev.filter(n => n.id !== nodeToDelete.id));
      setNodeToDelete(null);
      setSelectedNode(null);
      setActiveEditNodeId(null);
      loadTrashedNodes();
    } catch (err) {
      toast({ title: 'Eroare la ștergerea nodului', variant: 'destructive' });
    }
  };

  const handleRestoreNode = async (id: number) => {
    try {
      await restoreSkillNode(id);
      toast({ title: 'Nod restaurat cu succes' });
      await loadNodes();
      await loadTrashedNodes();
    } catch (err) {
      toast({ title: 'Eroare la restaurarea nodului', variant: 'destructive' });
    }
  };

  const handlePermanentDelete = async (id: number) => {
    try {
      await deleteSkillNode(id);
      toast({ title: 'Nod șters definitiv' });
      await loadTrashedNodes();
    } catch (err) {
      toast({ title: 'Eroare la ștergerea definitivă', variant: 'destructive' });
    }
  };

  const handleEditNode = (node: SkillTreeNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditNodeData(node);
    setShowAddForm(true);
  };

  const openAddChildForm = (parentId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;
    
    setEditNodeData({ 
      parentId, 
      category: parentNode.category, 
      level: Math.min(5, parentNode.level + 1),
      posX: parentNode.posX, 
      posY: parentNode.posY + 140 
    });
    setShowAddForm(true);
  };

  const openAddNewNode = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (rect.width / 2 - pan.x) / zoom;
    const y = (rect.height / 2 - pan.y) / zoom;
    setEditNodeData({ posX: Math.round(x), posY: Math.round(y), level: 1, category: 'it' });
    setShowAddForm(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editNodeData?.id) {
        const updated = await updateSkillNode(editNodeData.id, editNodeData);
        setNodes(prev => prev.map(n => n.id === updated.id ? updated : n));
        toast({ title: 'Nod actualizat cu succes' });
      } else {
        const created = await createSkillNode(editNodeData as any);
        setNodes(prev => [...prev, created]);
        toast({ title: 'Nod adăugat cu succes' });
      }
      setShowAddForm(false);
      setEditNodeData(null);
      setActiveEditNodeId(null);
    } catch (err) {
      console.error(err);
      toast({ title: 'Eroare la salvarea nodului', variant: 'destructive' });
    }
  };

  const handleExportSVG = () => {
    if (!canvasRef.current) return;
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="2600" height="1800" style="background:#080810">
      <style>
        .node-text { fill: white; font-family: sans-serif; }
        .node-icon { font-size: 24px; }
      </style>
      ${connections.map(c => 
        `<path d="M${c.fromX},${c.fromY} C${c.fromX},${(c.fromY+c.toY)/2} ${c.toX},${(c.fromY+c.toY)/2} ${c.toX},${c.toY}" stroke="${c.color}" stroke-width="2" stroke-opacity="0.4" fill="none" />`
      ).join('')}
      ${visibleNodes.map(n => {
        const isRoot = n.level === 0 && !n.parentId;
        const isBranch = n.level === 0 && n.parentId;
        const color = CATEGORY_COLORS[n.category] || '#ffffff';
        if (isRoot) {
          return `<g transform="translate(${n.posX}, ${n.posY})">
            <circle cx="40" cy="40" r="40" fill="${color}15" stroke="${color}" stroke-width="2"/>
            <text x="40" y="38" text-anchor="middle" class="node-icon">${n.icon || ''}</text>
            <text x="40" y="58" text-anchor="middle" class="node-text" font-size="10" font-weight="bold">${n.label}</text>
          </g>`;
        }
        if (isBranch) {
          return `<g transform="translate(${n.posX}, ${n.posY})">
            <rect width="100" height="30" rx="15" fill="${color}15" stroke="${color}" stroke-width="2"/>
            <text x="50" y="20" text-anchor="middle" class="node-text" font-size="12" font-weight="bold">${n.icon || ''} ${n.label}</text>
          </g>`;
        }
        return `<g transform="translate(${n.posX}, ${n.posY})">
            <circle cx="40" cy="28" r="28" fill="${color}20" stroke="${color}" stroke-width="2"/>
            <text x="40" y="34" text-anchor="middle" class="node-icon" font-size="16">${n.icon || ''}</text>
            <text x="40" y="74" text-anchor="middle" class="node-text" font-size="10">${n.label}</text>
          </g>`;
      }).join('')}
    </svg>`;
    
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skill-tree.svg';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export SVG descărcat' });
  };

  const hasChildren = (id: number) => {
    return nodes.some(n => n.parentId === id);
  };

  const visibleNodes = nodes.filter(n => {
    if (filterCategory && n.category !== filterCategory) {
      return n.parentId === null || n.category === filterCategory;
    }
    if (selectedBranch) {
      if (n.parentId === null) return true;
      if (n.id === selectedBranch) return true;
      let curr = n;
      while (curr.parentId) {
        if (curr.parentId === selectedBranch) return true;
        const parent = nodes.find(p => p.id === curr.parentId);
        if (!parent) break;
        curr = parent;
      }
      return false;
    }
    return true;
  });

  const getCenter = (node: SkillTreeNode) => {
    if (node.level === 0 && !node.parentId) {
      return { x: node.posX + 40, y: node.posY + 40 }; // root 80x80
    } else if (node.level === 0) {
      return { x: node.posX + 50, y: node.posY + 15 }; // branch approx
    } else {
      return { x: node.posX + 40, y: node.posY + 28 }; // skill circle width 80 (centered circle 56), center is 40
    }
  };

  const connections = visibleNodes.map(node => {
    if (!node.parentId) return null;
    const parent = visibleNodes.find(n => n.id === node.parentId);
    if (!parent) return null;
    
    const fromCenter = getCenter(parent);
    const toCenter = getCenter(node);
    
    return {
      fromX: fromCenter.x,
      fromY: fromCenter.y,
      toX: toCenter.x,
      toY: toCenter.y,
      color: CATEGORY_COLORS[node.category] || '#ffffff'
    };
  }).filter(Boolean) as { fromX: number, fromY: number, toX: number, toY: number, color: string }[];

  const categories = Array.from(new Set(nodes.filter(n => n.category !== 'root').map(n => n.category)));

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Intl.DateTimeFormat('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr));
  };

  const isAtDefaultView = zoom === 1 && pan.x === 0 && pan.y === 0;

  return (
    <div className={cn("relative flex flex-col gap-4", isFullscreen && "fixed inset-0 z-[9990] bg-[#080810] p-4 h-screen w-screen overflow-hidden")}>
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111111] border border-white/10 rounded-2xl p-2.5 sm:p-3">
        {/* Category filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <button
            onClick={() => { setFilterCategory(null); setSelectedBranch(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${!filterCategory && !selectedBranch ? 'bg-purple-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            Toate
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setFilterCategory(cat); setSelectedBranch(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              style={filterCategory === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* View Controls & Admin Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-[#09090b] border border-white/10 rounded-xl overflow-hidden">
            <button onClick={() => handleZoomChange(-0.2)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              onClick={handleResetOrFullscreen} 
              className={cn("p-2 transition-colors", isFullscreen ? "text-purple-400 bg-purple-500/10 hover:bg-purple-500/20" : "text-slate-400 hover:text-white hover:bg-white/5")} 
              title={!isAtDefaultView ? 'Resetează vizualizarea (Apasă din nou pt Fullscreen)' : (isFullscreen ? 'Ieși din Fullscreen (ESC)' : 'Ecran complet (Fullscreen)')}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button onClick={() => handleZoomChange(0.2)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          
          <button onClick={handleExportSVG} className="p-2 text-slate-400 hover:text-purple-400 bg-[#09090b] border border-white/10 rounded-xl transition-colors" title="Export SVG">
            <Download className="w-4 h-4" />
          </button>
          
          {isAdmin && (
            <>
              <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>
              {trashedNodes.length > 0 && (
                <button 
                  onClick={() => setIsTrashOpen(true)}
                  className="relative p-2 text-slate-400 hover:text-rose-400 bg-[#09090b] border border-white/10 rounded-xl transition-colors"
                  title="Coș de reciclare (noduri șterse)"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {trashedNodes.length}
                  </span>
                </button>
              )}
              {nodes.length === 0 && (
                <button onClick={handleSeed} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 text-xs sm:text-sm font-medium transition-colors">
                  <Leaf className="w-4 h-4" /> Seed
                </button>
              )}
              <button 
                onClick={() => { setIsEditMode(!isEditMode); setActiveEditNodeId(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  isEditMode ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Edit2 className="w-4 h-4" /> {isEditMode ? 'Ieși din Editare' : 'Editează'}
              </button>
              {isEditMode && (
                <>
                  <button 
                    onClick={openAddNewNode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-xl text-xs sm:text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Adaugă Nod
                  </button>
                  <button 
                    onClick={handleAutoArrange}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-xl text-xs sm:text-sm transition-colors"
                    title="Rearanjează automat nodurile pentru a preveni suprapunerea"
                  >
                    <Maximize className="w-4 h-4" /> Auto-Aranjează
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div 
        ref={containerRef}
        className={`relative bg-[#080810] rounded-[1.25rem] border overflow-hidden select-none touch-none transition-colors duration-300 ${isEditMode ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/5'}`}
        style={{ height: isFullscreen ? 'calc(100vh - 90px)' : '78vh', minHeight: isFullscreen ? 500 : 620 }}
        onMouseDown={handleMouseDown}
      >
        {isEditMode && (
          <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-sm pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            MOD EDITARE
          </div>
        )}

        <div 
          ref={canvasRef}
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
            transformOrigin: '0 0', 
            position: 'absolute',
            width: 2600, 
            height: 1800,
            cursor: isPanning ? 'grabbing' : 'default'
          }}
        >
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <style>{`
                @keyframes dash {
                  to { stroke-dashoffset: 0; }
                }
              `}</style>
            </defs>
            {connections.map((conn, i) => (
              <path
                key={i}
                d={`M${conn.fromX},${conn.fromY} C${conn.fromX},${(conn.fromY+conn.toY)/2} ${conn.toX},${(conn.fromY+conn.toY)/2} ${conn.toX},${conn.toY}`}
                stroke={conn.color}
                strokeWidth={2}
                strokeOpacity={0.3}
                fill="none"
                strokeDasharray="4 4"
                className="animate-[dash_20s_linear_infinite]"
              />
            ))}
          </svg>

          {visibleNodes.map((node, i) => {
            const isRoot = node.level === 0 && !node.parentId;
            const isBranch = node.level === 0 && node.parentId;
            const color = CATEGORY_COLORS[node.category] || '#ffffff';
            const isFiltered = (selectedBranch === node.id || filterCategory === node.category);
            const isActionActive = activeEditNodeId === node.id;

            return (
              <div
                key={node.id}
                className="node-element absolute animate-in fade-in zoom-in duration-500 fill-mode-both"
                style={{
                  left: node.posX,
                  top: node.posY,
                  animationDelay: `${i * 30}ms`,
                  zIndex: draggedNodeId === node.id ? 50 : (isActionActive ? 40 : 10),
                }}
              >
                {isRoot ? (
                  <div className={`w-20 h-20 rounded-full border-2 bg-purple-500/10 flex flex-col items-center justify-center relative group ${isEditMode ? (isActionActive ? 'border-purple-400 scale-105 shadow-[0_0_25px_rgba(168,85,247,0.6)]' : 'cursor-grab active:cursor-grabbing') : 'cursor-pointer'}`}
                       style={{ borderColor: color, boxShadow: `0 0 30px rgba(147,51,234,0.4)` }}
                       onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                       onClick={(e) => handleNodeClick(node, e)}>
                    <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{node.icon}</span>
                    <span className="text-[10px] font-bold text-white mt-0.5 text-center px-1 leading-tight drop-shadow-md">{node.label}</span>
                    
                    {isEditMode && isAdmin && isActionActive && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 bg-[#161626] border border-purple-500/60 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.6)] z-50 pointer-events-auto animate-in zoom-in-95 duration-150"
                           onMouseDown={e => e.stopPropagation()}
                           onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleEditNode(node, e); }} className="w-7 h-7 rounded-lg bg-indigo-500/30 hover:bg-indigo-500 text-white flex items-center justify-center transition-all hover:scale-105" title="Editează"><span className="text-sm">✏️</span></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); openAddChildForm(node.id, e); }} className="w-7 h-7 rounded-lg bg-emerald-500/30 hover:bg-emerald-500 text-white flex items-center justify-center transition-all hover:scale-105" title="Adaugă sub-abilitate"><span className="text-sm">➕</span></button>
                      </div>
                    )}
                  </div>
                ) : isBranch ? (
                  <div className="relative group">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold text-xs transition-all hover:scale-105 ${isFiltered ? 'scale-110 shadow-lg' : ''} ${isEditMode ? (isActionActive ? 'border-purple-400 scale-105' : 'cursor-grab active:cursor-grabbing') : 'cursor-pointer'}`}
                         style={{ 
                           borderColor: color, 
                           boxShadow: isFiltered ? `0 0 25px ${color}60` : `0 0 12px ${color}30`, 
                           background: `${color}15`,
                           color: 'white'
                         }}
                         onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                         onClick={(e) => handleNodeClick(node, e)}>
                      <span className="text-sm">{node.icon}</span>
                      <span>{node.label}</span>
                    </div>

                    {isEditMode && isAdmin && isActionActive && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 bg-[#161626] border border-purple-500/60 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.6)] z-50 pointer-events-auto animate-in zoom-in-95 duration-150"
                           onMouseDown={e => e.stopPropagation()}
                           onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleEditNode(node, e); }} className="w-7 h-7 rounded-lg bg-indigo-500/30 hover:bg-indigo-500 text-white flex items-center justify-center transition-all hover:scale-105" title="Editează"><span className="text-sm">✏️</span></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleRequestDelete(node, e); }} className="w-7 h-7 rounded-lg bg-rose-500/30 hover:bg-rose-500 text-white flex items-center justify-center transition-all hover:scale-105" title="Șterge"><span className="text-sm">🗑️</span></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); openAddChildForm(node.id, e); }} className="w-7 h-7 rounded-lg bg-emerald-500/30 hover:bg-emerald-500 text-white flex items-center justify-center transition-all hover:scale-105" title="Adaugă sub-abilitate"><span className="text-sm">➕</span></button>
                      </div>
                    )}
                  </div>
                ) : (
                  <SkillNodeCircle 
                    node={node} 
                    color={color} 
                    isAdmin={isAdmin}
                    editMode={isEditMode}
                    isActionActive={isActionActive}
                    onEdit={(node: SkillTreeNode, e: React.MouseEvent) => handleEditNode(node, e)}
                    onDelete={(node: SkillTreeNode, e: React.MouseEvent) => handleRequestDelete(node, e)}
                    onAddChild={(id: number, e: React.MouseEvent) => openAddChildForm(id, e)}
                    onClick={handleNodeClick}
                    onDragStart={handleNodeDragStart}
                  />
                )}

                {/* Add-child button at leaves */}
                {isEditMode && isAdmin && !hasChildren(node.id) && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 cursor-pointer z-20"
                    style={{ top: isRoot ? 80 + 12 : (isBranch ? 32 + 12 : 56 + 12) }}
                    onClick={(e) => openAddChildForm(node.id, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-purple-500/60 bg-purple-500/10 flex items-center justify-center hover:border-purple-400 hover:bg-purple-500/20 transition-all">
                      <span className="text-purple-400 text-sm">+</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* NODE DETAIL MODAL WITH SIBLING NAVIGATION */}
      {selectedNode && !isEditMode && (
        <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedNode(null)}>
          <div className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-black/30 rounded-full z-30 transition-colors" title="Închide (ESC)">
              <X className="w-5 h-5" />
            </button>

            {/* Sibling navigation arrows */}
            {siblings.length > 1 && (
              <>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleNavigateSibling(-1); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 border border-white/15 text-white/80 hover:text-white transition-all shadow-xl z-30"
                  title="Abilitatea precedentă (Săgeată Stânga)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleNavigateSibling(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 border border-white/15 text-white/80 hover:text-white transition-all shadow-xl z-30"
                  title="Abilitatea următoare (Săgeată Dreapta)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            
            <div className="h-28 w-full relative" style={{ background: `linear-gradient(135deg, ${CATEGORY_COLORS[selectedNode.category]}40, transparent)` }}>
              {siblings.length > 1 && (
                <div className="absolute top-4 left-4 bg-black/40 border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-300">
                  {currentSiblingIndex + 1} / {siblings.length}
                </div>
              )}
              <div className="absolute -bottom-10 left-6">
                <div className="w-20 h-20 rounded-2xl bg-[#1a1a24] border border-white/10 flex items-center justify-center text-4xl shadow-xl"
                     style={{ boxShadow: `0 10px 30px -10px ${CATEGORY_COLORS[selectedNode.category]}80` }}>
                  {selectedNode.icon}
                </div>
              </div>
            </div>
            
            <div className="px-6 pt-14 pb-6 relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">{selectedNode.label}</h3>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider" 
                      style={{ background: `${CATEGORY_COLORS[selectedNode.category]}20`, color: CATEGORY_COLORS[selectedNode.category] }}>
                  {selectedNode.category}
                </span>
                {selectedNode.level > 0 && (
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-sm ${s <= selectedNode.level ? 'text-amber-400' : 'text-white/10'}`}>★</span>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedNode.description && (
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <p className="text-slate-300 text-sm leading-relaxed">{selectedNode.description}</p>
                </div>
              )}

              {selectedNode.acquiredDate && (
                <div className="mb-4">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Dată dobândirii:</span>
                  <p className="text-sm text-slate-300 mt-1">{formatDate(selectedNode.acquiredDate)}</p>
                </div>
              )}
              
              {selectedNode.linkUrl && (
                <a href={selectedNode.linkUrl} target="_blank" rel="noopener noreferrer" 
                   className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-500/20">
                  <ExternalLink className="w-4 h-4" /> Vezi Proiect / Detalii
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR DELETE */}
      <Dialog open={!!nodeToDelete} onOpenChange={(open) => { if (!open) setNodeToDelete(null); }}>
        <DialogContent className="bg-[#111118] border-white/10 text-slate-200 max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Trash2 className="w-4 h-4 text-rose-400" /> Șterge abilitate
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-2">
              Ești sigur că vrei să muți «{nodeToDelete?.label}» în coșul de reciclare? O vei putea restaura oricând.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" onClick={() => setNodeToDelete(null)} className="text-slate-400 hover:text-white text-xs">
              Anulează
            </Button>
            <Button onClick={confirmSoftDelete} className="bg-rose-600 hover:bg-rose-500 text-white text-xs gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Mută în coș
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TRASH RECYCLE BIN MODAL */}
      <Dialog open={isTrashOpen} onOpenChange={setIsTrashOpen}>
        <DialogContent className="bg-[#111118] border-white/10 text-slate-200 w-[95vw] max-w-md rounded-2xl p-6 max-h-[80vh] flex flex-col">
          <DialogHeader className="border-b border-white/5 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Trash2 className="w-4 h-4 text-purple-400" /> Coș de reciclare ({trashedNodes.length})
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">
              Nodurile din coș pot fi restaurate înapoi în arbore sau șterse definitiv.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1 custom-scrollbar">
            {trashedNodes.length === 0 ? (
              <p className="text-center text-slate-500 text-xs py-8">Coșul de reciclare este gol.</p>
            ) : (
              trashedNodes.map(node => (
                <div key={node.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{node.icon || '⚡'}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{node.label}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{node.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => handleRestoreNode(node.id)} className="h-7 px-2 text-xs text-purple-300 hover:bg-purple-500/20 gap-1">
                      <RotateCcw className="w-3 h-3" /> Restaurează
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handlePermanentDelete(node.id)} className="h-7 w-7 text-rose-400 hover:bg-rose-500/20" title="Șterge definitiv">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <DialogFooter className="border-t border-white/5 pt-3">
            <Button variant="outline" onClick={() => setIsTrashOpen(false)} className="border-white/10 hover:bg-white/5 text-xs">
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD / EDIT FORM MODAL */}
      {showAddForm && isAdmin && editNodeData && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{editNodeData.id ? 'Editează Nod' : 'Adaugă Nod Nou'}</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Etichetă *</label>
                  <input type="text" required value={editNodeData.label || ''} onChange={e => setEditNodeData({...editNodeData, label: e.target.value})}
                         className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-purple-500/50 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Icon (Emoji)</label>
                  <input type="text" value={editNodeData.icon || ''} onChange={e => setEditNodeData({...editNodeData, icon: e.target.value})}
                         className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-purple-500/50 outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Categorie *</label>
                  <select value={editNodeData.category || 'it'} onChange={e => setEditNodeData({...editNodeData, category: e.target.value})}
                          className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-purple-500/50 outline-none appearance-none">
                    {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Nivel (0=Ramură/Root)</label>
                  <input type="number" min="0" max="5" value={editNodeData.level ?? 1} onChange={e => setEditNodeData({...editNodeData, level: parseInt(e.target.value)})}
                          className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-purple-500/50 outline-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Părinte</label>
                <select value={editNodeData.parentId || ''} onChange={e => setEditNodeData({...editNodeData, parentId: e.target.value ? parseInt(e.target.value) : null})}
                        className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-purple-500/50 outline-none appearance-none">
                  <option value="">-- Fără părinte (Root) --</option>
                  {nodes.filter(n => n.id !== editNodeData.id).map(n => (
                    <option key={n.id} value={n.id}>{n.label} ({n.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Descriere</label>
                <textarea value={editNodeData.description || ''} onChange={e => setEditNodeData({...editNodeData, description: e.target.value})} rows={2}
                          className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-purple-500/50 outline-none resize-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Data Dobândirii</label>
                  <input type="date" value={editNodeData.acquiredDate ? new Date(editNodeData.acquiredDate).toISOString().split('T')[0] : ''} 
                         onChange={e => setEditNodeData({...editNodeData, acquiredDate: e.target.value ? new Date(e.target.value).toISOString() : null})}
                         className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-purple-500/50 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Link URL</label>
                  <input type="url" value={editNodeData.linkUrl || ''} onChange={e => setEditNodeData({...editNodeData, linkUrl: e.target.value})}
                         placeholder="https://..."
                         className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-purple-500/50 outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white">Anulează</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
                  Salvează Nod
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
