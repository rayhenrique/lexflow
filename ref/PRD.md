# Product Requirements Document (PRD)

## 1. Visão Geral
Sistema financeiro client-side first construído com Next.js e Supabase, substituindo planilhas e sistemas legado por uma interface clean (shadcn/ui). Foco total em gestão de Receitas, Despesas, Contas a Pagar/Receber e fluxo de caixa segmentado por área jurídica.

## 2. Personas
- **Gestora (Socia-Administradora):** Precisa ter controle total, visão de alto nível (Matriz) e capacidade de auditar os números de cada área de atuação separadamente.
- **Advogado Associado:** Quer apenas registrar seus honorários e custas de processos da sua área de forma rápida, sem ser exposto aos custos do escritório ou ganhos de outros colegas.

## 3. User Stories
- **Como Gestora**, quero visualizar um dashboard consolidado (Matriz) para entender a saúde financeira global do escritório.
- **Como Gestora**, quero usar um seletor (dropdown) no topo da tela para filtrar todo o sistema por uma área específica (ex: Trabalhista), para analisar os resultados daquela equipe.
- **Como Advogado Associado**, quero fazer login e ver apenas meu painel e minhas transações, para garantir minha privacidade e foco.
- **Como Usuário**, quero cadastrar receitas e despesas com poucos cliques, para não perder tempo com burocracia.

## 4. Requisitos Funcionais
- **Autenticação & RLS:** Login unificado. Banco de dados deve filtrar requisições automaticamente baseando-se no `user_id` e no nível de permissão (role).
- **Módulo Dashboard:** Cards de métricas (Receitas, Despesas, Saldo, Inadimplência) e gráficos de barra/linha simples.
- **Módulo de Cadastros:** Gestão de Clientes, Usuários (com atribuição de área) e Categorias de transação.
- **Módulo Financeiro:** Tabela de transações unificada (Receitas/Despesas) ou separada por abas. Campos: Data, Cliente, Categoria, Valor, Status (Pago, Pendente, Atrasado), Área de Atuação.
- **Módulo de Relatórios:** Tabela baseada em filtros de data e status, com botão de exportar para CSV.
- **Context Switcher (Apenas Gestores):** Um componente Select no layout principal que injeta o ID da área selecionada no estado global e refaz as queries.

## 5. Requisitos Não-Funcionais
- **Performance:** Navegação instantânea (Next.js App Router).
- **Segurança:** Políticas de RLS no Supabase (PostgreSQL) são obrigatórias em TODAS as tabelas. Nenhuma regra de visualização deve ser validada apenas no frontend.
- **UI/UX:** Estilo light mode, responsivo, sem recarregamento de página para transições de módulos.

## 6. Integrações Necessárias
- Supabase Auth (Email/Senha).
- Supabase Database (Postgres).

## 7. Casos de Borda e Edge Cases
- **Tentativa de acesso direto (URL hacking):** Se um associado tentar acessar o ID de uma transação de outra área via URL, o Supabase RLS deve retornar null/404.
- **Categoria Global:** Despesas cadastradas na área "Matriz" (ex: Aluguel) não podem aparecer no dashboard de nenhum advogado associado, apenas para a Gestora.

## 8. Critérios de Aceitação
- A Gestora consegue alternar entre "Todas as Áreas" e "Área Específica" em menos de 1 segundo sem reload na página.
- O Advogado não consegue ver o "Context Switcher".