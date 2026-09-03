import { NextRequest, NextResponse } from "next/server";
import { portfolioService } from "@/application/portfolio-service";
import { AssetType, Investment } from "@/domain/portfolio";

const ASSET_TYPES: AssetType[] = ["STOCK", "MUTUAL_FUND", "ETF", "BOND"];

export async function GET(request: NextRequest) {
  const email = new URL(request.url).searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const summary = await portfolioService.getSummary(email);
  return NextResponse.json(summary);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const investment = body.investment as Partial<Investment>;

    if (
      !email ||
      !investment.symbol ||
      !investment.name ||
      !investment.sector ||
      !ASSET_TYPES.includes(investment.assetType as AssetType) ||
      typeof investment.units !== "number" ||
      investment.units <= 0 ||
      typeof investment.averageCostPaise !== "number" ||
      investment.averageCostPaise <= 0 ||
      typeof investment.currentPricePaise !== "number" ||
      investment.currentPricePaise <= 0
    ) {
      return NextResponse.json({ error: "Invalid investment" }, { status: 400 });
    }

    const savedInvestment: Investment = {
      id: `custom-${crypto.randomUUID()}`,
      symbol: investment.symbol.trim().toUpperCase(),
      name: investment.name.trim(),
      assetType: investment.assetType as AssetType,
      sector: investment.sector.trim(),
      units: investment.units,
      averageCostPaise: Math.round(investment.averageCostPaise),
      currentPricePaise: Math.round(investment.currentPricePaise),
    };

    const summary = await portfolioService.addInvestment(email, savedInvestment);
    return NextResponse.json(summary, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not add investment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const investmentId = searchParams.get("id");

  if (!email || !investmentId) {
    return NextResponse.json({ error: "Missing email or id" }, { status: 400 });
  }

  const summary = await portfolioService.removeInvestment(email, investmentId);
  return NextResponse.json(summary);
}
