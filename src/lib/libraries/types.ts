
export interface ConsideredDoc {
    url: string;
    age_normalized: string;
    contentSnippet: string;
}

export interface QueryResult {
    result: string;
    docsConsidered: ConsideredDoc[];
    stats: {
        docCount: number;
        splitCount: number;
    };
}

export interface SearchEngineResult {
    searchQuery?: string;
    url: string;
    title: string;
    description: string;
    age_normalized: string;
}

export interface AnswerAndSearchData {
    answer: QueryResult
    searchdata: SearchEngineResult[]
}