import { BraveSearchService } from '../search/brave_search';
import { BraveSearchDetailService, type MyDetailSearchResult } from '../searchdetail/brave_search_detail';
import { UrlContentFetcher } from '../searchdetail/url_content_fetcher';
import { QueryVector } from './query_vector';
import { SearchQueryEndpoint } from './search_query_endpoint';

const bsds = new BraveSearchDetailService(new BraveSearchService(), new UrlContentFetcher());
const searchQueryEndpoint = new SearchQueryEndpoint(bsds, new QueryVector());

export const POST = async ({ url, request }) => {
    try {
        const data: MyDetailSearchResult[] = await request.json();
        const search_result = await searchQueryEndpoint.search(url, request, data);
        return search_result;
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};

