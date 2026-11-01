/* Scafo comune a più lezioni: forma schematica lunga 90 m, insellatura dalla lezione 4.
   B è solo grafico: non è mai un dato delle lezioni */
window.Scafo = (function () {
  const { COL, tratto, scatola } = Tavola;
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
    for (let i = 0; i < NU; i++) ind.push(dx(i, NV), dx(i + 1, NV), col * riga + dx(i, NV), dx(i + 1, NV), col * riga + dx(i + 1, NV), col * riga + dx(i, NV));
    for (let j = 0; j < NV; j++) ind.push(dx(0, j), dx(0, j + 1), col * riga + dx(0, j), dx(0, j + 1), col * riga + dx(0, j + 1), col * riga + dx(0, j));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(ind);
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: COL.scafo, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 })));

    // Sezioni (station), come nel piano di costruzione
    for (let i = 0; i < 20; i++) {
      if (i === 10) continue; // la sezione maestra passerebbe sopra le marche
      const u = i / 20; const fk = fondo(u); const h = insellatura(u); const punti = [];
      for (let j = 16; j >= -16; j--) {
        const y = fk + (Math.abs(j) / 16) * (h - fk);
        punti.push(new THREE.Vector3(ascissa(u, y), y, Math.sign(j || 1) * mezza(u, y)));
      }
      g.add(tratto(punti, 0.035 * k, COL.medio));
    }
    // Linee d'acqua
    [2, 4, 8].forEach((y) => [1, -1].forEach((lato) => {
      const punti = [];
      for (let i = 0; i <= 80; i++) {
        const u = i / 80;
        if (y >= fondo(u) && y <= insellatura(u)) punti.push(new THREE.Vector3(ascissa(u, y), y, lato * mezza(u, y)));
      }
      if (punti.length > 2) g.add(tratto(punti, 0.03 * k, COL.medio));
    }));
    // Orlo di murata, chiglia e dritto
    [1, -1].forEach((lato) => {
      const punti = [];
      for (let i = 0; i <= 60; i++) { const u = i / 60; const y = insellatura(u); punti.push(new THREE.Vector3(ascissa(u, y), y + 0.05, lato * mezza(u, y))); }
      g.add(tratto(punti, 0.04 * k));
    });
    const profilo = [];
    for (let i = 0; i <= 60; i++) { const u = i / 60; profilo.push(new THREE.Vector3(ascissa(u, fondo(u)), fondo(u), 0)); }
    for (let j = 1; j <= 8; j++) { const y = 3 + (j / 8) * (insellatura(1) - 3); profilo.push(new THREE.Vector3(ascissa(1, y), y, 0)); }
    g.add(tratto(profilo, 0.07 * k));

    // Coperta: boccaporte, cassero poppiero, plancia, fumaiolo
    [[26, 36], [40, 50], [54, 64]].forEach(([a, b]) => g.add(scatola(a, b, 7.2, 8.0, -4.8, 4.8, 0.05 * k)));
    g.add(scatola(1.5, 18, 7.8, 10.4, -5.6, 5.6, 0.06 * k));
    g.add(scatola(4, 15, 10.4, 13, -5, 5, 0.06 * k));
    g.add(scatola(7, 11.5, 13, 16, -1.2, 1.2, 0.05 * k));
    return Tavola.compatta(g);
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

  // Mare a grandezza vera, centrato a metà nave
  function mare() {
    const g = new THREE.Group();
    const acqua = new THREE.Mesh(new THREE.CircleGeometry(420, 72), new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }));
    acqua.rotation.x = -Math.PI / 2; acqua.position.set(L / 2, 0, 0);
    const griglia3 = new THREE.GridHelper(640, 64, COL.medio, COL.medio);
    griglia3.material.transparent = true; griglia3.material.opacity = 0.28;
    griglia3.position.set(L / 2, 0.01, 0);
    g.add(acqua, griglia3);
    return g;
  }
  // Vasca del modellino
  function vasca() {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.CircleGeometry(58, 64), new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
    a.rotation.x = -Math.PI / 2; a.position.set(L / 2, 0, 0);
    const b = new THREE.Mesh(new THREE.RingGeometry(57.2, 58, 64), new THREE.MeshBasicMaterial({ color: COL.acqua, side: THREE.DoubleSide }));
    b.rotation.x = -Math.PI / 2; b.position.set(L / 2, 0.02, 0);
    g.add(a, b);
    return g;
  }

  return { L, B, PONTE, insellatura, fondo, pienezza, mezza, ascissa, crea, griglia, fiancata, ponte, specchio, mare, vasca };
})();
