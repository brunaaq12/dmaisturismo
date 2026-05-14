import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plane } from "lucide-react";

const phoneSchema = z.string().trim().regex(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, "Contato inválido. Use (DDD) número, ex: (11) 91234-5678");

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Nome muito curto").max(80),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: phoneSchema,
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});
const signInSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(1, "Informe a senha").max(72),
});

const Auth = () => {
  const nav = useNavigate();
  const { user, loading, setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => { if (!loading && user) nav("/"); }, [user, loading, nav]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: form.get("fullName"), email: form.get("email"),
      phone: form.get("phone"), password: form.get("password"),
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setBusy(true);
    try {
      const data = await api.post<{ token: string, user: any }>("/auth/register", {
        email: parsed.data.email,
        password: parsed.data.password,
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
      });
      localStorage.setItem('d_turismo_token', data.token);
      setUser(data.user);
      toast.success("Conta criada com sucesso!");
      nav("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setBusy(true);
    try {
      const data = await api.post<{ token: string, user: any }>("/auth/login", {
        email: parsed.data.email,
        password: parsed.data.password,
      });
      localStorage.setItem('d_turismo_token', data.token);
      setUser(data.user);
      toast.success("Bem-vindo de volta!");
      nav("/");
    } catch (error: any) {
      toast.error("E-mail ou senha inválidos.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-deep flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-primary-foreground">
          <div className="rounded-lg bg-gradient-gold p-2"><Plane className="h-4 w-4 text-primary" /></div>
          <span className="font-serif text-3xl font-bold">D<span className="text-accent">+</span> TURISMO</span>
        </Link>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Acesse sua conta</CardTitle>
            <CardDescription>Entre ou crie sua conta para reservar pacotes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                  <div><Label htmlFor="si-email">E-mail</Label>
                    <Input id="si-email" name="email" type="email" required autoComplete="email" /></div>
                  <div><Label htmlFor="si-pass">Senha</Label>
                    <Input id="si-pass" name="password" type="password" required autoComplete="current-password" /></div>
                  <Button type="submit" disabled={busy} className="w-full bg-primary hover:bg-primary-glow">
                    {busy ? "Entrando..." : "Entrar"}
                  </Button>
                  <button type="button" onClick={() => setForgotOpen(true)}
                    className="block w-full text-center text-sm text-accent hover:underline">
                    Esqueci a senha
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                  <div><Label htmlFor="su-name">Nome completo</Label>
                    <Input id="su-name" name="fullName" required autoComplete="name" /></div>
                  <div><Label htmlFor="su-email">E-mail</Label>
                    <Input id="su-email" name="email" type="email" required autoComplete="email" /></div>
                  <div><Label htmlFor="su-phone">Contato (com DDD)</Label>
                    <Input id="su-phone" name="phone" type="tel" required autoComplete="tel" placeholder="(11) 91234-5678" /></div>
                  <div><Label htmlFor="su-pass">Senha (mín. 6 caracteres)</Label>
                    <Input id="su-pass" name="password" type="password" required autoComplete="new-password" minLength={6} /></div>
                  <Button type="submit" disabled={busy} className="w-full bg-gradient-gold text-primary hover:opacity-90">
                    {busy ? "Criando..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Recuperar senha</DialogTitle>
            <DialogDescription>
              Entre em contato com o suporte para redefinir sua senha.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p>Para sua segurança, a redefinição de senha deve ser solicitada via WhatsApp.</p>
            <Button className="mt-4 w-full bg-green-600 hover:bg-green-700">
              Falar com Suporte
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
