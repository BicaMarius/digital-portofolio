import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, Plus, Search, Filter, Book, FileText, Heart, Calendar, Eye } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WritingPiece {
  id: number;
  title: string;
  type: 'poetry' | 'short-story' | 'essay' | 'article' | 'song-lyrics';
  content: string;
  excerpt: string;
  wordCount: number;
  dateWritten: string;
  tags: string[];
  mood: 'melancholic' | 'joyful' | 'contemplative' | 'passionate' | 'nostalgic';
  isPrivate?: boolean;
  published?: boolean;
}

const mockWritings: WritingPiece[] = [
  {
    id: 1,
    title: 'Noapte de Vară',
    type: 'poetry',
    content: `Cerul își deapănă mantia înstelată,
Iar luna, ca o lampă de argint,
Luminează drumul spre inimă încântată,
Unde poezia își află cuvântul.

Șoapte de vânt prin frunzele tremurânde,
Parfumul nopții îmi umple ființa,
Gândurile se fac cântec în minte,
Iar sufletul dansează în tăcere.

O, noapte frumoasă de vară!
Tu îmi ești refugiul și inspirația,
În tine găsesc pacea cea rară,
Și nasc din întuneric lumina.`,
    excerpt: 'Cerul își deapănă mantia înstelată, Iar luna, ca o lampă de argint...',
    wordCount: 89,
    dateWritten: '2024-06-15',
    tags: ['natură', 'noapte', 'inspirație', 'vară'],
    mood: 'contemplative'
  },
  {
    id: 2,
    title: 'Fragmentul Pierdut',
    type: 'short-story',
    content: `Era o zi obișnuită de toamnă când am găsit cartea. Stătea acolo, pe raftul din colțul bibliotecii, ca și cum mă aștepta. Coperta era veche, uzată de timp, dar titlul era încă lizibil: "Amintiri Netrăite".

Am deschis-o cu grijă și am rămas uluit. Paginile conțineau povestea vieții mele, dar nu așa cum o trăisem eu. Era o versiune paralelă, în care fiecare decizie importantă fusese luată diferit...`,
    excerpt: 'Era o zi obișnuită de toamnă când am găsit cartea...',
    wordCount: 1250,
    dateWritten: '2024-03-20',
    tags: ['fantezie', 'mister', 'introspecție'],
    mood: 'contemplative',
    isPrivate: true
  },
  {
    id: 3,
    title: 'Culori de Toamnă',
    type: 'poetry',
    content: `Frunzele pictate în galben și roșu,
Cad încet pe aleile părăsite,
Fiecare pas stârnește un foșnet,
De amintiri în timp rătăcite.

Aerul rece îmi mângâie obrajii,
Iar gândurile se fac melancolice,
Toamna îmi șoptește vechile povești,
De dragoste și doruri nostalgice.`,
    excerpt: 'Frunzele pictate în galben și roșu, Cad încet pe aleile părăsite...',
    wordCount: 64,
    dateWritten: '2024-10-05',
    tags: ['toamnă', 'melancolie', 'natura', 'nostalgie'],
    mood: 'melancholic',
    published: true
  }
];

