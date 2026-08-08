import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdmin } from '@/contexts/AdminContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { ChefHat, ShoppingBasket, Quote, Clock3, Flame, Users, ArrowLeft, ArrowRight, Sparkles, MoreVertical, Pencil, Trash2, RotateCcw, Loader2, Upload, X, Image as ImageIcon, Trash, Search, Plus, Minus, CheckSquare, Square, ChevronRight, XIcon, PanelRightOpen } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getNotes, getTrashedNotes, createNote, updateNote, softDeleteNote as apiSoftDeleteNote, restoreNote as apiRestoreNote, deleteNote } from '@/lib/api';
import type { NoteItem as ApiNoteItem } from '@shared/schema';

// Helper to format time
function formatTime(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function formatQty(qty: number): string {
  const whole = Math.floor(qty);
  const frac = qty - whole;
  let fracStr = '';
  if (Math.abs(frac - 0.5) < 0.01) fracStr = '½';
  else if (Math.abs(frac - 0.25) < 0.01) fracStr = '¼';
  else if (Math.abs(frac - 0.75) < 0.01) fracStr = '¾';
  else if (frac > 0) fracStr = frac.toFixed(1).replace('.0', '');
  
  if (whole === 0) return fracStr || '0';
  if (!fracStr) return whole.toString();
  if (['½', '¼', '¾'].includes(fracStr)) return `${whole}${fracStr}`;
  return `${whole} ${fracStr}`;
}

const timeOptions: number[] = [];
for (let i = 10; i <= 180; i += 10) {
  timeOptions.push(i);
}

interface Ingredient {
  name: string;
  qty: number;
  unit: string;
}

interface RecipeNutrition {
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  vitamins?: { name: string; amount: string }[];
  healthScore?: number;
}

interface Recipe {
  id: number;
  title: string;
  cuisine: string;
  summary: string;
  image: string;
  prepTime: number;
  cookTime: number;
  difficulty: 'ușor' | 'mediu' | 'dificil';
  servings: number;
  steps: string[];
  ingredients: Ingredient[];
  nutrition: RecipeNutrition;
  tags: string[];
  healthScore: number;
}

interface ShoppingItem {
  id: number;
  text: string;
}

interface QuoteItem {
  id: number;
  text: string;
  author?: string;
  source?: string;
}

function toLocalNote(n: ApiNoteItem): Recipe | ShoppingItem | QuoteItem {
  if (n.type === 'recipe') {
    let content: any = {};
    try {
      content = typeof n.content === 'string' ? JSON.parse(n.content) : (n.content || {});
    } catch (e) {
      content = {};
    }
    return {
      id: n.id,
      title: n.title || 'Fără titlu',
      cuisine: content?.cuisine || n.cuisine || 'Nespecificat',
      summary: content?.summary || '',
      image: n.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      prepTime: n.prepTime || 0,
      cookTime: n.cookTime || 0,
      difficulty: (n.difficulty as Recipe['difficulty']) || 'mediu',
      servings: n.servings || 2,
      steps: Array.isArray(content?.steps) ? content.steps : [],
      ingredients: Array.isArray(content?.ingredients) 
        ? content.ingredients.map((ing: any) => {
            if (typeof ing === 'string') return { name: ing, qty: 1, unit: 'buc' };
            return { name: ing.name || '', qty: ing.qty || 0, unit: ing.unit || 'g' };
          })
        : [],
      nutrition: (content?.nutrition && typeof content.nutrition === 'object') ? {
        kcal: content.nutrition.kcal || 0,
        carbs: content.nutrition.carbs || 0,
        protein: content.nutrition.protein || 0,
        fat: content.nutrition.fat || 0,
        fiber: content.nutrition.fiber || 0,
        sugar: content.nutrition.sugar || 0,
        sodium: content.nutrition.sodium || 0,
      } : { kcal: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
      tags: Array.isArray(content?.tags) ? content.tags : [],
      healthScore: content?.healthScore || 5,
    };
  }
  if (n.type === 'quote') {
    return {
      id: n.id,
      text: n.content || n.title,
      author: n.author ?? undefined,
      source: n.source ?? undefined,
    };
  }
  // shopping
  return {
    id: n.id,
    text: n.content || n.title,
  };
}

const seedRecipesData = [
  {
    type: 'recipe',
    title: 'Mici românești',
    content: JSON.stringify({
      summary: 'Rețeta tradițională de mici, perfect pentru grătar.',
      steps: ['Amestecă carnea tocată cu condimentele', 'Frământă bine 10 minute', 'Lasă la frigider 2 ore', 'Formează micii', 'Grătar la foc mediu 8-10 minute'],
      ingredients: [{name:'Carne de vită',qty:500,unit:'g'},{name:'Carne de porc',qty:300,unit:'g'},{name:'Carne de miel',qty:200,unit:'g'},{name:'Usturoi',qty:4,unit:'buc'},{name:'Bicarbonat',qty:1,unit:'linguriță'},{name:'Cimbru uscat',qty:1,unit:'linguriță'},{name:'Sare',qty:10,unit:'g'},{name:'Piper',qty:3,unit:'g'}],
      nutrition: {kcal:280,carbs:2,protein:22,fat:19,fiber:0,sugar:0,sodium:420},
      tags: ['grătar','tradițional','carne'],
      healthScore: 6,
      cuisine: 'Românească'
    }),
    prepTime: 20,
    cookTime: 10,
    servings: 4,
    difficulty: 'mediu',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'
  },
  {
    type: 'recipe',
    title: 'Papanași cu smântână',
    content: JSON.stringify({
      summary: 'Desert tradițional românesc pufos și delicios.',
      steps: ['Mixează brânza cu ouăle și zahărul', 'Adaugă făina și grisul', 'Formează gogošile', 'Fierbe în apă clocotită 20 minute', 'Prăjește scurt în unt', 'Serveşte cu smântână și dulceață'],
      ingredients: [{name:'Brânză de vaci',qty:500,unit:'g'},{name:'Ouă',qty:2,unit:'buc'},{name:'Zahăr',qty:50,unit:'g'},{name:'Făină',qty:150,unit:'g'},{name:'Griș',qty:50,unit:'g'},{name:'Smântână',qty:200,unit:'ml'},{name:'Dulceață cireșe',qty:100,unit:'g'}],
      nutrition: {kcal:380,carbs:45,protein:14,fat:16,fiber:1,sugar:22,sodium:180},
      tags: ['desert','tradițional','brânză'],
      healthScore: 5,
      cuisine: 'Românească'
    }),
    prepTime: 30,
    cookTime: 25,
    servings: 4,
    difficulty: 'mediu',
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80'
  },
  {
    type: 'recipe',
    title: 'Paste Carbonara',
    content: JSON.stringify({
      summary: 'Clasicul italian autentic, fără smântână.',
      steps: ['Fierbe pastele al dente', 'Prăjește guanciale/pancetta', 'Amestecă gălbenușuri cu Pecorino', 'Combină pastele cu carnea off heat', 'Adaugă amestecul de ouă rapid, amestecând'],
      ingredients: [{name:'Spaghetti',qty:200,unit:'g'},{name:'Guanciale',qty:100,unit:'g'},{name:'Gălbenușuri',qty:3,unit:'buc'},{name:'Pecorino Romano',qty:60,unit:'g'},{name:'Piper negru',qty:5,unit:'g'},{name:'Sare',qty:5,unit:'g'}],
      nutrition: {kcal:520,carbs:58,protein:24,fat:20,fiber:3,sugar:2,sodium:580},
      tags: ['paste','italian','clasic'],
      healthScore: 6,
      cuisine: 'Italiană'
    }),
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'mediu',
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80'
  },
  {
    type: 'recipe',
    title: 'Salată grecească',
    content: JSON.stringify({
      summary: 'Salată proaspătă și sănătoasă, perfectă pentru vară.',
      steps: ['Taie roșiile în bucăți mari', 'Taie castravetele semi-luni', 'Adaugă măslinele și ceapa roșie feliată', 'Pune bucăți de feta deasupra', 'Condimentează cu oregano, sare, ulei de măsline'],
      ingredients: [{name:'Roșii',qty:300,unit:'g'},{name:'Castravete',qty:200,unit:'g'},{name:'Brânză Feta',qty:150,unit:'g'},{name:'Măsline Kalamata',qty:80,unit:'g'},{name:'Ceapă roșie',qty:1,unit:'buc'},{name:'Ulei de măsline',qty:30,unit:'ml'},{name:'Oregano',qty:2,unit:'g'}],
      nutrition: {kcal:220,carbs:12,protein:9,fat:16,fiber:3,sugar:8,sodium:620},
      tags: ['salată','sănătos','vegetarian','rapid'],
      healthScore: 9,
      cuisine: 'Grecească'
    }),
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    difficulty: 'ușor',
    imageUrl: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?auto=format&fit=crop&w=800&q=80'
  },
  {
    type: 'recipe',
    title: 'Supă cremă de ciuperci',
    content: JSON.stringify({
      summary: 'Supă cremă catifelată cu aromă intensă de ciuperci.',
      steps: ['Sotează ceapa și usturoiul în unt', 'Adaugă ciupercile și gătește 8 minute', 'Toarnă supa și frunzele de cimbru', 'Fierbe 15 minute', 'Blendează', 'Adaugă smântâna și condimentele'],
      ingredients: [{name:'Ciuperci champignon',qty:500,unit:'g'},{name:'Ceapă',qty:1,unit:'buc'},{name:'Usturoi',qty:2,unit:'buc'},{name:'Unt',qty:40,unit:'g'},{name:'Supă de pui',qty:600,unit:'ml'},{name:'Smântână',qty:100,unit:'ml'},{name:'Cimbru',qty:2,unit:'g'},{name:'Sare, piper',qty:5,unit:'g'}],
      nutrition: {kcal:180,carbs:10,protein:6,fat:13,fiber:2,sugar:4,sodium:380},
      tags: ['supă','ciuperci','cremă','confortabil'],
      healthScore: 8,
      cuisine: 'Internațională'
    }) as any,
    prepTime: 15,
    cookTime: 25,
    servings: 3,
    difficulty: 'ușor',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80'
  }
];

export default function Notes() {
  const [quoteSearch, setQuoteSearch] = useState('');
  const { isAdmin } = useAdmin();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [trashedRecipes, setTrashedRecipes] = useState<Recipe[]>([]);
  const [trashedShopping, setTrashedShopping] = useState<ShoppingItem[]>([]);
  const [trashedQuotes, setTrashedQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Recipe State
  const [recipeScales, setRecipeScales] = useState<Record<number, number>>({});
  const [selectedRecipes, setSelectedRecipes] = useState<Record<number, boolean>>({});
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<'recipe' | 'shopping' | 'quote'>('recipe');
  const [form, setForm] = useState({
    title: '',
    summary: '',
    prepTime: 20,
    cookTime: 10,
    difficulty: 'mediu' as Recipe['difficulty'],
    servings: 2,
    cuisine: 'Românească',
    tags: '',
    healthScore: 5,
    image: '',
    steps: [] as string[],
    ingredients: [] as Ingredient[],
    nutrition: { kcal: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 } as RecipeNutrition,
    text: '',
    author: '',
    source: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [activeRecipeId, setActiveRecipeId] = useState<number | null>(null);
  const activeRecipeIndex = useMemo(() => recipes.findIndex((r) => r.id === activeRecipeId), [recipes, activeRecipeId]);
  const activeRecipe = activeRecipeIndex >= 0 ? recipes[activeRecipeIndex] : null;
  const activeRecipeScale = activeRecipe ? (recipeScales[activeRecipe.id] || activeRecipe.servings) : 1;

  const [activeQuoteId, setActiveQuoteId] = useState<number | null>(null);
  const activeQuoteIndex = useMemo(() => quotes.findIndex((q) => q.id === activeQuoteId), [quotes, activeQuoteId]);
  const activeQuote = activeQuoteIndex >= 0 ? quotes[activeQuoteIndex] : null;

  const [editing, setEditing] = useState<null | { type: 'recipe' | 'shopping' | 'quote'; id: number }>(null);
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [addFormTab, setAddFormTab] = useState<'details' | 'ingredients' | 'nutrition'>('details');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [notesData, trashedData] = await Promise.all([
        getNotes(),
        getTrashedNotes()
      ]);
      
      const recipeList: Recipe[] = [];
      const shoppingList: ShoppingItem[] = [];
      const quoteList: QuoteItem[] = [];
      const trashedRecipeList: Recipe[] = [];
      const trashedShoppingList: ShoppingItem[] = [];
      const trashedQuoteList: QuoteItem[] = [];
      
      notesData.forEach(n => {
        if (n.type === 'recipe') recipeList.push(toLocalNote(n) as Recipe);
        else if (n.type === 'shopping') shoppingList.push(toLocalNote(n) as ShoppingItem);
        else if (n.type === 'quote') quoteList.push(toLocalNote(n) as QuoteItem);
      });
      
      trashedData.forEach(n => {
        if (n.type === 'recipe') trashedRecipeList.push(toLocalNote(n) as Recipe);
        else if (n.type === 'shopping') trashedShoppingList.push(toLocalNote(n) as ShoppingItem);
        else if (n.type === 'quote') trashedQuoteList.push(toLocalNote(n) as QuoteItem);
      });
      
      if (recipeList.length === 0) {
        await Promise.all(seedRecipesData.map(r => createNote(r as any)));
        const newNotesData = await getNotes();
        recipeList.length = 0;
        newNotesData.forEach(n => {
          if (n.type === 'recipe') recipeList.push(toLocalNote(n) as Recipe);
        });
      }

      setRecipes(recipeList);
      setShopping(shoppingList);
      setQuotes(quoteList);
      setTrashedRecipes(trashedRecipeList);
      setTrashedShopping(trashedShoppingList);
      setTrashedQuotes(trashedQuoteList);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca notițele.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => setForm({
    title: '',
    summary: '',
    prepTime: 20,
    cookTime: 10,
    difficulty: 'mediu',
    servings: 2,
    cuisine: 'Românească',
    tags: '',
    healthScore: 5,
    image: '',
    steps: [''],
    ingredients: [{ name: '', qty: 0, unit: 'g' }],
    nutrition: { kcal: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
    text: '',
    author: '',
    source: '',
  });

  const openAdd = (type: 'recipe' | 'shopping' | 'quote') => {
    setAddType(type);
    resetForm();
    setEditing(null);
    setAddOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'portfolio-recipes');
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setForm(prev => ({ ...prev, image: data.url }));
      toast({ title: 'Imagine încărcată', description: 'Imaginea a fost încărcată cu succes.' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut încărca imaginea.', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdd = async () => {
    try {
      if (addType === 'recipe') {
        if (!form.title.trim()) return;
        
        const content = JSON.stringify({
          summary: form.summary.trim(),
          steps: form.steps.filter(s => s.trim()),
          ingredients: form.ingredients.filter(i => i.name.trim() && i.qty > 0),
          cuisine: form.cuisine,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          healthScore: form.healthScore,
          nutrition: form.nutrition
        });
        
        const noteData: Omit<ApiNoteItem, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'recipe',
          title: form.title.trim(),
          content,
          imageUrl: form.image || null,
          prepTime: form.prepTime,
          cookTime: form.cookTime,
          servings: form.servings,
          difficulty: form.difficulty,
          cuisine: form.cuisine,
          author: null,
          source: null,
          completed: false,
          isPrivate: false,
          deletedAt: null,
        };
        
        if (editing?.type === 'recipe') {
          await updateNote(editing.id, noteData);
          toast({ title: 'Actualizat', description: 'Rețeta a fost actualizată.' });
        } else {
          await createNote(noteData);
          toast({ title: 'Adăugat', description: 'Rețeta a fost adăugată.' });
        }
        await loadData();
      }

      if (addType === 'shopping') {
        if (!form.text.trim()) return;
        
        const noteData: Omit<ApiNoteItem, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'shopping',
          title: form.text.trim(),
          content: form.text.trim(),
          imageUrl: null,
          prepTime: null,
          cookTime: null,
          servings: null,
          difficulty: null,
          cuisine: null,
          author: null,
          source: null,
          completed: false,
          isPrivate: false,
          deletedAt: null,
        };
        
        if (editing?.type === 'shopping') {
          const updated = await updateNote(editing.id, noteData);
          setShopping(prev => prev.map(item => item.id === editing.id ? toLocalNote(updated) as ShoppingItem : item));
        } else {
          const created = await createNote(noteData);
          setShopping(prev => [...prev, toLocalNote(created) as ShoppingItem]);
        }
      }

      if (addType === 'quote') {
        if (!form.text.trim()) return;
        
        const noteData: Omit<ApiNoteItem, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'quote',
          title: form.text.trim().substring(0, 50),
          content: form.text.trim(),
          imageUrl: null,
          prepTime: null,
          cookTime: null,
          servings: null,
          difficulty: null,
          cuisine: null,
          author: form.author.trim() || null,
          source: form.source.trim() || null,
          completed: false,
          isPrivate: false,
          deletedAt: null,
        };
        
        if (editing?.type === 'quote') {
          const updated = await updateNote(editing.id, noteData);
          setQuotes(prev => prev.map(item => item.id === editing.id ? toLocalNote(updated) as QuoteItem : item));
        } else {
          const created = await createNote(noteData);
          setQuotes(prev => [...prev, toLocalNote(created) as QuoteItem]);
        }
      }

      setEditing(null);
      resetForm();
      setAddOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut salva.', variant: 'destructive' });
    }
  };

  const handleAddDialogChange = (open: boolean) => {
    setAddOpen(open);
    if (!open) {
      setEditing(null);
      resetForm();
    }
  };

  const goPrev = () => {
    if (activeRecipeIndex <= 0) return;
    setActiveRecipeId(recipes[activeRecipeIndex - 1].id);
  };

  const goNext = () => {
    if (activeRecipeIndex === -1 || activeRecipeIndex === recipes.length - 1) return;
    setActiveRecipeId(recipes[activeRecipeIndex + 1].id);
  };

  const goPrevQuote = () => {
    if (activeQuoteIndex <= 0) return;
    setActiveQuoteId(quotes[activeQuoteIndex - 1].id);
  };

  const goNextQuote = () => {
    if (activeQuoteIndex === -1 || activeQuoteIndex === quotes.length - 1) return;
    setActiveQuoteId(quotes[activeQuoteIndex + 1].id);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeRecipeId !== null) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goPrev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goNext();
        } else if (e.key === 'Escape') {
          setActiveRecipeId(null);
        }
      }
      if (activeQuoteId !== null) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goPrevQuote();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goNextQuote();
        } else if (e.key === 'Escape') {
          setActiveQuoteId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRecipeId, activeRecipeIndex, activeQuoteId, activeQuoteIndex, recipes, quotes]);

  const startEdit = (type: 'recipe' | 'shopping' | 'quote', payload: Recipe | ShoppingItem | QuoteItem) => {
    setAddType(type);
    setEditing({ type, id: payload.id });
    if (type === 'recipe') {
      const recipe = payload as Recipe;
      setForm({
        title: recipe.title,
        summary: recipe.summary,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        cuisine: recipe.cuisine,
        tags: recipe.tags.join(', '),
        healthScore: recipe.healthScore,
        steps: recipe.steps.length ? recipe.steps : [''],
        ingredients: recipe.ingredients?.length ? recipe.ingredients : [{ name: '', qty: 0, unit: 'g' }],
        nutrition: recipe.nutrition || { kcal: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
        text: '',
        author: '',
        source: '',
        image: recipe.image,
      });
      setAddFormTab('details');
    }
    if (type === 'shopping') {
      setForm({ ...form, text: (payload as ShoppingItem).text });
    }
    if (type === 'quote') {
      const quote = payload as QuoteItem;
      setForm({ ...form, text: quote.text, author: quote.author || '', source: quote.source || '' });
    }
    setAddOpen(true);
  };

  const softDeleteItem = async (type: 'recipe' | 'shopping' | 'quote', id: number) => {
    try {
      await apiSoftDeleteNote(id);
      await loadData();
      if (type === 'recipe' && activeRecipeId === id) setActiveRecipeId(null);
      toast({ title: 'Mutat în coș', description: 'Elementul a fost mutat în coș.' });
    } catch (error) {
      console.error('Error soft deleting:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut șterge.', variant: 'destructive' });
    }
  };

  const restoreItem = async (type: 'recipe' | 'shopping' | 'quote', id: number) => {
    try {
      await apiRestoreNote(id);
      await loadData();
      toast({ title: 'Restaurat', description: 'Elementul a fost restaurat.' });
    } catch (error) {
      console.error('Error restoring:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut restaura.', variant: 'destructive' });
    }
  };

  const deleteForever = async (type: 'recipe' | 'shopping' | 'quote', id: number) => {
    try {
      await deleteNote(id);
      await loadData();
      toast({ title: 'Șters definitiv', description: 'Elementul a fost șters definitiv.' });
    } catch (error) {
      console.error('Error permanently deleting:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut șterge definitiv.', variant: 'destructive' });
    }
  };

  const toggleRecipeSelection = (id: number) => {
    setSelectedRecipes(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const getRecipeScale = (id: number, baseServings: number) => {
    return recipeScales[id] || baseServings;
  };

  const updateRecipeScale = (id: number, delta: number, baseServings: number) => {
    setRecipeScales(prev => {
      const current = prev[id] || baseServings;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const aggregatedIngredients = useMemo(() => {
    const agg: Record<string, { name: string, qty: number, unit: string }> = {};
    Object.keys(selectedRecipes).forEach(idStr => {
      const id = parseInt(idStr);
      const r = recipes.find(rec => rec.id === id);
      if (!r) return;
      const scale = getRecipeScale(id, r.servings) / r.servings;
      r.ingredients.forEach(ing => {
        const key = `${ing.name.toLowerCase().trim()}_${ing.unit}`;
        if (!agg[key]) agg[key] = { name: ing.name, qty: 0, unit: ing.unit };
        agg[key].qty += ing.qty * scale;
      });
    });
    return Object.values(agg);
  }, [selectedRecipes, recipes, recipeScales]);

  const totalNutrition = useMemo(() => {
    const total = { kcal: 0, carbs: 0, protein: 0, fat: 0, healthScore: 0, count: 0 };
    Object.keys(selectedRecipes).forEach(idStr => {
      const id = parseInt(idStr);
      const r = recipes.find(rec => rec.id === id);
      if (!r) return;
      const scale = getRecipeScale(id, r.servings);
      total.kcal += r.nutrition.kcal * scale;
      total.carbs += r.nutrition.carbs * scale;
      total.protein += r.nutrition.protein * scale;
      total.fat += r.nutrition.fat * scale;
      total.healthScore += (r.healthScore || 5) * scale;
      total.count += scale;
    });
    if (total.count > 0) total.healthScore = total.healthScore / total.count;
    return total;
  }, [selectedRecipes, recipes, recipeScales]);

  const totalTrashed = trashedRecipes.length + trashedShopping.length + trashedQuotes.length;

  return (
    <PageLayout>
      <section className="page-hero-section relative">
        <div className="page-container text-center space-y-3">
          <h1 className="text-3xl font-bold gradient-text">Notițe</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Rețete, liste de cumpărături și citate preferate, atent ordonate.</p>
        </div>
      </section>

      <section className="page-content-section relative overflow-hidden flex">
        <div className={`flex-1 transition-all duration-300 ${sidePanelOpen ? 'mr-[33%]' : ''}`}>
          <div className="page-container space-y-6 relative">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs defaultValue="recipes" className="space-y-4">
                <div className="flex items-center justify-between">
                  <TabsList className="grid grid-cols-3 w-full max-w-2xl">
                    <TabsTrigger value="recipes">Rețete</TabsTrigger>
                    <TabsTrigger value="shopping">Cumpărături</TabsTrigger>
                    <TabsTrigger value="quotes">Citate</TabsTrigger>
                  </TabsList>
                  {isAdmin && totalTrashed > 0 && (
                    <Button
                      variant="outline"
                      className="gap-2 rounded-full ml-4"
                      onClick={() => setShowTrashDialog(true)}
                    >
                      <Trash className="h-4 w-4" />
                      <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
                        {totalTrashed}
                      </Badge>
                    </Button>
                  )}
                </div>

                <TabsContent value="recipes" className="space-y-3 relative">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 md:px-2 lg:px-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2 sm:mb-0">
                      <ChefHat className="h-4 w-4" /> Rețete salvate
                    </div>
                    {isAdmin && (
                      <Button variant="outline" onClick={() => openAdd('recipe')} className="gap-2 hidden sm:flex ml-2">
                        <ChefHat className="h-4 w-4" /> Adaugă rețetă
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        className="fixed bottom-24 right-4 z-30 h-16 w-16 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-2xl flex sm:hidden items-center justify-center"
                        size="icon"
                        onClick={() => openAdd('recipe')}
                        aria-label="Adaugă rețetă"
                      >
                        <ChefHat className="h-8 w-8" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {recipes.map((recipe) => {
                      const scale = getRecipeScale(recipe.id, recipe.servings);
                      const isSelected = !!selectedRecipes[recipe.id];
                      return (
                        <Card
                          key={recipe.id}
                          className="group relative overflow-hidden border border-border/60 bg-gradient-to-br from-background to-muted/40 transition hover:-translate-y-0.5 hover:shadow-lg flex flex-col"
                        >
                          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500/70 via-pink-500/60 to-purple-500/60" />
                          
                          <div className="relative h-40 w-full overflow-hidden cursor-pointer" onClick={() => setActiveRecipeId(recipe.id)}>
                            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Badge variant="secondary" className="bg-background/80 backdrop-blur text-xs font-semibold shadow-sm">
                                {recipe.cuisine}
                              </Badge>
                              <Badge variant="secondary" className={`bg-background/80 backdrop-blur text-xs font-semibold shadow-sm ${recipe.healthScore >= 8 ? 'text-green-500' : recipe.healthScore >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
                                HS: {recipe.healthScore}/10
                              </Badge>
                            </div>
                          </div>

                          <CardHeader className="space-y-2 p-4 pb-2">
                            <div className="flex items-start justify-between gap-3">
                              <CardTitle className="text-lg flex items-center gap-2 cursor-pointer" onClick={() => setActiveRecipeId(recipe.id)}>
                                {recipe.title}
                              </CardTitle>
                              <div className="flex items-center gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className={`h-8 w-8 ${isSelected ? 'text-green-500' : 'text-muted-foreground'}`}
                                  onClick={() => toggleRecipeSelection(recipe.id)}
                                >
                                  {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                </Button>
                                {isAdmin && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => startEdit('recipe', recipe)} className="gap-2">
                                        <Pencil className="h-4 w-4" /> Editează
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => softDeleteItem('recipe', recipe.id)} className="gap-2 text-rose-500 focus:text-rose-500">
                                        <Trash2 className="h-4 w-4" /> Șterge
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {formatTime(recipe.prepTime + recipe.cookTime)}</span>
                                <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> {recipe.difficulty}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-muted/50 rounded-full px-2 py-1">
                                <button onClick={() => updateRecipeScale(recipe.id, -1, recipe.servings)} className="p-0.5 hover:text-primary"><Minus className="h-3 w-3" /></button>
                                <span className="font-medium w-4 text-center">{scale}</span>
                                <button onClick={() => updateRecipeScale(recipe.id, 1, recipe.servings)} className="p-0.5 hover:text-primary"><Plus className="h-3 w-3" /></button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 flex flex-col justify-end flex-1 cursor-pointer" onClick={() => setActiveRecipeId(recipe.id)}>
                            <div className="flex justify-between items-center text-xs px-2 py-1.5 bg-accent/30 rounded-md">
                              <div className="flex flex-col items-center">
                                <span className="font-semibold text-primary">{Math.round(recipe.nutrition.kcal)}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">kcal</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="font-semibold">{Math.round(recipe.nutrition.carbs)}g</span>
                                <span className="text-[10px] text-muted-foreground uppercase">carb</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="font-semibold">{Math.round(recipe.nutrition.protein)}g</span>
                                <span className="text-[10px] text-muted-foreground uppercase">prot</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="font-semibold">{Math.round(recipe.nutrition.fat)}g</span>
                                <span className="text-[10px] text-muted-foreground uppercase">grăs</span>
                              </div>
                            </div>
                            <Button variant="outline" className="w-full mt-3 h-8 text-xs">
                              Vezi detaliile rețetei
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {recipes.length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-full">Nicio rețetă încă.</p>
                    )}
                  </div>

                  <button 
                    onClick={() => setSidePanelOpen(!sidePanelOpen)}
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-primary text-primary-foreground p-2 rounded-l-xl shadow-xl flex items-center justify-center hover:bg-primary/90 transition-all"
                  >
                    {sidePanelOpen ? <ChevronRight className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                  </button>

                </TabsContent>

                {/* Shopping and Quotes Tabs (Kept exactly as requested) */}
                <TabsContent value="shopping" className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 md:px-2 lg:px-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2 sm:mb-0">
                      <ShoppingBasket className="h-4 w-4" /> Listă de cumpărături
                    </div>
                    {isAdmin && (
                      <Button variant="outline" onClick={() => openAdd('shopping')} className="gap-2 hidden sm:flex ml-2">
                        <ShoppingBasket className="h-4 w-4" /> Adaugă produs
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        className="fixed bottom-24 right-4 z-30 h-16 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-2xl flex sm:hidden items-center justify-center"
                        size="icon"
                        onClick={() => openAdd('shopping')}
                        aria-label="Adaugă produs"
                      >
                        <ShoppingBasket className="h-8 w-8" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {shopping.map((item) => (
                      <Card key={item.id} className="border border-border/60 bg-gradient-to-r from-background/80 via-muted/40 to-background/80">
                        <CardContent className="py-3 text-sm font-medium flex items-center justify-between gap-2">
                          <span className="flex-1 truncate">{item.text}</span>
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => startEdit('shopping', item)} className="gap-2">
                                  <Pencil className="h-4 w-4" /> Editează
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => softDeleteItem('shopping', item.id)} className="gap-2 text-rose-500 focus:text-rose-500">
                                  <Trash2 className="h-4 w-4" /> Șterge
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {shopping.length === 0 && (
                      <p className="text-sm text-muted-foreground">Lista de cumpărături e goală.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="quotes" className="space-y-4">
                  <div className="px-1 md:px-2 lg:px-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 w-full">
                      {isAdmin && (
                        <Button variant="outline" onClick={() => openAdd('quote')} className="gap-2 hidden sm:flex">
                          <Quote className="h-4 w-4" /> Adaugă citat
                        </Button>
                      )}
                      <div className="flex-1 flex justify-center">
                        <div className="relative mx-auto w-full max-w-xs md:max-w-sm lg:max-w-md" style={{ minWidth: 200 }}>
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <Input
                            type="text"
                            value={quoteSearch}
                            onChange={e => setQuoteSearch(e.target.value)}
                            placeholder="Caută citat sau autor..."
                            className="pl-9 pr-3 py-2 text-sm rounded-full border focus:border-primary transition-all w-full bg-background"
                            style={{ transition: 'width 0.2s', width: quoteSearch ? 320 : 220, maxWidth: '100%' }}
                            onFocus={e => e.currentTarget.style.width = '320px'}
                            onBlur={e => { if (!quoteSearch) e.currentTarget.style.width = '220px'; }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Quote className="h-4 w-4" /> Citate
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      className="fixed bottom-24 right-4 z-30 h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-2xl flex sm:hidden items-center justify-center"
                      size="icon"
                      onClick={() => openAdd('quote')}
                      aria-label="Adaugă citat"
                    >
                      <Quote className="h-8 w-8" />
                    </Button>
                  )}
                  <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                    {quotes.filter(q => {
                      const query = quoteSearch.trim().toLowerCase();
                      if (!query) return true;
                      return (
                        (q.text && q.text.toLowerCase().includes(query)) ||
                        (q.author && q.author.toLowerCase().includes(query))
                      );
                    }).map((q) => (
                      <Card 
                        key={q.id} 
                        className="border border-border/60 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setActiveQuoteId(q.id)}
                      >
                        <CardContent className="py-4 text-sm leading-relaxed flex gap-2">
                          <Quote className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p>{q.text}</p>
                            {q.author && <p className="text-xs text-muted-foreground mt-1">— {q.author}</p>}
                            {q.source && <p className="text-xs text-muted-foreground">{q.source}</p>}
                          </div>
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => startEdit('quote', q)} className="gap-2">
                                  <Pencil className="h-4 w-4" /> Editează
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => softDeleteItem('quote', q.id)} className="gap-2 text-rose-500 focus:text-rose-500">
                                  <Trash2 className="h-4 w-4" /> Șterge
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        {/* Side Panel for Recipes */}
        {sidePanelOpen && (
          <div className="fixed right-0 top-0 bottom-0 w-1/3 min-w-[300px] max-w-[400px] bg-background border-l shadow-2xl z-40 flex flex-col pt-16">
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
              <h2 className="font-semibold text-lg flex items-center gap-2"><ShoppingBasket className="w-5 h-5"/> Lista mea de gătit</h2>
              <Button size="icon" variant="ghost" onClick={() => setSidePanelOpen(false)}>
                <XIcon className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {Object.keys(selectedRecipes).length === 0 ? (
                <div className="text-center text-muted-foreground py-12 space-y-3">
                  <ShoppingBasket className="w-12 h-12 mx-auto opacity-20" />
                  <p>Nu ai selectat nicio rețetă.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Rețete selectate</h3>
                    <div className="space-y-2">
                      {Object.keys(selectedRecipes).map(idStr => {
                        const r = recipes.find(x => x.id === parseInt(idStr));
                        if (!r) return null;
                        const scale = getRecipeScale(r.id, r.servings);
                        return (
                          <div key={r.id} className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded-md">
                            <span className="font-medium truncate pr-2">{r.title}</span>
                            <span className="text-muted-foreground whitespace-nowrap">{scale} porții</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider border-t pt-4">Ingrediente totale</h3>
                    <ul className="space-y-1.5 text-sm">
                      {aggregatedIngredients.map((ing, i) => (
                        <li key={i} className="flex justify-between items-center border-b border-border/40 pb-1">
                          <span className="capitalize">{ing.name}</span>
                          <span className="font-medium">{formatQty(ing.qty)} {ing.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider border-t pt-4">Aport nutrițional total</h3>
                    <div className="bg-accent/30 p-4 rounded-xl space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-bold text-primary">{Math.round(totalNutrition.kcal)} <span className="text-sm font-normal text-muted-foreground">kcal</span></span>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${totalNutrition.healthScore >= 8 ? 'text-green-500' : totalNutrition.healthScore >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
                            Health Score: {totalNutrition.healthScore.toFixed(1)}/10
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Carbohidrați</span>
                          <span className="font-medium">{Math.round(totalNutrition.carbs)}g</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (totalNutrition.carbs / 300) * 100)}%` }} />
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Proteine</span>
                          <span className="font-medium">{Math.round(totalNutrition.protein)}g</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full" style={{ width: `${Math.min(100, (totalNutrition.protein / 150) * 100)}%` }} />
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Grăsimi</span>
                          <span className="font-medium">{Math.round(totalNutrition.fat)}g</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (totalNutrition.fat / 100) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Trash Dialog */}
      <Dialog open={showTrashDialog} onOpenChange={setShowTrashDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Coș de gunoi ({totalTrashed})</DialogTitle>
            <DialogDescription>Restaurează sau șterge permanent elementele.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {trashedRecipes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <ChefHat className="h-4 w-4" /> Rețete ({trashedRecipes.length})
                </p>
                {trashedRecipes.map(recipe => (
                  <div key={recipe.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition">
                    {recipe.image && (
                      <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{recipe.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">{recipe.summary}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => restoreItem('recipe', recipe.id)}>
                        <RotateCcw className="w-4 h-4 mr-1" /> Restaurează
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteForever('recipe', recipe.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Șterge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {trashedShopping.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <ShoppingBasket className="h-4 w-4" /> Cumpărături ({trashedShopping.length})
                </p>
                {trashedShopping.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition">
                    <div className="flex items-center justify-center w-10 h-10 rounded bg-muted flex-shrink-0">
                      <ShoppingBasket className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.text}</h4>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => restoreItem('shopping', item.id)}>
                        <RotateCcw className="w-4 h-4 mr-1" /> Restaurează
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteForever('shopping', item.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Șterge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {trashedQuotes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Quote className="h-4 w-4" /> Citate ({trashedQuotes.length})
                </p>
                {trashedQuotes.map(quote => (
                  <div key={quote.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition">
                    <div className="flex items-center justify-center w-10 h-10 rounded bg-muted flex-shrink-0">
                      <Quote className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{quote.text}</p>
                      {quote.author && <p className="text-xs text-muted-foreground">— {quote.author}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => restoreItem('quote', quote.id)}>
                        <RotateCcw className="w-4 h-4 mr-1" /> Restaurează
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteForever('quote', quote.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Șterge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {totalTrashed === 0 && <p className="text-center text-muted-foreground py-4">Coșul de gunoi este gol.</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { handleAddDialogChange(open); if (!open) setAddFormTab('details'); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editează' : 'Adaugă'} {addType === 'recipe' ? 'rețetă' : addType === 'shopping' ? 'produs' : 'citat'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {addType === 'recipe' && (
              <Tabs value={addFormTab} onValueChange={(v) => setAddFormTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="details">Informații</TabsTrigger>
                  <TabsTrigger value="ingredients">Ingrediente & Pași</TabsTrigger>
                  <TabsTrigger value="nutrition">Valori Nutriționale</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4 mt-0">
                  <div className="flex items-center gap-4">
                    {form.image ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border">
                        <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                        <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={() => setForm(prev => ({ ...prev, image: '' }))}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50" onClick={() => imageInputRef.current?.click()}>
                        {uploadingImage ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                      </div>
                    )}
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label>Titlu *</Label>
                        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bucătărie</Label>
                      <Select value={form.cuisine} onValueChange={(v) => setForm({ ...form, cuisine: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Românească">Românească</SelectItem>
                          <SelectItem value="Italiană">Italiană</SelectItem>
                          <SelectItem value="Grecească">Grecească</SelectItem>
                          <SelectItem value="Internațională">Internațională</SelectItem>
                          <SelectItem value="Nespecificat">Nespecificat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Dificultate</Label>
                      <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ușor">Ușor</SelectItem>
                          <SelectItem value="mediu">Mediu</SelectItem>
                          <SelectItem value="dificil">Dificil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Timp prep (min)</Label>
                      <Input type="number" min={0} value={form.prepTime} onChange={(e) => setForm({ ...form, prepTime: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Timp gătire (min)</Label>
                      <Input type="number" min={0} value={form.cookTime} onChange={(e) => setForm({ ...form, cookTime: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Porții de bază</Label>
                      <Input type="number" min={1} value={form.servings} onChange={(e) => setForm({ ...form, servings: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Taguri (separate prin virgulă)</Label>
                      <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="ex: desert, rapid" />
                    </div>
                  </div>

                  <div>
                    <Label>Descriere scurtă</Label>
                    <Textarea rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                  </div>
                  
                  <div className="pt-2">
                    <Label className="flex justify-between">
                      <span>Scor Sănătate</span>
                      <span className="font-bold text-primary">{form.healthScore}/10</span>
                    </Label>
                    <Slider 
                      value={[form.healthScore]} 
                      min={1} max={10} step={1} 
                      className="mt-2"
                      onValueChange={(vals) => setForm({ ...form, healthScore: vals[0] })} 
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="ingredients" className="mt-0 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Ingrediente (pt. porțiile de bază)</Label>
                      <Button variant="outline" size="sm" onClick={() => setForm({ ...form, ingredients: [...form.ingredients, { name: '', qty: 0, unit: 'g' }] })}>
                        <Plus className="w-4 h-4 mr-1" /> Adaugă
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {form.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input className="flex-1" placeholder="Nume ingredient" value={ing.name} onChange={(e) => {
                            const newIngs = form.ingredients.map((ing: any) => 
                              typeof ing === 'string' ? { name: ing, qty: 1, unit: 'buc' } : { ...ing }
                            );
                            newIngs[idx].name = e.target.value;
                            setForm({ ...form, ingredients: newIngs });
                          }} />
                          <Input className="w-20" type="number" min={0} step={0.1} value={ing.qty || ''} onChange={(e) => {
                            const newIngs = form.ingredients.map((ing: any) => 
                              typeof ing === 'string' ? { name: ing, qty: 1, unit: 'buc' } : { ...ing }
                            );
                            newIngs[idx].qty = Number(e.target.value);
                            setForm({ ...form, ingredients: newIngs });
                          }} />
                          <Select value={ing.unit} onValueChange={(v) => {
                            const newIngs = form.ingredients.map((ing: any) => 
                              typeof ing === 'string' ? { name: ing, qty: 1, unit: 'buc' } : { ...ing }
                            );
                            newIngs[idx].unit = v;
                            setForm({ ...form, ingredients: newIngs });
                          }}>
                            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="l">l</SelectItem>
                              <SelectItem value="buc">buc</SelectItem>
                              <SelectItem value="linguri">linguri</SelectItem>
                              <SelectItem value="lingurițe">lingurițe</SelectItem>
                              <SelectItem value="cești">cești</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" onClick={() => {
                            const newIngs = form.ingredients.filter((_, i) => i !== idx);
                            setForm({ ...form, ingredients: newIngs });
                          }}>
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Pași de preparare</Label>
                      <Button variant="outline" size="sm" onClick={() => setForm({ ...form, steps: [...form.steps, ''] })}>
                        <Plus className="w-4 h-4 mr-1" /> Adaugă pas
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {form.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="font-semibold text-muted-foreground pt-2.5 w-5 text-right">{idx + 1}.</span>
                          <Textarea className="flex-1 min-h-[60px]" value={String(step || '')} onChange={(e) => {
                            const newSteps = [...form.steps];
                            newSteps[idx] = e.target.value;
                            setForm({ ...form, steps: newSteps });
                          }} />
                          <Button variant="ghost" size="icon" className="mt-1" onClick={() => {
                            const newSteps = form.steps.filter((_, i) => i !== idx);
                            setForm({ ...form, steps: newSteps });
                          }}>
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="nutrition" className="mt-0 space-y-4">
                  <div className="bg-accent/30 p-4 rounded-xl mb-4">
                    <p className="text-sm text-muted-foreground mb-4">Introduceți valorile per <strong>o porție de bază</strong>.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Calorii (kcal) *</Label>
                        <Input type="number" value={form.nutrition.kcal || ''} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, kcal: Number(e.target.value) }})} />
                      </div>
                      <div>
                        <Label>Carbohidrați (g) *</Label>
                        <Input type="number" value={form.nutrition.carbs || ''} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, carbs: Number(e.target.value) }})} />
                      </div>
                      <div>
                        <Label>Proteine (g) *</Label>
                        <Input type="number" value={form.nutrition.protein || ''} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, protein: Number(e.target.value) }})} />
                      </div>
                      <div>
                        <Label>Grăsimi (g) *</Label>
                        <Input type="number" value={form.nutrition.fat || ''} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, fat: Number(e.target.value) }})} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Fibre (g)</Label>
                      <Input type="number" value={form.nutrition.fiber || ''} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, fiber: Number(e.target.value) }})} />
                    </div>
                    <div>
                      <Label>Zahăr (g)</Label>
                      <Input type="number" value={form.nutrition.sugar || ''} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, sugar: Number(e.target.value) }})} />
                    </div>
                    <div>
                      <Label>Sodiu (mg)</Label>
                      <Input type="number" value={form.nutrition.sodium || ''} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, sodium: Number(e.target.value) }})} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {addType === 'shopping' && (
              <div>
                <Label>Produs</Label>
                <Input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
              </div>
            )}

            {addType === 'quote' && (
              <div className="space-y-3">
                <div>
                  <Label>Citat</Label>
                  <Textarea rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
                </div>
                <div>
                  <Label>Autor (opțional)</Label>
                  <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="ex: Albert Einstein" />
                </div>
                <div>
                  <Label>Unde (opțional)</Label>
                  <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="ex: titlul cărții, piesa, albumul" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Anulează</Button>
            <Button onClick={handleAdd} className="bg-gradient-to-r from-amber-500 to-pink-500 text-white">Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipe Detail Dialog */}
      <Dialog open={!!activeRecipe} onOpenChange={(open) => !open && setActiveRecipeId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {activeRecipe && (
            <div className="relative">
              {activeRecipeIndex > 0 && (
                <button onClick={goPrev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-12 h-12 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              
              {activeRecipeIndex < recipes.length - 1 && (
                <button onClick={goNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-12 h-12 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors">
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}

              <div className="p-6 space-y-6">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
                  <div className="space-y-6">
                    <div>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="secondary">{activeRecipe.cuisine}</Badge>
                        {activeRecipe.tags?.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                      </div>
                      <h3 className="text-2xl font-bold">{activeRecipe.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2">{activeRecipe.summary}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                      <div className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-primary" /> {formatTime(activeRecipe.prepTime + activeRecipe.cookTime)}</div>
                      <div className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-amber-500" /> {activeRecipe.difficulty}</div>
                    </div>

                    <div className="bg-accent/30 p-4 rounded-xl border border-border/50">
                      <div className="flex justify-between items-center mb-4">
                        <p className="font-semibold text-lg">Ingrediente</p>
                        <div className="flex items-center gap-3 bg-background rounded-full px-3 py-1 shadow-sm border border-border/50">
                          <span className="text-sm text-muted-foreground">Porții:</span>
                          <button onClick={() => updateRecipeScale(activeRecipe.id, -1, activeRecipe.servings)} className="p-1 hover:text-primary transition-colors"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="font-bold w-4 text-center">{activeRecipeScale}</span>
                          <button onClick={() => updateRecipeScale(activeRecipe.id, 1, activeRecipe.servings)} className="p-1 hover:text-primary transition-colors"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {activeRecipe.ingredients.map((ing, idx) => {
                          const ratio = activeRecipeScale / activeRecipe.servings;
                          const scaledQty = ing.qty * ratio;
                          return (
                            <li key={idx} className="flex justify-between items-center border-b border-border/40 pb-1.5 text-sm">
                              <span>{ing.name}</span>
                              <span className="font-semibold">{formatQty(scaledQty)} {ing.unit}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <p className="font-semibold text-lg">Mod de preparare</p>
                      <ol className="space-y-4">
                        {activeRecipe.steps.map((step, idx) => (
                          <li key={idx} className="flex gap-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                            <span className="pt-0.5 leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="space-y-4 lg:sticky lg:top-6">
                    <div className="overflow-hidden rounded-2xl border border-border/60 shadow-lg">
                      <img src={activeRecipe.image} alt={activeRecipe.title} className="w-full aspect-[4/3] object-cover" />
                    </div>

                    <div className="bg-gradient-to-br from-background to-muted/30 border rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-lg">Valori Nutriționale</h4>
                        <Badge variant="secondary" className={`text-xs ${activeRecipe.healthScore >= 8 ? 'text-green-500' : activeRecipe.healthScore >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
                          Health Score: {activeRecipe.healthScore}/10
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">Per 1 porție</p>
                      
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="bg-background rounded-lg p-2 text-center border shadow-sm">
                          <div className="text-lg font-bold text-primary">{Math.round(activeRecipe.nutrition.kcal)}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Kcal</div>
                        </div>
                        <div className="bg-background rounded-lg p-2 text-center border shadow-sm">
                          <div className="text-lg font-bold">{Math.round(activeRecipe.nutrition.carbs)}g</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Carb</div>
                        </div>
                        <div className="bg-background rounded-lg p-2 text-center border shadow-sm">
                          <div className="text-lg font-bold">{Math.round(activeRecipe.nutrition.protein)}g</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Prot</div>
                        </div>
                        <div className="bg-background rounded-lg p-2 text-center border shadow-sm">
                          <div className="text-lg font-bold">{Math.round(activeRecipe.nutrition.fat)}g</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Grăsimi</div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm pt-2 border-t">
                        {(activeRecipe.nutrition.fiber !== undefined && activeRecipe.nutrition.fiber > 0) && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fibre</span>
                            <span className="font-medium">{activeRecipe.nutrition.fiber}g</span>
                          </div>
                        )}
                        {(activeRecipe.nutrition.sugar !== undefined && activeRecipe.nutrition.sugar > 0) && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Zahăr</span>
                            <span className="font-medium">{activeRecipe.nutrition.sugar}g</span>
                          </div>
                        )}
                        {(activeRecipe.nutrition.sodium !== undefined && activeRecipe.nutrition.sodium > 0) && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sodiu</span>
                            <span className="font-medium">{activeRecipe.nutrition.sodium}mg</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quote Fullscreen Dialog */}
      <Dialog open={!!activeQuote} onOpenChange={(open) => !open && setActiveQuoteId(null)}>
        <DialogContent className="max-w-2xl p-0 bg-gradient-to-br from-background via-background to-muted/30 border-none">
          {activeQuote && (
            <div className="relative min-h-[50vh] flex items-center justify-center p-8 sm:p-12">
              {activeQuoteIndex > 0 && (
                <button onClick={goPrevQuote} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background/80 border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
              {activeQuoteIndex < quotes.length - 1 && (
                <button onClick={goNextQuote} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background/80 border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors">
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
              <div className="text-center space-y-6 max-w-lg mx-auto px-8">
                <Quote className="h-10 w-10 sm:h-12 sm:w-12 text-primary/30 mx-auto" />
                <p className="text-xl sm:text-2xl md:text-3xl font-serif leading-relaxed italic">"{activeQuote.text}"</p>
                {activeQuote.author && <p className="text-sm sm:text-base text-muted-foreground">— {activeQuote.author}</p>}
                {activeQuote.source && <p className="text-xs sm:text-sm text-muted-foreground/80">{activeQuote.source}</p>}
                <p className="text-xs text-muted-foreground/50 pt-4">{activeQuoteIndex + 1} / {quotes.length}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
