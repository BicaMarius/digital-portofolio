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
import { ChefHat, ShoppingBasket, Quote, Clock3, Flame, Users, ArrowLeft, ArrowRight, Sparkles, MoreVertical, Pencil, Trash2, RotateCcw, Loader2, Upload, X, Image as ImageIcon, Trash, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getNotes, getTrashedNotes, createNote, updateNote, softDeleteNote as apiSoftDeleteNote, restoreNote as apiRestoreNote, deleteNote } from '@/lib/api';
import type { NoteItem as ApiNoteItem } from '@shared/schema';

// Helper to format time: shows hours:min when > 60 min
function formatTime(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// Time options in 10-min increments up to 3 hours
const timeOptions: number[] = [];
for (let i = 10; i <= 180; i += 10) {
  timeOptions.push(i);
}

interface Recipe {
  id: number;
  title: string;
  summary: string;
  image: string;
  time: number; // in minutes
  difficulty: 'ușor' | 'mediu' | 'dificil';
  servings: number;
  steps: string[];
  ingredients?: string[];
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

// Convert API NoteItem to local format
function toLocalNote(n: ApiNoteItem): Recipe | ShoppingItem | QuoteItem {
  if (n.type === 'recipe') {
    const content = n.content ? JSON.parse(n.content) : {};
    return {
      id: n.id,
      title: n.title,
      summary: content.summary || '',
      image: n.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      time: (n.prepTime || 0) + (n.cookTime || 0),
      difficulty: (n.difficulty as Recipe['difficulty']) || 'mediu',
      servings: n.servings || 2,
      steps: content.steps || [],
      ingredients: content.ingredients || [],
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

export default function Notes() {
    // Search bar pentru citate
    const [quoteSearch, setQuoteSearch] = useState('');
  const { isAdmin } = useAdmin();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [trashedRecipes, setTrashedRecipes] = useState<Recipe[]>([]);
  const [trashedShopping, setTrashedShopping] = useState<ShoppingItem[]>([]);
  const [trashedQuotes, setTrashedQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<'recipe' | 'shopping' | 'quote'>('recipe');
  const [form, setForm] = useState({
    title: '',
    summary: '',
    time: 20, // in minutes
    difficulty: 'mediu' as Recipe['difficulty'],
    servings: 2,
    steps: '',
    ingredients: '',
    text: '',
    author: '',
    source: '',
    image: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [activeRecipeId, setActiveRecipeId] = useState<number | null>(null);
  const activeRecipeIndex = useMemo(() => recipes.findIndex((r) => r.id === activeRecipeId), [recipes, activeRecipeId]);
  const activeRecipe = activeRecipeIndex >= 0 ? recipes[activeRecipeIndex] : null;

  // Quote fullscreen state
  const [activeQuoteId, setActiveQuoteId] = useState<number | null>(null);
  const activeQuoteIndex = useMemo(() => quotes.findIndex((q) => q.id === activeQuoteId), [quotes, activeQuoteId]);
  const activeQuote = activeQuoteIndex >= 0 ? quotes[activeQuoteIndex] : null;

  const [editing, setEditing] = useState<null | { type: 'recipe' | 'shopping' | 'quote'; id: number }>(null);
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [addFormTab, setAddFormTab] = useState<'details' | 'steps'>('details');

  // Load data from cloud
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
    time: 20,
    difficulty: 'mediu',
    servings: 2,
    steps: '',
    ingredients: '',
    text: '',
    author: '',
    source: '',
    image: '',
  });

  const openAdd = (type: 'recipe' | 'shopping' | 'quote') => {
    setAddType(type);
    resetForm();
    setEditing(null);
    setAddOpen(true);
  };

  // Image upload handler
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
          steps: form.steps.split('\n').map(s => s.trim()).filter(Boolean),
          ingredients: form.ingredients.split('\n').map(s => s.trim()).filter(Boolean),
        });
        
        const noteData: Omit<ApiNoteItem, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'recipe',
          title: form.title.trim(),
          content,
          imageUrl: form.image || null,
          prepTime: form.time,
          cookTime: null,
          servings: form.servings,
          difficulty: form.difficulty,
          cuisine: null,
          author: null,
          source: null,
          completed: false,
          isPrivate: false,
          deletedAt: null,
        };
        
        if (editing?.type === 'recipe') {
          const updated = await updateNote(editing.id, noteData);
          setRecipes(prev => prev.map(r => r.id === editing.id ? toLocalNote(updated) as Recipe : r));
          toast({ title: 'Actualizat', description: 'Rețeta a fost actualizată.' });
        } else {
          const created = await createNote(noteData);
          setRecipes(prev => [...prev, toLocalNote(created) as Recipe]);
          toast({ title: 'Adăugat', description: 'Rețeta a fost adăugată.' });
        }
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

  // Keyboard navigation for recipes and quotes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Recipe navigation
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
      // Quote navigation
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
        time: recipe.time,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        steps: recipe.steps.join('\n'),
        ingredients: recipe.ingredients?.join('\n') || '',
        text: '',
        author: '',
        image: recipe.image,
      });
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
      if (type === 'recipe') {
        const recipe = recipes.find(r => r.id === id);
        if (recipe) {
          setRecipes(prev => prev.filter(r => r.id !== id));
          setTrashedRecipes(prev => [recipe, ...prev]);
        }
        if (activeRecipeId === id) setActiveRecipeId(null);
      }
      if (type === 'shopping') {
        const item = shopping.find(s => s.id === id);
        if (item) {
          setShopping(prev => prev.filter(s => s.id !== id));
          setTrashedShopping(prev => [item, ...prev]);
        }
      }
      if (type === 'quote') {
        const quote = quotes.find(q => q.id === id);
        if (quote) {
          setQuotes(prev => prev.filter(q => q.id !== id));
          setTrashedQuotes(prev => [quote, ...prev]);
        }
      }
      toast({ title: 'Mutat în coș', description: 'Elementul a fost mutat în coș.' });
    } catch (error) {
      console.error('Error soft deleting:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut șterge.', variant: 'destructive' });
    }
  };

  const restoreItem = async (type: 'recipe' | 'shopping' | 'quote', id: number) => {
    try {
      await apiRestoreNote(id);
      if (type === 'recipe') {
        const recipe = trashedRecipes.find(r => r.id === id);
        if (recipe) {
          setTrashedRecipes(prev => prev.filter(r => r.id !== id));
          setRecipes(prev => [...prev, recipe]);
        }
      }
      if (type === 'shopping') {
        const item = trashedShopping.find(s => s.id === id);
        if (item) {
          setTrashedShopping(prev => prev.filter(s => s.id !== id));
          setShopping(prev => [...prev, item]);
        }
      }
      if (type === 'quote') {
        const quote = trashedQuotes.find(q => q.id === id);
        if (quote) {
          setTrashedQuotes(prev => prev.filter(q => q.id !== id));
          setQuotes(prev => [...prev, quote]);
        }
      }
      toast({ title: 'Restaurat', description: 'Elementul a fost restaurat.' });
    } catch (error) {
      console.error('Error restoring:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut restaura.', variant: 'destructive' });
    }
  };

  const deleteForever = async (type: 'recipe' | 'shopping' | 'quote', id: number) => {
    try {
      await deleteNote(id);
      if (type === 'recipe') {
        setTrashedRecipes(prev => prev.filter(r => r.id !== id));
      }
      if (type === 'shopping') {
        setTrashedShopping(prev => prev.filter(s => s.id !== id));
      }
      if (type === 'quote') {
        setTrashedQuotes(prev => prev.filter(q => q.id !== id));
      }
      toast({ title: 'Șters definitiv', description: 'Elementul a fost șters definitiv.' });
    } catch (error) {
      console.error('Error permanently deleting:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut șterge definitiv.', variant: 'destructive' });
    }
  };

  const totalTrashed = trashedRecipes.length + trashedShopping.length + trashedQuotes.length;

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container text-center space-y-3">
          <h1 className="text-3xl font-bold gradient-text">Notițe</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Rețete, liste de cumpărături și citate preferate, atent ordonate.</p>
        </div>
      </section>

      <section className="page-content-section">
        <div className="page-container space-y-6">
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

              <TabsContent value="recipes" className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 md:px-2 lg:px-4">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2 sm:mb-0">
                    <ChefHat className="h-4 w-4" /> Rețete salvate
                  </div>
                  {/* Desktop add button */}
                  {isAdmin && (
                    <Button variant="outline" onClick={() => openAdd('recipe')} className="gap-2 hidden sm:flex ml-2">
                      <ChefHat className="h-4 w-4" /> Adaugă rețetă
                    </Button>
                  )}
                  {/* Floating add button for mobile */}
                  {isAdmin && (
                    <Button
                      className="fixed bottom-24 right-4 z-30 h-12 w-12 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-2xl flex sm:hidden items-center justify-center"
                      size="icon"
                      onClick={() => openAdd('recipe')}
                      aria-label="Adaugă rețetă"
                    >
                      <ChefHat className="h-6 w-6" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {recipes.map((recipe) => (
                    <Card
                      key={recipe.id}
                      className="group relative cursor-pointer overflow-hidden border border-border/60 bg-gradient-to-br from-background to-muted/40 transition hover:-translate-y-0.5 hover:shadow-lg"
                      onClick={() => setActiveRecipeId(recipe.id)}
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500/70 via-pink-500/60 to-purple-500/60" />
                      <CardHeader className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" /> {recipe.title}
                          </CardTitle>
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
                        <p className="text-sm text-muted-foreground line-clamp-2">{recipe.summary}</p>
                      </CardHeader>
                      <CardContent 
                        className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-muted-foreground px-2 py-2"
                        style={{ minHeight: 40 }}
                      >
                        <Badge 
                          variant="outline" 
                          className="flex items-center justify-center whitespace-nowrap bg-white/50 dark:bg-muted/50 px-2 py-1 min-w-[90px]"
                        >
                          <Clock3 className="h-3 w-3 mr-1" /> {formatTime(recipe.time)}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="flex items-center justify-center whitespace-nowrap bg-white/50 dark:bg-muted/50 px-2 py-1 min-w-[90px]"
                        >
                          <Users className="h-3 w-3 mr-1" /> {recipe.servings} pers.
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="flex items-center justify-center whitespace-nowrap bg-white/50 dark:bg-muted/50 px-2 py-1 min-w-[90px]"
                        >
                          <Flame className="h-3 w-3 mr-1" /> {recipe.difficulty}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {recipes.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full">Nicio rețetă încă.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="shopping" className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 md:px-2 lg:px-4">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2 sm:mb-0">
                    <ShoppingBasket className="h-4 w-4" /> Listă de cumpărături
                  </div>
                  {/* Desktop add button */}
                  {isAdmin && (
                    <Button variant="outline" onClick={() => openAdd('shopping')} className="gap-2 hidden sm:flex ml-2">
                      <ShoppingBasket className="h-4 w-4" /> Adaugă produs
                    </Button>
                  )}
                  {/* Floating add button for mobile */}
                  {isAdmin && (
                    <Button
                      className="fixed bottom-24 right-4 z-30 h-12 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-2xl flex sm:hidden items-center justify-center"
                      size="icon"
                      onClick={() => openAdd('shopping')}
                      aria-label="Adaugă produs"
                    >
                      <ShoppingBasket className="h-6 w-6" />
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
                    {/* Desktop add button - stânga */}
                    {isAdmin && (
                      <Button variant="outline" onClick={() => openAdd('quote')} className="gap-2 hidden sm:flex">
                        <Quote className="h-4 w-4" /> Adaugă citat
                      </Button>
                    )}
                    {/* Search bar - mijloc */}
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
                    {/* Titlu citate - dreapta */}
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Quote className="h-4 w-4" /> Citate
                    </div>
                  </div>
                </div>
                {/* Floating add button for mobile */}
                {isAdmin && (
                  <Button
                    className="fixed bottom-24 right-4 z-30 h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-2xl flex sm:hidden items-center justify-center"
                    size="icon"
                    onClick={() => openAdd('quote')}
                    aria-label="Adaugă citat"
                  >
                    <Quote className="h-6 w-6" />
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
                  {quotes.filter(q => {
                    const query = quoteSearch.trim().toLowerCase();
                    if (!query) return true;
                    return (
                      (q.text && q.text.toLowerCase().includes(query)) ||
                      (q.author && q.author.toLowerCase().includes(query))
                    );
                  }).length === 0 && (
                    <p className="text-sm text-muted-foreground">Niciun citat găsit.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>

      {/* Trash Management Dialog */}
      <Dialog open={showTrashDialog} onOpenChange={setShowTrashDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Coș de gunoi ({totalTrashed})</DialogTitle>
            <DialogDescription>
              Restaurează sau șterge permanent elementele.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {trashedRecipes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <ChefHat className="h-4 w-4" /> Rețete ({trashedRecipes.length})
                </p>
                {trashedRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition"
                  >
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
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition"
                  >
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
                  <div
                    key={quote.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition"
                  >
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
            
            {totalTrashed === 0 && (
              <p className="text-center text-muted-foreground py-4">Coșul de gunoi este gol.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { handleAddDialogChange(open); if (!open) setAddFormTab('details'); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editează' : 'Adaugă'} {addType === 'recipe' ? 'rețetă' : addType === 'shopping' ? 'produs' : 'citat'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {addType === 'recipe' && (
              <Tabs value={addFormTab} onValueChange={(v) => setAddFormTab(v as 'details' | 'steps')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="details">Detalii</TabsTrigger>
                  <TabsTrigger value="steps">Mod de preparare</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-3 mt-0">
                  {/* Image upload */}
                  <div>
                    <Label>Imagine</Label>
                    <div className="mt-1 flex items-center gap-3">
                      {form.image ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                          <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          {uploadingImage ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {form.image ? 'Schimbă' : 'Încarcă'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Titlu</Label>
                      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div>
                      <Label>Timp preparare</Label>
                      <Select value={String(form.time)} onValueChange={(v) => setForm({ ...form, time: parseInt(v) })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(t => (
                            <SelectItem key={t} value={String(t)}>{formatTime(t)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Dificultate</Label>
                      <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as Recipe['difficulty'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ușor">Ușor</SelectItem>
                          <SelectItem value="mediu">Mediu</SelectItem>
                          <SelectItem value="dificil">Dificil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Porții</Label>
                      <Input type="number" min={1} value={form.servings} onChange={(e) => setForm({ ...form, servings: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div>
                    <Label>Descriere scurtă</Label>
                    <Input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                  </div>
                  <div>
                    <Label>Ingrediente (unul pe linie)</Label>
                    <Textarea rows={3} value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} placeholder="200g făină&#10;2 ouă&#10;100ml lapte" />
                  </div>
                </TabsContent>
                
                <TabsContent value="steps" className="mt-0">
                  <div className="space-y-2">
                    <Label>Pași de preparare (unul pe linie)</Label>
                    <Textarea 
                      rows={12} 
                      value={form.steps} 
                      onChange={(e) => setForm({ ...form, steps: e.target.value })} 
                      placeholder="1. Amestecă făina cu zahărul&#10;2. Adaugă ouăle și laptele&#10;3. Frământă aluatul&#10;4. Lasă la cuptor 30 min la 180°C&#10;5. Servește cald" 
                      className="min-h-[280px]"
                    />
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
              {/* Left arrow */}
              {activeRecipeIndex > 0 && (
                <button
                  onClick={goPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-12 h-12 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              
              {/* Right arrow */}
              {activeRecipeIndex < recipes.length - 1 && (
                <button
                  onClick={goNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-12 h-12 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ChefHat className="h-4 w-4" /> 
                  <span>{activeRecipeIndex + 1} / {recipes.length}</span>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] items-start">
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">{activeRecipe.title}</h3>
                    <p className="text-sm text-muted-foreground">{activeRecipe.summary}</p>
                    {/* Mobile only - badges */}
                    <div className="flex flex-wrap gap-2 text-xs lg:hidden">
                      <Badge variant="outline"><Clock3 className="h-3 w-3 mr-1" /> {formatTime(activeRecipe.time)}</Badge>
                      <Badge variant="outline"><Flame className="h-3 w-3 mr-1" /> {activeRecipe.difficulty}</Badge>
                      <Badge variant="outline"><Users className="h-3 w-3 mr-1" /> {activeRecipe.servings} porții</Badge>
                    </div>
                    
                    {activeRecipe.ingredients && activeRecipe.ingredients.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Ingrediente</p>
                        <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                          {activeRecipe.ingredients.map((ing, idx) => (
                            <li key={idx}>{ing}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Mod de preparare</p>
                      <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                        {activeRecipe.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/50">
                      <img src={activeRecipe.image} alt={activeRecipe.title} className="h-56 w-full object-cover" />
                    </div>
                    {/* Desktop only - cards - improved layout */}
                    <div className="hidden lg:flex w-full justify-center items-center gap-6 mt-2 mb-1">
                      <Card className="flex-1 min-w-[140px] max-w-[180px] bg-background/80 border border-border/60 rounded-xl shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-4 px-2 text-muted-foreground">
                          <span className="flex items-center gap-2 mb-1 text-lg font-medium"><Clock3 className="h-5 w-5" /> <span>{formatTime(activeRecipe.time)}</span></span>
                          <span className="text-xs text-muted-foreground">min</span>
                        </CardContent>
                      </Card>
                      <Card className="flex-1 min-w-[140px] max-w-[180px] bg-background/80 border border-border/60 rounded-xl shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-4 px-2 text-muted-foreground">
                          <span className="flex items-center gap-2 mb-1 text-lg font-medium"><Flame className="h-5 w-5" /> <span>{activeRecipe.difficulty}</span></span>
                          <span className="text-xs text-muted-foreground">dificultate</span>
                        </CardContent>
                      </Card>
                      <Card className="flex-1 min-w-[140px] max-w-[180px] bg-background/80 border border-border/60 rounded-xl shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-4 px-2 text-muted-foreground">
                          <span className="flex items-center gap-2 mb-1 text-lg font-medium"><Users className="h-5 w-5" /> <span>{activeRecipe.servings}</span></span>
                          <span className="text-xs text-muted-foreground">porții</span>
                        </CardContent>
                      </Card>
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
              {/* Left arrow */}
              {activeQuoteIndex > 0 && (
                <button
                  onClick={goPrevQuote}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background/80 border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
              
              {/* Right arrow */}
              {activeQuoteIndex < quotes.length - 1 && (
                <button
                  onClick={goNextQuote}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background/80 border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}

              {/* Quote content */}
              <div className="text-center space-y-6 max-w-lg mx-auto px-8">
                <Quote className="h-10 w-10 sm:h-12 sm:w-12 text-primary/30 mx-auto" />
                <p className="text-xl sm:text-2xl md:text-3xl font-serif leading-relaxed italic">
                  "{activeQuote.text}"
                </p>
                {activeQuote.author && (
                  <p className="text-sm sm:text-base text-muted-foreground">
                    — {activeQuote.author}
                  </p>
                )}
                {activeQuote.source && (
                  <p className="text-xs sm:text-sm text-muted-foreground/80">
                    {activeQuote.source}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/50 pt-4">
                  {activeQuoteIndex + 1} / {quotes.length}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
