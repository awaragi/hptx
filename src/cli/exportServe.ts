import http from 'node:http';
import type { AddressInfo } from 'node:net';

export interface TempHtmlServer {
  url: string;
  close: () => Promise<void>;
}

/** Serve assembled HTML at a localhost URL so CDN assets can load. */
export async function serveAssembledHtml(html: string): Promise<TempHtmlServer> {
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html' || req.url?.startsWith('/?')) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(html);
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${addr.port}/`;

  return {
    url,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