const CreativeWriting: React.FC = () => {
  const { isAdmin } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [selectedWriting, setSelectedWriting] = useState<WritingPiece | null>(null);

  const visibleWritings = (isAdmin ? mockWritings : mockWritings.filter(writing => !writing.isPrivate))
    .filter(writing => 
      writing.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterType === 'all' || writing.type === filterType) &&
      (filterMood === 'all' || writing.mood === filterMood)
    );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'poetry': return <Heart className="h-4 w-4" />;
      case 'short-story': return <Book className="h-4 w-4" />;
      case 'essay': return <FileText className="h-4 w-4" />;
      case 'article': return <FileText className="h-4 w-4" />;
      case 'song-lyrics': return <Heart className="h-4 w-4" />;
      default: return <PenTool className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'poetry': return 'Poezie';
      case 'short-story': return 'Povestire';
      case 'essay': return 'Eseu';
      case 'article': return 'Articol';
      case 'song-lyrics': return 'Versuri';
      default: return type;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'melancholic': return 'bg-blue-500/20 text-blue-400';
      case 'joyful': return 'bg-yellow-500/20 text-yellow-400';
      case 'contemplative': return 'bg-purple-500/20 text-purple-400';
      case 'passionate': return 'bg-red-500/20 text-red-400';
      case 'nostalgic': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getMoodLabel = (mood: string) => {
    switch (mood) {
      case 'melancholic': return 'Melancolic';
      case 'joyful': return 'Vesel';
      case 'contemplative': return 'Contemplativ';
      case 'passionate': return 'Pasional';
      case 'nostalgic': return 'Nostalgic';
      default: return mood;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <PenTool className="h-8 w-8 text-art-accent" />
              <h1 className="text-4xl font-bold gradient-text">
                Scriere Creativă
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Poezii, povestiri și texte creative din sufletul unui visător
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută scrieri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tip text" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate tipurile</SelectItem>
                <SelectItem value="poetry">Poezie</SelectItem>
                <SelectItem value="short-story">Povestire</SelectItem>
                <SelectItem value="essay">Eseu</SelectItem>
                <SelectItem value="article">Articol</SelectItem>
                <SelectItem value="song-lyrics">Versuri</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterMood} onValueChange={setFilterMood}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Stare" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="melancholic">Melancolic</SelectItem>
                <SelectItem value="joyful">Vesel</SelectItem>
                <SelectItem value="contemplative">Contemplativ</SelectItem>
                <SelectItem value="passionate">Pasional</SelectItem>
                <SelectItem value="nostalgic">Nostalgic</SelectItem>
              </SelectContent>
            </Select>

            {isAdmin && (
              <Button className="bg-art-accent hover:bg-art-accent/80">
                <Plus className="h-4 w-4 mr-2" />
                Adaugă Text
              </Button>
            )}
          </div>

          {/* Writings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleWritings.map((writing, index) => (
              <Card 
                key={writing.id}
                className="hover-scale cursor-pointer group border-art-accent/20 hover:border-art-accent/50 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setSelectedWriting(writing)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {getTypeIcon(writing.type)}
                      <CardTitle className="text-lg line-clamp-2">{writing.title}</CardTitle>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      {writing.isPrivate && !isAdmin && (
                        <Badge variant="outline" className="text-xs">
                          Private
                        </Badge>
                      )}
                      {writing.published && (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          Publicat
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {writing.excerpt}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {writing.tags.slice(0, 3).map((tag) => (
                      <span 
                        key={tag}
                        className="px-2 py-1 bg-art-accent/20 text-art-accent rounded-md text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                    {writing.tags.length > 3 && (
                      <span className="px-2 py-1 bg-muted rounded-md text-xs">
                        +{writing.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Type & Mood */}
                  <div className="flex gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400" variant="outline">
                      {getTypeLabel(writing.type)}
                    </Badge>
                    <Badge className={getMoodColor(writing.mood)} variant="outline">
                      {getMoodLabel(writing.mood)}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Cuvinte</p>
                      <p className="font-semibold text-sm">{writing.wordCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Data
                      </p>
                      <p className="font-semibold text-sm">{writing.dateWritten}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {visibleWritings.length === 0 && (
            <div className="text-center py-12">
              <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nu au fost găsite scrieri</p>
            </div>
          )}
        </div>
      </div>

      {/* Reading Modal */}
      <Dialog open={!!selectedWriting} onOpenChange={() => setSelectedWriting(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedWriting && (
            <div>
              <DialogHeader className="pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl mb-2">{selectedWriting.title}</DialogTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getTypeIcon(selectedWriting.type)}
                        {getTypeLabel(selectedWriting.type)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {selectedWriting.dateWritten}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {selectedWriting.wordCount} cuvinte
                      </div>
                    </div>
                  </div>
                  <Badge className={getMoodColor(selectedWriting.mood)}>
                    {getMoodLabel(selectedWriting.mood)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div className="whitespace-pre-line leading-relaxed">
                  {selectedWriting.content}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Etichete:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedWriting.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="bg-art-accent/10 border-art-accent/20">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreativeWriting;