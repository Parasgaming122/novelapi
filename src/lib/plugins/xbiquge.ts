import * as cheerio from 'cheerio';
import { smartFetch } from '@/lib/bypasser';
import { resolveUrl, cleanText } from '@/lib/parser';
import type {
  NovelSourcePlugin, SourceInfo, CatalogResult, SearchResult,
  NovelInfoResult, ChapterListResult, ChapterTextResult, NovelItem, ChapterItem,
} from '@/lib/types';

const BASE = 'https://www.xbiquge.info';

export class XBiqugePlugin implements NovelSourcePlugin {
  info: SourceInfo = {
    id: 'xbiquge',
    name: 'XBiquge',
    baseUrl: BASE,
    language: 'zh',
    charset: 'UTF-8',
    hasSearch: true,
    hasCatalog: true,
  };

  private abs(href: string | undefined | null): string {
    return resolveUrl(href, BASE);
  }

  // ─── Catalog ────────────────────────────────────────
  async getCatalog(_page = 1): Promise<CatalogResult> {
    const res = await smartFetch(BASE + '/');
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    $('dl').each((_, el) => {
      const $dl = $(el);
      const link = $dl.find('dd h3 a');
      if (!link.length) return;
      const href = this.abs(link.attr('href'));
      const m = href.match(/\/([^/]+)\/(\d+)\//);
      if (!m) return;
      items.push({
        bookId: m[2],
        title: link.text().trim(),
        coverUrl: this.abs($dl.find('dt a img').attr('src')),
        bookUrl: href,
      });
    });
    return { success: true, items };
  }

  // ─── Search ─────────────────────────────────────────
  async search(query: string): Promise<SearchResult> {
    // Note: search.php is currently broken on this site
    const res = await smartFetch(`${BASE}/search.php?q=${encodeURIComponent(query)}`);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    $('dl').each((_, el) => {
      const $dl = $(el);
      const link = $dl.find('dd h3 a');
      if (!link.length) return;
      const href = this.abs(link.attr('href'));
      const m = href.match(/\/([^/]+)\/(\d+)\//);
      if (!m) return;
      items.push({ bookId: m[2], title: link.text().trim(), bookUrl: href });
    });
    return { success: true, items };
  }

  // ─── Novel Info + Chapters ───────────────────────────
  async getNovelInfo(bookId: string): Promise<NovelInfoResult> {
    const bookPath = bookId.substring(0, Math.max(1, bookId.length - 4));
    const url = `${BASE}/${bookPath}/${bookId}/`;
    const res = await smartFetch(url);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const chapters = await this.getChapterList(bookId);

    return {
      success: true,
      novel: {
        bookId,
        title: $('h1').first().text().trim(),
        coverUrl: this.abs($('dt a img, .book_info img').first().attr('src')),
        description: $('#intro, .intro').first().text().trim() || undefined,
        chapters: chapters.items,
      },
    };
  }

  // ─── Chapter List ────────────────────────────────────
  async getChapterList(bookId: string): Promise<ChapterListResult> {
    const bookPath = bookId.substring(0, Math.max(1, bookId.length - 4));
    const url = `${BASE}/${bookPath}/${bookId}/`;
    const res = await smartFetch(url);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: ChapterItem[] = [];
    // Chapter links: /{cat}/{id}/{num}.html (exclude index_N.html pagination)
    $(`div.book_list li a[href$=".html"]`).each((_, el) => {
      const href = this.abs($(el).attr('href'));
      if (href.includes('index_')) return;
      const m = href.match(/\/(\d+)\.html$/);
      if (!m) return;
      items.push({
        chapterId: m[1],
        title: $(el).text().trim(),
        chapterUrl: href,
      });
    });
    return { success: true, items };
  }

  // ─── Chapter Text ────────────────────────────────────
  async getChapterText(_bookId: string, chapterId: string): Promise<ChapterTextResult> {
    const bookPath = _bookId.substring(0, Math.max(1, _bookId.length - 4));
    const url = `${BASE}/${bookPath}/${_bookId}/${chapterId}.html`;
    const res = await smartFetch(url);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const article = $('article.font_max');
    let text = article.html() || '';
    // Split by <br> tags
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = cleanText(text);
    // Collect all pages (multi-page chapters)
    let nextPage = 2;
    while (true) {
      const nextLink = $(`a[href$="_${nextPage}.html"]`).first().attr('href');
      if (!nextLink) break;
      const pageUrl = this.abs(nextLink);
      const pageRes = await smartFetch(pageUrl);
      if (!pageRes.success) break;
      const $p = cheerio.load(pageRes.body);
      let pageText = $p('article.font_max').html() || '';
      pageText = pageText.replace(/<br\s*\/?>/gi, '\n');
      text += '\n' + cleanText(pageText);
      nextPage++;
    }

    return { success: true, title: $('h1').first().text().trim(), content: text };
  }
}
