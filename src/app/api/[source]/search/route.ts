import { NextRequest, NextResponse } from 'next/server';
import { getPlugin, hasSource } from '@/lib/plugin-registry';
import type { ApiResponse, SearchResult } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;
  if (!hasSource(source)) {
    return NextResponse.json({ success: false, source, action: 'Search', error: `Unknown source: ${source}`, timestamp: Date.now() } as ApiResponse, { status: 404 });
  }

  const query = req.nextUrl.searchParams.get('q');
  if (!query) {
    return NextResponse.json({ success: false, source, action: 'Search', error: 'Missing ?q= parameter', timestamp: Date.now() } as ApiResponse, { status: 400 });
  }

  const plugin = getPlugin(source)!;
  const result: SearchResult = await plugin.search(query);

  const res: ApiResponse<SearchResult> = {
    success: result.success,
    source,
    action: 'Search',
    data: result,
    error: result.error,
    timestamp: Date.now(),
  };
  return NextResponse.json(res);
}
