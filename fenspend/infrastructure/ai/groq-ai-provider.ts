import OpenAI from "openai";
import {
  AIProvider,
  FinancialHealthInsight,
  FinancialSnapshot,
} from "@/infrastructure/ai/ai-provider";

const SYSTEM_PROMPT = `You are FenSpend's financial health explainer.
Analyze only the verified financial snapshot provided by the application.
Do not invent, estimate, or recalculate financial values.
Do not give buy, sell, or guaranteed-return recommendations.
Return only valid JSON with this exact shape:
{
  "headline": "short sentence",
  "summary": "two or three sentence explanation",
  "drivers": ["evidence-backed statement"],
  "considerations": ["non-prescriptive consideration"],
  "disclaimer": "brief financial disclaimer"
}
Every metric in the response must be traceable to the supplied snapshot.`;

export class GroqAIProvider implements AIProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(
    apiKey = process.env.GROQ_API_KEY,
    model = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
  ) {
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is required when AI_PROVIDER=groq");
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
      maxRetries: 1,
      timeout: 30_000,
    });
    this.model = model;
  }

  async generateFinancialHealthInsight(
    snapshot: FinancialSnapshot,
  ): Promise<FinancialHealthInsight> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(snapshot) },
      ],
    });

    const content = completion.choices[0]?.message.content;
    if (!content) {
      throw new Error("Groq returned an empty response");
    }

    return this.parseInsight(content);
  }

  private parseInsight(content: string): FinancialHealthInsight {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Groq returned invalid JSON");
    }

    if (!this.isInsight(parsed)) {
      throw new Error("Groq returned an invalid financial insight shape");
    }

    return parsed;
  }

  private isInsight(value: unknown): value is FinancialHealthInsight {
    if (!value || typeof value !== "object") return false;

    const insight = value as Record<string, unknown>;
    return (
      typeof insight.headline === "string" &&
      typeof insight.summary === "string" &&
      Array.isArray(insight.drivers) &&
      insight.drivers.every((item) => typeof item === "string") &&
      Array.isArray(insight.considerations) &&
      insight.considerations.every((item) => typeof item === "string") &&
      typeof insight.disclaimer === "string"
    );
  }
}
