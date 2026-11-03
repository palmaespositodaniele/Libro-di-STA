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
  const SFONDO = 0x2A1A0F; const INCLINA = -0.24; // così si vede lo spessore del volume
  scene.background = new THREE.Color(SFONDO);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.03, 1500);
  const rig = new THREE.Group();
  rig.add(camera);
  scene.add(rig);
  // Nel visore libro e modellino stanno in una postazione che si può ricentrare davanti a chi guarda
  const postazione = new THREE.Group();
  rig.add(postazione);

  /* Tavolo da carteggio, solo su schermo */
  const tavolo = new THREE.Group();
  const piano = Ambiente.tavolo();
  piano.position.z = -0.046;
  tavolo.add(piano);
  tavolo.rotation.x = INCLINA;
  scene.add(tavolo);

  /* Sala nautica e leggio, solo in VR */
  const stanza = Ambiente.stanza();
  stanza.visible = false;
  scene.add(stanza);
  const sostegno = Ambiente.leggio();
  [sostegno.tavola, sostegno.zeppe, sostegno.banco, sostegno.colonna, sostegno.fascio].forEach((o) => { o.visible = false; });
  postazione.add(sostegno.banco, sostegno.colonna, sostegno.fascio);

  /* Libro ---------------------------------------------------------------- */
  const libro = new THREE.Group();
  const interno = new THREE.Group(); // si sposta quando il libro è chiuso
  libro.add(interno);
  libro.rotation.x = INCLINA;
  libro.add(sostegno.tavola, sostegno.zeppe);
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
  // Volume rilegato: la superficie delle pagine resta a Z, lo spessore cresce verso il basso
  const SP = 0.042; const SC = 0.009; const FONDO = Z - SP;
  const fianchi = Tavola.tela(64, 64, (c) => {
    c.fillStyle = '#EFE6CE'; c.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 64; i += 3) { c.fillStyle = i % 2 ? 'rgba(120,100,70,0.4)' : 'rgba(120,100,70,0.2)'; c.fillRect(0, i, 64, 1); }
    const g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,40,20,0.4)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  });
  const pelle = Tavola.tela(512, 700, (c) => {
    c.fillStyle = '#0B2545'; c.fillRect(0, 0, 512, 700);
    for (let i = 0; i < 6000; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.07)'; c.fillRect((i * 7919) % 512, (i * 104729) % 700, 2, 2); }
    c.strokeStyle = '#C9A227'; c.lineWidth = 4; c.strokeRect(7, 7, 498, 686);
  });
  const matPagine = new THREE.MeshBasicMaterial({ map: fianchi });
  const matTaglio = new THREE.MeshBasicMaterial({ color: 0xE9DFC6 });
  const matDorso = new THREE.MeshBasicMaterial({ color: 0x071A33 });
  const matCoperta = [matDorso, matDorso, matDorso, matDorso, new THREE.MeshBasicMaterial({ map: pelle }), matDorso];
  const pagine = (x) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, SP), [matPagine, matPagine, matPagine, matPagine, matTaglio, matTaglio]);
    m.position.set(x, 0, Z - SP / 2 - 0.0004);
    return m;
  };
  const coperta = (x) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(PW + 0.034, PH + 0.042, SC), matCoperta);
    m.position.set(x, 0, FONDO - SC / 2);
    return m;
  };
  const ombraTex = Tavola.tela(256, 340, (c) => {
    c.shadowColor = 'rgba(10,5,0,0.85)'; c.shadowBlur = 26; c.fillStyle = 'rgba(10,5,0,0.85)'; c.fillRect(34, 34, 188, 272);
  });
  const ombra = (x) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(PW * 1.32, PH * 1.26), new THREE.MeshBasicMaterial({ map: ombraTex, transparent: true, depthWrite: false }));
    m.position.set(x + 0.014, -0.02, FONDO - SC - 0.001);
    return m;
  };
  const ombre = [ombra(-PW / 2 - 0.01), ombra(PW / 2 + 0.01)];
  const latoSx = new THREE.Group(); const latoDx = new THREE.Group();
  latoSx.add(ombre[0], coperta(-PW / 2 - 0.015), pagine(-PW / 2), paginaSx);
  latoDx.add(ombre[1], coperta(PW / 2 + 0.015), pagine(PW / 2), paginaDx);
  // Dorso, capitelli e segnalibro
  const dorso = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, PH + 0.042, 16, 1, false, Math.PI / 2, Math.PI), matDorso);
  dorso.position.set(0, 0, FONDO - SC); dorso.rotation.y = Math.PI;
  const capitello = (s) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.005, SP * 0.9), new THREE.MeshBasicMaterial({ color: 0xB23A2E }));
    m.position.set(0, s * (PH / 2 + 0.0015), Z - SP / 2);
    return m;
  };
  const nastro = new THREE.Mesh(new THREE.PlaneGeometry(0.016, 0.1), new THREE.MeshBasicMaterial({ color: 0xB23A2E, side: THREE.DoubleSide }));
  nastro.position.set(0.012, -PH / 2 - 0.04, Z - 0.003); nastro.rotation.z = -0.1;
  interno.add(dorso, capitello(1), capitello(-1), nastro, latoSx, latoDx);

  // Linguette dei capitoli sul taglio destro: portano alla prima lezione pronta del capitolo
  const linguette = Libro.CAPITOLI.map((cap, i) => {
    const tex = Tavola.tela(96, 192, (c) => {
      c.fillStyle = i % 2 ? '#C9A227' : '#0B2545'; c.fillRect(0, 0, 96, 192);
      c.fillStyle = i % 2 ? '#0B2545' : '#E3C878'; c.font = '700 84px Bitter, Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(cap.n), 50, 98);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.09), new THREE.MeshBasicMaterial({ map: tex }));
    m.position.set(PW + 0.035, PH / 2 - 0.09 - i * 0.105, Z - 0.012);
    m.userData.capitolo = cap;
    latoDx.add(m);
    return m;
  });

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
    c.fillStyle = '#0B2545'; c.fillRect(0, 0, 600, 820);
    c.fillStyle = '#FBFAF4'; c.textAlign = 'center';
    c.font = '700 54px Bitter, Georgia, serif'; c.fillText('Solleva l\'aletta', 300, 400);
    c.font = '34px Atkinson, sans-serif'; c.fillText('Dentro c\'è la risposta', 300, 460);
    c.strokeStyle = '#FBFAF4'; c.lineWidth = 3; c.strokeRect(30, 30, 540, 760);
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
  mondoScena.background = new THREE.Color(0xDCE7EA);
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
    // Nel visore c'è sempre il tasto per ricentrarsi
    const ricentro = renderer.xr.isPresenting ? [{ id: 'ricentra', testo: 'Ricentra' }] : [];
    if (!prossimo) return { bottoni: ricentro };
    // Un passaggio non fatto non blocca: si può saltare, ma senza bandiera
    const puo = !prossimo.richiede || prossimo.richiede();
    return { bottoni: [{ id: 'avanti', testo: puo ? 'Avanti ▶' : 'Salta ▶', on: puo }, ...ricentro], avviso: puo ? '' : prossimo.avviso };
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
    if (spread && !spread.chiuso) {
      const t = rc.intersectObjects(linguette, false)[0];
      if (t) {
        const prima = t.object.userData.capitolo.lezioni.find((n) => Libro.PRONTE.includes(n));
        return { id: prima ? `sez:${prima}:0` : 'sez:indice:0', punto: t.point, distanza: t.distance };
      }
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

  /* Modelli che si toccano. mondo.tocchi(vista) dà gli oggetti: vista è 'schermo', 'mini' o 'vera'.
     userData.tocco: un clic manda 't:id1,id2' all'azione della pagina, con tutti gli oggetti sotto il puntatore.
     userData.maniglia: si trascina, mondo.trascina(id, dx, dy); al rilascio arriva 'lascia:id' */
  const rcM = new THREE.Raycaster(); const ndcF = new THREE.Vector2();
  let presaM = null;
  function puntaMondo(raggio, vista) {
    if (!mondo || !mondo.tocchi) return null;
    const hit = raggio.intersectObjects(mondo.tocchi(vista), false);
    if (!hit.length) return null;
    const m = hit.find((x) => x.object.userData.maniglia);
    if (m) return { maniglia: m.object.userData.maniglia, punto: m.point, distanza: m.distance };
    // Conta solo ciò che sta davanti: il raggio attraversa il modello e uscirebbe dal lato opposto
    const ids = [...new Set(hit.filter((x) => x.distance < hit[0].distance * 1.02).map((x) => x.object.userData.tocco).filter(Boolean))];
    return ids.length ? { tocchi: ids, punto: hit[0].point, distanza: hit[0].distance } : null;
  }
  function suFinestra(h) {
    const z = h.zona;
    ndcF.set(((h.x - z.x) / z.w) * 2 - 1, -((h.y - z.y) / z.h) * 2 + 1);
    mondoCam.updateMatrixWorld();
    rcM.setFromCamera(ndcF, mondoCam);
    return puntaMondo(rcM, 'schermo');
  }
  function muoviPresa(dx, dy) {
    if (mondo && mondo.trascina) mondo.trascina(presaM.id, dx, dy);
    mondoSporco = true;
  }
  function lasciaPresa() {
    const id = presaM.id; presaM = null;
    agisci(`lascia:${id}`);
  }

  function agisci(id) {
    if (id === 'avanti') { if (sez.spreads()[idx + 1]) vai(sez, idx + 1, true); return; }
    if (id === 'indietro') { if (idx > 0) vai(sez, idx - 1, false); return; }
    if (id === 'indice') { vai(sezioni.indice, 0, false); return; }
    if (id === 'esci-vr') { const s = renderer.xr.getSession(); if (s) s.end(); return; }
    if (id === 'ricentra') { ricentra(); return; }
    if (id === 'vr:scala') { vrScala = vrScala === 'vera' ? 'modello' : 'vera'; impostaVR(); ridisegna(); return; }
    if (id.startsWith('sez:')) { const [, nome, n] = id.split(':'); vai(sezioni[nome], Number(n || 0)); return; }
    if (spread.azione) spread.azione(id);
    ridisegna();
  }

  function premi(h) {
    if (giro || !h || !h.id) return;
    if (h.id === 'finestra') {
      const t = suFinestra(h);
      if (t && t.maniglia) { presaM = { id: t.maniglia, x: h.x, y: h.y }; return; }
      trascina = { x: h.x, y: h.y, x0: h.x, y0: h.y, tocchi: t && t.tocchi };
      return;
    }
    if (h.zona && h.zona.area) return;
    agisci(h.id);
    if (h.zona && h.zona.ripeti) {
      tenuto = h.id;
      ripetiT = setTimeout(function ancora() { if (tenuto) { agisci(tenuto); ripetiT = setTimeout(ancora, 110); } }, 420);
    }
  }
  function rilascia() {
    tenuto = null; clearTimeout(ripetiT);
    if (presaM) lasciaPresa();
    const t = trascina; trascina = null;
    // Se il puntatore non si è mosso è un clic sul modello, non una rotazione
    if (t && t.tocchi && Math.hypot(t.x - t.x0, t.y - t.y0) < 12) agisci(`t:${t.tocchi.join(',')}`);
  }

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
    if (presaM && h && h.x !== undefined) {
      muoviPresa(h.x - presaM.x, h.y - presaM.y);
      presaM.x = h.x; presaM.y = h.y;
    } else if (trascina && h && h.x !== undefined) {
      orbita.meta.theta -= (h.x - trascina.x) * 0.006;
      orbita.meta.phi = Math.min(1.54, Math.max(0.25, orbita.meta.phi - (h.y - trascina.y) * 0.005));
      trascina.x = h.x; trascina.y = h.y; mondoSporco = true;
    }
    illumina(h);
    const sulModello = h && h.id === 'finestra' && !trascina && !presaM ? suFinestra(h) : null;
    if (mondo && mondo.sopra && !presaM) { if (mondo.sopra(sulModello && sulModello.tocchi)) mondoSporco = true; }
    el.style.cursor = presaM ? 'grabbing' : sulModello ? 'pointer' : h && h.id ? (h.id === 'finestra' ? 'grab' : 'pointer') : 'default';
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
    const largo = stretto ? PW + 0.03 : 2 * PW + 0.2;
    // Intorno si vede il tavolo; in alto resta una striscia libera per il pulsante VR
    const d = Math.max((PH + 0.2) / (2 * tan), largo / (2 * tan * camera.aspect));
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
  postazione.add(modellino);
  const presa = new THREE.Mesh(new THREE.SphereGeometry(0.66, 16, 12), new THREE.MeshBasicMaterial());
  presa.scale.y = 0.42; presa.visible = false;
  postazione.add(presa);
  const anello = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.74, 64), new THREE.MeshBasicMaterial({ color: COL.ocra, side: THREE.DoubleSide }));
  anello.rotation.x = -Math.PI / 2; anello.visible = false;
  postazione.add(anello);
  const POS_MODELLO = { z: -1.3, sopra: 0.4 };
  const POGGIO = 0.29; // dal centro del libro al piano del tavolo
  let salita = 0; let tieni = null;
  const qMano = new THREE.Quaternion(); const qGiro = new THREE.Quaternion();
  // Il libro poggia in basso, inclinato verso chi legge: il testo non resta in scorcio
  const QL = (y) => new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.95, y, 0, 'YXZ'));
  let pedane = []; let daCentrare = false; let salto = null;

  // Il modellino si sposta: tasto laterale per prenderlo, levetta per allontanarlo e girarlo.
  // Lo spostamento resta salvato e vale per tutte le lezioni
  const spostaMod = new THREE.Vector3();
  const salvato = Libro.stato('vr').mod;
  if (Array.isArray(salvato)) spostaMod.fromArray(salvato);
  const salvaSposta = () => Libro.aggiorna('vr', { mod: spostaMod.toArray().map((v) => Math.round(v * 1000) / 1000) });
  function limitaSposta() {
    spostaMod.x = Math.max(-1.6, Math.min(1.6, spostaMod.x));
    const y = leggio.altezza + POS_MODELLO.sopra;
    spostaMod.y = Math.max(0.35 - y, Math.min(2.3 - y, spostaMod.y));
    spostaMod.z = Math.max(-3.2 - POS_MODELLO.z, Math.min(-0.5 - POS_MODELLO.z, spostaMod.z));
  }
  let afferra = null; let daSalvare = false;
  const vMano = new THREE.Vector3(); const assey = new THREE.Vector3(0, 1, 0); const qLeva = new THREE.Quaternion();
  const manoNelRig = (c, v) => postazione.worldToLocal(v.setFromMatrixPosition(c.matrixWorld));

  // Ricentra: libro e modellino tornano davanti a chi guarda, ovunque si sia girato o spostato.
  // A grandezza vera si torna anche sulla pedana, con lo sguardo della pedana
  let stazioneAtt = null;
  const eulero = new THREE.Euler();
  function ricentra() {
    if (!renderer.xr.isPresenting || salto) return;
    salto = {
      tempo: 0, fatto: false,
      azione: () => {
        eulero.setFromQuaternion(camera.quaternion, 'YXZ');
        if (leggio.modo === 'vera' && stazioneAtt) {
          const yaw = stazioneAtt.yaw - eulero.y;
          const p = new THREE.Vector3(camera.position.x, 0, camera.position.z).applyAxisAngle(assey, yaw);
          rig.position.copy(stazioneAtt.pos).sub(p); rig.rotation.set(0, yaw, 0);
        }
        postazione.position.set(camera.position.x, 0, camera.position.z); postazione.rotation.set(0, eulero.y, 0);
        spostaMod.set(0, 0, 0); salvaSposta();
        daCentrare = true;
      },
    };
  }

  let mondoInScena = null;
  function posa(s) { stazioneAtt = s; rig.position.copy(s.pos); rig.rotation.set(0, s.yaw, 0); }
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
    afferra = null;
    stanza.visible = !vera;
    sostegno.zeppe.visible = !vera; sostegno.banco.visible = !vera; sostegno.colonna.visible = vera;
    sostegno.fascio.visible = modo === 'modello';
    // Accanto alla nave il libro si sposta di lato per non coprire la vista
    leggio.pos.set(vera ? -0.66 : 0, leggio.altezza, vera ? -0.5 : -0.62);
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
  let clic = null; let turno = 0;
  // Direzione del controller in angoli: col mouse si trascina in pixel, qui in gradi del polso
  function angoli(c) {
    raggioController(c);
    const d = rc.ray.direction;
    return { a: Math.atan2(d.x, -d.z), b: Math.asin(d.y) };
  }
  function raggioController(c) {
    rotazione.identity().extractRotation(c.matrixWorld);
    rc.ray.origin.setFromMatrixPosition(c.matrixWorld);
    rc.ray.direction.set(0, 0, -1).applyMatrix4(rotazione);
    rc.far = 250;
  }
  function colpoVR(c) {
    raggioController(c);
    const h = colpo();
    // Il raggio verso il modellino può passare dalla pagina.
    // Vincono solo i bottoni; la carta e le zone disegnate lasciano passare il raggio
    const bottone = h && h.id && !(h.zona && h.zona.area);
    if (leggio.modo !== 'libro' && !bottone) {
      const t = puntaMondo(rc, leggio.modo === 'modello' ? 'mini' : 'vera');
      if (t) return t;
    }
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
    c.addEventListener('connected', (e) => { c.visible = true; c.userData.fonte = e.data; });
    c.addEventListener('disconnected', () => { c.visible = false; c.userData.fonte = null; });
    // Tasto laterale: si prende il modellino e lo si porta dove si vuole
    c.addEventListener('squeezestart', () => {
      if (!modellino.visible || salita < 1) return;
      c.updateMatrixWorld(true);
      afferra = { c, da: manoNelRig(c, new THREE.Vector3()), base: spostaMod.clone() };
    });
    c.addEventListener('squeezeend', () => { if (afferra && afferra.c === c) { afferra = null; salvaSposta(); } });
    c.addEventListener('selectstart', () => {
      c.updateMatrixWorld(true); // la posizione di questo istante, non del fotogramma prima
      const h = colpoVR(c);
      if (!h) return;
      if (h.stazione) salto = { tempo: 0, fatto: false, azione: () => posa(h.stazione) };
      else if (h.maniglia) { presaM = { id: h.maniglia, c, ...angoli(c) }; } else if (h.tocchi) {
        // Sul modellino lo stesso grilletto gira: è un clic solo se viene lasciato subito
        if (leggio.modo === 'vera') agisci(`t:${h.tocchi.join(',')}`);
        else { clic = { c, t: performance.now(), tocchi: h.tocchi }; tieni = { c, inizio: c.getWorldQuaternion(new THREE.Quaternion()).invert(), base: modellino.quaternion.clone() }; }
      } else if (h.presa) tieni = { c, inizio: c.getWorldQuaternion(new THREE.Quaternion()).invert(), base: modellino.quaternion.clone() };
      else premi(h);
    });
    c.addEventListener('selectend', () => {
      const pronto = clic && clic.c === c && performance.now() - clic.t < 350 ? clic.tocchi : null;
      if (clic && clic.c === c) clic = null;
      rilascia();
      if (tieni && tieni.c === c) tieni = null;
      if (pronto) agisci(`t:${pronto.join(',')}`);
    });
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
    postazione.add(libro);
    interno.position.x = 0;
    leggio.modo = 'libro'; leggio.altezza = 1.05; vrScala = 'modello';
    postazione.position.set(0, 0, 0); postazione.rotation.set(0, 0, 0); rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0);
    leggio.pos.set(0, 1.05, -0.78); leggio.rot.copy(QL(0));
    libro.position.copy(leggio.pos); libro.quaternion.copy(leggio.rot);
    camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0);
    stanza.visible = true; daCentrare = true;
    sostegno.tavola.visible = true; sostegno.zeppe.visible = true; sostegno.banco.visible = true;
    ombre.forEach((o) => { o.visible = false; });
    finestra.visible = false;
    ridisegna();
    impostaVR();
  });
  renderer.xr.addEventListener('sessionend', () => {
    scene.add(libro); scene.add(tavolo);
    if (mondo) mondoScena.add(mondo.radice);
    pedane.forEach((p) => { p.visible = false; }); pedane = [];
    scene.background = new THREE.Color(SFONDO);
    rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0);
    libro.position.set(0, 0, 0); libro.rotation.set(INCLINA, 0, 0);
    stanza.visible = false; mirino.visible = false; leggio.modo = 'libro';
    [sostegno.tavola, sostegno.zeppe, sostegno.banco, sostegno.colonna, sostegno.fascio].forEach((o) => { o.visible = false; });
    ombre.forEach((o) => { o.visible = true; });
    modellino.clear(); modellino.visible = false; anello.visible = false; tieni = null;
    ridimensiona();
    ridisegna();
  });

  // Levetta: avanti e indietro allontana o avvicina il modellino, di lato lo gira; premuta, ricentra
  function leve(dt) {
    let mossa = false;
    controller.forEach((v) => {
      const f = v.c.userData.fonte; const g = f && f.gamepad;
      if (!g) return;
      const ax = g.axes.length >= 4 ? [g.axes[2], g.axes[3]] : [g.axes[0] || 0, g.axes[1] || 0];
      if (modellino.visible && !afferra && salita >= 1) {
        if (Math.abs(ax[1]) > 0.25) { spostaMod.z += ax[1] * dt * 0.9; limitaSposta(); mossa = true; }
        if (Math.abs(ax[0]) > 0.25) modellino.quaternion.premultiply(qLeva.setFromAxisAngle(assey, -ax[0] * dt * 1.6));
      }
      const premuta = !!(g.buttons[3] && g.buttons[3].pressed);
      if (premuta && !v.levaPremuta) ricentra();
      v.levaPremuta = premuta;
    });
    if (mossa) daSalvare = true;
    else if (daSalvare) { daSalvare = false; salvaSposta(); }
  }

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
        leggio.altezza = Math.max(0.55, camera.position.y - 0.62);
        leggio.pos.y = leggio.altezza;
      }
      libro.position.lerp(leggio.pos, 1 - Math.exp(-dt * 3));
      libro.quaternion.slerp(leggio.rot, 1 - Math.exp(-dt * 3));
      sostegno.colonna.position.set(libro.position.x, 0, libro.position.z - 0.12);
      sostegno.colonna.scale.y = Math.max(0.1, libro.position.y - 0.28);
      sostegno.banco.position.set(0, 0, leggio.pos.z - 0.2);
      sostegno.banco.scale.y = Math.max(0.2, leggio.altezza - POGGIO);
      // Il modellino si alza piano dalla pagina; poi si gira tenendo il grilletto e ruotando la mano
      if (afferra) {
        // La mano porta il modellino; un po' più del gesto, per arrivare lontano senza camminare
        spostaMod.copy(afferra.base).addScaledVector(manoNelRig(afferra.c, vMano).sub(afferra.da), 1.6);
        limitaSposta();
      }
      leve(dt);
      const yMod = leggio.altezza + POS_MODELLO.sopra;
      if (modellino.visible) {
        salita = Math.min(1, salita + dt / 1.4);
        const e = salita * salita * (3 - 2 * salita);
        const s = spostaMod;
        modellino.scale.setScalar(0.15 + 0.85 * e);
        modellino.position.set(s.x * e, leggio.altezza + 0.04 + (POS_MODELLO.sopra - 0.04 + s.y) * e, -0.7 + (POS_MODELLO.z + s.z + 0.7) * e);
        presa.position.set(s.x, yMod + s.y, POS_MODELLO.z + s.z);
        anello.position.set(s.x, yMod + s.y - 0.12, POS_MODELLO.z + s.z);
        // Il fascio di luce esce dal libro: si spegne se il modellino è stato portato altrove
        sostegno.fascio.visible = s.lengthSq() < 0.0225;
        sostegno.fascio.position.set(0, leggio.altezza + 0.02 + (POS_MODELLO.sopra / 2) * e, -0.7 + (POS_MODELLO.z + 0.7) * e * 0.6);
        sostegno.fascio.scale.set(0.2 + 0.8 * e, Math.max(0.02, POS_MODELLO.sopra * e), 0.2 + 0.8 * e);
      }
      if (presaM && presaM.c) {
        const q = angoli(presaM.c);
        muoviPresa((q.a - presaM.a) * 1400, -(q.b - presaM.b) * 1400);
        presaM.a = q.a; presaM.b = q.b;
      }
      if (tieni) {
        tieni.c.getWorldQuaternion(qMano);
        qGiro.multiplyQuaternions(qMano, tieni.inizio);
        qGiro.multiply(qGiro.clone()); // il doppio del gesto: basta poco polso
        modellino.quaternion.multiplyQuaternions(qGiro, tieni.base);
      }
      let mira = null; let sopra = null; let sullaNave = !!tieni; let suTocchi = null;
      turno += 1;
      controller.forEach((v) => {
        const { c, linea } = v;
        if (!c.visible) return;
        // I modelli toccabili hanno molti triangoli: il raggio si ricalcola un fotogramma su tre
        if (turno % 3 === 0 || v.ultimo === undefined) v.ultimo = colpoVR(c);
        const h = v.ultimo;
        linea.scale.z = h ? h.distanza : 3;
        if (h && h.stazione) mira = h.punto;
        if (h && h.id) sopra = h;
        if (h && (h.presa || h.tocchi || h.maniglia)) sullaNave = true;
        if (h && h.tocchi) suTocchi = h.tocchi;
      });
      if (turno % 3 === 0 && mondo && mondo.sopra && !presaM) mondo.sopra(suTocchi);
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
    prove: { renderer, scene, att: () => att, agisci, camera, libro, controller, rig, giro: () => !!giro, leggio, sostegno, modellino, stanza, tavolo, mondo: () => mondo },
  };
})();
