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
            h('a', { href: '/manifesto', class: isActive('/manifesto') ? 'active' : undefined }, 'Manifesto'),
            h('a', { href: '/#stack' }, 'Stack'),
            h('a', { href: '/#examples' }, 'Examples'),
            h('a', { href: 'https://github.com/IreGaddr/tx2-ecs' }, 'GitHub')
          )
        )
      ),
      h('main', null,
        isActive('/manifesto') ? h('div', { class: 'manifesto-container', style: 'max-width: 800px; margin: 0 auto; padding: 2rem 1rem;' },
          h('section', { class: 'hud' },
            h('div', { class: 'corners' }),
            h('div', { class: 'label' }, 'MANIFESTO // 2025'),
            h('h1', { style: 'font-size: 2.5rem; line-height: 1.1; margin-bottom: 1.5rem; font-family: var(--font-display);' }, 'Real‑Time Web Without the Hangover: Why TX‑2 ECS Changes Everything'),

            h('p', { style: 'font-size: 1.1rem; line-height: 1.6; color: var(--color-text-dim); margin-bottom: 1rem;' },
              'Every few years, the web development world rediscovers the same dream: ',
              h('em', null, 'what if building real‑time, multiplayer, stateful apps didn’t feel like wrestling a pile of ad‑hoc patches?')
            ),
            h('p', { style: 'font-size: 1.1rem; line-height: 1.6; color: var(--color-text-dim); margin-bottom: 1rem;' },
              'We bolt WebSockets onto REST. We sprinkle in a state library or two. We invent yet another RPC layer. It all sort of works—until the app is big, the team is bigger, and any change risks a regression in some forgotten corner.'
            ),
            h('p', { style: 'font-size: 1.1rem; line-height: 1.6; color: var(--color-text-dim); margin-bottom: 2rem;' },
              h('strong', null, 'TX‑2 ECS'), ' starts from a different premise. Instead of treating state management, rendering, networking, and real‑time sync as separate problems, it adopts the architecture game engines have been refining for years: an ',
              h('strong', null, 'Entity–Component–System (ECS)'), ' core, wired directly into a web‑native runtime.'
            ),

            h('hr', { style: 'border: 0; border-top: 1px solid var(--color-border); margin: 2rem 0;' }),

            h('h2', { style: 'font-size: 1.8rem; margin-bottom: 1rem; color: var(--color-primary);' }, 'The Architecture: One World, Two Contexts'),
            h('p', { style: 'margin-bottom: 1rem;' }, 'The typical modern web stack is built on a quiet lie: the idea that it’s fine to have one shape of state on the server (SQL), another in your client store (Redux/Zustand), and a third in your UI (DOM), as long as you have enough glue code in between.'),
            h('p', { style: 'margin-bottom: 1rem; font-weight: bold;' }, 'TX‑2 rejects that. The ECS world is the state model.'),
            h('ul', { style: 'margin-bottom: 1rem; padding-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;' },
              h('li', null, h('strong', null, 'Server:'), ' You have a world of entities, components, and systems that implement core domain logic.'),
              h('li', null, h('strong', null, 'SSR:'), ' That world is serialized—snapshots, state, and all—into HTML.'),
              h('li', null, h('strong', null, 'Client:'), ' The browser "hydrates" that exact same world, waking up the entities and systems without missing a frame.')
            ),
            h('p', { style: 'margin-bottom: 2rem;' }, 'Renderers are not special; they are just systems that read components and produce DOM. Networking is not special; it’s a system that serializes changes and applies deltas. There is no second store hiding behind your view layer.'),

            h('hr', { style: 'border: 0; border-top: 1px solid var(--color-border); margin: 2rem 0;' }),

            h('h2', { style: 'font-size: 1.8rem; margin-bottom: 1rem; color: var(--color-primary);' }, 'Composability That Survives Five Years of Feature Requests'),
            h('p', { style: 'margin-bottom: 1rem;' }, 'Every experienced engineer knows that the hardest part of software is not getting version one out the door. It’s version twenty‑seven, after marketing, product, and three reorgs have left their fingerprints everywhere.'),
            h('blockquote', { style: 'border-left: 3px solid var(--color-primary); padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: var(--color-text-dim);' },
              '“Can we make premium users’ avatars have a gold outline? Oh, and it should also glow during special events if they’re online.”'
            ),
            h('p', { style: 'margin-bottom: 1rem;' }, 'In a typical OOP‑heavy or component-tree stack, this involves a trail of compromises. You extend a base Avatar component, add a boolean flag, thread isPremium through six layers, duplicate CSS, and hope you didn\'t break the admin dashboard.'),
            h('p', { style: 'margin-bottom: 1rem;' }, 'In ', h('strong', null, 'TX‑2'), ', this request is dull in the best possible way.'),
            h('ul', { style: 'margin-bottom: 1rem; padding-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;' },
              h('li', null, h('strong', null, 'Premium'), ' is a component.'),
              h('li', null, h('strong', null, 'Online'), ' is a component.'),
              h('li', null, h('strong', null, 'VisualState'), ' is a component.')
            ),
            h('p', { style: 'margin-bottom: 2rem;' }, 'To implement the feature, you write a small system: ', h('code', null, 'AvatarGlowSystem'), '. It queries for entities with ', h('code', null, '[Avatar, Premium, Online]'), ' and updates the style. The rest of the codebase doesn’t know or care. You don’t perform surgery on old code; you simply ', h('strong', null, 'compose'), ' a new behavior.'),

            h('hr', { style: 'border: 0; border-top: 1px solid var(--color-border); margin: 2rem 0;' }),

            h('h2', { style: 'font-size: 1.8rem; margin-bottom: 1rem; color: var(--color-primary);' }, 'Real‑Time Sync That Doesn’t Bleed Your Budget'),
            h('p', { style: 'margin-bottom: 1rem;' }, 'If you’ve ever run a popular real‑time app, you know the dirty secret: ', h('strong', null, 'it’s expensive.'), ' Egress, CPU, and memory add up.'),
            h('p', { style: 'margin-bottom: 1rem;' }, 'Most stacks start by sending full JSON snapshots over WebSockets. TX‑2 is opinionated about making sure you don’t stay there. Because the framework understands exactly which component fields have changed, it ships ', h('strong', null, 'Deltas'), ', not snapshots.'),
            h('ul', { style: 'margin-bottom: 2rem; padding-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;' },
              h('li', null, h('strong', null, 'Naive Approach:'), ' Sending a 4KB user state snapshot @ 20 ticks/sec = ', h('strong', null, '80KB/sec per user.')),
              h('li', null, h('strong', null, 'TX-2 Approach:'), ' Sending a 200-byte delta (only what changed) @ 20 ticks/sec = ', h('strong', null, '4KB/sec per user.')),
              h('li', { style: 'margin-top: 0.5rem; color: var(--color-primary);' }, 'That is a 20x reduction in bandwidth.')
            ),

            h('hr', { style: 'border: 0; border-top: 1px solid var(--color-border); margin: 2rem 0;' }),

            h('h2', { style: 'font-size: 1.8rem; margin-bottom: 1rem; color: var(--color-primary);' }, 'Security That Isn\'t an Afterthought'),
            h('p', { style: 'margin-bottom: 1rem;' }, 'In most real-time frameworks, security is the tax you pay at the end of the project. You manually sanitize inputs, patch prototype pollution holes, and wrap every WebSocket handler in try/catch blocks.'),
            h('p', { style: 'margin-bottom: 1rem;' }, 'In TX-2, security is the pavement you walk on.'),
            h('ul', { style: 'margin-bottom: 2rem; padding-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;' },
              h('li', null, h('strong', null, 'XSS Neutralized:'), ' The Server-Side Renderer (SSR) automatically sanitizes attributes and strips dangerous event handlers before HTML ever hits the client.'),
              h('li', null, h('strong', null, 'No Prototype Pollution:'), ' The state deserializer explicitly blocks dangerous keys (__proto__, constructor), closing the most common vector for attacking state synchronization.'),
              h('li', null, h('strong', null, 'Gated RPCs:'), ' The Remote Procedure Call system includes declarative Rate Limiting and Authorization checks.')
            ),

            h('hr', { style: 'border: 0; border-top: 1px solid var(--color-border); margin: 2rem 0;' }),

            h('h2', { style: 'font-size: 1.8rem; margin-bottom: 1rem; color: var(--color-primary);' }, 'Developer Experience That Ages Well'),
            h('p', { style: 'margin-bottom: 2rem;' }, 'The true test of a framework is not how pleasant it feels in the honeymoon phase. It’s how it behaves when the codebase has grown and the team has rotated. Onboarding new developers to TX-2 is radically simpler. The boundaries are clear because the architecture forces them to be.'),

            h('div', { class: 'hud', style: 'margin-top: 3rem;' },
              h('div', { class: 'corners' }),
              h('h3', { style: 'font-size: 1.4rem; margin-bottom: 1rem;' }, 'Web Architecture, Corrected.'),
              h('p', { style: 'margin-bottom: 1rem;' }, 'TX‑2 ECS is not a silver bullet. But if you are building applications that look like living systems—multiplayer tools, simulations, real‑time dashboards, collaborative editors—the traditional web stack makes you pay a tax in complexity.'),
              h('p', { style: 'margin-bottom: 1.5rem;' }, 'By centering an ECS world, unifying state across server and client, and baking in efficient sync, TX‑2 offers an alternative. It treats your application like a world, not a collection of disconnected widgets.'),
              h('div', { class: 'code', style: 'text-align: center; padding: 1rem;' }, 'npm install tx2-ecs')
            )
          )
        )
          :
          h('section', { class: 'hero', id: 'hero' },
            h('div', { class: 'hero-grid' },
              h('div', null,
                h('div', { class: 'tagline' }, 'One world, many views.'),
                h('h1', null, 'BUILD ONCE, RUN EVERYWHERE.'),
                h('p', null, 'TX-2 is a complete ecosystem for building applications where the same Entity-Component-System world runs everywhere - web, native, CLI - with automatic synchronization, persistence, and time-travel debugging.'),
                h('div', { class: 'cta-row' },
                  h('a', { href: '#stack', class: 'btn primary' }, 'Explore the Stack'),
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

        !isActive('/manifesto') ? h('section', { class: 'hud', id: 'why' },
          h('div', { class: 'corners' }),
          h('div', { class: 'label' }, 'WHY TX-2'),
          h('div', { class: 'feature-grid' },
            h('div', { class: 'feature-card' },
              h('h3', null, 'World-First Design'),
              h('p', null, 'The ECS world is the source of truth. Everything else (databases, files, UI state) is derived. No ORM, no separate state, no impedance mismatch.')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'Isomorphic State'),
              h('p', null, 'The same component definitions work in Rust and TypeScript. tx2-link handles the synchronization.')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'Pure ECS'),
              h('p', null, 'Components are data, systems are logic, strictly separated. No component methods, no inheritance, no hidden state.')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'Deterministic Simulation'),
              h('p', null, 'Systems execute in defined order with fixed timestep. Reproducible, replayable, and testable.')
            )
          )
        ) : null,

        !isActive('/manifesto') ? h('section', { class: 'hud', id: 'stack' },
          h('div', { class: 'corners' }),
          h('div', { class: 'label' }, 'THE STACK'),
          h('div', { class: 'feature-grid' },
            h('div', { class: 'feature-card' },
              h('h3', null, '1. tx2-ecs (TypeScript/Node)'),
              h('p', null, 'The web runtime with reactive rendering, SSR, DOM rendering, and network sync with delta compression.'),
              h('a', { href: 'https://github.com/IreGaddr/tx2-ecs', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'Repo')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, '2. tx2-core (Rust)'),
              h('p', null, 'The native engine for desktop/high-perf apps. Type-safe ECS, wgpu rendering, cross-platform windowing.'),
              h('a', { href: 'https://github.com/IreGaddr/tx2-core', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'Repo')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, '3. tx2-link (Rust)'),
              h('p', null, 'Bridge protocol for syncing worlds. Field-level delta compression (1171x), rate limiting, multiple formats.'),
              h('a', { href: 'https://github.com/IreGaddr/tx2-link', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'Repo')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, '4. tx2-pack (Rust)'),
              h('p', null, 'Binary world snapshot format for persistence and time-travel. Compression, encryption, checkpoints.'),
              h('a', { href: 'https://github.com/IreGaddr/tx2-pack', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'Repo')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, '5. tx2-query (Rust)'),
              h('p', null, 'SQL analytics layer. One-way ECS -> SQL sync, auto schema generation, PostgreSQL/SQLite backends.'),
              h('a', { href: 'https://github.com/IreGaddr/tx2-query', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'Repo')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, '6. tx2-cli (Rust)'),
              h('p', null, 'CLI for inspecting, debugging, and managing apps. Snapshot management, SQL analytics, TUI mode.'),
              h('a', { href: 'https://github.com/IreGaddr/tx2-cli', class: 'btn ghost', style: 'margin-top:0.75rem; display:inline-flex;' }, 'Repo')
            )
          )
        ) : null,

        !isActive('/manifesto') ? h('section', { class: 'hud', id: 'architecture' },
          h('div', { class: 'corners' }),
          h('div', { class: 'label' }, 'HOW IT ALL FITS TOGETHER'),
          h('div', { class: 'docs-grid' },
            h('div', { class: 'docs-item' },
              h('h4', null, '1. Server ↔ Browser'),
              h('p', null, 'tx2-core (Rust server) ↔ tx2-ecs (browser). Via tx2-link over WebSocket. Delta compressed updates.')
            ),
            h('div', { class: 'docs-item' },
              h('h4', null, '2. Native ↔ Webview'),
              h('p', null, 'tx2-core (Rust) ↔ tx2-ecs (embedded webview). Via tx2-link over IPC. For hybrid desktop apps.')
            ),
            h('div', { class: 'docs-item' },
              h('h4', null, '3. Process ↔ CLI'),
              h('p', null, 'tx2-core (server) ↔ CLI tools. Via tx2-link over stdio pipes. For debugging and scripting.')
            ),
            h('div', { class: 'docs-item' },
              h('h4', null, '4. Persistence'),
              h('p', null, 'Any runtime → tx2-pack. Save/load checkpoints. Time-travel replay.')
            ),
            h('div', { class: 'docs-item' },
              h('h4', null, '5. Analytics'),
              h('p', null, 'tx2-core → tx2-query → SQL databases. One-way ECS synchronization. BI tools and dashboards.')
            )
          )
        ) : null,

        !isActive('/manifesto') ? h('section', { class: 'hud', id: 'use-cases' },
          h('div', { class: 'corners' }),
          h('div', { class: 'label' }, 'USE CASES'),
          h('div', { class: 'feature-grid' },
            h('div', { class: 'feature-card' },
              h('h3', null, 'Multiplayer Games'),
              h('p', null, 'Authoritative server (tx2-core), client prediction, admin dashboard (tx2-ecs), and analytics (tx2-query).')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'Agent IDEs'),
              h('p', null, 'Agent execution environment, code editor UI, time-travel debugging, and session persistence.')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'Collaborative Apps'),
              h('p', null, 'Real-time sync, offline support, conflict resolution, and version history with undo/redo.')
            ),
            h('div', { class: 'feature-card' },
              h('h3', null, 'Simulations'),
              h('p', null, 'High-performance simulation, 3D/Web visualization, replay, and data export.')
            )
          )
        ) : null,

        !isActive('/manifesto') ? h('section', { class: 'hud', id: 'examples' },
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
        ) : null
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

  const allowedPaths = new Set(['/', '/docs', '/examples', '/manifesto']);
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
