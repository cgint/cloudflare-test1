import { BraveSearchService } from '../search/brave_search';
import { BraveSearchDetailService } from './brave_search_detail';
import { BraveSearchDetailEndpoint } from './search_detail_endpoint';
import { UrlContentFetcher } from './url_content_fetcher';

const searchDetailEndpoint = new BraveSearchDetailEndpoint(new BraveSearchDetailService(new BraveSearchService(), new UrlContentFetcher()));

export const GET = async ({ url, request }) => {
    return searchDetailEndpoint.search(url, request);
};

