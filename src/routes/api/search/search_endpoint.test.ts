import { describe, it, expect, vi } from 'vitest';
import { BraveSearchService } from './brave_search';
import { BraveSearchEndpoint } from './search_endpoint';
import type { BraveWebSearchResponse, BraveWebSearchResult, MySearchResult } from './brave_search';


const successfulBraveSearchNoResults: BraveWebSearchResponse = {
    query: {
      original: '',
      show_strict_warning: false,
      is_navigational: false,
      local_decision: '',
      local_locations_idx: 0,
      is_news_breaking: false,
      spellcheck_off: false,
      country: '',
      bad_results: false,
      should_fallback: false,
      postal_code: '',
      city: '',
      header_country: '',
      more_results_available: false,
      state: '',
    },
    mixed: null,
    type: '',
    web: {
      type: '',
      results: [],
      family_friendly: false,
    }
  };
const successfulBraveSearchResults: BraveWebSearchResult[] = [
  { // no age or page_age set - will be sorted at the end
    title: 'Test Title 3',
    url: 'https://example3.com',
    extra_snippets: ['This is a test3 snippet'],
    description: 'This is a test3 description',
    is_source_local: false,
    is_source_both: false,
    language: 'en',
    family_friendly: false,
    type: 'web',
    subtype: 'web',
    meta_url: 'https://example3.com',
    thumbnail: 'https://example3.com',
  },
  {
    title: 'Test Title 1',
    url: 'https://example1.com',
    extra_snippets: ['This is a test1 snippet'],
    age: '3 weeks ago',
    description: 'This is a test1 description',
    is_source_local: false,
    is_source_both: false,
    page_age: '2020-06-11T10:33:00',
    language: 'en',
    family_friendly: false,
    type: 'web',
    subtype: 'web',
    meta_url: 'https://example1.com',
    thumbnail: 'https://example1.com',
  },
  {
    title: 'Test Title 2',
    url: 'https://example2.com',
    extra_snippets: ['This is a test2 snippet'],
    page_age: '2020-06-10T10:33:00',
    age: 'June 11, 2020',
    description: 'This is a test2 description',
    is_source_local: false,
    is_source_both: false,
    language: 'en',
    family_friendly: false,
    type: 'web',
    subtype: 'web',
    meta_url: 'https://example2.com',
    thumbnail: 'https://example2.com',
  }
];
const successfulBraveSearchWithResults = {
    ...successfulBraveSearchNoResults,
    web: {
        ...successfulBraveSearchNoResults.web,
        results: successfulBraveSearchResults,
    }
}

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

const braveSearchService = new BraveSearchService();
const searchEndpoint = new BraveSearchEndpoint(braveSearchService);
function createSpyOnFetchBraveWebSearchResults(whatToReturn: BraveWebSearchResponse) {
  return vi.spyOn(braveSearchService, 'fetchBraveWebSearchResults')
              .mockImplementation(() => Promise.resolve(whatToReturn));
}

describe('Authentication in +server.ts', () => {
  it('should authenticate a request with a valid password', async () => {
    const spy = createSpyOnFetchBraveWebSearchResults(successfulBraveSearchNoResults);
    const search_query: string = 'Tell me more';
    const request_url: string = 'http://localhost/api/search?query='+encodeURIComponent(search_query);
    const url = new URL(request_url);
    const request = new Request(request_url, {
      headers: { 'password': 'test' },
    });
    const response = await searchEndpoint.search(url, request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(spy).toHaveBeenCalledWith(search_query);
  });

  it('should return the list of results according to the query', async () => {
    const spy = createSpyOnFetchBraveWebSearchResults(successfulBraveSearchWithResults);
    const search_query: string = 'Tell me more';
    const request_url: string = 'http://localhost/api/search?query='+encodeURIComponent(search_query);
    const url = new URL(request_url);
    const request = new Request(request_url, {
      headers: { 'password': 'test' },
    });
    const response = await searchEndpoint.search(url, request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(successfulBraveSearchResultsMyResultsOrderedByAgeNormAsc);
    expect(spy).toHaveBeenCalledWith(search_query);
  });

  it('should return a 400 status if the query parameter is missing', async () => {
    const spy = createSpyOnFetchBraveWebSearchResults(successfulBraveSearchNoResults);
    const request_url: string = 'http://localhost/api/search';
    const url = new URL(request_url);
    const request = new Request(request_url, {
      headers: { 'password': 'test' },
    });
    const response = await searchEndpoint.search(url, request);
    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should reject a request with an invalid password with a 401 status', async () => {
    const spy = createSpyOnFetchBraveWebSearchResults(successfulBraveSearchNoResults);
    const request_url = 'http://localhost/api/search';
    const url = new URL(request_url);
    const request = new Request(request_url, {
      headers: { 'password': 'invalidToken123' },
    });
    const response = await searchEndpoint.search(url, request);
    expect(response.status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });
  
  it('should reject a request without a password with a 401 status', async () => {
    const spy = createSpyOnFetchBraveWebSearchResults(successfulBraveSearchNoResults);
    const request_url = 'http://localhost/api/search';
    const url = new URL(request_url);
    const request = new Request(request_url);
    const response = await searchEndpoint.search(url, request);
    expect(response.status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });
});
