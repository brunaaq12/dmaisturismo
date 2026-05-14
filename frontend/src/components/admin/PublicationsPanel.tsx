import { useEffect, useState } from "react";
import { api } from "@/lib/api"; // Usando a sua nova ponte para a Cloudflare!
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface Publication {
  id: string;
  title: string | null;
  image_url: string;
  created_at: string;
}

export const PublicationsPanel = () => {
  const [items, setItems] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // Novo campo para o link do Imgur
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // Vai buscar as publicações ao Cloudflare D1
      const data = await api.get<Publication[]>('/publications');
      setItems(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAddPublication = async () => {
    if (!imageUrl) {
      toast.error("O link da imagem é obrigatório!");
      return;
    }

    try {
      // Envia os dados para o seu Cloudflare Worker
      await api.post('/publications', {
        title: title || null,
        image_url: imageUrl
      });
      
      toast.success("Publicação criada com sucesso!");
      setTitle("");
      setImageUrl(""); // Limpa o campo do link
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditTitle = async (id: string, newTitle: string) => {
    try {
      await api.put(`/publications/${id}`, { title: newTitle || null });
      toast.success("Título atualizado!");
      setEditingId(null);
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja excluir esta publicação?")) return;
    
    try {
      await api.delete(`/publications/${id}`);
      toast.success("Excluído com sucesso!");
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">Publicações</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Adicione imagens colando o link direto da internet (ex: Imgur).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end">
          <div>
            <Label>Título (opcional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Praia do Forte" />
          </div>
          <div>
            <Label>Link da Imagem</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://i.imgur.com/suaimagem.jpg"
            />
          </div>
          <Button onClick={handleAddPublication}>
            <LinkIcon className="mr-1.5 h-4 w-4" /> Adicionar
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">A carregar...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma publicação ainda.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <div key={it.id} className="rounded-lg border border-border overflow-hidden bg-card">
                <img src={it.image_url} alt={it.title || "Publicação"} className="h-44 w-full object-cover" />
                <div className="p-3 space-y-2">
                  {editingId === it.id ? (
                    <div className="flex gap-2">
                      <Input
                        defaultValue={it.title || ""}
                        onBlur={(e) => handleEditTitle(it.id, e.target.value)}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="text-sm font-medium truncate">{it.title || "Sem título"}</div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingId(it.id === editingId ? null : it.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(it.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
