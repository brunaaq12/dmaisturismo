# Guia de Deploy — D+ Turismo

## Arquitetura
- **Frontend** → Vercel (React + Vite)
- **Backend / API** → Cloudflare Workers (Hono)
- **Banco de dados** → Cloudflare D1 (SQLite)

---

## 1. Deploy do Backend (Cloudflare Worker + D1)

### 1.1 Pré-requisitos
```bash
npm install -g wrangler
wrangler login
```

### 1.2 Criar o banco D1
```bash
cd worker
wrangler d1 create dmais-db
```
Copie o `database_id` retornado e cole em `worker/wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "dmais-db"
database_id = "COLE_O_ID_AQUI"
```

### 1.3 Criar as tabelas (migrations)
```bash
# Ambiente local (desenvolvimento)
wrangler d1 execute dmais-db --local --file=./schema.sql

# Produção (remoto)
wrangler d1 execute dmais-db --file=./schema.sql
```

### 1.4 Configurar secrets
```bash
wrangler secret put JWT_SECRET
# → digite um segredo longo e aleatório (ex: openssl rand -base64 64)

wrangler secret put ADMIN_SETUP_KEY
# → chave temporária para promover o primeiro admin
```

### 1.5 Atualizar a FRONTEND_URL no wrangler.toml
```toml
[vars]
FRONTEND_URL = "https://seu-projeto.vercel.app"
```

### 1.6 Instalar dependências e fazer deploy
```bash
cd worker
npm install
npm run deploy
```
Anote a URL do worker: `https://dmais-turismo-api.SEU_SUBDOMINIO.workers.dev`

---

## 2. Deploy do Frontend (Vercel)

### 2.1 Definir a variável de ambiente na Vercel
No painel da Vercel → Settings → Environment Variables:
```
VITE_API_URL = https://dmais-turismo-api.SEU_SUBDOMINIO.workers.dev
```

### 2.2 Configurações de build
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 2.3 Deploy via CLI (opcional)
```bash
npm install -g vercel
cd /caminho/do/projeto/frontend
vercel --prod
```

---

## 3. Primeiro Admin

Após deploy, crie sua conta normalmente pelo site e então promova-a a admin:

```bash
curl -X POST https://dmais-turismo-api.SEU_SUBDOMINIO.workers.dev/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"setup_key": "SUA_ADMIN_SETUP_KEY", "email": "seu@email.com"}'
```

Depois de criar o admin, remova o secret `ADMIN_SETUP_KEY`:
```bash
wrangler secret delete ADMIN_SETUP_KEY
```

---

## 4. Upload de Imagens

O backend **não gerencia arquivos** — use um serviço externo para imagens:

| Serviço             | Gratuito       | Como usar                              |
|---------------------|----------------|----------------------------------------|
| Cloudflare Images   | Pago (barato)  | Upload via dashboard → URL pública     |
| Cloudflare R2       | 10 GB grátis   | Bucket público + URL pública           |
| Imgur               | Grátis         | Upload direto → link do CDN            |

Cole a URL pública no campo "URL da foto de capa" no painel admin.

---

## 5. Desenvolvimento Local

### Backend
```bash
cd worker
npm install
npm run db:init      # cria tabelas locais
npm run dev          # http://localhost:8787
```

### Frontend
```bash
# na raiz do projeto
echo "VITE_API_URL=http://localhost:8787" > .env.local
npm install
npm run dev          # http://localhost:5173
```

---

## 6. Variáveis de Ambiente — Resumo

| Onde       | Variável          | Descrição                                    |
|------------|-------------------|----------------------------------------------|
| Worker     | `JWT_SECRET`      | Segredo para assinar tokens JWT (secret)     |
| Worker     | `ADMIN_SETUP_KEY` | Chave temporária para 1º admin (secret)      |
| Worker     | `FRONTEND_URL`    | URL do frontend para CORS (var)              |
| Vercel     | `VITE_API_URL`    | URL base do Cloudflare Worker                |
