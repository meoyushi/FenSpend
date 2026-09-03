import { PortfolioSummary } from "@/domain/portfolio";
import {
  AIProvider,
  FinancialHealthInsight,
  FinancialSnapshot,
} from "@/infrastructure/ai/ai-provider";
import { MockAIProvider } from "@/infrastructure/ai/mock-ai-provider";
import { GroqAIProvider } from "@/infrastructure/ai/groq-ai-provider";

export class FinancialHealthService {
  constructor(private readonly aiProvider: AIProvider) {}

  async generateInsight(
    portfolio: PortfolioSummary,
  ): Promise<FinancialHealthInsight> {
    const snapshot: FinancialSnapshot = {
      portfolio,
      generatedAt: new Date().toISOString(),
    };

    return this.aiProvider.generateFinancialHealthInsight(snapshot);
  }
}

function createAIProvider(): AIProvider {
  if (process.env.AI_PROVIDER === "groq") {
    return new GroqAIProvider();
  }

  return new MockAIProvider();
}

export const financialHealthService = new FinancialHealthService(createAIProvider());
