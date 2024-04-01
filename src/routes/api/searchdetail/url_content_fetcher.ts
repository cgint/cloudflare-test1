import { fetchWithTimeout, remoteMultiFetch } from "$lib/libraries/fetch_timeout";
import { HtmlParser as HtmlParser } from "$lib/libraries/html_parser";

const DL_MAX_CONCURRENCY = parseInt(import.meta.env.VITE_DL_MAX_CONCURRENCY || '5');
const HEADERS_FOR_FETCH = {
  "User-Agent": "private playground script to help devs understand resources better",
  "Accept": "*/*",
}
export interface FetchURLResult {
  url: string;
  value: string;
  success: boolean;
}

export class UrlContentFetcher {
  private DL_TIMEOUT_MS = 10000;
  private htmlParser: HtmlParser = new HtmlParser();

  public async fetchURLs(urls: string[]): Promise<FetchURLResult[]> {
    console.log(`fetchURLs: requesting ${urls.length} results from downloadURLs`);
    const results: PromiseSettledResult<void | globalThis.Response>[] = await this.downloadURLs(urls, this.DL_TIMEOUT_MS);
    console.log(`fetchURLs: got ${results.length} results from downloadURLs`);
    return await Promise.all(results.map(async (result, index) => {
      let url = urls[index];
      let success = result.status === 'fulfilled';
      let val: string = "";
      if (result.status === 'fulfilled') { // without this duplication the compiler can not infer the type of result
        if (result.value instanceof globalThis.Response) {
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
    console.log(`Downloading ${urls.length} urls in ${chunkedUrls.length} blocks.`);
    let allResults: PromiseSettledResult<void | globalThis.Response>[] = [];
    for (const chunk of chunkedUrls) {
      const promises = chunk.map(url => fetchWithTimeout(url, HEADERS_FOR_FETCH, timeout));
      console.log(`waiting for ${promises.length} promises`);
      const results = await Promise.allSettled(promises);
      console.log(`got ${results.length} promises`);
      allResults = [...allResults, ...results];
    }
    return allResults;
  }

  public async fetchURLsRemote(url: URL, request: Request, urls: string[]): Promise<FetchURLResult[]> {
    const results: PromiseSettledResult<Response>[] = await this.downloadURLsRemote(url, request, urls);
    return Promise.all(results.map(async (result: PromiseSettledResult<Response>, index) => {
      const result_array: FetchURLResult[] = [];
      let val: string = "";
      if (result.status === 'fulfilled') { // without this duplication the compiler can not infer the type of result
        console.log(`Request ${index} fulfilled`);
        if (result.value instanceof Response) {
          const multi_urls: FetchURLResult[] = await result.value.json();
          console.log(`Success from request ${index} - ${multi_urls.length}`);
          for (const multi_url of multi_urls) {
            result_array.push({ url: multi_url.url, value: multi_url.value, success: multi_url.success });
          }
        }
      } else {
        val = result.reason.message;
        console.error(`Error fetching request ${index}:`, val);
        result_array.push({ url: `request ${index}`, value: val, success: false });
      }
      return result_array;
    })).then((array_of_arrays: FetchURLResult[][]) => {
      return array_of_arrays.flat();
    });
  }

  private async downloadURLsRemote(url: URL, request: Request, urls: string[]): Promise<PromiseSettledResult<Response>[]> {
    const chunkedUrls = this.chunkUrls(urls, DL_MAX_CONCURRENCY);
    console.log(`Downloading ${urls.length} urls in ${chunkedUrls.length} blocks.`);
    const promises = chunkedUrls.map(async (dl_urls) => {
      console.log(`waiting for ${dl_urls.length} promises`);
      return await remoteMultiFetch(url, request, dl_urls);
    });
    return await Promise.allSettled(promises);
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
