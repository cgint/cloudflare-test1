import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { TogetherAIEmbeddings } from "@langchain/community/embeddings/togetherai";
import { TogetherAI } from "@langchain/community/llms/togetherai";
import { ChatGroq } from "@langchain/groq";
import { ChatCloudflareWorkersAI } from "@langchain/cloudflare";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const TOGETHER_AI_API_KEY = import.meta.env.VITE_TOGETHER_AI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const CLOUDFLARE_ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = import.meta.env.VITE_CLOUDFLARE_API_TOKEN;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export function getEmbeddingsProviderFor(model: string) {
    if (model.startsWith("togethercomputer/")) {
        return new TogetherAIEmbeddings({
            apiKey: TOGETHER_AI_API_KEY,
            modelName: model
        });
    } else if (model.startsWith("openai/")) {
        return new OpenAIEmbeddings({
            openAIApiKey: OPENAI_API_KEY,
            modelName: model.replace("openai/", "")
        });
    } else {
        throw new Error(`Unable to determine the provider for embedding model: ${model}`);
    }
}

export function getLlmFor(model: string) {
    if (model.startsWith("cloudflare/")) {
        return new ChatCloudflareWorkersAI({
            model: model.replace("cloudflare/", ""),
            cloudflareAccountId: CLOUDFLARE_ACCOUNT_ID,
            cloudflareApiToken: CLOUDFLARE_API_TOKEN,
          });
    } else if (model.startsWith("groq/")) {
        return new ChatGroq({
            temperature: 0.1, maxTokens: 1024,
            apiKey: GROQ_API_KEY,
            modelName: model.replace("groq/", "")
          });
    } else if (model.startsWith("togethercomputer/")) {
        return new TogetherAI({
            temperature: 0.1, maxTokens: 1024,
            apiKey: TOGETHER_AI_API_KEY,
            modelName: model.replace("togethercomputer/", "")
        });
    } else if (model.startsWith("openai/")) {
        return new ChatOpenAI({
            temperature: 0.1, maxTokens: 1024,
            openAIApiKey: OPENAI_API_KEY,
            modelName: model.replace("openai/", "")
        });
    } else if (model.startsWith("google/")) {
        return new ChatGoogleGenerativeAI({
            temperature: 0.1, maxOutputTokens: 1024,
            apiKey: GEMINI_API_KEY,
            modelName: model.replace("google/", ""),
            maxRetries: 3,
            safetySettings: [
                {
                  category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                  threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                },
              ]
        });
    } else {
        throw new Error(`Unable to determine the provider for chat model: ${model}`);
    }
}