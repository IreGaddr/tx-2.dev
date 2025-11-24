import { Component, World } from 'tx2-ecs';
import { hydrateWorld } from 'tx2-ecs/shared';
import { createRenderSystem } from 'tx2-ecs/client';

function bootConsoleMessage() {
  console.log('TX-2 Client Starting...');
  console.log('%c TX-2 SYSTEM ONLINE ', 'background: #39ff14; color: #000; padding: 4px; font-weight: bold; letter-spacing: 1px;');
}

class HudCounter extends Component {
  static readonly componentId = 'HudCounter' as any;
  static readonly componentName = 'HudCounter';
  count = this.defineReactive('count', 0);

  constructor(data?: { count?: number }) {
    super();
    if (data?.count != null) {
      this.count.set(data.count);
    }
  }

  clone() {
    return new HudCounter({ count: this.count.peek() }) as this;
  }
}

function startHudWidget() {
  const hydrationEl = document.getElementById('hud-hydration');
  const fpsEl = document.getElementById('hud-fps');
  const widgetEl = document.getElementById('hud-widget');

  if (hydrationEl) hydrationEl.textContent = 'Online';

  if (widgetEl) {
    widgetEl.textContent = '';

    // Create a tiny TX-2 world with a counter component
    const demoWorld = new World();
    const demoEntity = demoWorld.createEntity();
    const counterComponent = new HudCounter({ count: 0 });
    demoWorld.addComponent(demoEntity.id, counterComponent);

    const panel = document.createElement('div');
    panel.style.display = 'grid';
    panel.style.gridTemplateColumns = '1fr 1fr';
    panel.style.gap = '0.75rem';
    panel.style.width = '100%';

    const left = document.createElement('div');
    const right = document.createElement('div');
    left.style.display = 'grid';
    left.style.gap = '0.5rem';
    right.style.display = 'grid';
    right.style.gap = '0.5rem';

    const counterLabel = document.createElement('div');
    counterLabel.textContent = 'Signal Demo // Counter';
    counterLabel.style.fontFamily = 'var(--font-mono)';
    counterLabel.style.color = '#39ff14';

    const counterValue = document.createElement('div');
    counterValue.style.fontFamily = 'var(--font-mono)';
    counterValue.style.fontSize = '1.5rem';
    counterValue.textContent = '0';

    const incBtn = document.createElement('button');
    incBtn.textContent = '+ TICK';
    incBtn.className = 'btn primary';
    const decBtn = document.createElement('button');
    decBtn.textContent = '- TICK';
    decBtn.className = 'btn ghost';

    incBtn.style.width = '100%';
    decBtn.style.width = '100%';

    const canvas = document.createElement('canvas');
    canvas.height = 200;
    canvas.style.width = '100%';
    canvas.style.border = '1px solid var(--color-border)';
    canvas.style.background = '#070909';

    left.appendChild(counterLabel);
    left.appendChild(counterValue);
    left.appendChild(incBtn);
    left.appendChild(decBtn);

    right.appendChild(canvas);

    panel.appendChild(left);
    panel.appendChild(right);
    widgetEl.appendChild(panel);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const w = widgetEl.clientWidth / 2 - 12; // half grid minus gap
      const h = 200;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    counterValue.textContent = `${counterComponent.count.get()}`;

    const updateCount = (delta: number) => {
      const next = Math.max(0, counterComponent.count.get() + delta);
      counterComponent.count.set(next);
      counterValue.textContent = `${next}`;
    };

    incBtn.onclick = () => updateCount(1);
    decBtn.onclick = () => updateCount(-1);

    // particles influenced by count
    const particles = Array.from({ length: 48 }).map(() => ({
      x: Math.random() * (canvas.clientWidth || 200),
      y: Math.random() * 200,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6
    }));

    const renderFrame = () => {
      const w = canvas.clientWidth || 200;
      const h = 200;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#070909';
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        // add some energy from count
        const jitter = Math.min(6, counterComponent.count.get() * 0.05);
        p.vx += (Math.random() - 0.5) * 0.02 * jitter;
        p.vy += (Math.random() - 0.5) * 0.02 * jitter;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }

      ctx.fillStyle = '#39ff14';
      ctx.strokeStyle = 'rgba(57,255,20,0.18)';
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 90) {
            const alpha = 1 - dist / 90;
            ctx.strokeStyle = `rgba(57,255,20,${alpha * 0.35})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(renderFrame);
    };

    renderFrame();
  }

  if (fpsEl) {
    let last = performance.now();
    let frames = 0;
    let fps = 0;
    const loop = () => {
      const now = performance.now();
      frames++;
      if (now - last >= 1000) {
        fps = Math.round((frames * 1000) / (now - last));
        frames = 0;
        last = now;
        fpsEl.textContent = `${fps} fps`;
      }
      requestAnimationFrame(loop);
    };
    loop();
  }
}

async function initClient() {
  bootConsoleMessage();

  const world = new World();

  const renderSystem = createRenderSystem(document.getElementById('app')!);
  world.addSystem(renderSystem);

  await hydrateWorld(world, {
    root: document.getElementById('app')!,
    clearMarkers: true,
    onHydrated: (hydratedWorld) => {
      console.log('TX-2 website hydrated successfully!');
    }
  });

  await world.init();
  world.start();

  startHudWidget();

  const scrollToAnchor = () => {
    const targetId =
      location.hash.replace('#', '') ||
      (location.pathname === '/docs' ? 'docs-content' : location.pathname === '/examples' ? 'examples' : '');
    if (targetId) {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  scrollToAnchor();

  if (!location.hash) {
    window.addEventListener('hashchange', scrollToAnchor);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClient);
} else {
  initClient();
}
