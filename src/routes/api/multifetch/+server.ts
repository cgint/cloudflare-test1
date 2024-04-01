import { UrlContentFetcher } from '../searchdetail/url_content_fetcher';
import { MultiFetchEndpoint } from './multi_fetch_endpoint';

const multiFetchEndpoint = new MultiFetchEndpoint(new UrlContentFetcher());

export const POST = async ({ url, request }) => {
    try {
        const urls: string[] = await request.json();
        return multiFetchEndpoint.multifetch(url, request, urls);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};

