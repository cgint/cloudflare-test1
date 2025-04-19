import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { BaseChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { GEMINI_API_KEY } from "$lib/secrets";


export async function invokeChain(prompt: BaseChatPromptTemplate, input: any) {
    console.log("invokeChain chain with input ", input);
    const chain = prompt.pipe(getLlmFromEnvironment()).pipe(new StringOutputParser());
    return await chain.invoke(input);
}

export function getEmbeddingsProviderFor(model: string) {
    if (model.startsWith("google/")) {
        return new GoogleGenerativeAIEmbeddings({
            apiKey: GEMINI_API_KEY,
            modelName: model.replace("google/", "")
        });
    } else {
        throw new Error(`Unable to determine the provider for embedding model: ${model}`);
    }
}

export function getLlmFromEnvironment(): BaseChatModel {
    let model = import.meta.env.VITE_INFERENCE_MODEL;
    console.log("using model", model);
    if (model.startsWith("google/")) {
        return new ChatGoogleGenerativeAI({
            temperature: 0.1, maxOutputTokens: 1024,
            apiKey: GEMINI_API_KEY,
            model: model.replace("google/", ""),
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