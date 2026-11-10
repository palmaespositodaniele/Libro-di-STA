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
    c.font = '36px Atkinson, sans-serif'; c.fillText('Dentro c\'è la risposta', 300, 460);
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

  /* Etichette del modello nella finestra: mai più piccole delle scritte della pagina (32 px di pagina),
     comunque sia lontana la vista. A grandezza vera tornano alla loro misura */
  let altoFinestra = 760; const vEt = new THREE.Vector3(); const sEt = new THREE.Vector3();
  function etichetteLeggibili(si) {
    if (!mondo) return;
    const minimo = ((Pagina.MINIMO * 136) / 96 / altoFinestra) * 2; // altezza dell'etichetta, in frazione della finestra
    const p5 = mondoCam.projectionMatrix.elements[5];
    mondoCam.updateMatrixWorld(); mondoCam.matrixWorldInverse.copy(mondoCam.matrixWorld).invert();
    mondo.radice.traverse((o) => {
      if (!o.isSprite) return;
      const base = o.userData.scalaBase || (o.userData.scalaBase = o.scale.clone());
      o.scale.copy(base);
      if (!si) return;
      o.updateWorldMatrix(true, false);
      const d = -vEt.setFromMatrixPosition(o.matrixWorld).applyMatrix4(mondoCam.matrixWorldInverse).z;
      if (d <= 0) return;
      const h = (o.getWorldScale(sEt).y * p5) / d;
      if (h < minimo) o.scale.multiplyScalar(minimo / h);
    });
  }

  function usaMondo(m) {
    if (mondo === m) return;
    if (mondo) mondo.radice.removeFromParent();
    mondo = m;
    // Il telaio delle prese: radice e modellino hanno le stesse misure, in metri nave
    if (m) { m.radice.userData.telaio = true; if (m.modellino) m.modellino.userData.telaio = true; }
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
    if (zf) { piazza(finestra, zf); altoFinestra = zf.h; mondoCam.aspect = zf.w / zf.h; mondoCam.updateProjectionMatrix(); mondoSporco = true; }
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
    // Le sfere nascoste non si prendono
    const visibile = (o) => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
    const hit = raggio.intersectObjects(mondo.tocchi(vista), false).filter((x) => !x.object.userData.maniglia || visibile(x.object));
    if (!hit.length) return null;
    const m = hit.find((x) => x.object.userData.maniglia);
    if (m) return { maniglia: m.object.userData.maniglia, punto: m.point, distanza: m.distance, oggetto: m.object };
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

  /* Oggetti spostati a mano. userData.vincolo dice come si muove l'oggetto preso, nel telaio del modello
     (il primo antenato con userData.telaio: x lungo la nave, y in alto, z a dritta), così la presa
     segue il puntatore comunque il modello sia girato:
       { asse: [x, y, z] }            scorre lungo una retta: arriva info.s, lo spostamento lungo l'asse
       { piano: [nx, ny, nz] }        scorre su un piano: info.v, lo spostamento (info.p il punto)
       { giro: [ax, ay, az], centro } gira intorno a un asse: info.ang, l'angolo in radianti (destrorso)
       { sfera: { centro, r } }       corre su una sfera: info.p, il punto indicato
     mondo.trascina(id, 0, 0, info) riceve ogni passo; al rilascio arriva 'lascia:id'.
     La sfera deve muoversi con l'oggetto: a ogni passo si riparte da dove la lezione l'ha messa,
     così i limiti la fermano e il puntatore la riprende senza scarti */
  const inv = new THREE.Matrix4(); const rLoc = new THREE.Ray(); const vA = new THREE.Vector3(); const vB = new THREE.Vector3();
  const V3 = (a) => new THREE.Vector3().fromArray(a || [0, 0, 0]);
  function telaio(o) { let p = o.parent; while (p && !p.userData.telaio) p = p.parent; return p || o.parent; }
  function raggioLocale(fr, raggio) {
    fr.updateMatrixWorld(); inv.copy(fr.matrixWorld).invert();
    rLoc.copy(raggio).applyMatrix4(inv); rLoc.direction.normalize();
    return rLoc;
  }
  // Il punto del vincolo indicato dal raggio, riportato al centro della sfera presa
  function puntoVincolo(p, r) {
    const v = p.vincolo; const c = p.base.clone().add(p.off);
    let q = null;
    if (v.asse) {
      const u = V3(v.asse).normalize(); const b = u.dot(r.direction); const den = 1 - b * b;
      if (den < 0.06) return null; // asse quasi lungo lo sguardo: non si può leggere
      const w = vA.copy(c).sub(r.origin); const t = (b * r.direction.dot(w) - u.dot(w)) / den;
      q = c.addScaledVector(u, t);
    }
    if (v.piano) {
      const n = V3(v.piano).normalize();
      const den = n.dot(r.direction); if (Math.abs(den) < 0.05) return null;
      const t = n.dot(vA.copy(c).sub(r.origin)) / den; if (t < 0) return null;
      q = r.origin.clone().addScaledVector(r.direction, t);
    }
    if (v.sfera) {
      // Sulla sfera; fuori dal bordo si resta sul bordo visibile
      const o = V3(v.sfera.centro);
      q = r.intersectSphere(new THREE.Sphere(o, v.sfera.r), new THREE.Vector3());
      if (!q) { const t = vA.copy(o).sub(r.origin).dot(r.direction); q = r.origin.clone().addScaledVector(r.direction, t).sub(o).setLength(v.sfera.r).add(o); }
      return q;
    }
    return q && q.sub(p.off);
  }
  // Base del giro: n l'asse, e1 ed e2 nel piano, angolo positivo = rotazione destrorsa attorno a n
  function baseGiro(v) {
    const n = V3(v.giro).normalize();
    const e1 = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0).cross(n).normalize() : new THREE.Vector3(1, 0, 0).cross(n).normalize();
    return { n, e1, e2: n.clone().cross(e1), c: V3(v.centro) };
  }
  function angoloGiro(v, q) {
    const b = baseGiro(v); const d = q.clone().sub(b.c);
    return Math.atan2(d.dot(b.e2), d.dot(b.e1));
  }
  /* Il punto preso corre su un cerchio attorno all'asse: si cerca, vicino all'angolo di adesso,
     il punto del cerchio più vicino al raggio. Funziona anche guardando il cerchio di taglio */
  function angoloSulRaggio(p, r) {
    const b = baseGiro(p.vincolo); let best = p.ang; let dmin = Infinity;
    for (let i = -180; i <= 180; i++) {
      const a = p.ang + (i * Math.PI) / 360;
      const q = b.c.clone().addScaledVector(b.e1, p.rho * Math.cos(a)).addScaledVector(b.e2, p.rho * Math.sin(a)).addScaledVector(b.n, p.alto);
      const w = q.sub(r.origin); const t = w.dot(r.direction); const d = w.lengthSq() - t * t;
      if (d < dmin) { dmin = d; best = a; }
    }
    return best;
  }
  function iniziaPresa(t, extra) {
    const v = t.oggetto && t.oggetto.userData.vincolo;
    presaM = { id: t.maniglia, ...extra };
    if (!v) return;
    const fr = telaio(t.oggetto);
    presaM.vincolo = v; presaM.fr = fr; presaM.obj = t.oggetto; presaM.base = fr.worldToLocal(t.oggetto.getWorldPosition(new THREE.Vector3()));
    presaM.off = fr.worldToLocal(t.punto.clone()).sub(presaM.base);
    if (v.giro) {
      const b = baseGiro(v); const d = presaM.base.clone().sub(b.c);
      presaM.alto = d.dot(b.n); presaM.rho = Math.max(1e-6, Math.hypot(d.dot(b.e1), d.dot(b.e2))); presaM.ang = angoloGiro(v, presaM.base);
    }
  }
  function muoviVincolo(raggio) {
    const p = presaM; const r = raggioLocale(p.fr, raggio);
    // La presa segue l'oggetto: si riparte sempre da dov'è davvero (i limiti della lezione lo fermano)
    p.base = p.fr.worldToLocal(p.obj.getWorldPosition(new THREE.Vector3()));
    const info = {};
    if (p.vincolo.giro) {
      p.ang = angoloGiro(p.vincolo, p.base);
      const a = angoloSulRaggio(p, r); info.ang = a - p.ang;
      if (Math.abs(info.ang) < 1e-9) return;
    } else {
      const q = puntoVincolo(p, r);
      if (!q) return;
      info.p = q;
      if (p.vincolo.asse) info.s = vB.copy(q).sub(p.base).dot(V3(p.vincolo.asse).normalize());
      if (p.vincolo.piano) info.v = q.clone().sub(p.base);
    }
    if (mondo && mondo.trascina) mondo.trascina(p.id, 0, 0, info);
    mondoSporco = true;
  }

  // Presa sul modello della finestra della pagina: il punto sulla carta diventa un raggio della sua camera
  function muoviFinestra(h) {
    const z = presaM.zona;
    ndcF.set(((h.x - z.x) / z.w) * 2 - 1, -((h.y - z.y) / z.h) * 2 + 1);
    mondoCam.updateMatrixWorld(); rcM.setFromCamera(ndcF, mondoCam);
    muoviVincolo(rcM.ray);
  }

  /* Cursori sulla pagina: la posizione lungo la barra diventa un valore da 0 a 1 */
  let scorre = null;
  function aggiornaCursore(h) {
    if (!scorre || !h || h.lato !== scorre.lato || h.x === undefined) return;
    const z = scorre.zona; const n = z.passi;
    const f = Math.round(Math.max(0, Math.min(1, (h.x - z.cx0) / (z.cx1 - z.cx0))) * n) / n;
    if (f === scorre.f) return;
    scorre.f = f; agisci(`sl:${z.id}:${f}`);
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
    if (h.zona && h.zona.cursore) { scorre = { zona: h.zona, lato: h.lato, f: null }; aggiornaCursore(h); return; }
    if (h.id === 'finestra') {
      const t = suFinestra(h);
      if (t && t.maniglia) { iniziaPresa(t, { x: h.x, y: h.y, zona: h.zona }); return; }
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
    if (scorre) { const id = scorre.zona.id; scorre = null; agisci(`sl:${id}:fine`); }
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
  /* Su schermo il libro si sposta trascinando la carta o il tavolo, si ingrandisce con la rotella
     o con due dita; doppio clic fuori dai bottoni per tornare all'inquadratura iniziale */
  const vistaSchermo = { x: 0, y: 0, zoom: 1 };
  const dita = new Map(); let sposta = null; let pizzico = null;
  const libera = (h) => !h || !h.id || (h.zona && h.zona.area && h.id !== 'finestra');
  function limitaVista() {
    vistaSchermo.zoom = Math.min(3, Math.max(0.6, vistaSchermo.zoom));
    vistaSchermo.x = Math.max(-PW - 0.1, Math.min(PW + 0.1, vistaSchermo.x));
    vistaSchermo.y = Math.max(-PH / 2, Math.min(PH / 2, vistaSchermo.y));
  }
  const distDita = () => { const [a, b] = [...dita.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId); raggioSchermo(e);
    dita.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dita.size === 2) { sposta = null; pizzico = { d0: distDita(), z0: vistaSchermo.zoom }; return; }
    const h = colpo();
    if (libera(h)) sposta = { x: e.clientX, y: e.clientY };
    premi(h);
  });
  el.addEventListener('pointermove', (e) => {
    if (dita.has(e.pointerId)) dita.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pizzico && dita.size === 2) { vistaSchermo.zoom = pizzico.z0 * (distDita() / Math.max(1, pizzico.d0)); limitaVista(); ridimensiona(); return; }
    if (sposta) {
      // Il libro segue il dito: lo spostamento in pixel diventa spostamento della camera
      const k = (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z) / el.clientHeight;
      vistaSchermo.x -= (e.clientX - sposta.x) * k; vistaSchermo.y += (e.clientY - sposta.y) * k;
      sposta.x = e.clientX; sposta.y = e.clientY; limitaVista(); ridimensiona();
      el.style.cursor = 'grabbing';
      return;
    }
    raggioSchermo(e);
    const h = colpo();
    if (scorre) { aggiornaCursore(h); el.style.cursor = 'grabbing'; return; }
    if (presaM && presaM.vincolo && h && h.x !== undefined) {
      muoviFinestra(h);
    } else if (presaM && h && h.x !== undefined) {
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
  const fineDito = (e) => { dita.delete(e.pointerId); if (dita.size < 2) pizzico = null; sposta = null; rilascia(); };
  el.addEventListener('pointerup', fineDito);
  el.addEventListener('pointercancel', fineDito);
  el.addEventListener('wheel', (e) => {
    raggioSchermo(e);
    const h = colpo();
    e.preventDefault();
    if (h && h.id === 'finestra') { orbita.meta.r = Math.min(260, Math.max(1.5, orbita.meta.r * Math.exp(e.deltaY * 0.001))); mondoSporco = true; return; }
    vistaSchermo.zoom *= Math.exp(-e.deltaY * 0.0012); limitaVista(); ridimensiona();
  }, { passive: false });
  el.addEventListener('dblclick', (e) => {
    raggioSchermo(e);
    if (!libera(colpo())) return;
    vistaSchermo.x = 0; vistaSchermo.y = 0; vistaSchermo.zoom = 1; ridimensiona();
  });
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
    camera.position.set(x + vistaSchermo.x, 0.03 + vistaSchermo.y, d / vistaSchermo.zoom);
    camera.rotation.set(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(ridimensiona).observe(contenitore);
  document.getElementById('pagina-sx').addEventListener('click', () => { focus = -1; vistaSchermo.x = 0; ridimensiona(); });
  document.getElementById('pagina-dx').addEventListener('click', () => { focus = 1; vistaSchermo.x = 0; ridimensiona(); });

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

  /* Anche il libro si sposta: puntalo e stringi il tasto laterale. Con la levetta, tenendolo,
     si ingrandisce o si rimpicciolisce; con due mani si allarga o si stringe. Posto e misura restano salvati:
     uno per il libro accanto al modellino, uno per il libro accanto alla nave a grandezza vera */
  const libroVR = { mio: {}, scala: 1 };
  const salvatoLibro = Libro.stato('vr').libro;
  if (salvatoLibro && typeof salvatoLibro === 'object') { libroVR.mio = salvatoLibro.mio || {}; libroVR.scala = salvatoLibro.scala || 1; }
  const salvaLibro = () => Libro.aggiorna('vr', { libro: { mio: libroVR.mio, scala: Math.round(libroVR.scala * 1000) / 1000 } });
  const chiaveLibro = (modo) => (modo === 'vera' ? 'vera' : 'vicino');
  let presaLibro = null;
  const UNO = new THREE.Vector3(1, 1, 1);
  const manoInPostazione = (c, m) => m.copy(postazione.matrixWorld).invert().multiply(c.matrixWorld);
  const mMano = new THREE.Matrix4(); const mLibro = new THREE.Matrix4(); const vScala = new THREE.Vector3();
  function prendiLibro(c) {
    manoInPostazione(c, mMano).invert();
    presaLibro = { c, rel: mMano.multiply(mLibro.compose(libro.position, libro.quaternion, UNO)).clone(), due: null };
  }
  function seguiLibro() {
    if (presaLibro.due) {
      // Due mani: la distanza tra i controller fa la misura del libro
      const d = vMano.setFromMatrixPosition(presaLibro.c.matrixWorld).distanceTo(vScala.setFromMatrixPosition(presaLibro.due.c.matrixWorld));
      libroVR.scala = Math.min(2.5, Math.max(0.35, presaLibro.due.s0 * (d / presaLibro.due.d0)));
    }
    manoInPostazione(presaLibro.c, mMano).multiply(presaLibro.rel).decompose(leggio.pos, leggio.rot, vScala);
    libro.position.copy(leggio.pos); libro.quaternion.copy(leggio.rot);
  }
  function lasciaLibro() {
    libroVR.mio[chiaveLibro(leggio.modo)] = { p: leggio.pos.toArray().map((v) => Math.round(v * 1000) / 1000), q: leggio.rot.toArray().map((v) => Math.round(v * 10000) / 10000) };
    leggio.libero = true; presaLibro = null; salvaLibro(); sostegnoLibro();
  }
  // Libro spostato a mano: niente banco sotto, solo la colonna che lo regge
  function sostegnoLibro() {
    const vera = leggio.modo === 'vera';
    sostegno.banco.visible = !vera && !leggio.libero; sostegno.zeppe.visible = !vera && !leggio.libero;
    sostegno.colonna.visible = vera || leggio.libero;
  }
  function mettiLeggio(modo, z) {
    const m = libroVR.mio[chiaveLibro(modo)];
    leggio.libero = !!m;
    if (m) { leggio.pos.fromArray(m.p); leggio.rot.fromArray(m.q); } else {
      const vera = modo === 'vera';
      leggio.pos.set(vera ? -0.66 : 0, leggio.altezza, z !== undefined ? z : vera ? -0.5 : -0.62);
      leggio.rot.copy(QL(vera ? 0.75 : 0));
    }
  }
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
        // Il libro torna al suo posto davanti a chi guarda; la misura scelta resta
        libroVR.mio = {}; salvaLibro(); mettiLeggio(leggio.modo); sostegnoLibro();
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
      etichetteLeggibili(false);
      scene.add(mondo.radice);
      pedane = mondo.stazioni.map((s) => { s.pedana.userData.stazione = s; if (!s.pedana.parent) scene.add(s.pedana); s.pedana.visible = true; return s.pedana; });
      posa(mondo.stazioni[0]);
    } else {
      if (mondo) mondoScena.add(mondo.radice);
      rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0);
    }
    afferra = null; presaLibro = null;
    stanza.visible = !vera;
    sostegno.fascio.visible = modo === 'modello';
    // Accanto alla nave il libro si sposta di lato per non coprire la vista
    mettiLeggio(modo);
    sostegnoLibro();
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
      c.updateMatrixWorld(true);
      // Prima il libro, se il raggio lo tocca; la seconda mano sul libro lo allarga o lo stringe
      raggioController(c);
      if (rc.intersectObject(libro, true)[0]) {
        if (presaLibro && presaLibro.c !== c) {
          const d = vMano.setFromMatrixPosition(presaLibro.c.matrixWorld).distanceTo(vScala.setFromMatrixPosition(c.matrixWorld));
          presaLibro.due = { c, d0: Math.max(0.05, d), s0: libroVR.scala };
        } else prendiLibro(c);
        return;
      }
      if (!modellino.visible || salita < 1) return;
      afferra = { c, da: manoNelRig(c, new THREE.Vector3()), base: spostaMod.clone() };
    });
    c.addEventListener('squeezeend', () => {
      if (presaLibro && presaLibro.due && presaLibro.due.c === c) { presaLibro.due = null; salvaLibro(); return; }
      if (presaLibro && presaLibro.c === c) { lasciaLibro(); return; }
      if (afferra && afferra.c === c) { afferra = null; salvaSposta(); }
    });
    c.addEventListener('selectstart', () => {
      c.updateMatrixWorld(true); // la posizione di questo istante, non del fotogramma prima
      const h = colpoVR(c);
      if (!h) return;
      if (h.stazione) salto = { tempo: 0, fatto: false, azione: () => posa(h.stazione) };
      else if (h.maniglia) { iniziaPresa(h, { c, ...angoli(c) }); } else if (h.tocchi) {
        // Sul modellino lo stesso grilletto gira: è un clic solo se viene lasciato subito
        if (leggio.modo === 'vera') agisci(`t:${h.tocchi.join(',')}`);
        else { clic = { c, t: performance.now(), tocchi: h.tocchi }; tieni = { c, inizio: c.getWorldQuaternion(new THREE.Quaternion()).invert(), base: modellino.quaternion.clone() }; }
      } else if (h.presa) tieni = { c, inizio: c.getWorldQuaternion(new THREE.Quaternion()).invert(), base: modellino.quaternion.clone() };
      else { premi(h); if (scorre) scorre.c = c; if (presaM && !presaM.c) Object.assign(presaM, { c }, angoli(c)); }
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
    presaLibro = null; mettiLeggio('libro', -0.78);
    libro.position.copy(leggio.pos); libro.quaternion.copy(leggio.rot); libro.scale.setScalar(libroVR.scala);
    camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0);
    stanza.visible = true; daCentrare = true;
    sostegno.tavola.visible = true; sostegnoLibro();
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
    libro.position.set(0, 0, 0); libro.rotation.set(INCLINA, 0, 0); libro.scale.setScalar(1); presaLibro = null;
    stanza.visible = false; mirino.visible = false; leggio.modo = 'libro';
    [sostegno.tavola, sostegno.zeppe, sostegno.banco, sostegno.colonna, sostegno.fascio].forEach((o) => { o.visible = false; });
    ombre.forEach((o) => { o.visible = true; });
    modellino.clear(); modellino.visible = false; anello.visible = false; tieni = null;
    ridimensiona();
    ridisegna();
  });

  /* Levetta: avanti e indietro allontana o avvicina il modellino, di lato lo gira; premuta, ricentra.
     Tenendo il libro col tasto laterale, avanti e indietro lo ingrandisce o lo rimpicciolisce.
     A grandezza vera si esplora: levetta sinistra cammina dove si guarda, levetta destra
     di lato gira a scatti di 30°, avanti e indietro sale e scende */
  const avantiV = new THREE.Vector3(); const latoV = new THREE.Vector3(); const occhio = new THREE.Vector3();
  const VEL = 3.2; const VEL_SU = 2.4; const SCATTO = Math.PI / 6;
  function esplora(v, ax, dt, sinistra) {
    const forza = (a) => (Math.abs(a) < 0.2 ? 0 : (a - Math.sign(a) * 0.2) / 0.8);
    if (sinistra) {
      const x = forza(ax[0]); const y = forza(ax[1]);
      if (!x && !y) return;
      camera.getWorldDirection(avantiV); avantiV.y = 0;
      if (avantiV.lengthSq() < 1e-6) return;
      avantiV.normalize(); latoV.set(-avantiV.z, 0, avantiV.x);
      // Più si spinge la levetta, più si va veloci: a fondo corsa quasi il doppio
      const k = VEL * dt * (1 + Math.hypot(x, y));
      rig.position.addScaledVector(avantiV, -y * k).addScaledVector(latoV, x * k);
      return;
    }
    const y = forza(ax[1]);
    if (y) rig.position.y = Math.max(0, Math.min(60, rig.position.y - y * VEL_SU * dt));
    // Giro a scatti, attorno a dove si trova la testa: è il più comodo per lo stomaco
    const a = Math.abs(ax[0]) > 0.7 ? Math.sign(ax[0]) : 0;
    if (a && !v.scattato) {
      camera.getWorldPosition(occhio);
      rig.position.sub(occhio).applyAxisAngle(assey, -a * SCATTO).add(occhio);
      rig.rotation.y -= a * SCATTO;
    }
    v.scattato = Math.abs(ax[0]) > 0.4;
  }
  function leve(dt) {
    let mossa = false;
    const vere = controller.filter((v) => v.c.userData.fonte && v.c.userData.fonte.gamepad);
    controller.forEach((v) => {
      const f = v.c.userData.fonte; const g = f && f.gamepad;
      if (!g) return;
      const ax = g.axes.length >= 4 ? [g.axes[2], g.axes[3]] : [g.axes[0] || 0, g.axes[1] || 0];
      if (presaLibro && presaLibro.c === v.c && !presaLibro.due) {
        if (Math.abs(ax[1]) > 0.2) libroVR.scala = Math.min(2.5, Math.max(0.35, libroVR.scala * Math.exp(-ax[1] * dt * 1.2)));
      } else if (leggio.modo === 'vera' && !salto) {
        // Con un controller solo, quello cammina
        esplora(v, ax, dt, f.handedness !== 'right' || vere.length < 2);
      }
      if (modellino.visible && !afferra && salita >= 1 && !(presaLibro && presaLibro.c === v.c)) {
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
        if (!leggio.libero) leggio.pos.y = leggio.altezza;
      }
      if (presaLibro) seguiLibro();
      libro.position.lerp(leggio.pos, 1 - Math.exp(-dt * 3));
      libro.quaternion.slerp(leggio.rot, 1 - Math.exp(-dt * 3));
      libro.scale.setScalar(libro.scale.x + (libroVR.scala - libro.scale.x) * (1 - Math.exp(-dt * 8)));
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
      if (scorre && scorre.c) { raggioController(scorre.c); aggiornaCursore(colpo()); }
      if (presaM && presaM.c && presaM.vincolo) {
        raggioController(presaM.c);
        if (presaM.zona) { const hf = colpo(); if (hf && hf.x !== undefined) muoviFinestra(hf); } else muoviVincolo(rc.ray);
      } else if (presaM && presaM.c) {
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
        etichetteLeggibili(true);
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
    prove: { renderer, scene, att: () => att, agisci, camera, libro, controller, rig, giro: () => !!giro, leggio, sostegno, modellino, stanza, tavolo, mondo: () => mondo, camMondo: mondoCam, rt: () => rt,
      // Prova delle prese: punta la sfera dal centro della finestra, poi muove il puntatore a (x, y) in coordinate -1..1
      fissa() {
        const m = orbita.meta; Object.assign(orbita, { theta: m.theta, phi: m.phi, r: m.r }); orbita.target.copy(m.target);
        const s = Math.sin(orbita.phi);
        mondoCam.position.set(orbita.target.x + orbita.r * s * Math.sin(orbita.theta), orbita.target.y + orbita.r * Math.cos(orbita.phi), orbita.target.z + orbita.r * s * Math.cos(orbita.theta));
        mondoCam.lookAt(orbita.target); mondoCam.updateMatrixWorld();
        etichetteLeggibili(true);
      },
      prendi(o) { mondoCam.updateMatrixWorld(); iniziaPresa({ maniglia: o.userData.maniglia, oggetto: o, punto: o.getWorldPosition(new THREE.Vector3()) }, {}); },
      punta(x, y) { ndcF.set(x, y); mondoCam.updateMatrixWorld(); rcM.setFromCamera(ndcF, mondoCam); muoviVincolo(rcM.ray); },
      dove(o) { mondoCam.updateMatrixWorld(); return o.getWorldPosition(new THREE.Vector3()).project(mondoCam); },
      lascia() { if (presaM) lasciaPresa(); } },
  };
})();
