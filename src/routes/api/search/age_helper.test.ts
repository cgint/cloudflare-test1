import { describe, it, expect } from 'vitest';
import { parse_page_age, sortedByAgeNormalisedAsc } from './age_helper';

describe('parse_page_age function', () => {
  const testCases = [
    { input: "2023-01-09T04:41:32", format: "dd/MM/yyyy HH:mm", expected: "09/01/2023 04:41" },
    { input: "2023-01-09T04:41:32", format: "yyyy-MM-dd HH:mm", expected: "2023-01-09 04:41" },
    { input: "2023-01-09T04:41:32", format: "yyyy-MM-dd", expected: "2023-01-09" },
  ];

  testCases.forEach(({ input, format, expected }) => {
    it(`should correctly parse "${input}" with format "${format}" into the desired format`, () => {
      expect(parse_page_age(input, format)).toBe(expected);
    });
  });
});

describe('sortedByAgeNormalisedAsc function', () => {
  it('should return the given list sorted by age_normalized in ascending order with empty is sorted to the end', () => {
    const unsorted_list = [
      { age_normalized: '2023-01-10T04:41:32' },
      { age_normalized: '2023-01-08T04:41:32' },
      { age_normalized: '' },
      { age_normalized: '2023-01-09T04:41:32' },
    ];
    expect(sortedByAgeNormalisedAsc(unsorted_list)).toStrictEqual([
        { age_normalized: '2023-01-08T04:41:32' },
        { age_normalized: '2023-01-09T04:41:32' },
        { age_normalized: '2023-01-10T04:41:32' },
        { age_normalized: '' },
      ]);
  });
});

