import { BraveSearchEndpoint } from './search_endpoint';
import { BraveSearchService } from './brave_search';

const searchEndpoint = new BraveSearchEndpoint(new BraveSearchService());

export const GET = async ({ url, request }) => {
    const params = new URLSearchParams(url.search);
    const freshness = params.get('freshness') || "";
    return searchEndpoint.search(url, request, freshness);
};

