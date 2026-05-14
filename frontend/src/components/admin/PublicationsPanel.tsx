import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Upload } from "lucide-react";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Publication[]>("/publications");
      setItems(data || []);
    } catch (err) {
      toast.error("Erro ao carregar publicações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const response = await api.post<{ id: string; image_url: string }>("/publications", {
            title: title || null,
            image: base64,
            filename: file.name,
          });
          toast.success("Publicação criada");
          setTitle("");
          load();
          if (fileRef.current) fileRef.current.value = "";
        } catch (err: any) {
          toast.error(err.message || "Falha no upload");
        }
      };
      reader.onerror = () => {
        toast.error("Erro ao ler arquivo");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Erro no upload");
    }
  };

  const handleEditTitle = async (id: string, newTitle: string) => {
    try {
      await api.put(`/publications/${id}`, { title: newTitle || null });
      toast.success("Atualizado");
      setEditingId(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string, image_url: string) => {
    if (!confirm("Excluir esta publicação?")) return;
    try {
      await api.delete(`/publications/${id}`);
      toast.success("Excluído");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">Publicações</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Faça upload de imagens que aparecerão no carrossel da página inicial.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <Label>Título (opcional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Praia do Forte" />
          </div>
          <Input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            className="md:w-72"
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1.5 h-4 w-4" /> Selecionar
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
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
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(it.id, it.image_url)}>
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
