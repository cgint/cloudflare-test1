import { BraveSearchService } from '../search/brave_search';
import { BraveSearchDetailService } from './brave_search_detail';
import { SearchQueryEndpointInvoker } from '../../../lib/libraries/search_query_endpoint_invoker';
import { BraveSearchDetailEndpoint } from './search_detail_endpoint';
import { UrlContentFetcher } from './url_content_fetcher';

const bsds = new BraveSearchDetailService(new BraveSearchService(), new UrlContentFetcher());
const searchDetailEndpoint = new BraveSearchDetailEndpoint(bsds, new SearchQueryEndpointInvoker());

export const GET = async ({ url, request }) => {
    const params = new URLSearchParams(url.search);
    const freshness = params.get('freshness') || "";
    const useLLMQueries = params.get('useLLMQueries') === 'true';
    return searchDetailEndpoint.search(url, request, freshness, useLLMQueries);
};

