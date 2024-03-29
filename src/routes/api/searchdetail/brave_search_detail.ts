import type { BraveSearchService, BraveWebSearchResult, MySearchResult } from '../search/brave_search';
import { UrlContentFetcher, type FetchURLResult } from './url_content_fetcher';

export interface BraveWebSearchDetailResult extends BraveWebSearchResult {
    textContent: string;
}

export interface MyDetailSearchResult extends MySearchResult {
    textContent: string;
}


export class BraveSearchDetailService {
    private braveSearchService: BraveSearchService;
    private urlContentFetcher: UrlContentFetcher;

    constructor(braveSearchService: BraveSearchService, urlContentFetcher: UrlContentFetcher) {
        this.braveSearchService = braveSearchService;
        this.urlContentFetcher = urlContentFetcher;
    }

    public async fetchDetails(query: string): Promise<MyDetailSearchResult[]> {
        const results: MySearchResult[] = await this.braveSearchService.fetchBraveWebSearchMyResults(query);
        const textContents: FetchURLResult[] = await this.urlContentFetcher.fetchURLs(results.map(result => result.url));
        return results.map((result, index) => ({ ...result, textContent: `OK ? ${textContents[index].success} - content: ${textContents[index].value}` }));
    }
}

