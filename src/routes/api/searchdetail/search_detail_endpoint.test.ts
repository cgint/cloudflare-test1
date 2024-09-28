import { describe, it, expect, vi } from 'vitest';
import { BraveSearchService } from '../search/brave_search';
import { BraveSearchDetailEndpoint } from './search_detail_endpoint';
import { BraveSearchDetailService, DL_DETAIL_FETCH_LIMIT, type MyDetailSearchResult } from './brave_search_detail';
import { UrlContentFetcher } from './url_content_fetcher';
import { Document } from "@langchain/core/documents";
import { SearchQueryEndpointInvoker } from '../../../lib/libraries/search_query_endpoint_invoker';
import type { AnswerAndSearchData, SearchEngineResult, QueryResult, ConsideredDoc } from '../../../lib/libraries/types';

const successfulBraveSearchDetailResults: MyDetailSearchResult[] = [{
  url: 'https://example1.com',
  textContent: 'This is a test1 description',
  title: 'Test Title 1',
  description: 'This is a test1 description',
  page_age: '2020-06-11T10:33:00',
  age: '3 weeks ago',
  language: 'en',
  type: 'web',
  subtype: 'web',
  age_normalized: '11.06.2020',
  extra_snippets: []
}, {
  url: 'https://example2.com',
  textContent: 'This is a test2 description',
  title: 'Test Title 2',
  description: 'This is a test2 description',
  page_age: '2020-06-10T10:33:00',
  age: 'June 11, 2020',
  language: 'en',
  type: 'web',
  subtype: 'web',
  age_normalized: '10.06.2020',
  extra_snippets: []
}];
const successfulBraveSearchDetailResultsSearchEngineResult: SearchEngineResult[] = successfulBraveSearchDetailResults.map(result => ({
  url: result.url,
  title: result.title,
  description: result.description,
  age_normalized: result.age_normalized
}));
const docsForQuery: Document[] = successfulBraveSearchDetailResults.map(result => new Document({
  metadata: {
    source: "webpage", url: result.url, age_normalized: result.age_normalized
  },
  pageContent: result.textContent
}));
const queryVectorResultDocsConsidered: ConsideredDoc[] = successfulBraveSearchDetailResults.map(result => ({
  url: result.url,
  age_normalized: result.age_normalized,
  contentSnippet: result.extra_snippets[0]
}));
const queryVectorResult: QueryResult = {
  result: "This is the answer to the question.",
  docsConsidered: queryVectorResultDocsConsidered,
  stats: {
    docCount: docsForQuery.length, splitCount: docsForQuery.length * 4711
  }
};
const answerAndSearchDataWithData: AnswerAndSearchData = { answer: queryVectorResult, searchdata: successfulBraveSearchDetailResultsSearchEngineResult };
const answerAndSearchDataNoData: AnswerAndSearchData = { answer: queryVectorResult, searchdata: [] };
const braveSearchService = new BraveSearchService();
const braveSearchDetailService = new BraveSearchDetailService(braveSearchService, new UrlContentFetcher());
const oei = new SearchQueryEndpointInvoker();
const searchDetailEndpoint = new BraveSearchDetailEndpoint(braveSearchDetailService, oei);
function createSpyOnFetchBraveWebSearchDetailFetchDetail(whatToReturn: MyDetailSearchResult[]) {
  return vi.spyOn(braveSearchDetailService, 'fetchDetailsRemote')
              .mockImplementation(() => Promise.resolve(whatToReturn));
}
function createSpyOnOtherEndpointInvoker(whatToReturn: AnswerAndSearchData) {
  return vi.spyOn(oei, 'invoke')
              .mockImplementation(() => Promise.resolve(whatToReturn));
}
describe('Authentication in +server.ts', () => {
  it('should authenticate a request with a valid password', async () => {
    const emptyResult: any = [];
    const spyFetch = createSpyOnFetchBraveWebSearchDetailFetchDetail(emptyResult);
    const spyOtherEndpointInvoker = createSpyOnOtherEndpointInvoker(answerAndSearchDataNoData);
    const search_query: string = 'Tell me more';
    const request_url: string = 'http://localhost/api/searchdetail?query='+encodeURIComponent(search_query);
    const url = new URL(request_url);
    const request = new Request(request_url, {
      headers: { 'password': 'test' },
    });
    const response = await searchDetailEndpoint.search(url, request);
    expect(spyFetch).toHaveBeenCalledWith(url, request, search_query, DL_DETAIL_FETCH_LIMIT, '');
    expect(spyOtherEndpointInvoker).toHaveBeenCalledWith(url, request, emptyResult);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ answer: queryVectorResult, searchdata: emptyResult });
  });

  it('should return the list of results according to the query', async () => {
    const spyFetch = createSpyOnFetchBraveWebSearchDetailFetchDetail(successfulBraveSearchDetailResults);
    const spyOtherEndpointInvoker = createSpyOnOtherEndpointInvoker(answerAndSearchDataWithData);
    const search_query: string = 'Tell me more';
    const request_url: string = 'http://localhost/api/searchdetail?query='+encodeURIComponent(search_query);
    const url = new URL(request_url);
    const request = new Request(request_url, {
      headers: { 'password': 'test' },
    });
    const response = await searchDetailEndpoint.search(url, request);
    expect(spyFetch).toHaveBeenCalledWith(url, request, search_query, DL_DETAIL_FETCH_LIMIT, '');
    expect(spyOtherEndpointInvoker).toHaveBeenCalledWith(url, request, successfulBraveSearchDetailResults);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ answer: queryVectorResult, searchdata: successfulBraveSearchDetailResultsSearchEngineResult });
  });

  it('should return a 400 status if the query parameter is missing', async () => {
    const spyFetch = createSpyOnFetchBraveWebSearchDetailFetchDetail(successfulBraveSearchDetailResults);
    const spyOtherEndpointInvoker = createSpyOnOtherEndpointInvoker(answerAndSearchDataWithData);
    const request_url: string = 'http://localhost/api/searchdetail';
    const url = new URL(request_url);
    const request = new Request(request_url, {
      headers: { 'password': 'test' },
    });
    const response = await searchDetailEndpoint.search(url, request);
    expect(spyFetch).not.toHaveBeenCalled();
    expect(spyOtherEndpointInvoker).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it('should reject a request with an invalid password with a 401 status', async () => {
    const spyFetch = createSpyOnFetchBraveWebSearchDetailFetchDetail(successfulBraveSearchDetailResults);
    const spyOtherEndpointInvoker = createSpyOnOtherEndpointInvoker(answerAndSearchDataWithData);
    const request_url = 'http://localhost/api/searchdetail';
    const url = new URL(request_url);
    const request = new Request(request_url, {
      headers: { 'password': 'invalidToken123' },
    });
    const response = await searchDetailEndpoint.search(url, request);
    expect(spyFetch).not.toHaveBeenCalled();
    expect(spyOtherEndpointInvoker).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
  
  it('should reject a request without a password with a 401 status', async () => {
    const spyFetch = createSpyOnFetchBraveWebSearchDetailFetchDetail(successfulBraveSearchDetailResults);
    const spyOtherEndpointInvoker = createSpyOnOtherEndpointInvoker(answerAndSearchDataWithData);
    const request_url = 'http://localhost/api/searchdetail';
    const url = new URL(request_url);
    const request = new Request(request_url);
    const response = await searchDetailEndpoint.search(url, request);
    expect(spyFetch).not.toHaveBeenCalled();
    expect(spyOtherEndpointInvoker).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
});
