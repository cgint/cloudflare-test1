import { JSDOM } from 'jsdom';
import { Document } from './document'; // Assuming a Document class exists

export class HTMLParser {
  extractContentPartFromHTML(plainHTMLContent: string, initialTag: string = "body"): Element {
    const dom = new JSDOM(plainHTMLContent);
    const document = dom.window.document;
    // fetch body only
    let contentPart = document.querySelector(initialTag) ?? document.querySelector('body');
    if (!contentPart) {
      return document;
    }
    // remove script and style tags
    contentPart.querySelectorAll("script, style").forEach(tag => tag.remove());
    return contentPart;
  }

  publcleanHTMLContent(plainHTMLContent: string): string {
    const contentPart = this.extractContentPartFromHTML(plainHTMLContent, "article");
    return contentPart.textContent.trim().replace(/\s+/g, ' ');
  }

  getURLsFromHTMLContent(plainHTMLContent: string): string[] {
    const contentPart = this.extractContentPartFromHTML(plainHTMLContent);
    return Array.from(contentPart.querySelectorAll("a[href]")).map(a => a.getAttribute("href"));
  }

  createDocFromPlainHTMLContent(url: string, plainHTMLContent: string, mirrorBase?: string): Document {
    const meta = {
      source_id: url,
      source_type: "html",
      simple_id: this.createSimpleIdentifierFromURL(url),
      ...(mirrorBase && { mirror_base: mirrorBase })
    };
    return new Document(this.cleanHTMLContent(plainHTMLContent), meta);
  }

  // Assuming this method exists for completeness
  createSimpleIdentifierFromURL(url: string): string {
    // Implementation based on the Python code's description
    return url; // Simplified for demonstration
  }
}
