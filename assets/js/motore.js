/* Il libro 3D: una sola scena per schermo, LIM e visore.
   Sezioni e pagine, sfoglio, puntamento (dito, mouse o controller), finestra 3D, modalità VR. Regole in design.md */
window.Motore = (function () {
  const { COL } = Tavola;
  const PW = 0.55; const PH = (PW * Pagina.H) / Pagina.W; const Z = 0.0175;
  const sezioni = {};
  let sez = null; let idx = 0; let spread = null;

  const contenitore = document.getElementById('scena');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.xr.enabled = true;
  contenitore.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xE9E6D8);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.03, 1500);
  const rig = new THREE.Group();
  rig.add(camera);
  scene.add(rig);

  /* Tavolo da carteggio, solo su schermo */
  const tavolo = new THREE.Group();
  const fogli = Tavola.tela(512, 512, (c) => {
    c.fillStyle = '#E9E6D8'; c.fillRect(0, 0, 512, 512);
    c.strokeStyle = '#D3DAD8'; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i <= 512; i += 64) { c.moveTo(i, 0); c.lineTo(i, 512); c.moveTo(0, i); c.lineTo(512, i); }
    c.stroke();
  });
  fogli.wrapS = fogli.wrapT = THREE.RepeatWrapping; fogli.repeat.set(16, 16);
  const piano = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: fogli }));
  piano.position.z = -0.012;
  tavolo.add(piano);
  tavolo.rotation.x = -0.1; // stessa inclinazione del libro
  scene.add(tavolo);

  /* Stanza a quadretti, solo in VR */
  const stanza = new THREE.GridHelper(40, 40, 0xC9D8E6, 0xC9D8E6);
  stanza.visible = false;
  scene.add(stanza);

  /* Libro ---------------------------------------------------------------- */
  const libro = new THREE.Group();
  const interno = new THREE.Group(); // si sposta quando il libro è chiuso
  libro.add(interno);
  libro.rotation.x = -0.1;
  scene.add(libro);

  function tavolozzaPagina() {
    const canvas = document.createElement('canvas');
    canvas.width = Pagina.W; canvas.height = Pagina.H;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return { canvas, ctx: canvas.getContext('2d'), tex, zone: [], trabocco: 0, testo: '' };
  }
  let att = { sx: tavolozzaPagina(), dx: tavolozzaPagina() };
  let dopo = { sx: tavolozzaPagina(), dx: tavolozzaPagina() };

  const paginaSx = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: att.sx.tex }));
  const paginaDx = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: att.dx.tex }));
  paginaSx.position.set(-PW / 2, 0, Z); paginaDx.position.set(PW / 2, 0, Z);
  paginaSx.userData.lato = 'sx'; paginaDx.userData.lato = 'dx';
  const blocco = (x, z, w, h, sp, colore) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, sp), new THREE.MeshBasicMaterial({ color: colore }));
    m.position.set(x, 0, z);
    return m;
  };
  const latoSx = new THREE.Group(); const latoDx = new THREE.Group();
  latoSx.add(blocco(-PW / 2 - 0.008, -0.006, PW + 0.03, PH + 0.03, 0.008, COL.inchiostro), blocco(-PW / 2, 0.006, PW, PH, 0.02, 0xE4DFCB), paginaSx);
  latoDx.add(blocco(PW / 2 + 0.008, -0.006, PW + 0.03, PH + 0.03, 0.008, COL.inchiostro), blocco(PW / 2, 0.006, PW, PH, 0.02, 0xE4DFCB), paginaDx);
  interno.add(latoSx, latoDx);

  // Foglio che gira: due facce sulla stessa forma curva
  const SEG = 16;
  const geoFronte = new THREE.PlaneGeometry(PW, PH, SEG, 1); geoFronte.translate(PW / 2, 0, 0);
  const geoRetro = geoFronte.clone();
  const uvR = geoRetro.attributes.uv; for (let i = 0; i < uvR.count; i++) uvR.setX(i, 1 - uvR.getX(i));
  const fronte = new THREE.Mesh(geoFronte, new THREE.MeshBasicMaterial({ side: THREE.FrontSide }));
  const retro = new THREE.Mesh(geoRetro, new THREE.MeshBasicMaterial({ side: THREE.BackSide }));
  const foglio = new THREE.Group(); foglio.add(fronte, retro); foglio.visible = false;
  foglio.position.z = Z + 0.002;
  interno.add(foglio);
  function pose(t) {
    const th = t * Math.PI; const curva = 0.75 * Math.sin(t * Math.PI);
    [geoFronte, geoRetro].forEach((g) => {
      const p = g.attributes.position; let x = 0; let z = 0; const dx = PW / SEG;
      for (let c = 0; c <= SEG; c++) {
        const a = th - curva * (c / SEG - 0.5);
        for (let r = 0; r < 2; r++) { const i = r * (SEG + 1) + c; p.setX(i, x); p.setZ(i, z); }
        x += dx * Math.cos(a); z += dx * Math.sin(a);
      }
      p.needsUpdate = true;
      g.computeBoundingSphere();
    });
  }

  // Aletta dello Scopri, incernierata in alto sulla pagina destra
  const perno = new THREE.Group();
  perno.position.set(PW / 2, PH / 2, Z + 0.004);
  const alettaTex = Tavola.tela(600, 820, (c) => {
    c.fillStyle = '#12355B'; c.fillRect(0, 0, 600, 820);
    c.fillStyle = '#F6F3E8'; c.textAlign = 'center';
    c.font = '700 54px Bitter, Georgia, serif'; c.fillText('Solleva l\'aletta', 300, 400);
    c.font = '34px Atkinson, sans-serif'; c.fillText('Dentro c\'è la risposta', 300, 460);
    c.strokeStyle = '#F6F3E8'; c.lineWidth = 3; c.strokeRect(30, 30, 540, 760);
  });
  const aletta = new THREE.Mesh(new THREE.PlaneGeometry(PW * 0.98, PH * 0.98), new THREE.MeshBasicMaterial({ map: alettaTex, side: THREE.DoubleSide, transparent: true }));
  aletta.position.y = -PH * 0.49;
  perno.add(aletta); perno.visible = false;
  latoDx.add(perno);
  let alzata = 0; let alzaA = 0;

  // Zone della pagina riempite dal vivo: finestra 3D e lente
  const rt = new THREE.WebGLRenderTarget(1040, 760, { samples: 4 });
  const finestra = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: rt.texture }));
  const lente = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
  finestra.visible = false; lente.visible = false;
  latoDx.add(finestra, lente);
  function piazza(mesh, z) {
    mesh.scale.set((z.w / Pagina.W) * PW, (z.h / Pagina.H) * PH, 1);
    mesh.position.set(((z.x + z.w / 2) / Pagina.W) * PW, PH / 2 - ((z.y + z.h / 2) / Pagina.H) * PH, Z + 0.0015);
  }

  const luce = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: COL.ocra, transparent: true, opacity: 0.3, depthWrite: false }));
  luce.visible = false;
  interno.add(luce);

  /* Finestra sul modello --------------------------------------------------- */
  const mondoScena = new THREE.Scene();
  mondoScena.background = new THREE.Color(COL.carta);
  const mondoCam = new THREE.PerspectiveCamera(34, 1040 / 760, 0.05, 1500);
  const orbita = { target: new THREE.Vector3(), theta: 0.7, phi: 1.3, r: 100, meta: { target: new THREE.Vector3(), theta: 0.7, phi: 1.3, r: 100 } };
  let mondo = null; let mondoSporco = true;
  function vista(v) { Object.assign(orbita.meta, v); mondoSporco = true; }

  function usaMondo(m) {
    if (mondo === m) return;
    if (mondo) mondo.radice.removeFromParent();
    mondo = m;
    if (m) { mondoScena.add(m.radice); vista(m.vistaIniziale()); orbita.target.copy(orbita.meta.target); orbita.theta = orbita.meta.theta; orbita.phi = orbita.meta.phi; orbita.r = orbita.meta.r; mondoSporco = true; }
  }

  /* Disegno delle pagine ---------------------------------------------------- */
  const sr = document.getElementById('testo-pagina');

  function piede(lato) {
    const sp = spread;
    if (sp.chiuso) return null;
    const lista = sez.spreads();
    if (lato === 'sx') {
      const b = [];
      if (idx > 0) b.push({ id: 'indietro', testo: '◀ Indietro' });
      if (sez.id !== 'indice') b.push({ id: 'indice', testo: 'Indice' });
      if (renderer.xr.isPresenting) b.push({ id: 'esci-vr', testo: 'Esci VR' });
      return { bottoni: b };
    }
    const prossimo = lista[idx + 1];
    if (!prossimo) return { bottoni: [] };
    // Un passaggio non fatto non blocca: si può saltare, ma senza bandiera
    const puo = !prossimo.richiede || prossimo.richiede();
    return { bottoni: [{ id: 'avanti', testo: puo ? 'Avanti ▶' : 'Salta ▶', on: puo }], avviso: puo ? '' : prossimo.avviso };
  }

  function dipingi(dest, sp) {
    const vecchio = spread; spread = sp;
    ['sx', 'dx'].forEach((l) => {
      const f = dest[l];
      const r = Pagina.disegna(f.ctx, sp[l], { lato: l, piede: piede(l) });
      f.zone = r.zone; f.trabocco = r.trabocco; f.testo = r.testo;
      f.tex.needsUpdate = true;
    });
    spread = vecchio;
  }

  function sistemaInserti() {
    const presente = renderer.xr.isPresenting;
    const zf = att.dx.zone.find((z) => z.id === 'finestra');
    const zl = att.dx.zone.find((z) => z.id === 'lente');
    finestra.visible = !!zf && !presente && !giro;
    if (zf) { piazza(finestra, zf); mondoCam.aspect = zf.w / zf.h; mondoCam.updateProjectionMatrix(); mondoSporco = true; }
    lente.visible = !!zl && !giro && !!mondo && !!mondo.lente;
    if (zl && mondo && mondo.lente) { piazza(lente, zl); lente.material.map = mondo.lente(); lente.material.needsUpdate = true; }
    perno.visible = !!spread.aletta && !giro;
    if (spread.aletta) { alzaA = spread.aletta() ? 1 : 0; if (!alzaA) alzata = 0; }
    sr.textContent = `${att.sx.testo} ${att.dx.testo}`;
  }

  function ridisegna() {
    spread = sez.spreads()[idx];
    dipingi(att, spread);
    sistemaInserti();
  }

  /* Sfoglio ------------------------------------------------------------------ */
  let giro = null;
  const fermo = window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('fermo');

  function vai(s, i, avanti) {
    if (giro) return;
    const nuova = s.spreads()[i];
    if (nuova === undefined) return;
    if (s === sez && i === idx) { ridisegna(); return; }
    const verso = avanti === undefined ? (s === sez ? i > idx : true) : avanti;
    const daChiuso = spread && spread.chiuso;
    sez = s; idx = i;
    dipingi(dopo, nuova);
    const prima = spread; spread = nuova;
    Libro.aggiorna('pos', { sezione: s.id, i });
    location.replace(`#${s.id}`);
    if (fermo || !prima) { finisciGiro(verso, nuova); return; }
    // Il foglio porta la pagina vecchia su un lato e la nuova sull'altro
    if (verso) {
      paginaDx.material.map = dopo.dx.tex; paginaDx.material.needsUpdate = true;
      fronte.material.map = att.dx.tex; retro.material.map = dopo.sx.tex;
    } else {
      paginaSx.material.map = dopo.sx.tex; paginaSx.material.needsUpdate = true;
      fronte.material.map = dopo.dx.tex; retro.material.map = att.sx.tex;
    }
    fronte.material.needsUpdate = true; retro.material.needsUpdate = true;
    giro = { t: 0, verso, nuova, daChiuso };
    latoSx.visible = !daChiuso || !verso;
    foglio.visible = true; finestra.visible = false; lente.visible = false; perno.visible = false; luce.visible = false;
    pose(verso ? 0 : 1);
  }

  function finisciGiro(verso, nuova) {
    const v = att; att = dopo; dopo = v;
    paginaSx.material.map = att.sx.tex; paginaDx.material.map = att.dx.tex;
    paginaSx.material.needsUpdate = true; paginaDx.material.needsUpdate = true;
    foglio.visible = false; giro = null;
    spread = nuova;
    latoSx.visible = !nuova.chiuso;
    if (fermo) interno.position.x = nuova.chiuso ? -PW / 2 : 0;
    usaMondo(nuova.mondo ? nuova.mondo() : null);
    if (renderer.xr.isPresenting) impostaVR();
    dipingi(att, nuova);
    sistemaInserti();
  }

  /* Puntamento: lo stesso per dito, mouse e controller ------------------------ */
  const rc = new THREE.Raycaster();

  function colpo() {
    if (perno.visible && alzata < 0.1) {
      const a = rc.intersectObject(aletta)[0];
      if (a) return { id: 'aletta', punto: a.point, distanza: a.distance, aletta: true };
    }
    const h = rc.intersectObjects(latoSx.visible ? [paginaSx, paginaDx] : [paginaDx], false)[0];
    if (!h) return null;
    const f = att[h.object.userData.lato];
    const x = h.uv.x * Pagina.W; const y = (1 - h.uv.y) * Pagina.H;
    const z = f.zone.find((q) => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
    return { zona: z, id: z && z.id, punto: h.point, distanza: h.distance, lato: h.object.userData.lato, x, y };
  }

  function illumina(h) {
    if (!h || !h.zona || h.zona.area) { luce.visible = false; return; }
    const z = h.zona; const q = h.lato === 'sx' ? -PW : 0;
    luce.scale.set((z.w / Pagina.W) * PW, (z.h / Pagina.H) * PH, 1);
    luce.position.set(q + ((z.x + z.w / 2) / Pagina.W) * PW, PH / 2 - ((z.y + z.h / 2) / Pagina.H) * PH, Z + 0.002);
    luce.visible = true;
  }

  let tenuto = null; let ripetiT = null; let trascina = null;

  function agisci(id) {
    if (id === 'avanti') { if (sez.spreads()[idx + 1]) vai(sez, idx + 1, true); return; }
    if (id === 'indietro') { if (idx > 0) vai(sez, idx - 1, false); return; }
    if (id === 'indice') { vai(sezioni.indice, 0, false); return; }
    if (id === 'esci-vr') { const s = renderer.xr.getSession(); if (s) s.end(); return; }
    if (id === 'vr:scala') { vrScala = vrScala === 'vera' ? 'modello' : 'vera'; impostaVR(); ridisegna(); return; }
    if (id.startsWith('sez:')) { const [, nome, n] = id.split(':'); vai(sezioni[nome], Number(n || 0)); return; }
    if (spread.azione) spread.azione(id);
    ridisegna();
  }

  function premi(h) {
    if (giro || !h || !h.id) return;
    if (h.id === 'finestra') { trascina = { x: h.x, y: h.y }; return; }
    if (h.zona && h.zona.area) return;
    agisci(h.id);
    if (h.zona && h.zona.ripeti) {
      tenuto = h.id;
      ripetiT = setTimeout(function ancora() { if (tenuto) { agisci(tenuto); ripetiT = setTimeout(ancora, 110); } }, 420);
    }
  }
  function rilascia() { tenuto = null; clearTimeout(ripetiT); trascina = null; }

  // Mouse e tocco
  const el = renderer.domElement;
  const ndc = new THREE.Vector2();
  function raggioSchermo(e) {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    rc.setFromCamera(ndc, camera);
  }
  el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); raggioSchermo(e); premi(colpo()); });
  el.addEventListener('pointermove', (e) => {
    raggioSchermo(e);
    const h = colpo();
    if (trascina && h && h.x !== undefined) {
      orbita.meta.theta -= (h.x - trascina.x) * 0.006;
      orbita.meta.phi = Math.min(1.54, Math.max(0.25, orbita.meta.phi - (h.y - trascina.y) * 0.005));
      trascina = { x: h.x, y: h.y }; mondoSporco = true;
    }
    illumina(h);
    el.style.cursor = h && h.id ? (h.id === 'finestra' ? 'grab' : 'pointer') : 'default';
  });
  el.addEventListener('pointerup', rilascia);
  el.addEventListener('pointercancel', rilascia);
  el.addEventListener('wheel', (e) => {
    raggioSchermo(e);
    const h = colpo();
    if (h && h.id === 'finestra') { e.preventDefault(); orbita.meta.r = Math.min(260, Math.max(1.5, orbita.meta.r * Math.exp(e.deltaY * 0.001))); mondoSporco = true; }
  }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') agisci('avanti');
    else if (e.key === 'ArrowLeft') agisci('indietro');
    else if (/^[0-9]$/.test(e.key)) { if (spread.azione) { spread.azione(`k:${e.key}`); ridisegna(); } } else if (e.key === ',' || e.key === '.') { if (spread.azione) { spread.azione('k:,'); ridisegna(); } } else if (e.key === 'Backspace') { if (spread.azione) { spread.azione('k:canc'); ridisegna(); } } else if (e.key === 'Enter') { if (spread.azione) { spread.azione('k:ok'); ridisegna(); } }
  });

  /* Inquadratura su schermo: su uno schermo stretto si legge una pagina alla volta */
  let focus = 0;
  function ridimensiona() {
    const w = contenitore.clientWidth; const h = contenitore.clientHeight;
    if (!w || !h || renderer.xr.isPresenting) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const stretto = camera.aspect < 0.9;
    document.body.classList.toggle('stretto', stretto);
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    const largo = stretto ? PW + 0.03 : 2 * PW + 0.05;
    // In alto resta una striscia libera per il pulsante VR
    const d = Math.max((PH + 0.13) / (2 * tan), largo / (2 * tan * camera.aspect));
    const x = stretto ? (focus || 1) * (PW / 2) : 0;
    camera.position.set(x, 0.03, d);
    camera.rotation.set(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(ridimensiona).observe(contenitore);
  document.getElementById('pagina-sx').addEventListener('click', () => { focus = -1; ridimensiona(); });
  document.getElementById('pagina-dx').addEventListener('click', () => { focus = 1; ridimensiona(); });

  /* VR ------------------------------------------------------------------------ */
  const velo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color: COL.carta, side: THREE.BackSide, transparent: true, opacity: 0, depthTest: false }));
  velo.renderOrder = 999;
  camera.add(velo);
  const mirino = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.3, 32), new THREE.MeshBasicMaterial({ color: COL.ocra, side: THREE.DoubleSide }));
  mirino.rotation.x = -Math.PI / 2; mirino.visible = false;
  scene.add(mirino);

  // Tre modi nel visore: solo libro, modellino sopra il libro, modello a grandezza vera
  const leggio = { pos: new THREE.Vector3(0, 1.05, -0.62), rot: new THREE.Quaternion(), altezza: 1.05, modo: 'libro' };
  let vrScala = 'modello';

  const modellino = new THREE.Group();
  modellino.visible = false;
  rig.add(modellino);
  const presa = new THREE.Mesh(new THREE.SphereGeometry(0.66, 16, 12), new THREE.MeshBasicMaterial());
  presa.scale.y = 0.42; presa.visible = false;
  rig.add(presa);
  const anello = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.74, 64), new THREE.MeshBasicMaterial({ color: COL.ocra, side: THREE.DoubleSide }));
  anello.rotation.x = -Math.PI / 2; anello.visible = false;
  rig.add(anello);
  const POS_MODELLO = { z: -1.15, sopra: 0.46 };
  let salita = 0; let tieni = null;
  const qMano = new THREE.Quaternion(); const qGiro = new THREE.Quaternion();
  // La pagina sta perpendicolare allo sguardo: niente testo in scorcio
  const QL = (y) => new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.38, y, 0, 'YXZ'));
  let pedane = []; let daCentrare = false; let salto = null;

  let mondoInScena = null;
  function posa(s) { rig.position.copy(s.pos); rig.rotation.set(0, s.yaw, 0); }
  function applicaModo(modo) {
    const vera = modo === 'vera';
    leggio.modo = modo;
    mondoInScena = mondo;
    tieni = null;
    pedane.forEach((p) => { p.visible = false; }); pedane = [];
    // Modellino: si alza dal libro, nella stanza
    modellino.clear();
    modellino.visible = modo === 'modello';
    if (modo === 'modello') {
      modellino.add(mondo.modellino);
      modellino.quaternion.setFromEuler(new THREE.Euler(0.12, -0.45, 0));
      salita = 0;
    }
    anello.visible = false;
    // Grandezza vera: la nave intorno allo studente, che si sposta sulle pedane
    if (vera) {
      scene.add(mondo.radice);
      pedane = mondo.stazioni.map((s) => { s.pedana.userData.stazione = s; if (!s.pedana.parent) scene.add(s.pedana); s.pedana.visible = true; return s.pedana; });
      posa(mondo.stazioni[0]);
    } else {
      if (mondo) mondoScena.add(mondo.radice);
      rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0);
    }
    stanza.visible = !vera;
    // Accanto alla nave il libro si sposta di lato per non coprire la vista
    leggio.pos.set(vera ? -0.66 : 0, leggio.altezza, vera ? -0.5 : -0.78);
    leggio.rot.copy(QL(vera ? 0.75 : 0));
  }
  const modoVoluto = () => (!spread.mondo || !mondo ? 'libro' : vrScala);
  function impostaVR() {
    if (!spread.mondo) vrScala = 'modello';
    const modo = modoVoluto();
    // Una lezione può avere due mondi: cambiando pagina va rimesso quello nuovo
    if (modo === leggio.modo && (modo === 'libro' || mondo === mondoInScena)) return;
    // Solo il passaggio alla scala vera cambia ciò che sta intorno: serve la dissolvenza.
    // Il modo si rilegge a metà dissolvenza: può essere cambiato con una seconda pressione
    if (modo === 'vera' || leggio.modo === 'vera') salto = { tempo: 0, fatto: false, azione: () => applicaModo(modoVoluto()) };
    else applicaModo(modo);
  }

  const controller = [];
  const rotazione = new THREE.Matrix4();
  function raggioController(c) {
    rotazione.identity().extractRotation(c.matrixWorld);
    rc.ray.origin.setFromMatrixPosition(c.matrixWorld);
    rc.ray.direction.set(0, 0, -1).applyMatrix4(rotazione);
    rc.far = 250;
  }
  function colpoVR(c) {
    raggioController(c);
    const h = colpo();
    // Il controller sta sotto il libro: il raggio verso il modellino passa dalla pagina.
    // Vincono solo i bottoni; la carta e le zone disegnate lasciano passare il raggio
    const bottone = h && h.id && !(h.zona && h.zona.area);
    if (leggio.modo === 'modello' && !bottone) {
      const m = rc.intersectObject(presa, false)[0];
      if (m) return { presa: true, punto: m.point, distanza: m.distance };
    }
    if (h) return h;
    const p = rc.intersectObjects(pedane, false)[0];
    if (p) return { stazione: p.object.userData.stazione, punto: p.point, distanza: p.distance };
    return null;
  }
  [0, 1].forEach((i) => {
    const c = renderer.xr.getController(i);
    const linea = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: COL.inchiostro }));
    linea.scale.z = 3;
    c.add(linea);
    const manico = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.09, 8), new THREE.MeshBasicMaterial({ color: COL.inchiostro }));
    manico.rotation.x = -Math.PI / 2; manico.position.z = -0.03;
    c.add(manico);
    c.visible = false;
    c.addEventListener('connected', () => { c.visible = true; });
    c.addEventListener('disconnected', () => { c.visible = false; });
    c.addEventListener('selectstart', () => {
      c.updateMatrixWorld(true); // la posizione di questo istante, non del fotogramma prima
      const h = colpoVR(c);
      if (!h) return;
      if (h.stazione) salto = { tempo: 0, fatto: false, azione: () => posa(h.stazione) };
      else if (h.presa) tieni = { c, inizio: c.getWorldQuaternion(new THREE.Quaternion()).invert(), base: modellino.quaternion.clone() };
      else premi(h);
    });
    c.addEventListener('selectend', () => { rilascia(); if (tieni && tieni.c === c) tieni = null; });
    rig.add(c);
    controller.push({ c, linea });
  });

  const bVR = document.getElementById('entra-vr'); const avvisoVR = document.getElementById('avviso-vr');
  function vrNo(m) { bVR.disabled = true; avvisoVR.textContent = m; }
  function preparaVR() {
    if (!navigator.xr) {
      vrNo(window.isSecureContext ? 'Questo browser non supporta la VR.' : 'La VR funziona solo con il sito in HTTPS.');
      return;
    }
    navigator.xr.isSessionSupported('immersive-vr').then((si) => {
      if (!si) vrNo('Nessun visore qui: apri il sito dal browser del visore.');
      else { bVR.disabled = false; avvisoVR.textContent = ''; }
    }).catch(() => vrNo('La VR non è disponibile su questo browser.'));
  }
  bVR.addEventListener('click', () => {
    navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] }).then((s) => {
      renderer.xr.setReferenceSpaceType('local-floor');
      return renderer.xr.setSession(s);
    }).catch((e) => { avvisoVR.textContent = `VR non avviata: ${e.message}`; });
  });

  renderer.xr.addEventListener('sessionstart', () => {
    scene.remove(tavolo);
    scene.background = new THREE.Color(COL.carta);
    rig.add(libro);
    interno.position.x = 0;
    leggio.modo = 'libro'; leggio.altezza = 1.05; vrScala = 'modello';
    leggio.pos.set(0, 1.05, -0.78); leggio.rot.copy(QL(0));
    libro.position.copy(leggio.pos); libro.quaternion.copy(leggio.rot);
    camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0);
    stanza.visible = true; daCentrare = true;
    finestra.visible = false;
    ridisegna();
    impostaVR();
  });
  renderer.xr.addEventListener('sessionend', () => {
    scene.add(libro); scene.add(tavolo);
    if (mondo) mondoScena.add(mondo.radice);
    pedane.forEach((p) => { p.visible = false; }); pedane = [];
    scene.background = new THREE.Color(0xE9E6D8);
    rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0);
    libro.position.set(0, 0, 0); libro.rotation.set(-0.1, 0, 0);
    stanza.visible = false; mirino.visible = false; leggio.modo = 'libro';
    modellino.clear(); modellino.visible = false; anello.visible = false; tieni = null;
    ridimensiona();
    ridisegna();
  });

  /* Ciclo --------------------------------------------------------------------- */
  const orologio = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(orologio.getDelta(), 0.1);
    const presente = renderer.xr.isPresenting;

    if (giro) {
      giro.t = Math.min(1, giro.t + dt / 0.7);
      const e = giro.t * giro.t * (3 - 2 * giro.t);
      pose(giro.verso ? e : 1 - e);
      if (giro.t >= 1) finisciGiro(giro.verso, giro.nuova);
    }
    if (!presente) {
      const chiuso = spread && spread.chiuso && !(giro && giro.verso);
      interno.position.x += ((chiuso ? -PW / 2 : 0) - interno.position.x) * (1 - Math.exp(-dt * 6));
    }
    if (perno.visible) {
      alzata += (alzaA - alzata) * (1 - Math.exp(-dt * 4));
      perno.rotation.x = -alzata * 2.6;
      aletta.material.opacity = Math.min(1, (1 - alzata) * 4);
    }

    if (salto) {
      salto.tempo += dt;
      const f = salto.tempo / 0.18;
      velo.material.opacity = f < 1 ? f : Math.max(0, 2 - f);
      if (f >= 1 && !salto.fatto) { salto.fatto = true; salto.azione(); }
      if (f >= 2) { salto = null; velo.material.opacity = 0; }
    }

    if (mondo) {
      if (mondo.frame(dt)) mondoSporco = true;
    }

    if (presente) {
      if (daCentrare && camera.position.y > 0.3) {
        // Il leggio si adatta a chi è in piedi e a chi è seduto
        daCentrare = false;
        leggio.altezza = Math.max(0.6, camera.position.y - 0.3);
        leggio.pos.y = leggio.altezza;
      }
      libro.position.lerp(leggio.pos, 1 - Math.exp(-dt * 3));
      libro.quaternion.slerp(leggio.rot, 1 - Math.exp(-dt * 3));
      // Il modellino si alza piano dal libro; poi si gira tenendo il grilletto e ruotando la mano
      const yMod = leggio.altezza + POS_MODELLO.sopra;
      if (modellino.visible) {
        salita = Math.min(1, salita + dt / 1.4);
        const e = salita * salita * (3 - 2 * salita);
        modellino.scale.setScalar(0.15 + 0.85 * e);
        modellino.position.set(0, leggio.altezza + (POS_MODELLO.sopra) * e, POS_MODELLO.z * (0.68 + 0.32 * e));
        presa.position.set(0, yMod, POS_MODELLO.z);
        anello.position.set(0, yMod - 0.12, POS_MODELLO.z);
      }
      if (tieni) {
        tieni.c.getWorldQuaternion(qMano);
        qGiro.multiplyQuaternions(qMano, tieni.inizio);
        qGiro.multiply(qGiro.clone()); // il doppio del gesto: basta poco polso
        modellino.quaternion.multiplyQuaternions(qGiro, tieni.base);
      }
      let mira = null; let sopra = null; let sullaNave = !!tieni;
      controller.forEach(({ c, linea }) => {
        if (!c.visible) return;
        const h = colpoVR(c);
        linea.scale.z = h ? h.distanza : 3;
        if (h && h.stazione) mira = h.punto;
        if (h && h.id) sopra = h;
        if (h && h.presa) sullaNave = true;
      });
      illumina(sopra);
      anello.visible = sullaNave && modellino.visible;
      mirino.visible = !!mira;
      if (mira) mirino.position.copy(mira).setY(mira.y + 0.03);
    } else if (finestra.visible) {
      const k = 1 - Math.exp(-dt * 6); const m = orbita.meta;
      const muove = Math.abs(m.theta - orbita.theta) + Math.abs(m.phi - orbita.phi) + Math.abs(m.r - orbita.r) / m.r + orbita.target.distanceTo(m.target) > 0.001;
      if (muove) {
        orbita.theta += (m.theta - orbita.theta) * k; orbita.phi += (m.phi - orbita.phi) * k;
        orbita.r += (m.r - orbita.r) * k; orbita.target.lerp(m.target, k);
        mondoSporco = true;
      }
      if (mondoSporco && mondo) {
        const s = Math.sin(orbita.phi);
        mondoCam.position.set(orbita.target.x + orbita.r * s * Math.sin(orbita.theta), orbita.target.y + orbita.r * Math.cos(orbita.phi), orbita.target.z + orbita.r * s * Math.cos(orbita.theta));
        mondoCam.lookAt(orbita.target);
        if (mondo.primaFinestra) mondo.primaFinestra(orbita.r);
        renderer.setRenderTarget(rt);
        renderer.render(mondoScena, mondoCam);
        renderer.setRenderTarget(null);
        mondoSporco = false;
      }
    }
    renderer.render(scene, camera);
  });

  /* Avvio ----------------------------------------------------------------------- */
  function sezione(id, cfg) { sezioni[id] = { id, ...cfg }; }
  function avvia() {
    ridimensiona();
    preparaVR();
    const nome = location.hash.slice(1);
    const s = sezioni[nome] || sezioni.copertina;
    sez = s; idx = 0;
    spread = s.spreads()[0];
    dipingi(att, spread);
    latoSx.visible = !spread.chiuso;
    if (spread.chiuso) interno.position.x = -PW / 2;
    usaMondo(spread.mondo ? spread.mondo() : null);
    sistemaInserti();
    document.body.classList.add('pronto');
  }

  return {
    sezione, avvia, vai: (nome, i) => vai(sezioni[nome], i || 0), ridisegna, vista,
    sporco: () => { mondoSporco = true; },
    presente: () => renderer.xr.isPresenting,
    scalaVera: () => vrScala === 'vera',
    sez: () => sez, indice: () => idx,
    prove: { renderer, scene, att: () => att, agisci, camera, libro, controller, rig, giro: () => !!giro, leggio },
  };
})();
