import React, { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/contexts/AdminContext';
import { Music2, Disc3, Mic2, Plus, Play, Pause, Download } from 'lucide-react';

interface Track {
  id: number;
  title: string;
  album?: string;
  cover?: string;
  lyrics?: string;
  url?: string;
}

export default function Music() {
  const { isAdmin } = useAdmin();
  const [artists, setArtists] = useState<string[]>(['Tame Impala', 'Bicep', 'Radiohead']);
  const [albums, setAlbums] = useState<string[]>(['Currents', 'Isles', 'In Rainbows']);
  const [tracks, setTracks] = useState<Track[]>([ { id: 1, title: 'Demo Track', album: 'Untitled EP', lyrics: 'Versuri...', url: '' } ]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<Track>({ id: 0, title: '', album: '', cover: '', lyrics: '', url: '' });
  const [isPlaying, setIsPlaying] = useState<number | null>(null);

  const addArtist = (name: string) => {
    if (!name) return;
    setArtists(prev => prev.length >= 10 ? prev : [...prev, name]);
  };

  const addAlbum = (name: string) => {
    if (!name) return;
    setAlbums(prev => prev.length >= 10 ? prev : [...prev, name]);
  };

  const addTrack = () => {
    if (!form.title) return;
    setTracks(prev => [...prev, { ...form, id: Date.now() }]);
    setForm({ id: 0, title: '', album: '', cover: '', lyrics: '', url: '' });
    setShowDialog(false);
  };

  const handleTrackDialogChange = (open: boolean) => {
    setShowDialog(open);
    if (!open) {
      setForm({ id: 0, title: '', album: '', cover: '', lyrics: '', url: '' });
    }
  };

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container text-center space-y-3">
          <h1 className="text-3xl font-bold gradient-text">Muzică</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Topuri rapide și colecție personală cu player modern, similar Spotify.</p>
        </div>
      </section>

      <section className="page-content-section">
        <div className="page-container space-y-6">
          <Tabs defaultValue="artists" className="space-y-4">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="artists">Top artiști</TabsTrigger>
              <TabsTrigger value="albums">Top albume</TabsTrigger>
              <TabsTrigger value="tracks">Piese proprii</TabsTrigger>
            </TabsList>

            <TabsContent value="artists">
              <Card className="bg-muted/30 border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2"><Mic2 className="h-4 w-4" /> Top 10 artiști</CardTitle>
                  {isAdmin && <InlineAdd placeholder="Adaugă artist" onAdd={addArtist} />}
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {artists.map((a, idx) => (
                    <Badge key={idx} variant="outline" className="px-3 py-1 text-sm bg-background/70">#{idx + 1} {a}</Badge>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="albums">
              <Card className="bg-muted/30 border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2"><Disc3 className="h-4 w-4" /> Top 10 albume</CardTitle>
                  {isAdmin && <InlineAdd placeholder="Adaugă album" onAdd={addAlbum} />}
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {albums.map((a, idx) => (
                    <Badge key={idx} variant="outline" className="px-3 py-1 text-sm bg-background/70">#{idx + 1} {a}</Badge>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tracks">
              <div className="flex justify-end mb-3">
                {isAdmin && (
                  <Button className="bg-gradient-to-r from-emerald-600 to-sky-600 text-white" onClick={() => setShowDialog(true)}>
                    <Music2 className="h-4 w-4 mr-2" /> Adaugă piesă
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tracks.map(track => (
                  <Card key={track.id} className="border-border/60 bg-background/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <Music2 className="h-4 w-4" /> {track.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{track.album || 'Single'}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-lg border border-border/60 p-3 bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="ghost" onClick={() => setIsPlaying(prev => prev === track.id ? null : track.id)}>
                            {isPlaying === track.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <div>
                            <p className="text-sm font-semibold">{isPlaying === track.id ? 'Se redă...' : 'Player mock'}</p>
                            <p className="text-xs text-muted-foreground">Streaming + sincronizare versuri (API ready)</p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      {track.lyrics && (
                        <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground max-h-32 overflow-auto">
                          {track.lyrics}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Dialog open={showDialog} onOpenChange={handleTrackDialogChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Adaugă piesă</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Titlu</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Album</Label>
                <Input value={form.album} onChange={e => setForm({ ...form, album: e.target.value })} placeholder="EP / LP" />
              </div>
            </div>
            <div>
              <Label>URL piesă (mp3/wav)</Label>
              <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Versuri</Label>
              <Textarea value={form.lyrics} onChange={e => setForm({ ...form, lyrics: e.target.value })} placeholder="Versuri sincronizabile" rows={4} />
            </div>
            <div>
              <Label>Cover / artwork</Label>
              <Input value={form.cover} onChange={e => setForm({ ...form, cover: e.target.value })} placeholder="URL imagine/video" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Anulează</Button>
            <Button onClick={addTrack} className="bg-gradient-to-r from-emerald-600 to-sky-600 text-white">Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

const InlineAdd = ({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) => {
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-40"
      />
      <Button size="sm" variant="secondary" onClick={() => { onAdd(value.trim()); setValue(''); }}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
