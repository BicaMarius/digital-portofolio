import React, { useMemo, useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/contexts/AdminContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChefHat, ShoppingBasket, Quote, Plus, Clock3, Flame, Users, ArrowLeft, ArrowRight, Sparkles, MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface Recipe {
  id: number;
  title: string;
  summary: string;
  image: string;
  time: string;
  difficulty: 'Ușor' | 'Mediu' | 'Dificil';
  servings: number;
  steps: string[];
}

interface ShoppingItem {
  id: number;
  text: string;
}

interface QuoteItem {
  id: number;
  text: string;
}

const sampleRecipes: Recipe[] = [
  {
    id: 1,
    title: 'Pasta al Limone',
    summary: 'Cremă de lămâie, parmezan și ulei de măsline.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    time: '20 min',
    difficulty: 'Ușor',
    servings: 2,
    steps: [
      'Fierbe pastele al dente.',
      'Sotează usturoiul în unt, adaugă zeama de lămâie și parmezan.',
      'Îmbracă pastele în sos și asezonează cu piper.',
    ],
  },
  {
    id: 2,
    title: 'Shakshuka',
    summary: 'Roșii dulci, ouă poșate și chimen.',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80',
    time: '30 min',
    difficulty: 'Mediu',
    servings: 3,
    steps: [
      'Călește ceapă, ardei și condimente.',
      'Adaugă roșii, fierbe până se îngroașă.',
      'Sparge ouăle, acoperă și gătește până se coagulează albușul.',
    ],
  },
  {
    id: 3,
    title: 'Tiramisu rapid',
    summary: 'Mascarpone, espresso și cacao.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    time: '25 min',
    difficulty: 'Ușor',
    servings: 6,
    steps: [
      'Bate mascarpone cu frișcă și zahăr.',
      'Îmbibă pișcoturile în espresso.',
      'Montează straturi și pudrează cu cacao.',
    ],
  },
];

const sampleShopping: ShoppingItem[] = [
  { id: 1, text: 'Cafea boabe' },
  { id: 2, text: 'Fulgi ovăz' },
  { id: 3, text: 'Lămâi' },
  { id: 4, text: 'Ciocolată neagră 70%' },
  { id: 5, text: 'Roșii cherry' },
];

const sampleQuotes: QuoteItem[] = [
  { id: 1, text: '“All we have to decide is what to do with the time that is given us.” – Tolkien' },
  { id: 2, text: '“Simplicity is the ultimate sophistication.” – Leonardo da Vinci' },
];

export default function Notes() {
  const { isAdmin } = useAdmin();
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [shopping, setShopping] = useState<ShoppingItem[]>(sampleShopping);
  const [quotes, setQuotes] = useState<QuoteItem[]>(sampleQuotes);

  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<'recipe' | 'shopping' | 'quote'>('recipe');
  const [form, setForm] = useState({
    title: '',
    summary: '',
    time: '15 min',
    difficulty: 'Ușor' as Recipe['difficulty'],
    servings: 2,
    steps: '',
    text: '',
  });

  const [activeRecipeId, setActiveRecipeId] = useState<number | null>(null);
  const activeRecipeIndex = useMemo(() => recipes.findIndex((r) => r.id === activeRecipeId), [recipes, activeRecipeId]);
  const activeRecipe = activeRecipeIndex >= 0 ? recipes[activeRecipeIndex] : null;

  const [editing, setEditing] = useState<null | { type: 'recipe' | 'shopping' | 'quote'; id: number }>(null);

  const resetForm = () => setForm({
    title: '',
    summary: '',
    time: '15 min',
    difficulty: 'Ușor',
    servings: 2,
    steps: '',
    text: '',
  });

  const openAdd = (type: 'recipe' | 'shopping' | 'quote') => {
    setAddType(type);
    resetForm();
    setEditing(null);
    setAddOpen(true);
  };

  const handleAdd = () => {
    if (addType === 'recipe') {
      if (!form.title.trim()) return;
      const newRecipe: Recipe = {
        id: editing?.id ?? Date.now(),
        title: form.title.trim(),
        summary: form.summary.trim() || 'Rețetă nouă',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
        time: form.time,
        difficulty: form.difficulty,
        servings: Number(form.servings) || 2,
        steps: form.steps
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      setRecipes((prev) => {
        if (editing?.type === 'recipe') {
          return prev.map((r) => (r.id === editing.id ? newRecipe : r));
        }
        return [...prev, newRecipe];
      });
    }

    if (addType === 'shopping') {
      if (!form.text.trim()) return;
      setShopping((prev) => {
        if (editing?.type === 'shopping') {
          return prev.map((item) => (item.id === editing.id ? { ...item, text: form.text.trim() } : item));
        }
        return [...prev, { id: Date.now(), text: form.text.trim() }];
      });
    }

    if (addType === 'quote') {
      if (!form.text.trim()) return;
      setQuotes((prev) => {
        if (editing?.type === 'quote') {
          return prev.map((item) => (item.id === editing.id ? { ...item, text: form.text.trim() } : item));
        }
        return [...prev, { id: Date.now(), text: form.text.trim() }];
      });
    }

    setEditing(null);
    resetForm();
    setAddOpen(false);
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
        text: '',
      });
    }
    if (type === 'shopping') {
      setForm({ title: '', summary: '', time: '15 min', difficulty: 'Ușor', servings: 2, steps: '', text: (payload as ShoppingItem).text });
    }
    if (type === 'quote') {
      setForm({ title: '', summary: '', time: '15 min', difficulty: 'Ușor', servings: 2, steps: '', text: (payload as QuoteItem).text });
    }
    setAddOpen(true);
  };

  const deleteItem = (type: 'recipe' | 'shopping' | 'quote', id: number) => {
    if (type === 'recipe') setRecipes((prev) => prev.filter((r) => r.id !== id));
    if (type === 'shopping') setShopping((prev) => prev.filter((item) => item.id !== id));
    if (type === 'quote') setQuotes((prev) => prev.filter((item) => item.id !== id));
    if (activeRecipeId === id && type === 'recipe') setActiveRecipeId(null);
  };

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
          <Tabs defaultValue="recipes" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto">
              <TabsTrigger value="recipes">Rețete</TabsTrigger>
              <TabsTrigger value="shopping">Cumpărături</TabsTrigger>
              <TabsTrigger value="quotes">Citate</TabsTrigger>
            </TabsList>

            <TabsContent value="recipes" className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ChefHat className="h-4 w-4" /> Rețete salvate
                </div>
                {isAdmin && (
                  <Button variant="outline" onClick={() => openAdd('recipe')} className="gap-2">
                    <ChefHat className="h-4 w-4" /> Adaugă rețetă
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
                              <DropdownMenuItem onClick={() => deleteItem('recipe', recipe.id)} className="gap-2 text-rose-500 focus:text-rose-500">
                                <Trash2 className="h-4 w-4" /> Șterge
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{recipe.summary}</p>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="bg-white/50 dark:bg-muted/50">
                        <Clock3 className="h-3 w-3 mr-1" /> {recipe.time}
                      </Badge>
                      <Badge variant="outline" className="bg-white/50 dark:bg-muted/50">
                        <Flame className="h-3 w-3 mr-1" /> {recipe.difficulty}
                      </Badge>
                      <Badge variant="outline" className="bg-white/50 dark:bg-muted/50">
                        <Users className="h-3 w-3 mr-1" /> {recipe.servings} pers.
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="shopping" className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingBasket className="h-4 w-4" /> Listă de cumpărături
                </div>
                {isAdmin && (
                  <Button variant="outline" onClick={() => openAdd('shopping')} className="gap-2">
                    <ShoppingBasket className="h-4 w-4" /> Adaugă produs
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
                            <DropdownMenuItem onClick={() => deleteItem('shopping', item.id)} className="gap-2 text-rose-500 focus:text-rose-500">
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

            <TabsContent value="quotes" className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Quote className="h-4 w-4" /> Citate
                </div>
                {isAdmin && (
                  <Button variant="outline" onClick={() => openAdd('quote')} className="gap-2">
                    <Quote className="h-4 w-4" /> Adaugă citat
                  </Button>
                )}
              </div>
              <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                {quotes.map((q) => (
                  <Card key={q.id} className="border border-border/60 bg-muted/30">
                    <CardContent className="py-4 text-sm leading-relaxed flex gap-2">
                      <Quote className="h-4 w-4 text-primary mt-1" />
                      <span className="flex-1">{q.text}</span>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => startEdit('quote', q)} className="gap-2">
                              <Pencil className="h-4 w-4" /> Editează
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteItem('quote', q.id)} className="gap-2 text-rose-500 focus:text-rose-500">
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
        </div>
      </section>

      <Dialog open={addOpen} onOpenChange={handleAddDialogChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Adaugă {addType === 'recipe' ? 'rețetă' : addType === 'shopping' ? 'produs' : 'citat'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {addType === 'recipe' && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Titlu</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Timp</Label>
                    <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Dificultate</Label>
                    <Input value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Recipe['difficulty'] })} />
                  </div>
                  <div>
                    <Label>Porții</Label>
                    <Input type="number" value={form.servings} onChange={(e) => setForm({ ...form, servings: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <Label>Descriere scurtă</Label>
                  <Input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                </div>
                <div>
                  <Label>Pași (unul pe linie)</Label>
                  <Textarea rows={4} value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} />
                </div>
              </div>
            )}

            {addType === 'shopping' && (
              <div>
                <Label>Produs</Label>
                <Input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
              </div>
            )}

            {addType === 'quote' && (
              <div>
                <Label>Citat</Label>
                <Textarea rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Anulează</Button>
            <Button onClick={handleAdd} className="bg-gradient-to-r from-amber-500 to-pink-500 text-white">Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeRecipe} onOpenChange={(open) => !open && setActiveRecipeId(null)}>
        <DialogContent className="max-w-4xl">
          {activeRecipe && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ChefHat className="h-4 w-4" /> {activeRecipe.title}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={goPrev} disabled={activeRecipeIndex <= 0}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={goNext} disabled={activeRecipeIndex === recipes.length - 1}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] items-start">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">{activeRecipe.title}</h3>
                  <p className="text-sm text-muted-foreground">{activeRecipe.summary}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline"><Clock3 className="h-3 w-3 mr-1" /> {activeRecipe.time}</Badge>
                    <Badge variant="outline"><Flame className="h-3 w-3 mr-1" /> {activeRecipe.difficulty}</Badge>
                    <Badge variant="outline"><Users className="h-3 w-3 mr-1" /> {activeRecipe.servings} porții</Badge>
                  </div>
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
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Card className="border-border/60 bg-background/70">
                      <CardContent className="py-3 flex items-center gap-2 text-muted-foreground">
                        <Clock3 className="h-4 w-4" /> {activeRecipe.time}
                      </CardContent>
                    </Card>
                    <Card className="border-border/60 bg-background/70">
                      <CardContent className="py-3 flex items-center gap-2 text-muted-foreground">
                        <Flame className="h-4 w-4" /> {activeRecipe.difficulty}
                      </CardContent>
                    </Card>
                    <Card className="border-border/60 bg-background/70">
                      <CardContent className="py-3 flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" /> {activeRecipe.servings} porții
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
