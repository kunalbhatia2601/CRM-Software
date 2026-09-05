import aiService from "./ai.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok } from "../../utils/apiResponse.js";

class AiController {
  /**
   * POST /api/ai/generate
   * Generic AI generation using a system prompt slug + user prompt.
   */
  generate = catchAsync(async (req, res) => {
    const { systemPromptSlug, userPrompt, context, structured } = req.body;
    const result = await aiService.generate({
      systemPromptSlug,
      userPrompt,
      context: context || {},
      structured: structured !== false,
    });
    console.log("result", result);
    return ok(res, "AI response generated", result);
  });

  /**
   * POST /api/ai/models
   * The provider's live model catalogue, so Settings never ships a stale list.
   */
  listModels = catchAsync(async (req, res) => {
    const { provider, apiKey, baseUrl } = req.body || {};
    const result = await aiService.listModels({ provider, apiKey, baseUrl });
    return ok(res, "Models retrieved", result);
  });

  /**
   * POST /api/ai/search
   * CRM Search Assistant — natural language search with AI-powered answer.
   */
  searchAndAnswer = catchAsync(async (req, res) => {
    const { question } = req.body;
    const result = await aiService.searchAndAnswer(question);
    return ok(res, "Search answer generated", result);
  });
}

export default new AiController();
