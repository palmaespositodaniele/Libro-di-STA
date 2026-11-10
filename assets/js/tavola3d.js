/* Disegno comune dei modelli 3D: tratto blu, scatole al tratto, etichette. Regole in design.md */
(function () {
  const COL = {
    carta: 0xFBFAF4, scafo: 0xFBF9F1, inchiostro: 0x0B2545, medio: 0x5B6B7C,
    griglia: 0xD8E0EC, acqua: 0x2E7DB5, ocra: 0xC9A227, rosso: 0xB3362B,
  };

  const materiali = {};
  function inchiostro(colore) {
    return materiali[colore] || (materiali[colore] = new THREE.MeshBasicMaterial({ color: colore }));
  }

  // Tratto a tubo sottile: le linee WebGL sono troppo fini sulla LIM
  function tratto(punti, raggio, colore, chiuso) {
    const curva = new THREE.CatmullRomCurve3(punti, !!chiuso, 'catmullrom', 0.1);
    const geo = new THREE.TubeGeometry(curva, Math.max(8, punti.length * 2), raggio, 4, !!chiuso);
    return new THREE.Mesh(geo, inchiostro(colore === undefined ? COL.inchiostro : colore));
  }
  function segmento(a, b, raggio, colore) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(raggio, raggio, dir.length(), 5), inchiostro(colore === undefined ? COL.inchiostro : colore));
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  }

  // Parallelepipedo pieno color carta con i soli spigoli blu
  function scatola(x0, x1, y0, y1, z0, z1, raggio, colore) {
    const g = new THREE.Group();
    const pieno = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), new THREE.MeshBasicMaterial({ color: COL.scafo, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
    pieno.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    g.add(pieno);
    const p = (i) => new THREE.Vector3(i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0);
    [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]
      .forEach(([a, b]) => g.add(segmento(p(a), p(b), raggio, colore)));
    return g;
  }

  function tela(larghezza, altezza, disegna) {
    const c = document.createElement('canvas');
    c.width = larghezza; c.height = altezza;
    disegna(c.getContext('2d'));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  // Etichetta sempre rivolta verso chi guarda; altezza in metri
  function etichetta(testo, altezza, colore) {
    const px = 96;
    const misura = document.createElement('canvas').getContext('2d');
    misura.font = `${px}px Disegno, cursive`;
    const w = Math.ceil(misura.measureText(testo).width) + 40;
    const tex = tela(w, px + 40, (ctx) => {
      ctx.font = `${px}px Disegno, cursive`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colore || '#0B2545';
      ctx.fillText(testo, 20, (px + 40) / 2);
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    s.scale.set((altezza * w) / (px + 40), altezza, 1);
    s.userData.testo = testo; // per il collaudo delle etichette
    return s;
  }

  // Pedana di teletrasporto in VR
  function pedana(x, z, nome) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 5), new THREE.MeshBasicMaterial({ color: COL.scafo }));
    m.position.set(x, 0.1, z);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: COL.inchiostro })));
    const e = etichetta(nome, 0.6);
    e.position.set(0, 2.2, 0);
    m.add(e);
    return m;
  }

  // Luce cotta nei vertici: dà volume senza luci in scena, che sul visore costano troppo.
  // tinta(x, y, z) dà il colore; fuori: le normali guardano via dall'asse, per gli scafi
  const SOLE = new THREE.Vector3(0.35, 0.8, 0.48).normalize();
  function cuoci(geo, tinta, fuori) {
    geo.computeVertexNormals();
    const p = geo.attributes.position; const n = geo.attributes.normal;
    const col = new Float32Array(p.count * 3); const c = new THREE.Color(); const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(n, i);
      if (fuori && v.z * p.getZ(i) < 0) v.negate();
      const luce = 0.6 + 0.4 * (v.dot(SOLE) * 0.5 + 0.5);
      if (typeof tinta === 'function') c.set(tinta(p.getX(i), p.getY(i), p.getZ(i))); else c.set(tinta);
      col[i * 3] = c.r * luce; col[i * 3 + 1] = c.g * luce; col[i * 3 + 2] = c.b * luce;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }

  // Sfera d'oro: nei modelli vuol dire «prendimi e trascinami». Va messa in mondo.tocchi()
  function maniglia(raggio, id) {
    const m = new THREE.Mesh(cuoci(new THREE.SphereGeometry(raggio, 18, 12), COL.ocra), new THREE.MeshBasicMaterial({ vertexColors: true }));
    m.userData.maniglia = id;
    const anello = new THREE.Mesh(new THREE.TorusGeometry(raggio * 1.35, raggio * 0.12, 6, 24), inchiostro(COL.inchiostro));
    anello.rotation.x = Math.PI / 2; m.add(anello);
    return m;
  }

  // Fonde tutti i tratti dello stesso colore in un solo oggetto: il visore disegna molto meno
  function compatta(gruppo) {
    gruppo.updateMatrixWorld(true);
    const inverso = new THREE.Matrix4().copy(gruppo.matrixWorld).invert();
    const perColore = new Map();
    gruppo.traverse((o) => {
      if (o.isMesh && Object.values(materiali).includes(o.material)) {
        if (!perColore.has(o.material)) perColore.set(o.material, []);
        perColore.get(o.material).push(o);
      }
    });
    const v = new THREE.Vector3();
    perColore.forEach((lista, mat) => {
      const pos = []; const ind = [];
      lista.forEach((m) => {
        const base = pos.length / 3; const g = m.geometry; const p = g.attributes.position;
        const tot = new THREE.Matrix4().multiplyMatrices(inverso, m.matrixWorld);
        for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(tot); pos.push(v.x, v.y, v.z); }
        for (let i = 0; i < g.index.count; i++) ind.push(g.index.getX(i) + base);
        m.removeFromParent(); g.dispose();
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setIndex(ind);
      gruppo.add(new THREE.Mesh(geo, mat));
    });
    return gruppo;
  }

  window.Tavola = { COL, tratto, segmento, scatola, tela, etichetta, pedana, compatta, cuoci, maniglia };
})();
