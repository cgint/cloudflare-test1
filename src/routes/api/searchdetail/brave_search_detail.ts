import type { BraveSearchService, BraveWebSearchResult, MySearchResult } from '../search/brave_search';
import { UrlContentFetcher, type FetchURLResult } from './url_content_fetcher';
import { Document } from "@langchain/core/documents";

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

    public toDocuments(pages: MyDetailSearchResult[]): Document[] {
        return pages.map((page) => new Document({
            pageContent: page.textContent,
            metadata: { source: "webpage", url: page.url, age_normalized: page.age_normalized },
        }));
    }

    public toSearchEngineResult(pages: MySearchResult[]): SearchEngineResult[] {
        return pages.map((page) => ({
            url: page.url,
            title: page.title,
            description: page.description,
            age_normalized: page.age_normalized
        }));
    }
}

