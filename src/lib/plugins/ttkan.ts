import * as cheerio from 'cheerio';
import { smartFetch } from '@/lib/bypasser';
import { resolveUrl, cleanText } from '@/lib/parser';
import type {
  NovelSourcePlugin, SourceInfo, CatalogResult, SearchResult,
  NovelInfoResult, ChapterListResult, ChapterTextResult, NovelItem, ChapterItem,
} from '@/lib/types';

const BASE = 'https://www.ttkan.co';

export class TTKanPlugin implements NovelSourcePlugin {
  info: SourceInfo = {
    id: 'ttkan',
    name: 'TTKan',
    baseUrl: BASE,
    language: 'zh',
    charset: 'UTF-8',
    hasSearch: true,
    hasCatalog: true,
  };

  private abs(href: string | undefined | null): string {
    return resolveUrl(href, BASE);
  }

  // -- Catalog (Rank page) --------------------------------------
  async getCatalog(page = 1): Promise<CatalogResult> {
    const res = await smartFetch(`${BASE}/novel/rank?page=${page}`);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    $('.rank_list a[href*="/novel/chapters/"]').each((_, el) => {
      const $a = $(el);
      const href = this.abs($a.attr('href'));
      const slug = href.split('/novel/chapters/')[1]?.replace(/\/.*/, '') ?? '';
      items.push({
        bookId: slug,
        title: $a.text().trim(),
        coverUrl: this.abs($a.closest('.rank_list > div').find('img').first().attr('src')),
        bookUrl: href,
      });
    });
    return { success: true, items };
  }

  // -- Search ---------------------------------------------------
  async search(query: string): Promise<SearchResult> {
    const res = await smartFetch(`${BASE}/novel/search?q=${encodeURIComponent(query)}`);
    if (!res.success) return { success: false, items: [], error: res.error };

    const $ = cheerio.load(res.body);
    const items: NovelItem[] = [];
    $('.novel_cell').each((_, el) => {
      const $cell = $(el);
      const link = $cell.find('a[href*="/novel/chapters/"]').first();
      const href = this.abs(link.attr('href'));
      const slug = href.split('/novel/chapters/')[1]?.replace(/\/.*/, '') ?? '';
      items.push({
        bookId: slug,
        title: link.text().trim() || $cell.find('.book_name').text().trim(),
        coverUrl: this.abs($cell.find('img').first().attr('src')),
        bookUrl: href,
      });
    });
    return { success: true, items };
  }

  // -- Novel Info + Chapters (from chapters page) ---------------
  async getNovelInfo(novelId: string): Promise<NovelInfoResult> {
    const res = await smartFetch(`${BASE}/novel/chapters/${novelId}`);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const chapters = await this.getChapterList(novelId);

    return {
      success: true,
      novel: {
        bookId: novelId,
        title: $('h1').first().text().trim(),
        coverUrl: this.abs($('img.book-cover, .cover img').first().attr('src')),
        description: $('.description, .book-intro').first().text().trim() || undefined,
        chapters: chapters.items,
      },
    };
  }

  // -- Chapter List (JSON API) ---------------------------------
  async getChapterList(novelId: string): Promise<ChapterListResult> {
    const url = `${BASE}/api/nq/amp_novel_chapters?language=tw&novel_id=${novelId}`;
    const res = await smartFetch(url);
    if (!res.success) return { success: false, items: [], error: res.error };

    try {
      const data = JSON.parse(res.body);
      if (!Array.isArray(data.items)) return { success: false, items: [], error: 'Invalid API response' };
      const items: ChapterItem[] = data.items.map((ch: { chapter_name: string; chapter_id: string | number }) => ({
        chapterId: String(ch.chapter_id),
        title: ch.chapter_name,
        chapterUrl: `${BASE}/novel/pagea/${novelId}_${ch.chapter_id}.html`,
      }));
      return { success: true, items };
    } catch {
      return { success: false, items: [], error: 'Failed to parse chapter API' };
    }
  }

  // -- Chapter Text ---------------------------------------------
  async getChapterText(novelId: string, chapterId: string): Promise<ChapterTextResult> {
    const url = `${BASE}/novel/pagea/${novelId}_${chapterId}.html`;
    const res = await smartFetch(url);
    if (!res.success) return { success: false, error: res.error };

    const $ = cheerio.load(res.body);
    const $content = $('.content').first();
    // Remove bookmark ad, scripts, styles
    $content.find('a.anchor_bookmark, script, style, ins, .ad').remove();

    const lines: string[] = [];
    $content.find('p').each((_, el) => {
      const t = $(el).text().trim();
      if (t) lines.push(t);
    });

    return {
      success: true,
      title: $('h1, h1.chapter-title').first().text().trim(),
      content: cleanText(lines.join('\n')),
    };
  }
}
