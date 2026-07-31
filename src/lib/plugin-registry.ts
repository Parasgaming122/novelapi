import type { NovelSourcePlugin, SourceInfo } from './types';
import { Ixdzs8Plugin } from './plugins/ixdzs8';
import { XBiqugePlugin } from './plugins/xbiquge';
import { BiQuGeCompanyPlugin } from './plugins/biquge-company';
import { TTKanPlugin } from './plugins/ttkan';
import { ShuHaiGePlugin } from './plugins/shuhaige';
import { Quanben5Plugin } from './plugins/quanben5';
import { RayforboePlugin } from './plugins/rayforboe';

const plugins = new Map<string, NovelSourcePlugin>([
  ['ixdzs8',       new Ixdzs8Plugin()],
  ['xbiquge',      new XBiqugePlugin()],
  ['biquge_company', new BiQuGeCompanyPlugin()],
  ['ttkan',        new TTKanPlugin()],
  ['shuhaige',     new ShuHaiGePlugin()],
  ['quanben5',     new Quanben5Plugin()],
  ['rayforboe',    new RayforboePlugin()],
]);

/** Get all registered source IDs. */
export function getSources(): SourceInfo[] {
  return Array.from(plugins.values()).map(p => p.info);
}

/** Get a single plugin by source ID. */
export function getPlugin(id: string): NovelSourcePlugin | undefined {
  return plugins.get(id);
}

/** Check if a source ID exists. */
export function hasSource(id: string): boolean {
  return plugins.has(id);
}
