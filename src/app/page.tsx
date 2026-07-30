export default function Home() {
  const sourceRows: [string, string, string, boolean, boolean][] = [
    ['ixdzs8', 'Aixdzs', 'UTF-8', true, true],
    ['xbiquge', 'XBiquge', 'UTF-8', true, true],
    ['biquge_company', 'BiQuGe.company', 'UTF-8', true, true],
    ['ttkan', 'TTKan', 'UTF-8', true, true],
    ['shuhaige', 'ShuHaiGe', 'UTF-8', true, true],
    ['quanben5', 'Quanben5', 'Big5', false, true],
    ['rayforboe', 'Rayforboe', 'UTF-8', true, true],
  ];

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Novel Sources API</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
            background: #0a0a0a; color: #e4e4e7; line-height: 1.6;
            max-width: 920px; margin: 0 auto; padding: 2rem 1.5rem;
          }
          h1 { font-size: 2rem; margin-bottom: 0.3rem; color: #fff; }
          .sub { color: #71717a; margin-bottom: 2rem; font-size: 0.95rem; }
          h2 { font-size: 1.25rem; color: #fafafa; margin: 2.5rem 0 0.8rem; border-bottom: 1px solid #27272a; padding-bottom: 0.5rem; }
          h3 { font-size: 1rem; color: #a1a1aa; margin: 1.5rem 0 0.5rem; }
          pre { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 1rem; overflow-x: auto; font-size: 0.82rem; margin: 0.6rem 0 1.2rem; color: #a1a1aa; }
          code { font-family: 'SF Mono', 'Fira Code', monospace; }
          .method { display: inline-block; background: #22c55e22; color: #4ade80; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 6px; }
          .method.post { background: #3b82f622; color: #60a5fa; }
          .endpoint { color: #facc15; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin: 0.8rem 0 1.5rem; font-size: 0.85rem; }
          th { text-align: left; color: #71717a; font-weight: 500; padding: 0.4rem 0.8rem; border-bottom: 1px solid #27272a; }
          td { padding: 0.4rem 0.8rem; border-bottom: 1px solid #1c1c1f; }
          td:first-child { color: #e4e4e7; font-weight: 500; }
          .badge { display: inline-block; padding: 1px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; }
          .badge.green { background: #22c55e22; color: #4ade80; }
          .badge.yellow { background: #eab30822; color: #facc15; }
          .badge.red { background: #ef444422; color: #f87171; }
          .note { background: #1e1b4b11; border-left: 3px solid #6366f1; padding: 0.8rem 1rem; border-radius: 0 6px 6px 0; margin: 0.8rem 0; font-size: 0.85rem; color: #a5b4fc; }
          .note strong { color: #c7d2fe; }
        `}</style>
      </head>
      <body>
        <h1>Novel Sources API</h1>
        <p className="sub">Serverless Vercel API &middot; 7 Chinese novel sources &middot; Unified endpoints &middot; Auto charset detection</p>

        {/* ─── Sources ─── */}
        <h2>Sources</h2>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Charset</th><th>Search</th><th>Catalog</th></tr></thead>
          <tbody>
            {sourceRows.map(([id, name, cs, srch, cat]) => (
              <tr key={id}><td><code>{id}</code></td><td>{name}</td><td>{cs}</td>
                <td><span className={"badge " + (srch ? "green" : "red")}>{srch ? 'Yes' : 'No'}</span></td>
                <td><span className="badge green">Yes</span></td></tr>
            ))}
          </tbody>
        </table>

        {/* ─── Endpoints ─── */}
        <h2>Endpoints</h2>

        <h3><span className="method">GET</span> <span className="endpoint">/api/sources</span></h3>
        <p>List all available novel sources with metadata.</p>
        <pre>{`GET /api/sources

// Response
{
  "success": true,
  "source": "system",
  "action": "GetSources",
  "data": [
    {
      "id": "ixdzs8",
      "name": "Aixdzs",
      "baseUrl": "https://ixdzs8.com",
      "language": "zh",
      "charset": "UTF-8",
      "hasSearch": true,
      "hasCatalog": true
    }
    // ...
  ],
  "timestamp": 1722345678901
}`}</pre>

        <h3><span className="method">GET</span> <span className="endpoint">/api/:source/catalog?page=1</span></h3>
        <p>Browse the catalog (book listing) of a source.</p>
        <pre>{`GET /api/ixdzs8/catalog?page=1
GET /api/ttkan/catalog?page=2

// Response
{
  "success": true,
  "source": "ixdzs8",
  "action": "GetCatalog",
  "data": {
    "success": true,
    "items": [
      {
        "bookId": "1",
        "title": "斗破苍穹",
        "author": "天蚕土豆",
        "coverUrl": "https://...",
        "bookUrl": "https://ixdzs8.com/read/1/"
      }
    ],
    "page": 1
  },
  "timestamp": 1722345678901
}`}</pre>

        <h3><span className="method">GET</span> <span className="endpoint">/api/:source/search?q=keyword</span></h3>
        <p>Search for novels. Use Chinese characters for best results.</p>
        <div className="note"><strong>Note:</strong> Quanben5 does not support search. Searching it will return an error.</div>
        <pre>{`GET /api/biquge_company/search?q=斗破苍穹
GET /api/xbiquge/search?q=keyword

// Response
{
  "success": true,
  "source": "biquge_company",
  "action": "Search",
  "data": {
    "success": true,
    "items": [
      {
        "bookId": "98405",
        "title": "斗破苍穹",
        "coverUrl": "https://...",
        "bookUrl": "https://www.biquge.company/book/98405.html"
      }
    ]
  },
  "timestamp": 1722345678901
}`}</pre>

        <h3><span className="method">GET</span> <span className="endpoint">/api/:source/novel/:bookId</span></h3>
        <p>Get novel metadata + full chapter list in one call.</p>
        <pre>{`GET /api/ixdzs8/novel/1
GET /api/ttkan/novel/wanxiangzhiwang-tiancantudou
GET /api/quanben5/novel/yishixiejun
GET /api/biquge_company/novel/98405

// Response
{
  "success": true,
  "source": "ixdzs8",
  "action": "GetNovelInfo",
  "data": {
    "success": true,
    "novel": {
      "bookId": "1",
      "title": "斗破苍穹",
      "author": "天蚕土豆",
      "coverUrl": "https://...",
      "description": "这里是简介...",
      "chapters": [
        {
          "chapterId": "2",
          "title": "第一章 陨落的天才",
          "chapterUrl": "https://ixdzs8.com/read/1/p2.html",
          "ordernum": 2
        }
      ]
    }
  },
  "timestamp": 1722345678901
}`}</pre>

        <h3><span className="method">GET</span> <span className="endpoint">/api/:source/novel/:bookId/chapters</span></h3>
        <p>Get the chapter list only (no novel metadata). Lighter response.</p>
        <pre>{`GET /api/shuhaige/novel/1397/chapters

// Response
{
  "success": true,
  "source": "shuhaige",
  "action": "GetChapterList",
  "data": {
    "success": true,
    "items": [
      {
        "chapterId": "152060484",
        "title": "第二百三十九章 众说纷纭",
        "chapterUrl": "https://m.shuhaige.net/1397/152060484.html"
      }
    ]
  },
  "timestamp": 1722345678901
}`}</pre>

        <h3><span className="method">GET</span> <span className="endpoint">/api/:source/novel/:bookId/:chapterId</span></h3>
        <p>Get the full text content of a chapter. Cleaned of ads and page markers.</p>
        <pre>{`GET /api/ixdzs8/novel/1/2
GET /api/biquge_company/novel/98384/30845698
GET /api/ttkan/novel/wanxiangzhiwang-tiancantudou/1
GET /api/quanben5/novel/yishixiejun/7517
GET /api/shuhaige/novel/1397/152060484

// Response
{
  "success": true,
  "source": "ixdzs8",
  "action": "GetChapterText",
  "data": {
    "success": true,
    "title": "第一章 陨落的天才",
    "content": "斗气大陆，没有花俏艳丽的魔法..."
  },
  "timestamp": 1722345678901
}`}</pre>

        {/* ─── Error Handling ─── */}
        <h2>Error Handling</h2>
        <p>All errors use the same envelope with <code>success: false</code>:</p>
        <pre>{`// Unknown source
{
  "success": false,
  "source": "nonexistent",
  "action": "GetCatalog",
  "error": "Unknown source: nonexistent",
  "timestamp": 1722345678901
}

// Source fetch failed (CF block, timeout, etc.)
{
  "success": true,
  "source": "ixdzs8",
  "action": "GetChapterText",
  "data": {
    "success": false,
    "error": "Exhausted retries"
  },
  "timestamp": 1722345678901
}`}</pre>

        {/* ─── Components ─── */}
        <h2>Architecture</h2>
        <table>
          <thead><tr><th>Component</th><th>File</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><strong>Bypasser</strong></td><td><code>lib/bypasser.ts</code></td><td>Smart fetch with CF challenge detection, UA rotation, session cookie caching, rate limiting, and GBK/Big5 charset decoding via iconv-lite</td></tr>
            <tr><td><strong>Parser</strong></td><td><code>lib/parser.ts</code></td><td>Cheerio HTML parsing utilities &mdash; URL resolution, text extraction, content cleaning (ads, page markers)</td></tr>
            <tr><td><strong>Types</strong></td><td><code>lib/types.ts</code></td><td>Unified TypeScript interfaces: <code>NovelItem</code>, <code>ChapterItem</code>, <code>NovelInfo</code>, <code>ApiResponse</code>, etc.</td></tr>
            <tr><td><strong>Plugin Registry</strong></td><td><code>lib/plugin-registry.ts</code></td><td>Registers all 7 plugins, provides <code>getPlugin(id)</code> and <code>getSources()</code></td></tr>
            <tr><td><strong>Plugins</strong></td><td><code>lib/plugins/*.ts</code></td><td>One file per source, each implements <code>NovelSourcePlugin</code> interface with 5 unified methods</td></tr>
            <tr><td><strong>API Routes</strong></td><td><code>app/api/**/*.ts</code></td><td>Next.js App Router API routes &mdash; thin wrappers that call the registry and return <code>ApiResponse</code></td></tr>
          </tbody>
        </table>

        {/* ─── Quick Examples ─── */}
        <h2>Quick Examples</h2>

        <h3>JavaScript / Fetch</h3>
        <pre>{`// 1. List all sources
const res = await fetch('/api/sources');
const { data: sources } = await res.json();
console.log(sources.map(s => s.id)); // ["ixdzs8", "xbiquge", ...]

// 2. Search for a novel
const res = await fetch('/api/biquge_company/search?q=斗破苍穹');
const { data } = await res.json();
const bookId = data.data.items[0].bookId;

// 3. Get novel info + chapters
const res = await fetch(\`/api/biquge_company/novel/\${bookId}\`);
const { data: novelData } = await res.json();
const novel = novelData.data.novel;
console.log(\`\${novel.title} - \${novel.chapters.length} chapters\`);

// 4. Read a chapter
const ch = novel.chapters[0];
const res = await fetch(\`/api/biquge_company/novel/\${bookId}/\${ch.chapterId}\`);
const { data: chData } = await res.json();
console.log(chData.data.content); // full chapter text`}</pre>

        <h3>Python / Requests</h3>
        <pre>{`import requests

BASE = "https://your-vercel-app.vercel.app"

# List sources
sources = requests.get(f"{BASE}/api/sources").json()["data"]
print([s["id"] for s in sources])

# Search
results = requests.get(f"{BASE}/api/ttkan/search", params={"q": "万相之王"}).json()
book_id = results["data"]["items"][0]["bookId"]

# Get chapters
novel = requests.get(f"{BASE}/api/ttkan/novel/{book_id}").json()["data"]["novel"]
for ch in novel["chapters"][:5]:
    print(f"  {ch['chapterId']}: {ch['title']}")

# Read first chapter
ch_id = novel["chapters"][0]["chapterId"]
text = requests.get(f"{BASE}/api/ttkan/novel/{book_id}/{ch_id}").json()
print(text["data"]["content"][:200])`}</pre>

        <h3>cURL</h3>
        <pre>{`# List sources
curl -s https://your-app.vercel.app/api/sources | jq '.data[].id'

# Search
curl -s "https://your-app.vercel.app/api/ixdzs8/search?q=test" | jq '.data.items[0].title'

# Get novel info
curl -s https://your-app.vercel.app/api/shuhaige/novel/1397 | jq '.data.novel.title'

# Read a chapter
curl -s https://your-app.vercel.app/api/shuhaige/novel/1397/152060484 | jq '.data.content' | head -20`}</pre>

        {/* ─── Book IDs ─── */}
        <h2>Book ID Formats</h2>
        <table>
          <thead><tr><th>Source</th><th>bookId Format</th><th>chapterId Format</th><th>Example</th></tr></thead>
          <tbody>
            <tr><td>ixdzs8</td><td>numeric</td><td>ordernum (p{'{'}N{'}'})</td><td><code>1</code> / <code>2</code></td></tr>
            <tr><td>xbiquge</td><td>numeric (site ID)</td><td>numeric</td><td><code>8697</code> / <code>272602</code></td></tr>
            <tr><td>biquge_company</td><td>numeric</td><td>numeric</td><td><code>98405</code> / <code>30845698</code></td></tr>
            <tr><td>ttkan</td><td>slug string</td><td>numeric</td><td><code>wanxiangzhiwang-tiancantudou</code> / <code>1</code></td></tr>
            <tr><td>shuhaige</td><td>numeric</td><td>numeric</td><td><code>1397</code> / <code>152060484</code></td></tr>
            <tr><td>quanben5</td><td>slug string</td><td>numeric</td><td><code>yishixiejun</code> / <code>7517</code></td></tr>
            <tr><td>rayforboe</td><td>slug string</td><td>numeric</td><td><code>mgbxsa</code> / <code>299672</code></td></tr>
          </tbody>
        </table>

        <div className="note">
          <strong>Tip:</strong> Use <code>/api/:source/catalog</code> or <code>/api/:source/search</code> first to discover valid book IDs, then use those to fetch novel info and chapters.
        </div>

        <p style={{ marginTop: '3rem', color: '#52525b', fontSize: '0.8rem' }}>
          Based on plugins from <a href="https://github.com/Parasgaming122/NovelReaderAi" style={{ color: '#a1a1aa' }}>NovelReaderAi</a>. Deployed on Vercel.
        </p>
      </body>
    </html>
  );
}
