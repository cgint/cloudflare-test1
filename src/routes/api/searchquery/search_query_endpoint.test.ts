import { describe, it, expect, vi } from 'vitest';
import { QueryVector } from './query_vector';
import type { QueryVectorResult, ConsideredDoc } from './query_vector';
import { Document } from "@langchain/core/documents";
import { SearchQueryEndpoint } from './search_query_endpoint';
import type { MyDetailSearchResult, SearchEngineResult } from '../searchdetail/brave_search_detail';

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
const queryVectorResult: QueryVectorResult = {
  result: "This is the answer to the question.",
  docsConsidered: queryVectorResultDocsConsidered,
  stats: {
    docCount: docsForQuery.length, splitCount: docsForQuery.length * 4711
  }
};
/*
We should move this as we moved the logic to 
const successfulBraveSearchResultsMyResultsOrderedByAgeNormAsc: MySearchResult[] = [
  {
    title: 'Test Title 2',
    url: 'https://example2.com',
    extra_snippets: ['This is a test2 snippet'],
    page_age: '2020-06-10T10:33:00',
    age: 'June 11, 2020',
    age_normalized: '10.06.2020',
    description: 'This is a test2 description',
    language: 'en',
    type: 'web',
    subtype: 'web'
  },
  {
    title: 'Test Title 1',
    url: 'https://example1.com',
    extra_snippets: ['This is a test1 snippet'],
    age: '3 weeks ago',
    description: 'This is a test1 description',
    page_age: '2020-06-11T10:33:00',
    age_normalized: '11.06.2020',
    language: 'en',
    type: 'web',
    subtype: 'web'
  },
  {
    title: 'Test Title 3',
    url: 'https://example3.com',
    extra_snippets: ['This is a test3 snippet'],
    description: 'This is a test3 description',
    age_normalized: '',
    language: 'en',
    type: 'web',
    subtype: 'web'
  }
];
*/
const queryVector = new QueryVector();
const searchQueryEndpoint = new SearchQueryEndpoint(queryVector);
function createSpyOnQueryVector(whatToReturn: QueryVectorResult) {
  return vi.spyOn(queryVector, 'query')
              .mockImplementation(() => Promise.resolve(whatToReturn));
}
describe('Authentication in +server.ts', () => {
  it('should authenticate a request with a valid password', async () => {
    const emptyResult: any = [];
    const spyQueryVector = createSpyOnQueryVector(queryVectorResult);
    const search_query: string = 'Tell me more';
    const request_url: string = 'http://localhost/api/searchquery?query='+encodeURIComponent(search_query);
    const url = new URL(request_url);
    const request = new Request(request_url, {
      headers: { 'password': 'test' },
    });
    const response = await searchQueryEndpoint.search(url, request, emptyResult);
    expect(response.status).toBe(200);
    expect(spyQueryVector).toHaveBeenCalledWith(search_query, emptyResult);
    expect(await response.json()).toEqual({ answer: queryVectorResult, searchdata: emptyResult });
  });

  it('should return the list of results according to the query', async () => {
    const spyQueryVector = createSpyOnQueryVector(queryVectorResult);
    const search_query: string = 'Tell me more';
    const request_url: string = 'http://localhost/api/searchquery?query='+encodeURIComponent(search_query);
    const url = new URL(request_url);
    const request = new Request(request_url, {
      headers: { 'password': 'test' },
    });
    const response = await searchQueryEndpoint.search(url, request, successfulBraveSearchDetailResults);
    expect(response.status).toBe(200);
    expect(spyQueryVector).toHaveBeenCalledWith(search_query, docsForQuery);
    expect(await response.json()).toEqual({ answer: queryVectorResult, searchdata: successfulBraveSearchDetailResultsSearchEngineResult });
  });

  it('should return a 400 status if the query parameter is missing', async () => {
    const spyQueryVector = createSpyOnQueryVector(queryVectorResult);
    const request_url: string = 'http://localhost/api/searchquery';
    const url = new URL(request_url);
    const request = new Request(request_url, {
      headers: { 'password': 'test' },
    });
    const response = await searchQueryEndpoint.search(url, request, successfulBraveSearchDetailResults);
    expect(spyQueryVector).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it('should reject a request with an invalid password with a 401 status', async () => {
    const spyQueryVector = createSpyOnQueryVector(queryVectorResult);
    const request_url = 'http://localhost/api/searchquery';
    const url = new URL(request_url);
    const request = new Request(request_url, {
      headers: { 'password': 'invalidToken123' },
    });
    const response = await searchQueryEndpoint.search(url, request, successfulBraveSearchDetailResults);
    expect(spyQueryVector).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
  
  it('should reject a request without a password with a 401 status', async () => {
    const spyQueryVector = createSpyOnQueryVector(queryVectorResult);
    const request_url = 'http://localhost/api/searchquery';
    const url = new URL(request_url);
    const request = new Request(request_url);
    const response = await searchQueryEndpoint.search(url, request, successfulBraveSearchDetailResults);
    expect(spyQueryVector).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
});
