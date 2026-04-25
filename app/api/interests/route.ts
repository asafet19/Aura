import { supabase } from "@/utils/supabase";

type UnknownRecord = Record<string, unknown>;

function readTrimmedString(body: UnknownRecord, key: string): string | undefined {
  const v = body[key];
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

export async function GET() {
  const { data, error } = await supabase
    .from("interests")
    .select("id, name, user_id, user_email")
    .order("name");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? []);
}

export async function POST(request: Request) {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof parsed !== "object" || parsed === null) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const body = parsed as UnknownRecord;
  const interest = readTrimmedString(body, "interest")?.toLowerCase() ?? "";
  const userId = readTrimmedString(body, "userId") ?? "";
  const rawEmail = body.userEmail;
  const userEmail =
    typeof rawEmail === "string" && rawEmail.trim()
      ? rawEmail.trim()
      : "Anonymous";

  if (!interest) {
    return Response.json({ error: "Interest is required" }, { status: 400 });
  }

  if (!userId) {
    return Response.json({ error: "User is required" }, { status: 400 });
  }

  const { error } = await supabase.from("interests").insert({
    name: interest,
    user_id: userId,
    user_email: userEmail,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 201 });
}
