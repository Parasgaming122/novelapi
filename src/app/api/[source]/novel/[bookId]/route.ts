import { NextRequest, NextResponse } from 'next/server';
import { getPlugin, hasSource } from '@/lib/plugin-registry';
import type { ApiResponse, NovelInfoResult } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ source: string; bookId: string }> }
) {
  const { source, bookId } = await params;
  if (!hasSource(source)) {
    return NextResponse.json({ success: false, source, action: 'GetNovelInfo', error: `Unknown source: ${source}`, timestamp: Date.now() } as ApiResponse, { status: 404 });
  }

  const plugin = getPlugin(source)!;
  const result: NovelInfoResult = await plugin.getNovelInfo(bookId);

  const res: ApiResponse<NovelInfoResult> = {
    success: result.success,
    source,
    action: 'GetNovelInfo',
    data: result,
    error: result.error,
    timestamp: Date.now(),
  };
  return NextResponse.json(res);
}