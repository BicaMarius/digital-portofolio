import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { 
  ChefHat, Plus, ShoppingCart, Heart, Search, Trash2, RotateCcw, Pencil, 
  Loader2, Minus, X, UtensilsCrossed, Scale, Flame, Activity, 
  Clock, Info, ChevronRight, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNotes, createNote, updateNote, softDeleteNote, restoreNote, deleteNote, getTrashedNotes } from '@/lib/api';
import type { NoteItem } from '@shared/schema';

// --- DATA MODELS ---

export interface RecipeContent {
  imageUrl?: string;
  prepTime: number;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  ingredients: Array<{ name: string; qty: number; unit: string }>;
  steps: string[];
  servingUnit: 'portii' | 'tava' | 'bucati' | 'gramaje';
  baseServings: number;
  nutrition: {
    perServing: {
      kcal: number; carbs: number; protein: number; fat: number;
      fiber?: number; sugar?: number; sodium?: number;
      vitaminC?: number; calcium?: number; iron?: number; omega3?: number; zinc?: number;
    }
  };
  tags?: string[];
  healthScore?: number;
}

interface ParsedRecipe extends Omit<NoteItem, 'content'> {
  contentData: RecipeContent;
}

// --- MOCK DATA ---

const MOCK_RECIPES: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[] = [
  {
    title: 'Lasagna Clasică',
    type: 'recipe',
    isPrivate: false,
    categoryId: null,
    content: JSON.stringify({
      imageUrl: '',
      prepTime: 45,
      cookTime: 60,
      difficulty: 'medium',
      cuisine: 'Italian',
      baseServings: 6,
      servingUnit: 'portii',
      ingredients: [
        { name: 'paste lasagna', qty: 18, unit: 'foi' },
        { name: 'carne tocata', qty: 500, unit: 'g' },
        { name: 'sos tomate', qty: 400, unit: 'g' },
        { name: 'bechamel', qty: 500, unit: 'ml' },
        { name: 'parmezan', qty: 100, unit: 'g' },
        { name: 'mozzarella', qty: 200, unit: 'g' },
        { name: 'ceapa', qty: 1, unit: 'buc' },
        { name: 'usturoi', qty: 3, unit: 'catei' },
        { name: 'ulei masline', qty: 2, unit: 'linguri' },
        { name: 'sare/piper', qty: 1, unit: 'dupa gust' }
      ],
      steps: [
        'Se caleste ceapa si usturoiul in ulei de masline.',
        'Se adauga carnea tocata si se gateste pana se rumeneste.',
        'Se toarna sosul de tomate si se lasa la fiert la foc mic 30 minute.',
        'Intr-o tava, se asaza un strat de bechamel, apoi foi de lasagna, sos de carne, bechamel si branza.',
        'Se repeta pana se termina ingredientele, terminand cu bechamel si mult parmezan.',
        'Se coace la 180°C timp de 45 de minute pana se rumeneste frumos.'
      ],
      nutrition: {
        perServing: { kcal: 520, carbs: 48, protein: 32, fat: 18, fiber: 3 }
      },
      healthScore: 62,
      tags: ['carne', 'comfort food', 'italian']
    } as RecipeContent)
  },
  {
    title: 'Pizza Margherita',
    type: 'recipe',
    isPrivate: false,
    categoryId: null,
    content: JSON.stringify({
      imageUrl: '',
      prepTime: 30,
      cookTime: 15,
      difficulty: 'easy',
      cuisine: 'Italian',
      baseServings: 4,
      servingUnit: 'portii',
      ingredients: [
        { name: 'aluat pizza', qty: 500, unit: 'g' },
        { name: 'sos tomate', qty: 200, unit: 'ml' },
        { name: 'mozzarella', qty: 300, unit: 'g' },
        { name: 'busuioc proaspat', qty: 10, unit: 'frunze' },
        { name: 'ulei masline', qty: 2, unit: 'linguri' }
      ],
      steps: [
        'Se intinde aluatul de pizza pe o tava.',
        'Se unge blatul cu sos de tomate.',
        'Se adauga felii de mozzarella din belsug.',
        'Se coace la cea mai inalta temperatura a cuptorului timp de 10-15 minute.',
        'La final se adauga frunzele de busuioc proaspat si ulei de masline.'
      ],
      nutrition: {
        perServing: { kcal: 380, carbs: 52, protein: 18, fat: 12, fiber: 2 }
      },
      healthScore: 58,
      tags: ['vegetarian', 'fast']
    } as RecipeContent)
  },
  {
    title: 'Salată Grecească',
    type: 'recipe',
    isPrivate: false,
    categoryId: null,
    content: JSON.stringify({
      imageUrl: '',
      prepTime: 15,
      cookTime: 0,
      difficulty: 'easy',
      cuisine: 'Mediterranean',
      baseServings: 2,
      servingUnit: 'portii',
      ingredients: [
        { name: 'rosii cherry', qty: 200, unit: 'g' },
        { name: 'castravete', qty: 1, unit: 'buc' },
        { name: 'masline kalamata', qty: 80, unit: 'g' },
        { name: 'branza feta', qty: 150, unit: 'g' },
        { name: 'ceapa rosie', qty: 0.5, unit: 'buc' },
        { name: 'ulei masline', qty: 3, unit: 'linguri' },
        { name: 'oregano', qty: 1, unit: 'lingurita' }
      ],
      steps: [
        'Se taie rosiile pe jumatate si castravetele cubulete.',
        'Se taie ceapa rosie julienne si feta in cuburi.',
        'Se amesteca toate legumele si maslinele intr-un bol mare.',
        'Se adauga uleiul de masline, oregano, sarea si piperul.',
        'Se amesteca usor pentru a nu sfarama branza feta.'
      ],
      nutrition: {
        perServing: { kcal: 280, carbs: 12, protein: 10, fat: 22, fiber: 4, vitaminC: 35, calcium: 280 }
      },
      healthScore: 85,
      tags: ['vegetarian', 'healthy', 'raw']
    } as RecipeContent)
  },
  {
    title: 'Smoothie Energizant',
    type: 'recipe',
    isPrivate: false,
    categoryId: null,
    content: JSON.stringify({
      imageUrl: '',
      prepTime: 5,
      cookTime: 0,
      difficulty: 'easy',
      cuisine: 'Healthy',
      baseServings: 1,
      servingUnit: 'portii',
      ingredients: [
        { name: 'banana', qty: 1, unit: 'buc' },
        { name: 'capsune', qty: 150, unit: 'g' },
        { name: 'lapte migdale', qty: 200, unit: 'ml' },
        { name: 'seminte chia', qty: 1, unit: 'lingura' },
        { name: 'miere', qty: 1, unit: 'lingurita' },
        { name: 'fulgi ovaz', qty: 2, unit: 'linguri' }
      ],
      steps: [
        'Se curata banana si se spala capsunele.',
        'Se pun toate ingredientele intr-un blender.',
        'Se mixeaza timp de 1-2 minute pana la omogenizare.',
        'Se serveste imediat.'
      ],
      nutrition: {
        perServing: { kcal: 320, carbs: 58, protein: 8, fat: 6, fiber: 7, vitaminC: 65, calcium: 180, omega3: 1.5 }
      },
      healthScore: 90,
      tags: ['vegetarian', 'sweet', 'quick']
    } as RecipeContent)
  },
  {
    title: 'Omletă cu Legume',
    type: 'recipe',
    isPrivate: false,
    categoryId: null,
    content: JSON.stringify({
      imageUrl: '',
      prepTime: 5,
      cookTime: 10,
      difficulty: 'easy',
      cuisine: 'Romanian',
      baseServings: 1,
      servingUnit: 'portii',
      ingredients: [
        { name: 'oua', qty: 3, unit: 'buc' },
        { name: 'ardei gras', qty: 0.5, unit: 'buc' },
        { name: 'ciuperci', qty: 80, unit: 'g' },
        { name: 'spanac', qty: 30, unit: 'g' },
        { name: 'branza telemea', qty: 50, unit: 'g' },
        { name: 'unt', qty: 10, unit: 'g' },
        { name: 'sare/piper', qty: 1, unit: 'dupa gust' }
      ],
      steps: [
        'Se bat ouale intr-un bol impreuna cu sare si piper.',
        'Se toaca ardeiul si ciupercile si se calesc usor in unt.',
        'Se adauga spanacul si se mai gateste un minut.',
        'Se toarna ouale batute si se presara telemeaua sfaramata.',
        'Se gateste la foc mic pana se incheaga frumos.'
      ],
      nutrition: {
        perServing: { kcal: 340, carbs: 8, protein: 28, fat: 22, fiber: 2, vitaminC: 45, iron: 3.5 }
      },
      healthScore: 82,
      tags: ['vegetarian', 'protein', 'breakfast']
    } as RecipeContent)
  }
];


