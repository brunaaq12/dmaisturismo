import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { packagesApi, categoriesApi, packageTypesApi, type Package, type PackageType } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { fetchCategories } from "@/lib/categories";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { formatBRL, formatDate, labelFor } from "@/lib/categories";
import { useCategories } from "@/hooks/useCategories";
import { BookingsPanel } from "@/components/admin/BookingsPanel";
import { AccommodationsReport } from "@/components/admin/AccommodationsReport";
import { PublicationsPanel } from "@/components/admin/PublicationsPanel";
import { PaymentSettingsPanel } from "@/components/admin/PaymentSettingsPanel";

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
  const [pkgs, setPkgs] = useState<Package[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState(empty);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [pkgTypes, setPkgTypes] = useState<PackageType[]>([]);
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newTypeDiscount, setNewTypeDiscount] = useState<number>(0);
  const [editingTypeSlug, setEditingTypeSlug] = useState<string | null>(null);
  const [editingTypeLabel, setEditingTypeLabel] = useState("");
  const [editingTypeDiscount, setEditingTypeDiscount] = useState<number>(0);
  const [localPreview, setLocalPreview] = useState<string>("");

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/auth"); return; }
    if (!isAdmin) { toast.error("Acesso restrito a administradores"); nav("/"); return; }
    fetchAll();
  }, [user, isAdmin, loading, nav]);

  const fetchAll = async () => {
    try {
      const [p, t] = await Promise.all([packagesApi.all(), packageTypesApi.list()]);
      setPkgs(p);
      setPkgTypes(t);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro ao carregar"); }
  };

  const addPackageType = async () => {
    const label = newTypeLabel.trim();
    if (label.length < 2) { toast.error("Nome muito curto"); return; }
    const slug = slugify(label);
    if (!slug) { toast.error("Nome inválido"); return; }
    const discount = Math.max(0, Math.min(100, Number(newTypeDiscount) || 0));
    try {
      await packageTypesApi.create({ slug, label, discount_percent: discount });
      setNewTypeLabel(""); setNewTypeDiscount(0);
      fetchAll(); toast.success("Tipo de pacote criado");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  const startEditType = (t: PackageType) => {
    setEditingTypeSlug(t.slug);
    setEditingTypeLabel(t.label);
    setEditingTypeDiscount(Number(t.discount_percent));
  };

  const saveEditType = async () => {
    if (!editingTypeSlug) return;
    const label = editingTypeLabel.trim();
    if (label.length < 2) { toast.error("Nome muito curto"); return; }
    const discount = Math.max(0, Math.min(100, Number(editingTypeDiscount) || 0));
    try {
      await packageTypesApi.update(editingTypeSlug, { label, discount_percent: discount });
      setEditingTypeSlug(null);
      fetchAll(); toast.success("Tipo de pacote atualizado");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  const deleteType = async (slug: string) => {
    if (!confirm("Excluir este tipo de pacote?")) return;
    try {
      await packageTypesApi.delete(slug);
      fetchAll(); toast.success("Tipo de pacote removido");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, category: cats[0]?.slug || "" });
    setLocalPreview(""); setOpen(true);
  };
  const openEdit = (p: Package) => {
    setEditing(p);
    setForm({
      title: p.title, description: p.description, location: p.location,
      category: p.category, departure_date: p.departure_date, duration_days: p.duration_days,
      price: Number(p.price), total_spots: p.total_spots,
      cover_image: p.cover_image || "", itinerary: p.itinerary || "", included: p.included || "",
      is_featured: Boolean(p.is_featured), package_type: p.package_type || "",
    });
    setLocalPreview(""); setOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.description || !form.category) { toast.error("Preencha título, descrição e categoria"); return; }
    if (!form.departure_date) { toast.error("Informe a data de partida"); return; }
    try {
      const payload = {
        title: form.title, description: form.description,
        location: form.location || form.title, category: form.category,
        departure_date: form.departure_date, duration_days: Number(form.duration_days),
        price: Number(form.price), total_spots: Number(form.total_spots),
        cover_image: form.cover_image || null, itinerary: form.itinerary || null,
        included: form.included || null, is_featured: form.is_featured,
        package_type: form.package_type || null, gallery: [],
        is_active: true, available_spots: Number(form.total_spots),
      };
      if (editing) {
        await packagesApi.update(editing.id, payload);
        toast.success("Pacote atualizado");
      } else {
        await packagesApi.create(payload);
        toast.success("Pacote criado");
      }
      setOpen(false); fetchAll();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro ao salvar"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este pacote?")) return;
    try { await packagesApi.delete(id); toast.success("Pacote excluído"); fetchAll(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  const toggleActive = async (p: Package) => {
    try { await packagesApi.update(p.id, { is_active: !p.is_active }); fetchAll(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  const addCategory = async () => {
    const label = newCatLabel.trim();
    if (label.length < 2) { toast.error("Nome muito curto"); return; }
    const slug = slugify(label);
    if (!slug) { toast.error("Nome inválido"); return; }
    try {
      await categoriesApi.create(slug, label);
      setNewCatLabel(""); await fetchCategories(true); toast.success("Categoria criada");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  const removeCategory = async (slug: string) => {
    if (!confirm(`Excluir a categoria "${slug}"? Pacotes que a utilizam impedem a exclusão.`)) return;
    try {
      await categoriesApi.delete(slug); await fetchCategories(true); toast.success("Categoria removida");
    } catch { toast.error("Não foi possível excluir (em uso por algum pacote)."); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">Painel Admin</h1>
          <p className="mt-1 text-muted-foreground">Gerencie pacotes, categorias e reservas</p>
        </div>

        <Tabs defaultValue="pacotes">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="pacotes">Pacotes</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="publicacoes">Publicações</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="pacotes" className="mt-6">
            <div className="mb-4 flex justify-end">
              <Button onClick={openCreate} className="bg-gradient-gold text-primary hover:opacity-90 shadow-gold">
                <Plus className="mr-1.5 h-4 w-4" />Novo pacote
              </Button>
            </div>
            <div className="grid gap-4">
              {pkgs.map((p) => (
                <Card key={p.id} className="shadow-card-soft">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="font-serif text-lg flex items-center gap-2">
                          {p.title}{p.is_featured && <Star className="h-4 w-4 fill-accent text-accent" />}
                        </CardTitle>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{labelFor(p.category, cats)}</Badge>
                          <span>{p.location}</span>·<span>{formatDate(p.departure_date)}</span>
                          ·<span>{formatBRL(Number(p.price))}</span>
                          ·<span>{p.available_spots}/{p.total_spots} vagas</span>
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
                  <CardContent className="text-sm text-muted-foreground line-clamp-2">{p.description}</CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categorias" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="font-serif text-xl">Gerenciar categorias</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <Input placeholder="Nome da nova categoria (ex: Lua de mel)" value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} />
                    <Button onClick={addCategory}><Plus className="mr-1.5 h-4 w-4" />Adicionar</Button>
                  </div>
                  <div className="grid gap-2">
                    {cats.map((c) => (
                      <div key={c.slug} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div><div className="font-medium">{c.label}</div><div className="text-xs text-muted-foreground">{c.slug}</div></div>
                        <Button variant="ghost" size="sm" onClick={() => removeCategory(c.slug)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Tipos de pacotes</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Desconto aplicado quando o usuário seleciona este tipo de pacote.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-[1fr_120px_auto] gap-2">
                    <Input placeholder="Tipo de pacote (ex: Família)" value={newTypeLabel} onChange={(e) => setNewTypeLabel(e.target.value)} />
                    <Input type="number" min={0} max={100} step="0.01" placeholder="Desc. %" value={newTypeDiscount} onChange={(e) => setNewTypeDiscount(Number(e.target.value))} />
                    <Button onClick={addPackageType}><Plus className="mr-1.5 h-4 w-4" />Adicionar</Button>
                  </div>
                  <div className="grid gap-2">
                    {pkgTypes.length === 0 && <p className="text-xs text-muted-foreground">Nenhum tipo cadastrado.</p>}
                    {pkgTypes.map((t) => (
                      <div key={t.slug} className="flex items-center justify-between rounded-lg border border-border p-3">
                        {editingTypeSlug === t.slug ? (
                          <div className="flex-1 grid grid-cols-[1fr_120px] gap-2 mr-2">
                            <Input value={editingTypeLabel} onChange={(e) => setEditingTypeLabel(e.target.value)} />
                            <Input type="number" min={0} max={100} step="0.01" value={editingTypeDiscount} onChange={(e) => setEditingTypeDiscount(Number(e.target.value))} />
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">{t.label}</div>
                            <div className="text-xs text-muted-foreground">{t.slug} · desconto {Number(t.discount_percent)}%</div>
                          </div>
                        )}
                        <div className="flex gap-1">
                          {editingTypeSlug === t.slug ? (
                            <>
                              <Button size="sm" variant="outline" onClick={saveEditType}>Salvar</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingTypeSlug(null)}>Cancelar</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => startEditType(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteType(t.slug)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reservas" className="mt-6"><BookingsPanel /></TabsContent>
          <TabsContent value="publicacoes" className="mt-6"><PublicationsPanel /></TabsContent>
          <TabsContent value="relatorios" className="mt-6"><AccommodationsReport /></TabsContent>
          <TabsContent value="pagamentos" className="mt-6"><PaymentSettingsPanel /></TabsContent>
        </Tabs>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif text-2xl">{editing ? "Editar pacote" : "Novo pacote"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Descrição *</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Local</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{cats.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data de partida *</Label><Input type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })} /></div>
              <div><Label>Duração (dias)</Label><Input type="number" min={1} value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} /></div>
              <div><Label>Valor (R$) *</Label><Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label>Total de vagas *</Label>
                <Input type="number" min={1} value={form.total_spots} onChange={(e) => setForm({ ...form, total_spots: Number(e.target.value) })} disabled={!!editing} />
                {editing && <p className="text-xs text-muted-foreground mt-1">Vagas só podem ser alteradas em novos pacotes</p>}
              </div>
              <div className="md:col-span-2"><Label>Tipo de pacote</Label>
                <Select value={form.package_type || "__none__"} onValueChange={(v) => setForm({ ...form, package_type: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Sem tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem tipo (sem desconto)</SelectItem>
                    {pkgTypes.map((t) => <SelectItem key={t.slug} value={t.slug}>{t.label} — {Number(t.discount_percent)}%</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>URL da foto de capa</Label>
                <Input value={form.cover_image} onChange={(e) => { setForm({ ...form, cover_image: e.target.value }); setLocalPreview(""); }}
                  placeholder="https://..." />
                <p className="text-xs text-muted-foreground mt-1">Cole a URL pública da imagem (Cloudflare Images, R2, Imgur, etc.)</p>
                {(localPreview || form.cover_image) && (
                  <img src={localPreview || form.cover_image} alt="Prévia" className="mt-3 h-40 w-full object-cover rounded-lg border border-border" />
                )}
              </div>
              <div className="md:col-span-2"><Label>Itinerário</Label><Textarea rows={3} value={form.itinerary} onChange={(e) => setForm({ ...form, itinerary: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>O que está incluso (separe por vírgula)</Label><Textarea rows={2} value={form.included} onChange={(e) => setForm({ ...form, included: e.target.value })} /></div>
              <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
                <div><Label className="text-base">Pacote em destaque</Label><p className="text-xs text-muted-foreground">Marca este pacote com selo de destaque na vitrine.</p></div>
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
              </div>
            </div>
            <Button onClick={save} className="w-full bg-primary mt-4">Salvar</Button>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Admin;
