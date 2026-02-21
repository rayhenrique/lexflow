# Deploy.md
Guia de deploy manual do **LexFlow** em **VPS Hostinger + CloudPanel** (Next.js SSR).

Repositório oficial:
- `https://github.com/rayhenrique/lexflow`

## A) Preparação no CloudPanel
1. Acesse o CloudPanel da VPS.
2. Crie um novo site:
   - `Add Site` → **Node.js App**
   - Domain: **`lexflow.kltecnologia.com`**
   - Node.js Version: **22 LTS** (conforme ambiente já criado)
   - App Port: **`3011`**
   - Site User: **`kltecnologia-lexflow`**
3. Salve e aguarde o provisionamento do diretório do site (ex: `htdocs`).
4. Segurança: se a senha do usuário do site foi exposta em print/chat, gere uma nova senha no CloudPanel imediatamente.

## B) Configuração do repositório (SSH)
1. Conecte na VPS:
```bash
ssh root@SEU_IP
```
2. Troque para o usuário do site:
```bash
su - kltecnologia-lexflow
```
3. Entre no diretório do site criado no CloudPanel:
```bash
cd htdocs/lexflow.kltecnologia.com
```
4. Clone o repositório (privado) via SSH:
```bash
git clone git@github.com:rayhenrique/lexflow.git .
```
5. Se necessário, configure chave SSH no servidor para acesso ao GitHub.

## C) Variáveis de produção
Crie `.env.production` na raiz do projeto no servidor:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SEU_ANON_KEY
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=SEU_PUBLISHABLE_KEY

SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY
SUPABASE_DB_URL=postgresql://postgres:SENHA@db.SEUPROJETO.supabase.co:5432/postgres
```

Observação:
- `SUPABASE_SERVICE_ROLE_KEY` é obrigatória para APIs administrativas.
- Nunca exponha essa chave no client.

## D) Build e execução
No diretório do projeto:

```bash
npm ci
npm run build
```

### Padrão recomendado: PM2
```bash
npm install -g pm2
pm2 start npm --name "lexflow" -- start
pm2 save
pm2 startup
```

Comandos operacionais:
```bash
pm2 status
pm2 logs lexflow
pm2 restart lexflow
pm2 stop lexflow
```

Observação:
- Mesmo usando PM2, mantenha a porta do app em `3011` no CloudPanel.
- O reverse proxy/Nginx do CloudPanel encaminha para a porta configurada do Node app.

## E) Domínio e SSL
1. Na Hostinger (DNS), crie/edite registro **A**:
   - Host: `lexflow` (subdomínio de `kltecnologia.com`)
   - Value: IP da VPS
2. No CloudPanel, abra o site e emita SSL:
   - `SSL/TLS` → **Let's Encrypt**
   - Ative redirect HTTP → HTTPS.

## F) Banco de dados (produção)
Antes de testar a aplicação em produção, execute as migrations SQL no projeto Supabase de produção na ordem:

1. `supabase/sql/001_schema.sql`
2. `supabase/sql/002_seed.sql` (opcional em produção)
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

## Checklist de go-live
- [ ] Build sem erros (`npm run build`)
- [ ] App online com HTTPS válido
- [ ] Login funcional
- [ ] APIs administrativas funcionando (`/api/users`, `/api/backup`)
- [ ] RLS validado com usuário `gestor` e `associado`
- [ ] Rotinas de auditoria e retenção aplicadas no banco

## Rollback Operacional
Use este procedimento se o deploy causar erro crítico em produção.

## Atualização de release (git pull)
Quando houver atualização no repositório, use este fluxo padrão:

```bash
cd /htdocs/lexflow.kltecnologia.com
git fetch --all
git pull origin main
npm ci
npm run build
```

Reinicie o processo:
```bash
pm2 restart lexflow
```

Validação rápida pós-update:
- [ ] App sobe sem erro
- [ ] Login e dashboard carregam
- [ ] APIs administrativas respondem
- [ ] Sem erro novo nos logs

### 1) Rollback da aplicação (código)
No servidor:

```bash
cd /htdocs/lexflow.kltecnologia.com
git fetch --all --tags
git log --oneline -n 10
git checkout <COMMIT_ESTAVEL>
npm ci
npm run build
```

Reinicie o processo:
```bash
pm2 restart lexflow
```

### 2) Rollback rápido de ambiente
Se o problema for variável incorreta:
1. Reverter `.env.production` para versão estável.
2. Reiniciar a aplicação.

### 3) Rollback de banco (quando necessário)
Preferência: use migrações reversíveis. Se não houver, restaurar backup.

Fluxo recomendado:
1. Colocar app em janela de manutenção.
2. Restaurar backup do Supabase (PITR/snapshot) para o ponto anterior ao deploy.
3. Validar tabelas críticas:
   - `profiles`
   - `workspace_memberships`
   - `clients`
   - `revenues`
   - `expenses`
4. Reabrir o tráfego.

### 4) Verificações pós-rollback
- [ ] Healthcheck da aplicação (login e dashboard)
- [ ] APIs administrativas respondendo sem erro
- [ ] Logs sem exceptions novas
- [ ] Exportações e relatórios funcionando
- [ ] Auditoria gravando eventos normalmente
