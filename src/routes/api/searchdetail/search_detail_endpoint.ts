import { json } from '@sveltejs/kit';
import type { BraveSearchDetailService } from './brave_search_detail';
import { DL_DETAIL_FETCH_LIMIT } from './brave_search_detail';
import type { SearchQueryEndpointInvoker } from '../../../lib/libraries/search_query_endpoint_invoker';
import type { AnswerAndSearchData } from '../searchquery/search_query_endpoint';
import { checkBearerToken } from '$lib/libraries/request_tokens';
import { exceptionToString } from '$lib/libraries/exception_helper';

export class BraveSearchDetailEndpoint {
    private braveSearchDetailService: BraveSearchDetailService;
    private otherEndpointInvoker: SearchQueryEndpointInvoker;

    constructor(braveSearchDetailService: BraveSearchDetailService, otherEndpointInvoker: SearchQueryEndpointInvoker) {
        this.braveSearchDetailService = braveSearchDetailService;
        this.otherEndpointInvoker = otherEndpointInvoker;
    }

    public async search(url: URL, request: Request, freshness: string = ""): Promise<Response> {
        if (!checkBearerToken(url, request)) {
            return json({ error: 'Invalid token' }, { status: 401 });
        }
        const query = url.searchParams.get('query');
        const urls = url.searchParams.get('urls');
        const urlsList = urls ? urls.split(',') : [];
        if (!query) {
            return json({ error: 'Query parameter is required' }, { status: 400 });
        }
        if (query === '') {
            return json({ error: 'Query parameter is not allowed to be empty' }, { status: 400 });
        }
        try {
            const data = await this.braveSearchDetailService.fetchDetailsRemote(url, request, query, urlsList, DL_DETAIL_FETCH_LIMIT, freshness);
            let response: AnswerAndSearchData
            if (urlsList.length > 0) {
                response = await this.otherEndpointInvoker.invoke(url, "searchfull", request, data);
            } else {
                response = await this.otherEndpointInvoker.invoke(url, "searchquery", request, data);
            }
            return json({ answer: response.answer, searchdata: response.searchdata });
        } catch (err) {
            console.error("search error", err);
            return json({ error: exceptionToString(err) }, { status: 500 });
        }
    };
}

