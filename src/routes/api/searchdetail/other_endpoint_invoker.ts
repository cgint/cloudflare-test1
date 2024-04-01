import type { MyDetailSearchResult } from './brave_search_detail';

export class OtherEndpointInvoker {
    public async invoke(searchquery_url: string, password: string, data: MyDetailSearchResult[]): Promise<Response> {
        console.log(`searchquery_url: ${searchquery_url}`);
        const response = await fetch(searchquery_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'password': password
            },
            body: JSON.stringify(data)
        });
        return response;

    }
}

