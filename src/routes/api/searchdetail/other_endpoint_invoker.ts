import type { AnswerAndSearchData } from '../searchquery/search_query_endpoint';
import type { MyDetailSearchResult } from './brave_search_detail';

export class OtherEndpointInvoker {
    public async invoke(searchquery_url: string, password: string, data: MyDetailSearchResult[]): Promise<AnswerAndSearchData> {
        console.log(`searchquery_url: ${searchquery_url}`);
        const response = await fetch(searchquery_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'password': password
            },
            body: JSON.stringify(data)
        });
        console.log(`response-status from subrequest to 'searchquery': ${response.status}`);
        if (!response.ok) {
            throw new Error(`Failed to invoke ${searchquery_url} - response was: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
}

