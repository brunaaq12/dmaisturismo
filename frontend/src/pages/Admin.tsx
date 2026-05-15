import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { formatBRL, formatDate, fetchCategories, labelFor } from "@/lib/categories";
import { useCategories } from "@/hooks/useCategories";
import { BookingsPanel } from "@/components/admin/BookingsPanel";
import { AccommodationsReport } from "@/components/admin/AccommodationsReport";
import { PublicationsPanel } from "@/components/admin/PublicationsPanel";

interface PkgType { slug: string; label: string; discount_percent: number; }

interface Pkg {
  id: string; title: string; description: string; location: string;
  category: string; departure_date: string; duration_days: number; price: number;
  total_spots: number; available_spots: number; cover_image: string | null;
  itinerary: string | null; included: string | null; is_active: boolean; is_featured: boolean;
  package_type: string | null;
}

const empty = {
  title: "", description: "", location: "", category: "",
  departure_date: "", duration_days: 1, price: 0, total_spots: 10,
  cover_image: "", itinerary: "", included: "", is_featured: false,
  package_type: "" as string,
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const cats = useCategories();
  const [pkgs, setPkgs] = useState<Pkg[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [form, setForm] = useState(empty);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [pkgTypes, setPkgTypes] = useState<PkgType[]>([]);
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newTypeDiscount, setNewTypeDiscount] = useState<number>(0);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/auth"); return; }
    if (!isAdmin) { toast.error("Acesso restrito a administradores"); nav("/"); return; }
    fetchAll();
  }, [user, isAdmin, loading, nav]);

  const fetchAll = async () => {
    try {
      const [pkgsData, typesData] = await Promise.all([
        api.get<Pkg[]>("/packages"),
        api.get<PkgType[]>("/packages/types").catch(() => [])
      ]);
      setPkgs(pkgsData || []);
      setPkgTypes(typesData || []);
    } catch (err: any) {
      toast.error("Erro ao carregar dados do servidor");
    }
  };

  const addPackageType = async () => {
    const label = newTypeLabel.trim();
    if (label.length < 2) { toast.error("Nome muito curto"); return; }
    const slug = slugify(label);
    try {
      await api.post("/packages/types", { slug, label, discount_percent: newTypeDiscount });
      setNewTypeLabel(""); setNewTypeDiscount(0);
      fetchAll();
      toast.success("Tipo de pacote criado");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const removePackageType = async (slug: string) => {
    if (!confirm(`Excluir o tipo "${slug}"?`)) return;
    try {
      await api.delete(`/packages/types/${slug}`);
      fetchAll();
      toast.success("Tipo removido");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, category: cats[0]?.slug || "" });
    setOpen(true);
  };

  const openEdit = (p: Pkg) => {
    setEditing(p);
    setForm({
      title: p.title, description: p.description, location: p.location,
      category: p.category, departure_date: p.departure_date, duration_days: p.duration_days,
      price: Number(p.price), total_spots: p.total_spots,
      cover_image: p.cover_image || "", itinerary: p.itinerary || "", included: p.included || "",
      is_featured: p.is_featured, package_type: p.package_type || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.description || !form.category) { 
      toast.error("Preencha título, descrição e categoria"); 
      return; 
    }
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        duration_days: Number(form.duration_days),
        total_spots: Number(form.total_spots),
        available_spots: editing ? undefined : Number(form.total_spots),
        is_featured: form.is_featured ? 1 : 0 // Garante formato numérico para o SQLite se necessário
      };

      if (editing) {
        await api.put(`/packages/${editing.id}`, payload);
        toast.success("Pacote atualizado");
      } else {
        await api.post("/packages", payload);
        toast.success("Pacote criado");
      }
      setOpen(false); 
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este pacote?")) return;
    try {
      await api.delete(`/packages/${id}`);
      toast.success("Pacote excluído");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (p: Pkg) => {
    try {
      await api.put(`/packages/${p.id}`, { is_active: !p.is_active });
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const addCategory = async () => {
    const label = newCatLabel.trim();
    if (label.length < 2) { toast.error("Nome muito curto"); return; }
    const slug = slugify(label);
    try {
      await api.post("/packages/categories", { slug, label });
      setNewCatLabel("");
      await fetchCategories(true);
      toast.success("Categoria criada");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const removeCategory = async (slug: string) => {
    if (!confirm(`Excluir a categoria "${slug}"?`)) return;
    try {
      await api.delete(`/packages/categories/${slug}`);
      await fetchCategories(true);
      toast.success("Categoria removida");
    } catch (err: any) {
      toast.error("Não foi possível excluir (em uso).");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">Painel Admin</h1>
            <p className="mt-1 text-muted-foreground">Gerencie a D+ Turismo</p>
          </div>
          <Button onClick={openCreate} className="bg-gradient-gold text-primary hover:opacity-90 shadow-gold">
            <Plus className="mr-1.5 h-4 w-4" /> Novo pacote
          </Button>
        </div>

        <Tabs defaultValue="pacotes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
            <TabsTrigger value="pacotes">Pacotes</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="publicacoes">Fotos/Blog</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="pacotes">
            <div className="grid gap-4">
              {pkgs.map((p) => (
                <Card key={p.id} className="shadow-card-soft overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {p.cover_image && (
                      <div className="w-full md:w-48 h-32 md:h-auto">
                        <img src={p.cover_image} className="w-full h-full object-cover" alt="" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardHeader className="pb-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <CardTitle className="font-serif text-lg flex items-center gap-2">
                              {p.title}
                              {p.is_featured && <Star className="h-4 w-4 fill-accent text-accent" />}
                            </CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline">{labelFor(p.category, cats)}</Badge>
                              <span>{p.location}</span> · <span>{formatDate(p.departure_date)}</span>
                              · <span className="font-bold text-primary">{formatBRL(Number(p.price))}</span>
                              · <span>{p.available_spots}/{p.total_spots} vagas</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant={p.is_active ? "outline" : "secondary"} size="sm" onClick={() => toggleActive(p)}>
                              {p.is_active ? "Ativo" : "Inativo"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground line-clamp-2">
                        {p.description}
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categorias">
             <div className="grid gap-6 lg:grid-cols-2">
               <Card>
                 <CardHeader><CardTitle className="font-serif">Categorias Dinâmicas</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input placeholder="Nova categoria..." value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} />
                      <Button onClick={addCategory}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2">
                      {cats.map(c => (
                        <div key={c.slug} className="flex items-center justify-between p-2 border rounded-md">
                          <span>{c.label}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeCategory(c.slug)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      ))}
                    </div>
                 </CardContent>
               </Card>
               <Card>
                 <CardHeader><CardTitle className="font-serif">Tipos de Oferta (Descontos)</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Input placeholder="Ex: Black Friday" value={newTypeLabel} onChange={(e) => setNewTypeLabel(e.target.value)} />
                      <div className="flex gap-2">
                        <Input type="number" placeholder="Desconto %" value={newTypeDiscount} onChange={(e) => setNewTypeDiscount(Number(e.target.value))} />
                        <Button onClick={addPackageType} className="w-full">Criar Tipo</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {pkgTypes.map(t => (
                        <div key={t.slug} className="flex items-center justify-between p-2 border rounded-md">
                          <span>{t.label} ({t.discount_percent}%)</span>
                          <Button variant="ghost" size="sm" onClick={() => removePackageType(t.slug)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      ))}
                    </div>
                 </CardContent>
               </Card>
             </div>
          </TabsContent>

          <TabsContent value="reservas"><BookingsPanel /></TabsContent>
          <TabsContent value="publicacoes"><PublicationsPanel /></TabsContent>
          <TabsContent value="relatorios"><AccommodationsReport /></TabsContent>
        </Tabs>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editing ? "Editar" : "Novo"} Pacote</DialogTitle>
              <DialogDescription>Preencha os dados abaixo para publicar ou atualizar uma viagem.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Nome da Viagem</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {cats.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo/Oferta (Opcional)</Label>
                  <Select value={form.package_type || "none"} onValueChange={(v) => setForm({ ...form, package_type: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue placeholder="Sem oferta" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {pkgTypes.map((t) => <SelectItem key={t.slug} value={t.slug}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Partida</Label>
                  <Input type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Preço (R$)</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Link da Imagem (Imgur)</Label>
                <Input placeholder="https://i.imgur.com/..." value={form.cover_image || ""} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} />
              </div>

              <div className="grid gap-2">
                <Label>Descrição Curta</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/30">
                <Switch id="featured" checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                <Label htmlFor="featured" className="cursor-pointer">Destacar na página inicial</Label>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} className="bg-primary text-white">Salvar Pacote</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Admin;
