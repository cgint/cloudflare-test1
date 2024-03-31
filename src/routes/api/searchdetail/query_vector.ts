import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

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
    async query(query: string, docs: Document[]): Promise<QueryVectorResult> {
        const query_full_start_time = performance.now();
        const splits = await this.textSplitter.splitDocuments(docs);
        const vectorStore = await this.splitAndBuildVectorStoreFrom(docs, splits);
        const retrievedDocs = await this.retrieveDocuments(vectorStore, query);
        const ragChain = await this.buildRAGChain();

        const rag_start_time = performance.now();
        const runOutput = await ragChain.invoke({
            question: query,
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
        console.log(splits.length, "splits from", docs.length, "docs");
        const vector_fromdoc_start_time = performance.now();
        const vectorStore = await MemoryVectorStore.fromDocuments(
            splits,
            new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY })
        );
        const vector_fromdoc_end_time = performance.now();
        console.log("vector init took ms", vector_fromdoc_end_time - vector_fromdoc_start_time);
        return vectorStore;
    }

    private async retrieveDocuments(vectorStore: MemoryVectorStore, query: string) {
        const retriever = vectorStore.asRetriever();
        const retrievedDocs = await retriever.getRelevantDocuments(query);
        console.log("retrievedDocs count ", retrievedDocs.length);
        retrievedDocs.forEach(doc => {
            console.log("content length", doc.pageContent.length, "doc meta", doc.metadata.url);
        });
        return retrievedDocs;
    }

    private async buildRAGChain() {
        // const model = "gpt-4-0125-preview";
        const model = "gpt-3.5-turbo-0125";
        // const model = "gpt-3.5-turbo";
        console.log("using model", model);
        const llm = new ChatOpenAI({ modelName: model, temperature: 0.1, maxTokens: 100, openAIApiKey: OPENAI_API_KEY });
        const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
        const ragChain = await createStuffDocumentsChain({
            llm,
            prompt,
            outputParser: new StringOutputParser(),
        });
        return ragChain;
    }

}
