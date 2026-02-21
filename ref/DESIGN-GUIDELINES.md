# Diretrizes Visuais (Design System)

**Conceito Geral:** "Minimalismo funcional". Sem cores berrantes, sem caixas pesadas. Foco nos dados. Referências: Vercel, Linear, Resend.

## 🎨 Cores (Tailwind CSS Base)
- **Background:** Branco puro (`#FFFFFF`) para o conteúdo, Fundo geral levemente cinza (`bg-zinc-50` ou `#FAFAFA`).
- **Textos Principais:** Zinc 900 (`#18181B`) e Zinc 500 (`#71717A`) para textos secundários.
- **Cor Primária (Ações/Destaque):** Preto (`#000000`) para botões primários.
- **Cores Semânticas (Financeiro):**
  - Receita/Positivo: Emerald 600 (`#059669`).
  - Despesa/Negativo: Rose 600 (`#E11D48`).
  - Alerta/Pendente: Amber 500 (`#F59E0B`).

## ✍️ Tipografia
- **Fonte Principal:** `Geist` (da Vercel) ou `Inter` (Google Fonts).
- **Estilo:** Títulos sem serifa, pesos `500` (Medium) e `600` (Semibold). Evitar negrito excessivo (`800+`).

## 📐 Espaçamento e Formas
- **Grid de base:** Escala de 4px / 8px.
- **Border Radius:** Padrão do shadcn/ui (`0.5rem` / `8px`) para cards e botões. Nada de cantos 100% arredondados (pill) na interface principal.
- **Bordas e Sombras:** Usar divisões com bordas ultra finas (`border-zinc-200`) em vez de sombras pesadas. Sombras apenas em Dropdowns, Modais e Popovers (`shadow-sm` ou `shadow-md`).

## 🧩 Uso do shadcn/ui
- **Data Table (@tanstack/react-table):** Para listagem de transações e clientes. Usar com paginação clean.
- **Sheet (Off-canvas):** Para formulários de cadastro e edição de transações (Nova Despesa/Nova Receita) que abrem lateralmente para não perder o contexto da tabela.
- **Select / Dropdown Menu:** Para o Context Switcher da Gestora na Sidebar superior.
- **Card:** Para os indicadores (KPIs) do Dashboard.
- **Badge:** Para status de pagamentos (Pago, Pendente, Atrasado).