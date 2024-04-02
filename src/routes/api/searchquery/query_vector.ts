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
            temperature: 0.1, maxTokens: 100,
            apiKey: TOGETHER_AI_API_KEY,
            modelName: model.replace("togethercomputer/", "")
        });
    } else if (model.startsWith("openai/")) {
        return new ChatOpenAI({
            temperature: 0.1, maxTokens: 100,
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

export interface QueryVectorResult {
    result: string;
    docsConsidered: ConsideredDoc[];
    stats: {
        docCount: number;
        splitCount: number;
    };
}

export class QueryVector {
    private textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 2000,
        chunkOverlap: 400
    });
    async query(question: string, docs: Document[]): Promise<QueryVectorResult> {
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
        const splits = await this.textSplitter.splitDocuments(docs);
        const vectorStore = await this.splitAndBuildVectorStoreFrom(docs, splits);
        const retrievedDocs = await this.retrieveDocuments(vectorStore, question);
        const ragChain = await this.buildRAGChain();

        const rag_start_time = performance.now();
        const runOutput = await ragChain.invoke({
            question: question,
            context: retrievedDocs,
        });
        const rag_end_time = performance.now();
        console.log("RAG took ms", rag_end_time - rag_start_time);
        console.log("query_full took ms", rag_end_time - query_full_start_time);

        return {
            result: runOutput,
            docsConsidered: retrievedDocs.map(doc => ({
                url: doc.metadata.url,
                age_normalized: doc.metadata.age_normalized,
                contentSnippet: doc.pageContent
            })),
            stats: {
                docCount: docs.length,
                splitCount: splits.length
            }
        };
    }

    private async splitAndBuildVectorStoreFrom(docs: Document[], splits: Document[]) {
        const embed_model = import.meta.env.VITE_EMBEDDING_MODEL;
        console.log(splits.length, "splits from", docs.length, "docs to process with", embed_model);
        const vector_fromdoc_start_time = performance.now();
        const vectorStore = await MemoryVectorStore.fromDocuments(
            splits,
            getEmbeddingsProviderFor(embed_model)
        );
        const vector_fromdoc_end_time = performance.now();
        console.log("vector init took ms", vector_fromdoc_end_time - vector_fromdoc_start_time);
        return vectorStore;
    }

    private async retrieveDocuments(vectorStore: MemoryVectorStore, query: string) {
        const retriever = vectorStore.asRetriever(11);
        const retrievedDocs = await retriever.getRelevantDocuments(query);
        console.log("retrievedDocs count ", retrievedDocs.length);
        retrievedDocs.forEach(doc => {
            console.log("content length", doc.pageContent.length, "doc meta", doc.metadata.url);
        });
        return retrievedDocs;
    }

    private async buildRAGChain() {
        let llm_model = import.meta.env.VITE_INFERENCE_MODEL;
        console.log("using model", llm_model);
        const llm = getLlmFor(llm_model);
        const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
        const ragChain = await createStuffDocumentsChain({
            llm,
            prompt,
            outputParser: new StringOutputParser(),
        });
        return ragChain;
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
