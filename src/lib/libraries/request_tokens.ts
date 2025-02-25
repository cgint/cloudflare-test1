if (!import.meta.env.SSR) {
    throw new Error('This section has to run in SSR mode');
}

const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN;

export function checkBearerToken(url: URL, req: Request): boolean {
    return fetchBearerToken(url, req) === BEARER_TOKEN;
}

export function fetchBearerToken(url: URL, req: Request): string {
    let token = req.headers.get('password');
    if (!token) {
        token = url.searchParams.get('password');
    }
    return token || "";
}