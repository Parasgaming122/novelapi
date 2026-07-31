import * as cheerio from 'cheerio';
import { smartFetch, encodeGBKComponent } from '@/lib/bypasser';
import { resolveUrl, cleanText } from '@/lib/parser';
import type {
  NovelSourcePlugin, SourceInfo, CatalogResult, SearchResult,
  NovelInfoResult, ChapterListResult, ChapterTextResult, NovelItem, ChapterItem,
} from '@/lib/types';

const BASE = 'https://www.biquge.company';

export class BiQuGeCompanyPlugin implements NovelSourcePlugin {
  info: SourceInfo = {
    id: 'biquge_company',
    name: 'BiQuGe.company',
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
    const res = await smartFetch(`${BASE}/sort/0/${page}.html`);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    $('h4.bookname a[href*="/book/"]').each((_, el) => {
      const $a = $(el);
      const href = this.abs($a.attr('href'));
      const m = href.match(/\/book\/(\d+)\.html$/);
      if (!m) return;
      const $box = $a.closest('.bookbox');
      items.push({
        bookId: m[1],
        title: $a.text().trim(),
        coverUrl: this.abs($box.find('.book-info img, .cover img').first().attr('src')),
        description: $box.find('.book-intro, .intro').first().text().trim() || undefined,
        bookUrl: href,
      });
    });
    return { success: true, items };
  }

  // -- Search --------------------------------------------------
  async search(query: string): Promise<SearchResult> {
    const res = await smartFetch(`${BASE}/modules/article/search.php`, {
      method: 'POST',
      body: `searchkey=${encodeURIComponent(query)}&searchtype=all`,
    });
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    $('h4.bookname a[href*="/book/"]').each((_, el) => {
      const $a = $(el);
      const href = this.abs($a.attr('href'));
      const m = href.match(/\/book\/(\d+)\.html$/);
      if (!m) return;
      items.push({ bookId: m[1], title: $a.text().trim(), bookUrl: href });
    });
    return { success: true, items };
  }

  // -- Novel Info + Chapters -------------------------------------
  async getNovelInfo(bookId: string): Promise<NovelInfoResult> {
    const res = await smartFetch(`${BASE}/book/${bookId}.html`);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const chapters = await this.getChapterList(bookId);

    return {
      success: true,
      novel: {
        bookId,
        title: $('h1.booktitle, h1').first().text().trim(),
        coverUrl: this.abs($('img.thumbnail').attr('src')),
        description: $('#intro, .intro, .book-intro').first().text().trim() || undefined,
        chapters: chapters.items,
      },
    };
  }

  // -- Chapter List ---------------------------------------------
  async getChapterList(bookId: string): Promise<ChapterListResult> {
    const res = await smartFetch(`${BASE}/book/${bookId}.html`);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: ChapterItem[] = [];
    const seen = new Set<string>();
    $('dl dd a[href*="/read/"]').each((_, el) => {
      const $a = $(el);
      const href = this.abs($a.attr('href'));
      const m = href.match(/\/read\/(\d+)\/(\d+)\.html$/);
      if (!m || seen.has(m[2])) return;
      seen.add(m[2]);
      items.push({ chapterId: m[2], title: $a.text().trim(), chapterUrl: href });
    });
    return { success: true, items };
  }

  // -- Chapter Text ---------------------------------------------
  async getChapterText(_bookId: string, chapterId: string): Promise<ChapterTextResult> {
    const url = `${BASE}/read/${_bookId}/${chapterId}.html`;
    const res = await smartFetch(url);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const content = $('.readcontent')
      .html()
      ?.replace(/<br\s*\/?>/gi, '\n')
      .replace(/&emsp;/g, '  ')
      ?? '';

    return {
      success: true,
      title: $('h1').first().text().trim(),
      content: cleanText(content),
    };
  }
}
