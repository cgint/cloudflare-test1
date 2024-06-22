import type { BraveSearchService, BraveWebSearchResult, MySearchResult } from '../search/brave_search';
import { UrlContentFetcher, type FetchURLResult } from './url_content_fetcher';

export const DL_DETAIL_FETCH_LIMIT = parseInt(import.meta.env.VITE_DL_DETAIL_FETCH_LIMIT || '10');

export interface BraveWebSearchDetailResult extends BraveWebSearchResult {
    textContent: string;
}

export interface MyDetailSearchResult extends MySearchResult {
    textContent: string;
}

export interface SearchEngineResult {
    url: string;
    title: string;
    description: string;
    age_normalized: string;
}

export class BraveSearchDetailService {
    private braveSearchService: BraveSearchService;
    private urlContentFetcher: UrlContentFetcher;

    constructor(braveSearchService: BraveSearchService, urlContentFetcher: UrlContentFetcher) {
        this.braveSearchService = braveSearchService;
        this.urlContentFetcher = urlContentFetcher;
    }

    public async fetchDetails(query: string, limit: number = DL_DETAIL_FETCH_LIMIT, freshness: string = ''): Promise<MyDetailSearchResult[]> {
        const results: MySearchResult[] = await this.braveSearchService.fetchBraveWebSearchMyResults(query, freshness);
        const limitedResults = results.slice(0, limit);
        console.log("about to fetch details for ", limitedResults.length, " urls from ", results.length, " results");
        const limitedResultUrls = limitedResults.map(result => result.url);
        const textContents: FetchURLResult[] = await this.urlContentFetcher.fetchURLs(limitedResultUrls);
        return limitedResults.map((result, index) => ({ ...result, textContent: textContents[index].value }));
    }

    public async fetchDetailsRemote(url: URL, request: Request, query: string, urls: string[], limit: number = DL_DETAIL_FETCH_LIMIT, freshness: string = ''): Promise<MyDetailSearchResult[]> {
        let limitedResults: MySearchResult[] = [];
        if(urls.length > 0) {
            limitedResults = this.createSearchResultsFromURLs(urls);
        } else {
            const results: MySearchResult[] = await this.braveSearchService.fetchBraveWebSearchMyResults(query, freshness);
            limitedResults = results.slice(0, limit);
            console.log("about to fetch details for ", limitedResults.length, " urls from ", results.length, " results");
        }
        return await this.fetchFromUrls(url, request, limitedResults);
    }

    private createSearchResultsFromURLs(urls: string[]): MySearchResult[] {
        return urls.map(url => (
            {
                url: url,
                title: url,
                description: url,
                language: '',
                type: '',
                subtype: '',
                age_normalized: '',
                extra_snippets: []
            }
        ));
    }
    
    private async fetchFromUrls(url: URL, request: Request,  limitedResults: MySearchResult[]) {
        const limitedResultUrls = limitedResults.map(result => result.url);
        const textContents: FetchURLResult[] = await this.urlContentFetcher.fetchURLsRemote(url, request, limitedResultUrls);
        console.log("num-limitedResultUrls", limitedResultUrls.length, "num-textContents", textContents.length);
        return limitedResults.map((result, index) => ({ ...result, textContent: textContents[index].value }));
    }
}

