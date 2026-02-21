# LexFlow
**Micro-ERP Jurídico para gestão financeira de escritórios de advocacia.**

Aplicação web com foco em controle financeiro por área de atuação (workspace), autenticação segura, RLS no Supabase e interface SPA-like com Next.js App Router.

## Repositório
- GitHub: `https://github.com/rayhenrique/lexflow`

## Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Radix UI, Lucide React
- **Estado/Form:** React Hook Form, SWR, Context API
- **Backend/BaaS:** Supabase (Auth, PostgreSQL, Storage, RLS)
- **Tabelas:** TanStack Table
- **Gráficos:** Recharts
- **Validação:** Zod

## Pré-requisitos
- Node.js **20+** (LTS recomendado)
- npm **10+** (ou pnpm/yarn, se preferir)
- Projeto Supabase configurado

## Variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto com as chaves públicas necessárias:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# compatibilidade legada (opcional)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Observação:
- Para rotas administrativas server-side (`/api/users`, `/api/backup`, `/api/seed`), também é necessário `SUPABASE_SERVICE_ROLE_KEY` no ambiente local/servidor.

## Setup do banco (Supabase SQL Editor)
Execute os scripts da pasta `supabase/sql/` **na ordem**:

1. `supabase/sql/001_schema.sql`
2. `supabase/sql/002_seed.sql`
3. `supabase/sql/003_role_gestor_migration.sql`
4. `supabase/sql/004_users_module_policies.sql`
5. `supabase/sql/005_sync_profiles_email.sql`
6. `supabase/sql/006_account_name.sql`
7. `supabase/sql/007_cadastros_financeiro.sql`
8. `supabase/sql/008_financeiro_cliente_nullable.sql`
9. `supabase/sql/009_financeiro_status.sql`
10. `supabase/sql/010_administracao_auditoria.sql`
11. `supabase/sql/011_auditoria_retencao_e_limpeza.sql`
12. `supabase/sql/012_firm_settings_e_logos.sql`

## Rodando localmente
```bash
npm install
npm run dev
```

Aplicação disponível em `http://localhost:3000`.

## Scripts úteis
```bash
npm run lint
npm run build
npm run start
```

## Produção com PM2
Para subir em produção com PM2:

```bash
npm ci
npm run build
pm2 start npm --name "lexflow" -- start
pm2 save
pm2 startup
```

Comandos de operação:

```bash
pm2 status
pm2 logs lexflow
pm2 restart lexflow
pm2 stop lexflow
```

## Atualização do código (Git)
```bash
git pull origin main
npm install
npm run dev
```

## Estrutura resumida
- `app/` rotas App Router (públicas, auth, protegidas e APIs)
- `components/` módulos de domínio e componentes de UI
- `lib/` serviços de dados, helpers de Supabase e utilitários
- `supabase/sql/` migrations/scripts SQL versionados

## Segurança (resumo)
- RLS habilitado nas tabelas de domínio
- Controle por role (`gestor` e `associado`)
- Escopo por workspace
- Rotas sensíveis protegidas no server e no client
