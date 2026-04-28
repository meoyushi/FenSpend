import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const email = searchParams.get("email");
  const category = searchParams.get("category");

  let query = supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });

  if (email) query = query.eq("user_email", email);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      requestId,
      amount,
      category,
      description,
      date,
      email,
    } = body;

    const selectedDate = new Date(date);

    if (selectedDate > new Date()) {
      return NextResponse.json(
        { error: "Future dates not allowed" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("expenses")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();

    if (existing) return NextResponse.json(existing);

    const { data, error } = await supabase
      .from("expenses")
      .insert([
        {
          request_id: requestId,
          user_email: email,
          amount_cents: Math.round(Number(amount) * 100),
          category,
          description: description || "",
          date,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}