/* Lezione 13: il bordo libero. Dati dalle slide 18, 19, 20, 26-29, 35-38 */
(function () {
  const N = 13;
  const { COL, tratto, segmento, scatola, tela, etichetta, pedana } = Tavola;
  const { C } = Pagina;
  Libro.PRONTE.push(N);

  // Nave dell'esempio a slide 20
  const NAVE = { TS: 6000, FWA: 110, BLS: 1200 };
  const D = NAVE.TS / 48;
  // Posizione delle marche rispetto alla S, in mm (slide 18)
  const MARCA = { S: 0, T: D, W: -D, WNA: -D - 50, F: NAVE.FWA, TF: NAVE.FWA + D };

  // Quindicine dell'anno: 0 = 1-15 gennaio ... 23 = 16-31 dicembre
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const FINE_MESE = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function nomePeriodo(i) {
    const m = Math.floor(i / 2);
    if (i % 2 === 0) return `1-15 ${MESI[m]}`;
    return `16-${m === 1 ? '28/29' : FINE_MESE[m]} ${MESI[m]}`;
  }

  // Slide 26, 27, 28, 37. da/a: quindicine comprese nel periodo
  const ZONE = [
    { id: 'estiva', nome: 'Zona estiva', tutto: 'S' },
    { id: 'rosso', nome: 'Mar Rosso (zona tropicale)', tutto: 'T' },
    { id: 'na1', nome: 'Nord Atlantico, zona I', marca: 'W', da: 19, a: 6, altrimenti: 'S', wna: true },
    { id: 'na2', nome: 'Nord Atlantico, zona II', marca: 'W', da: 20, a: 5, altrimenti: 'S', nota: 'In parte della zona II, per navi fino a 100 m, vale la WNA.' },
    { id: 'australe', nome: 'Zona invernale australe', marca: 'W', da: 7, a: 18, altrimenti: 'S' },
    { id: 'baltico', nome: 'Mar Baltico', marca: 'W', da: 20, a: 5, altrimenti: 'S' },
    { id: 'arabico', nome: 'Mar Arabico', marca: 'T', da: 16, a: 9, altrimenti: 'S' },
    { id: 'bengala', nome: 'Golfo del Bengala', marca: 'T', da: 22, a: 7, altrimenti: 'S' },
    { id: 'leone', nome: 'Golfo del Leone', marca: 'W', da: 23, a: 4, altrimenti: 'S', soloCorte: true },
    { id: 'nero', nome: 'Mar Nero, a nord di 44° N', marca: 'W', da: 22, a: 3, altrimenti: 'S', soloCorte: true },
  ];

  const s = { zona: ZONE[0], periodo: 0, rho: 1025, carico: 0, lunghezza: 90 };

  function marcaInMare() {
    const z = s.zona;
    if (z.tutto) return z.tutto;
    const dentro = z.da <= z.a ? s.periodo >= z.da && s.periodo <= z.a : s.periodo >= z.da || s.periodo <= z.a;
    if (!dentro) return z.altrimenti;
    if (z.soloCorte && s.lunghezza > 100) return 'S';
    if (z.wna && s.lunghezza <= 100) return 'WNA';
    return z.marca;
  }
  const dwa = () => (NAVE.FWA * (1025 - s.rho)) / 25; // slide 19

  function calcola() {
    const base = marcaInMare();
    const extra = dwa();
    let sigla = base;
    if (extra === NAVE.FWA && base === 'S') sigla = 'F'; // slide 29
    else if (extra === NAVE.FWA && base === 'T') sigla = 'TF';
    else if (extra > 0) sigla = `${base} + ${extra === NAVE.FWA ? 'FWA' : 'DWA'}`;
    const limite = MARCA[base] + extra;
    const livello = s.carico + extra; // acqua rispetto alla S
    return {
      base, sigla, limite, livello,
      evidenziata: MARCA[sigla] !== undefined ? sigla : base,
      immersione: NAVE.TS + livello,
      bordo: NAVE.BLS - livello,
      margine: limite - livello,
    };
  }

  const mm = (v) => `${Math.round(v)} mm`;
  const conSegno = (v) => (v > 0 ? `+${Math.round(v)} mm` : v < 0 ? `−${Math.round(-v)} mm` : '0 mm');

  /* Stato della lezione ---------------------------------------------------- */

  const salvate = Libro.stato(N);
  const MISSIONI = [
    { id: 'dolce', testo: 'Porta l\'acqua da mare a dolce con lo stesso carico.' },
    { id: 'rosso', testo: 'Mar Rosso, agosto, acqua di mare: carica fino alla marca.' },
    { id: 'leone', testo: 'Golfo del Leone, 10 gennaio: confronta 90 m e 150 m.' },
  ];
  const fatte = new Set(salvate.missioni || []);
  const vistiLeone = new Set();

  function completa(id) {
    if (fatte.has(id)) return;
    fatte.add(id);
    Libro.aggiorna(N, { missioni: [...fatte] });
  }
  function controllaMissioni(r) {
    if (s.rho === 1000) completa('dolce');
    if (s.zona.id === 'rosso' && (s.periodo === 14 || s.periodo === 15) && s.rho === 1025 && Math.abs(r.margine) <= 10) completa('rosso');
    if (s.zona.id === 'leone' && s.periodo === 0) {
      vistiLeone.add(s.lunghezza);
      if (vistiLeone.size === 2) completa('leone');
    }
  }

  const RISPOSTE = { sale: 'Sale', uguale: 'Resta dov\'è', scende: 'Scende' };

  /* Esercizi (slide 35-38) --------------------------------------------------- */

  const ES_MARCA = [
    { n: 1, testo: 'Portacontainer di 180 m nel Mar Rosso, in agosto', giusta: 'T', perche: 'il Mar Rosso è in zona tropicale tutto l\'anno' },
    { n: 2, testo: 'Nave di 90 m nel Golfo del Leone, il 10 gennaio', giusta: 'W', perche: 'area invernale stagionale per navi fino a 100 m (16 dic – 15 mar)' },
    { n: 3, testo: 'Nave di 150 m nello stesso punto e nello stesso giorno', giusta: 'S', perche: 'l\'area invernale vale solo fino a 100 m: per le altre è zona estiva' },
    { n: 4, testo: 'Nave in un porto fluviale (acqua dolce) in zona estiva', giusta: 'F', perche: 'zona estiva, ma in acqua dolce' },
    { n: 5, testo: 'Nave di 80 m nel Nord Atlantico, nella zona invernale, a gennaio', giusta: 'WNA', perche: 'nave fino a 100 m nel Nord Atlantico d\'inverno' },
  ];
  const ES_CALCOLO = [
    { n: 6, testo: 'Distanza delle marche T e W dalla S, con TS = 7,20 m', campi: [['T e W dalla S', 150]], soluzione: 'd = 150 mm: T 150 mm sopra la S, W 150 mm sotto' },
    { n: 7, testo: 'Distanza della WNA dalla S (nave di 85 m), con TS = 4,80 m', campi: [['WNA sotto la S', 150]], soluzione: 'd = 100 mm; W a 100 mm, WNA 50 mm più in basso: WNA 150 mm sotto la S' },
    { n: 8, testo: 'Distanza della TF dalla S, con TS = 8,64 m e FWA = 180 mm', campi: [['TF sopra la S', 360]], soluzione: 'd = 180 mm; F a 180 mm (FWA): TF 360 mm sopra la S' },
    { n: 9, testo: 'Bordo libero invernale e tropicale, con bordo libero estivo 1500 mm e TS = 6,24 m', campi: [['invernale', 1630], ['tropicale', 1370]], soluzione: 'd = 130 mm: invernale 1630 mm, tropicale 1370 mm' },
    { n: 10, testo: 'Differenza di bordo libero tabulare tra tipo B e tipo A, con L = 200 m', campi: [['differenza', 652]], soluzione: '3264 mm − 2612 mm = 652 mm in più per il tipo B' },
  ];

  const risolti = new Set(salvate.esercizi || []);
  const tentativi = {};
  const esiti = {};
  ES_MARCA.forEach((e) => { if (risolti.has(e.n)) esiti[e.n] = { tipo: 'giusto', testo: `${e.giusta}: ${e.perche}` }; });
  ES_CALCOLO.forEach((e) => { if (risolti.has(e.n)) esiti[e.n] = { tipo: 'giusto', testo: e.soluzione }; });
  const calcolo = { n: 6, campo: 0, valori: {} };

  function risolto(n) {
    risolti.add(n);
    Libro.aggiorna(N, { esercizi: [...risolti] });
  }
  // La bandiera si guadagna solo facendo tutti i passaggi
  function daFare() {
    const st = Libro.stato(N); const lista = [];
    const es = ES_MARCA.length + ES_CALCOLO.length - risolti.size;
    if (!st.prevedi) lista.push('la previsione');
    if (fatte.size < MISSIONI.length) lista.push(`le missioni (${fatte.size} su ${MISSIONI.length})`);
    if (!st.aletta) lista.push('l\'aletta dello Scopri');
    if (es > 0) lista.push(es === 1 ? '1 esercizio' : `${es} esercizi`);
    return lista;
  }
  function rispondiMarca(n, m) {
    const e = ES_MARCA[n - 1];
    if (m === e.giusta) { esiti[n] = { tipo: 'giusto', testo: `${e.giusta}: ${e.perche}` }; risolto(n); return; }
    tentativi[n] = (tentativi[n] || 0) + 1;
    if (tentativi[n] >= 2) { esiti[n] = { tipo: 'errato', testo: `Soluzione: ${e.giusta}, ${e.perche}` }; risolto(n); } else esiti[n] = { tipo: 'errato', testo: 'Non è questa. Controlla zona, stagione, acqua e lunghezza.' };
  }
  function tastoCalcolo(k) {
    const e = ES_CALCOLO.find((x) => x.n === calcolo.n);
    const v = calcolo.valori[e.n] || (calcolo.valori[e.n] = e.campi.map(() => ''));
    if (k === 'canc') v[calcolo.campo] = v[calcolo.campo].slice(0, -1);
    else if (k === 'ok') {
      if (e.campi.every(([, x], i) => Number(v[i]) === x)) { esiti[e.n] = { tipo: 'giusto', testo: e.soluzione }; risolto(e.n); return; }
      tentativi[e.n] = (tentativi[e.n] || 0) + 1;
      if (tentativi[e.n] >= 2) { esiti[e.n] = { tipo: 'errato', testo: `Soluzione: ${e.soluzione}` }; risolto(e.n); } else esiti[e.n] = { tipo: 'errato', testo: 'Non torna. Ricalcola d = TS / 48, con TS in millimetri.' };
    } else if (v[calcolo.campo].length < 5) v[calcolo.campo] += k;
  }

  /* Lente sul pettine: disegno in scala ---------------------------------------- */

  const LW = 1040; const LH = 460; const SCALA = 0.42; const Y0 = 235;
  const yMm = (v) => Y0 - v * SCALA;
  const XO = 230; const XP = XO + 540 * SCALA; const BARRA = 230 * SCALA; const SP = 25 * SCALA;
  const telaLente = document.createElement('canvas');
  telaLente.width = LW; telaLente.height = LH;
  const texLente = new THREE.CanvasTexture(telaLente);
  texLente.colorSpace = THREE.SRGBColorSpace;

  function disegnaLente(livello) {
    const c = telaLente.getContext('2d'); const r = calcola();
    const corte = s.lunghezza <= 100;
    c.fillStyle = C.carta; c.fillRect(0, 0, LW, LH);
    c.fillStyle = C.ink; c.strokeStyle = C.ink;
    c.font = '34px Disegno, cursive'; c.textAlign = 'left'; c.fillText('lente sul pettine, in scala', 18, 38);
    c.textAlign = 'right'; c.fillText('prua →', LW - 18, 38); c.textAlign = 'left';
    c.lineWidth = SP; c.beginPath(); c.arc(XO, yMm(0), 150 * SCALA - SP / 2, 0, Math.PI * 2); c.stroke();
    c.fillRect(XO - 225 * SCALA, yMm(0), 450 * SCALA, SP);
    c.font = '700 40px Atkinson, sans-serif';
    c.fillText('R', XO - 96, yMm(0) - 8); c.fillText('I', XO + 78, yMm(0) - 8);
    c.fillRect(XP - SP / 2, yMm(MARCA.TF), SP, (MARCA.TF - (corte ? MARCA.WNA : MARCA.W)) * SCALA + SP);
    Object.keys(MARCA).forEach((m) => {
      if (m === 'WNA' && !corte) return;
      const verso = m === 'F' || m === 'TF' ? -1 : 1;
      c.fillStyle = m === r.evidenziata ? C.ocra : C.ink;
      c.fillRect(verso > 0 ? XP : XP - BARRA, yMm(MARCA[m]), BARRA, SP);
      c.fillStyle = m === r.evidenziata ? C.ocraT : C.ink;
      c.font = '700 32px Atkinson, sans-serif';
      c.textAlign = verso > 0 ? 'left' : 'right';
      c.fillText(m, verso > 0 ? XP + BARRA + 10 : XP - BARRA - 10, yMm(MARCA[m]) + (m === 'W' ? 6 : m === 'WNA' ? 24 : 16));
      c.textAlign = 'left';
    });
    if (MARCA[r.sigla] === undefined) {
      c.strokeStyle = C.ocra; c.lineWidth = 4; c.setLineDash([14, 9]);
      c.beginPath(); c.moveTo(18, yMm(r.limite)); c.lineTo(LW - 18, yMm(r.limite)); c.stroke(); c.setLineDash([]);
    }
    const y = yMm(livello);
    c.fillStyle = 'rgba(46,125,181,0.32)'; c.fillRect(0, y, LW, LH - y);
    c.fillStyle = C.acqua; c.fillRect(0, y - 2, LW, 4);
    c.fillStyle = C.ink; c.font = '32px Disegno, cursive'; c.fillText('acqua', 18, LH - 14);
    c.strokeStyle = C.ink; c.lineWidth = 4; c.strokeRect(2, 2, LW - 4, LH - 4);
    texLente.needsUpdate = true;
  }

  const { L, B, fondo, mezza, ascissa } = Scafo;
  const scafo = Scafo.crea;

  const coloriMarca = {};
  const barreWna = [];
  function marche(g, lato) {
    const m = new THREE.Group();
    m.position.set(L / 2, 0, lato * (B / 2 + 0.02));
    if (lato < 0) m.rotation.y = Math.PI;
    const sx = lato; // sempre verso prua
    const inchiostroMarca = new THREE.MeshBasicMaterial({ color: COL.scafo }); // sulla murata scura
    const barra = (x, y, w, h, mat) => {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat || inchiostroMarca);
      b.position.set(sx * x, y, 0);
      m.add(b);
      return b;
    };
    const lettera = (testo, x, y, alta) => {
      const w = testo.length > 1 ? 120 * testo.length : 150;
      const tex = tela(w, 150, (c) => {
        c.font = '700 120px Atkinson, sans-serif'; c.fillStyle = '#FBF9F1'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(testo, w / 2, 80);
      });
      const p = new THREE.Mesh(new THREE.PlaneGeometry((alta * w) / 150, alta), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      p.position.set(sx * x, y, 0.001);
      m.add(p);
      return p;
    };
    const Yb = (mmS) => (NAVE.TS + mmS) / 1000;
    barra(0, Yb(NAVE.BLS) - 0.0125, 0.3, 0.025); // linea di riferimento (slide 14)
    barra(0, Yb(0) - 0.0125, 0.45, 0.025); // linea dell'occhio (slide 15)
    const anello = new THREE.Mesh(new THREE.RingGeometry(0.125, 0.15, 64), inchiostroMarca);
    anello.position.set(0, Yb(0) - 0.0125, 0);
    m.add(anello);
    lettera('R', -sx * 0.2, Yb(0) + 0.055, 0.1);
    lettera('I', sx * 0.2, Yb(0) + 0.055, 0.1);
    barra(0.54, Yb((MARCA.TF + MARCA.WNA) / 2) - 0.0125, 0.025, (MARCA.TF - MARCA.WNA) / 1000 + 0.025); // asta del pettine

    Object.keys(MARCA).forEach((k) => {
      const verso = k === 'F' || k === 'TF' ? -1 : 1;
      coloriMarca[k] = coloriMarca[k] || new THREE.MeshBasicMaterial({ color: COL.scafo });
      const b = barra(0.54 + verso * 0.115, Yb(MARCA[k]) - 0.0125, 0.23, 0.025, coloriMarca[k]);
      const dy = k === 'W' ? 0.03 : k === 'WNA' ? -0.03 : 0;
      const l = lettera(k, 0.54 + verso * (k.length > 2 ? 0.39 : k.length > 1 ? 0.33 : 0.29), Yb(MARCA[k]) + dy, 0.09);
      if (k === 'WNA') barreWna.push(b, l);
    });
    g.add(m);
  }

  /* Il mondo dell'esperimento: finestra sulla pagina, scala 1:1 nel visore -------- */

  const VISTA_NAVE = () => ({ target: new THREE.Vector3(45, 2, 0), theta: 0.6, phi: 1.33, r: 112 });
  const VISTA_PETTINE = () => ({ target: new THREE.Vector3(45.3, 0.45, 7.5), theta: 0, phi: 1.5, r: 3.2 });
  let mondo = null; let visibile = 0; let ultimoDisegno = null;

  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    const nave = scafo();
    marche(nave, 1);
    marche(nave, -1);
    radice.add(nave);

    radice.add(Scafo.mare());

    // Linea di galleggiamento ferma sull'acqua: è la nave a muoversi
    const lineeLontane = [];
    [1, -1].forEach((lato) => {
      const punti = [];
      for (let i = 0; i <= 90; i++) { const u = i / 90; const y = NAVE.TS / 1000; if (y >= fondo(u)) punti.push(new THREE.Vector3(ascissa(u, y), 0.01, lato * (mezza(u, y) + 0.03))); }
      const larga = tratto(punti, 0.06, COL.acqua);
      lineeLontane.push(larga);
      radice.add(larga, tratto(punti, 0.006, COL.acqua));
    });

    const prua = etichetta('prua', 5); prua.position.set(101, 8, 0); radice.add(prua);
    const poppa = etichetta('poppa', 5); poppa.position.set(-6, 11, 0); radice.add(poppa);
    const nomePettine = etichetta('pettine', 5, '#7D5A0C'); nomePettine.position.set(45, 13, 14); radice.add(nomePettine);
    const richiamo = segmento(new THREE.Vector3(45, 11, 14), new THREE.Vector3(45.2, 0.8, 7.6), 0.06, COL.ocra);
    radice.add(richiamo);

    const vicino = (si) => {
      richiamo.visible = !si; nomePettine.visible = !si;
      lineeLontane.forEach((l) => { l.visible = !si; });
    };

    const stazioni = [
      { pedana: pedana(45.3, 12, 'al pettine'), pos: new THREE.Vector3(45.3, 0.25, 12), yaw: 0 },
      { pedana: pedana(112, 32, 'a prua'), pos: new THREE.Vector3(112, 0.25, 32), yaw: Math.atan2(67, 32) },
      { pedana: pedana(45, 78, 'al largo'), pos: new THREE.Vector3(45, 0.25, 78), yaw: 0 },
    ];
    stazioni.forEach((st) => { st.pedana.visible = false; });

    // Modellino da tenere in mano nel visore: 90 m diventano poco più di un metro
    const SC = 0.012; const K = 7;
    const mini = new THREE.Group();
    const naveMini = scafo(K);
    mini.add(naveMini);
    const vasca = new THREE.Mesh(new THREE.CircleGeometry(58, 64), new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
    vasca.rotation.x = -Math.PI / 2; vasca.position.set(45, 0, 0);
    mini.add(vasca);
    const bordoVasca = new THREE.Mesh(new THREE.RingGeometry(57.2, 58, 64), new THREE.MeshBasicMaterial({ color: COL.acqua, side: THREE.DoubleSide }));
    bordoVasca.rotation.x = -Math.PI / 2; bordoVasca.position.set(45, 0.02, 0);
    mini.add(bordoVasca);
    [1, -1].forEach((lato) => {
      const punti = [];
      for (let i = 0; i <= 90; i++) { const u = i / 90; const y = NAVE.TS / 1000; if (y >= fondo(u)) punti.push(new THREE.Vector3(ascissa(u, y), 0.05, lato * (mezza(u, y) + 0.1))); }
      mini.add(tratto(punti, 0.3, COL.acqua));
    });
    const puntoMarche = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 0.3), new THREE.MeshBasicMaterial({ color: COL.ocra }));
    puntoMarche.position.set(L / 2, 0.8, B / 2 + 0.3);
    mini.add(puntoMarche);
    const nomiMini = [['prua', 100, 9, 0], ['poppa', -8, 14, 0], ['pettine', 45, 11, 16]];
    nomiMini.forEach(([testo, x, y, z]) => {
      const e = etichetta(testo, 7, testo === 'pettine' ? '#7D5A0C' : '#12355B');
      e.position.set(x, y, z);
      mini.add(e);
    });
    mini.scale.setScalar(SC);
    mini.position.set(-45 * SC, 0, 0);

    function aggiornaColori() {
      const r = calcola(); const corte = s.lunghezza <= 100;
      barreWna.forEach((o) => { o.visible = corte; });
      Object.keys(coloriMarca).forEach((k) => coloriMarca[k].color.setHex(k === r.evidenziata ? COL.ocra : COL.inchiostro));
    }

    mondo = {
      radice, stazioni, aggiornaColori, modellino: mini,
      vistaIniziale: VISTA_NAVE,
      lente: () => { disegnaLente(visibile); return texLente; },
      primaFinestra: (r) => vicino(r < 30),
      frame(dt) {
        const vero = calcola().livello;
        let sporco = false;
        if (Math.abs(vero - visibile) > 0.2) {
          visibile += (vero - visibile) * (1 - Math.exp(-dt * 3));
          sporco = true;
        } else if (visibile !== vero) { visibile = vero; sporco = true; }
        const chiave = `${visibile}|${s.zona.id}|${s.periodo}|${s.rho}|${s.lunghezza}`;
        if (chiave !== ultimoDisegno) { ultimoDisegno = chiave; disegnaLente(visibile); aggiornaColori(); }
        nave.position.y = -(NAVE.TS + visibile) / 1000;
        naveMini.position.y = nave.position.y;
        if (Motore.presente()) { richiamo.visible = true; nomePettine.visible = true; lineeLontane.forEach((l) => { l.visible = false; }); }
        return sporco;
      },
    };
    aggiornaColori();
    return mondo;
  }

  function comandoProva(id) {
    if (id === 'v:nave') { Motore.vista(VISTA_NAVE()); s.vista = 'nave'; return; }
    if (id === 'v:pettine') { Motore.vista(VISTA_PETTINE()); s.vista = 'pettine'; return; }
    const cambia = {
      'zona+': () => { s.zona = ZONE[(ZONE.indexOf(s.zona) + 1) % ZONE.length]; },
      'zona-': () => { s.zona = ZONE[(ZONE.indexOf(s.zona) - 1 + ZONE.length) % ZONE.length]; },
      'periodo+': () => { s.periodo = (s.periodo + 1) % 24; },
      'periodo-': () => { s.periodo = (s.periodo + 23) % 24; },
      'acqua+': () => { s.rho = Math.min(1025, s.rho + 5); },
      'acqua-': () => { s.rho = Math.max(1000, s.rho - 5); },
      'carico+': () => { s.carico = Math.min(300, s.carico + 25); },
      'carico-': () => { s.carico = Math.max(-300, s.carico - 25); },
      'r:1025': () => { s.rho = 1025; }, 'r:1010': () => { s.rho = 1010; }, 'r:1000': () => { s.rho = 1000; },
      'l:90': () => { s.lunghezza = 90; }, 'l:150': () => { s.lunghezza = 150; },
    }[id];
    if (cambia) { cambia(); controllaMissioni(calcola()); }
  }

  /* Disegni delle pagine ------------------------------------------------------------ */

  function sezioneMaestra(c, x, y, w, h) {
    const k = Math.min(w / 480, h / 340); c.save(); c.translate(x + (w - 480 * k) / 2, y); c.scale(k, k);
    c.fillStyle = 'rgba(46,125,181,0.18)'; c.fillRect(0, 168, 480, 172);
    c.save(); c.beginPath(); c.rect(100, 70, 240, 98); c.clip();
    c.strokeStyle = C.ocra; c.lineWidth = 2; c.beginPath();
    for (let i = -100; i < 480; i += 14) { c.moveTo(i, 170); c.lineTo(i + 110, 60); } c.stroke(); c.restore();
    c.strokeStyle = C.ink; c.lineWidth = 3.5; c.beginPath();
    c.moveTo(100, 70); c.lineTo(340, 70); c.lineTo(340, 258); c.quadraticCurveTo(340, 300, 300, 300); c.lineTo(140, 300);
    c.quadraticCurveTo(100, 300, 100, 258); c.closePath(); c.stroke();
    c.strokeStyle = C.acqua; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 168); c.lineTo(480, 168); c.stroke();
    c.strokeStyle = C.ink; c.lineWidth = 2.5; c.beginPath(); c.moveTo(385, 72); c.lineTo(385, 166); c.stroke();
    c.fillStyle = C.ink; c.font = '22px Disegno, cursive'; c.textAlign = 'center';
    c.fillText('ponte stagno', 220, 56); c.fillText('riserva di spinta', 220, 126); c.fillText('volume di carena', 220, 240);
    c.textAlign = 'left'; c.fillText('bordo', 398, 118); c.fillText('libero', 398, 142); c.fillText('galleggiamento', 4, 160);
    c.restore();
  }
  function grandeBandiera(c, x, y, w) { Libro.BANDIERE[N].disegna(c, x + w * 0.1, y, w * 0.8, w * 0.53); }

  /* Le doppie pagine ------------------------------------------------------------------ */

  const lezione = (spreads) => spreads.map((sp) => ({ ...sp, sx: [Libro.rail(N, spreads, sp.passo), ...sp.sx] }));

  function esercizioMarca(n) {
    const e = ES_MARCA[n - 1]; const fatto = risolti.has(n);
    return [
      { t: 'p', size: 38, testo: `**${n}.** ${e.testo}` },
      { t: 'bottoni', h: 88, size: 32, lista: Object.keys(MARCA).map((m) => ({ id: `m:${n}:${m}`, testo: m, off: fatto })) },
      ...(esiti[n] ? [{ t: 'esito', ...esiti[n] }] : []),
    ];
  }

  function doppie() {
    const st = Libro.stato(N);
    const p = st.prevedi;
    const r = calcola();
    const nota = s.zona.nota && r.base === 'W' ? ` ${s.zona.nota}` : '';
    const verdetto = r.margine < 0
      ? `Marca ${r.sigla} sommersa di ${Math.ceil(-r.margine / 10)} cm: sanzione per ogni centimetro di troppo.`
      : r.margine === 0 ? `La nave è esattamente alla marca ${r.sigla}.` : `Marca ${r.sigla} fuori dall'acqua di ${Math.round(r.margine)} mm.`;
    const e = ES_CALCOLO.find((x) => x.n === calcolo.n);
    const valori = calcolo.valori[e.n] || e.campi.map(() => '');
    const mancano = daFare();
    const completi = mancano.length === 0;

    return lezione([
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Il bordo libero' },
          { t: 'p', testo: 'Il **bordo libero** (*freeboard*) è la distanza verticale, misurata lungo la sezione maestra (MP), tra il galleggiamento e una marca di riferimento posta all\'altezza del ponte di bordo libero, il ponte stagno più alto. {{slide 5}}' },
          { t: 'p', testo: 'Varia in maniera inversa rispetto all\'immersione: più la nave si immerge, meno bordo libero resta. {{slide 5}}' },
          { t: 'p', testo: 'Il bordo libero minimo è il livello oltre il quale la nave non può immergersi. {{slide 5}}' },
        ],
        dx: [
          { t: 'disegno', h: 660, fn: sezioneMaestra },
          { t: 'p', testo: 'Il volume stagno sopra il galleggiamento è la **riserva di spinta**: tiene a galla la nave se imbarca acqua o se un\'onda la solleva e la riabbassa. {{slide 7}}' },
          { t: 'p', testo: 'Dal 1876, grazie a Samuel Plimsoll, questo limite si legge dall\'esterno: è tracciato sulla murata. {{slide 4}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Una nave naviga in mare, carica fino alla sua marca. Poi risale un fiume ed entra in un porto d\'acqua dolce.' },
          { t: 'p', testo: 'Il carico a bordo non cambia.' },
        ],
        dx: [
          { t: 'sotto', testo: 'In acqua dolce la nave sale o scende?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:sale', testo: 'Sale: l\'immersione diminuisce', on: p === 'sale' },
          { t: 'scelta', id: 'p:uguale', testo: 'Resta dov\'è: il carico è lo stesso', on: p === 'uguale' },
          { t: 'scelta', id: 'p:scende', testo: 'Scende: l\'immersione aumenta', on: p === 'scende' },
        ],
      },
      {
        passo: 2, mondo: creaMondo,
        richiede: () => !!Libro.stato(N).prevedi, avviso: 'Se salti, niente bandiera.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'passo', id: 'zona', nome: 'Dove', valore: s.zona.nome },
          { t: 'passo', id: 'periodo', nome: 'Quando', valore: nomePeriodo(s.periodo) },
          { t: 'passo', id: 'acqua', nome: 'Densità dell\'acqua', valore: `${s.rho} kg/m³` },
          { t: 'bottoni', h: 84, size: 34, lista: [{ id: 'r:1025', testo: 'Mare', on: s.rho === 1025 }, { id: 'r:1010', testo: 'Salmastra', on: s.rho === 1010 }, { id: 'r:1000', testo: 'Dolce', on: s.rho === 1000 }] },
          { t: 'passo', id: 'carico', nome: 'Carico, dalla S in mare', valore: conSegno(s.carico) },
          { t: 'bottoni', h: 84, size: 34, lista: [{ id: 'l:90', testo: 'Nave 90 m', on: s.lunghezza === 90 }, { id: 'l:150', testo: 'Nave 150 m', on: s.lunghezza === 150 }] },
          ...MISSIONI.map((m) => ({ t: 'spunta', testo: m.testo, fatta: fatte.has(m.id) })),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 610,
            testo: !Motore.presente() ? '' : Motore.scalaVera()
              ? 'La nave è davanti a te, a grandezza vera. Punta una pedana e premi il grilletto per spostarti.'
              : 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.',
          },
          Motore.presente()
            ? { t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }
            : { t: 'bottoni', h: 80, size: 34, lista: [{ id: 'v:nave', testo: 'Nave intera', on: s.vista !== 'pettine' }, { id: 'v:pettine', testo: 'Sul pettine', on: s.vista === 'pettine' }] },
          { t: 'zona', id: 'lente', h: 440 },
          { t: 'p', size: 36, testo: `**${verdetto}**${nota}`, colore: r.margine < 0 ? C.rosso : C.verde },
          { t: 'p', size: 34, testo: `Bordo libero ${mm(r.bordo)} · Immersione ${mm(r.immersione)} · Marca ${r.sigla}` },
        ],
        azione: comandoProva,
      },
      {
        passo: 3, aletta: () => !!Libro.stato(N).aletta,
        richiede: () => fatte.size === MISSIONI.length, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'scende' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Con lo stesso carico, passando dal mare all\'acqua dolce l\'immersione della nave di esempio aumenta di 110 mm: è la sua FWA.' },
        ],
        dx: [
          { t: 'titolo', testo: 'In acqua dolce la nave scende' },
          { t: 'p', testo: 'L\'acqua di mare (1,025 t/m³) è più densa dell\'acqua dolce (1,000 t/m³) e spinge di più. {{slide 19, 34}}' },
          { t: 'p', testo: 'Per questo la marca F sta sopra la S: in acqua dolce si può caricare fino alla F, perché uscendo in mare l\'immersione diminuisce e la nave sale fino alla S. {{slide 34}}' },
        ],
        azione(id) { if (id === 'aletta') Libro.aggiorna(N, { aletta: true }); },
      },
      {
        passo: 3,
        richiede: () => !!Libro.stato(N).aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'FWA e DWA' },
          { t: 'p', testo: 'La **FWA** (*Fresh Water Allowance*) dice di quanto aumenta l\'immersione passando dall\'acqua di mare all\'acqua dolce: è la distanza tra la marca S e la marca F. {{slide 19}}' },
          { t: 'p', testo: 'Nei porti di estuario l\'acqua è salmastra: la nave può immergersi oltre la marca di una quota proporzionale alla FWA, la **DWA** (*Dock Water Allowance*). {{slide 19}}' },
        ],
        dx: [
          { t: 'formula', testo: 'FWA (mm) = Δ / (4 · TPC)' },
          { t: 'p', size: 38, testo: 'Δ = dislocamento estivo (t); TPC = tonnellate per centimetro di immersione. {{slide 19}}' },
          { t: 'formula', testo: 'DWA (mm) = FWA · (1025 − ρ) / 25' },
          { t: 'p', size: 38, testo: 'ρ = densità dell\'acqua del porto (kg/m³). {{slide 19}}' },
          { t: 'riquadro', testo: 'Esempio: FWA = 200 mm, ρ = 1010 kg/m³ → DWA = 200 · 15 / 25 = 120 mm', size: 40 },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Le sei marche del pettine' },
          { t: 'p', testo: 'Il **pettine** sta 540 mm a proravia del centro dell\'occhio di Plimsoll. Verso prora le acque salate, verso poppa le acque dolci. {{slide 16, 17}}' },
          { t: 'p', testo: 'Sopra la S si può caricare di più, sotto si deve caricare di meno. {{slide 17}}' },
          { t: 'formula', testo: 'd = TS / 48' },
          { t: 'riquadro', size: 38, testo: 'Nave di 90 m, TS = 6,00 m, FWA = 110 mm: d = 6000 / 48 = 125 mm. Con bordo libero estivo di 1200 mm: invernale 1325 mm, tropicale 1075 mm. {{slide 20}}' },
        ],
        dx: [
          { t: 'tabella', col: [16, 34, 50], size: 34, righe: [
            ['Sigla', 'Marca', 'Dove si traccia'],
            ['S', 'Estiva (*Summer*)', 'allineata alla linea dell\'occhio di Plimsoll'],
            ['T', 'Tropicale (*Tropical*)', 'sopra la S, a una distanza d'],
            ['F', 'Acqua dolce (*Fresh*)', 'sopra la S, verso poppa, a una distanza pari alla FWA'],
            ['TF', 'Acqua dolce tropicale', 'sopra la F, a una distanza d'],
            ['W', 'Invernale (*Winter*)', 'sotto la S, a una distanza d'],
            ['WNA', 'Invernale Nord Atlantico', 'sotto la W, a 50 mm; solo navi non oltre 100 m'],
          ] },
          { t: 'nota', testo: 'slide 18' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Quale marca vale' },
          { t: 'tabella', col: [16, 84], size: 34, righe: [
            ['Sigla', 'Si usa…'],
            ['S', 'in zona estiva e nelle zone o aree stagionali durante il periodo estivo, in acqua di mare'],
            ['T', 'in zona tropicale e nelle aree tropicali stagionali durante il periodo tropicale'],
            ['W', 'nelle zone e aree invernali stagionali durante il periodo invernale'],
            ['WNA', 'navi fino a 100 m, d\'inverno, nella parte del Nord Atlantico indicata dalla Convenzione'],
            ['F', 'in acqua dolce, dove in mare varrebbe la S'],
            ['TF', 'in acqua dolce, dove in mare varrebbe la T'],
          ] },
          { t: 'nota', testo: 'slide 29' },
        ],
        dx: [
          { t: 'titolo', testo: 'Le date stagionali' },
          { t: 'tabella', col: [38, 33, 29], size: 32, righe: [
            ['Zona o area', 'Invernale o tropicale', 'Estivo'],
            ['Nord Atlantico, zona I', 'W: 16 ott – 15 apr', 'S: 16 apr – 15 ott'],
            ['Nord Atlantico, zona II', 'W: 1 nov – 31 mar', 'S: 1 apr – 31 ott'],
            ['Zona invernale australe', 'W: 16 apr – 15 ott', 'S: 16 ott – 15 apr'],
            ['Mar Baltico', 'W: 1 nov – 31 mar', 'S: 1 apr – 31 ott'],
            ['Mar Arabico', 'T: 1 set – 31 mag', 'S: 1 giu – 31 ago'],
            ['Golfo del Bengala', 'T: 1 dic – 30 apr', 'S: 1 mag – 30 nov'],
          ] },
          { t: 'p', size: 36, testo: 'Golfo del Leone: invernale dal 16 dicembre al 15 marzo solo per navi fino a 100 m. Mar Nero a nord di 44° N: 1 dicembre – 28/29 febbraio, navi fino a 100 m. {{slide 27, 28}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'La marca non va mai sommersa' },
          { t: 'p', testo: 'La Convenzione (articolo 12) vieta di caricare la nave fino a sommergere la marca della zona e della stagione in cui si trova. {{slide 30}}' },
          { t: 'p', testo: 'Se il viaggio attraversa zone diverse, conta la zona con la marca più bassa. {{slide 30}}' },
          { t: 'p', testo: 'Chi supera la marca riceve una sanzione per ogni centimetro di troppo. {{slide 30}}' },
          { t: 'p', testo: 'I valori sono nel Certificato Internazionale di Bordo Libero: 5 anni, con visite annuali. {{slide 8, 32}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Navi di tipo A e di tipo B' },
          { t: 'p', testo: '**Tipo A**: carichi liquidi alla rinfusa, come petroliere e chimichiere. Ponti integri, senza boccaporte: è concesso un bordo libero inferiore. {{slide 9}}' },
          { t: 'p', testo: '**Tipo B**: tutte le altre navi, con grandi boccaporte. {{slide 9}}' },
          { t: 'riquadro', size: 40, testo: 'L = 200 m: bordo libero tabulare 2612 mm (tipo A), 3264 mm (tipo B). {{slide 10}}' },
        ],
      },
      {
        passo: 4,
        sx: [
          { t: 'titolo', testo: 'Quale marca?' },
          ...esercizioMarca(1), ...esercizioMarca(2), ...esercizioMarca(3),
        ],
        dx: [
          { t: 'nota', testo: 'Dopo due tentativi vedi la soluzione. Esercizi: slide 35–38' },
          ...esercizioMarca(4), ...esercizioMarca(5),
        ],
        azione(id) { if (id.startsWith('m:')) { const [, n, m] = id.split(':'); rispondiMarca(Number(n), m); } },
      },
      {
        passo: 4,
        richiede: () => ES_MARCA.every((x) => risolti.has(x.n)), avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Calcolo' },
          { t: 'formula', testo: 'd = TS / 48' },
          { t: 'bottoni', h: 96, size: 38, lista: ES_CALCOLO.map((x) => ({ id: `c:${x.n}`, testo: String(x.n), on: x.n === calcolo.n })) },
          { t: 'p', testo: e.testo },
          ...(esiti[e.n] ? [{ t: 'esito', ...esiti[e.n] }] : []),
          { t: 'nota', testo: `Svolti: ${ES_CALCOLO.filter((x) => risolti.has(x.n)).length} su ${ES_CALCOLO.length}` },
        ],
        dx: [
          { t: 'bottoni', h: 120, size: 38, lista: e.campi.map(([nome], i) => ({ id: `f:${i}`, testo: `${nome}: ${valori[i] || '…'} mm`, on: i === calcolo.campo })) },
          { t: 'spazio', h: 20 },
          { t: 'tastierino' },
        ],
        azione(id) {
          if (id.startsWith('c:')) { calcolo.n = Number(id.slice(2)); calcolo.campo = 0; } else if (id.startsWith('f:')) calcolo.campo = Number(id.slice(2)); else if (id.startsWith('k:') && !risolti.has(calcolo.n)) tastoCalcolo(id.slice(2));
        },
      },
      {
        passo: 4,
        richiede: () => ES_CALCOLO.every((x) => risolti.has(x.n)), avviso: 'Se salti, niente bandiera.',
        sx: completi ? [
          { t: 'titolo', testo: 'Bandiera M guadagnata' },
          { t: 'p', testo: `${Libro.BANDIERE[N].nome}: «${Libro.BANDIERE[N].significato}»` },
          { t: 'nota', testo: 'Bandiera del Codice internazionale dei segnali' },
          { t: 'bottoni', lista: [{ id: 'sez:bandiere:0', testo: 'Le tue bandiere' }] },
        ] : [
          { t: 'titolo', testo: 'Bandiera M non ancora guadagnata' },
          { t: 'p', testo: `Hai saltato qualche passaggio. Per guadagnarla manca: ${mancano.join(', ')}.` },
          { t: 'bottoni', lista: [{ id: `sez:${N}:0`, testo: 'Torna all\'inizio della lezione' }] },
        ],
        dx: [{ t: 'spazio', h: 200 }, { t: 'disegno', h: 720, fn: (c, x, y, w) => (completi ? grandeBandiera(c, x, y, w) : Libro.bandiera(c, N, x + w * 0.1, y, w * 0.8, w * 0.53, false)) }],
      },
    ]);
  }

  // Le azioni delle pagine ricevono anche le scelte del Prevedi
  Motore.sezione(String(N), {
    spreads: () => doppie().map((sp) => ({
      ...sp,
      azione(id) {
        if (id.startsWith('p:')) Libro.aggiorna(N, { prevedi: id.slice(2) });
        else if (sp.azione) sp.azione(id);
        if (daFare().length === 0) Libro.aggiorna(N, { bandiera: true });
      },
    })),
  });
})();
