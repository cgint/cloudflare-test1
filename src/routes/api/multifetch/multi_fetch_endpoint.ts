import { json } from '@sveltejs/kit';
import { checkBearerToken } from '$lib/libraries/request_tokens';
import type { UrlContentFetcher } from '../searchdetail/url_content_fetcher';
import { exceptionToString } from '$lib/libraries/exception_helper';

export class MultiFetchEndpoint {
    private urlFetcher: UrlContentFetcher

    constructor(urlFetcher: UrlContentFetcher) {
        this.urlFetcher = urlFetcher;
    }

    public async multifetch(url: URL, request: Request, urls: string[]): Promise<Response> {
        if (!checkBearerToken(url, request)) {
            console.log("multifetch error", "Invalid token");
            return json({ error: 'Invalid token' }, { status: 401 });
        }
        try {
            console.log(`multifetch starting with ${urls} urls`);
            const url_results = await this.urlFetcher.fetchURLs(urls);
            return json(url_results);
        } catch (err) {
            console.error("multifetch error", err);
            return json({ error: exceptionToString(err) }, { status: 500 });
        }
    };
}