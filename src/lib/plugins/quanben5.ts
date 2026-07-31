import * as cheerio from 'cheerio';
import { smartFetch } from '@/lib/bypasser';
import { resolveUrl, cleanText } from '@/lib/parser';
import type {
  NovelSourcePlugin, SourceInfo, CatalogResult, SearchResult,
  NovelInfoResult, ChapterListResult, ChapterTextResult, NovelItem, ChapterItem,
} from '@/lib/types';

const BASE = 'https://big5.quanben5.com';

export class Quanben5Plugin implements NovelSourcePlugin {
  info: SourceInfo = {
    id: 'quanben5',
    name: 'Quanben5',
    baseUrl: BASE,
    language: 'zh',
    charset: 'UTF-8',
    hasSearch: false,
    hasCatalog: true,
  };

  private abs(href: string | undefined | null): string {
    return resolveUrl(href, BASE);
  }

  // -- Catalog (category page) ---------------------------------
  async getCatalog(page = 1): Promise<CatalogResult> {
    const res = await smartFetch(`${BASE}/category/${page}.html`);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    $('.pic_txt_list').each((_, el) => {
      const $el = $(el);
      const link = $el.find('h3 a').first();
      const href = this.abs(link.attr('href'));
      const slug = href.split('/n/')[1]?.replace(/\/$/, '') ?? '';
      if (!slug) return;
      items.push({
        bookId: slug,
        title: link.text().trim(),
        coverUrl: this.abs($el.find('.pic img').first().attr('src')),
        bookUrl: href,
      });
    });
    return { success: true, items };
  }

  // -- Search (not available) ----------------------------------
  async search(_query: string): Promise<SearchResult> {
    return { success: false, items: [], error: 'Search not available on Quanben5' };
  }

  // -- Novel Info ---------------------------------------------
  async getNovelInfo(slug: string): Promise<NovelInfoResult> {
    const res = await smartFetch(`${BASE}/n/${slug}/`);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const chapters = await this.getChapterList(slug);

    return {
      success: true,
      novel: {
        bookId: slug,
        title: $('h1').first().text().trim(),
        coverUrl: this.abs($('.box .pic img').first().attr('src')),
        description: $('.intro, .desc, .info p').first().text().trim() || undefined,
        chapters: chapters.items,
      },
    };
  }

  // -- Chapter List (SEPARATE page) ----------------------------
  async getChapterList(slug: string): Promise<ChapterListResult> {
    const url = `${BASE}/n/${slug}/xiaoshuo.html`;
    const res = await smartFetch(url);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: ChapterItem[] = [];
    $('ul.list a').each((_, el) => {
      const $a = $(el);
      const href = this.abs($a.attr('href'));
      const m = href.match(/\/(\d+)\.html$/);
      if (!m) return;
      items.push({ chapterId: m[1], title: $a.text().trim(), chapterUrl: href });
    });
    return { success: true, items };
  }

  // -- Chapter Text -------------------------------------------
  async getChapterText(slug: string, chapterId: string): Promise<ChapterTextResult> {
    const url = `${BASE}/n/${slug}/${chapterId}.html`;
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
