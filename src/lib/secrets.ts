if (!import.meta.env.SSR) {
    throw new Error('This section has to run in SSR mode');
}

export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
export const SUBSCRIPTION_TOKEN: string = import.meta.env.VITE_BRAVE_SUBSCRIPTION_TOKEN || '';