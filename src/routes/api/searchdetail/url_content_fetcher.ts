import { fetchWithTimeout } from "./fetch_timeout";
import { HtmlParser as HtmlParser } from "./html_parser";

const DL_MAX_CONCURRENCY = parseInt(import.meta.env.VITE_DL_MAX_CONCURRENCY || '5');

export interface FetchURLResult {
  url: string;
  value: string;
  success: boolean;
}

export class UrlContentFetcher {
  private DL_TIMEOUT_MS = 5000;
  private htmlParser: HtmlParser = new HtmlParser();

  public async fetchURLs(urls: string[]): Promise<FetchURLResult[]> {
    const results: PromiseSettledResult<void | globalThis.Response>[] = await this.downloadURLs(urls, this.DL_TIMEOUT_MS);
    return await Promise.all(results.map(async (result, index) => {
      let url = urls[index];
      let success = result.status === 'fulfilled';
      let val: string = "";
      if (result.status === 'fulfilled') { // without this duplication the compiler can not infer the type of result
        if(result.value instanceof globalThis.Response) {
          val = await result.value.text();
          val = this.htmlParser.cleanHTMLContent(val);
        }
        console.log(`Success from ${url}`);
      } else {
        val = result.reason.message;
        console.error(`Error fetching ${url}:`, val);
      }
      return { url: url, value: val, success: success };
    }));
  }

  private async downloadURLs(urls: string[], timeout: number): Promise<PromiseSettledResult<void | globalThis.Response>[]> {
    const chunkedUrls = this.chunkUrls(urls, DL_MAX_CONCURRENCY);
    let allResults: PromiseSettledResult<void | globalThis.Response>[] = [];
    for (const chunk of chunkedUrls) {
      const promises = chunk.map(url => fetchWithTimeout(url, timeout));
      const results = await Promise.allSettled(promises);
      allResults = [...allResults, ...results];
    }
    return allResults;
  }

  private chunkUrls(urls: string[], size: number): string[][] {
    const chunks = [];
    for (let i = 0; i < urls.length; i += size) {
      chunks.push(urls.slice(i, i + size));
    }
    return chunks;
  }

  // private downloadURLs(urls: string[], timeout: number): Promise<PromiseSettledResult<void | globalThis.Response>[]> {
  //   const promises = urls.map(url => fetchWithTimeout(url, timeout));
  //   return Promise.allSettled(promises);
  // }
}
