import { Application, Container, Graphics, Sprite, Text } from 'pixi.js';

(async () => {
  const app = new Application();
  await app.init({ background: '#14100c', resizeTo: window, antialias: true });
  document.body.appendChild(app.canvas);

  const R = 32; // radio del hexágono (igual para todos los tipos)
  const HEX_W = R * 2;
  const HEX_H = Math.sqrt(3) * R;

  const hexPoints = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    hexPoints.push(R * Math.cos(a), R * Math.sin(a));
  }

  const makeTexture = (draw) => {
    const g = new Graphics();
    draw(g);
    const tex = app.renderer.generateTexture({ target: g, resolution: 2 });
    g.destroy();
    return tex;
  };

  const baseHex = (g, color) => {
    g.poly(hexPoints).fill(color).stroke({ width: 2, color: 0x000000 });
  };

  // Se dibujan UNA sola vez; luego todo son sprites
  const textures = {
    ground: makeTexture((g) => baseHex(g, 0x3a2c22)),

    water: makeTexture((g) => {
      baseHex(g, 0x1f5fbf);
      g.poly([-9, 2, 9, 2, 0, -16]).fill(0x9be7ff);
      g.circle(0, 6, 10).fill(0x9be7ff);
    }),

    titanium: makeTexture((g) => {
      baseHex(g, 0x7a4a2a);
      g.poly([-14, 8, -8, -8, 2, -12, 4, 8]).fill(0x6b3fa0); // roca morada
      g.poly([2, -12, 14, -2, 12, 10, 4, 8]).fill(0x111111); // cara negra
      g.poly([-8, -8, 2, -12, -2, -4]).fill(0xc0c4cc); // brillo plateado
    }),
  };

  // Mundo (la cámara mueve este contenedor)
  const world = new Container();
  app.stage.addChild(world);

  const COLS = 100;
  const ROWS = 70;
  const map = [];

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const r = Math.random();
      const type = r < 0.07 ? 'water' : r < 0.13 ? 'titanium' : 'ground';

      const s = new Sprite(textures[type]);
      s.anchor.set(0.5);
      s.x = col * R * 1.5;
      s.y = row * HEX_H + (col % 2 ? HEX_H / 2 : 0);
      world.addChild(s);
      map.push({ col, row, type, sprite: s });
    }
  }

  // Cámara: arrastrar para mover, rueda para zoom
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  let dragging = false;
  let last = { x: 0, y: 0 };

  app.stage.on('pointerdown', (e) => {
    dragging = true;
    last = { x: e.global.x, y: e.global.y };
  });
  app.stage.on('pointerup', () => (dragging = false));
  app.stage.on('pointerupoutside', () => (dragging = false));
  app.stage.on('pointermove', (e) => {
    if (!dragging) return;
    world.x += e.global.x - last.x;
    world.y += e.global.y - last.y;
    last = { x: e.global.x, y: e.global.y };
  });

  app.canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newScale = Math.min(3, Math.max(0.2, world.scale.x * factor));
      const k = newScale / world.scale.x;
      // zoom centrado en el cursor
      world.x = e.clientX - (e.clientX - world.x) * k;
      world.y = e.clientY - (e.clientY - world.y) * k;
      world.scale.set(newScale);
    },
    { passive: false }
  );

  // Contador de FPS
  const fps = new Text({
    text: '',
    style: { fill: 0xffffff, fontSize: 16, fontFamily: 'monospace' },
  });
  fps.position.set(10, 10);
  app.stage.addChild(fps);

  app.ticker.add(() => {
    fps.text = `FPS: ${Math.round(app.ticker.FPS)}  |  tiles: ${map.length}`;
  });
})();