import axios from 'axios';

export interface FetchURLResult {
  url: string;
  value: string;
  success: boolean;
}

export class URLContentFetcher {
  private DL_TIMEOUT_MS = 1000;

  public async fetchURLs(urls: string[]): Promise<FetchURLResult[]> {
    return this.downloadURLs(urls, this.DL_TIMEOUT_MS).then(results => {
      return results.map((result, index) => {
        let url = urls[index];
        let success = result.status === 'fulfilled';
        let val: any = null;
        if (result.status === 'fulfilled') { // without this duplication the compiler can not infer the type of result
          val = result.value.data;
          console.log(`Success from ${url}:`, val);
        } else {
          val = result.reason.message;
          console.error(`Error fetching ${url}:`, val);
        }
        return { url: url, value: val, success: success };
      });
    });
  }

  private downloadURLs(urls: string[], timeout: number) {
    const promises = urls.map(url => this.fetchURLWithTimeout(url, timeout));
    return Promise.allSettled(promises);
  }

  private fetchURLWithTimeout(url: string, timeout: number) {
    return axios.get(url, { timeout });
  }
}
