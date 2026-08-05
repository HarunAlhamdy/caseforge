export interface AiCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
}

export interface AiCompletionResponse {
  content: string;
  model: string;
  tokensUsed?: number;
}

export interface AiProvider {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}

export class OpenAiProvider implements AiProvider {
  private apiKey: string;

  constructor(apiKey = process.env.OPENAI_API_KEY ?? "") {
    this.apiKey = apiKey;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!this.apiKey) {
      return {
        content: `[stub] ${request.userPrompt.slice(0, 100)}`,
        model: request.model ?? "gpt-4o-mini",
      };
    }

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: this.apiKey });
    const response = await client.chat.completions.create({
      model: request.model ?? "gpt-4o-mini",
      temperature: request.temperature ?? 0.2,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
    });

    return {
      content: response.choices[0]?.message?.content ?? "",
      model: response.model,
      tokensUsed: response.usage?.total_tokens,
    };
  }
}

export function createAiService(): AiProvider {
  return new OpenAiProvider();
}
