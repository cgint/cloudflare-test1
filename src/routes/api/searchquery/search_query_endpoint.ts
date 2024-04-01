import { json } from '@sveltejs/kit';
import { QueryVector, type QueryVectorResult } from './query_vector';
import type { MyDetailSearchResult, SearchEngineResult } from '../searchdetail/brave_search_detail';
import { checkBearerToken } from '$lib/libraries/request_tokens';
import { exceptionToString } from '$lib/libraries/exception_helper';

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
        if (!checkBearerToken(url, request)) {
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
            return json({ error: exceptionToString(err) }, { status: 500 });
        }
    };
}