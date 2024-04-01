import { MultiFetchEndpointInvoker } from "../../routes/api/multifetch/multi_fetch_endpoint_invoker";


function timeout_cancel(ms: number, fetchCall: Promise<globalThis.Response>): Promise<void> {
    return new Promise((_, reject) => setTimeout(() => {
        fetchCall.then(response => {
            if (response.body) {
                response.body.cancel();
            }
            return reject(new Error(`Timeout of ${ms}ms exceeded`));
        });
    }, ms));
}

export async function fetchWithTimeout(url: string, headers: { [key: string]: string }, timeoutMs: number): Promise<void | globalThis.Response> {
    try {
        const fetchCall = fetch(url, {
            headers: headers
        });
        return Promise.race([
            fetchCall,
            timeout_cancel(timeoutMs, fetchCall)
        ]);
    }
    catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;
    }
}

export async function remoteMultiFetch(url: URL, request: Request, urls: string[]): Promise<Response> {
    const remoteInvoker = new MultiFetchEndpointInvoker();
    return await remoteInvoker.multifetch(url, request, urls);
}

