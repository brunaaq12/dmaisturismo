import { useEffect, useRef, useState } from "react";
import { publicationsApi, type Publication } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const PublicationsPanel = () => {
  const [items, setItems] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const load = async () => {
    setLoading(true);
    publicationsApi.list().then(setItems).catch(() => toast.error("Erro ao carregar publicações")).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl) { toast.error("URL da imagem é obrigatória"); return; }
    if (!trimmedUrl.startsWith("http")) { toast.error("URL deve começar com http:// ou https://"); return; }
    try {
      await publicationsApi.create({ title: title || undefined, image_url: trimmedUrl });
      toast.success("Publicação criada"); setTitle(""); setImageUrl(""); load();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta publicação?")) return;
    try { await publicationsApi.delete(id); toast.success("Excluído"); load(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">Publicações</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Imagens que aparecerão no carrossel da página inicial.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div><Label>Título (opcional)</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Praia do Forte" /></div>
          <div><Label>URL da imagem *</Label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." /></div>
          <Button onClick={handleCreate} className="bg-gradient-gold text-primary hover:opacity-90">Adicionar</Button>
        </div>
        <p className="text-xs text-muted-foreground">Use URLs públicas de imagens (Cloudflare Images, R2, Imgur, etc.). Exemplo: https://example.com/image.jpg</p>
        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <div key={it.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <img src={it.image_url} alt={it.title || "Publicação"} className="h-48 w-full object-cover" />
                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{it.title || <em className="text-muted-foreground">Sem título</em>}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
