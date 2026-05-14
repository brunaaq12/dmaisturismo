import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Settings {
  id?: string;
  pix_key: string | null;
  pix_key_type: string | null;
  pix_holder_name: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  mp_access_token: string | null;
  mp_mode: string;
  mp_enabled: boolean;
  pix_enabled: boolean;
  instructions: string | null;
}

const empty: Settings = {
  pix_key: "", pix_key_type: "cpf", pix_holder_name: "",
  bank_name: "", bank_agency: "", bank_account: "",
  mp_access_token: "", mp_mode: "sandbox", mp_enabled: false, pix_enabled: true,
  instructions: "",
};

export const PaymentSettingsPanel = () => {
  const [s, setS] = useState<Settings>(empty);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await api.get<Settings>("/settings/payment");
      if (data) setS(data);
    } catch (err) {
      console.error(err);
    }
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      pix_key: s.pix_key, pix_key_type: s.pix_key_type, pix_holder_name: s.pix_holder_name,
      bank_name: s.bank_name, bank_agency: s.bank_agency, bank_account: s.bank_account,
      mp_access_token: s.mp_access_token, mp_mode: s.mp_mode,
      mp_enabled: s.mp_enabled, pix_enabled: s.pix_enabled, instructions: s.instructions,
    };
    try {
      await api.put("/settings/payment", payload);
      toast.success("Configurações salvas");
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="font-serif text-xl">Chave Pix e dados bancários</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-base">Aceitar Pix</Label>
              <p className="text-xs text-muted-foreground">Mostra a chave Pix no checkout para o cliente pagar manualmente.</p>
            </div>
            <Switch checked={s.pix_enabled} onCheckedChange={(v) => setS({ ...s, pix_enabled: v })} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Tipo de chave</Label>
              <Select value={s.pix_key_type || "cpf"} onValueChange={(v) => setS({ ...s, pix_key_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="aleatoria">Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Chave Pix</Label>
              <Input value={s.pix_key || ""} onChange={(e) => setS({ ...s, pix_key: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Titular da conta</Label>
              <Input value={s.pix_holder_name || ""} onChange={(e) => setS({ ...s, pix_holder_name: e.target.value })} />
            </div>
            <div>
              <Label>Banco</Label>
              <Input value={s.bank_name || ""} onChange={(e) => setS({ ...s, bank_name: e.target.value })} />
            </div>
            <div>
              <Label>Agência</Label>
              <Input value={s.bank_agency || ""} onChange={(e) => setS({ ...s, bank_agency: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Conta</Label>
              <Input value={s.bank_account || ""} onChange={(e) => setS({ ...s, bank_account: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Instruções para o cliente</Label>
              <Textarea rows={2} value={s.instructions || ""}
                onChange={(e) => setS({ ...s, instructions: e.target.value })}
                placeholder="Ex: Após pagar, envie o comprovante para contato@dmaisturismo.com.br" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-serif text-xl">Mercado Pago (cartão / Pix automático / boleto)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-base">Habilitar Mercado Pago</Label>
              <p className="text-xs text-muted-foreground">Gera link de pagamento com cartão, Pix e boleto.</p>
            </div>
            <Switch checked={s.mp_enabled} onCheckedChange={(v) => setS({ ...s, mp_enabled: v })} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Ambiente</Label>
              <Select value={s.mp_mode} onValueChange={(v) => setS({ ...s, mp_mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (testes)</SelectItem>
                  <SelectItem value="live">Produção (real)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Access Token</Label>
              <div className="flex gap-2">
                <Input type={showToken ? "text" : "password"} value={s.mp_access_token || ""}
                  onChange={(e) => setS({ ...s, mp_access_token: e.target.value })}
                  placeholder="APP_USR-xxxxx ou TEST-xxxxx" />
                <Button type="button" variant="outline" onClick={() => setShowToken(!showToken)}>
                  {showToken ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Obtenha em mercadopago.com.br → Suas integrações → Credenciais.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="bg-gradient-gold text-primary hover:opacity-90 shadow-gold">
        {saving ? "Salvando..." : "Salvar configurações"}
      </Button>
    </div>
  );
};
