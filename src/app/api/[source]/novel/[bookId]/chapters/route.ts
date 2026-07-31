import { NextRequest, NextResponse } from 'next/server';
import { getPlugin, hasSource } from '@/lib/plugin-registry';
import type { ApiResponse, ChapterListResult } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ source: string; bookId: string }> }
) {
  const { source, bookId } = await params;
  if (!hasSource(source)) {
    return NextResponse.json({ success: false, source, action: 'GetChapterList', error: `Unknown source: ${source}`, timestamp: Date.now() } as ApiResponse, { status: 404 });
  }

  const plugin = getPlugin(source)!;
  const result: ChapterListResult = await plugin.getChapterList(bookId);

  const res: ApiResponse<ChapterListResult> = {
    success: result.success,
    source,
    action: 'GetChapterList',
    data: result,
    error: result.error,
    timestamp: Date.now(),
  };
  return NextResponse.json(res);
}