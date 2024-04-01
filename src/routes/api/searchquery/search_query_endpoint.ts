import { json } from '@sveltejs/kit';
import { QueryVector } from './query_vector';
import type { BraveSearchDetailService, MyDetailSearchResult } from '../searchdetail/brave_search_detail';

const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN;

export class SearchQueryEndpoint {
    private braveSearchDetailService: BraveSearchDetailService;
    private queryVector: QueryVector;

    constructor(braveSearchDetailService: BraveSearchDetailService, queryVector: QueryVector) {
        this.braveSearchDetailService = braveSearchDetailService;
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
            const docs = this.braveSearchDetailService.toDocuments(data);
            const result = await this.queryVector.query(query, docs);
            const searchdata = this.braveSearchDetailService.toSearchEngineResult(data);
            return json({ answer: result, searchdata: searchdata });
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