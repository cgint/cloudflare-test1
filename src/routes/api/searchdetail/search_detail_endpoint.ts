import { json } from '@sveltejs/kit';
import type { BraveSearchDetailService } from './brave_search_detail';
import { DL_DETAIL_FETCH_LIMIT } from './brave_search_detail';
import { QueryVector } from './query_vector';

const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN;

export class BraveSearchDetailEndpoint {
    private braveSearchDetailService: BraveSearchDetailService;
    private queryVector: QueryVector;

    constructor(braveSearchDetailService: BraveSearchDetailService, queryVector: QueryVector) {
        this.braveSearchDetailService = braveSearchDetailService;
        this.queryVector = queryVector;
    }

    public async search(url: URL, request: Request, freshness: string = ""): Promise<Response> {
        if (!this.checkBearerToken(url, request)) {
            return json({ error: 'Invalid token' }, { status: 401 });
        }
        const query = url.searchParams.get('query');
        if (!query) {
            return json({ error: 'Query parameter is required' }, { status: 400 });
        }
        try {
            const data = await this.braveSearchDetailService.fetchDetails(query, DL_DETAIL_FETCH_LIMIT, freshness);
            const docs = this.braveSearchDetailService.toDocuments(data);
            const result = await this.queryVector.query(query, docs);
            return json({ vector: result, plain: data });
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