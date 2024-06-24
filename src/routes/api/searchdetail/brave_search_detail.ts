import { invokeChain } from '$lib/libraries/llm';
import type { BraveSearchService, BraveWebSearchResult, MySearchResult } from '../search/brave_search';
import { UrlContentFetcher, type FetchURLResult } from './url_content_fetcher';

import { ChatPromptTemplate } from "@langchain/core/prompts";

export const DL_DETAIL_FETCH_LIMIT = parseInt(import.meta.env.VITE_DL_DETAIL_FETCH_LIMIT || '10');

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

    public async fetchDetails(query: string, limit: number = DL_DETAIL_FETCH_LIMIT, freshness: string = ''): Promise<MyDetailSearchResult[]> {
        const results: MySearchResult[] = await this.braveSearchService.fetchBraveWebSearchMyResults(query, freshness);
        const limitedResults = results.slice(0, limit);
        console.log("about to fetch details for ", limitedResults.length, " urls from ", results.length, " results");
        const limitedResultUrls = limitedResults.map(result => result.url);
        const textContents: FetchURLResult[] = await this.urlContentFetcher.fetchURLs(limitedResultUrls);
        return limitedResults.map((result, index) => ({ ...result, textContent: textContents[index].value }));
    }

    public async fetchDetailsRemote(url: URL, request: Request, query: string, urls: string[], limit: number = DL_DETAIL_FETCH_LIMIT, freshness: string = '', useLLMQueries: boolean = false): Promise<MyDetailSearchResult[]> {
        let limitedResults: MySearchResult[] = [];
        if(urls.length > 0) {
            limitedResults = this.createSearchResultsFromURLs(urls, "provided-urls");
        } else {
            const queries = useLLMQueries ? await this.getQueriesForBraveSearch(query) : [query];
            const fetchPromises = queries.map(q => 
                this.braveSearchService.fetchBraveWebSearchMyResults(q, freshness)
                    .then(results => results.slice(0, limit))
            );
            const allResults = await Promise.all(fetchPromises);
            limitedResults = allResults.flat();
            console.log("about to fetch details for ", limitedResults.length, " urls");
        }
        return await this.fetchFromUrls(url, request, limitedResults);
    }

    private async getQueriesForBraveSearch(query: string) {
        const examples = [
            {"query": "When was Lewis Hamilton born ?", "output": "'Birth date Lewis Hamilton'"},
            {"query": "Is Michael J. Fox older than Bjork ?", "output": "'Birth date Michael J. Fox' +++ 'Birth date Bjork'"},
            {"query": "Are there more inhabitants in Paris or London ?", "output": "'Number of inhabitants Paris' +++ 'Number of inhabitants London'"}
        ]
        const exampleString = examples.map(example => `User question: ${example.query}\nWeb search queries: ${example.output}`).join("\n");
        const nowDate = new Date();
        const locale = 'en-CA'; // outputs 2024-03-01 for today and 12:00:00 for time
        const timezone = 'UTC';
        const today = nowDate.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone });
        const time = nowDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: timezone });
        const thePrompt = ChatPromptTemplate.fromTemplate(`
You are a helpful assistant that knows how to transform a user question into one or several web search queries.

General information:
 - Today is the ${today}
 - The current time is ${time} UTC

Here are some examples of how to transform user questions into web search queries:
${exampleString}

Extract maximum 3 web search queries from the user question.
Always exactly follow the format: 
- 'query1' for one query
- 'query1' +++ 'query2' for two queries
- 'query1' +++ 'query2' +++ 'query3' for three queries

User question: {query}
Web search queries:`);
        console.log("examplePrompt = ", await thePrompt.format({query: query}));
        const result = await invokeChain(thePrompt, {query: query});
        console.log("result = ", result);
        const queryRegex = /'([^']+)'/g;
        const extractedQueries = [];
        let match;
        while ((match = queryRegex.exec(result)) !== null) {
            extractedQueries.push(match[1]);
        }
        console.log("Extracted queries:", extractedQueries);
        return extractedQueries.length > 0 ? extractedQueries : [];
    }


    private createSearchResultsFromURLs(urls: string[], searchQuery?: string): MySearchResult[] {
        return urls.map(url => (
            {
                searchQuery: searchQuery,
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

