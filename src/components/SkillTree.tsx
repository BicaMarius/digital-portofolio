import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSkillTree, createSkillNode, updateSkillNode, deleteSkillNode } from '@/lib/api';
import type { SkillTreeNode } from '@shared/schema';
import { ZoomIn, ZoomOut, Maximize, Plus, Leaf, Download, Edit2, Trash2, X, ExternalLink } from 'lucide-react';

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
  { parentId: null, label: 'Bica Marius', icon: '🌟', description: 'Root node', level: 0, category: 'root', acquiredDate: null, linkUrl: null, nodeOrder: 0, posX: 800, posY: 60 },
  
  // Branches
  { parentId: 1, label: 'IT & Dev', icon: '🖥️', description: 'Tech skills', level: 0, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 1, posX: 250, posY: 220 },
  { parentId: 1, label: 'Artă & Design', icon: '🎨', description: 'Creative skills', level: 0, category: 'arta', acquiredDate: null, linkUrl: null, nodeOrder: 2, posX: 600, posY: 220 },
  { parentId: 1, label: 'Carieră', icon: '💼', description: 'Career achievements', level: 0, category: 'cariera', acquiredDate: null, linkUrl: null, nodeOrder: 3, posX: 900, posY: 220 },
  { parentId: 1, label: 'Sport & Fitness', icon: '🏋️', description: 'Physical activities', level: 0, category: 'sport', acquiredDate: null, linkUrl: null, nodeOrder: 4, posX: 1150, posY: 220 },
  { parentId: 1, label: 'Muzică', icon: '🎸', description: 'Musical instruments and theory', level: 0, category: 'muzica', acquiredDate: null, linkUrl: null, nodeOrder: 5, posX: 1400, posY: 220 },

  // IT
  { parentId: 2, label: 'React', icon: '⚛️', description: 'Frontend library', level: 5, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 1, posX: 80, posY: 380 },
  { parentId: 2, label: 'TypeScript', icon: '📘', description: 'Typed JavaScript', level: 4, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 2, posX: 240, posY: 380 },
  { parentId: 2, label: 'PostgreSQL', icon: '🐘', description: 'Relational Database', level: 4, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 3, posX: 400, posY: 380 },
  { parentId: 2, label: 'Python', icon: '🐍', description: 'Scripting and Data', level: 3, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 4, posX: 80, posY: 540 },
  { parentId: 2, label: 'Node.js', icon: '🟩', description: 'Backend runtime', level: 4, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 5, posX: 240, posY: 540 },
  { parentId: 2, label: 'Docker', icon: '🐳', description: 'Containerization', level: 3, category: 'it', acquiredDate: null, linkUrl: null, nodeOrder: 6, posX: 400, posY: 540 },

  // Arta
  { parentId: 3, label: 'Fotografie', icon: '📷', description: 'DSLR and Editing', level: 5, category: 'arta', acquiredDate: null, linkUrl: null, nodeOrder: 1, posX: 540, posY: 380 },
  { parentId: 3, label: 'Digital Art', icon: '🖌️', description: 'Procreate, Photoshop', level: 4, category: 'arta', acquiredDate: null, linkUrl: null, nodeOrder: 2, posX: 680, posY: 380 },
  { parentId: 3, label: 'UI/UX Design', icon: '🎯', description: 'Figma, User Research', level: 4, category: 'arta', acquiredDate: null, linkUrl: null, nodeOrder: 3, posX: 820, posY: 380 },

  // Cariera
  { parentId: 4, label: 'Certificare AWS', icon: '☁️', description: 'Solutions Architect Associate', level: 3, category: 'cariera', acquiredDate: null, linkUrl: null, nodeOrder: 1, posX: 900, posY: 380 },
  { parentId: 4, label: 'Proiecte Live', icon: '🚀', description: 'Multiple apps in production', level: 4, category: 'cariera', acquiredDate: null, linkUrl: null, nodeOrder: 2, posX: 1060, posY: 380 },

  // Sport
  { parentId: 5, label: 'Fitness', icon: '💪', description: 'Weight lifting', level: 3, category: 'sport', acquiredDate: null, linkUrl: null, nodeOrder: 1, posX: 1150, posY: 380 },
  { parentId: 5, label: 'Ciclism', icon: '🚴', description: 'Road cycling', level: 4, category: 'sport', acquiredDate: null, linkUrl: null, nodeOrder: 2, posX: 1300, posY: 380 },

  // Muzica
  { parentId: 6, label: 'Chitară', icon: '🎸', description: 'Acoustic and Electric', level: 3, category: 'muzica', acquiredDate: null, linkUrl: null, nodeOrder: 1, posX: 1400, posY: 380 },
  { parentId: 6, label: 'Compoziție', icon: '🎵', description: 'Music theory and writing', level: 3, category: 'muzica', acquiredDate: null, linkUrl: null, nodeOrder: 2, posX: 1560, posY: 380 },
];

