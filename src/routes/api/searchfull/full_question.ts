import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { TogetherAIEmbeddings } from "@langchain/community/embeddings/togetherai";
import { TogetherAI } from "@langchain/community/llms/togetherai";
import { ChatGroq } from "@langchain/groq";
import { ChatCloudflareWorkersAI } from "@langchain/cloudflare";
import type { MySearchResult } from "../search/brave_search";
import type { MyDetailSearchResult, SearchEngineResult } from "../searchdetail/brave_search_detail";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const TOGETHER_AI_API_KEY = import.meta.env.VITE_TOGETHER_AI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const CLOUDFLARE_ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = import.meta.env.VITE_CLOUDFLARE_API_TOKEN;

function getEmbeddingsProviderFor(model: string) {
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

function getLlmFor(model: string) {
    if (model.startsWith("cloudflare/")) {
        return new ChatCloudflareWorkersAI({
            model: model.replace("cloudflare/", ""),
            cloudflareAccountId: CLOUDFLARE_ACCOUNT_ID,
            cloudflareApiToken: CLOUDFLARE_API_TOKEN,
          });
    } else if (model.startsWith("groq/")) {
        return new ChatGroq({
            temperature: 0.1,
            apiKey: GROQ_API_KEY,
            modelName: model.replace("groq/", "")
          });
    } else if (model.startsWith("togethercomputer/")) {
        return new TogetherAI({
            temperature: 0.1, maxTokens: 1000,
            apiKey: TOGETHER_AI_API_KEY,
            modelName: model.replace("togethercomputer/", "")
        });
    } else if (model.startsWith("openai/")) {
        return new ChatOpenAI({
            temperature: 0.1, maxTokens: 1000,
            openAIApiKey: OPENAI_API_KEY,
            modelName: model.replace("openai/", "")
        });
    } else {
        throw new Error(`Unable to determine the provider for chat model: ${model}`);
    }
}
export interface ConsideredDoc {
    url: string;
    age_normalized: string;
    contentSnippet: string;
}

export interface FullQueryResult {
    result: string;
    docsConsidered: ConsideredDoc[];
    stats: {
        docCount: number;
        splitCount: number;
    };
}

export class FullQuestion {
    async query(question: string, docs: Document[]): Promise<FullQueryResult> {
        if (docs.length === 0) {
            return {
                result: "Got no documents as input so I can not answer your question!",
                docsConsidered: [],
                stats: {
                    docCount: 0, splitCount: 0
                }
            };
        }
        const query_full_start_time = performance.now();
        const chain = await this.buildChain();

        const rag_start_time = performance.now();
        const runOutput = await chain.invoke({
            question: question,
            context: docs,
        });
        const rag_end_time = performance.now();
        console.log("Full-Question took ms", rag_end_time - rag_start_time);
        console.log("query_full took ms", rag_end_time - query_full_start_time);

        return {
            result: runOutput,
            docsConsidered: docs.map(doc => ({
                url: doc.metadata.url,
                age_normalized: doc.metadata.age_normalized,
                contentSnippet: doc.pageContent
            })),
            stats: {
                docCount: docs.length,
                splitCount: 0
            }
        };
    }

    private async buildChain() {
        let llm_model = import.meta.env.VITE_INFERENCE_MODEL;
        console.log("using model", llm_model);
        const llm = getLlmFor(llm_model);
        const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
        const chain = await createStuffDocumentsChain({
            llm,
            prompt,
            outputParser: new StringOutputParser(),
        });
        return chain;
    }

    public toDocuments(pages: MyDetailSearchResult[]): Document[] {
        return pages.map((page) => new Document({
            pageContent: page.textContent,
            metadata: { source: "webpage", url: page.url, age_normalized: page.age_normalized },
        }));
    }

    public toSearchEngineResult(pages: MySearchResult[]): SearchEngineResult[] {
        return pages.map((page) => ({
            url: page.url,
            title: page.title,
            description: page.description,
            age_normalized: page.age_normalized
        }));
    }

}
