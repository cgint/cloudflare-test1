import { json } from '@sveltejs/kit';
import type { BraveSearchDetailService } from './brave_search_detail';
import { DL_DETAIL_FETCH_LIMIT } from './brave_search_detail';
import { QueryVector } from '../searchquery/query_vector';
import type { OtherEndpointInvoker } from './other_endpoint_invoker';

const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN;

export class BraveSearchDetailEndpoint {
    private braveSearchDetailService: BraveSearchDetailService;
    private otherEndpointInvoker: OtherEndpointInvoker;

    constructor(braveSearchDetailService: BraveSearchDetailService, otherEndpointInvoker: OtherEndpointInvoker) {
        this.braveSearchDetailService = braveSearchDetailService;
        this.otherEndpointInvoker = otherEndpointInvoker;
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
            const server_address = url.protocol + '//' + url.hostname + (url.port ? ':' + url.port : '');
            const searchquery_url = `${server_address}/api/searchquery?query=${encodeURIComponent(query)}`;
            const response: Response = await this.otherEndpointInvoker.invoke(searchquery_url, this.fetchBearerToken(request, url), data);
            console.log(`response from subrequest to 'searchquery': ${response.status}`);
            if (response.status != 200) {
                return json({ error: 'Failed to fetch search results' }, { status: response.status });
            }
            const result_and_searchdata: any = await response.json();
            return json({ answer: result_and_searchdata.answer, searchdata: result_and_searchdata.searchdata });
        } catch (err) {
            console.error("search error", err);
            return json({ error: this.exceptionToString(err) }, { status: 500 });
        }
    };

    private exceptionToString(err: any): string {
        return `Type: ${typeof err} - Message: ${err.message} - ${JSON.stringify(err)}`;
    }

    private checkBearerToken(url: URL, req: Request): boolean {
        return this.fetchBearerToken(req, url) === BEARER_TOKEN;
    }

    private fetchBearerToken(req: Request, url: URL): string {
        let token = req.headers.get('password');
        if (!token) {
            token = url.searchParams.get('password');
        }
        return token || "";
    }
}

