import type { MyDetailSearchResult } from '../searchdetail/brave_search_detail';
import { QueryVector } from './query_vector';
import { SearchQueryEndpoint } from './search_query_endpoint';

const searchQueryEndpoint = new SearchQueryEndpoint(new QueryVector());

export const POST = async ({ url, request }) => {
    try {
        const data: MyDetailSearchResult[] = await request.json();
        const search_result = await searchQueryEndpoint.search(url, request, data);
        return search_result;
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};

