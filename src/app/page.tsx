export default function Home() {
  return (
    <div style={{ fontFamily: 'monospace', maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <h1>Novel Sources API</h1>
      <p>Serverless Vercel API for Chinese novel aggregation.</p>
      <pre>{`
ENDPOINTS
=========

GET  /api/sources
  List all available novel sources.

GET  /api/:source/catalog?page=1
  Get catalog (book listing) for a source.

GET  /api/:source/search?q=keyword
  Search novels on a source.

GET  /api/:source/novel/:bookId
  Get novel info + full chapter list.

GET  /api/:source/novel/:bookId/chapters
  Get chapter list only.

GET  /api/:source/novel/:bookId/:chapterId
  Get chapter text content.

SOURCES
=======
${[
  { id: 'ixdzs8', name: 'Aixdzs', charset: 'UTF-8', search: true },
  { id: 'xbiquge', name: 'XBiquge', charset: 'UTF-8', search: true },
  { id: 'biquge_company', name: 'BiQuGe.company', charset: 'UTF-8', search: true },
  { id: 'ttkan', name: 'TTKan', charset: 'UTF-8', search: true },
  { id: 'shuhaige', name: 'ShuHaiGe', charset: 'UTF-8', search: true },
  { id: 'quanben5', name: 'Quanben5 (Big5)', charset: 'Big5', search: false },
  { id: 'rayforboe', name: 'Rayforboe', charset: 'UTF-8', search: true },
].map(s => `  ${s.id.padEnd(18)} ${s.name.padEnd(20)} charset=${s.charset}  search=${s.search}`).join('\n')}

RESPONSE FORMAT
================
All responses use the envelope:
{
  "success": true|false,
  "source": "<source_id>",
  "action": "GetCatalog|Search|GetNovelInfo|GetChapterList|GetChapterText",
  "data": { ... },
  "error": "...",
  "timestamp": 1234567890
}

COMPONENTS
==========
- lib/bypasser.ts     Smart fetch with CF bypass, charset detection, UA rotation
- lib/parser.ts      Cheerio HTML parsing utilities
- lib/types.ts       Unified TypeScript interfaces
- lib/plugins/*.ts   Per-site plugin implementations
- lib/plugin-registry.ts  Plugin registration & lookup
`}</pre>
    </div>
  );
}