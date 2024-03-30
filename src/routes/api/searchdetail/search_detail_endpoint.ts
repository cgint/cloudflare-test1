import { json } from '@sveltejs/kit';
import type { BraveSearchDetailService } from './brave_search_detail';
import { QueryVector } from './query_vector';

const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN;

export class BraveSearchDetailEndpoint {
    private braveSearchDetailService: BraveSearchDetailService;

    constructor(braveSearchDetailService: BraveSearchDetailService) {
        this.braveSearchDetailService = braveSearchDetailService;
    }

    public async search(url: URL, request: Request): Promise<Response> {
        if (!this.checkBearerToken(url, request)) {
            return json({ error: 'Invalid token' }, { status: 401 });
        }
        const query = url.searchParams.get('query');
        if (!query) {
            return json({ error: 'Query parameter is required' }, { status: 400 });
        }
        let stage = 0;
        try {
            console.log("searching", query);
            stage=1;
            const data = await this.braveSearchDetailService.fetchDetails(query);
            console.log("about to call toDocuments");
            stage=2;
            const docs = this.braveSearchDetailService.toDocuments(data);
            console.log("about to call QueryVector");
            stage=3;
            const v = new QueryVector();
            console.log("about to call query on vector");
            stage=4;
            const result = await v.query(query, docs);
            console.log("about to return result");
            stage=5;
            return json({ vector: result, plain: data });
        } catch (err) {
            console.error("search error", err);
            return json({ error: this.exceptionToString(stage, err) }, { status: 500 });
        }
    };

    private exceptionToString(stage: number,err: any): string {
        return `Stage: ${stage} - Type: ${typeof err} - ${JSON.stringify(err)}`;
    }

    private checkBearerToken(url: URL, req: Request): boolean {
        let token = req.headers.get('password');
        if (!token) {
            token = url.searchParams.get('password');
        }
        return token === BEARER_TOKEN;
    }
}