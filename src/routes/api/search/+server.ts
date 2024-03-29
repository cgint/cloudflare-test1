import { BraveSearchEndpoint } from './search_endpoint';
import { BraveSearchService } from './brave_search';

const searchEndpoint = new BraveSearchEndpoint(new BraveSearchService());

export const GET = async ({ url, request }) => {
    return searchEndpoint.search(url, request);
};

