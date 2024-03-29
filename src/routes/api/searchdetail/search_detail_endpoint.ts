import { json } from '@sveltejs/kit';
import type { BraveSearchDetailService } from './brave_search_detail';

const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN;

export class BraveSearchDetailEndpoint {
    private braveSearchDetailService: BraveSearchDetailService;

    constructor(braveSearchDetailService: BraveSearchDetailService) {
        this.braveSearchDetailService = braveSearchDetailService;
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
            const data = await this.braveSearchDetailService.fetchDetails(query);
            return json(data);
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
}