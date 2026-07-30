import * as cheerio from 'cheerio';
import { smartFetch } from '@/lib/bypasser';
import { resolveUrl, cleanText } from '@/lib/parser';
import type {
  NovelSourcePlugin, SourceInfo, CatalogResult, SearchResult,
  NovelInfoResult, ChapterListResult, ChapterTextResult, NovelItem, ChapterItem,
} from '@/lib/types';

const BASE = 'https://ixdzs8.com';

export class Ixdzs8Plugin implements NovelSourcePlugin {
  info: SourceInfo = {
    id: 'ixdzs8',
    name: 'Aixdzs',
    baseUrl: BASE,
    language: 'zh',
    charset: 'UTF-8',
    hasSearch: true,
    hasCatalog: true,
  };

  private abs(href: string | undefined | null): string {
    return resolveUrl(href, BASE);
  }

  // ─── Catalog ─────────────────────────────────────────
  async getCatalog(page = 1): Promise<CatalogResult> {
    const res = await smartFetch(`${BASE}/sort/0/${page > 1 ? page + '/' : ''}`);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    $('li.burl').each((_, el) => {
      const $el = $(el);
      const link = $el.find('h3.bname a');
      const href = this.abs(link.attr('href'));
      const m = href.match(/\/read\/(\d+)/);
      if (m) {
        items.push({
          bookId: m[1],
          title: link.text().trim(),
          coverUrl: this.abs($el.find('.n-img img, .d_img img').attr('src')),
          author: $el.find('.bauthor, .author').text().trim() || undefined,
          bookUrl: href,
        });
      }
    });
    return { success: true, items };
  }

  // ─── Search ──────────────────────────────────────────
  async search(query: string): Promise<SearchResult> {
    const res = await smartFetch(`${BASE}/bsearch?q=${encodeURIComponent(query)}`);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    $('li.burl').each((_, el) => {
      const $el = $(el);
      const link = $el.find('h3.bname a');
      const href = this.abs(link.attr('href'));
      const m = href.match(/\/read\/(\d+)/);
      if (m) {
        items.push({
          bookId: m[1],
          title: link.text().trim(),
          coverUrl: this.abs($el.find('.n-img img').attr('src')),
          bookUrl: href,
        });
      }
    });
    return { success: true, items };
  }

  // ─── Novel Info ───────────────────────────────────────
  async getNovelInfo(bookId: string): Promise<NovelInfoResult> {
    // p1 = detail page; chapters come from API
    const res = await smartFetch(`${BASE}/read/${bookId}/p1.html`);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const chapters = await this.getChapterList(bookId);

    return {
      success: true,
      novel: {
        bookId,
        title: $('h1.bname, h1.title, .d_info h1, h1').first().text().trim(),
        coverUrl: this.abs($('.n-img img, .d_img img').first().attr('src')),
        description: $('#intro, .intro, p#intro').first().text().trim() || undefined,
        chapters: chapters.items,
      },
    };
  }

  // ─── Chapter List (JSON API) ──────────────────────────
  async getChapterList(bookId: string): Promise<ChapterListResult> {
    const res = await smartFetch(`${BASE}/novel/clist/`, {
      method: 'POST',
      body: `bid=${bookId}`,
    });
    if (!res.success) return { success: false, items: [], error: res.error };

    try {
      const data = JSON.parse(res.body);
      if (data.rs !== 200 || !Array.isArray(data.data)) {
        return { success: false, items: [], error: 'API returned non-200' };
      }
      const items: ChapterItem[] = data.data.map((ch: { ordernum: number; title: string; ctype: number }) => ({
        chapterId: String(ch.ordernum),
        title: ch.title,
        ordernum: ch.ordernum,
        chapterUrl: `${BASE}/read/${bookId}/p${ch.ordernum}.html`,
      }));
      return { success: true, items };
    } catch {
      return { success: false, items: [], error: 'Failed to parse chapter list JSON' };
    }
  }

  // ─── Chapter Text ─────────────────────────────────────
  async getChapterText(bookId: string, chapterId: string): Promise<ChapterTextResult> {
    const url = `${BASE}/read/${bookId}/p${chapterId}.html`;
    const res = await smartFetch(url);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const content = $('article.page-content section')
      .first()
      .text()
      .split(/\s+/)
      .filter(l => l.length > 0)
      .join('\n');
    const title = $('h1.page-d-name, h1').first().text().trim();

    return {
      success: true,
      title: title || undefined,
      content: cleanText(content),
    };
  }
}
