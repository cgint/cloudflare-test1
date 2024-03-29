import { format, parseISO } from 'date-fns';
import type { BraveWebSearchResult } from './brave_search';
import type { AgeNormalisedResult } from './search_endpoint';

const AGE_NORMALIZED_FORMAT = 'dd.MM.yyyy';

export function parse_page_age(input: string, formatStr: string): string {
  return format(parseISO(input), formatStr);
}

export function get_age_normalized(result: BraveWebSearchResult): string {
    let age_original = (result.page_age && result.page_age != '') ? result.page_age : '';
    if (age_original == '') {
        return '';
    }
    try {
        return parse_page_age(age_original, AGE_NORMALIZED_FORMAT);
    } catch (err) {
        throw new Error(`Could not parse age: ${age_original}. Error: ${err}`);
    }
}   

export function sortedByAgeNormalisedAsc(results: AgeNormalisedResult[]): AgeNormalisedResult[] {
    return results.sort((a, b) => {
        if (a.age_normalized === '') return 1;
        if (b.age_normalized === '') return -1;
        return a.age_normalized.localeCompare(b.age_normalized);
    });
}
