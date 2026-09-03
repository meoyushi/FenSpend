export type AssetType = "STOCK" | "MUTUAL_FUND" | "ETF" | "BOND";

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  sector: string;
  units: number;
  averageCostPaise: number;
  currentPricePaise: number;
}

export interface PortfolioHolding extends Investment {
  investedPaise: number;
  currentValuePaise: number;
  pnlPaise: number;
  returnPercentage: number;
  weightPercentage: number;
}

export interface AllocationEntry {
  label: string;
  valuePaise: number;
  percentage: number;
}

export interface PortfolioSummary {
  investedPaise: number;
  currentValuePaise: number;
  pnlPaise: number;
  returnPercentage: number;
  holdings: PortfolioHolding[];
  assetAllocation: AllocationEntry[];
  sectorAllocation: AllocationEntry[];
}

function toAllocation(
  values: Map<string, number>,
  totalPaise: number,
): AllocationEntry[] {
  return [...values.entries()]
    .map(([label, valuePaise]) => ({
      label,
      valuePaise,
      percentage: totalPaise === 0 ? 0 : (valuePaise / totalPaise) * 100,
    }))
    .sort((left, right) => right.valuePaise - left.valuePaise);
}

export function calculatePortfolioSummary(
  investments: Investment[],
): PortfolioSummary {
  const investedPaise = investments.reduce(
    (total, investment) =>
      total + Math.round(investment.units * investment.averageCostPaise),
    0,
  );
  const currentValuePaise = investments.reduce(
    (total, investment) =>
      total + Math.round(investment.units * investment.currentPricePaise),
    0,
  );

  const assetValues = new Map<string, number>();
  const sectorValues = new Map<string, number>();
  const holdings = investments
    .map((investment) => {
      const investedForHolding = Math.round(
        investment.units * investment.averageCostPaise,
      );
      const currentValueForHolding = Math.round(
        investment.units * investment.currentPricePaise,
      );

      assetValues.set(
        investment.assetType,
        (assetValues.get(investment.assetType) ?? 0) + currentValueForHolding,
      );
      sectorValues.set(
        investment.sector,
        (sectorValues.get(investment.sector) ?? 0) + currentValueForHolding,
      );

      return {
        ...investment,
        investedPaise: investedForHolding,
        currentValuePaise: currentValueForHolding,
        pnlPaise: currentValueForHolding - investedForHolding,
        returnPercentage:
          investedForHolding === 0
            ? 0
            : ((currentValueForHolding - investedForHolding) /
                investedForHolding) *
              100,
        weightPercentage:
          currentValuePaise === 0
            ? 0
            : (currentValueForHolding / currentValuePaise) * 100,
      };
    })
    .sort((left, right) => right.currentValuePaise - left.currentValuePaise);

  return {
    investedPaise,
    currentValuePaise,
    pnlPaise: currentValuePaise - investedPaise,
    returnPercentage:
      investedPaise === 0
        ? 0
        : ((currentValuePaise - investedPaise) / investedPaise) * 100,
    holdings,
    assetAllocation: toAllocation(assetValues, currentValuePaise),
    sectorAllocation: toAllocation(sectorValues, currentValuePaise),
  };
}
