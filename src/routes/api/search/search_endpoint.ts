import { json } from '@sveltejs/kit';
import { BraveSearchService } from './brave_search';
import { checkBearerToken } from '../../../lib/libraries/request_tokens';

export class BraveSearchEndpoint {
    private braveSearchService: BraveSearchService;

    constructor(braveSearchService: BraveSearchService) {
        this.braveSearchService = braveSearchService;
    }

    public async search(url: URL, request: Request, freshness: string = ""): Promise<Response> {
        if (!checkBearerToken(url, request)) {
            return json({ error: 'Invalid token' }, { status: 401 });
        }
        const query = url.searchParams.get('query');
        if (!query) {
            return json({ error: 'Query parameter is required' }, { status: 400 });
        }
    
        try {
            const data = await this.braveSearchService.fetchBraveWebSearchResults(query, freshness);
            return json(data);
        } catch (err) {
            console.error(err);
            return json({ error: JSON.stringify(err) }, { status: 500 });
        }
    };
}