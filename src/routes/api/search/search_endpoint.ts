import { json } from '@sveltejs/kit';
import { BraveSearchService } from './brave_search';
import type { BraveWebSearchResult } from './brave_search';
import { get_age_normalized, sortedByAgeNormalisedAsc } from './age_helper';

const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN;

export interface AgeNormalisedResult {
    age_normalized: string;
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

export class BraveSearchEndpoint {
    private braveSearchService: BraveSearchService;

    constructor(braveSearchService: BraveSearchService) {
        this.braveSearchService = braveSearchService;
    }

    public async search(url: URL, request: Request): Promise<Response> {
        if (!this.checkBearerToken(url, request)) {
            return json({ error: 'Invalid token' }, { status: 401 });
        }
        const query = url.searchParams.get('query');
        if (!query) {
            return json({ error: 'Query parameter is required' }, { status: 400 });
        }
    
        try {
            const data = await this.braveSearchService.fetchBraveWebSearchResults(query);
            const simplifiedResults = data.web.results.map(this.toMySearchResult);
            return json(sortedByAgeNormalisedAsc(simplifiedResults));
        } catch (err) {
            console.error(err);
            return json({ error: JSON.stringify(err) }, { status: 500 });
        }
    };

    private checkBearerToken(url: URL, req: Request): boolean {
        let token = req.headers.get('password');
        if (!token) {
            token = url.searchParams.get('password');
        }
        return token === BEARER_TOKEN;
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
}