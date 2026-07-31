import { NextRequest, NextResponse } from 'next/server';
import { getPlugin, hasSource } from '@/lib/plugin-registry';
import type { ApiResponse, CatalogResult } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;
  if (!hasSource(source)) {
    return NextResponse.json({ success: false, source, action: 'GetCatalog', error: `Unknown source: ${source}`, timestamp: Date.now() } as ApiResponse, { status: 404 });
  }

  const plugin = getPlugin(source)!;
  const page = Number(req.nextUrl.searchParams.get('page') || 1);
  const result: CatalogResult = await plugin.getCatalog(page);

  const res: ApiResponse<CatalogResult> = {
    success: result.success,
    source,
    action: 'GetCatalog',
    data: result,
    error: result.error,
    timestamp: Date.now(),
  };
  return NextResponse.json(res);
}