const SkillNodeCircle = ({ node, color, isAdmin, onEdit, onDelete, onAddChild, editMode, isActionActive, onClick, onDragStart }: any) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div 
      className="relative node-element" 
      style={{ width: 56, height: 56 }}
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
            onClick={(e) => { e.stopPropagation(); onDelete(node.id, e); }} 
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
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeEditNodeId, setActiveEditNodeId] = useState<number | null>(null);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag node state
  const [draggedNodeId, setDraggedNodeId] = useState<number | null>(null);

  // Modal states
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editNodeData, setEditNodeData] = useState<Partial<SkillTreeNode> | null>(null);

  useEffect(() => {
    loadNodes();
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
    } finally {
      setLoading(false);
    }
  };

  const handleAutoArrange = async () => {
    if (!isAdmin || nodes.length === 0) return;
    try {
      const root = nodes.find(n => n.parentId === null || n.category === 'root');
      const updatedNodes = [...nodes];
      
      if (root) {
        root.posX = 800;
        root.posY = 60;
        
        const branches = updatedNodes.filter(n => n.parentId === root.id);
        const branchSpacing = 280;
        const startX = 800 - Math.max(0, ((branches.length - 1) * branchSpacing) / 2);

        branches.forEach((b, bIdx) => {
          b.posX = startX + bIdx * branchSpacing;
          b.posY = 220;

          const children = updatedNodes.filter(n => n.parentId === b.id);
          children.forEach((c, cIdx) => {
            const row = Math.floor(cIdx / 3);
            const col = cIdx % 3;
            c.posX = b.posX - 80 + col * 120;
            c.posY = 380 + row * 140;
          });
        });
      }

      setNodes(updatedNodes);

      for (const n of updatedNodes) {
        await updateSkillNode(n.id, { posX: Math.round(n.posX), posY: Math.round(n.posY), label: n.label }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error('Seed failed', err);
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (draggedNodeId !== null && isEditMode) {
      const dx = (e.clientX - lastMousePos.x) / zoom;
      const dy = (e.clientY - lastMousePos.y) / zoom;
      
      setNodes(prev => prev.map(n => 
        n.id === draggedNodeId 
          ? { ...n, posX: n.posX + dx, posY: n.posY + dy }
          : n
      ));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = async () => {
    setIsPanning(false);
    
    if (draggedNodeId !== null && isEditMode) {
      const node = nodes.find(n => n.id === draggedNodeId);
      if (node) {
        try {
          await updateSkillNode(node.id, { posX: Math.round(node.posX), posY: Math.round(node.posY) });
        } catch (e) {
          console.error('Failed to update node pos', e);
        }
      }
      setDraggedNodeId(null);
    }
  };

  const handleNodeClick = (node: SkillTreeNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (draggedNodeId !== null) return; 

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
    setDraggedNodeId(id);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleDeleteNode = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Ești sigur că vrei să ștergi acest nod?')) return;
    try {
      await deleteSkillNode(id);
      setSelectedNode(null);
      setActiveEditNodeId(null);
      setNodes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
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
      posY: parentNode.posY + 100 
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
      } else {
        const created = await createSkillNode(editNodeData as any);
        setNodes(prev => [...prev, created]);
      }
      setShowAddForm(false);
      setEditNodeData(null);
      setActiveEditNodeId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportSVG = () => {
    if (!canvasRef.current) return;
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1200" style="background:#080810">
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
            <circle cx="28" cy="28" r="28" fill="${color}20" stroke="${color}" stroke-width="2"/>
            <text x="28" y="34" text-anchor="middle" class="node-icon" font-size="16">${n.icon || ''}</text>
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
      return { x: node.posX + 28, y: node.posY + 28 }; // skill circle 56x56
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

  return (
    <div className="relative flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111111] border border-white/10 rounded-2xl p-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
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

        <div className="flex items-center gap-2">
          <div className="flex bg-[#09090b] border border-white/10 rounded-lg overflow-hidden">
            <button onClick={() => handleZoomChange(-0.2)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="p-2 text-slate-400 hover:text-white hover:bg-white/5" title="Reset View">
              <Maximize className="w-4 h-4" />
            </button>
            <button onClick={() => handleZoomChange(0.2)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          
          <button onClick={handleExportSVG} className="p-2 text-slate-400 hover:text-purple-400 bg-[#09090b] border border-white/10 rounded-lg" title="Export SVG">
            <Download className="w-4 h-4" />
          </button>
          
          {isAdmin && (
            <>
              <div className="w-px h-6 bg-white/10 mx-1"></div>
              {nodes.length === 0 && (
                <button onClick={handleSeed} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 text-sm font-medium transition-colors">
                  <Leaf className="w-4 h-4" /> Seed
                </button>
              )}
              <button 
                onClick={() => { setIsEditMode(!isEditMode); setActiveEditNodeId(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isEditMode ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Edit2 className="w-4 h-4" /> {isEditMode ? 'Ieși din Mod Editare' : 'Editează'}
              </button>
              {isEditMode && (
                <>
                  <button 
                    onClick={openAddNewNode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-lg text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Adaugă Nod
                  </button>
                  <button 
                    onClick={handleAutoArrange}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-sm transition-colors"
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

      <div 
        ref={containerRef}
        className={`relative bg-[#080810] rounded-[1.25rem] border overflow-hidden select-none touch-none transition-colors duration-300 ${isEditMode ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/5'}`}
        style={{ height: '70vh', minHeight: 500 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
            width: 2400, 
            height: 1600,
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
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id, e); }} className="w-7 h-7 rounded-lg bg-rose-500/30 hover:bg-rose-500 text-white flex items-center justify-center transition-all hover:scale-105" title="Șterge"><span className="text-sm">🗑️</span></button>
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
                    onDelete={(id: number, e: React.MouseEvent) => handleDeleteNode(id, e)}
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

      {selectedNode && !isEditMode && (
        <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedNode(null)}>
          <div className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-black/20 rounded-full z-20">
              <X className="w-5 h-5" />
            </button>
            
            <div className="h-28 w-full relative" style={{ background: `linear-gradient(135deg, ${CATEGORY_COLORS[selectedNode.category]}40, transparent)` }}>
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
