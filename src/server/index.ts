import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { World } from 'tx2-ecs';
import { renderDocument } from 'tx2-ecs/server';
import { Render } from 'tx2-ecs/client';
import { h } from 'tx2-ecs/client';

const PORT = process.env.PORT || 3000;

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function serveFile(baseDir: string, url: string): Promise<{ content: Buffer; contentType: string } | null> {
  try {
    const trimmed = url.replace(/^\/+/, '');
    const filePath = join(process.cwd(), baseDir, trimmed);
    console.log(`[DEBUG] Serving file: ${url} -> ${filePath}`);
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    return { content, contentType };
  } catch (e) {
    console.error(`[DEBUG] Error serving ${url}:`, e);
    return null;
  }
}

function createWorld(currentPath: string): World {
  const world = new World();
  const isActive = (path: string) => currentPath === path;

  const rootEntity = world.createEntity();
  world.addComponent(rootEntity.id, Render.create({
    render: () => h('div', { id: 'app', class: 'layout' },
      h('header', null,
        h('nav', null,
          h('div', { class: 'brand' },
            h('img', { src: '/public/icon-pen.svg', alt: 'TX-2 Light Pen' }),
            h('span', null, 'TX-2 / ECS')
          ),
          h('div', { class: 'nav-links' },
            h('a', { href: '/', class: isActive('/') ? 'active' : undefined }, 'Home'),
            h('a', { href: '/#docs-content' }, 'Docs'),
            h('a', { href: '/#examples' }, 'Examples'),
            h('a', { href: 'https://github.com/IreGaddr/tx2-ecs' }, 'GitHub')
          )
        )
      ),
      h('main', null,
        h('section', { class: 'hero', id: 'hero' },
          h('div', { class: 'hero-grid' },
            h('div', null,
              h('div', { class: 'tagline' }, 'Sketchpad → TX-2 → Web'),
              h('h1', null, 'WEB ARCHITECTURE, CORRECTED.'),
              h('p', null, 'In 1963, Ivan Sutherland drew on a phosphor display with the TX-2 light pen and built the first interactive ECS. TX-2 brings that architecture to the modern web: isomorphic logic, zero bloat, precise control.'),
              h('div', { class: 'cta-row' },
                h('a', { href: '#docs', class: 'btn primary' }, 'Get Started'),
                h('a', { href: 'https://www.npmjs.com/package/tx2-ecs', class: 'btn ghost' }, 'npm install tx2-ecs'),
                h('a', { href: 'https://github.com/IreGaddr/tx2-ecs', class: 'btn ghost' }, 'View Source')
              )
            ),
            h('div', { class: 'hud' },
              h('div', { class: 'corners' }),
              h('div', { class: 'label' }, 'LIVE SYSTEM // ECS'),
              h('div', { class: 'grid-two' },
                h('div', { class: 'stat' },
                  h('span', { class: 'label' }, 'HYDRATION'),
                  h('span', { class: 'value', id: 'hud-hydration' }, 'Ready')
                ),
                h('div', { class: 'stat' },
                  h('span', { class: 'label' }, 'TICK / FPS'),
                  h('span', { class: 'value', id: 'hud-fps' }, '—')
                )
              ),
              h('div', { class: 'widget', id: 'hud-widget' },
                h('span', null, 'Signal Demo: awaiting hydration...')
              )
            )
          )
        ),

        h('section', { class: 'hud', id: 'why' },
          h('div', { class: 'corners' }),
          h('div', { class: 'label' }, 'WHY TX-2'),
          h('div', { class: 'feature-grid' },
            h('div', { class: 'feature-card' },
              h('h3', null, 'Fullstack ECS'),
              h('p', null, 'Define components once. The same systems run on server and client with deterministic state and hydration.')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'Reactive Core'),
              h('p', null, 'Signals, computed values, and effects without VDOM drift. Minimal allocations, maximal control.')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'SSR + Sync'),
              h('p', null, 'Server-side rendering with hydration markers plus delta-compressed state synchronization.')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'Type-Safe RPC'),
              h('p', null, 'Define procedures with runtime guards and TypeScript inference across the wire.')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'Performance Discipline'),
              h('p', null, 'Query indexing, batched updates, and worker-ready schedulers for heavy scenes.')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'Zero Bloat'),
              h('p', null, 'ESM-first, tree-shakeable modules. No framework runtime tax.')
            )
          )
        ),

        h('section', { class: 'grid-two', id: 'docs' },
          h('div', { class: 'hud' },
            h('div', { class: 'corners' }),
            h('div', { class: 'label' }, 'QUICK START'),
            h('div', { class: 'code' },
              `npm install tx2-ecs

import { World, defineComponent, Component } from 'tx2-ecs';
import { h, Render } from 'tx2-ecs/client';

class Counter extends Component {
  private countSignal = this.defineReactive('count', 0);

  get count() { return this.countSignal.get(); }
  set count(value: number) { this.countSignal.set(value); }

  clone() {
    return new Counter({ count: this.countSignal.peek() }) as this;
  }
}

const world = new World();
const entity = world.createEntity();

world.addComponent(entity.id, new Counter({ count: 0 }));
world.addComponent(entity.id, Render.create({
  render: () => {
    const counter = world.getComponent<Counter>(entity.id, 'Counter')!;
    return h('div', null,
      h('p', null, \`Count: \${counter.count}\`),
      h('button', {
        onclick: () => counter.count++
      }, 'Increment')
    );
  }
}));

await world.init();
world.start();`
            )
          ),
          h('div', { class: 'hud' },
            h('div', { class: 'corners' }),
            h('div', { class: 'label' }, 'DOCS MAP'),
            h('div', { class: 'feature-grid' },
              h('div', { class: 'feature-card' },
                h('h3', null, 'Getting Started'),
                h('p', null, 'Installation, project layout, build targets, hydration.'),
                h('a', { href: '#docs-content', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'Read')
              ),
              h('div', { class: 'feature-card' },
                h('h3', null, 'Core Concepts'),
                h('p', null, 'World, Entity, Component, System, Signals, Scheduling.'),
                h('a', { href: '#docs-deepdive', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'Read')
              ),
              h('div', { class: 'feature-card' },
                h('h3', null, 'Client / SSR'),
                h('p', null, 'Rendering, hydration markers, event wiring, streaming.'),
                h('a', { href: '#docs-client', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'Read')
              ),
              h('div', { class: 'feature-card' },
                h('h3', null, 'RPC & Sync'),
                h('p', null, 'Type-safe RPC, rate limits, delta compression, auth hooks.'),
                h('a', { href: '#docs-client', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'Read')
              )
            )
          )
        ),

        h('section', { class: 'hud', id: 'docs-content' },
          h('div', { class: 'corners' }),
          h('div', { class: 'label' }, 'DOCS // OVERVIEW'),
          h('div', { class: 'docs-grid' },
            h('div', { class: 'docs-item' },
              h('h4', null, 'Architecture'),
              h('p', null, 'TX-2 is an isomorphic ECS. Define components and systems once; run them on server and client. Hydration carries state across the wire without VDOM.')
            ),
            h('div', { class: 'docs-item' },
              h('h4', null, 'Entities & Components'),
              h('ul', null,
                h('li', null, 'Entity: ID-only container.'),
                h('li', null, 'Component: State + reactive signals via defineReactive.'),
                h('li', null, 'Systems: Functions over queries; phases: init/update/fixedUpdate/lateUpdate/cleanup.')
              )
            ),
            h('div', { class: 'docs-item' },
              h('h4', null, 'Reactivity'),
              h('p', null, 'Signals are first-class. Components expose signals; systems react via effects. No VDOM diffing; direct DOM ops in render system.')
            ),
            h('div', { class: 'docs-item' },
              h('h4', null, 'Rendering'),
              h('p', null, 'Client: Render.create wraps a render() returning h() trees. Server: renderDocument(world) emits HTML + hydration markers.')
            ),
            h('div', { class: 'docs-item' },
              h('h4', null, 'RPC & Sync'),
              h('p', null, 'RPC definitions live in server; clients call with inferred types. State sync uses delta compression; only dirty signals move.')
            ),
            h('div', { class: 'docs-item' },
              h('h4', null, 'Deployment'),
              h('ul', null,
                h('li', null, 'Bundle: npm run build (core/client/server + types).'),
                h('li', null, 'Node SSR: import { renderDocument } from "tx2-ecs/server".'),
                h('li', null, 'Client: include /dist/client/index.js or bundle with your app.')
              )
            )
          )
        ),

        h('section', { class: 'grid-two', id: 'docs-deepdive' },
          h('div', { class: 'hud' },
            h('div', { class: 'corners' }),
            h('div', { class: 'label' }, 'DOCS // CORE'),
            h('div', { class: 'code' },
              `// Define a component
import { Component, defineComponent } from 'tx2-ecs';

class Position extends Component {
  x = this.defineReactive('x', 0);
  y = this.defineReactive('y', 0);
  clone() { return new Position({ x: this.x.peek(), y: this.y.peek() }) as this; }
}

export const PositionC = defineComponent('Position', () => Position);

// System
import { defineSystem, createSystemId } from 'tx2-ecs';

export const MoveSystem = defineSystem({
  id: createSystemId('Move'),
  name: 'Move',
  phases: ['update'],
}, ({ world, deltaTime }) => {
  const entities = world.query({ all: ['Position'] });
  for (const entity of entities) {
    const pos = world.getComponent(entity, 'Position') as Position;
    pos.x.set(pos.x.get() + 10 * deltaTime);
  }
});

// Wiring
world.addComponent(entity.id, PositionC.create({ x: 0, y: 0 }));
world.addSystem(MoveSystem);
world.start();`
            )
          ),
          h('div', { class: 'hud' },
            h('div', { class: 'corners' }),
            h('div', { class: 'label' }, 'DOCS // CLIENT & SSR'),
            h('div', { class: 'docs-grid' },
              h('div', { class: 'docs-item' },
                h('h4', null, 'Client Render'),
                h('p', null, 'Use Render.create to bind a render function. h(tag, props, ...children) builds DOM nodes directly; no VDOM diff.')
              ),
              h('div', { class: 'docs-item' },
                h('h4', null, 'SSR'),
                h('p', null, 'renderDocument(world, opts) outputs HTML with hydration data. Include <script type="module" src="/dist/client/index.js">.')
              ),
              h('div', { class: 'docs-item' },
                h('h4', null, 'Hydration'),
                h('p', null, 'hydrateWorld(world, { root, clearMarkers }) attaches to server markup and restores signals.')
              ),
              h('div', { class: 'docs-item' },
                h('h4', null, 'State Sync (server-driven)'),
                h('p', null, 'Track dirty signals; ship deltas. RPC hooks can push state; clients patch into components.')
              )
            )
          )
        ),

        h('section', { class: 'hud', id: 'examples' },
          h('div', { class: 'corners' }),
          h('div', { class: 'label' }, 'EXAMPLES'),
          h('div', { class: 'feature-grid' },
            h('div', { class: 'feature-card' },
              h('h3', null, 'Live Counter'),
              h('p', null, 'Reactive signal demo running inside this page. Watch the HUD tick.'),
              h('a', { href: '#hud-widget', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'Open HUD')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'SSR Hydration'),
              h('p', null, 'This page is server rendered via TX-2 and hydrated on load. No extra framework.'),
              h('a', { href: '#hero', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'View Render')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'Particle Field'),
              h('p', null, 'Pointer-reactive neon particle field driven by signals.'),
              h('a', { href: '#hud-widget', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'Run Demo')
            )
          )
        )
      ),
      h('footer', null,
        h('span', null, '© 2025 TX-2 // Built with tx2-ecs'),
        h('span', null, 'Sketchpad → TX-2 → Web')
      )
    )
  }));

  return world;
}

