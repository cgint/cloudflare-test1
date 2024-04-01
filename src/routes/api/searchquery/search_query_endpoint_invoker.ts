import type { AnswerAndSearchData } from './search_query_endpoint';
import type { MyDetailSearchResult } from '../searchdetail/brave_search_detail';
import { fetchBearerToken } from '$lib/libraries/request_tokens';

export class SearchQueryEndpointInvoker {
    public async search(url: URL, request: Request, data: MyDetailSearchResult[]): Promise<AnswerAndSearchData> {
        const server_address = url.protocol + '//' + url.hostname + (url.port ? ':' + url.port : '');
        const query = url.searchParams.get('query') ?? '';
        const searchquery_url = `${server_address}/api/searchquery?query=${encodeURIComponent(query)}`;
        console.log(`searchquery_url: ${searchquery_url}`);
        const response = await fetch(searchquery_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'password': fetchBearerToken(url, request)
            },
            body: JSON.stringify(data)
        });
        console.log(`response-status from subrequest to 'searchquery': ${response.status}`);
        if (!response.ok) {
            throw new Error(`Failed to invoke ${searchquery_url} - response was: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
}

