import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, Plus, Search, Filter, Book, FileText, Heart, Calendar, Eye, Edit, Trash2, Undo2, AlignLeft, AlignCenter, AlignRight, Bold, Italic, RotateCcw, RotateCw, Settings2, Trash, X, Save, Album, Grid3X3, List } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { AlbumNameDialog } from '@/components/AlbumNameDialog';
import { AlbumCard } from '@/components/AlbumCard';
import { DragDropIndicator } from '@/components/DragDropIndicator';

interface WritingPiece {
  id: number;
  title: string;
  // allow dynamic types/moods managed by admin
  type: string;
  content: string;
  excerpt: string;
  wordCount: number;
  dateWritten: string;
  lastModified: string;
  tags: string[];
  mood: string;
  isPrivate?: boolean;
  published?: boolean;
  deletedAt?: string;
}

interface Album {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  itemIds: number[];
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
    lastModified: '2024-06-15',
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
    wordCount: 87,
    dateWritten: '2024-03-20',
    lastModified: '2024-03-22',
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
    wordCount: 47,
    dateWritten: '2024-10-05',
    lastModified: '2024-10-05',
    tags: ['toamnă', 'melancolie', 'natura', 'nostalgie'],
    mood: 'melancholic',
    published: true
  },
  {
    id: 4,
    title: 'Dragostea din Ianuarie',
    type: 'poetry',
    content: `În ianuarie rece și tăcut,
Inima mea a început să cânte,
Căci te-am întâlnit pe tine, iubitul,
Și totul s-a făcut mai frumos decât înainte.

Zăpada căzea încet pe ferestre,
Dar în sufletul meu era primăvară,
Ochii tăi albaștri ca cerul senin,
Îmi luminau calea spre fericire adevărată.`,
    excerpt: 'În ianuarie rece și tăcut, Inima mea a început să cânte...',
    wordCount: 52,
    dateWritten: '2024-01-14',
    lastModified: '2024-01-14',
    tags: ['dragoste', 'iarnă', 'romantism'],
    mood: 'joyful',
    published: true
  },
  {
    id: 5,
    title: 'Călătoria prin Timp',
    type: 'short-story',
    content: `Mașina timpului era mai simplă decât îmi imaginasem. Un cadru metalic cu niște fire și cristale stranii. Profesorul Smith mă privea cu un zâmbet enigmatic.

"Ești gata pentru călătoria ta prin istorie?" m-a întrebat.

Nu eram sigur, dar curiozitatea era mai puternică decât frica. Am pășit în interiorul mașinii și totul s-a schimbat...`,
    excerpt: 'Mașina timpului era mai simplă decât îmi imaginasem...',
    wordCount: 76,
    dateWritten: '2024-04-12',
    lastModified: '2024-04-13',
    tags: ['sci-fi', 'aventură', 'timp'],
    mood: 'contemplative',
    published: false
  },
  {
    id: 6,
    title: 'Șoapte de Vânt',
    type: 'poetry',
    content: `Vântul șoptește prin crengile goale,
Povestiri de demult uitate,
Sufletele care au trecut pe-aici,
Și-au lăsat urmele în eternitate.

Ascult cu inima deschisă,
Cuvintele purtate de briză,
Fiecare sunet e o amintire,
Fiecare ecou, o surpriză.`,
    excerpt: 'Vântul șoptește prin crengile goale, Povestiri de demult uitate...',
    wordCount: 44,
    dateWritten: '2024-07-23',
    lastModified: '2024-07-23',
    tags: ['natură', 'vânt', 'amintiri'],
    mood: 'nostalgic',
    published: true
  },
  {
    id: 7,
    title: 'Cafeneaua de pe Colț',
    type: 'short-story',
    content: `Cafeneaua de pe colț avea ceva special. Nu era doar mirosul de cafea proaspătă sau muzica jazz care se scurgea lin din boxe. Era atmosfera, oamenii, poveștile care se țeseau la fiecare masă.

Maria, proprietara, știa numele fiecărui client regulat și comanda lui preferată. Ea era sufletul locului, femeia care făcea din acel spațiu mic un univers întreg.`,
    excerpt: 'Cafeneaua de pe colț avea ceva special...',
    wordCount: 94,
    dateWritten: '2024-08-15',
    lastModified: '2024-08-16',
    tags: ['viață urbană', 'oameni', 'atmosferă'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 8,
    title: 'Ultimul Dans',
    type: 'poetry',
    content: `Muzica încet se stinge,
Lumina se face slabă,
E ultimul dans al serii,
Și inima mea suspină.

Te țin strâns în brațe,
Știind că va fi ultimul,
Timpul ne desparte încet,
Dar dragostea rămâne eternă.`,
    excerpt: 'Muzica încet se stinge, Lumina se face slabă...',
    wordCount: 38,
    dateWritten: '2024-09-03',
    lastModified: '2024-09-03',
    tags: ['dragoste', 'despărțire', 'dans'],
    mood: 'melancholic',
    published: false
  },
  {
    id: 9,
    title: 'Grădina Secretă',
    type: 'essay',
    content: `Fiecare dintre noi are o grădină secretă în suflet. Un loc unde plantăm visurile, unde udăm speranțele și unde recoltăm amintirile frumoase.

În grădina mea cresc flori de toate culorile. Sunt florile momentelor fericite, ale întâlnirilor importante, ale realizărilor de care sunt mândru. Dar sunt și buruieni - regretele și temerile care încearcă să sufoc frumusețea.`,
    excerpt: 'Fiecare dintre noi are o grădină secretă în suflet...',
    wordCount: 89,
    dateWritten: '2024-05-28',
    lastModified: '2024-05-30',
    tags: ['filosofie', 'introspecție', 'metaforă'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 10,
    title: 'Zborul Pescărușului',
    type: 'poetry',
    content: `Pescărușul zboară liber,
Deasupra valurilor albe,
Nu știe de griji sau dureri,
Doar simte briza care-l poartă.

Aș vrea să fiu ca el,
Să zbor fără destinație,
Să mă las dus de vânt,
Să găsesc în zbor eliberarea.`,
    excerpt: 'Pescărușul zboară liber, Deasupra valurilor albe...',
    wordCount: 42,
    dateWritten: '2024-06-30',
    lastModified: '2024-06-30',
    tags: ['libertate', 'natură', 'zbor'],
    mood: 'joyful',
    published: true
  },
  {
    id: 11,
    title: 'Scrisoarea Nescrisă',
    type: 'short-story',
    content: `De zece ani păstrez în sertar o scrisoare nescrisă. E adresată ție, celui care ai plecat fără să spui nimic. În fiecare zi mă gândesc să o scriu, dar cuvintele se împotmolesc în gât.

Ce să-ți spun? Că îmi lipsești? Că îmi pare rău pentru cearta noastră? Că aș da orice să te văd din nou zâmbind? Toate acestea și multe altele se învârt în mintea mea, dar hârtia rămâne albă.`,
    excerpt: 'De zece ani păstrez în sertar o scrisoare nescrisă...',
    wordCount: 112,
    dateWritten: '2024-02-14',
    lastModified: '2024-02-15',
    tags: ['regret', 'prietenie', 'comunicare'],
    mood: 'melancholic',
    published: false
  },
  {
    id: 12,
    title: 'Cafeaua de Dimineață',
    type: 'essay',
    content: `Există ceva magic în prima cană de cafea a zilei. E momentul când mintea se trezește încet, când gândurile încep să se așeze în ordine și când ziua îți dezvăluie posibilitățile.

Stau la fereastră și privesc orașul care se trezește. Oamenii grăbiți, mașinile în trafic, viața care își reia cursul. În această liniște a dimineții, cu cafeaua caldă în mâini, totul pare posibil.`,
    excerpt: 'Există ceva magic în prima cană de cafea a zilei...',
    wordCount: 95,
    dateWritten: '2024-11-02',
    lastModified: '2024-11-02',
    tags: ['dimineață', 'ritual', 'reflecție'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 13,
    title: 'Marea și Visurile',
    type: 'poetry',
    content: `Marea cântă mereu aceeași melodie,
Valurile și-au găsit ritmul perfect,
Fiecare undă poartă o poveste,
Fiecare spumă, un vis neîmplinit.

Stau pe țărm și ascult,
Cum îmi șoptește secretele adâncului,
Cum îmi vorbește despre eternitate,
Cum mă îndeamnă să visez mai mult.`,
    excerpt: 'Marea cântă mereu aceeași melodie, Valurile și-au găsit ritmul perfect...',
    wordCount: 51,
    dateWritten: '2024-07-08',
    lastModified: '2024-07-08',
    tags: ['mare', 'visuri', 'natură', 'eternitate'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 14,
    title: 'Amintiri din Copilărie',
    type: 'short-story',
    content: `Casa bunicilor avea mirosul acela special pe care nu-l voi uita niciodată. Lemn vechi, flori uscate și prăjituri de sâmbătă. În fiecare vară mă întorceam acolo ca într-un refugiu magic.

Bunicul îmi povestea despre războiul din tinerețe, bunica mă învăța să fac cozonac. Erau zile lungi și calde, fără griji, când timpul părea că stă în loc și fericirea era ceva de la sine înțeles.`,
    excerpt: 'Casa bunicilor avea mirosul acela special pe care nu-l voi uita niciodată...',
    wordCount: 108,
    dateWritten: '2024-08-20',
    lastModified: '2024-08-21',
    tags: ['copilărie', 'bunici', 'amintiri', 'nostalgie'],
    mood: 'nostalgic',
    published: true
  },
  {
    id: 15,
    title: 'Dansul Frunzelor',
    type: 'poetry',
    content: `Frunzele dansează în vânt,
Ca niște balerini nebuni,
Învârtindu-se spre cer,
Apoi căzând ușor pe păpădii.

Privesc acest spectacol,
Și înțeleg frumusețea schimbării,
Cum totul se transformă,
Cum nimic nu rămâne neschimbat.`,
    excerpt: 'Frunzele dansează în vânt, Ca niște balerini nebuni...',
    wordCount: 39,
    dateWritten: '2024-10-12',
    lastModified: '2024-10-12',
    tags: ['frunze', 'dans', 'schimbare', 'natură'],
    mood: 'joyful',
    published: true
  },
  {
    id: 16,
    title: 'Prietenia Adevărată',
    type: 'essay',
    content: `Prietenia adevărată e ca un comori rar găsit. Nu e măsurată în numărul de mesaje trimise sau în frecvența întâlnirilor. E în acele momente când cineva te înțelege fără cuvinte.

Am învățat că prietenii adevărați sunt cei care rămân lângă tine când totul pare să meargă prost, care îți spun adevărul chiar când doare, care îți celebrează succesele fără gelozie.`,
    excerpt: 'Prietenia adevărată e ca un comori rar găsit...',
    wordCount: 87,
    dateWritten: '2024-09-15',
    lastModified: '2024-09-16',
    tags: ['prietenie', 'relații', 'adevăr', 'loialitate'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 17,
    title: 'Noaptea Înstelată',
    type: 'poetry',
    content: `Sub cerul înstelat stau și privesc,
Miliarde de lumini îndepărtate,
Fiecare stea o lume necunoscută,
Fiecare constelație, o poveste.

Mă simt atât de mic și totuși,
În același timp, parte din totul,
Legat de univers printr-un fir invizibil,
Care mă face să mă simt acasă.`,
    excerpt: 'Sub cerul înstelat stau și privesc, Miliarde de lumini îndepărtate...',
    wordCount: 48,
    dateWritten: '2024-06-25',
    lastModified: '2024-06-25',
    tags: ['noapte', 'stele', 'univers', 'conexiune'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 18,
    title: 'Călătorul Singur',
    type: 'short-story',
    content: `Trenul către necunoscut pleca în fiecare dimineață la ora șapte. Am stat luni întregi și m-am uitat la el, întrebându-mă unde duc șinele acelea și ce se întâmplă cu oamenii care urcă în el.

Într-o zi am luat decizia. Am cumpărat un bilet fără destinație și am urcat. Nu știam unde mă duc, dar pentru prima dată în viață simțeam că trăiesc cu adevărat.`,
    excerpt: 'Trenul către necunoscut pleca în fiecare dimineață la ora șapte...',
    wordCount: 95,
    dateWritten: '2024-04-03',
    lastModified: '2024-04-04',
    tags: ['călătorie', 'aventură', 'necunoscut', 'libertate'],
    mood: 'joyful',
    published: true
  },
  {
    id: 19,
    title: 'Răspunsuri în Ceai',
    type: 'essay',
    content: `Ceaiul are o magie aparte. Nu e doar băutura caldă care îți încălzește corpul într-o zi rece. E ritualul, e pauza, e momentul când îți permiți să te oprești din goană și să respiri.

În fiecare cană de ceai se ascund răspunsuri. La întrebări pe care nici măcar nu știai că le ai. E suficient să bei încet, să simți căldura, să lași mintea să se liniștească.`,
    excerpt: 'Ceaiul are o magie aparte. Nu e doar băutura caldă care îți încălzește corpul...',
    wordCount: 92,
    dateWritten: '2024-11-15',
    lastModified: '2024-11-15',
    tags: ['ceai', 'ritual', 'liniște', 'răspunsuri'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 20,
    title: 'Ultimul Petec de Zăpadă',
    type: 'poetry',
    content: `Ultimul petec de zăpadă se topește,
Sub soarele timid de martie,
Iarna își ia rămas bun încet,
Lăsând loc primăverii să înflorească.

Privesc cum dispare,
Acest ultim martor al frigului,
Și simt cum în inimă se naște,
Un nou început, o nouă speranță.`,
    excerpt: 'Ultimul petec de zăpadă se topește, Sub soarele timid de martie...',
    wordCount: 43,
    dateWritten: '2024-03-15',
    lastModified: '2024-03-15',
    tags: ['primăvară', 'schimbare', 'speranță', 'nou început'],
    mood: 'joyful',
    published: true
  }
];

const CreativeWriting: React.FC = () => {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [searchInAlbums, setSearchInAlbums] = useState(false);
  const [selectedWriting, setSelectedWriting] = useState<WritingPiece | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  
  // Mobile view state - add view mode selector for mobile
  const [mobileViewMode, setMobileViewMode] = useState<'writings' | 'albums'>('writings');
  const [mobileCurrentPage, setMobileCurrentPage] = useState(0);
  const [mobileItemsPerPage] = useState(4); // fewer items per page on mobile
  
  // Mobile album pagination
  const [mobileAlbumCurrentPage, setMobileAlbumCurrentPage] = useState(0);
  const [mobileAlbumsPerPage] = useState(2); // 2 albums per page on mobile
  
  // Scroll position memory for mobile
  const [writingsScrollPosition, setWritingsScrollPosition] = useState(0);
  
  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Long press handling for mobile
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  
  // Individual card swipe for delete
  const [cardSwipeState, setCardSwipeState] = useState<{[key: number]: {startX: number, currentX: number, isDragging: boolean}}>({});
  const [deletingCard, setDeletingCard] = useState<number | null>(null);
  
  const writingsGridRef = useRef<HTMLDivElement | null>(null);

  // make writings editable in local state (mock persists in-memory only)
  const [writings, setWritings] = useState<WritingPiece[]>(mockWritings);
  
  // albums state (must be declared early to avoid temporal dead zone)
  const [albums, setAlbums] = useState<Album[]>([]);
  
  // trash state for deleted items (24h retention)
  const [trashedWritings, setTrashedWritings] = useState<WritingPiece[]>([]);

  // Pagination for main writings grid (2 rows; columns depend on viewport)
  const [currentPage, setCurrentPage] = useState(0);
  const [columns, setColumns] = useState(3);
  const [itemsPerPage, setItemsPerPage] = useState(6); // columns * 2

  // admin-managed type and mood lists
  const [types, setTypes] = useState<Array<{ key: string; label: string }>>([
    { key: 'poetry', label: 'Poezie' },
    { key: 'short-story', label: 'Povestire' },
    { key: 'essay', label: 'Eseu' },
    { key: 'article', label: 'Articol' },
    { key: 'song-lyrics', label: 'Versuri' }
  ]);
  const [moods, setMoods] = useState<Array<{ key: string; label: string }>>([
    { key: 'melancholic', label: 'Melancolic' },
    { key: 'joyful', label: 'Vesel' },
    { key: 'contemplative', label: 'Contemplativ' },
    { key: 'passionate', label: 'Pasional' },
    { key: 'nostalgic', label: 'Nostalgic' }
  ]);

  // editor dialog state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WritingPiece | null>(null);
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [isManageMoodsOpen, setIsManageMoodsOpen] = useState(false);
  const [newTypeKey, setNewTypeKey] = useState('');
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newMoodKey, setNewMoodKey] = useState('');
  const [newMoodLabel, setNewMoodLabel] = useState('');
  
  // Edit dialog states
  const [editingType, setEditingType] = useState<{ key: string; label: string } | null>(null);
  const [editingMood, setEditingMood] = useState<{ key: string; label: string } | null>(null);

  // helper: normalize string removing diacritics and lowercase
  const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  // Swipe handling for mobile
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Swipe changes between writings and albums view modes
    if (isLeftSwipe && mobileViewMode === 'writings') {
      // Swipe left from writings goes to albums
      setMobileViewMode('albums');
    }
    
    if (isRightSwipe && mobileViewMode === 'albums') {
      // Swipe right from albums goes back to writings
      setMobileViewMode('writings');
    }
  };

  // Long press handlers for mobile context menu
  const onTouchStartLongPress = (e: React.TouchEvent, writing: WritingPiece) => {
    if (!isMobile) return;
    
    const timer = setTimeout(() => {
      setIsLongPressing(true);
      setContextMenu({ open: true, x: e.touches[0].clientX, y: e.touches[0].clientY, writingId: writing.id });
      setContextTargetWriting(writing);
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
  };

  const onTouchEndLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setTimeout(() => {
      setIsLongPressing(false);
    }, 100);
  };

  // Individual card swipe handlers for delete
  const onCardTouchStart = (e: React.TouchEvent, writingId: number) => {
    if (!isMobile || isLongPressing) return;
    
    const touch = e.touches[0];
    setCardSwipeState(prev => ({
      ...prev,
      [writingId]: {
        startX: touch.clientX,
        currentX: touch.clientX,
        isDragging: false
      }
    }));
  };

  const onCardTouchMove = (e: React.TouchEvent, writingId: number) => {
    if (!isMobile || isLongPressing) return;
    
    const touch = e.touches[0];
    const state = cardSwipeState[writingId];
    if (!state) return;

    const deltaX = touch.clientX - state.startX;
    
    setCardSwipeState(prev => ({
      ...prev,
      [writingId]: {
        ...state,
        currentX: touch.clientX,
        isDragging: Math.abs(deltaX) > 10
      }
    }));
  };

  const onCardTouchEnd = (writingId: number) => {
    if (!isMobile || isLongPressing) return;
    
    const state = cardSwipeState[writingId];
    if (!state) return;

    const deltaX = state.currentX - state.startX;
    const isLeftSwipe = deltaX < -80; // threshold for delete

    if (isLeftSwipe) {
      // Delete animation and action
      setDeletingCard(writingId);
      setTimeout(() => {
        // Move to trash
        const writing = writings.find(w => w.id === writingId);
        if (writing) {
          setTrashedWritings(prev => [...prev, { ...writing, deletedAt: new Date().toISOString() }]);
          setWritings(prev => prev.filter(w => w.id !== writingId));
          toast({ title: 'Șters', description: 'Scrierea a fost mutată în coșul de gunoi.' });
        }
        setDeletingCard(null);
      }, 300);
    }

    // Reset state
    setCardSwipeState(prev => {
      const newState = { ...prev };
      delete newState[writingId];
      return newState;
    });
  };

  // Get writings that are not in albums and not deleted
  const writingsNotInAlbums = writings.filter(w => {
    if (w.deletedAt) return false;
    return !albums.some(album => album.itemIds.includes(w.id));
  });

  // search across title and content, diacritics-insensitive
  const allVisibleWritings = (isAdmin ? writingsNotInAlbums : writingsNotInAlbums.filter(w => !w.isPrivate)).filter(writing => {
    const term = normalize(searchTerm.trim());
    if (!term) return (filterType === 'all' || writing.type === filterType) && (filterMood === 'all' || writing.mood === filterMood);
    const hay = normalize(writing.title + ' ' + writing.content + ' ' + writing.tags.join(' '));
    return hay.includes(term) && (filterType === 'all' || writing.type === filterType) && (filterMood === 'all' || writing.mood === filterMood);
  });

  // Pagination calculations
  const totalPages = Math.ceil(allVisibleWritings.length / itemsPerPage || 1);
  const visibleWritings = allVisibleWritings.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, filterType, filterMood]);

  // Auto-adjust page when items are removed and current page becomes empty
  useEffect(() => {
    if (currentPage > 0 && visibleWritings.length === 0 && allVisibleWritings.length > 0) {
      const newTotalPages = Math.ceil(allVisibleWritings.length / itemsPerPage || 1);
      setCurrentPage(Math.max(0, newTotalPages - 1));
    }
  }, [allVisibleWritings.length, currentPage, visibleWritings.length, itemsPerPage]);
  
  // Add itemsPerPage as dependency for pagination effect
  useEffect(() => {}, [itemsPerPage]);
  

  // Search results from albums when enabled
  const albumSearchResults = searchInAlbums && searchTerm.trim() ? 
    albums.flatMap(album => {
      const albumWritings = writings.filter(w => album.itemIds.includes(w.id) && !w.deletedAt);
      const filteredWritings = (isAdmin ? albumWritings : albumWritings.filter(w => !w.isPrivate)).filter(writing => {
        const term = normalize(searchTerm.trim());
        const hay = normalize(writing.title + ' ' + writing.content + ' ' + writing.tags.join(' '));
        return hay.includes(term) && (filterType === 'all' || writing.type === filterType) && (filterMood === 'all' || writing.mood === filterMood);
      });
      
      return filteredWritings.map(writing => ({
        ...writing,
        _albumInfo: { id: album.id, name: album.name, color: album.color }
      }));
    }) : [];

  // Get first verse/line from content for preview
  const getFirstVerse = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    const lines = plainText.split('\n').filter(line => line.trim());
    return lines.slice(0, 2).join(' ').substring(0, 120) + (lines.length > 2 ? '...' : '');
  };

  // Update excerpt for new writings
  const updateWritingExcerpt = (writing: WritingPiece): WritingPiece => {
    if (!writing.excerpt || writing.excerpt.length < 50) {
      return {
        ...writing,
        excerpt: getFirstVerse(writing.content)
      };
    }
    return writing;
  };

  // word count helper: counts words in plain text (improved)
  const countWords = (htmlOrText: string) => {
    if (!htmlOrText) return 0;
    // Remove HTML tags and get plain text
    const text = htmlOrText.replace(/<[^>]*>/g, '').trim();
    if (!text) return 0;
    // Split by whitespace and filter out empty strings
    const words = text.split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  const openEditorFor = (w: WritingPiece | null) => {
    setEditing(w ? { ...w } : null);
    setIsEditorOpen(true);
    // set contenteditable content when dialog opens (handled in effect below)
  };

  // save from editor
  const saveEditing = () => {
    if (!editing) return;
    const contentHtml = editorRef.current?.innerHTML || editing.content;
    const plainTextWordCount = countWords(contentHtml);
    const now = new Date().toISOString().slice(0,10);
    const updated: WritingPiece = { 
      ...editing, 
      content: contentHtml, 
      excerpt: getFirstVerse(contentHtml), // Auto-generate excerpt
      wordCount: plainTextWordCount,
      lastModified: now,
      dateWritten: editing.dateWritten || now
    };
    setWritings(ws => {
      if (ws.some(w => w.id === updated.id)) {
        return ws.map(w => w.id === updated.id ? updated : w);
      }
      // new item: assign new id
      const nextId = Math.max(0, ...ws.map(w => w.id)) + 1;
      updated.id = nextId;
      return [updated, ...ws];
    });
    setIsEditorOpen(false);
    toast({ title: 'Salvat', description: 'Textul a fost salvat în bibliotecă.' });
  };

  // manage types/moods add/remove
  const addType = () => {
    if (!newTypeKey || !newTypeLabel) return;
    setTypes(t => [...t, { key: newTypeKey, label: newTypeLabel }]);
    setNewTypeKey(''); setNewTypeLabel('');
  };
  const removeType = (key: string) => setTypes(t => t.filter(i => i.key !== key));
  const addMood = () => {
    if (!newMoodKey || !newMoodLabel) return;
    setMoods(m => [...m, { key: newMoodKey, label: newMoodLabel }]);
    setNewMoodKey(''); setNewMoodLabel('');
  };
  const removeMood = (key: string) => setMoods(m => m.filter(i => i.key !== key));

  // when editor opens, populate contentEditable
  useEffect(() => {
    if (isEditorOpen) {
      requestAnimationFrame(() => {
        if (editorRef.current) {
          // For new writing (id === 0), always start with empty content
          if (editing?.id === 0) {
            editorRef.current.innerHTML = '';
          } else {
            // For existing writings, load draft if exists
            const draftKey = editing ? `cw_draft_${editing.id}` : 'cw_draft_new';
            const draft = localStorage.getItem(draftKey);
            editorRef.current.innerHTML = draft ?? editing?.content ?? '';
          }
        }
      });
    }
  }, [isEditorOpen, editing]);

  // responsive columns based on actual grid width (ensures exactly 2 rows visible)
  useEffect(() => {
  const targetCardMin = 250; // increased base card width for larger cards
  const maxColumns = 12;
    const calc = () => {
      const el = writingsGridRef.current;
      if (!el) return;
      const style = window.getComputedStyle(el);
      const gap = parseFloat(style.columnGap || '20');
      const width = el.clientWidth;
      // compute columns by subtracting gaps progressively
      let cols = Math.floor((width + gap) / (targetCardMin + gap));
      cols = Math.max(1, Math.min(maxColumns, cols));
  // Force maximum columns at breakpoints for better card sizing
  if (width >= 1000 && cols < 4) cols = 4;
  if (width >= 1180 && cols < 5) cols = 5; // standard laptop ~1280 inc margin
  if (width < 2100 && cols > 5) cols = 5; // limit to 5 columns on Full HD (1920px)
  if (width >= 2100 && cols < 6) cols = 6; // wider desktop for very large screens
  if (width >= 2500 && cols < 7) cols = 7; // ultra wide screens
      setColumns(cols);
      setItemsPerPage(cols * 2); // exactly 2 rows
    };
    calc();
    const obs = new ResizeObserver(() => calc());
    if (writingsGridRef.current) obs.observe(writingsGridRef.current);
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('resize', calc);
      obs.disconnect();
    };
  }, []);


  // persistence: load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cw_writings');
    if (saved) setWritings(JSON.parse(saved));
    const st = localStorage.getItem('cw_types');
    if (st) setTypes(JSON.parse(st));
    const sm = localStorage.getItem('cw_moods');
    if (sm) setMoods(JSON.parse(sm));
    const sa = localStorage.getItem('cw_albums');
    if (sa) setAlbums(JSON.parse(sa));
    const trash = localStorage.getItem('cw_trash');
    if (trash) setTrashedWritings(JSON.parse(trash));
    
    // Clean up old trash (older than 24h)
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    setTrashedWritings(items => items.filter(item => {
      if (!item.deletedAt) return false;
      return new Date(item.deletedAt).getTime() > oneDayAgo;
    }));
  }, []);

  // save on changes
  useEffect(() => { localStorage.setItem('cw_writings', JSON.stringify(writings)); }, [writings]);
  useEffect(() => { localStorage.setItem('cw_types', JSON.stringify(types)); }, [types]);
  useEffect(() => { localStorage.setItem('cw_moods', JSON.stringify(moods)); }, [moods]);
  useEffect(() => { localStorage.setItem('cw_albums', JSON.stringify(albums)); }, [albums]);
  useEffect(() => { localStorage.setItem('cw_trash', JSON.stringify(trashedWritings)); }, [trashedWritings]);

  // Reset mobile page when search/filter changes
  useEffect(() => {
    setMobileCurrentPage(0);
    setMobileAlbumCurrentPage(0);
  }, [searchTerm, filterType, filterMood, mobileViewMode]);

  // Save and restore scroll position when switching views on mobile
  useEffect(() => {
    if (isMobile) {
      const saveCurrentScroll = () => {
        if (mobileViewMode === 'writings') {
          setWritingsScrollPosition(window.scrollY);
        }
      };

      // Save scroll position before view change
      if (mobileViewMode === 'albums') {
        // Restore writings scroll position when switching back to writings
        setTimeout(() => {
          window.scrollTo(0, writingsScrollPosition);
        }, 100);
      } else {
        // Save current scroll when on writings
        window.addEventListener('scroll', saveCurrentScroll);
      }

      return () => {
        window.removeEventListener('scroll', saveCurrentScroll);
      };
    }
  }, [mobileViewMode, isMobile, writingsScrollPosition]);

  // (albums state moved up)

  // drag/drop state
  const dragItemId = useRef<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [dragOverType, setDragOverType] = useState<'merge' | 'move-left' | 'move-right' | null>(null);
  const [dragOverAlbumId, setDragOverAlbumId] = useState<string | null>(null);

  // trash dialog state
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'success' | 'info';
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [albumNameDialog, setAlbumNameDialog] = useState<{
    open: boolean;
    sourceId: number | null;
    targetId: number | null;
  }>({
    open: false,
    sourceId: null,
    targetId: null
  });
  // Context menu for right-click on a writing
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number; writingId: number | null }>({ open: false, x: 0, y: 0, writingId: null });
  const [contextTargetWriting, setContextTargetWriting] = useState<WritingPiece | null>(null);
  const [hoveredAlbumSubmenu, setHoveredAlbumSubmenu] = useState(false);

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu.open) {
        // Don't close on right-click events that are opening a context menu
        if (e.type === 'contextmenu') {
          return;
        }
        setContextMenu({ open: false, x: 0, y: 0, writingId: null });
        setHoveredAlbumSubmenu(false);
      }
    };

    if (contextMenu.open) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [contextMenu.open]);

  // helper to start editor with autosave drafts
  const startNewEditing = () => {
    // Clear any existing draft for new writing
    localStorage.removeItem('cw_draft_new');
    
    openEditorFor({
      id: 0,
      title: '',
      type: (types[0] && types[0].key) || 'poetry',
      content: '',
      excerpt: '',
      wordCount: 0,
      dateWritten: new Date().toISOString().slice(0,10),
      lastModified: new Date().toISOString().slice(0,10),
      tags: [],
      mood: (moods[0] && moods[0].key) || 'contemplative',
      published: false
    });
  };

  // autosave draft every 2s when editor open
  useEffect(() => {
    if (!isEditorOpen) return;
    const id = setInterval(() => {
      if (!editorRef.current) return;
      const html = editorRef.current.innerHTML;
      const draftKey = editing ? `cw_draft_${editing.id}` : 'cw_draft_new';
      localStorage.setItem(draftKey, html);
    }, 2000);
    return () => clearInterval(id);
  }, [isEditorOpen, editing]);

  // save on unload
  useEffect(() => {
    const handler = () => {
      if (isEditorOpen && editorRef.current) {
        const draftKey = editing ? `cw_draft_${editing.id}` : 'cw_draft_new';
        localStorage.setItem(draftKey, editorRef.current.innerHTML);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isEditorOpen, editing]);

  // editor undo/redo via execCommand
  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  // drag-and-drop handlers (improved)
  const onDragStart = (e: React.DragEvent, id: number) => {
    dragItemId.current = id;
    e.dataTransfer.setData('text/plain', String(id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOverCard = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const draggedId = dragItemId.current;
    if (!draggedId || draggedId === targetId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Determine drop zone based on mouse position
    if (x < width * 0.2) {
      setDragOverType('move-left');
      setDragOverId(targetId);
    } else if (x > width * 0.8) {
      setDragOverType('move-right'); 
      setDragOverId(targetId);
    } else {
      setDragOverType('merge');
      setDragOverId(targetId);
    }
  };

  const onDropOnCard = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const sourceId = dragItemId.current;
    dragItemId.current = null;
    setDragOverId(null);
    setDragOverType(null);

    if (!sourceId || sourceId === targetId) return;

    if (dragOverType === 'merge') {
      // Open album creation dialog
      setAlbumNameDialog({
        open: true,
        sourceId,
        targetId
      });
    } else {
      // Reorder writings
      const direction = dragOverType === 'move-left' ? 'before' : 'after';
      setWritings(ws => {
        const copy = [...ws];
        const sourceIndex = copy.findIndex(w => w.id === sourceId);
        const targetIndex = copy.findIndex(w => w.id === targetId);
        
        if (sourceIndex === -1 || targetIndex === -1) return ws;
        
        const [item] = copy.splice(sourceIndex, 1);
        const insertIndex = direction === 'before' ? targetIndex : targetIndex + 1;
        copy.splice(insertIndex > sourceIndex ? insertIndex - 1 : insertIndex, 0, item);
        
        return copy;
      });
    }
  };

  const onDragLeave = () => {
    setDragOverId(null);
    setDragOverType(null);
  };

  const onDropOnAlbum = (e: React.DragEvent, albumId: string) => {
    e.preventDefault();
    const sourceId = Number(e.dataTransfer.getData('text/plain'));
    if (!sourceId) return;

    // Check if writing is already in the target album
    const targetAlbum = albums.find(album => album.id === albumId);
    if (targetAlbum?.itemIds.includes(sourceId)) {
      // Writing is already in this album, don't show success message
      return;
    }

    // Remove writing from all other albums (move, don't copy)
    setAlbums(albums => albums.map(album => {
      if (album.id === albumId) {
        // Add to target album
        return { ...album, itemIds: Array.from(new Set([...album.itemIds, sourceId])) };
      } else {
        // Remove from any other albums
        return { ...album, itemIds: album.itemIds.filter(id => id !== sourceId) };
      }
    }));
    
    setDragOverAlbumId(null);
    toast({ 
      title: 'Succes', 
      description: 'Scrierea a fost mutată în album.' 
    });
  };

  const createAlbumFromWritings = (name: string, color: string) => {
    const { sourceId, targetId } = albumNameDialog;
    if (!sourceId || !targetId) return;
    const newAlbum: Album = {
      id: String(Date.now()),
      name,
      color,
      itemIds: [sourceId, targetId]
    };

    setAlbums(albs => [newAlbum, ...albs]);
    setAlbumNameDialog({ open: false, sourceId: null, targetId: null });
    toast({ 
      title: 'Album creat', 
      description: `Albumul "${name}" a fost creat cu succes.` 
    });
  };

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

  const deleteWriting = (writingId: number) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmă ștergerea',
      message: 'Ești sigur că vrei să muți această scriere în coșul de gunoi?',
      type: 'warning',
      confirmText: 'Mută în coș',
      cancelText: 'Anulează',
      onConfirm: () => {
        const writing = writings.find(w => w.id === writingId);
        if (writing) {
          // Move to trash
          setTrashedWritings(trash => [...trash, { ...writing, deletedAt: new Date().toISOString() }]);
          // Remove from writings
          setWritings(ws => ws.filter(w => w.id !== writingId));
          // Remove from albums as well
          setAlbums(albums => albums.map(album => ({
            ...album,
            itemIds: album.itemIds.filter(id => id !== writingId)
          })));
          toast({ 
            title: 'Mutat în coș', 
            description: 'Scrierea a fost mutată în coșul de gunoi.' 
          });
        }
      }
    });
  };

  const deleteAlbumAndWritings = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    setConfirmDialog({
      open: true,
      title: 'Confirmă ștergerea albumului',
      message: `Ești sigur că vrei să ștergi albumul "${album.name}" și toate scrierile din el? Acestea vor fi mutate în coșul de gunoi.`,
      type: 'warning', 
      confirmText: 'Șterge totul',
      cancelText: 'Anulează',
      onConfirm: () => {
        // Move all writings in album to trash
        const writingsToTrash = writings.filter(w => album.itemIds.includes(w.id));
        setTrashedWritings(trash => [
          ...trash, 
          ...writingsToTrash.map(w => ({ ...w, deletedAt: new Date().toISOString() }))
        ]);
        // Remove writings from main list
        setWritings(ws => ws.filter(w => !album.itemIds.includes(w.id)));
        // Remove album
        setAlbums(albums => albums.filter(a => a.id !== albumId));
        toast({
          title: 'Album șters',
          description: 'Albumul și scrierile au fost mutate în coșul de gunoi.'
        });
      }
    });
  };

  const discardAlbum = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    setConfirmDialog({
      open: true,
      title: 'Desfă albumul',
      message: `Ești sigur că vrei să desfaci albumul "${album.name}"? Scrierile se vor întoarce în biblioteca principală.`,
      type: 'info',
      confirmText: 'Desfă albumul',
      cancelText: 'Anulează',
      onConfirm: () => {
        // Just remove the album, writings stay in the main list
        setAlbums(albums => albums.filter(a => a.id !== albumId));
        toast({
          title: 'Album desfăcut',
          description: 'Scrierile au fost returnate în biblioteca principală.'
        });
      }
    });
  };

  const editAlbum = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    const newName = window.prompt('Nume nou pentru album:', album.name);
    if (!newName || newName === album.name) return;

    setAlbums(albums => albums.map(a => 
      a.id === albumId ? { ...a, name: newName } : a
    ));
    
    toast({
      title: 'Album actualizat',
      description: 'Numele albumului a fost schimbat cu succes.'
    });
  };

  const addWritingsToAlbum = (albumId: string, writingIds: number[]) => {
    setAlbums(albums => albums.map(a => 
      a.id === albumId 
        ? { ...a, itemIds: [...a.itemIds, ...writingIds] }
        : a
    ));
    
    toast({
      title: 'Scrieri adăugate',
      description: `${writingIds.length} scrieri au fost adăugate în album.`
    });
  };

  const removeWritingFromAlbum = (albumId: string, writingId: number) => {
    setAlbums(albums => albums.map(a => 
      a.id === albumId 
        ? { ...a, itemIds: a.itemIds.filter(id => id !== writingId) }
        : a
    ));
    
    toast({
      title: 'Scriere scoasă din album',
      description: 'Scrierea a fost returnată în biblioteca principală.'
    });
  };

  const deleteWritingFromAlbum = (albumId: string, writingId: number) => {
    // First remove from album
    setAlbums(albums => albums.map(a => 
      a.id === albumId 
        ? { ...a, itemIds: a.itemIds.filter(id => id !== writingId) }
        : a
    ));
    
    // Then delete the writing (move to trash)
    deleteWriting(writingId);
  };

  const updateAlbum = (albumId: string, updates: { name?: string; color?: string; itemIds?: number[] }) => {
    setAlbums(albums => albums.map(a => 
      a.id === albumId ? { ...a, ...updates } : a
    ));
    
    if (updates.name || updates.color) {
      toast({
        title: 'Album actualizat',
        description: 'Modificările au fost salvate cu succes.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-6">
  <div className="mx-auto w-full max-w-[1600px]">
          {/* Header */}
          <div className="text-center mb-6 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-3">
              <PenTool className="h-6 w-6 text-art-accent" />
              <h1 className="text-2xl font-bold gradient-text">
                Scriere Creativă
              </h1>
            </div>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Poezii, povestiri și texte creative din sufletul unui visător
            </p>
          </div>

          {/* Controls - responsive: expandable on mobile, normal on desktop */}
          <div className="mb-2">
            {isMobile ? (
              /* Mobile: Expandable search controls */
              <div className="bg-surface/30 backdrop-blur-sm rounded-lg p-3 border-art-accent/20 border shadow-lg">
                <div className="flex items-center gap-2">
                  {/* Expandable Search Input */}
                  <div className={`relative transition-all duration-300 ${
                    isSearchExpanded ? 'flex-1' : 'flex-1'
                  }`}>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={searchInAlbums ? "Caută în toate scrierile..." : "Caută scrieri..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setIsSearchExpanded(true)}
                      onBlur={() => {
                        if (!searchTerm) setIsSearchExpanded(false);
                      }}
                      className="pl-10 h-9 bg-background/50 border-art-accent/30 focus:border-art-accent/50"
                    />
                  </div>
                  
                  {/* Controls that hide when search is expanded */}
                  <div className={`flex items-center gap-2 transition-all duration-300 ${
                    isSearchExpanded ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                  }`}>
                    {/* Combined Filter Button */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                        className="px-3 h-8 border-art-accent/30 hover:border-art-accent/50"
                      >
                        <Filter className="h-4 w-4" />
                        {(filterType !== 'all' || filterMood !== 'all') && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-art-accent rounded-full"></div>
                        )}
                      </Button>
                      
                      {/* Filter Dropdown */}
                      {isFilterDropdownOpen && (
                        <div 
                          className="absolute top-10 right-0 z-[60] bg-background border border-art-accent/30 rounded-lg shadow-lg p-3 min-w-[200px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">Tip scriere</Label>
                              <Select value={filterType} onValueChange={(value) => {
                                if (value === '__manage_types') {
                                  setIsManageTypesOpen(true);
                                  setIsFilterDropdownOpen(false);
                                } else {
                                  setFilterType(value);
                                }
                              }}>
                                <SelectTrigger className="h-8 mt-1">
                                  <SelectValue placeholder="Tip" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Toate tipurile</SelectItem>
                                  {types.map(t => (<SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>))}
                                  {isAdmin && (
                                    <SelectItem value="__manage_types">
                                      <div className="flex items-center gap-2">
                                        <Settings2 className="h-3 w-3" />
                                        Gestionează tipuri
                                      </div>
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">Stare/Mood</Label>
                              <Select value={filterMood} onValueChange={(value) => {
                                if (value === '__manage_moods') {
                                  setIsManageMoodsOpen(true);
                                  setIsFilterDropdownOpen(false);
                                } else {
                                  setFilterMood(value);
                                }
                              }}>
                                <SelectTrigger className="h-8 mt-1">
                                  <SelectValue placeholder="Stare" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Toate</SelectItem>
                                  {moods.map(m => (<SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>))}
                                  {isAdmin && (
                                    <SelectItem value="__manage_moods">
                                      <div className="flex items-center gap-2">
                                        <Settings2 className="h-3 w-3" />
                                        Gestionează stări
                                      </div>
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="pt-2 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setFilterType('all');
                                  setFilterMood('all');
                                  setIsFilterDropdownOpen(false);
                                }}
                                className="w-full h-7 text-xs"
                              >
                                Resetează filtrele
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Album Toggle */}
                    <Button
                      variant={searchInAlbums ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchInAlbums(!searchInAlbums)}
                      className="px-3 h-8 border-art-accent/30 hover:border-art-accent/50"
                      title="Caută în albume"
                    >
                      <Album className="h-4 w-4" />
                    </Button>
                    
                    {/* Actions */}
                    {isAdmin && (
                      <>
                        <Button 
                          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 shadow-md px-3 h-8"
                          onClick={startNewEditing}
                          title="Adaugă text nou"
                        >
                          <PenTool className="h-4 w-4" />
                        </Button>
                        {trashedWritings.length > 0 && (
                          <Button 
                            variant="outline" 
                            onClick={() => setIsTrashOpen(true)}
                            title="Coșul de gunoi"
                            className="px-3 h-8 flex items-center gap-1"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="text-xs bg-red-500 text-white rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                              {trashedWritings.length}
                            </span>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop: Original single-row layout */
              <div className="animate-slide-up">
                <div className="bg-surface/30 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Search bar with integrated toggle */}
                    <div className="flex items-center gap-4 flex-1 lg:max-w-lg">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={searchInAlbums ? "Caută în toate scrierile..." : "Caută scrieri..."}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-28 w-full"
                        />
                        
                        {/* Album toggle - integrated inside search bar */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-xs cursor-pointer whitespace-nowrap">
                          <span className="text-muted-foreground select-none hidden sm:inline">În albume</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              id="searchInAlbums"
                              checked={searchInAlbums}
                              onChange={(e) => setSearchInAlbums(e.target.checked)}
                              className="sr-only"
                            />
                            <label 
                              htmlFor="searchInAlbums"
                              className={`relative inline-block w-8 h-4 rounded-full transition-colors cursor-pointer ${
                                searchInAlbums 
                                  ? 'bg-gradient-to-r from-primary to-primary/80' 
                                  : 'bg-muted border border-muted-foreground/20'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${
                                searchInAlbums ? 'translate-x-4' : 'translate-x-0.5'
                              }`} />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filters and actions */}
                    <div className="flex items-center gap-2 lg:gap-3">
                      {/* Filters */}
                      <Select value={filterType} onValueChange={(value) => {
                        if (value === '__manage_types') {
                          setIsManageTypesOpen(true);
                        } else {
                          setFilterType(value);
                        }
                      }}>
                        <SelectTrigger className="w-[140px] sm:w-[160px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Toate tipurile" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toate tipurile</SelectItem>
                          {types.map(t => (<SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>))}
                          {isAdmin && (
                            <SelectItem value="__manage_types">
                              <div className="flex items-center gap-2">
                                <Settings2 className="h-3 w-3" />
                                Gestionează tipuri
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>

                      <Select value={filterMood} onValueChange={(value) => {
                        if (value === '__manage_moods') {
                          setIsManageMoodsOpen(true);
                        } else {
                          setFilterMood(value);
                        }
                      }}>
                        <SelectTrigger className="w-[120px] sm:w-[140px]">
                          <SelectValue placeholder="Toate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toate</SelectItem>
                          {moods.map(m => (<SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>))}
                          {isAdmin && (
                            <SelectItem value="__manage_moods">
                              <div className="flex items-center gap-2">
                                <Settings2 className="h-3 w-3" />
                                Gestionează stări
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>

                      {/* Actions */}
                      {isAdmin && (
                        <>
                          <Button 
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 shadow-md flex-shrink-0"
                            onClick={startNewEditing}
                            title="Adaugă text nou"
                          >
                            <PenTool className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Adaugă text</span>
                            <span className="sm:hidden">Nou</span>
                          </Button>
                          {trashedWritings.length > 0 && (
                            <Button 
                              variant="outline" 
                              onClick={() => setIsTrashOpen(true)}
                              title="Coșul de gunoi"
                              className="flex-shrink-0"
                            >
                              <Trash className="h-4 w-4" />
                              <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                                {trashedWritings.length}
                              </span>
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Click outside to close filter dropdown - only for mobile */}
            {isMobile && isFilterDropdownOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsFilterDropdownOpen(false)}
              />
            )}
          </div>

          {/* Mobile View Selector - only on mobile */}
          {isMobile && (
            <div className="mb-6">
              <div className="flex items-center justify-center">
                <div className="flex bg-muted/50 rounded-lg p-1">
                  <button
                    onClick={() => setMobileViewMode('writings')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      mobileViewMode === 'writings'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    Scrieri ({writingsNotInAlbums.length})
                  </button>
                  <button
                    onClick={() => setMobileViewMode('albums')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      mobileViewMode === 'albums'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Book className="h-4 w-4" />
                    Albume ({albums.length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Writings Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text">
              {isMobile 
                ? (mobileViewMode === 'writings' ? 'Scrieri' : 'Albume')
                : 'Scrieri'
              }
            </h2>
            {/* Add total count */}
            <span className="text-xs text-muted-foreground">
              Total: {isMobile 
                ? (mobileViewMode === 'writings' ? writingsNotInAlbums.length : albums.length)
                : writingsNotInAlbums.length
              }
            </span>
          </div>

          {/* Main Content Area */}
          {isMobile ? (
            // Mobile Layout
            <div 
              className="space-y-4 mb-6"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {mobileViewMode === 'writings' ? (
                // Mobile Writings - narrow rectangular cards
                <>
                  {(isMobile ? allVisibleWritings : visibleWritings).map((writing, index) => (
                    <div
                      key={writing.id}
                      className="relative"
                      draggable={isAdmin}
                      onDragStart={(e) => onDragStart(e, writing.id)}
                      onDragOver={(e) => onDragOverCard(e, writing.id)}
                      onDrop={(e) => onDropOnCard(e, writing.id)}
                      onDragLeave={onDragLeave}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ open: true, x: e.clientX, y: e.clientY, writingId: writing.id });
                        setContextTargetWriting(writing);
                      }}
                      onTouchStart={(e) => {
                        onTouchStartLongPress(e, writing);
                        onCardTouchStart(e, writing.id);
                      }}
                      onTouchMove={(e) => onCardTouchMove(e, writing.id)}
                      onTouchEnd={() => {
                        onTouchEndLongPress();
                        onCardTouchEnd(writing.id);
                      }}
                      onTouchCancel={() => {
                        onTouchEndLongPress();
                        onCardTouchEnd(writing.id);
                      }}
                      style={{
                        transform: cardSwipeState[writing.id]?.isDragging 
                          ? `translateX(${Math.min(0, cardSwipeState[writing.id].currentX - cardSwipeState[writing.id].startX)}px)`
                          : deletingCard === writing.id 
                            ? 'translateX(-100%)' 
                            : 'translateX(0)',
                        transition: cardSwipeState[writing.id]?.isDragging || deletingCard === writing.id 
                          ? 'transform 0.3s ease-out' 
                          : 'none',
                        opacity: deletingCard === writing.id ? 0 : 1
                      }}
                    >
                      {/* Drag Drop Indicator */}
                      {dragOverId === writing.id && (
                        <DragDropIndicator 
                          type={dragOverType!} 
                          isActive={true} 
                          context="list"
                        />
                      )}
                      <Card 
                        className={`cursor-pointer group border-art-accent/20 hover:border-art-accent/50 animate-scale-in ${
                          dragOverId === writing.id ? 'ring-2 ring-offset-2 ring-art-accent/40' : ''
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => setSelectedWriting(writing)}
                      >
                        <CardContent className="p-3 relative">
                          {/* Tag in top-right corner */}
                          <div className="absolute top-2 right-2">
                            <Badge 
                              variant="secondary"
                              className="text-xs"
                            >
                              {getTypeLabel(writing.type)}
                            </Badge>
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold text-base line-clamp-2 leading-tight mb-2 pr-16">
                            {writing.title}
                          </h3>
                          
                          {/* Preview text */}
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-3 leading-relaxed">
                            {writing.excerpt}
                          </p>
                          
                          {/* Bottom meta: date | wordcount */}
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {writing.lastModified} | {writing.wordCount} cuvinte
                            </div>
                            {isAdmin && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setEditing(writing); 
                                  setIsEditorOpen(true); 
                                }}
                                title="Editează"
                                className="h-6 w-6 p-0 flex-shrink-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </>
              ) : (
                // Mobile Albums view - properly mobile-friendly
                <div className="space-y-4 mb-6 px-2">
                  {/* Mobile Add Album button */}
                  {isAdmin && (
                    <div className="mb-6">
                      <Button 
                        onClick={() => setAlbumNameDialog({ open: true, sourceId: null, targetId: null })}
                        className="bg-art-accent hover:bg-art-accent/80 w-full"
                        size="lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Creează Album Nou
                      </Button>
                    </div>
                  )}

                  {/* Mobile Albums Grid */}
                  {albums.length > 0 ? (
                    albums.slice(mobileAlbumCurrentPage * mobileAlbumsPerPage, (mobileAlbumCurrentPage + 1) * mobileAlbumsPerPage).map((album) => (
                      <div key={album.id} className="mx-2">
                        <AlbumCard
                          album={album}
                          writings={writings.filter(w => album.itemIds.includes(w.id) && !w.deletedAt)}
                          allWritings={writings.filter(w => !w.deletedAt)}
                          onDrop={onDropOnAlbum}
                          onWritingClick={setSelectedWriting}
                          onEditWriting={(writing) => {
                            setEditing(writing);
                            setIsEditorOpen(true);
                          }}
                          onUpdateAlbum={(albumId, updates) => {
                            setAlbums(prev => prev.map(a => 
                              a.id === albumId ? { ...a, ...updates } : a
                            ));
                          }}
                          onDeleteAlbum={(albumId) => {
                            setAlbums(prev => prev.filter(a => a.id !== albumId));
                          }}
                          onAddWritingsToAlbum={(albumId, writingIds) => {
                            setAlbums(prev => prev.map(a => 
                              a.id === albumId 
                                ? { ...a, itemIds: Array.from(new Set([...(a.itemIds || []), ...writingIds])) }
                                : a
                            ));
                          }}
                          onRemoveWritingFromAlbum={(albumId, writingId) => {
                            setAlbums(prev => prev.map(a => 
                              a.id === albumId 
                                ? { ...a, itemIds: (a.itemIds || []).filter(id => id !== writingId) }
                                : a
                            ));
                          }}
                          onDeleteWritingFromAlbum={(albumId, writingId) => {
                            // Move writing to trash
                            const writing = writings.find(w => w.id === writingId);
                            if (writing) {
                              setTrashedWritings(prev => [...prev, { ...writing, deletedAt: new Date().toISOString() }]);
                              setWritings(prev => prev.filter(w => w.id !== writingId));
                            }
                          }}
                          isAdmin={isAdmin}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nu există albume create încă</p>
                      {isAdmin && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Folosește butonul de mai sus pentru a crea primul album
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mobile Album pagination dots */}
                  {albums.length > mobileAlbumsPerPage && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      {Array.from({ length: Math.ceil(albums.length / mobileAlbumsPerPage) }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setMobileAlbumCurrentPage(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === mobileAlbumCurrentPage 
                              ? 'bg-art-accent w-6' 
                              : 'bg-art-accent/30'
                          }`}
                          aria-label={`Go to album page ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Desktop Layout - existing grid
            <>
              <div
                ref={writingsGridRef}
                className="writings-grid grid gap-5 md:gap-6 mb-6"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {visibleWritings.map((writing, index) => (
                  <div
                    key={writing.id}
                    className="relative w-full h-full"
                    draggable={isAdmin}
                    onDragStart={(e) => onDragStart(e, writing.id)}
                    onDragOver={(e) => onDragOverCard(e, writing.id)}
                    onDrop={(e) => onDropOnCard(e, writing.id)}
                    onDragLeave={onDragLeave}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ open: true, x: e.clientX, y: e.clientY, writingId: writing.id });
                      setContextTargetWriting(writing);
                    }}
                  >
                    {/* Drag Drop Indicator */}
                    {dragOverId === writing.id && (
                      <DragDropIndicator 
                        type={dragOverType!} 
                        isActive={true} 
                      />
                    )}
                    <Card 
                      className={`hover-scale cursor-pointer group border-art-accent/20 hover:border-art-accent/50 animate-scale-in h-full flex flex-col min-h-[240px] ${
                        dragOverId === writing.id ? 'ring-2 ring-offset-2 ring-art-accent/40' : ''
                      }`
                      }
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => setSelectedWriting(writing)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getTypeIcon(writing.type)}
                            <CardTitle className="text-base font-semibold line-clamp-2 leading-tight">{writing.title}</CardTitle>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1 ml-2 flex-shrink-0">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setEditing(writing); 
                                  setIsEditorOpen(true); 
                                }}
                                title="Editează"
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col p-4">
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed flex-1">
                          {writing.excerpt}
                        </p>
                        <div className="space-y-2 mt-auto">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <Book className="h-3 w-3" />
                                {writing.wordCount} cuvinte
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {writing.lastModified}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant="outline"  
                              className={`${getMoodColor(writing.mood)} text-xs`}
                            >
                              {getMoodLabel(writing.mood)}
                            </Badge>
                            <Badge 
                              variant="secondary"
                              className="text-xs"
                            >
                              {getTypeLabel(writing.type)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {/* Album search results */}
                {searchInAlbums && albumSearchResults.map((writing: WritingPiece & { _albumInfo?: { id: string; name?: string; color?: string } }, index) => (
                  <div
                    key={`album-${writing.id}`}
                    className="relative w-full h-full"
                  >
                    <Card 
                      className="hover-scale cursor-pointer group animate-scale-in border-2 h-full flex flex-col"
                      style={{ 
                        animationDelay: `${(visibleWritings.length + index) * 100}ms`,
                        borderColor: writing._albumInfo?.color || '#7c3aed'
                      }}
                      onClick={() => setSelectedWriting(writing)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            {getTypeIcon(writing.type)}
                            <CardTitle className="text-lg line-clamp-2">{writing.title}</CardTitle>
                          </div>
                          <div className="flex flex-col gap-1 ml-2">
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                borderColor: writing._albumInfo?.color || '#7c3aed',
                                color: writing._albumInfo?.color || '#7c3aed'
                              }}
                            >
                              {writing._albumInfo?.name}
                            </Badge>
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
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {writing.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Book className="h-3 w-3" />
                              {writing.wordCount} cuvinte
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {writing.lastModified}
                            </span>
                          </div>
                          <Badge 
                            variant="outline"  
                            className={getMoodColor(writing.mood)}
                          >
                            {getMoodLabel(writing.mood)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Desktop Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mb-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="px-3"
                  >
                    ←
                  </Button>
                  
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index)}
                        className={`w-8 h-8 rounded-full text-sm transition-all duration-200 ${
                          index === currentPage 
                            ? 'bg-primary text-primary-foreground shadow-lg' 
                            : 'bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-3"
                  >
                    →
                  </Button>
                </div>
              )}
            </>
          )}

          {allVisibleWritings.length === 0 && (
            <div className="text-center py-12 mb-8">
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
                <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedWriting.content }} />
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Editor Modal */}
      <Dialog open={isEditorOpen} onOpenChange={(open) => { if (!open) setIsEditorOpen(false); }}>
        <DialogContent className={`${isMobile ? 'max-w-full h-full w-full m-0 p-0 border-0 rounded-none' : 'max-w-3xl w-full'}`}>
          {isMobile ? (
            // Mobile fullscreen editor - redesigned like note app
            <div className="flex flex-col h-full bg-background">
              {/* Mobile header - clean and minimal */}
              <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
                <div className="text-sm font-medium text-center">
                  {editing?.title || 'Text nou'}
                </div>
                <Button 
                  onClick={saveEditing} 
                  size="sm" 
                  className="rounded-full p-2 h-8 w-8"
                  title="Salvează"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Mobile content area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Filters bar - horizontal scroll */}
                <div className="p-3 border-b bg-muted/20">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <Select value={editing?.type || types[0]?.key} onValueChange={(v) => setEditing(ed => ed ? { ...ed, type: v } as WritingPiece : ed)}>
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{types.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={editing?.mood || moods[0]?.key} onValueChange={(v) => setEditing(ed => ed ? { ...ed, mood: v } as WritingPiece : ed)}>
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{moods.map(m => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 px-2 rounded border bg-background">
                      <Switch 
                        checked={!!editing?.published} 
                        onCheckedChange={(checked) => setEditing(ed => ed ? { ...ed, published: checked } : ed)}
                        className="scale-75"
                      />
                      <span className="text-xs">Public</span>
                    </div>
                  </div>
                </div>

                {/* Title input */}
                <div className="p-3">
                  <Input 
                    placeholder="Titlu" 
                    value={editing?.title || ''} 
                    onChange={(e) => setEditing(ed => ed ? { ...ed, title: e.target.value } : ed)}
                    className="border-0 text-xl font-medium bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                  />
                </div>
                
                {/* Text editor */}
                <div className="flex-1 px-3 pb-3">
                  <div 
                    ref={editorRef} 
                    contentEditable 
                    className="w-full h-full p-3 border-0 outline-none resize-none text-base leading-relaxed bg-transparent focus:outline-none [&:empty::before]:content-[attr(data-placeholder)] [&:empty::before]:text-muted-foreground" 
                    data-placeholder="Începe să scrii..."
                    style={{ 
                      minHeight: 'calc(100vh - 200px)',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  />
                </div>

                {/* Bottom toolbar */}
                <div className="p-3 border-t bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => exec('bold')} className="p-2 rounded-full">
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => exec('italic')} className="p-2 rounded-full">
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => exec('undo')} className="p-2 rounded-full">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {countWords(editorRef.current?.innerHTML || editing?.content || '')} cuvinte
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Desktop modal
            <>
              <DialogHeader>
                <DialogTitle>{editing?.id ? 'Editează text' : 'Adaugă text nou'}</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Input placeholder="Titlu" value={editing?.title || ''} onChange={(e) => setEditing(ed => ed ? { ...ed, title: e.target.value } : ed)} />
                  <Select value={editing?.type || types[0]?.key} onValueChange={(v) => setEditing(ed => ed ? { ...ed, type: v } as WritingPiece : ed)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{types.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={editing?.mood || moods[0]?.key} onValueChange={(v) => setEditing(ed => ed ? { ...ed, mood: v } as WritingPiece : ed)}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{moods.map(m => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => exec('bold')} title="Bold">
                    <Bold className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exec('italic')} title="Italic">
                    <Italic className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exec('justifyLeft')} title="Aliniere stânga">
                    <AlignLeft className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exec('justifyCenter')} title="Aliniere centru">
                    <AlignCenter className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exec('justifyRight')} title="Aliniere dreapta">
                    <AlignRight className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exec('undo')} title="Undo">
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exec('redo')} title="Redo">
                    <RotateCw className="h-3 w-3" />
                  </Button>
                </div>

                <div ref={editorRef} contentEditable className="min-h-[220px] p-4 border border-border rounded prose max-w-none" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="published-toggle" className="text-sm font-medium">
                      Publicat
                    </Label>
                    <Switch 
                      id="published-toggle"
                      checked={!!editing?.published} 
                      onCheckedChange={(checked) => setEditing(ed => ed ? { ...ed, published: checked } : ed)} 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">Cuvinte: {countWords(editorRef.current?.innerHTML || editing?.content || '')}</div>
                    <Button variant="outline" onClick={() => { setIsEditorOpen(false); /* autosave handled */ }}>Back</Button>
                    <Button onClick={saveEditing}>Save</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Types Dialog */}
      <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Gestionează tipuri</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            {types.map(t => (
              <Card key={t.key} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.key}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingType({ key: t.key, label: t.label })}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => removeType(t.key)}
                    >
                      Șterge
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="p-4 border-dashed">
              <div className="text-sm font-medium mb-3">Tip nou</div>
              <div className="space-y-3">
                <Input 
                  placeholder="Nume categorie" 
                  value={newTypeLabel} 
                  onChange={(e) => setNewTypeLabel(e.target.value)} 
                />
                <Button 
                  onClick={() => {
                    if (newTypeLabel.trim()) {
                      const key = newTypeLabel.toLowerCase().replace(/\s+/g, '-');
                      addType();
                      setNewTypeLabel('');
                      setNewTypeKey('');
                    }
                  }}
                  className="w-full"
                >
                  Adaugă tip
                </Button>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Type Dialog */}
      <Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editează tip</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-type-name">Nume categorie</Label>
              <Input 
                id="edit-type-name"
                value={editingType?.label || ''} 
                onChange={(e) => setEditingType(prev => prev ? { ...prev, label: e.target.value } : null)} 
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (editingType) {
                    const newKey = editingType.label.toLowerCase().replace(/\s+/g, '-');
                    setTypes(ts => ts.map(x => x.key === editingType.key ? { key: newKey, label: editingType.label } : x));
                    setEditingType(null);
                  }
                }}
                className="flex-1"
              >
                Salvează
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingType(null)}
                className="flex-1"
              >
                Anulează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Moods Dialog */}
      <Dialog open={isManageMoodsOpen} onOpenChange={setIsManageMoodsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Gestionează stări</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            {moods.map(m => (
              <Card key={m.key} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.key}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingMood({ key: m.key, label: m.label })}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => removeMood(m.key)}
                    >
                      Șterge
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="p-4 border-dashed">
              <div className="text-sm font-medium mb-3">Stare nouă</div>
              <div className="space-y-3">
                <Input 
                  placeholder="Nume stare" 
                  value={newMoodLabel} 
                  onChange={(e) => setNewMoodLabel(e.target.value)} 
                />
                <Button 
                  onClick={() => {
                    if (newMoodLabel.trim()) {
                      const key = newMoodLabel.toLowerCase().replace(/\s+/g, '-');
                      addMood();
                      setNewMoodLabel('');
                      setNewMoodKey('');
                    }
                  }}
                  className="w-full"
                >
                  Adaugă stare
                </Button>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Mood Dialog */}
      <Dialog open={!!editingMood} onOpenChange={(open) => !open && setEditingMood(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editează stare</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-mood-name">Nume stare</Label>
              <Input 
                id="edit-mood-name"
                value={editingMood?.label || ''} 
                onChange={(e) => setEditingMood(prev => prev ? { ...prev, label: e.target.value } : null)} 
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (editingMood) {
                    const newKey = editingMood.label.toLowerCase().replace(/\s+/g, '-');
                    setMoods(ms => ms.map(x => x.key === editingMood.key ? { key: newKey, label: editingMood.label } : x));
                    setEditingMood(null);
                  }
                }}
                className="flex-1"
              >
                Salvează
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingMood(null)}
                className="flex-1"
              >
                Anulează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Albums Section - desktop only */}
      {albums.length > 0 && !isMobile && (
        <div className="mt-1 mx-auto w-full max-w-[1600px] pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text">Albume</h2>
            {isAdmin && (
              <Button 
                onClick={() => setAlbumNameDialog({ open: true, sourceId: null, targetId: null })}
                className="bg-art-accent hover:bg-art-accent/80"
              >
                <Plus className="h-4 w-4 mr-2" />
                Album Nou
              </Button>
            )}
          </div>
          
          {isMobile ? (
            <div className="mobile-albums-container">
              <div 
                className="albums-grid grid grid-cols-1 gap-5 mb-6 px-4"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {albums
                  .slice(mobileAlbumCurrentPage * mobileAlbumsPerPage, (mobileAlbumCurrentPage + 1) * mobileAlbumsPerPage)
                  .map(album => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      writings={writings}
                      allWritings={writings}
                      onDrop={onDropOnAlbum}
                      onWritingClick={(writing: WritingPiece) => setSelectedWriting(writing)}
                      onEditWriting={(writing: WritingPiece) => { setEditing(writing); setIsEditorOpen(true); }}
                      isAdmin={isAdmin}
                      onDeleteAlbum={deleteAlbumAndWritings}
                      onEditAlbum={editAlbum}
                      onDiscardAlbum={discardAlbum}
                      onAddWritingsToAlbum={addWritingsToAlbum}
                      onRemoveWritingFromAlbum={removeWritingFromAlbum}
                      onDeleteWritingFromAlbum={deleteWritingFromAlbum}
                      onUpdateAlbum={updateAlbum}
                    />
                  ))}
              </div>
              
              {/* Album pagination dots for mobile */}
              {albums.length > mobileAlbumsPerPage && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  {Array.from({ length: Math.ceil(albums.length / mobileAlbumsPerPage) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setMobileAlbumCurrentPage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === mobileAlbumCurrentPage 
                          ? 'bg-art-accent w-6' 
                          : 'bg-art-accent/30'
                      }`}
                      aria-label={`Go to album page ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="albums-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-5 md:gap-6 mb-6">
              {albums.map(album => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  writings={writings}
                  allWritings={writings}
                  onDrop={onDropOnAlbum}
                  onWritingClick={(writing: WritingPiece) => setSelectedWriting(writing)}
                  onEditWriting={(writing: WritingPiece) => { setEditing(writing); setIsEditorOpen(true); }}
                  isAdmin={isAdmin}
                  onDeleteAlbum={deleteAlbumAndWritings}
                  onEditAlbum={editAlbum}
                  onDiscardAlbum={discardAlbum}
                  onAddWritingsToAlbum={addWritingsToAlbum}
                  onRemoveWritingFromAlbum={removeWritingFromAlbum}
                  onDeleteWritingFromAlbum={deleteWritingFromAlbum}
                  onUpdateAlbum={updateAlbum}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trash Dialog */}
      <Dialog open={isTrashOpen} onOpenChange={setIsTrashOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Trash className="h-5 w-5" />
                Coșul de gunoi ({trashedWritings.length} elemente)
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {trashedWritings.length === 0 ? (
              <div className="text-center py-8">
                <Trash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Coșul de gunoi este gol</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {trashedWritings.map(writing => (
                  <div key={writing.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{writing.title}</h4>
                      <p className="text-sm text-muted-foreground">{writing.excerpt}</p>
                      <p className="text-xs text-muted-foreground">
                        Șters: {writing.deletedAt ? new Date(writing.deletedAt).toLocaleString('ro-RO') : 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Restore writing
                          const restored = { ...writing };
                          delete restored.deletedAt;
                          setWritings(ws => [restored, ...ws]);
                          setTrashedWritings(trash => trash.filter(t => t.id !== writing.id));
                          toast({ title: 'Restaurat', description: 'Scrierea a fost restaurată.' });
                        }}
                      >
                        <Undo2 className="h-3 w-3 mr-1" />
                        Restaurează
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: 'Șterge definitiv',
                            message: 'Ești sigur că vrei să ștergi definitiv această scriere? Această acțiune nu poate fi anulată.',
                            type: 'warning',
                            confirmText: 'Șterge definitiv',
                            cancelText: 'Anulează',
                            onConfirm: () => {
                              setTrashedWritings(trash => trash.filter(t => t.id !== writing.id));
                              toast({ title: 'Șters definitiv', description: 'Scrierea a fost ștearsă definitiv.' });
                            }
                          });
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Șterge definitiv
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {trashedWritings.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Elementele se șterg automat după 24 de ore.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setConfirmDialog({
                      open: true,
                      title: 'Golește coșul',
                      message: 'Ești sigur că vrei să ștergi definitiv toate elementele din coșul de gunoi?',
                      type: 'warning',
                      confirmText: 'Golește coșul',
                      cancelText: 'Anulează',
                      onConfirm: () => {
                        setTrashedWritings([]);
                        toast({ title: 'Coș golit', description: 'Toate elementele au fost șterse definitiv.' });
                        setIsTrashOpen(false);
                      }
                    });
                  }}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Golește coșul
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
      />

      {/* Context menu floating */}
      {contextMenu.open && (
        <>
          <div 
            className="fixed inset-0 z-50" 
            onClick={() => setContextMenu({ open: false, x: 0, y: 0, writingId: null })}
          />
          <div 
            style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 60 }}
          >
          <div className="bg-popover border rounded shadow-md p-1 w-44 backdrop-blur-sm">
            {/* Add to... with hover submenu */}
            <div 
              className="relative"
              onMouseEnter={() => setHoveredAlbumSubmenu(true)}
              onMouseLeave={() => setHoveredAlbumSubmenu(false)}
            >
              <button className="w-full text-left p-2 hover:bg-muted/50 flex items-center justify-between transition-colors">
                Adaugă în...
                <Plus className="h-3 w-3" />
              </button>
              
              {/* Submenu */}
              {hoveredAlbumSubmenu && (
                <div className="absolute left-full top-0 ml-1 w-48 bg-popover border rounded shadow-lg p-1 backdrop-blur-sm z-70">
                  {albums.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">Nu există albume</div>
                  ) : (
                    albums.map(album => (
                      <button
                        key={album.id}
                        onClick={() => {
                          if (!contextTargetWriting) return;
                          setAlbums(albs => albs.map(al => 
                            al.id === album.id 
                              ? { ...al, itemIds: Array.from(new Set([...(al.itemIds||[]), contextTargetWriting.id])) } 
                              : al
                          ));
                          setContextMenu({ open: false, x: 0, y: 0, writingId: null });
                          toast({ title: 'Adăugat', description: `Scrierea a fost adăugată în "${album.name}".` });
                        }}
                        className="w-full text-left p-2 hover:bg-muted/50 text-sm transition-colors flex items-center gap-2"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: album.color || '#7c3aed' }}
                        />
                        {album.name}
                        <span className="text-xs text-muted-foreground ml-auto">
                          ({album.itemIds.length})
                        </span>
                      </button>
                    ))
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      if (!contextTargetWriting) return;
                      const albumName = window.prompt('Nume album nou:');
                      if (!albumName) return;
                      const newAlbum = {
                        id: String(Date.now()),
                        name: albumName,
                        color: '#7c3aed',
                        itemIds: [contextTargetWriting.id]
                      };
                      setAlbums(albs => [newAlbum, ...albs]);
                      setContextMenu({ open: false, x: 0, y: 0, writingId: null });
                      toast({ title: 'Album creat', description: `Albumul "${albumName}" a fost creat cu scrierea.` });
                    }}
                    className="w-full text-left p-2 hover:bg-muted/50 text-sm transition-colors flex items-center gap-2 text-green-600"
                  >
                    <Plus className="h-3 w-3" />
                    Creează album
                  </button>
                </div>
              )}
            </div>
            
            <button 
              className="w-full text-left p-2 hover:bg-muted/50 transition-colors" 
              onClick={() => {
                const id = contextMenu.writingId;
                if (id == null) return;
                // move to first
                setWritings(ws => {
                  const idx = ws.findIndex(w => w.id === id);
                  if (idx === -1) return ws;
                  const copy = [...ws];
                  const [item] = copy.splice(idx,1);
                  copy.unshift(item);
                  return copy;
                });
                setContextMenu({ open: false, x:0, y:0, writingId: null });
                toast({ title: 'Mutat', description: 'Scrierea a fost mutată prima.' });
              }}
            >
              Mută prima
            </button>
            
            <button 
              className="w-full text-left p-2 hover:bg-muted/50 text-destructive transition-colors" 
              onClick={() => {
                const id = contextMenu.writingId;
                if (id == null) return;
                setContextMenu({ open: false, x:0, y:0, writingId: null });
                deleteWriting(id);
              }}
            >
              Șterge
            </button>
          </div>
          </div>
        </>
      )}

      {/* Album Name Dialog */}
      <AlbumNameDialog
        open={albumNameDialog.open}
        onOpenChange={(open) => setAlbumNameDialog(prev => ({ ...prev, open }))}
        onConfirm={createAlbumFromWritings}
      />
    </div>
  );
};

export default CreativeWriting;