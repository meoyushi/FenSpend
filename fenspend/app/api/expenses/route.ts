import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const email = searchParams.get("email");

    const expenses = await prisma.expense.findMany({
        where: {
            ...(email ? { userEmail: email } : {}),
            ...(category ? { category } : {}),
        },
        orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
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
            email
        } = body;

        if (!requestId || !amount || !category || !date || !email) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const existing = await prisma.expense.findUnique({
            where: { requestId },
        });

        if (existing) {
            return NextResponse.json(existing);
        }

        const selectedDate = new Date(date);

        if (selectedDate > new Date()) {
            return NextResponse.json(
                { error: "Future dates not allowed" },
                { status: 400 }
            );
        }

        const created = await prisma.expense.create({
            data: {
                requestId,
                userEmail: email,
                amountCents: Math.round(Number(amount) * 100),
                category,
                description: description || "",
                date: selectedDate,
            },
        });

        return NextResponse.json(created);
    } catch (error) {
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}