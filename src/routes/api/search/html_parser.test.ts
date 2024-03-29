import { describe, it, expect } from 'vitest';
import { HTMLParser } from './html_parser';

describe('HTML Parser Tests', () => {
  it.each([
    ["<html><head></head><body><p>Test content</p></body></html>", "<body><p>Test content</p></body>"],
    ["<html><body><div>Another test</div></body></html>", "<body><div>Another test</div></body>"],
    ["<div>Only part of html</div>", "<div>Only part of html</div>"],
    ["Not actually html", "Not actually html"],
  ])('should extract content part from HTML', (inputHtml, contentPart) => {
    expect(new HTMLParser().extractContentPartFromHTML(inputHtml)).toBe(contentPart);
  });

  it.each([
    ["<html><body><article>Test content</article></body></html>", "Test content"],
    ["<html><body><table><tr><td>Cell11  </td><td>Cell12</td></tr><tr><td> Cell21</td><td>Cell22</td></tr></table></article></body></html>", "Cell11 Cell12 Cell21 Cell22"],
  ])('should clean HTML content', (htmlContent, cleanContent) => {
    expect(new HTMLParser().cleanHTMLContent(htmlContent)).toBe(cleanContent);
  });

  it('should get URLs from HTML content', () => {
    const htmlContent = '<html><body><a href="http://example.com">Example</a></body></html>';
    const result = new HTMLParser().getUrlsFromHtmlContent(htmlContent);
    expect(result).toContain("http://example.com");
  });

  it('should create doc from plain HTML content', () => {
    const url = "http://example.com";
    const htmlContent = "<html><body><article>Test content</article></body></html>";
    const result = new HTMLParser().createDocFromPlainHtmlContent(url, htmlContent);
    expect(result.text.trim()).toBe("Test content");
    expect(result.metadata['source_id']).toBe(url);
    expect(result.metadata['source_type']).toBe("html");
  });
});
