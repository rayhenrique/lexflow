import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireGestor } from "@/lib/users/api-helpers";

interface WorkspaceRow {
  id: string;
}

interface ProfileRow {
  user_id: string;
}

interface ClientRow {
  id: string;
}

interface ClassificationRow {
  id: string;
}

type TransactionStatus = "pendente" | "pago";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCurrency(min: number, max: number) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function randomCpf() {
  return String(randomInt(10000000000, 99999999999));
}

function randomPhone() {
  return `+55 82 9${randomInt(10000000, 99999999)}`;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function randomDateBetween(start: Date, end: Date) {
  const timestamp = randomInt(start.getTime(), end.getTime());
  return new Date(timestamp);
}

function getTransactionStatus(occurredOn: Date, today: Date): TransactionStatus {
  const occurred = new Date(
    occurredOn.getFullYear(),
    occurredOn.getMonth(),
    occurredOn.getDate(),
  );
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return occurred > current ? "pendente" : "pago";
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Endpoint disponível. Use método POST para executar o seed.",
      usage: {
        method: "POST",
        path: "/api/seed",
      },
    },
    { status: 200 },
  );
}

export async function POST() {
  const auth = await requireGestor();

  if ("error" in auth) {
    if (auth.error === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createSupabaseAdminClient();

    const { data: workspaces, error: workspacesError } = await admin
      .from("workspaces")
      .select("id")
      .returns<WorkspaceRow[]>();

    if (workspacesError) {
      return NextResponse.json({ message: workspacesError.message }, { status: 400 });
    }

    if (!workspaces || workspaces.length === 0) {
      return NextResponse.json(
        { message: "Nenhum workspace encontrado para seed." },
        { status: 400 },
      );
    }

    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("user_id")
      .limit(1)
      .returns<ProfileRow[]>();

    if (profilesError) {
      return NextResponse.json({ message: profilesError.message }, { status: 400 });
    }

    const createdBy = profiles?.[0]?.user_id ?? auth.userId;
    const seedTag = Date.now();
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 28);

    const summary = {
      workspacesPopulated: 0,
      clientsInserted: 0,
      revenueClassificationsInserted: 0,
      expenseClassificationsInserted: 0,
      revenuesInserted: 0,
      expensesInserted: 0,
    };

    for (const workspace of workspaces) {
      const clientsPayload = Array.from({ length: 3 }, (_, index) => ({
        workspace_id: workspace.id,
        name: `Cliente ${index + 1} - WS ${workspace.id.slice(0, 4)}`,
        cpf: randomCpf(),
        phone: randomPhone(),
        process_number: `PROC-${seedTag}-${workspace.id.slice(0, 4)}-${index + 1}`,
        created_by: createdBy,
      }));

      const { data: createdClients, error: clientsError } = await admin
        .from("clients")
        .insert(clientsPayload)
        .select("id")
        .returns<ClientRow[]>();

      if (clientsError || !createdClients) {
        throw new Error(clientsError?.message ?? "Erro ao inserir clientes.");
      }

      const revenueClassificationsPayload = [
        {
          workspace_id: workspace.id,
          name: "Honorários",
          description: "Honorários advocatícios",
          active: true,
          code: "",
          created_by: createdBy,
        },
        {
          workspace_id: workspace.id,
          name: "Consultoria",
          description: "Consultoria jurídica",
          active: true,
          code: "",
          created_by: createdBy,
        },
      ];

      const { data: revenueClassifications, error: revClassError } = await admin
        .from("revenue_classifications")
        .insert(revenueClassificationsPayload)
        .select("id")
        .returns<ClassificationRow[]>();

      if (revClassError || !revenueClassifications) {
        throw new Error(revClassError?.message ?? "Erro ao inserir classificações de receita.");
      }

      const expenseClassificationsPayload = [
        {
          workspace_id: workspace.id,
          name: "Custas",
          description: "Custas processuais",
          active: true,
          code: "",
          created_by: createdBy,
        },
        {
          workspace_id: workspace.id,
          name: "Sistemas",
          description: "Ferramentas e sistemas",
          active: true,
          code: "",
          created_by: createdBy,
        },
      ];

      const { data: expenseClassifications, error: expClassError } = await admin
        .from("expense_classifications")
        .insert(expenseClassificationsPayload)
        .select("id")
        .returns<ClassificationRow[]>();

      if (expClassError || !expenseClassifications) {
        throw new Error(expClassError?.message ?? "Erro ao inserir classificações de despesa.");
      }

      const revenueCount = randomInt(5, 8);
      const expensesCount = randomInt(5, 8);

      const revenuesPayload = Array.from({ length: revenueCount }, (_, index) => {
        const occurredOnDate = randomDateBetween(startDate, endDate);
        const occurredOn = toIsoDate(occurredOnDate);
        return {
          workspace_id: workspace.id,
          client_id: createdClients[randomInt(0, createdClients.length - 1)].id,
          classification_id:
            revenueClassifications[randomInt(0, revenueClassifications.length - 1)].id,
          description: `Receita ${index + 1} - ${workspace.id.slice(0, 4)}`,
          amount: randomCurrency(500, 15000),
          occurred_on: occurredOn,
          status: getTransactionStatus(occurredOnDate, now),
          created_by: createdBy,
        };
      });

      const { error: revenuesError } = await admin.from("revenues").insert(revenuesPayload);
      if (revenuesError) {
        throw new Error(revenuesError.message);
      }

      const expensesPayload = Array.from({ length: expensesCount }, (_, index) => {
        const occurredOnDate = randomDateBetween(startDate, endDate);
        const occurredOn = toIsoDate(occurredOnDate);
        return {
          workspace_id: workspace.id,
          client_id: createdClients[randomInt(0, createdClients.length - 1)].id,
          classification_id:
            expenseClassifications[randomInt(0, expenseClassifications.length - 1)].id,
          description: `Despesa ${index + 1} - ${workspace.id.slice(0, 4)}`,
          amount: randomCurrency(50, 2000),
          occurred_on: occurredOn,
          status: getTransactionStatus(occurredOnDate, now),
          created_by: createdBy,
        };
      });

      const { error: expensesError } = await admin.from("expenses").insert(expensesPayload);
      if (expensesError) {
        throw new Error(expensesError.message);
      }

      summary.workspacesPopulated += 1;
      summary.clientsInserted += createdClients.length;
      summary.revenueClassificationsInserted += revenueClassifications.length;
      summary.expenseClassificationsInserted += expenseClassifications.length;
      summary.revenuesInserted += revenuesPayload.length;
      summary.expensesInserted += expensesPayload.length;
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Seed concluído com sucesso.",
        summary,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao executar seed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
