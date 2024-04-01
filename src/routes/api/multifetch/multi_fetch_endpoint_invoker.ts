import { json } from '@sveltejs/kit';
import { fetchBearerToken } from '$lib/libraries/request_tokens';

export class MultiFetchEndpointInvoker {
    public async multifetch(url: URL, request: Request, urls: string[]): Promise<Response> {
        // const server_address = url.protocol + '//' + url.hostname + (url.port ? ':' + url.port : '');
        // const multifetch_url = `${server_address}/api/multifetch`;
        const multifetch_url = "https://fin-ass-wcx2kvmjea-ew.a.run.app/search/download/pages";
        console.log(`multifetch_url: ${multifetch_url}`);
        const response = await fetch(multifetch_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'password': fetchBearerToken(url, request)
            },
            body: JSON.stringify(urls)
        });
        console.log(`response-status from subrequest to 'multifetch': ${response.status}`);
        if (!response.ok) {
            throw new Error(`Failed to invoke ${multifetch_url} - response was: ${response.status} ${response.statusText}`);
        }
        const response_json: any = await response.json();
        return json(response_json);
    }
}

