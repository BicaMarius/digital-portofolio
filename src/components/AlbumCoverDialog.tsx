import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Trash2, Image as ImageIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

export interface CoverDialogArtwork {
  id: number;
  title: string;
  image: string;
}

export interface CoverDialogAlbum {
  id: number;
  title: string;
  cover: string;
  artworks: CoverDialogArtwork[];
  coverPos?: { x: number; y: number };
}

interface AlbumCoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album: CoverDialogAlbum | null;
  onSave: (updates: { title?: string; cover?: string; coverPos?: { x: number; y: number }; coverScale?: number }) => void;
  onRemoveFromAlbum?: (artworkId: number) => void;
  onDeleteArtwork?: (artworkId: number) => void;
}

export const AlbumCoverDialog: React.FC<AlbumCoverDialogProps> = ({
  open,
  onOpenChange,
  album,
  onSave,
  onRemoveFromAlbum,
  onDeleteArtwork,
}) => {
  const [title, setTitle] = useState(album?.title || '');
  const [coverUrl, setCoverUrl] = useState(album?.cover || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'cover' | 'content'>('cover');
  const [pos, setPos] = useState<{ x: number; y: number }>(album?.coverPos || { x: 50, y: 50 });
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState<number>(1);

  React.useEffect(() => {
    setTitle(album?.title || '');
    setCoverUrl(album?.cover || '');
    setPos(album?.coverPos || { x: 50, y: 50 });
    setZoom((album as any)?.coverScale || 1);
  }, [album?.id]);

  if (!album) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editează album</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="album-title">Titlu album</Label>
            <Input id="album-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'cover' | 'content')}>
            <TabsList>
              <TabsTrigger value="cover">Copertă</TabsTrigger>
              <TabsTrigger value="content">Conținut</TabsTrigger>
            </TabsList>

            <TabsContent value="cover" className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  id="cover-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setError(null);
                    setUploading(true);
                    try {
                      const formData = new FormData();
                      formData.append('file', file);
                      const resp = await fetch('/api/upload/cover', { method: 'POST', body: formData });
                      if (!resp.ok) {
                        const text = await resp.text().catch(() => '');
                        throw new Error(`Upload failed: ${resp.status} ${resp.statusText} ${text}`);
                      }
                      const data = await resp.json();
                      if (data?.url) {
                        setCoverUrl(data.url);
                        setPos({ x: 50, y: 50 });
                      }
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Eroare la încărcarea imaginii');
                    } finally {
                      setUploading(false);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-indigo-600 hover:bg-indigo-600/90 text-white"
                  disabled={uploading}
                  onClick={() => document.getElementById('cover-file')?.click()}
                >
                  {uploading ? 'Se încarcă…' : 'Încarcă din dispozitiv'}
                </Button>
                <span className="text-xs text-muted-foreground">sau alege din lucrările albumului (fila Conținut)</span>
              </div>

              {coverUrl && (
                <div className="mt-1">
                  <div
                    className="w-full max-w-xl h-48 sm:h-64 md:h-72 rounded border border-border overflow-hidden relative select-none"
                    onMouseDown={(e) => { setDragging(true); (e.currentTarget as HTMLDivElement).dataset.dragStartX = String(e.clientX); (e.currentTarget as HTMLDivElement).dataset.dragStartY = String(e.clientY); (e.currentTarget as HTMLDivElement).dataset.startX = String(pos.x); (e.currentTarget as HTMLDivElement).dataset.startY = String(pos.y); }}
                    onMouseMove={(e) => {
                      if (!dragging) return;
                      const el = e.currentTarget as HTMLDivElement;
                      const sx = Number(el.dataset.dragStartX || 0);
                      const sy = Number(el.dataset.dragStartY || 0);
                      const startX = Number(el.dataset.startX || 50);
                      const startY = Number(el.dataset.startY || 50);
                      const dx = e.clientX - sx;
                      const dy = e.clientY - sy;
                      // Heuristic: 2px movement ~ 1% position change
                      const nx = Math.max(0, Math.min(100, startX + dx / 2));
                      const ny = Math.max(0, Math.min(100, startY + dy / 2));
                      setPos({ x: nx, y: ny });
                    }}
                    onMouseUp={() => setDragging(false)}
                    onMouseLeave={() => setDragging(false)}
                    onWheel={(e) => {
                      e.preventDefault();
                      const delta = -e.deltaY; // wheel up to zoom in
                      const step = delta > 0 ? 0.05 : -0.05;
                      setZoom(z => Math.max(0.8, Math.min(2.5, Number((z + step).toFixed(2)))));
                    }}
                    title="Trage pentru a repoziționa"
                  >
                    {/* grid overlay when dragging */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.15) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        opacity: dragging ? 0.35 : 0,
                        transition: 'opacity 150ms',
                        zIndex: 1,
                      }}
                    />
                    <img
                      src={coverUrl}
                      alt="Previzualizare copertă"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: `${pos.x}% ${pos.y}%`, transform: `scale(${zoom})`, transformOrigin: `${pos.x}% ${pos.y}%` }}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
                    <div className="text-xs text-muted-foreground">Centrere: X {Math.round(pos.x)}% · Y {Math.round(pos.y)}%</div>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setZoom(z => Math.max(0.8, Number((z - 0.1).toFixed(2))))}>-</Button>
                      <div className="w-40">
                        <Slider value={[zoom]} min={0.8} max={2.5} step={0.05} onValueChange={(v) => setZoom(v[0])} />
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => setZoom(z => Math.min(2.5, Number((z + 0.1).toFixed(2))))}>+</Button>
                      <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(zoom * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

              <div>
                <Button className="bg-indigo-600 hover:bg-indigo-600/90 text-white" onClick={() => onSave({ title, cover: coverUrl, coverPos: pos, coverPosScale: zoom } as any)}>Salvează</Button>
              </div>
            </TabsContent>

            <TabsContent value="content">
              <div className="max-h-[50vh] overflow-auto space-y-2 pr-1">
                {album.artworks.map((art) => (
                  <Card key={art.id}>
                    <CardContent className="p-2 flex items-center gap-2">
                      <img src={art.image} alt={art.title} className="w-12 h-12 object-cover rounded" />
                      <span className="flex-1 truncate text-sm" title={art.title}>{art.title}</span>
                      <Button size="icon" variant="ghost" className="text-indigo-500 hover:text-indigo-400" title="Setează ca copertă" onClick={() => { setCoverUrl(art.image); setPos({ x: 50, y: 50 }); }}>
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      {onRemoveFromAlbum && (
                        <Button size="icon" variant="ghost" title="Scoate din album" onClick={() => onRemoveFromAlbum(art.id)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteArtwork && (
                        <Button size="icon" variant="destructive" title="Șterge în coș" onClick={() => onDeleteArtwork(art.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {album.artworks.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nicio lucrare în acest album.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlbumCoverDialog;
