# Escopo do MVP

## 🟢 ESTÁ NO MVP (Core)
- **Autenticação:** Login via Email/Senha (Supabase Auth).
- **Permissões (RLS):** Criação de Roles (Admin/Gestora vs Associado) no banco de dados.
- **Navegação / UX:** Context Switcher na Sidebar para a Gestora; Visão travada para o Associado.
- **Dashboards:** Visão Matriz (Global) e Visão da Área.
- **CRUD Financeiro:** Lançamento manual de Receitas e Despesas (Contas a Pagar/Receber).
- **Cadastros de Apoio:** Clientes, Usuários e Categorias.
- **Relatório Básico:** Listagem filtrável com exportação para CSV.

## 🔴 NÃO ESTÁ NO MVP (Future Scope)
- Integração com APIs de bancos via Open Finance ou importação de OFX.
- Emissão de Notas Fiscais e Boletos diretamente pelo sistema.
- Rateio automático matemático de contas de consumo (Matriz -> Filiais).
- Chat interno ou gestão de arquivos/documentos jurídicos.
- Dark mode.

## ⚖️ Justificativa das Decisões
O foco do MVP é validar a usabilidade, a regra de negócio central (segregação por áreas de atuação) e a segurança de dados. Integrações externas e automações complexas adicionam meses de desenvolvimento e atrasam o time-to-market.

## 🧪 Hipóteses a Validar
1. A interface limpa (estilo Vercel/Linear) aumenta a velocidade e a disciplina de preenchimento dos advogados em comparação com sistemas complexos.
2. A separação estrita de visibilidade dos dados elimina os atritos de confiança dentro do escritório.