import { describe, it, expect } from 'vitest';
import { HtmlParser } from './html_parser';

describe('HTML Parser Tests', () => {
  it.each([
    ["<html><head><script>code</script></head><body><p>Test content</p></body></html>", "<p>Test content</p>"],
    ["<html><body><div>Another test<script>code</script></div></body></html>", "<div>Another test</div>"],
    ["<div>Only part of html</div>", "<div>Only part of html</div>"],
    ["Not actually html", "Not actually html"],
  ])('should extract content part from HTML', (inputHtml, contentPart) => {
    expect(new HtmlParser().extractContentPartFromHtml(inputHtml).html()).toBe(contentPart);
  });

  it.each([
    ["<html><head></head><body><p><article>Test content</article></p></body></html>", "Test content"],
    ["<html><body><div><article>Another test</article></div></body></html>", "Another test"],
    ["<div>Only part of html</div>", "<div>Only part of html</div>"],
    ["Not actually html", "Not actually html"],
  ])('should extract article part from HTML', (inputHtml, articlePart) => {
    expect(new HtmlParser().extractContentPartFromHtml(inputHtml, 'article').html()).toBe(articlePart);
  });

  it.each([
    ["<html><body><article>Test content</article></body></html>", "Test content"],
    ["<html><body><table><tr><td>Cell11  </td><td>Cell12</td></tr><tr><td> Cell21</td><td>Cell22</td></tr></table></article></body></html>", "Cell11 Cell12 Cell21 Cell22"],
  ])('should clean HTML content', (htmlContent, cleanContent) => {
    expect(new HtmlParser().cleanHTMLContent(htmlContent)).toBe(cleanContent);
  });

  it.each([
    ['text without<script type="application/ld+json">{"@context":"http://schema.org","@type":"WebPage","name":"Diversified Royalty Corp (DIV) Stock Dividend Date & History","description":"Diversified Royalty Corp (DIV) last ex-dividend date was on Mar 14, 2024. Diversified Royalty Corp distributed C$0.02 per share that represents a 8.28% dividend yield.","keywords":["Diversified Royalty Corp dividend","Diversified Royalty Corp dividend history","TSE:DIV dividend pay date"],"inLanguage":"en-US","dateModified":"Mar 28, 2024","url":"/stocks/tse:div/dividends","publisher":{"@context":"http://www.schema.org","@type":"Organization","name":"tipranks","url":"https://www.tipranks.com"}</script>script', "text withoutscript"]
  ])('should clean HTML content from script', (htmlContent, cleanContent) => {
    expect(new HtmlParser().cleanHTMLContent(htmlContent)).toBe(cleanContent);
  });


  it('should get URLs from HTML content', () => {
    const htmlContent = '<html><body><a href="http://example.com">Example</a></body></html>';
    const result = new HtmlParser().getUrlsFromHtmlContent(htmlContent);
    expect(result).toContain("http://example.com");
  });

  it('should create doc from plain HTML content', () => {
    const url = "http://example.com";
    const htmlContent = "<html><body><article>Test content</article></body></html>";
    const result = new HtmlParser().createDocFromPlainHtmlContent(url, htmlContent);
    expect(result.content.trim()).toBe("Test content");
    expect(result.meta.source_id).toBe(url);
    expect(result.meta.source_type).toBe("html");
  });
});