export const requestHandler = async (req: any, res: any) => {
  const url = req.url || '/';
  const parsed = new URL(url, 'http://localhost');
  const path = parsed.pathname;

  if (path.startsWith('/public/')) {
    const staticFile = await serveFile('public', path.replace(/^\/public\//, ''));
    if (staticFile) {
      res.writeHead(200, { 'Content-Type': staticFile.contentType });
      res.end(staticFile.content);
      return;
    }
  }

  if (path.startsWith('/dist/')) {
    const staticFile = await serveFile('.', path);
    if (staticFile) {
      res.writeHead(200, { 'Content-Type': staticFile.contentType });
      res.end(staticFile.content);
      return;
    }
  }

  if (path.startsWith('/client/')) {
    const staticFile = await serveFile('public', path);
    if (staticFile) {
      res.writeHead(200, { 'Content-Type': staticFile.contentType });
      res.end(staticFile.content);
      return;
    }
  }

  const allowedPaths = new Set(['/', '/docs', '/examples']);
  if (!allowedPaths.has(path)) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>TX-2 // 404</title>
          <link rel="stylesheet" href="/public/styles.css">
        </head>
        <body>
          <div class="layout">
            <main style="max-width: 760px; margin: 4rem auto; padding: 1rem;">
              <section class="hud">
                <div class="corners"></div>
                <div class="label">SYSTEM CRASH // 404</div>
                <h1 style="font-family: var(--font-display); margin-bottom: 0.5rem;">Signal Lost</h1>
                <p style="color: var(--color-muted); margin-bottom: 1rem;">The requested vector doesn’t exist. Return to base and try again.</p>
                <div class="cta-row">
                  <a class="btn primary" href="/">Return Home</a>
                  <a class="btn ghost" href="/docs">Docs</a>
                </div>
              </section>
            </main>
          </div>
        </body>
      </html>
    `);
    return;
  }

  const world = createWorld(path);
  await world.init();

  const html = renderDocument(
    world,
    { includeHydrationData: true },
    {
      title: 'TX-2: Web Entity Component System',
      head: `
        <meta name="description" content="TX-2 is a fullstack Entity Component System framework for building reactive web applications with SSR, state sync, and type-safe RPC.">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/public/styles.css">
        <script type="module" src="/dist/client/index.js"></script>
      `
    }
  );

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
};

// Only start the server if this file is being run directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createServer(requestHandler);
  server.listen(PORT, () => {
    console.log(`TX-2 website running at http://localhost:${PORT}`);
  });
}
