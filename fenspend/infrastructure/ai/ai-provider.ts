import { PortfolioSummary } from "@/domain/portfolio";

export interface FinancialSnapshot {
  portfolio: PortfolioSummary;
  generatedAt: string;
}

export interface FinancialHealthInsight {
  headline: string;
  summary: string;
  drivers: string[];
  considerations: string[];
  disclaimer: string;
}

export interface AIProvider {
  generateFinancialHealthInsight(
    snapshot: FinancialSnapshot,
  ): Promise<FinancialHealthInsight>;
}
