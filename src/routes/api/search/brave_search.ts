import { error } from '@sveltejs/kit';
import { get_age_normalized, sortedByAgeNormalisedAsc, type AgeNormalisedResult } from './age_helper';

const BRAVE_WEB_SEARCH_API_ENDPOINT: string = 'https://api.search.brave.com/res/v1/web/search';
const BRAVE_NEWS_SEARCH_API_ENDPOINT: string = 'https://api.search.brave.com/res/v1/news/search';
const BRAVE_SUMMARIZER_API_ENDPOINT: string = 'https://api.search.brave.com/res/v1/summarizer/search';
const SUBSCRIPTION_TOKEN: string = import.meta.env.VITE_BRAVE_SUBSCRIPTION_TOKEN || '';

const DEFAULT_REQUEST_OPTIONS: Headers = new Headers({
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip',
    'X-Subscription-Token': SUBSCRIPTION_TOKEN
});

const DEFAULT_SEARCH_PARAMS: string = '&count=10&country=AT';


export interface BraveWebSearchResponse {
    query: {
        original: string;
        show_strict_warning: boolean;
        is_navigational: boolean;
        local_decision: string;
        local_locations_idx: number;
        is_news_breaking: boolean;
        spellcheck_off: boolean;
        country: string;
        bad_results: boolean;
        should_fallback: boolean;
        postal_code: string;
        city: string;
        header_country: string;
        more_results_available: boolean;
        state: string;
    };
    mixed: any; // i do not care about this
    type: string;
    web: {
        type: string;
        results: BraveWebSearchResult[];
        family_friendly: boolean;
    };
}

export interface BraveWebSearchResult {
    url: string;
    title: string;
    description: string;
    is_source_local: boolean;
    is_source_both: boolean;
    page_age?: string;
    language: string;
    family_friendly: boolean;
    type: string;
    subtype: string;
    meta_url: any;
    thumbnail: any;
    age?: string;
    extra_snippets: string[];
}



export interface MySearchResult extends AgeNormalisedResult {
    url: string;
    title: string;
    description: string;
    page_age?: string;
    language: string;
    type: string;
    subtype: string;
    age?: string;
    age_normalized: string;
    extra_snippets: string[];
}

export class BraveSearchService {
    private async fetchFromBraveAPI(endpoint: string, parameter: string, value: string, freshness: string = ''): Promise<Response> {
        const freshnessParam = freshness ? `&freshness=${freshness}` : '';
        const url = `${endpoint}?${parameter}=${encodeURIComponent(value)}${DEFAULT_SEARCH_PARAMS}${freshnessParam}`;
        console.log(`about to search using url: ${url}`);
        const response: Response = await fetch(url, { headers: DEFAULT_REQUEST_OPTIONS });

        if (!response.ok) {
            throw error(response.status, `Failed to fetch from Brave API: ${response.statusText}`);
        }

        return response;
    }

    public async fetchBraveWebSearchResults(query: string, freshness: string = ''): Promise<BraveWebSearchResponse> {
        const response = await this.fetchFromBraveAPI(BRAVE_WEB_SEARCH_API_ENDPOINT, 'q', query, freshness);
        return response.json();
    }

    // TODO this is only tested via endpoint as the logic moved here
    public async fetchBraveWebSearchMyResults(query: string, freshness: string = ''): Promise<MySearchResult[]> {
        const r = await this.fetchBraveWebSearchResults(query, freshness);
        const simplifiedResults: MySearchResult[] = r.web ? r.web.results.map(this.toMySearchResult) : [];
        return sortedByAgeNormalisedAsc(simplifiedResults);
    }

    private toMySearchResult(result: BraveWebSearchResult): MySearchResult {
        return {
            url: result.url,
            title: result.title,
            description: result.description,
            page_age: result.page_age,
            language: result.language,
            type: result.type,
            subtype: result.subtype,
            age: result.age,
            age_normalized: get_age_normalized(result),
            extra_snippets: result.extra_snippets
        };
    }

    public async fetchBraveNewsSearchResults(query: string): Promise<Response> {
        return this.fetchFromBraveAPI(BRAVE_NEWS_SEARCH_API_ENDPOINT, 'q', query);
    }

    public async fetchSummarizedContent(summaryKey: string): Promise<Response> {
        return this.fetchFromBraveAPI(BRAVE_SUMMARIZER_API_ENDPOINT, 'key', summaryKey);
    }
}

