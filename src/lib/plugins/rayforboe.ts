import * as cheerio from 'cheerio';
import { smartFetch } from '@/lib/bypasser';
import { resolveUrl, cleanText } from '@/lib/parser';
import type {
  NovelSourcePlugin, SourceInfo, CatalogResult, SearchResult,
  NovelInfoResult, ChapterListResult, ChapterTextResult, NovelItem, ChapterItem,
} from '@/lib/types';

const BASE = 'https://www.rayforboe.com';

export class RayforboePlugin implements NovelSourcePlugin {
  info: SourceInfo = {
    id: 'rayforboe',
    name: 'Rayforboe',
    baseUrl: BASE,
    language: 'zh',
    charset: 'UTF-8',
    hasSearch: true,
    hasCatalog: true,
  };

  private abs(href: string | undefined | null): string {
    return resolveUrl(href, BASE);
  }

  // -- Catalog (sort page) --------------------------------------
  async getCatalog(page = 1): Promise<CatalogResult> {
    const res = await smartFetch(`${BASE}/sort/${page > 1 ? page + '/' : ''}`);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    const seen = new Set<string>();

    $('a[href*="/' + '/"]').each((_, el) => {
      const $a = $(el);
      const href = this.abs($a.attr('href'));
      // Pattern: /{slug}/ or /{slug}/{num}
      const m = href.match(new RegExp(`^${BASE}/([a-z]+)/`));
      if (!m || seen.has(m[1])) return;
      seen.add(m[1]);
      items.push({
        bookId: m[1],
        title: $a.text().trim(),
        bookUrl: `${BASE}/${m[1]}/`,
      });
    });
    return { success: true, items };
  }

  // -- Search ---------------------------------------------------
  async search(query: string): Promise<SearchResult> {
    const res = await smartFetch(`${BASE}/search?keyword=${encodeURIComponent(query)}`);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    const seen = new Set<string>();

    $('a[href*="/' + '/"]').each((_, el) => {
      const $a = $(el);
      const href = this.abs($a.attr('href'));
      const m = href.match(new RegExp(`^${BASE}/([a-z]+)/`));
      if (!m || seen.has(m[1])) return;
      seen.add(m[1]);
      items.push({ bookId: m[1], title: $a.text().trim(), bookUrl: `${BASE}/${m[1]}/` });
    });
    return { success: true, items };
  }

  // -- Novel Info + Chapters ------------------------------------
  async getNovelInfo(slug: string): Promise<NovelInfoResult> {
    const res = await smartFetch(`${BASE}/${slug}/`);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const chapters = await this.getChapterList(slug);

    return {
      success: true,
      novel: {
        bookId: slug,
        title: $('h1').first().text().trim(),
        coverUrl: this.abs($('img').first().attr('src')),
        chapters: chapters.items,
      },
    };
  }

  // -- Chapter List ---------------------------------------------
  async getChapterList(slug: string): Promise<ChapterListResult> {
    const res = await smartFetch(`${BASE}/${slug}/`);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: ChapterItem[] = [];
    const seen = new Set<string>();

    $(`a[href*="/${slug}/"][href$=number]"]`).each((_, el) => {
      const $a = $(el);
      const href = this.abs($a.attr('href'));
      const m = href.match(new RegExp(`^${BASE}/${slug}/(\\d+)$`));
      if (!m || seen.has(m[1])) return;
      seen.add(m[1]);
      items.push({ chapterId: m[1], title: $a.text().trim(), chapterUrl: href });
    });
    return { success: true, items };
  }

  // -- Chapter Text ---------------------------------------------
  async getChapterText(slug: string, chapterId: string): Promise<ChapterTextResult> {
    const url = `${BASE}/${slug}/${chapterId}`;
    const res = await smartFetch(url);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const lines: string[] = [];
    $('#content p').each((_, el) => {
      const t = $(el).text().trim();
      if (t) lines.push(t);
    });

    return {
      success: true,
      title: $('h1').first().text().trim(),
      content: cleanText(lines.join('\n')),
    };
  }
}
