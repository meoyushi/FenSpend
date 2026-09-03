import { NextRequest, NextResponse } from "next/server";
import { financialHealthService } from "@/application/financial-health-service";
import { portfolioService } from "@/application/portfolio-service";

export async function GET(request: NextRequest) {
  const email = new URL(request.url).searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  try {
    const portfolio = await portfolioService.getSummary(email);
    const insight = await financialHealthService.generateInsight(portfolio);
    return NextResponse.json(insight);
  } catch (error) {
    console.error("Financial health provider failed", error);
    return NextResponse.json(
      { error: "Financial health insight is temporarily unavailable" },
      { status: 503 },
    );
  }
}
