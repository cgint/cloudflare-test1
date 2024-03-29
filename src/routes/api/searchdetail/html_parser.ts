import { load, type Cheerio, type AnyNode, type CheerioAPI } from 'cheerio';

export interface DocumentWithMeta {
  content: string;
  meta: {
    source_id: string;
    source_type: string;
    simple_id: string;
    mirror_base?: string;
  };
}

export class HTMLParser {
  public extractContentPartFromHtml(plainHTMLContent: string, initialTag: string = "body"): Cheerio<AnyNode> {
    const $: CheerioAPI = load(plainHTMLContent);
    let contentPart = $(initialTag);
    if(contentPart.length === 0 && initialTag !== 'body') {
      contentPart = $('body');
    }
    if (contentPart.length === 0) {
      return $();
    }
    return contentPart.remove('script, style');
  }

  public cleanHTMLContent(plainHTMLContent: string): string {
    const contentPart: Cheerio<AnyNode> = this.extractContentPartFromHtml(plainHTMLContent, "body");
    return this.spaceConcatenatedText(contentPart);
  }

  private spaceConcatenatedText(contentPart: Cheerio<AnyNode>): string {
    const spaceForTags = contentPart.html()?.replace(/<[^>]*>?/gm, ' ') ?? "";
    const oneSpaceForMultipleSpaces = spaceForTags.replace(/\s+/g, ' ');
    return oneSpaceForMultipleSpaces.trim();
  }

  public getUrlsFromHtmlContent(plainHTMLContent: string): string[] {
    const contentPart = this.extractContentPartFromHtml(plainHTMLContent);
    return contentPart.find("a[href]").map((_, element) => element.attribs.href).get();
  }

  public createDocFromPlainHtmlContent(url: string, plainHTMLContent: string, mirrorBase?: string): DocumentWithMeta {
    const meta = {
      source_id: url,
      source_type: "html",
      simple_id: this.createSimpleIdentifierFromUrl(url),
      ...(mirrorBase && { mirror_base: mirrorBase })
    };
    return { content: this.cleanHTMLContent(plainHTMLContent), meta };
  }

  private regexReplaceCharsNotBetweenAAndZWith(input: string, replacement: string): string {
    return input.replace(/[^a-zA-Z]/g, replacement);
  }

  private createSimpleIdentifierFromUrl(url: string): string {
    return this.regexReplaceCharsNotBetweenAAndZWith(url, "_");
  }
}
