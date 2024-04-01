import { json } from '@sveltejs/kit';
import { QueryVector, type QueryVectorResult } from './query_vector';
import type { BraveSearchDetailService, MyDetailSearchResult, SearchEngineResult } from '../searchdetail/brave_search_detail';

const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN;

export interface AnswerAndSearchData {
    answer: QueryVectorResult
    searchdata: SearchEngineResult[]
}

export class SearchQueryEndpoint {
    private queryVector: QueryVector;

    constructor(queryVector: QueryVector) {
        this.queryVector = queryVector;
    }

    public async search(url: URL, request: Request, data: MyDetailSearchResult[]): Promise<Response> {
        if (!this.checkBearerToken(url, request)) {
            return json({ error: 'Invalid token' }, { status: 401 });
        }
        const query = url.searchParams.get('query');
        if (!query) {
            return json({ error: 'Query parameter is required' }, { status: 400 });
        }
        try {
            const docs = this.queryVector.toDocuments(data);
            const result = await this.queryVector.query(query, docs);
            const searchdata = this.queryVector.toSearchEngineResult(data);
            const answerAndSearchData: AnswerAndSearchData = { answer: result, searchdata: searchdata };
            return json(answerAndSearchData);
        } catch (err) {
            console.error("search error", err);
            return json({ error: this.exceptionToString(err) }, { status: 500 });
        }
    };

    private exceptionToString(err: any): string {
        return `Type: ${typeof err} - Message: ${err.message} - ${JSON.stringify(err)}`;
    }

    private checkBearerToken(url: URL, req: Request): boolean {
        let token = req.headers.get('password');
        if (!token) {
            token = url.searchParams.get('password');
        }
        return token === BEARER_TOKEN;
    }
}