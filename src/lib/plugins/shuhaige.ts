import * as cheerio from 'cheerio';
import { smartFetch } from '@/lib/bypasser';
import { resolveUrl, cleanText } from '@/lib/parser';
import type {
  NovelSourcePlugin, SourceInfo, CatalogResult, SearchResult,
  NovelInfoResult, ChapterListResult, ChapterTextResult, NovelItem, ChapterItem,
} from '@/lib/types';

const BASE = 'https://m.shuhaige.net';

export class ShuHaiGePlugin implements NovelSourcePlugin {
  info: SourceInfo = {
    id: 'shuhaige',
    name: 'ShuHaiGe',
    baseUrl: BASE,
    language: 'zh',
    charset: 'UTF-8',
    hasSearch: true,
    hasCatalog: true,
  };

  private abs(href: string | undefined | null): string {
    return resolveUrl(href, BASE);
  }

  // -- Catalog -------------------------------------------------
  async getCatalog(page = 1): Promise<CatalogResult> {
    const url = page === 1 ? `${BASE}/shuku/` : `${BASE}/shuku/0_0_0_${page}.html`;
    const res = await smartFetch(url);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    const seen = new Set<string>();

    // Each <li> has: <a href="/shu_ID.html"><img ... alt="TITLE"></a>
    //                <p class="bookname"><a href="/ID/">TITLE</a></p>
    $('ul.list > li').each((_, el) => {
      const $li = $(el);
      const $coverLink = $li.find('a[href*="/shu_"]').first();
      const href = this.abs($coverLink.attr('href'));
      const m = href.match(/\/shu_(\d+)\.html$/);
      if (!m || seen.has(m[1])) return;
      seen.add(m[1]);
      // Title from <p class="bookname"><a> or from <img alt>
      const title = $li.find('.bookname a').first().text().trim()
        || $coverLink.find('img').first().attr('alt')?.trim()
        || '';
      const coverUrl = this.abs($coverLink.find('img').first().attr('src'));
      items.push({
        bookId: m[1],
        title,
        coverUrl: coverUrl || undefined,
        bookUrl: href,
      });
    });
    return { success: true, items };
  }

  // -- Search --------------------------------------------------
  async search(query: string): Promise<SearchResult> {
    const res = await smartFetch(`${BASE}/search.html`, {
      method: 'POST',
      body: `searchkey=${encodeURIComponent(query)}`,
    });
    if (!res.success) return { success: false, items: [], error: res.error };

    // ShuHaiGe search may return error page — parse what we can
    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    $('a[href*="/shu_"]').each((_, el) => {
      const $a = $(el);
      const href = this.abs($a.attr('href'));
      const m = href.match(/\/shu_(\d+)\.html$/);
      if (!m) return;
      items.push({ bookId: m[1], title: $a.text().trim(), bookUrl: href });
    });
    return { success: true, items };
  }

  // -- Novel Info + Chapters -----------------------------------
  async getNovelInfo(bookId: string): Promise<NovelInfoResult> {
    const res = await smartFetch(`${BASE}/shu_${bookId}.html`);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const chapters = await this.getChapterList(bookId);

    // Title: h1 in .header, or og:novel:book_name meta
    const title = $('.header h1').first().text().trim()
      || $('meta[property="og:novel:book_name"]').attr('content')
      || $('h1').first().text().trim();

    // Cover: div.detail > img, or og:image meta
    const coverSrc = $('.detail img').first().attr('src')
      || $('meta[property="og:image"]').attr('content')
      || undefined;

    // Description: .intro div, or og:description meta
    const description = $('.intro').first().text().trim()
      || $('meta[property="og:description"]').attr('content')
      || undefined;

    return {
      success: true,
      novel: {
        bookId,
        title,
        coverUrl: this.abs(coverSrc),
        description,
        chapters: chapters.items,
      },
    };
  }

  // -- Chapter List ---------------------------------------------
  async getChapterList(bookId: string): Promise<ChapterListResult> {
    const res = await smartFetch(`${BASE}/${bookId}/`);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: ChapterItem[] = [];
    // Match hrefs BEFORE abs() to keep relative URLs for regex
    $(`a[href^="/${bookId}/"][href$=".html"]`).each((_, el) => {
      const $a = $(el);
      const rawHref = $a.attr('href') || '';
      const m = rawHref.match(new RegExp(`^/${bookId}/(\\d+)\\.html$`));
      if (!m) return;
      items.push({
        chapterId: m[1],
        title: $a.text().trim(),
        chapterUrl: this.abs(rawHref),
      });
    });
    return { success: true, items };
  }

  // -- Chapter Text ---------------------------------------------
  async getChapterText(bookId: string, chapterId: string): Promise<ChapterTextResult> {
    const url = `${BASE}/${bookId}/${chapterId}.html`;
    const res = await smartFetch(url);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const lines: string[] = [];
    $('.content p').each((_, el) => {
      const t = $(el).text().trim();
      if (t) lines.push(t);
    });

    return {
      success: true,
      title: $('h1, .chapter-title').first().text().trim(),
      content: cleanText(lines.join('\n')),
    };
  }
}
