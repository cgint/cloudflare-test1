import { Document } from "@langchain/core/documents";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import type { MySearchResult } from "../search/brave_search";
import type { MyDetailSearchResult, SearchEngineResult } from "../searchdetail/brave_search_detail";
import { getLlmFor } from "../../../lib/libraries/llm";

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
                splitCount: docs.length
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
