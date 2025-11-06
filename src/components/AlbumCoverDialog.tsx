import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Trash2, Image as ImageIcon } from 'lucide-react';

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
}

interface AlbumCoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album: CoverDialogAlbum | null;
  onSave: (updates: { title?: string; cover?: string }) => void;
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

  React.useEffect(() => {
    setTitle(album?.title || '');
    setCoverUrl(album?.cover || '');
  }, [album?.id]);

  if (!album) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editează album</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div>
              <Label htmlFor="album-title">Titlu album</Label>
              <Input id="album-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label className="block">Copertă</Label>
              {/* Upload from device */}
              <div className="flex items-center gap-2">
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
                      }
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Eroare la încărcarea imaginii');
                    } finally {
                      setUploading(false);
                      // Reset input so selecting the same file again triggers change
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button type="button" variant="secondary" disabled={uploading} onClick={() => document.getElementById('cover-file')?.click()}>
                  {uploading ? 'Se încarcă…' : 'Încarcă din dispozitiv'}
                </Button>
                <span className="text-xs text-muted-foreground">sau alege din lucrările albumului</span>
              </div>
              {/* Manual URL as fallback (optional) */}
              <div className="mt-2">
                <Label htmlFor="cover-url" className="text-xs text-muted-foreground">sau setează manual URL (opțional)</Label>
                <Input id="cover-url" placeholder="https://..." value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
              </div>
              {coverUrl && (
                <div className="mt-2">
                  <img src={coverUrl} alt="Previzualizare copertă" className="w-full max-w-sm h-40 object-cover rounded border border-border" />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Sugestie: folosește un URL de pe Cloudinary pentru o livrare rapidă a imaginilor.</p>
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
            <div>
              <Button onClick={() => onSave({ title, cover: coverUrl })}>Salvează</Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Conținut album</p>
            <div className="max-h-[50vh] overflow-auto space-y-2 pr-1">
              {album.artworks.map((art) => (
                <Card key={art.id}>
                  <CardContent className="p-2 flex items-center gap-2">
                    <img src={art.image} alt={art.title} className="w-12 h-12 object-cover rounded" />
                    <span className="flex-1 truncate text-sm" title={art.title}>{art.title}</span>
                    <Button size="icon" variant="ghost" title="Setează ca copertă" onClick={() => setCoverUrl(art.image)}>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlbumCoverDialog;
