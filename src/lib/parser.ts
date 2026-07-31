/**
 * Parser — Cheerio-based HTML parsing utilities.
 * Shared helpers used by all plugins.
 */

import { load } from 'cheerio';

/** Load an HTML string into a Cheerio document. */
export function loadHtml(html: string) {
  return load(html);
}

/** Resolve a potentially relative URL against a base. */
export function resolveUrl(href: string | undefined | null, base: string): string {
  if (!href) return '';
  if (href.startsWith('http')) return href;
  if (href.startsWith('//')) return 'https:' + href;
  if (href.startsWith('/')) {
    try { return new URL(href, base).href; } catch { return base + href; }
  }
  return base + '/' + href;
}

/** Clean chapter text: remove ads, page markers, empty lines. */
export function cleanText(text: string): string {
  return text
    .replace(/\s*第\(\d+\/\d+\)页\s*/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<ins[\s\S]*?<\/ins>/gi, '')
    .replace(/\[&[\s\S]*?\]/g, '')
    .replace(/本章未完.*?点击下一页继续/g, '')
    .replace(/手机用户请浏览.*?阅读/g, '')
    .split(/\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}
