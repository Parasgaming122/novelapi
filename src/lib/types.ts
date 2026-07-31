/**
 * Unified types for the Novel Sources API.
 * All plugins MUST implement NovelSourcePlugin.
 */

// ─── Data Models ───────────────────────────────────────────────

export interface NovelItem {
  bookId: string;
  title: string;
  author?: string;
  coverUrl?: string;
  description?: string;
  bookUrl?: string;
  latestChapter?: string;
}

export interface ChapterItem {
  chapterId: string;
  title: string;
  chapterUrl?: string;
  ordernum?: number;
}

export interface NovelInfo {
  bookId: string;
  title: string;
  author?: string;
  coverUrl?: string;
  description?: string;
  chapters: ChapterItem[];
}

// ─── Result Types ──────────────────────────────────────────────

export interface SourceInfo {
  id: string;
  name: string;
  baseUrl: string;
  language: string;
  charset: string;
  hasSearch: boolean;
  hasCatalog: boolean;
}

export interface CatalogResult {
  success: boolean;
  items: NovelItem[];
  page?: number;
  totalPages?: number;
  error?: string;
}

export interface SearchResult {
  success: boolean;
  items: NovelItem[];
  error?: string;
}

export interface NovelInfoResult {
  success: boolean;
  novel?: NovelInfo;
  error?: string;
}

export interface ChapterListResult {
  success: boolean;
  items: ChapterItem[];
  error?: string;
}

export interface ChapterTextResult {
  success: boolean;
  title?: string;
  content?: string;
  contentHtml?: string;
  nextChapterId?: string;
  prevChapterId?: string;
  error?: string;
}

// ─── Plugin Interface ──────────────────────────────────────────

export interface NovelSourcePlugin {
  info: SourceInfo;
  getCatalog(page?: number): Promise<CatalogResult>;
  search(query: string): Promise<SearchResult>;
  getNovelInfo(bookId: string): Promise<NovelInfoResult>;
  getChapterList(bookId: string): Promise<ChapterListResult>;
  getChapterText(bookId: string, chapterId: string): Promise<ChapterTextResult>;
}

// ─── API Response Envelope ─────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  source: string;
  action: string;
  data?: T;
  error?: string;
  timestamp: number;
}
