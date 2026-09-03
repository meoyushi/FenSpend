import {
  AIProvider,
  FinancialHealthInsight,
  FinancialSnapshot,
} from "@/infrastructure/ai/ai-provider";

export class MockAIProvider implements AIProvider {
  async generateFinancialHealthInsight(
    snapshot: FinancialSnapshot,
  ): Promise<FinancialHealthInsight> {
    const { portfolio } = snapshot;
    const largestHolding = portfolio.holdings[0];
    const largestSector = portfolio.sectorAllocation[0];
    const positiveReturn = portfolio.returnPercentage >= 0;

    const drivers = [
      `Portfolio value is ${this.formatCurrency(portfolio.currentValuePaise)} against ${this.formatCurrency(portfolio.investedPaise)} invested.`,
      `Overall portfolio return is ${portfolio.returnPercentage.toFixed(2)}%.`,
    ];

    if (largestHolding) {
      drivers.push(
        `${largestHolding.symbol} is the largest holding at ${largestHolding.weightPercentage.toFixed(1)}% of current value.`,
      );
    }

    if (largestSector) {
      drivers.push(
        `${largestSector.label} is the largest sector grouping at ${largestSector.percentage.toFixed(1)}%.`,
      );
    }

    return {
      headline: positiveReturn
        ? "Your portfolio is currently above its invested value"
        : "Your portfolio is currently below its invested value",
      summary: `Based on the portfolio data available at ${new Date(snapshot.generatedAt).toLocaleString("en-IN")}, the portfolio has a ${portfolio.returnPercentage.toFixed(2)}% return across ${portfolio.holdings.length} holdings.`,
      drivers,
      considerations: [
        largestHolding
          ? `Review whether a ${largestHolding.weightPercentage.toFixed(1)}% position in ${largestHolding.symbol} matches your diversification goals.`
          : "Add holdings to make portfolio-level analysis more meaningful.",
        largestSector
          ? `Consider how exposed the portfolio is to ${largestSector.label} if that sector experiences a downturn.`
          : "Record sector information to enable concentration analysis.",
      ],
      disclaimer:
        "This is an analytical summary, not personalized investment advice or a buy/sell recommendation.",
    };
  }

  private formatCurrency(paise: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  }
}
