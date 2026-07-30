import { NextResponse } from 'next/server';
import { getSources } from '@/lib/plugin-registry';
import type { ApiResponse, SourceInfo } from '@/lib/types';

export async function GET() {
  const sources = getSources();
  const res: ApiResponse<SourceInfo[]> = {
    success: true,
    source: 'system',
    action: 'GetSources',
    data: sources,
    timestamp: Date.now(),
  };
  return NextResponse.json(res);
}