// --- UTILS ---

const safeParseJSON = (str: string, fallback: any = {}) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

const getDifficultyColor = (diff: string) => {
  switch (diff) {
    case 'easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }
};

const HealthRing = ({ score, size = 48 }: { score: number, size?: number }) => {
  const radius = (size - 6) / 2;
  const circum = 2 * Math.PI * radius;
  const strokeDashoffset = circum - (score / 100) * circum;
  
  let color = 'text-emerald-500';
  if (score < 50) color = 'text-red-500';
  else if (score < 75) color = 'text-amber-500';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className="text-white/10"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size/2}
          cy={size/2}
        />
        <circle
          className={color}
          strokeWidth="4"
          strokeDasharray={circum}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size/2}
          cy={size/2}
        />
      </svg>
      <span className="absolute text-[10px] font-bold">{score}</span>
    </div>
  );
};


// --- MAIN COMPONENT ---

export default function Cooking() {
  const { isAdmin } = useAdmin();
  const [recipes, setRecipes] = useState<ParsedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Shopping List state: array of { recipeId, scaleFactor, portions }
  const [shoppingList, setShoppingList] = useState<Array<{ id: number, scaleFactor: number, portions: number, recipeTitle: string, items: any[] }>>([]);

  const [selectedRecipe, setSelectedRecipe] = useState<ParsedRecipe | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<ParsedRecipe | null>(null);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const data = await getNotes();
      const recipeNotes = data.filter(n => n.type === 'recipe' && !n.deletedAt);
      
      const parsed: ParsedRecipe[] = recipeNotes.map(n => ({
        ...n,
        contentData: safeParseJSON(n.content, { ingredients: [], steps: [], nutrition: { perServing: {} } })
      }));
      setRecipes(parsed);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch recipes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleCreateMockData = async () => {
    try {
      setLoading(true);
      for (const r of MOCK_RECIPES) {
        await createNote({
          title: r.title,
          content: r.content,
          type: 'recipe',
          isPrivate: false,
          categoryId: null
        });
      }
      toast({ title: 'Success', description: 'Mock recipes added' });
      fetchRecipes();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add mock recipes', variant: 'destructive' });
    }
  };

  const deleteRecipe = async (id: number) => {
    if (!isAdmin) return;
    if (!confirm('Ești sigur că vrei să ștergi această rețetă?')) return;
    try {
      await softDeleteNote(id);
      toast({ title: 'Success', description: 'Rețetă ștearsă' });
      fetchRecipes();
      setShoppingList(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      toast({ title: 'Error', description: 'Eroare la ștergere', variant: 'destructive' });
    }
  };

  const handleAddToShoppingList = (recipe: ParsedRecipe) => {
    const existing = shoppingList.find(i => i.id === recipe.id);
    if (existing) {
      toast({ title: 'Info', description: 'Rețeta este deja în listă' });
      return;
    }
    setShoppingList(prev => [...prev, { 
      id: recipe.id, 
      scaleFactor: 1, 
      portions: recipe.contentData.baseServings || 1,
      recipeTitle: recipe.title,
      items: recipe.contentData.ingredients || []
    }]);
    toast({ title: 'Adăugat', description: `${recipe.title} adăugat la listă` });
  };

  const removeFromShoppingList = (id: number) => {
    setShoppingList(prev => prev.filter(i => i.id !== id));
  };

  const openRecipeDetail = (r: ParsedRecipe) => {
    setSelectedRecipe(r);
    setIsDetailModalOpen(true);
  };

  const openEditModal = (r?: ParsedRecipe) => {
    if (r) {
      setEditingRecipe(r);
    } else {
      // Default empty
      setEditingRecipe({
        id: 0,
        title: '',
        type: 'recipe',
        content: '',
        isPrivate: false,
        categoryId: null,
        createdAt: null,
        updatedAt: null,
        deletedAt: null,
        contentData: {
          prepTime: 0, cookTime: 0, difficulty: 'medium', cuisine: '',
          servingUnit: 'portii', baseServings: 1,
          ingredients: [], steps: [], tags: [], healthScore: 50,
          nutrition: { perServing: { kcal: 0, carbs: 0, protein: 0, fat: 0 } }
        }
      });
    }
    setIsEditModalOpen(true);
  };

  // Stats
  const avgHealthScore = useMemo(() => {
    if (recipes.length === 0) return 0;
    const total = recipes.reduce((acc, r) => acc + (r.contentData.healthScore || 0), 0);
    return Math.round(total / recipes.length);
  }, [recipes]);

  const aggregatedShoppingList = useMemo(() => {
    const map = new Map<string, { qty: number, unit: string }>();
    shoppingList.forEach(item => {
      item.items.forEach(ing => {
        const key = `${ing.name.toLowerCase()}_${ing.unit.toLowerCase()}`;
        const existing = map.get(key);
        const scaledQty = ing.qty * item.scaleFactor;
        if (existing) {
          existing.qty += scaledQty;
        } else {
          map.set(key, { qty: scaledQty, unit: ing.unit });
        }
      });
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      name: k.split('_')[0],
      qty: v.qty,
      unit: v.unit
    }));
  }, [shoppingList]);

  return (
    <PageLayout>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-10">
        
        {/* HERO SECTION */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
              Alimentație & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Gătit</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Gestionează rețete, planifică mesele și generează liste de cumpărături pentru o viață mai sănătoasă.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 xl:w-auto">
            <div className="bg-[#12121a] border border-white/5 rounded-[1.25rem] p-5 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3 text-slate-400 mb-2">
                <ChefHat size={18} className="text-purple-400" />
                <span className="text-sm font-medium">Rețete</span>
              </div>
              <div className="text-3xl font-bold text-white">{recipes.length}</div>
            </div>
            
            <div className="bg-[#12121a] border border-white/5 rounded-[1.25rem] p-5 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3 text-slate-400 mb-2">
                <Activity size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Sănătate</span>
              </div>
              <div className="text-3xl font-bold text-white">{avgHealthScore}%</div>
            </div>

            <div className="bg-[#12121a] border border-white/5 rounded-[1.25rem] p-5 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3 text-slate-400 mb-2">
                <ShoppingCart size={18} className="text-indigo-400" />
                <span className="text-sm font-medium">Liste</span>
              </div>
              <div className="text-3xl font-bold text-white">{shoppingList.length}</div>
            </div>

            <div className="bg-[#12121a] border border-white/5 rounded-[1.25rem] p-5 hover:border-purple-500/30 transition-all flex flex-col justify-center items-center">
               {isAdmin && (
                  <Button 
                    onClick={() => openEditModal()} 
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-900/20"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Rețetă
                  </Button>
               )}
            </div>
          </div>
        </div>

        {isAdmin && recipes.length === 0 && !loading && (
          <div className="mb-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
            <span className="text-slate-300">Nu ai rețete adăugate încă. Vrei să adaugi date de test?</span>
            <Button variant="outline" onClick={handleCreateMockData}>Adaugă Mock Data</Button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT: RECIPE GRID */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
            ) : recipes.map(recipe => {
              const d = recipe.contentData;
              const inList = shoppingList.some(i => i.id === recipe.id);
              return (
                <div key={recipe.id} className="group bg-[#12121a] border border-white/5 rounded-[1.25rem] overflow-hidden hover:border-purple-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer" onClick={() => openRecipeDetail(recipe)}>
                  <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                    {d.imageUrl ? (
                      <img src={d.imageUrl} alt={recipe.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 text-white/50">
                        <UtensilsCrossed size={48} className="mb-2" />
                        <span className="text-xl font-bold uppercase tracking-wider">{d.cuisine}</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge variant="outline" className={cn("bg-[#111111]/80 backdrop-blur-md font-semibold", getDifficultyColor(d.difficulty))}>
                        {d.difficulty}
                      </Badge>
                      <Badge variant="outline" className="bg-[#111111]/80 backdrop-blur-md text-white border-white/10 font-semibold">
                        {d.cuisine}
                      </Badge>
                    </div>
                    {d.healthScore && (
                       <div className="absolute top-4 right-4 bg-[#111111]/80 backdrop-blur-md rounded-full p-1">
                          <HealthRing score={d.healthScore} size={36} />
                       </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{recipe.title}</h3>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{d.prepTime + d.cookTime} min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Scale size={14} />
                        <span>{d.baseServings} {d.servingUnit}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flame size={14} />
                        <span>{d.nutrition.perServing.kcal} kcal</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                      {d.tags?.slice(0,3).map(tag => (
                        <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-white/5 px-2 py-1 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                      <div className="flex gap-2">
                        {isAdmin && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={(e) => { e.stopPropagation(); openEditModal(recipe); }}>
                              <Pencil size={14} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={(e) => { e.stopPropagation(); deleteRecipe(recipe.id); }}>
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant={inList ? "secondary" : "default"}
                        className={cn("rounded-lg text-xs", !inList && "bg-purple-600 hover:bg-purple-500 text-white")}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (inList) removeFromShoppingList(recipe.id);
                          else handleAddToShoppingList(recipe);
                        }}
                      >
                        {inList ? <Check size={14} className="mr-1" /> : <Plus size={14} className="mr-1" />}
                        {inList ? 'În Listă' : 'Listă'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: SHOPPING LIST */}
          <div className="w-full lg:w-[350px] shrink-0 sticky top-28">
            <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ShoppingCart size={18} className="text-purple-400" />
                  Lista de Cumpărături
                </h3>
                {shoppingList.length > 0 && (
                   <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                     {shoppingList.length} rețete
                   </Badge>
                )}
              </div>

              {shoppingList.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <ShoppingCart size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nu ai nicio rețetă în listă.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Recipes */}
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {shoppingList.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm bg-white/5 p-2 rounded-lg">
                        <span className="text-slate-300 truncate pr-2">{item.recipeTitle}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            className="p-1 hover:text-white text-slate-400 bg-black/20 rounded"
                            onClick={() => {
                              const existing = [...shoppingList];
                              const i = existing.find(x => x.id === item.id);
                              if (i && i.scaleFactor > 0.5) {
                                i.scaleFactor -= 0.5;
                                i.portions = Math.max(1, i.portions / 2);
                                setShoppingList(existing);
                              }
                            }}
                          ><Minus size={12} /></button>
                          <span className="w-4 text-center font-mono text-xs">{item.scaleFactor}x</span>
                          <button 
                            className="p-1 hover:text-white text-slate-400 bg-black/20 rounded"
                            onClick={() => {
                              const existing = [...shoppingList];
                              const i = existing.find(x => x.id === item.id);
                              if (i) {
                                i.scaleFactor += 0.5;
                                i.portions *= 1.5;
                                setShoppingList(existing);
                              }
                            }}
                          ><Plus size={12} /></button>
                          <button onClick={() => removeFromShoppingList(item.id)} className="ml-1 text-red-400/70 hover:text-red-400">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-white/10" />

                  {/* Aggregated List */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Total Ingrediente</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {aggregatedShoppingList.map((ing, idx) => (
                        <div key={idx} className="flex justify-between text-sm group">
                          <span className="text-slate-300 capitalize">{ing.name}</span>
                          <span className="text-slate-400 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">
                            {Number(ing.qty.toFixed(2))} {ing.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                     <Button 
                       variant="outline" 
                       className="flex-1 bg-transparent border-white/10 hover:bg-white/5 text-slate-300"
                       onClick={() => {
                          const text = aggregatedShoppingList.map(i => `- ${i.name}: ${Number(i.qty.toFixed(2))} ${i.unit}`).join('\n');
                          navigator.clipboard.writeText(`Lista Cumparaturi:\n${text}`);
                          toast({ title: 'Copiat', description: 'Lista a fost copiată în clipboard' });
                       }}
                     >
                       Exportă
                     </Button>
                     <Button 
                       variant="ghost" 
                       className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3"
                       onClick={() => setShoppingList([])}
                     >
                       <Trash2 size={16} />
                     </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RECIPE DETAIL MODAL */}
      {selectedRecipe && (
        <RecipeDetailModal 
          isOpen={isDetailModalOpen} 
          onClose={() => setIsDetailModalOpen(false)} 
          recipe={selectedRecipe} 
        />
      )}

      {/* EDIT MODAL */}
      {isAdmin && isEditModalOpen && editingRecipe && (
        <RecipeEditModal
           isOpen={isEditModalOpen}
           onClose={() => { setIsEditModalOpen(false); setEditingRecipe(null); }}
           recipe={editingRecipe}
           onSave={fetchRecipes}
        />
      )}

    </PageLayout>
  );
}


// --- RECIPE DETAIL MODAL ---

function RecipeDetailModal({ isOpen, onClose, recipe }: { isOpen: boolean, onClose: () => void, recipe: ParsedRecipe }) {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps' | 'nutrition'>('ingredients');
  const [scale, setScale] = useState(1);
  const d = recipe.contentData;

  const scaledPortions = Math.round(d.baseServings * scale);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#111111] border border-white/10 text-white max-w-4xl p-0 overflow-hidden rounded-3xl h-[85vh] flex flex-col gap-0 shadow-2xl">
        {/* Header Image Area */}
        <div className="relative h-48 md:h-64 shrink-0 bg-gradient-to-br from-purple-900/40 to-indigo-900/40">
           {d.imageUrl ? (
              <img src={d.imageUrl} alt={recipe.title} className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
           ) : (
              <div className="absolute inset-0 pattern-dots opacity-20"></div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent"></div>
           
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors z-10">
             <X size={20} />
           </button>

           <div className="absolute bottom-6 left-6 right-6">
              <div className="flex gap-2 mb-3">
                 <Badge variant="outline" className={cn("bg-black/50 backdrop-blur-md font-semibold border-white/10", getDifficultyColor(d.difficulty))}>
                   {d.difficulty}
                 </Badge>
                 <Badge variant="outline" className="bg-black/50 backdrop-blur-md text-white border-white/10">
                   {d.cuisine}
                 </Badge>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{recipe.title}</h2>
              <div className="flex gap-4 text-sm text-slate-300">
                 <span className="flex items-center gap-1.5"><Clock size={16} className="text-purple-400" /> Prep: {d.prepTime}m | Gatit: {d.cookTime}m</span>
              </div>
           </div>
        </div>

        {/* Tabs & Content */}
        <div className="flex flex-col h-full min-h-0">
          <div className="flex border-b border-white/10 bg-[#111111]/80 backdrop-blur-sm sticky top-0 z-10">
            {['ingredients', 'steps', 'nutrition'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex-1 py-4 text-sm font-medium transition-colors border-b-2",
                  activeTab === tab ? "border-purple-500 text-purple-400" : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              >
                {tab === 'ingredients' ? 'Ingrediente' : tab === 'steps' ? 'Mod Preparare' : 'Nutriție'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f] custom-scrollbar">
            
            {activeTab === 'ingredients' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
                  <span className="text-slate-300 font-medium">Cantități pentru:</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.5))} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><Minus size={16} /></button>
                    <span className="text-lg font-bold w-12 text-center text-white">{scaledPortions}</span>
                    <button onClick={() => setScale(s => s + 0.5)} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><Plus size={16} /></button>
                    <span className="text-slate-500 capitalize">{d.servingUnit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {d.ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-colors">
                      <span className="text-slate-200 capitalize">{ing.name}</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-purple-400 font-semibold">{Number((ing.qty * scale).toFixed(2))}</span>
                        <span className="text-slate-500 text-sm">{ing.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'steps' && (
              <div className="max-w-3xl mx-auto space-y-6">
                {d.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                      {i + 1}
                    </div>
                    <div className="flex-1 bg-[#151520] border border-white/5 rounded-2xl p-4 text-slate-300 leading-relaxed">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'nutrition' && (
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center justify-center gap-8 mb-8">
                  <div className="text-center">
                    <HealthRing score={d.healthScore || 50} size={120} />
                    <div className="mt-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">Health Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Calorii', val: d.nutrition.perServing.kcal, unit: 'kcal', color: 'text-amber-400' },
                    { label: 'Proteine', val: d.nutrition.perServing.protein, unit: 'g', color: 'text-emerald-400' },
                    { label: 'Carbohidrati', val: d.nutrition.perServing.carbs, unit: 'g', color: 'text-blue-400' },
                    { label: 'Grasimi', val: d.nutrition.perServing.fat, unit: 'g', color: 'text-red-400' }
                  ].map(m => (
                    <div key={m.label} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">{m.label}</span>
                      <div className="flex items-baseline gap-1">
                        <span className={cn("text-2xl font-bold", m.color)}>{m.val}</span>
                        <span className="text-slate-500 text-xs">{m.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#151520] border border-white/5 rounded-2xl p-6">
                  <h4 className="text-sm font-semibold text-white mb-4 border-b border-white/5 pb-2">Micro-nutrienți (per {d.servingUnit})</h4>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    {Object.entries({
                      'Fibre': { v: d.nutrition.perServing.fiber, u: 'g' },
                      'Zaharuri': { v: d.nutrition.perServing.sugar, u: 'g' },
                      'Sodiu': { v: d.nutrition.perServing.sodium, u: 'mg' },
                      'Vitamina C': { v: d.nutrition.perServing.vitaminC, u: 'mg' },
                      'Calciu': { v: d.nutrition.perServing.calcium, u: 'mg' },
                      'Fier': { v: d.nutrition.perServing.iron, u: 'mg' },
                      'Omega 3': { v: d.nutrition.perServing.omega3, u: 'g' },
                      'Zinc': { v: d.nutrition.perServing.zinc, u: 'mg' }
                    }).map(([key, data]) => data.v !== undefined && (
                      <div key={key} className="flex justify-between items-center border-b border-white/5 border-dashed pb-2">
                        <span className="text-slate-400">{key}</span>
                        <span className="text-slate-200 font-mono">{data.v}{data.u}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// --- RECIPE EDIT MODAL ---

function RecipeEditModal({ isOpen, onClose, recipe, onSave }: { isOpen: boolean, onClose: () => void, recipe: ParsedRecipe, onSave: () => void }) {
  const [tab, setTab] = useState<'info' | 'ing' | 'nutri'>('info');
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(recipe.title);
  const [d, setD] = useState<RecipeContent>(JSON.parse(JSON.stringify(recipe.contentData)));

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        title,
        content: JSON.stringify(d),
        type: 'recipe',
        isPrivate: false,
        categoryId: recipe.categoryId
      };

      if (recipe.id === 0) {
        await createNote(payload as any);
        toast({ title: 'Success', description: 'Rețetă creată!' });
      } else {
        await updateNote(recipe.id, payload);
        toast({ title: 'Success', description: 'Rețetă actualizată!' });
      }
      onSave();
      onClose();
    } catch (e) {
      toast({ title: 'Error', description: 'Eroare la salvare', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateNutri = (key: keyof RecipeContent['nutrition']['perServing'], val: string) => {
    setD(prev => ({
      ...prev,
      nutrition: { ...prev.nutrition, perServing: { ...prev.nutrition.perServing, [key]: Number(val) || 0 } }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#111111] border border-white/10 text-white max-w-3xl p-6 h-[85vh] flex flex-col gap-6 shadow-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{recipe.id === 0 ? 'Adaugă Rețetă' : 'Editează Rețetă'}</DialogTitle>
        </DialogHeader>

        <div className="flex border-b border-white/10 gap-4 shrink-0">
          {[
            { id: 'info', label: 'Info General' },
            { id: 'ing', label: 'Ingrediente & Pași' },
            { id: 'nutri', label: 'Nutriție' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={cn("pb-2 text-sm font-medium border-b-2 transition-colors", tab === t.id ? "border-purple-500 text-purple-400" : "border-transparent text-slate-400")}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
          {tab === 'info' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-slate-400">Titlu</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-[#09090b] border-white/10" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Bucătărie (ex: Italian)</label>
                <Input value={d.cuisine} onChange={e => setD({...d, cuisine: e.target.value})} className="bg-[#09090b] border-white/10" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Dificultate</label>
                <select 
                  value={d.difficulty} onChange={e => setD({...d, difficulty: e.target.value as any})}
                  className="w-full bg-[#09090b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:border-purple-500/50 outline-none"
                >
                  <option value="easy">Ușor</option><option value="medium">Mediu</option><option value="hard">Dificil</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Timp Prep (min)</label>
                <Input type="number" value={d.prepTime} onChange={e => setD({...d, prepTime: Number(e.target.value)})} className="bg-[#09090b] border-white/10" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Timp Gătit (min)</label>
                <Input type="number" value={d.cookTime} onChange={e => setD({...d, cookTime: Number(e.target.value)})} className="bg-[#09090b] border-white/10" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Unitate Porții (ex: portii, tava)</label>
                <select 
                  value={d.servingUnit} onChange={e => setD({...d, servingUnit: e.target.value as any})}
                  className="w-full bg-[#09090b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:border-purple-500/50 outline-none"
                >
                  <option value="portii">Porții</option><option value="tava">Tavă</option><option value="bucati">Bucăți</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Număr Porții (bază)</label>
                <Input type="number" value={d.baseServings} onChange={e => setD({...d, baseServings: Number(e.target.value)})} className="bg-[#09090b] border-white/10" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-slate-400">Imagine (URL opțional)</label>
                <Input value={d.imageUrl || ''} onChange={e => setD({...d, imageUrl: e.target.value})} className="bg-[#09090b] border-white/10" placeholder="https://..." />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-slate-400">Health Score (0-100)</label>
                <Input type="number" value={d.healthScore || 0} onChange={e => setD({...d, healthScore: Number(e.target.value)})} className="bg-[#09090b] border-white/10" />
              </div>
            </div>
          )}

          {tab === 'ing' && (
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-200">Ingrediente</h3>
                  <Button size="sm" variant="outline" className="h-8 border-white/10" onClick={() => setD({...d, ingredients: [...d.ingredients, {name:'', qty:1, unit:'g'}]})}>
                    <Plus size={14} className="mr-1" /> Adaugă
                  </Button>
                </div>
                <div className="space-y-2">
                  {d.ingredients.map((ing, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input placeholder="Nume (ex: sare)" value={ing.name} onChange={e => { const n = [...d.ingredients]; n[i].name = e.target.value; setD({...d, ingredients: n}); }} className="flex-1 bg-[#09090b] border-white/10 h-9" />
                      <Input type="number" placeholder="Cantitate" value={ing.qty} onChange={e => { const n = [...d.ingredients]; n[i].qty = Number(e.target.value); setD({...d, ingredients: n}); }} className="w-24 bg-[#09090b] border-white/10 h-9" />
                      <Input placeholder="Unitate (g, ml)" value={ing.unit} onChange={e => { const n = [...d.ingredients]; n[i].unit = e.target.value; setD({...d, ingredients: n}); }} className="w-24 bg-[#09090b] border-white/10 h-9" />
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-red-400" onClick={() => { const n = [...d.ingredients]; n.splice(i,1); setD({...d, ingredients: n}); }}><Trash2 size={14}/></Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-200">Mod Preparare</h3>
                  <Button size="sm" variant="outline" className="h-8 border-white/10" onClick={() => setD({...d, steps: [...d.steps, '']})}>
                    <Plus size={14} className="mr-1" /> Adaugă Pas
                  </Button>
                </div>
                <div className="space-y-2">
                  {d.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="w-6 h-6 shrink-0 bg-white/10 rounded-full flex items-center justify-center text-xs mt-1.5">{i+1}</div>
                      <textarea 
                        value={step} 
                        onChange={e => { const s = [...d.steps]; s[i] = e.target.value; setD({...d, steps: s}); }}
                        className="flex-1 bg-[#09090b] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-purple-500/50 min-h-[60px] outline-none"
                      />
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-red-400 mt-1" onClick={() => { const s = [...d.steps]; s.splice(i,1); setD({...d, steps: s}); }}><Trash2 size={14}/></Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'nutri' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 text-sm text-slate-400 mb-2 border-b border-white/5 pb-2">Valori per {d.servingUnit}</div>
              
              <div className="space-y-1"><label className="text-xs text-amber-400">Calorii (kcal)*</label>
              <Input type="number" value={d.nutrition.perServing.kcal || 0} onChange={e => updateNutri('kcal', e.target.value)} className="bg-[#09090b] border-white/10" /></div>
              
              <div className="space-y-1"><label className="text-xs text-emerald-400">Proteine (g)*</label>
              <Input type="number" value={d.nutrition.perServing.protein || 0} onChange={e => updateNutri('protein', e.target.value)} className="bg-[#09090b] border-white/10" /></div>
              
              <div className="space-y-1"><label className="text-xs text-blue-400">Carbohidrați (g)*</label>
              <Input type="number" value={d.nutrition.perServing.carbs || 0} onChange={e => updateNutri('carbs', e.target.value)} className="bg-[#09090b] border-white/10" /></div>
              
              <div className="space-y-1"><label className="text-xs text-red-400">Grăsimi (g)*</label>
              <Input type="number" value={d.nutrition.perServing.fat || 0} onChange={e => updateNutri('fat', e.target.value)} className="bg-[#09090b] border-white/10" /></div>

              <div className="col-span-2 mt-4 text-xs font-semibold text-slate-500 uppercase">Opționale</div>

              {['fiber', 'sugar', 'sodium', 'vitaminC', 'calcium', 'iron', 'omega3', 'zinc'].map(k => (
                <div key={k} className="space-y-1">
                  <label className="text-xs text-slate-400 capitalize">{k}</label>
                  <Input type="number" value={(d.nutrition.perServing as any)[k] || ''} onChange={e => updateNutri(k as any, e.target.value)} className="bg-[#09090b] border-white/10" />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-white/10 pt-4 shrink-0">
           <Button variant="ghost" onClick={onClose}>Anulează</Button>
           <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white">
             {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
             Salvează
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
