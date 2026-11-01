/* Scafo comune a più lezioni: forma schematica lunga 90 m, insellatura dalla lezione 4.
   B è solo grafico: non è mai un dato delle lezioni */
window.Scafo = (function () {
  const { tratto, segmento, cuoci } = Tavola;
  const L = 90; const B = 15; const PONTE = 7.2;
  const insellatura = (u) => PONTE + (u < 0.5 ? (((0.5 - u) / 0.5) ** 2) * 1.0 : (((u - 0.5) / 0.5) ** 2) * 2.0);
  const fondo = (u) => (u < 0.2 ? 4.2 * ((0.2 - u) / 0.2) ** 2 : u > 0.92 ? 3 * ((u - 0.92) / 0.08) ** 2 : 0);
  const pienezza = (u) => (u < 0.3 ? 0.62 + 0.38 * (1 - ((0.3 - u) / 0.3) ** 2) : u > 0.62 ? Math.max(0, 1 - ((u - 0.62) / 0.38) ** 2.2) : 1);
  function mezza(u, y) {
    const k = fondo(u);
    if (y < k) return 0;
    const pieno = pienezza(u);
    const n = 1.6 + 4.4 * pieno ** 3;
    const t = Math.min(1, (y - k) / (4.5 + 3 * (1 - pieno)));
    return (B / 2) * pieno * (1 - (1 - t) ** n) ** (1 / n);
  }
  const ascissa = (u, y) => L * u + (u > 0.85 ? 4 * (y / 9) ** 1.4 * ((u - 0.85) / 0.15) : 0);

  // k ingrossa i tratti: in un modellino le linee vere sarebbero invisibili
  function crea(k = 1) {
    const g = new THREE.Group();
    const NU = 72; const NV = 20; const pos = []; const ind = [];
    const riga = NV + 1; const col = NU + 1;
    [1, -1].forEach((lato, l) => {
      for (let i = 0; i <= NU; i++) {
        const u = i / NU; const fk = fondo(u); const h = insellatura(u);
        for (let j = 0; j <= NV; j++) {
          const y = fk + (j / NV) * (h - fk);
          pos.push(ascissa(u, y), y, lato * mezza(u, y));
        }
      }
      const o = l * col * riga;
      for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
        const a = o + i * riga + j; const b = a + riga;
        ind.push(a, b, a + 1, b, b + 1, a + 1);
      }
    });
    const dx = (i, j) => i * riga + j;
    for (let j = 0; j < NV; j++) ind.push(dx(0, j), dx(0, j + 1), col * riga + dx(0, j), dx(0, j + 1), col * riga + dx(0, j + 1), col * riga + dx(0, j));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(ind);
    g.add(new THREE.Mesh(dipinto(geo), vernice()));

    const coperta = cuoci(ponte(), TINTE.ponte);
    g.add(new THREE.Mesh(coperta, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));

    g.add(sovrastrutture());
    // Orlo di murata, chiglia e dritto
    [1, -1].forEach((lato) => {
      const punti = [];
      for (let i = 0; i <= 60; i++) { const u = i / 60; const y = insellatura(u); punti.push(new THREE.Vector3(ascissa(u, y), y + 0.05, lato * mezza(u, y))); }
      g.add(tratto(punti, 0.06 * k, 0xFBF9F1));
    });
    const profilo = [];
    for (let i = 0; i <= 60; i++) { const u = i / 60; profilo.push(new THREE.Vector3(ascissa(u, fondo(u)), fondo(u), 0)); }
    for (let j = 1; j <= 8; j++) { const y = 3 + (j / 8) * (insellatura(1) - 3); profilo.push(new THREE.Vector3(ascissa(1, y), y, 0)); }
    g.add(tratto(profilo, 0.05 * k, 0x2A1A14));
    // Alberi e picchi di carico
    [[38, 1], [52, 1], [68, -1]].forEach(([x, v]) => {
      const piede = new THREE.Vector3(x, 7.2, 0); const testa = new THREE.Vector3(x, 17, 0);
      g.add(segmento(piede, testa, 0.17 * Math.sqrt(k), TINTE.albero));
      g.add(segmento(new THREE.Vector3(x, 8.4, 0), new THREE.Vector3(x + v * 8.5, 13, 0), 0.08 * Math.sqrt(k), TINTE.albero));
      g.add(segmento(testa, new THREE.Vector3(x + v * 8.5, 13, 0), 0.03 * k, 0x2A1A14));
    });
    return Tavola.compatta(g);
  }

  /* Tinte della nave. La linea di galleggiamento dipinta è a 6 m, come nelle lezioni */
  const TINTE = {
    carena: '#9C3324', bagnasciuga: '#20201F', murata: '#1F4468', ponte: '#6E8576', tuga: '#F4F0E6', tugaOmbra: '#D9D4C6',
    boccaporta: '#2F6586', finestra: '#27394B', fumaiolo: '#1F4468', fascia: '#D8A93A', cima: '#20201F', albero: 0xD8A93A,
  };
  const ACQUA = 6; const ALTO = 11;
  let telaScafo = null;
  function vernice() {
    if (!telaScafo) {
      telaScafo = Tavola.tela(1024, 256, (c) => {
        const y = (q) => 256 - (q / ALTO) * 256;
        c.fillStyle = TINTE.murata; c.fillRect(0, 0, 1024, 256);
        c.fillStyle = TINTE.carena; c.fillRect(0, y(ACQUA - 0.35), 1024, 256);
        c.fillStyle = TINTE.bagnasciuga; c.fillRect(0, y(ACQUA + 0.3), 1024, y(ACQUA - 0.35) - y(ACQUA + 0.3));
        // Corsi del fasciame
        c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 1;
        for (let i = 0; i < 40; i++) { const x = (i * 1024) / 40; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 256); c.stroke(); }
        for (let q = 1; q < ALTO; q += 1.4) { c.beginPath(); c.moveTo(0, y(q)); c.lineTo(1024, y(q)); c.stroke(); }
      });
    }
    return new THREE.MeshBasicMaterial({ map: telaScafo, vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
  }
  // Qualsiasi pezzo in coordinate di scafo prende la stessa vernice
  function dipinto(geo) {
    const p = geo.attributes.position; const uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / L; uv[i * 2 + 1] = p.getY(i) / ALTO; }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return cuoci(geo, '#FFFFFF', true);
  }

  /* Coperta: boccaporte, cassero, plancia, fumaiolo. Un solo oggetto, per il visore */
  function sovrastrutture() {
    const pos = []; const col = []; const ind = []; const c = new THREE.Color();
    function faccia(a, b, d, e, hex, luce) {
      const o = pos.length / 3; c.set(hex);
      [a, b, d, e].forEach((v) => { pos.push(...v); col.push(c.r * luce, c.g * luce, c.b * luce); });
      ind.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
    function cassa(x0, x1, y0, y1, z0, z1, hex) {
      faccia([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], hex, 1);
      faccia([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], hex, 0.88);
      faccia([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], hex, 0.74);
      faccia([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], hex, 0.94);
      faccia([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], hex, 0.66);
    }
    // Finestre sui fianchi e davanti, poco fuori dalla parete
    function finestreLato(x0, x1, y, h, z, n, l) {
      for (let i = 0; i < n; i++) {
        const a = x0 + ((i + 0.25) * (x1 - x0)) / n; const b = a + (0.5 * (x1 - x0)) / n;
        [1, -1].forEach((s) => faccia([a, y, s * (z + 0.02)], [b, y, s * (z + 0.02)], [b, y + h, s * (z + 0.02)], [a, y + h, s * (z + 0.02)], TINTE.finestra, l));
      }
    }
    function finestreFronte(x, y, h, z, n) {
      for (let i = 0; i < n; i++) {
        const a = -z + ((i + 0.15) * 2 * z) / n; const b = a + (1.4 * z) / n;
        faccia([x + 0.02, y, b], [x + 0.02, y, a], [x + 0.02, y + h, a], [x + 0.02, y + h, b], TINTE.finestra, 1);
      }
    }
    [[26, 36], [40, 50], [54, 64]].forEach(([a, b]) => {
      cassa(a, b, 7.2, 8, -4.8, 4.8, TINTE.boccaporta);
      for (let i = 1; i < 4; i++) cassa(a + (i * (b - a)) / 4 - 0.06, a + (i * (b - a)) / 4 + 0.06, 8, 8.06, -4.8, 4.8, '#BFD3DF');
    });
    cassa(1.5, 18, 7.8, 10.4, -5.6, 5.6, TINTE.tuga);
    finestreLato(2, 17.5, 8.8, 0.7, 5.6, 9, 1);
    cassa(4, 15, 10.4, 13, -5, 5, TINTE.tuga);
    finestreLato(4.5, 14.5, 11.3, 0.8, 5, 6, 1);
    cassa(12, 15.4, 13, 15.2, -6.4, 6.4, TINTE.tuga);
    cassa(11.8, 15.6, 15.2, 15.45, -6.6, 6.6, TINTE.tugaOmbra);
    finestreFronte(15.4, 13.9, 0.95, 6.4, 8);
    cassa(5.8, 10, 13, 15.2, -1.25, 1.25, TINTE.fumaiolo);
    cassa(5.8, 10, 15.2, 16, -1.25, 1.25, TINTE.fascia);
    cassa(5.8, 10, 16, 16.9, -1.25, 1.25, TINTE.cima);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(ind);
    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  }

  function griglia(nu, nv, punto) {
    const pos = []; const ind = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) pos.push(...punto(i / nu, j / nv));
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j; const b = a + nv + 1;
      ind.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(ind);
    return g;
  }

  // Pezzo di fiancata tra due stazioni e due quote: serve a evidenziare una parte della nave
  function fiancata(u0, u1, y0, y1, lato) {
    return griglia(36, 10, (a, b) => {
      const u = u0 + a * (u1 - u0); const k = fondo(u); const h = insellatura(u);
      const y = Math.max(k, Math.min(h, y0 + b * (y1 - y0)));
      return [ascissa(u, y), y, lato * (mezza(u, y) + 0.06)];
    });
  }
  function ponte() {
    return griglia(48, 6, (a, b) => {
      const u = 0.01 + a * 0.98; const y = insellatura(u);
      return [ascissa(u, y), y + 0.04, (2 * b - 1) * mezza(u, y)];
    });
  }
  function specchio() {
    return griglia(2, 10, (a, b) => {
      const k = fondo(0); const y = k + b * (insellatura(0) - k);
      return [-0.08, y, (2 * a - 1) * mezza(0, y)];
    });
  }

  const MARE = 0x2F7FA3;
  let telaCielo = null; let telaOnde = null;
  function cielo() {
    if (!telaCielo) {
      telaCielo = Tavola.tela(1024, 512, (c) => {
        const s = c.createLinearGradient(0, 0, 0, 256);
        s.addColorStop(0, '#5E9FCB'); s.addColorStop(0.75, '#BFDDE8'); s.addColorStop(1, '#EAF2EE');
        c.fillStyle = s; c.fillRect(0, 0, 1024, 256);
        const a = c.createLinearGradient(0, 256, 0, 512);
        a.addColorStop(0, '#5C9DB6'); a.addColorStop(0.1, '#1F6585'); a.addColorStop(1, '#154A66');
        c.fillStyle = a; c.fillRect(0, 256, 1024, 256);
        let n = 13;
        const r = () => { n = (n * 16807) % 2147483647; return n / 2147483647; };
        c.fillStyle = 'rgba(255,255,255,0.62)';
        for (let i = 0; i < 26; i++) {
          const x = r() * 1024; const y = 110 + r() * 125; const w = 40 + r() * 80;
          for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(x + (k - 3) * w * 0.3, y + r() * 5, w * (0.25 + r() * 0.3), w * 0.09, 0, 0, Math.PI * 2); c.fill(); }
        }
      });
    }
    const m = new THREE.Mesh(new THREE.SphereGeometry(980, 32, 16), new THREE.MeshBasicMaterial({ map: telaCielo, side: THREE.BackSide, depthWrite: false }));
    m.position.set(L / 2, 0, 0);
    return m;
  }

  // Mare e cielo a grandezza vera, centrati a metà nave
  function mare() {
    const g = new THREE.Group();
    if (!telaOnde) {
      telaOnde = Tavola.tela(256, 256, (c) => {
        c.fillStyle = '#3388AB'; c.fillRect(0, 0, 256, 256);
        let n = 29;
        const r = () => { n = (n * 16807) % 2147483647; return n / 2147483647; };
        c.strokeStyle = 'rgba(225,245,250,0.3)'; c.lineWidth = 2;
        for (let i = 0; i < 44; i++) { const x = r() * 256; const y = r() * 256; const l = 14 + r() * 26; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 5, x + l, y); c.stroke(); }
      });
      telaOnde.wrapS = telaOnde.wrapT = THREE.RepeatWrapping; telaOnde.repeat.set(26, 26);
    }
    const acqua = new THREE.Mesh(new THREE.CircleGeometry(900, 72), new THREE.MeshBasicMaterial({ map: telaOnde, transparent: true, opacity: 0.62, depthWrite: false, side: THREE.DoubleSide }));
    acqua.rotation.x = -Math.PI / 2; acqua.position.set(L / 2, 0, 0);
    const griglia3 = new THREE.GridHelper(640, 64, 0xDDEEF4, 0xDDEEF4);
    griglia3.material.transparent = true; griglia3.material.opacity = 0.14; griglia3.material.depthWrite = false;
    griglia3.position.set(L / 2, 0.01, 0);
    g.add(cielo(), acqua, griglia3);
    return g;
  }
  // Vasca del modellino
  function vasca() {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.CircleGeometry(58, 64), new THREE.MeshBasicMaterial({ color: MARE, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
    a.rotation.x = -Math.PI / 2; a.position.set(L / 2, 0, 0);
    const b = new THREE.Mesh(new THREE.RingGeometry(57.2, 58, 64), new THREE.MeshBasicMaterial({ color: 0xC9A24E, side: THREE.DoubleSide }));
    b.rotation.x = -Math.PI / 2; b.position.set(L / 2, 0.02, 0);
    g.add(a, b);
    return g;
  }

  return { L, B, PONTE, TINTE, insellatura, fondo, pienezza, mezza, ascissa, crea, griglia, fiancata, ponte, specchio, mare, vasca, vernice, dipinto };
})();
