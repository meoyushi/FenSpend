import { Investment } from "@/domain/portfolio";

export interface MarketDataProvider {
  getInvestments(userEmail: string): Promise<Investment[]>;
  addInvestment(userEmail: string, investment: Investment): Promise<void>;
  removeInvestment(userEmail: string, investmentId: string): Promise<void>;
}

const DEMO_INVESTMENTS: Investment[] = [
  {
    id: "demo-tcs",
    symbol: "TCS",
    name: "Tata Consultancy Services",
    assetType: "STOCK",
    sector: "Technology",
    units: 20,
    averageCostPaise: 320000,
    currentPricePaise: 354000,
  },
  {
    id: "demo-infosys",
    symbol: "INFY",
    name: "Infosys",
    assetType: "STOCK",
    sector: "Technology",
    units: 30,
    averageCostPaise: 145000,
    currentPricePaise: 162500,
  },
  {
    id: "demo-hdfc",
    symbol: "HDFCBAL",
    name: "HDFC Balanced Advantage Fund",
    assetType: "MUTUAL_FUND",
    sector: "Diversified",
    units: 40,
    averageCostPaise: 180000,
    currentPricePaise: 192000,
  },
  {
    id: "demo-nifty",
    symbol: "NIFTYBEES",
    name: "Nippon India Nifty 50 ETF",
    assetType: "ETF",
    sector: "Broad Market",
    units: 15,
    averageCostPaise: 225000,
    currentPricePaise: 241000,
  },
  {
    id: "demo-bond",
    symbol: "GSEC2030",
    name: "Government Security 2030",
    assetType: "BOND",
    sector: "Fixed Income",
    units: 10,
    averageCostPaise: 98000,
    currentPricePaise: 99500,
  },
];

export class MockMarketDataProvider implements MarketDataProvider {
  private readonly investmentsByUser = new Map<string, Investment[]>();

  async getInvestments(userEmail: string): Promise<Investment[]> {
    const investments = this.investmentsByUser.get(userEmail) ?? DEMO_INVESTMENTS;
    return investments.map((investment) => ({ ...investment }));
  }

  async addInvestment(userEmail: string, investment: Investment): Promise<void> {
    const investments = await this.getInvestments(userEmail);
    this.investmentsByUser.set(userEmail, [...investments, investment]);
  }

  async removeInvestment(userEmail: string, investmentId: string): Promise<void> {
    const investments = await this.getInvestments(userEmail);
    this.investmentsByUser.set(
      userEmail,
      investments.filter((investment) => investment.id !== investmentId),
    );
  }
}
