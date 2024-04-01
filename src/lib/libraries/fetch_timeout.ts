

function timeout(ms: number): Promise<void> {
    return new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout of ${ms}ms exceeded`)), ms));
}

export async function fetchWithTimeout(url: string, headers: { [key: string]: string }, timeoutMs: number): Promise<void | globalThis.Response> {
    try {
        return Promise.race([
            fetch(url, {
                headers: headers
            }),
            timeout(timeoutMs)
        ]);
    }
    catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;
    }
}