import {
  calculatePortfolioSummary,
  Investment,
  PortfolioSummary,
} from "@/domain/portfolio";
import {
  MarketDataProvider,
  MockMarketDataProvider,
} from "@/infrastructure/market-data/mock-market-data-provider";

export class PortfolioService {
  constructor(private readonly marketDataProvider: MarketDataProvider) {}

  async getSummary(userEmail: string): Promise<PortfolioSummary> {
    const investments = await this.marketDataProvider.getInvestments(userEmail);
    return calculatePortfolioSummary(investments);
  }

  async addInvestment(userEmail: string, investment: Investment): Promise<PortfolioSummary> {
    await this.marketDataProvider.addInvestment(userEmail, investment);
    return this.getSummary(userEmail);
  }

  async removeInvestment(userEmail: string, investmentId: string): Promise<PortfolioSummary> {
    await this.marketDataProvider.removeInvestment(userEmail, investmentId);
    return this.getSummary(userEmail);
  }
}

export const portfolioService = new PortfolioService(
  new MockMarketDataProvider(),
);
