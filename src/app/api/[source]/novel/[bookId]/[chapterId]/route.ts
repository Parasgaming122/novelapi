import { NextRequest, NextResponse } from 'next/server';
import { getPlugin, hasSource } from '@/lib/plugin-registry';
import type { ApiResponse, ChapterTextResult } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ source: string; bookId: string; chapterId: string }> }
) {
  const { source, bookId, chapterId } = await params;
  if (!hasSource(source)) {
    return NextResponse.json({ success: false, source, action: 'GetChapterText', error: `Unknown source: ${source}`, timestamp: Date.now() } as ApiResponse, { status: 404 });
  }

  const plugin = getPlugin(source)!;
  const result: ChapterTextResult = await plugin.getChapterText(bookId, chapterId);

  const res: ApiResponse<ChapterTextResult> = {
    success: result.success,
    source,
    action: 'GetChapterText',
    data: result,
    error: result.error,
    timestamp: Date.now(),
  };
  return NextResponse.json(res);
}