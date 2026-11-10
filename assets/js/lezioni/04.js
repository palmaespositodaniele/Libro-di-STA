/* Lezione 4: la geometria dello scafo. I moti nel modello sono schematici; dati solo dalle slide 15 e seguenti */
(function () {
  const N = 4;
  const { COL, tratto, segmento, etichetta, pedana, maniglia, cuoci } = Tavola;
  const { C } = Pagina;
  const { insellatura, fondo, mezza, ascissa, L } = Scafo;
  const Y_ACQUA = 6;

  const MISSIONI = [
    { id: 'rotazioni', testo: 'Attiva le tre rotazioni: rollio, beccheggio, imbardata.' },
    { id: 'traslazioni', testo: 'Attiva le tre traslazioni: avanzo, deriva, sussulto.' },
    { id: 'piani', testo: 'Taglia lo scafo con i tre piani.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Il beccheggio è la rotazione attorno all\'asse…', scelte: ['x', 'y', 'z'], giusta: 1, perche: 'Attorno all\'asse y: l\'inclinazione di prua e di poppa.' },
    { n: 2, testo: 'La traslazione lungo l\'asse z è…', scelte: ['Avanzo', 'Deriva', 'Sussulto'], giusta: 2, perche: 'Il sussulto: verso l\'alto o verso il basso.' },
    { n: 3, testo: 'Il piano parallelo a yz produce la sezione…', scelte: ['Longitudinale', 'Trasversale', 'Di galleggiamento'], giusta: 1, perche: 'La sezione trasversale (station), sul body plan.' },
    { n: 4, testo: 'Che cosa cambia nelle carene isocarene?', scelte: ['Il volume', 'L\'inclinazione', 'Il peso a bordo'], giusta: 1, perche: 'Stesso volume, diversa inclinazione: il peso a bordo non cambia.' },
    { n: 5, testo: 'La forma del ponte più basso a centro nave si chiama…', scelte: ['Insellatura', 'Stellatura', 'Svasatura'], giusta: 0, perche: 'È l\'insellatura (sheer).' },
    { n: 6, testo: 'In che scala è tradizionalmente disegnato il piano di costruzione?', scelte: ['1:10', '1:100', '1:1000'], giusta: 1, perche: 'Tradizionalmente in scala 1:100.' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  // Slide 5. asse: quale asse si illumina; muovi: spostamento schematico al tempo f (-1..1)
  const MOTI = {
    avanzo: { nome: 'Avanzo', asse: 'x', tipo: 't', testo: '**Avanzo**: traslazione lungo l\'asse x, cioè lungo la lunghezza della nave. {{slide 5}}', muovi: (g, f) => { g.position.x += f * 9; } },
    deriva: { nome: 'Deriva', asse: 'y', tipo: 't', testo: '**Deriva** (o scarroccio): traslazione lungo l\'asse y, in direzione trasversale. {{slide 5}}', muovi: (g, f) => { g.position.z += f * 7; } },
    sussulto: { nome: 'Sussulto', asse: 'z', tipo: 't', testo: '**Sussulto**: traslazione lungo l\'asse z, verso l\'alto o verso il basso. {{slide 5}}', muovi: (g, f) => { g.position.y += f * 1.6; } },
    rollio: { nome: 'Rollio', asse: 'x', tipo: 'r', testo: '**Rollio**: rotazione attorno all\'asse x, l\'inclinazione da un lato all\'altro. {{slide 5}}', muovi: (g, f) => { g.rotation.x = f * 0.3; } },
    beccheggio: { nome: 'Beccheggio', asse: 'y', tipo: 'r', testo: '**Beccheggio**: rotazione attorno all\'asse y, l\'inclinazione di prua e di poppa. {{slide 5}}', muovi: (g, f) => { g.rotation.z = f * 0.1; } },
    imbardata: { nome: 'Imbardata', asse: 'z', tipo: 'r', testo: '**Accostata** (o imbardata): rotazione attorno all\'asse z, la variazione della rotta. {{slide 5}}', muovi: (g, f) => { g.rotation.y = f * 0.35; } },
  };
  // Slide 7
  const PIANI = {
    orizzontale: { nome: 'Orizzontale', testo: '**Piano orizzontale** (*horizontal plan*), parallelo a xy: produce la figura di galleggiamento, il cui contorno è la linea d\'acqua (*waterline*). {{slide 7}}', sezione: 'figura di galleggiamento', min: 1, max: 8, passo: 1, val: 6, unita: 'altezza' },
    longitudinale: { nome: 'Longitudinale', testo: '**Piano longitudinale** (*sheer plan*), parallelo a xz: produce la sezione longitudinale (*buttock*), che rivela il profilo e le forme delle estremità. {{slide 7}}', sezione: 'sezione longitudinale (buttock)', min: 0, max: 6, passo: 1, val: 0, unita: 'distanza dal centro' },
    trasversale: { nome: 'Trasversale', testo: '**Piano trasversale** (*body plan*), parallelo a yz: produce la sezione trasversale (*station*), fondamentale per la stabilità statica. {{slide 7}}', sezione: 'sezione trasversale (station)', min: 1, max: 19, passo: 1, val: 10, unita: 'posizione da poppa' },
  };

  const s = { moto: null, t: 0, piano: null, testo: null };
  const provati = new Set();

  /* Sezioni dello scafo ---------------------------------------------------------- */
  function puntiSezione(id, v) {
    const p = [];
    if (id === 'orizzontale') {
      const y = v;
      const lato = [];
      for (let i = 0; i <= 90; i++) { const u = i / 90; if (y >= fondo(u) && y <= insellatura(u)) lato.push([ascissa(u, y), y, mezza(u, y)]); }
      lato.forEach((q) => p.push(q));
      for (let i = lato.length - 1; i >= 0; i--) p.push([lato[i][0], lato[i][1], -lato[i][2]]);
    } else if (id === 'trasversale') {
      const u = v / 20; const k = fondo(u); const h = insellatura(u);
      for (let j = 20; j >= -20; j--) {
        const y = k + (Math.abs(j) / 20) * (h - k);
        p.push([ascissa(u, y), y, Math.sign(j || 1) * mezza(u, y)]);
      }
    } else {
      const c = v; const sotto = []; const sopra = [];
      for (let i = 0; i <= 90; i++) {
        const u = i / 90; const k = fondo(u); const h = insellatura(u);
        if (mezza(u, h) < c) continue;
        let y = k;
        while (y < h && mezza(u, y) < c) y += 0.1;
        sotto.push([ascissa(u, y), y, c]); sopra.push([ascissa(u, h), h, c]);
      }
      sotto.forEach((q) => p.push(q));
      for (let i = sopra.length - 1; i >= 0; i--) p.push(sopra[i]);
    }
    return p.filter((q, i) => i === 0 || Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1], q[2] - p[i - 1][2]) > 0.001);
  }

  function pianoDiTaglio(id, v) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: COL.ocra, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
    if (id === 'orizzontale') { m.scale.set(112, 34, 1); m.rotation.x = -Math.PI / 2; m.position.set(L / 2, v, 0); } else if (id === 'longitudinale') { m.scale.set(112, 18, 1); m.position.set(L / 2, 6, v); } else { const u = v / 20; m.scale.set(34, 18, 1); m.rotation.y = Math.PI / 2; m.position.set(ascissa(u, 6), 6, 0); }
    return m;
  }

  /* Disegno della sezione sulla pagina, come sul piano di costruzione */
  const LW = 1040; const LH = 440;
  const telaLente = document.createElement('canvas');
  telaLente.width = LW; telaLente.height = LH;
  const texLente = new THREE.CanvasTexture(telaLente);
  texLente.colorSpace = THREE.SRGBColorSpace;

  function disegnaLente() {
    const c = telaLente.getContext('2d');
    c.fillStyle = C.carta; c.fillRect(0, 0, LW, LH);
    c.strokeStyle = C.griglia; c.lineWidth = 2; c.beginPath();
    for (let x = 40; x < LW; x += 40) { c.moveTo(x, 0); c.lineTo(x, LH); }
    for (let y = 40; y < LH; y += 40) { c.moveTo(0, y); c.lineTo(LW, y); }
    c.stroke();
    c.fillStyle = C.ink; c.font = '36px Disegno, cursive'; c.textAlign = 'left';
    const pn = s.piano && PIANI[s.piano];
    c.fillText(pn ? pn.sezione : 'piano di costruzione: scegli un piano', 18, 38);
    if (pn) {
      const pt = puntiSezione(s.piano, pn.val);
      let prX; let prY; let k;
      if (s.piano === 'trasversale') { k = 26; prX = (q) => LW / 2 + q[2] * k; prY = (q) => LH - 40 - q[1] * k; } else if (s.piano === 'longitudinale') { k = 10; prX = (q) => 30 + q[0] * k; prY = (q) => LH - 90 - q[1] * k * 2; } else { k = 10; prX = (q) => 30 + q[0] * k; prY = (q) => LH / 2 + 20 + q[2] * k; }
      c.fillStyle = 'rgba(200,150,43,0.28)'; c.strokeStyle = C.ink; c.lineWidth = 5; c.lineJoin = 'round';
      c.beginPath();
      pt.forEach((q, i) => { if (i === 0) c.moveTo(prX(q), prY(q)); else c.lineTo(prX(q), prY(q)); });
      c.closePath(); c.fill(); c.stroke();
      if (s.piano === 'longitudinale') { c.fillStyle = C.ink2; c.font = '36px Disegno, cursive'; c.fillText('altezze raddoppiate per leggerle', LW - 400, LH - 20); }
    }
    c.strokeStyle = C.ink; c.lineWidth = 4; c.strokeRect(2, 2, LW - 4, LH - 4);
    texLente.needsUpdate = true;
  }

  /* Modello ------------------------------------------------------------------------ */
  function terna(k) {
    const g = new THREE.Group();
    const assi = {}; const prese = [];
    const O = new THREE.Vector3(L / 2, 0, 0);
    [['x', new THREE.Vector3(1, 0, 0), 68], ['y', new THREE.Vector3(0, 0, 1), 24], ['z', new THREE.Vector3(0, 1, 0), 26]].forEach(([nome, dir, lun]) => {
      const a = new THREE.Group();
      const fine = O.clone().addScaledVector(dir, lun);
      const mat = new THREE.MeshBasicMaterial({ color: COL.inchiostro });
      const asta = segmento(O.clone().addScaledVector(dir, nome === 'z' ? 0 : -lun * 0.2), fine, 0.08 * k, COL.inchiostro);
      asta.material = mat;
      const punta = new THREE.Mesh(new THREE.ConeGeometry(0.4 * k, 1.4 * k, 10), mat);
      punta.position.copy(fine);
      punta.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const e = etichetta(nome, k > 1 ? 8 : 5);
      e.position.copy(fine).addScaledVector(dir, 3);
      a.add(asta, punta, e);
      // Bersaglio largo e invisibile: un'asta sottile sarebbe difficile da puntare
      const presa = new THREE.Mesh(new THREE.CylinderGeometry(1.6 * Math.sqrt(k), 1.6 * Math.sqrt(k), lun, 6), new THREE.MeshBasicMaterial({ visible: false }));
      presa.position.copy(O).addScaledVector(dir, lun / 2);
      presa.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      presa.userData.tocco = `asse${nome}`;
      a.add(presa); prese.push(presa);
      g.add(a);
      assi[nome] = mat;
    });
    return { g, assi, prese };
  }

  const copie = [];
  const toccabili = { schermo: [], mini: [] };
  function copia(k) {
    const perno = new THREE.Group(); perno.position.set(L / 2, 0, 0);
    const nave = Scafo.crea(k);
    nave.position.set(-L / 2, -Y_ACQUA, 0);
    perno.add(nave);
    const taglio = new THREE.Group();
    nave.add(taglio);
    const t = terna(k);
    const lama = maniglia(k > 1 ? 4 : 2.2, 'lama'); lama.visible = false; nave.add(lama);
    const dove = k > 1 ? 'mini' : 'schermo';
    toccabili[dove].push(...t.prese, lama);
    copie.push({ perno, taglio, k, assi: t.assi, lama });
    return { perno, terna: t.g };
  }
  // La sfera d'oro sta sul bordo del piano di taglio
  function posaLama() {
    const pn = s.piano && PIANI[s.piano];
    copie.forEach((c) => {
      c.lama.visible = !!pn;
      if (!pn) return;
      // La sfera porta il piano: si muove solo perpendicolare al piano
      c.lama.userData.vincolo = { asse: s.piano === 'orizzontale' ? [0, 1, 0] : s.piano === 'longitudinale' ? [0, 0, 1] : [1, 0, 0] };
      if (s.piano === 'orizzontale') c.lama.position.set(L / 2, pn.val, 17);
      else if (s.piano === 'longitudinale') c.lama.position.set(L / 2, 15, pn.val);
      else c.lama.position.set(ascissa(pn.val / 20, 6), 15, 0);
    });
  }

  function aggiornaTaglio() {
    copie.forEach((c) => {
      while (c.taglio.children.length) {
        const o = c.taglio.children[0]; c.taglio.remove(o); o.geometry.dispose();
      }
      if (!s.piano) return;
      const pn = PIANI[s.piano];
      const pt = puntiSezione(s.piano, pn.val).map((q) => new THREE.Vector3(q[0], q[1], q[2]));
      c.taglio.add(pianoDiTaglio(s.piano, pn.val));
      if (pt.length > 3) c.taglio.add(tratto(pt, 0.09 * c.k, COL.ocra));
    });
    posaLama();
    disegnaLente();
    Motore.sporco();
  }

  function aggiornaAssi() {
    const asse = s.moto && MOTI[s.moto].asse;
    copie.forEach((c) => Object.keys(c.assi).forEach((n) => c.assi[n].color.setHex(n === asse ? COL.ocra : COL.inchiostro)));
  }

  const VISTA = () => ({ target: new THREE.Vector3(50, 3, 0), theta: 0.55, phi: 1.2, r: 146 });
  let mondo = null;

  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    const a = copia(1);
    radice.add(a.perno, a.terna, Scafo.mare());
    [['prua', 103, 8, 0], ['poppa', -8, 11, 0]].forEach(([t, x, y, z]) => { const e = etichetta(t, 5); e.position.set(x, y, z); radice.add(e); });

    const stazioni = [
      { pedana: pedana(45, 26, 'a dritta'), pos: new THREE.Vector3(45, 0.25, 26), yaw: 0 },
      { pedana: pedana(112, 0, 'davanti alla prua'), pos: new THREE.Vector3(112, 0.25, 0), yaw: Math.PI / 2 },
      { pedana: pedana(-26, 0, 'dietro la poppa'), pos: new THREE.Vector3(-26, 0.25, 0), yaw: -Math.PI / 2 },
    ];
    stazioni.forEach((st) => { st.pedana.visible = false; });

    const SC = 0.012; const mini = new THREE.Group();
    const b = copia(7);
    mini.add(b.perno, b.terna, Scafo.vasca());
    mini.scale.setScalar(SC); mini.position.set(-45 * SC, 0, 0);

    const riposo = (c) => { c.perno.position.set(L / 2, 0, 0); c.perno.rotation.set(0, 0, 0); };
    mondo = {
      radice, stazioni, modellino: mini, vistaIniziale: VISTA,
      lente: () => { disegnaLente(); return texLente; },
      tocchi: (v) => (v === 'mini' ? toccabili.mini : toccabili.schermo),
      trascina(id, dx, dy, info) {
        const pn = PIANI[s.piano]; if (!pn) return;
        let passi;
        if (info) {
          // Il piano va alla posizione di passo più vicina al puntatore
          const pos = (v) => (s.piano === 'trasversale' ? ascissa(v / 20, 6) : v);
          const meta = pos(pn.val) + info.s; let best = pn.val;
          for (let v = pn.min; v <= pn.max; v += pn.passo) if (Math.abs(pos(v) - meta) < Math.abs(pos(best) - meta)) best = v;
          passi = best - pn.val;
        } else {
          s.resto = (s.resto || 0) + (s.piano === 'orizzontale' ? -dy : dx) / 28;
          passi = Math.trunc(s.resto); if (!passi) return;
          s.resto -= passi;
        }
        const v = Math.min(pn.max, Math.max(pn.min, pn.val + passi));
        if (v !== pn.val) { pn.val = v; aggiornaTaglio(); Motore.ridisegna(); }
      },
      frame(dt) {
        if (!s.moto) return false;
        // A grandezza vera la nave resta ferma: niente moti intorno a chi guarda
        if (Motore.presente() && Motore.scalaVera()) { s.moto = null; copie.forEach(riposo); aggiornaAssi(); return true; }
        s.t += dt;
        const f = Math.sin(s.t * 1.1);
        copie.forEach((c) => { riposo(c); MOTI[s.moto].muovi(c.perno, f); });
        return true;
      },
    };
    return mondo;
  }

  // Toccando un asse sulla nave: prima la rotazione, poi la traslazione, poi si ferma
  const SUL_ASSE = { x: ['rollio', 'avanzo'], y: ['beccheggio', 'deriva'], z: ['imbardata', 'sussulto'] };
  function comandi(idTocco) {
    let id = idTocco;
    if (id.startsWith('t:asse')) {
      const [r, tr] = SUL_ASSE[id[6]];
      const dopo = s.moto === r ? tr : s.moto === tr ? tr : r;
      id = `m:${dopo}`;
    }
    if (id.startsWith('m:')) {
      const m = id.slice(2);
      if (s.moto === m) { s.moto = null; copie.forEach((c) => { c.perno.position.set(L / 2, 0, 0); c.perno.rotation.set(0, 0, 0); }); Motore.sporco(); } else { s.moto = m; s.t = 0; s.testo = MOTI[m].testo; provati.add(m); }
      aggiornaAssi();
      if (['rollio', 'beccheggio', 'imbardata'].every((x) => provati.has(x))) lez.completa('rotazioni');
      if (['avanzo', 'deriva', 'sussulto'].every((x) => provati.has(x))) lez.completa('traslazioni');
    } else if (id.startsWith('c:')) {
      const c = id.slice(2);
      s.piano = s.piano === c ? null : c;
      if (s.piano) { s.testo = PIANI[c].testo; provati.add(c); }
      aggiornaTaglio();
      if (Object.keys(PIANI).every((x) => provati.has(x))) lez.completa('piani');
    } else if (id === 'pos+' || id === 'pos-') {
      const pn = PIANI[s.piano]; if (!pn) return;
      pn.val = Math.min(pn.max, Math.max(pn.min, pn.val + (id === 'pos+' ? pn.passo : -pn.passo)));
      aggiornaTaglio();
    }
  }

  /* Seconda simulazione: una fetta di scafo con il fianco e il fondo modificabili */
  const se = { fianco: 0, fondo: 0.6, copie: [] };
  const profilo = () => {
    const B2 = 7; const D = 8; const c = se.fianco;
    return [[0, se.fondo], [B2 * 0.55, se.fondo * 0.45], [B2 + Math.min(c, 0) * 0.5, 0.6], [B2 + Math.min(c, 0), 1.6], [B2 + c * 0.5, D * 0.6], [B2 + c, D]];
  };
  function posaSezione() {
    const p = profilo(); const LUNGA = 16;
    se.copie.forEach((c) => {
      const a = c.geo.attributes.position;
      for (let i = 0; i < 2; i++) p.forEach(([z, y], j) => a.setXYZ(i * p.length + j, i * LUNGA - LUNGA / 2, y, z));
      for (let i = 0; i < 2; i++) p.forEach(([z, y], j) => a.setXYZ(2 * p.length + i * p.length + j, i * LUNGA - LUNGA / 2, y, -z));
      a.needsUpdate = true; c.geo.computeBoundingSphere();
      cuoci(c.geo, (x, y) => (y < 4 ? Scafo.TINTE.carena : Scafo.TINTE.murata), true);
      // Tappo davanti: la forma della sezione si legge come un disegno pieno
      const t = c.tappo.attributes.position; t.setXYZ(0, LUNGA / 2, 8, 0);
      p.forEach(([z, y], j) => { t.setXYZ(1 + j, LUNGA / 2, y, z); t.setXYZ(1 + p.length + j, LUNGA / 2, y, -z); });
      t.needsUpdate = true; c.tappo.computeBoundingSphere();
      c.fianco.position.set(0, 8, p[5][0] + 1); c.fondo.position.set(LUNGA / 2 + 1, se.fondo - 1.6, 0);
    });
  }
  function testoFianco() {
    if (se.fianco > 0.15) return '**Svasatura** (*countersink*): la semilarghezza diminuisce dal ponte verso la chiglia.';
    if (se.fianco < -0.15) return '**Rientranza** (*tumblehome*): la semilarghezza aumenta dal ponte verso la chiglia.';
    return 'Fianco verticale: né svasatura né rientranza.';
  }
  const creaSezione = Lezione.simula({
    scala: 0.03, centro: [0, 4], mare: false, k: 2.5, pedana: [0, 18, 'davanti alla sezione'],
    vista: () => ({ target: new THREE.Vector3(0, 4, 0), theta: 1.42, phi: 1.42, r: 50 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const N6 = 6;
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N6 * 4 * 3), 3));
      const ind = [];
      [0, 2].forEach((o) => { for (let j = 0; j < N6 - 1; j++) { const a = o * N6 + j; const b = a + N6; ind.push(a, b, a + 1, b, b + 1, a + 1); } });
      geo.setIndex(ind);
      g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
      const tappo = new THREE.BufferGeometry(); tappo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((1 + 2 * N6) * 3), 3));
      const it = [];
      for (let j = 0; j < N6 - 1; j++) { it.push(0, 1 + j, 2 + j, 0, 1 + N6 + j, 2 + N6 + j); }
      tappo.setIndex(it);
      g.add(new THREE.Mesh(tappo, new THREE.MeshBasicMaterial({ color: 0x13315C, side: THREE.DoubleSide })));
      const fianco = maniglia(0.8 * Math.sqrt(k), 'fianco'); const fondo2 = maniglia(0.8 * Math.sqrt(k), 'fondo');
      g.add(fianco, fondo2); tocca(fianco); tocca(fondo2);
      fianco.userData.vincolo = { asse: [0, 0, 1] }; fondo2.userData.vincolo = { asse: [0, 1, 0] }; // il bordo del ponte va in fuori o in dentro, il fondo su o giù
      se.copie.push({ geo, tappo, fianco, fondo: fondo2 });
      return g;
    },
    dopo: posaSezione,
    trascina(id, dx, dy, info) {
      const f = testoFianco(); const r = Math.round(se.fondo * 10);
      if (id === 'fianco') se.fianco = Math.max(-2.2, Math.min(2.2, se.fianco + (info ? info.s : -dx * 0.012)));
      if (id === 'fondo') se.fondo = Math.max(0, Math.min(2.4, se.fondo + (info ? info.s : -dy * 0.012)));
      posaSezione();
      if (testoFianco() !== f || Math.round(se.fondo * 10) !== r) Motore.ridisegna();
    },
  });

  // Insellatura regolamentare: tabella 6.1, slide 15, con L = 100 m
  const RIGHE_INSELLATURA = [
    ['Posizione', 'm', 'L = 100 m'],
    ['AP (*Aft Perpendicular*)', '25', '1083 mm'],
    ['1/6 L da AP', '11,1', '481 mm'],
    ['1/3 L da AP', '2,8', '121 mm'],
    ['Midship (centro nave)', '0', '0 mm'],
    ['1/3 L da FP', '5,6', '243 mm'],
    ['1/6 L da FP', '22,2', '962 mm'],
    ['FP (*Forward Perpendicular*)', '50', '2167 mm'],
  ];

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { x: 'Asse x', y: 'Asse y', z: 'Asse z' };
    const riga = (ids, gruppo, tipo) => ({ t: 'bottoni', h: 76, size: 32, lista: ids.map((k) => ({ id: `${tipo}:${k}`, testo: gruppo[k].nome, on: (tipo === 'm' ? s.moto : s.piano) === k, off: tipo === 'm' && vera })) });
    const pn = s.piano && PIANI[s.piano];
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'La geometria dello scafo' },
          { t: 'p', testo: 'Il riferimento della nave è una **terna cartesiana ortogonale** con origine in un punto dello scafo. {{slide 4}}' },
          { t: 'p', testo: 'L\'asse **x** è longitudinale e va da poppa a prua. L\'asse **y** è trasversale e va da sinistra a dritta. L\'asse **z** è verticale e va dal basso verso l\'alto. {{slide 4}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: 'Le forme dello scafo si descrivono con sezioni su **tre piani fondamentali** riferiti a questa terna. {{slide 4}}' },
          { t: 'p', testo: 'Lungo i tre assi la nave può spostarsi in tre modi e attorno ai tre assi può ruotare in tre modi: sono i **sei moti**. {{slide 5}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Nel rollio la nave si inclina da un lato all\'altro.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Su quale asse ruota la nave nel rollio?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:x', testo: 'Asse x, da poppa a prua', on: p === 'x' },
          { t: 'scelta', id: 'p:y', testo: 'Asse y, da sinistra a dritta', on: p === 'y' },
          { t: 'scelta', id: 'p:z', testo: 'Asse z, dal basso verso l\'alto', on: p === 'z' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Traslazioni' },
          riga(['avanzo', 'deriva', 'sussulto'], MOTI, 'm'),
          { t: 'sotto', testo: 'Rotazioni' },
          riga(['rollio', 'beccheggio', 'imbardata'], MOTI, 'm'),
          { t: 'sotto', testo: 'Piani di taglio' },
          riga(['orizzontale', 'longitudinale', 'trasversale'], PIANI, 'c'),
          ...(pn ? [{ t: 'passo', id: 'pos', nome: pn.unita, valore: `${pn.val}` }] : []),
          ...lez.missioni(),
          { t: 'nota', testo: 'Tocca un asse sulla nave: gira, poi scorre, poi si ferma. Trascina la sfera d\'oro per muovere il piano di taglio.' },
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 560,
            testo: !vr ? '' : vera
              ? 'La nave è davanti a te e resta ferma. Punta una pedana e premi il grilletto per spostarti.'
              : 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.',
          },
          ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          { t: 'zona', id: 'lente', h: 400 },
          { t: 'riquadro', size: 34, testo: s.testo || 'Attiva un moto o scegli un piano.' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'x' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Nel rollio l\'asse che si illumina è quello che va da poppa a prua: la nave gli gira intorno.' },
        ],
        dx: [
          { t: 'titolo', testo: 'Attorno all\'asse x' },
          { t: 'p', testo: 'Il **rollio** è la rotazione attorno all\'asse x, cioè l\'inclinazione da un lato all\'altro. {{slide 5}}' },
          { t: 'tabella', col: [30, 40, 30], size: 34, righe: [
            ['Asse', 'Traslazione', 'Rotazione'],
            ['x', 'Avanzo', 'Rollio'],
            ['y', 'Deriva (scarroccio)', 'Beccheggio'],
            ['z', 'Sussulto', 'Accostata (imbardata)'],
          ] },
          { t: 'nota', testo: 'slide 5' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Tre piani, tre sezioni' },
          { t: 'tabella', col: [28, 22, 50], size: 34, righe: [
            ['Piano', 'Parallelo a', 'Sezione'],
            ['Orizzontale', 'xy', 'figura di galleggiamento; contorno: linea d\'acqua (*waterline*)'],
            ['Longitudinale', 'xz', 'sezione longitudinale (*buttock*)'],
            ['Trasversale', 'yz', 'sezione trasversale (*station*)'],
          ] },
          { t: 'nota', testo: 'slide 7' },
        ],
        dx: [
          { t: 'titolo', testo: 'Il piano di costruzione' },
          { t: 'p', size: 38, testo: 'Il piano di costruzione (*lines plan*) rappresenta sezioni equidistanti dello scafo sulle tre viste. Si riferisce allo scafo fuori ossatura (*moulded*). {{slide 9}}' },
          { t: 'p', size: 38, testo: 'Tradizionalmente è in scala 1:100. L\'**offset** è la tabella con le coordinate dei punti. {{slide 10}}' },
          { t: 'p', size: 38, testo: 'Grazie alla simmetria, nel trasversale la parte destra è per le sezioni prodiere e la sinistra per quelle poppiere. {{slide 11}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Le sezioni longitudinali' },
          { t: 'p', size: 40, testo: 'L\'**insellatura** (*sheer*) è la forma del ponte: più basso a centro nave, si solleva verso le estremità. {{slide 14}}' },
          { t: 'p', size: 40, testo: 'L\'**inarcamento** è la deformazione opposta: curvatura verso l\'alto nella parte centrale. {{slide 16}}' },
          { t: 'riquadro', size: 36, testo: 'Con L = 100 m, L/3 + 10 ≈ 43,3 e quindi z = m × 43,3 mm, misurata rispetto alla linea orizzontale per il ponte a centro nave. {{slide 15}}' },
        ],
        dx: [
          { t: 'sotto', testo: 'Tabella 6.1' },
          { t: 'tabella', col: [52, 18, 30], size: 34, righe: RIGHE_INSELLATURA },
          { t: 'nota', testo: 'slide 15' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Le sezioni trasversali' },
          { t: 'p', size: 38, testo: '**Stellatura** (*dead rise*): l\'angolo tra la tangente al profilo inferiore, sul piano di simmetria, e il piano orizzontale. {{slide 17}}' },
          { t: 'p', size: 38, testo: '**Sezione maestra** (*midships*): la sezione a metà nave, fra le perpendicolari estreme. {{slide 17}}' },
          { t: 'p', size: 38, testo: '**Curva del baglio**: rende il ponte più alto in mezzeria che a murata, per lo scolo dell\'acqua. {{slide 20}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', size: 38, testo: '**Svasatura** (*countersink*): la semilarghezza diminuisce dal ponte verso la chiglia. {{slide 18}}' },
          { t: 'p', size: 38, testo: '**Rientranza** (*tumblehome*): la semilarghezza aumenta dal ponte verso la chiglia. {{slide 18}}' },
          { t: 'p', size: 38, testo: '**Controbordi o bottazzi**: ingrossamento localizzato al galleggiamento, per una migliore stabilità. {{slide 19}}' },
        ],
      },
      {
        passo: 3, mondo: creaSezione,
        sx: [
          { t: 'titolo', testo: 'Disegna la sezione' },
          { t: 'p', size: 38, testo: 'Tira le due sfere d\'oro e guarda come cambia la sezione trasversale. {{slide 17, 18}}' },
          { t: 'riquadro', size: 38, testo: testoFianco() },
          { t: 'riquadro', size: 38, testo: se.fondo > 0.02 ? `**Stellatura** (*dead rise*): circa ${Math.round((Math.atan2(se.fondo, 7) * 180) / Math.PI)}° nel modello.` : 'Fondo piatto: nessuna **stellatura**.' },
          { t: 'nota', testo: 'Forme e angoli schematici: le slide danno le definizioni, non le misure.' },
        ],
        dx: Lezione.finestra(760),
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Inclinazioni e carene' },
          { t: 'p', testo: 'Le inclinazioni trasversali sono quelle che rischiano di mettere in pericolo la nave. Per rappresentarle si disegna lo scafo dritto e il galleggiamento inclinato. {{slide 22}}' },
        ],
        dx: [
          { t: 'tabella', col: [30, 35, 35], size: 34, righe: [
            ['Carene', 'Cambia', 'Non cambia'],
            ['Isocarene', 'l\'inclinazione', 'il volume, il peso a bordo'],
            ['Isocline', 'il volume, il peso a bordo', 'l\'inclinazione'],
          ] },
          { t: 'p', size: 38, testo: 'Le **carene dritte** sono isocline con galleggiamenti paralleli anche a quello dritto di progetto. {{slide 24, 26}}' },
          { t: 'nota', testo: 'slide 23–25' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sulle definizioni delle slide. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      lez.premio(() => lez.fatto.quiz(QUIZ.map((q) => q.n))),
    ];
  });
})();
