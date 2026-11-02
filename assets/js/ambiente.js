/* La sala nautica intorno al libro: tavolo da carteggio su schermo, stanza con oblò e leggio nel visore.
   Tutto dipinto su tela o con la luce cotta nei vertici: niente luci in scena. Regole in design.md */
window.Ambiente = (function () {
  const { tela, cuoci } = Tavola;
  const LEGNO = { teak: ['#6B4226', '#7A4E2D', '#5E3920'], chiaro: ['#A9763F', '#B5854E', '#9C6B38'], scuro: ['#3D2616', '#472D1B', '#33200F'] };

  // Numeri pseudo-casuali ripetibili: il legno è uguale a ogni apertura
  function dado(seme) { let s = seme; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  function assi(c, x, y, w, h, n, tinte, seme, verticali) {
    const r = dado(seme); const passo = (verticali ? w : h) / n;
    for (let i = 0; i < n; i++) {
      const a = verticali ? x + i * passo : x; const b = verticali ? y : y + i * passo;
      const lw = verticali ? passo : w; const lh = verticali ? h : passo;
      c.fillStyle = tinte[Math.floor(r() * tinte.length)]; c.fillRect(a, b, lw, lh);
      // Venature
      c.strokeStyle = 'rgba(30,15,5,0.16)'; c.lineWidth = 1;
      for (let k = 0; k < 7; k++) {
        const t = r(); c.beginPath();
        if (verticali) { const q = a + t * lw; c.moveTo(q, b); c.bezierCurveTo(q + 5, b + lh * 0.3, q - 5, b + lh * 0.7, q + r() * 4, b + lh); } else { const q = b + t * lh; c.moveTo(a, q); c.bezierCurveTo(a + lw * 0.3, q + 5, a + lw * 0.7, q - 5, a + lw, q + r() * 4); }
        c.stroke();
      }
      // Giunto tra le assi
      c.fillStyle = 'rgba(15,8,3,0.65)';
      if (verticali) c.fillRect(a, b, 2, lh); else c.fillRect(a, b, lw, 2);
    }
  }

  function rosa(c, x, y, r, col) {
    c.save(); c.translate(x, y); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2;
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(0, 0, r * 0.92, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 8; i++) {
      c.save(); c.rotate((i * Math.PI) / 4); const l = i % 2 ? r * 0.55 : r * 0.88;
      c.beginPath(); c.moveTo(0, -l); c.lineTo(r * 0.09, 0); c.lineTo(0, 0); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(0, -l); c.lineTo(-r * 0.09, 0); c.lineTo(0, 0); c.closePath(); c.stroke();
      c.restore();
    }
    c.restore();
  }

  // Carta nautica senza dati: serve solo come arredo
  function carta(c, x, y, w, h) {
    c.fillStyle = '#E8DDBF'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#6E8CA6'; c.lineWidth = 3; c.strokeRect(x + 14, y + 14, w - 28, h - 28);
    c.lineWidth = 1; c.strokeStyle = 'rgba(70,110,145,0.4)';
    for (let i = 1; i < 10; i++) { c.beginPath(); c.moveTo(x + (i * w) / 10, y + 14); c.lineTo(x + (i * w) / 10, y + h - 14); c.stroke(); }
    for (let i = 1; i < 7; i++) { c.beginPath(); c.moveTo(x + 14, y + (i * h) / 7); c.lineTo(x + w - 14, y + (i * h) / 7); c.stroke(); }
    const r = dado(77);
    c.fillStyle = '#CDBB8E'; c.strokeStyle = '#8A7446'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + 14, y + h * 0.22);
    for (let i = 1; i <= 12; i++) c.lineTo(x + 14 + (i / 12) * w * 0.42, y + h * 0.2 - r() * h * 0.08 + (i / 12) * (i / 12) * h * 0.12 - h * 0.05);
    c.lineTo(x + w * 0.42, y + 14); c.lineTo(x + 14, y + 14); c.closePath(); c.fill(); c.stroke();
    rosa(c, x + w * 0.74, y + h * 0.68, Math.min(w, h) * 0.17, '#7A5A2C');
    c.strokeStyle = 'rgba(122,90,44,0.35)'; c.lineWidth = 1;
    for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8; c.beginPath(); c.moveTo(x + w * 0.74, y + h * 0.68); c.lineTo(x + w * 0.74 + Math.cos(a) * w * 0.8, y + h * 0.68 + Math.sin(a) * w * 0.8); c.stroke(); }
    c.strokeStyle = '#6E8CA6'; c.lineWidth = 3; c.strokeRect(x + 14, y + 14, w - 28, h - 28);
  }

  // Compasso da carteggio visto dall'alto
  function compasso(c, x, y, ang, l) {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 10; c.shadowOffsetX = 4; c.shadowOffsetY = 5;
    c.strokeStyle = '#C9A227'; c.lineCap = 'round';
    [-0.13, 0.13].forEach((a) => { c.save(); c.rotate(a); c.lineWidth = 12; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, l * 0.8); c.stroke(); c.strokeStyle = '#C9CCD0'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, l * 0.8); c.lineTo(0, l); c.stroke(); c.restore(); });
    c.fillStyle = '#D9B765'; c.beginPath(); c.arc(0, 0, 17, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  /* Piano del tavolo, su schermo */
  function tavolo() {
    const LATO = 3.4; const S = 2048; const m = S / LATO; const cx = S / 2; const cy = S / 2;
    const tex = tela(S, S, (c) => {
      assi(c, 0, 0, S, S, 9, LEGNO.teak, 11, false);
      c.save(); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 24; c.shadowOffsetY = 8;
      carta(c, cx - 0.98 * m, cy - 0.62 * m, 1.96 * m, 1.24 * m);
      c.restore();
      rosa(c, cx - 0.72 * m, cy - 0.47 * m, 0.1 * m, '#7A5A2C');
      compasso(c, cx + 0.3 * m, cy - 0.53 * m, 1.9, 0.2 * m);
      // Riga parallela, in ottone e legno
      c.save(); c.translate(cx + 0.72 * m, cy + 0.04 * m); c.rotate(0.08);
      c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 10; c.shadowOffsetX = 4; c.shadowOffsetY = 5;
      c.fillStyle = '#4A2C18'; c.fillRect(-0.03 * m, -0.34 * m, 0.04 * m, 0.68 * m);
      c.fillStyle = '#C9A227'; c.fillRect(0.024 * m, -0.34 * m, 0.012 * m, 0.68 * m);
      c.restore();
      // La luce della lampada cade sul libro
      const g = c.createRadialGradient(cx, cy, 0.5 * m, cx, cy, 1.5 * m);
      g.addColorStop(0, 'rgba(10,5,0,0)'); g.addColorStop(1, 'rgba(10,5,0,0.72)');
      c.fillStyle = g; c.fillRect(0, 0, S, S);
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(LATO, LATO), new THREE.MeshBasicMaterial({ map: tex }));
  }

  const parete = () => {
    const tex = tela(1024, 512, (c) => {
      c.fillStyle = '#E6DCC4'; c.fillRect(0, 0, 1024, 512);
      const r = dado(5); c.strokeStyle = 'rgba(120,100,70,0.12)'; c.lineWidth = 2;
      for (let i = 0; i < 16; i++) { const x = (i * 1024) / 16; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 300); c.stroke(); }
      assi(c, 0, 300, 1024, 212, 8, LEGNO.teak, 21, true);
      c.fillStyle = 'rgba(30,15,5,0.05)'; for (let i = 0; i < 50; i++) c.fillRect(r() * 1024, r() * 300, 2, 2);
      c.fillStyle = '#C9A227'; c.fillRect(0, 292, 1024, 10);
      c.fillStyle = '#7A5A2C'; c.fillRect(0, 300, 1024, 3);
      const g = c.createLinearGradient(0, 0, 0, 80); g.addColorStop(0, 'rgba(60,40,20,0.3)'); g.addColorStop(1, 'rgba(60,40,20,0)');
      c.fillStyle = g; c.fillRect(0, 0, 1024, 80);
    });
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  };

  function piano(w, h, map, x, y, z, ry, rx) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map }));
    m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0, 'YXZ');
    return m;
  }

  /* Stanza intorno allo studente, nel visore */
  function stanza() {
    const g = new THREE.Group(); const X = 3.2; const ZF = -3.4; const ZB = 3.2; const H = 2.6;
    const lz = ZB - ZF; const zc = (ZB + ZF) / 2;

    const pav = tela(1024, 1024, (c) => {
      assi(c, 0, 0, 1024, 1024, 14, LEGNO.chiaro, 31, true);
      const v = c.createRadialGradient(512, 512, 120, 512, 512, 720);
      v.addColorStop(0, 'rgba(255,225,170,0.12)'); v.addColorStop(1, 'rgba(25,12,3,0.55)');
      c.fillStyle = v; c.fillRect(0, 0, 1024, 1024);
    });
    g.add(piano(2 * X, lz, pav, 0, 0, zc, 0, -Math.PI / 2));

    const muro = (rep) => { const t = parete(); t.repeat.x = rep; return t; };
    g.add(piano(2 * X, H, muro(1.5), 0, H / 2, ZF, 0));
    g.add(piano(2 * X, H, muro(1.5), 0, H / 2, ZB, Math.PI));
    g.add(piano(lz, H, muro(1.6), -X, H / 2, zc, Math.PI / 2));
    g.add(piano(lz, H, muro(1.6), X, H / 2, zc, -Math.PI / 2));

    const cie = tela(512, 512, (c) => {
      c.fillStyle = '#EFE8D6'; c.fillRect(0, 0, 512, 512);
      const v = c.createRadialGradient(256, 256, 30, 256, 256, 360);
      v.addColorStop(0, 'rgba(255,235,190,0.8)'); v.addColorStop(1, 'rgba(90,70,45,0.45)');
      c.fillStyle = v; c.fillRect(0, 0, 512, 512);
    });
    g.add(piano(2 * X, lz, cie, 0, H, zc, 0, Math.PI / 2));

    // Bagli del soffitto
    const trave = cuoci(new THREE.BoxGeometry(2 * X, 0.16, 0.16), '#5E3920');
    const bagli = new THREE.InstancedMesh(trave, new THREE.MeshBasicMaterial({ vertexColors: true }), 5);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 5; i++) { m4.makeTranslation(0, H - 0.08, ZF + 0.6 + i * 1.4); bagli.setMatrixAt(i, m4); }
    g.add(bagli);

    // Oblò: il mare e il cielo fuori, con la cornice d'ottone
    const fuori = tela(512, 512, (c) => {
      const s = c.createLinearGradient(0, 0, 0, 270); s.addColorStop(0, '#7FB7D9'); s.addColorStop(1, '#E4EFEF');
      c.fillStyle = s; c.fillRect(0, 0, 512, 270);
      c.fillStyle = 'rgba(255,255,255,0.85)';
      [[120, 90, 70], [190, 100, 50], [360, 60, 60], [420, 75, 45]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x, y, r, r * 0.34, 0, 0, Math.PI * 2); c.fill(); });
      const a = c.createLinearGradient(0, 270, 0, 512); a.addColorStop(0, '#3B86A8'); a.addColorStop(1, '#1C5273');
      c.fillStyle = a; c.fillRect(0, 270, 512, 242);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; const r = dado(41);
      for (let i = 0; i < 46; i++) { const y = 280 + r() * 226; const x = r() * 512; const l = 14 + ((y - 270) / 242) * 46; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 4, x + l, y); c.stroke(); }
    });
    const ottone = new THREE.MeshBasicMaterial({ vertexColors: true });
    const anello = cuoci(new THREE.TorusGeometry(0.37, 0.055, 12, 40), '#C9A227');
    function oblo(x, y, z, ry) {
      const o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = ry;
      o.add(new THREE.Mesh(new THREE.CircleGeometry(0.36, 40), new THREE.MeshBasicMaterial({ map: fuori })));
      const a = new THREE.Mesh(anello, ottone); a.position.z = 0.02; o.add(a);
      g.add(o);
    }
    oblo(-1.9, 1.62, ZF + 0.01, 0); oblo(1.9, 1.62, ZF + 0.01, 0);
    oblo(-X + 0.01, 1.62, 0.9, Math.PI / 2); oblo(X - 0.01, 1.62, 0.9, -Math.PI / 2);

    // Carta nautica incorniciata
    const quadro = tela(1024, 720, (c) => { c.fillStyle = '#3D2616'; c.fillRect(0, 0, 1024, 720); carta(c, 26, 26, 972, 668); });
    g.add(piano(1.5, 1.05, quadro, -X + 0.012, 1.58, -1.6, Math.PI / 2));

    // Salvagente
    const sal = new THREE.Mesh(cuoci(new THREE.TorusGeometry(0.28, 0.085, 12, 32), (x, y) => (x * y > 0 ? '#D0492F' : '#F4EFE3')), new THREE.MeshBasicMaterial({ vertexColors: true }));
    sal.position.set(X - 0.1, 1.5, -2.1); sal.rotation.y = -Math.PI / 2; g.add(sal);

    // Ruota del timone
    const ruota = new THREE.Group(); const legnoRuota = cuoci(new THREE.TorusGeometry(0.42, 0.04, 10, 40), '#7A4E2D');
    ruota.add(new THREE.Mesh(legnoRuota, new THREE.MeshBasicMaterial({ vertexColors: true })));
    const raggio = cuoci(new THREE.CylinderGeometry(0.018, 0.018, 0.84, 6), '#7A4E2D');
    for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(raggio, new THREE.MeshBasicMaterial({ vertexColors: true })); r.rotation.z = (i * Math.PI) / 4; ruota.add(r); }
    const mozzo = new THREE.Mesh(cuoci(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), '#C9A227'), ottone); mozzo.rotation.x = Math.PI / 2; ruota.add(mozzo);
    ruota.position.set(X - 0.1, 1.5, -0.7); ruota.rotation.y = -Math.PI / 2; g.add(ruota);

    // Orologio di bordo
    const quadrante = tela(256, 256, (c) => {
      c.fillStyle = '#F4EFE3'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#22222A'; c.fillStyle = '#22222A';
      for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; c.lineWidth = i % 3 ? 3 : 7; c.beginPath(); c.moveTo(128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); c.lineTo(128 + Math.sin(a) * 114, 128 - Math.cos(a) * 114); c.stroke(); }
      c.lineWidth = 7; c.beginPath(); c.moveTo(128, 128); c.lineTo(84, 86); c.stroke();
      c.lineWidth = 4; c.beginPath(); c.moveTo(128, 128); c.lineTo(182, 96); c.stroke();
    });
    const orologio = new THREE.Group();
    orologio.add(new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), new THREE.MeshBasicMaterial({ map: quadrante })));
    const ghiera = new THREE.Mesh(cuoci(new THREE.TorusGeometry(0.18, 0.025, 10, 32), '#C9A227'), ottone); orologio.add(ghiera);
    orologio.position.set(0, 2.05, ZB - 0.01); orologio.rotation.y = Math.PI; g.add(orologio);

    // Stemma del docente, sulla parete dietro
    const targa = tela(512, 512, (c) => {
      c.fillStyle = '#3D2616'; c.fillRect(0, 0, 512, 512);
      c.strokeStyle = '#C9A227'; c.lineWidth = 10; c.strokeRect(14, 14, 484, 484);
      c.drawImage(Stemma.img, 36, 36, 440, 440);
    });
    g.add(piano(0.8, 0.8, targa, -1.3, 1.5, ZB - 0.012, Math.PI));

    // Porta
    const porta = tela(512, 1024, (c) => {
      assi(c, 0, 0, 512, 1024, 5, LEGNO.scuro, 51, true);
      c.strokeStyle = '#C9A227'; c.lineWidth = 8; c.strokeRect(10, 10, 492, 1004);
      c.fillStyle = '#C9A227'; c.beginPath(); c.arc(440, 540, 22, 0, Math.PI * 2); c.fill();
    });
    g.add(piano(0.95, 2.05, porta, 1.5, 1.03, ZB - 0.012, Math.PI));

    // Lampada
    const lampada = new THREE.Group(); lampada.position.set(0, H, -1.5);
    lampada.add(new THREE.Mesh(cuoci(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6), '#7A5A2C'), ottone));
    lampada.children[0].position.y = -0.21;
    const cappello = new THREE.Mesh(cuoci(new THREE.CylinderGeometry(0.06, 0.2, 0.14, 20, 1, true), '#C9A227'), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    cappello.position.y = -0.48; lampada.add(cappello);
    const vetro = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), new THREE.MeshBasicMaterial({ color: 0xFFF1C9 })); vetro.position.y = -0.53; lampada.add(vetro);
    const alone = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tela(128, 128, (c) => { const a = c.createRadialGradient(64, 64, 4, 64, 64, 64); a.addColorStop(0, 'rgba(255,225,160,0.75)'); a.addColorStop(1, 'rgba(255,225,160,0)'); c.fillStyle = a; c.fillRect(0, 0, 128, 128); }),
      transparent: true, depthWrite: false,
    }));
    alone.scale.setScalar(0.9); alone.position.y = -0.53; lampada.add(alone);
    g.add(lampada);
    return g;
  }

  /* Sostegni del libro nel visore. Il libro sta in basso: poggia su un piano inclinato (tavola e zeppe)
     sopra un tavolo vero. A grandezza vera il tavolo sparisce e resta una colonna */
  function leggio() {
    const legno = tela(512, 384, (c) => {
      assi(c, 0, 0, 512, 384, 5, LEGNO.teak, 61, false);
      c.strokeStyle = '#C9A227'; c.lineWidth = 8; c.strokeRect(6, 6, 500, 372);
    });
    const piatto = new THREE.MeshBasicMaterial({ color: '#5E3920', side: THREE.DoubleSide });
    const tavola = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.92, 0.03), [piatto, piatto, piatto, piatto, new THREE.MeshBasicMaterial({ map: legno }), piatto]);
    tavola.position.z = -0.052;

    // Fianchi e schiena del piano inclinato, in coordinate del libro
    const zeppe = new THREE.Group();
    const Y = 0.46; const Zp = -0.067; const B = [0.15, -0.49];
    [-0.62, 0.62].forEach((x) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([x, -Y, Zp, x, Y, Zp, x, B[0], B[1]], 3));
      zeppe.add(new THREE.Mesh(geo, piatto));
    });
    const schiena = new THREE.BufferGeometry();
    schiena.setAttribute('position', new THREE.Float32BufferAttribute([-0.62, Y, Zp, 0.62, Y, Zp, 0.62, B[0], B[1], -0.62, B[0], B[1]], 3));
    schiena.setIndex([0, 1, 2, 0, 2, 3]);
    zeppe.add(new THREE.Mesh(schiena, piatto));

    // Tavolo da carteggio: alto 1 prima di scalarlo sull'altezza di chi guarda
    const banco = new THREE.Group();
    const piano3 = tela(1024, 680, (c) => {
      assi(c, 0, 0, 1024, 680, 7, LEGNO.teak, 71, false);
      c.save(); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 14; c.shadowOffsetY = 5; carta(c, 700, 90, 280, 200); c.restore();
      compasso(c, 120, 90, 2.2, 150);
    });
    const fianco = new THREE.MeshBasicMaterial({ color: '#4A2C18' });
    const ripiano = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 1.2), [fianco, fianco, new THREE.MeshBasicMaterial({ map: piano3 }), fianco, fianco, fianco]);
    ripiano.position.y = 0.975; banco.add(ripiano);
    const gamba = cuoci(new THREE.BoxGeometry(0.09, 0.95, 0.09), '#5E3920'); const matGamba = new THREE.MeshBasicMaterial({ vertexColors: true });
    [[-0.8, -0.5], [0.8, -0.5], [-0.8, 0.5], [0.8, 0.5]].forEach(([x, z]) => { const m = new THREE.Mesh(gamba, matGamba); m.position.set(x, 0.475, z); banco.add(m); });

    const colonna = new THREE.Group();
    const fusto = new THREE.Mesh(cuoci(new THREE.CylinderGeometry(0.07, 0.1, 1, 16), '#6B4226'), matGamba);
    fusto.position.y = 0.5; colonna.add(fusto);

    // Fascio di luce: la simulazione si alza dalla pagina
    const fascio = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.16, 1, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xE3C878, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide }));
    return { tavola, zeppe, banco, colonna, fascio };
  }

  return { tavolo, stanza, leggio };
})();
