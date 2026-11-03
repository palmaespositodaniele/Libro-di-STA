/* Lezione 20: logistica e porti. Dati ed esercizi dalle slide 3-44, dati dei porti del 2025 (slide 30).
   Misure dei container dalla slide 22; terminal, porto e catena nei modelli sono schematici */
(function () {
  const N = 20;
  const { COL, tela, etichetta, maniglia, cuoci, segmento } = Tavola;
  const { C } = Pagina;

  const MISSIONI = [
    { id: 'ciclo', testo: 'Porta il container dalla nave fino al gate.' },
    { id: 'teu', testo: 'Confronta un container da 20 e uno da 40 piedi.' },
    { id: 'codice', testo: 'Leggi le quattro parti del codice sul container.' },
    { id: 'carico12', testo: 'Carica 12 TEU usando anche container da 40\'.' },
    { id: 'lato', testo: 'Carica un solo lato: da che parte sbanda la nave?' },
    { id: 'dritta', testo: 'Carica almeno 16 TEU con la nave dritta e senza sbandamento.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Quale Incoterm indica la merce consegnata a bordo nel porto d\'imbarco?', scelte: ['EXW', 'FOB', 'DDP'], giusta: 1, perche: 'Free On Board: da lì rischi e costi passano al compratore.' },
    { n: 2, testo: 'Quale container usi per frutta fresca o farmaci?', scelte: ['Reefer', 'Tank', 'Open top'], giusta: 0, perche: 'Il reefer è il container refrigerato.' },
    { n: 3, testo: 'Quale container usi per un macchinario fuori sagoma?', scelte: ['Dry box', 'Flat rack', 'High cube'], giusta: 1, perche: 'Il flat rack è un pianale con le sole testate.' },
    { n: 4, testo: 'Nel codice MSCU 123456 7, che cosa indica la lettera U?', scelte: ['Il proprietario', 'La categoria', 'Il controllo'], giusta: 1, perche: 'La categoria: U indica un container per merci.' },
    { n: 5, testo: 'Un camion sale sulla nave attraverso una rampa: come si chiama l\'imbarco?', scelte: ['Lo-lo', 'Ro-ro', 'Feeder'], giusta: 1, perche: 'Roll on, roll off: il carico sale su ruote.' },
    { n: 6, testo: 'Chi sale a bordo per assistere il comandante nelle manovre in porto?', scelte: ['L\'ormeggiatore', 'Il pilota', 'Il gruista'], giusta: 1, perche: 'Il pilota: è il servizio di pilotaggio.' },
    { n: 7, testo: 'Quale opera protegge lo specchio d\'acqua del porto dalle onde?', scelte: ['La banchina', 'La darsena', 'La diga foranea'], giusta: 2, perche: 'La diga foranea: opera di difesa esterna.' },
    { n: 8, testo: 'Come si chiama un porto in cui i container passano da nave a nave?', scelte: ['Gateway', 'Interporto', 'Hub di transshipment'], giusta: 2, perche: 'Hub di transshipment, come Gioia Tauro.' },
  ];
  const CALCOLI = [
    { n: 9, testo: 'Quanti TEU sono 300 container da 40\' e 200 da 20\'?', campi: [['totale', 800, 0.001, 'TEU']], soluzione: '300 × 2 + 200 × 1 = 800 TEU' },
    { n: 10, testo: 'Una nave da 24.000 TEU: quanti container da 40\' al massimo?', campi: [['container', 12000, 0.001, '']], soluzione: 'Ogni container da 40\' vale 2 TEU: 12.000' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });
  const fatti = new Set();

  const scatola = (w, h, d, col, x, y, z) => {
    const m = new THREE.Mesh(cuoci(new THREE.BoxGeometry(w, h, d), col), new THREE.MeshBasicMaterial({ vertexColors: true }));
    m.position.set(x, y, z);
    return m;
  };

  /* Simulazione 1: la catena logistica (figura della slide 7) ---------------------------------- */
  const NODI = [['Fornitori', -33], ['Produzione', -11], ['Magazzino', 11], ['Cliente', 33]];
  const ca = { guasto: -1, t: 0, copie: [] };
  const creaCatena = Lezione.simula({
    scala: 0.011, centro: [0, 8], mare: false, k: 2.5, pedana: [0, 44, 'davanti alla catena'],
    vista: () => ({ target: new THREE.Vector3(0, 7, 0), theta: 0.12, phi: 1.3, r: 92 }),
    modello(k, tocca) {
      const g = new THREE.Group();
      g.add(scatola(100, 0.6, 26, '#D8E0EC', 0, -0.3, 0));
      const blocchi = NODI.map(([nome, x], i) => {
        const b = scatola(13, 8, 9, '#0B2545', x, 4, 0); b.userData.tocco = `n${i}`; g.add(b); tocca(b);
        const e = etichetta(nome, 2 + k, '#0B2545'); e.position.set(x, 11, 0); g.add(e);
        return b;
      });
      const tiene = (col, n) => Array.from({ length: n }, () => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), new THREE.MeshBasicMaterial({ color: col })); g.add(m); return m; });
      const e1 = etichetta('merci →', 2 + k, '#8C7020'); e1.position.set(0, 3, 9); g.add(e1);
      const e2 = etichetta('← denaro', 2 + k, '#2F7A55'); e2.position.set(0, 3, -11); g.add(e2);
      const e3 = etichetta('informazioni', 2 + k, '#13315C'); e3.position.set(0, 15, 0); g.add(e3);
      const copia = { blocchi, merci: tiene(COL.ocra, 10), denaro: tiene(0x2F7A55, 10), info: tiene(0x13315C, 6) };
      ca.copie.push(copia);
      return g;
    },
    frame(dt) {
      ca.t += dt * 0.09;
      const lim = ca.guasto < 0 ? 99 : NODI[ca.guasto][1];
      ca.copie.forEach((c) => {
        const scorre = (lista, z, y, verso) => lista.forEach((m, i) => {
          const f = (ca.t + i / lista.length) % 1;
          const x = -33 + (verso > 0 ? f : 1 - f) * 66;
          m.position.set(x, y, z); m.visible = x <= lim; // oltre il guasto non passa più niente
        });
        scorre(c.merci, 7, 1.2, 1); scorre(c.denaro, -7, 1.2, -1); scorre(c.info, 0, 13, 1);
      });
      return true;
    },
  });
  function comandiCatena(id) {
    if (!id.startsWith('t:')) return;
    const i = Number(id.slice(3, 4));
    ca.guasto = ca.guasto === i ? -1 : i;
    ca.copie.forEach((c) => c.blocchi.forEach((b, k) => { b.scale.y = k === ca.guasto ? 0.45 : 1; b.position.y = k === ca.guasto ? 1.8 : 4; }));
    Motore.sporco();
  }

  /* Simulazione 2: il ciclo di un container (figura della slide 33) ------------------------------ */
  const PASSI = ['Arrivo della nave e ormeggio', 'Sbarco con la gru di banchina', 'Trasferimento in piazzale', 'Sosta e controlli (dogana, sanità)', 'Uscita dal gate: camion o treno'];
  const LIMITI = [0.15, 0.55, 0.7, 0.85, 1];
  const te = { p: 0, copie: [] }; const XN = -20;
  const passoCiclo = () => LIMITI.findIndex((l) => te.p <= l + 0.0001);
  const lerp = (a, b, f) => a + (b - a) * Math.max(0, Math.min(1, f));
  function posizioneCiclo() {
    const p = te.p;
    if (p <= 0.15) { const x = lerp(-150, XN, p / 0.15); return { nave: x, c: [x, 7.6, 0] }; }
    if (p <= 0.27) return { nave: XN, c: [XN, lerp(7.6, 25, (p - 0.15) / 0.12), 0], g: 1 };
    if (p <= 0.43) return { nave: XN, c: [lerp(XN, 12, (p - 0.27) / 0.16), 25, 0], g: 1 };
    if (p <= 0.55) return { nave: XN, c: [12, lerp(25, 4.6, (p - 0.43) / 0.12), 0], g: 1 };
    if (p <= 0.7) return { nave: XN, c: [lerp(12, 52, (p - 0.55) / 0.15), 4.6, 0], r: 1 };
    if (p <= 0.85) return { nave: XN, c: [52, 4.6 + Math.sin(((p - 0.7) / 0.15) * Math.PI) * 7, 0], r: 0 };
    return { nave: XN, c: [52, 4.6, lerp(0, 74, (p - 0.85) / 0.15)], r: 2 };
  }
  function posaCiclo() {
    const v = posizioneCiclo();
    te.copie.forEach((c) => {
      c.nave.position.x = v.nave;
      c.cont.position.set(...v.c);
      c.presa.position.set(v.c[0], v.c[1] + 6, v.c[2]);
      const x = v.g ? v.c[0] : 12;
      c.carrello.position.x = x;
      const lun = Math.max(0.5, 27 - (v.g ? v.c[1] + 1.4 : 26));
      c.cavo.scale.y = lun; c.cavo.position.set(x, 28 - lun / 2, 0);
      c.ralla.visible = !!v.r;
      if (v.r === 1) { c.ralla.position.set(v.c[0], 0, 0); c.ralla.rotation.y = 0; } else if (v.r === 2) { c.ralla.position.set(52, 0, v.c[2]); c.ralla.rotation.y = -Math.PI / 2; }
    });
  }
  const creaTerminal = Lezione.simula({
    scala: 0.0058, centro: [30, 4], k: 2.8, pedana: [30, 62, 'sul piazzale'], dopo: posaCiclo,
    vista: () => ({ target: new THREE.Vector3(26, 8, 6), theta: 0.12, phi: 1.02, r: 158 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const dim = 3 + k * 1.2;
      g.add(scatola(190, 3, 220, '#C5CBD3', 95, 0.5, 0));
      // Nave con la poppa a terra: i container sono in coperta
      const nave = new THREE.Group(); const sc = Scafo.crea(k); sc.scale.setScalar(0.72); sc.rotation.y = Math.PI / 2; sc.position.set(0, -4.3, 32); nave.add(sc);
      [['#B3362B', -14], ['#C9A227', -7], ['#5B6B7C', 0], ['#2F7A55', 7], ['#13315C', 14]].forEach(([col, z], i) => { if (i !== 2) nave.add(scatola(5, 2.6, 6, col, 0, 2.6 + 1.3, z)); });
      g.add(nave);
      // Gru di banchina
      const gialla = new THREE.Group();
      [[6, 24], [20, 24], [6, -24], [20, -24]].forEach(([x, z]) => gialla.add(segmento(new THREE.Vector3(x, 2, z), new THREE.Vector3(x, 28, z), 0.6, COL.ocra)));
      gialla.add(segmento(new THREE.Vector3(-34, 28, 0), new THREE.Vector3(30, 28, 0), 0.9, COL.ocra));
      [24, -24].forEach((z) => gialla.add(segmento(new THREE.Vector3(6, 28, z), new THREE.Vector3(6, 28, 0), 0.5, COL.ocra), segmento(new THREE.Vector3(20, 28, z), new THREE.Vector3(20, 28, 0), 0.5, COL.ocra)));
      g.add(Tavola.compatta(gialla));
      const carrello = scatola(4, 1.2, 3, '#0B2545', 12, 27.2, 0); g.add(carrello);
      const cavo = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), new THREE.MeshBasicMaterial({ color: COL.inchiostro })); g.add(cavo);
      // Stack e gantry
      ['#B3362B', '#C9A227', '#5B6B7C', '#2F7A55', '#13315C', '#B3362B'].forEach((col, i) => { g.add(scatola(5, 2.6, 12.2, col, 40 + (i % 3) * 6, 3.4 + Math.floor(i / 3) * 2.8, -22)); });
      ['#13315C', '#C9A227', '#B3362B', '#2F7A55'].forEach((col, i) => { g.add(scatola(5, 2.6, 12.2, col, 64 + (i % 2) * 6, 3.4 + Math.floor(i / 2) * 2.8, -22)); });
      const portale = new THREE.Group();
      [[44, 8], [60, 8], [44, -8], [60, -8]].forEach(([x, z]) => portale.add(segmento(new THREE.Vector3(x, 2, z), new THREE.Vector3(x, 16, z), 0.5, 0x2F7A55)));
      portale.add(segmento(new THREE.Vector3(44, 16, 8), new THREE.Vector3(60, 16, 8), 0.5, 0x2F7A55), segmento(new THREE.Vector3(44, 16, -8), new THREE.Vector3(60, 16, -8), 0.5, 0x2F7A55));
      g.add(Tavola.compatta(portale));
      // Ralla e container
      const ralla = new THREE.Group(); ralla.add(scatola(13, 1, 3, '#20201F', 0, 2.8, 0), scatola(3.5, 3, 3, '#0B2545', 8, 3.5, 0)); g.add(ralla);
      const cont = scatola(12.2, 2.6, 2.6, '#B3362B', 0, 0, 0); g.add(cont);
      // Treno e gate
      g.add(scatola(180, 0.2, 0.3, '#20201F', 95, 2.1, -46), scatola(180, 0.2, 0.3, '#20201F', 95, 2.1, -44));
      ['#B3362B', '#C9A227', '#5B6B7C', '#2F7A55'].forEach((col, i) => g.add(scatola(12, 2.6, 2.6, col, 60 + i * 14, 3.6, -45)));
      g.add(scatola(2, 7, 2, '#0B2545', 40, 5, 76), scatola(2, 7, 2, '#0B2545', 64, 5, 76), scatola(26, 1.4, 2, '#0B2545', 52, 8.5, 76));
      [['gru di banchina (STS)', 14, 33, 0], ['stack', 46, 12, -22], ['treno', 90, 8, -45], ['gate', 52, 12, 76], ['mezzi di piazzale', 52, 19, 8]].forEach(([t, x, y, z]) => { const e = etichetta(t, dim); e.position.set(x, y, z); g.add(e); });
      const presa = maniglia(3 + k * 0.7, 'ciclo'); g.add(presa); tocca(presa);
      te.copie.push({ nave, cont, presa, carrello, cavo, ralla });
      return g;
    },
    trascina(id, dx, dy) {
      const prima = passoCiclo();
      te.p = Math.max(0, Math.min(1, te.p + (dx - dy) * 0.0011));
      posaCiclo();
      if (te.p >= 0.995) lez.completa('ciclo');
      if (passoCiclo() !== prima || te.p >= 0.995) Motore.ridisegna();
    },
  });

  /* Simulazione 3: il container in mano, in metri veri (slide 22-24) ----------------------------- */
  const PIEDE = 0.3048;
  const TIPI = {
    dry: ['Dry box', 'Il container standard, per merci varie.'],
    reefer: ['Reefer', 'Refrigerato: si collega alla corrente della nave o del terminal.'],
    open: ['Open top', 'Per carichi dall\'alto.'],
    flat: ['Flat rack', 'Pianale con le sole testate: per carichi fuori sagoma.'],
    tank: ['Tank', 'Cisterna per liquidi.'],
    hc: ['High cube', 'Più alto di 30 cm: 9,5 piedi invece di 8,5.'],
  };
  const PARTI = {
    prop: 'MSC: il **proprietario**.', cat: 'U: la **categoria**. U indica un container per merci.',
    serie: '123456: il **numero di serie**.', ctrl: '7: la **cifra di controllo**. Si calcola dalle altre e scopre gli errori di trascrizione.',
    angolo: '**Blocco d\'angolo** (*corner casting*): sono otto, per sollevarlo con le gru e fissarlo agli altri.',
    csc: '**Targa CSC**: attesta che rispetta la Convenzione sulla sicurezza dei container (CSC, 1972).',
  };
  const co = { lun: 40, tipo: 'dry', parte: null, copie: [], viste: new Set() };
  const texPorte = () => tela(512, 512, (c) => {
    c.fillStyle = '#B3362B'; c.fillRect(0, 0, 512, 512);
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 3; for (let x = 0; x < 512; x += 42) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 512); c.stroke(); }
    c.strokeStyle = '#20201F'; c.lineWidth = 10; c.beginPath(); c.moveTo(256, 0); c.lineTo(256, 512); c.stroke();
    c.fillStyle = '#FBFAF4'; c.fillRect(30, 40, 452, 130);
    c.fillStyle = '#0B2545'; c.font = '700 74px Atkinson, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left';
    c.fillText('MSC', 50, 105); c.fillText('U', 215, 105); c.font = '700 62px Atkinson, sans-serif'; c.fillText('123456', 262, 105);
    c.fillStyle = '#C9A227'; c.fillRect(442, 72, 34, 66); c.fillStyle = '#0B2545'; c.font = '700 52px Atkinson, sans-serif'; c.fillText('7', 446, 106);
  });
  function posaContainer() {
    const L = co.lun * PIEDE; const B = 8 * PIEDE; const H = (co.tipo === 'hc' ? 9.5 : 8.5) * PIEDE; const t = co.tipo;
    const pieno = t === 'dry' || t === 'reefer' || t === 'hc';
    co.copie.forEach((c) => {
      c.fondo.scale.set(L, 0.14, B); c.fondo.position.y = 0.07;
      c.lati.forEach((m, i) => { m.visible = pieno || t === 'open'; m.scale.set(L, H, 0.05); m.position.set(0, H / 2, (i ? 1 : -1) * (B / 2 - 0.025)); });
      c.tetto.visible = pieno; c.tetto.scale.set(L, 0.06, B); c.tetto.position.y = H - 0.03;
      c.testa.scale.set(0.05, H, B); c.testa.position.set(-L / 2 + 0.03, H / 2, 0);
      c.porte.scale.set(B, H, 1); c.porte.position.set(L / 2, H / 2, 0);
      c.macchina.visible = t === 'reefer'; c.macchina.position.set(-L / 2 - 0.12, H / 2, 0); c.macchina.scale.y = H * 0.8;
      c.cisterna.visible = t === 'tank'; c.cisterna.scale.set(Math.min(L * 0.46, B * 0.6) * 1.9, H * 0.42, B * 0.42); c.cisterna.position.set(0, H / 2 + 0.08, 0);
      c.prese.prop.position.set(L / 2 + 0.01, H * 0.8, B * 0.26); c.prese.cat.position.set(L / 2 + 0.01, H * 0.8, B * 0.08);
      c.prese.serie.position.set(L / 2 + 0.01, H * 0.8, -B * 0.14); c.prese.ctrl.position.set(L / 2 + 0.01, H * 0.8, -B * 0.4);
      c.prese.prop.scale.setScalar(1); c.csc.position.set(L / 2 + 0.01, H * 0.32, -B * 0.28);
      let n = 0; [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => [0.09, H - 0.09].forEach((y) => { c.angoli[n++].position.set(sx * (L / 2 - 0.09), y, sz * (B / 2 - 0.09)); })));
    });
  }
  const creaContainer = Lezione.simula({
    scala: 0.075, centro: [0, 1.2], mare: false, k: 2, pedana: [5, 8, 'accanto al container'], dopo: posaContainer,
    vista: () => ({ target: new THREE.Vector3(0.5, 1.3, 0), theta: 1.05, phi: 1.28, r: 15 }),
    modello(k, tocca) {
      const g = new THREE.Group();
      g.add(scatola(40, 0.1, 40, '#C5CBD3', 0, -0.05, 0));
      const unita = () => cuoci(new THREE.BoxGeometry(1, 1, 1), '#B3362B'); const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
      const pezzo = () => { const m = new THREE.Mesh(unita(), mat); g.add(m); return m; };
      const fondo = pezzo(); const lati = [pezzo(), pezzo()]; const tetto = pezzo(); const testa = pezzo();
      const porte = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texPorte(), side: THREE.DoubleSide })); porte.rotation.y = Math.PI / 2; g.add(porte);
      const macchina = scatola(0.24, 1, 2, '#EEF2F8', 0, 0, 0); g.add(macchina);
      const cisterna = new THREE.Mesh(cuoci(new THREE.SphereGeometry(1, 24, 14), '#D8E0EC'), new THREE.MeshBasicMaterial({ vertexColors: true })); g.add(cisterna);
      const prese = {};
      [['prop', 0.8], ['cat', 0.28], ['serie', 0.62], ['ctrl', 0.2]].forEach(([id, w]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, w), new THREE.MeshBasicMaterial({ visible: false }));
        m.userData.tocco = id; g.add(m); tocca(m); prese[id] = m;
      });
      const csc = scatola(0.03, 0.2, 0.34, '#EEF2F8', 0, 0, 0); csc.userData.tocco = 'csc'; g.add(csc); tocca(csc);
      const angoli = Array.from({ length: 8 }, () => { const a = scatola(0.2, 0.2, 0.2, '#C9A227', 0, 0, 0); a.userData.tocco = 'angolo'; g.add(a); tocca(a); return a; });
      co.copie.push({ fondo, lati, tetto, testa, porte, macchina, cisterna, prese, csc, angoli });
      return g;
    },
  });
  function comandiContainer(id) {
    if (id === 'l:20' || id === 'l:40') { co.lun = Number(id.slice(2)); co.viste.add(id); if (co.viste.has('l:20') && co.viste.has('l:40')) lez.completa('teu'); }
    if (id.startsWith('c:')) co.tipo = id.slice(2);
    if (id.startsWith('t:')) {
      co.parte = id.slice(2).split(',')[0]; fatti.add(co.parte);
      if (['prop', 'cat', 'serie', 'ctrl'].every((x) => fatti.has(x))) lez.completa('codice');
    }
    posaContainer(); Motore.sporco();
  }

  /* Simulazione 5: piano di carico sulla coperta. 6 baie da 20' e 4 file; misure dalla slide 22,
     TEU dalla slide 22, assetto come alla lezione 9 (TRIM = TA − TF). Pesi uguali, inclinazioni schematiche */
  const BAIE = 6; const FILE = 4; const LC = 6.06; const LA = 2.44; const HC = 2.59; const X0C = 45 - (BAIE * LC) / 2;
  const pc = { tipo: 20, celle: Array.from({ length: BAIE * FILE }, () => null), nuovo: 0, copie: [] };
  const cella = (i, j) => i * FILE + j;
  const carichi = () => { const v = new Map(); pc.celle.forEach((c) => { if (c) v.set(c.id, c); }); return [...v.values()]; };
  const teu = () => pc.celle.filter(Boolean).length;
  // Momenti rispetto al centro della coperta, in caselle: lungo la nave (+ verso prua) e di traverso (+ a dritta)
  function momenti() {
    let mx = 0; let mz = 0;
    pc.celle.forEach((c, k) => { if (!c) return; const i = Math.floor(k / FILE); const j = k % FILE; mx += i - (BAIE - 1) / 2; mz += j - (FILE - 1) / 2; });
    return { mx, mz };
  }
  function statoPiano() {
    const { mx, mz } = momenti();
    return {
      assetto: Math.abs(mx) < 0.01 ? 'dritta, TA = TF' : mx > 0 ? 'appruata, TF > TA' : 'appoppata, TA > TF',
      sbanda: Math.abs(mz) < 0.01 ? 'nessuno sbandamento' : mz > 0 ? 'sbandata a dritta' : 'sbandata a sinistra',
      mx, mz,
    };
  }
  function testoPiano() {
    const n = carichi(); const da40 = n.filter((c) => c.tipo === 40).length;
    if (!n.length) return 'Coperta vuota. Scegli il container e tocca una casella.';
    const st = statoPiano();
    return `A bordo ${n.length} container (${da40} da 40'): **${teu()} TEU**. {{slide 22}} Nave **${st.assetto}**, **${st.sbanda}**. {{lezione 9}}`;
  }
  function controllaPiano() {
    const n = carichi(); const st = statoPiano(); const t = teu();
    if (t === 12 && n.some((c) => c.tipo === 40)) lez.completa('carico12');
    const lati = new Set(pc.celle.map((c, k) => (c ? (k % FILE < FILE / 2 ? 's' : 'd') : null)).filter(Boolean));
    if (t >= 4 && lati.size === 1) lez.completa('lato');
    if (t >= 16 && st.mx === 0 && st.mz === 0) lez.completa('dritta');
  }
  const TINTE_C = ['#B3362B', '#2E7DB5', '#2F7A55', '#C9A227', '#5B6B7C', '#8C4A8C'];
  function posaPiano() {
    const st = statoPiano(); const n = carichi();
    pc.copie.forEach((c) => {
      c.assetto.rotation.z = -st.mx * 0.004; c.assetto.rotation.x = st.mz * 0.008;
      c.scatole.forEach((m) => { m.visible = false; });
      n.forEach((ca, q) => {
        const m = c.scatole[q]; const lung = ca.tipo === 40 ? 2 * LC : LC;
        m.scale.set(lung - 0.2, HC, LA - 0.12); m.position.set(X0C + ca.i * LC + lung / 2, Scafo.PONTE + HC / 2 + 0.05, (ca.j - (FILE - 1) / 2) * LA);
        m.material.color.set(TINTE_C[ca.id % TINTE_C.length]); m.visible = true; m.userData.tocco = `pc:${ca.i}:${ca.j}`;
      });
    });
  }
  const creaPiano = Lezione.simula({
    scala: 0.012, centro: [45, 4], k: 4, pedana: [45, 30, 'a dritta'], dopo: posaPiano,
    vista: () => ({ target: new THREE.Vector3(45, 7, 0), theta: 0.75, phi: 1.05, r: 85 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const assetto = new THREE.Group(); assetto.position.set(45, 0, 0);
      const nave = Scafo.crea(k); nave.position.set(-45, -6, 0); assetto.add(nave);
      const caselle = new THREE.Group(); caselle.position.set(-45, -6, 0);
      for (let i = 0; i < BAIE; i++) {
        for (let j = 0; j < FILE; j++) {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(LC - 0.3, LA - 0.2), new THREE.MeshBasicMaterial({ color: (i + j) % 2 ? 0xE3C878 : 0xF4E7B8, transparent: true, opacity: 0.85 }));
          m.rotation.x = -Math.PI / 2; m.position.set(X0C + i * LC + LC / 2, Scafo.PONTE + 0.08, (j - (FILE - 1) / 2) * LA);
          m.userData.tocco = `pc:${i}:${j}`; caselle.add(m); tocca(m);
        }
      }
      const scatole = [];
      for (let q = 0; q < BAIE * FILE; q++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xB3362B }));
        m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: COL.inchiostro })));
        m.visible = false; caselle.add(m); scatole.push(m); tocca(m);
      }
      assetto.add(caselle);
      const pr = etichetta('prua', 4 + k); pr.position.set(55, 6, 0); assetto.add(pr);
      const dr = etichetta('dritta', 4 + k); dr.position.set(-20, 4, 15); assetto.add(dr);
      g.add(assetto);
      pc.copie.push({ assetto, scatole });
      return g;
    },
  });
  function comandiPiano(id) {
    if (id === 'pc:20' || id === 'pc:40') pc.tipo = Number(id.slice(3));
    if (id === 'pc:svuota') pc.celle.fill(null);
    const tocco = id.startsWith('t:') ? id.slice(2).split(',').find((x) => x.startsWith('pc:')) : null;
    if (tocco) {
      const [, i, j] = tocco.split(':').map(Number); const c = pc.celle[cella(i, j)];
      if (c) pc.celle.forEach((x, k) => { if (x && x.id === c.id) pc.celle[k] = null; });
      else if (pc.tipo === 20) pc.celle[cella(i, j)] = { id: ++pc.nuovo, tipo: 20, i, j };
      else {
        // Il 40 piedi occupa due baie: questa e la successiva, o la precedente se in fondo
        const i0 = i + 1 < BAIE && !pc.celle[cella(i + 1, j)] ? i : i - 1 >= 0 && !pc.celle[cella(i - 1, j)] ? i - 1 : -1;
        if (i0 >= 0) { const ca = { id: ++pc.nuovo, tipo: 40, i: i0, j }; pc.celle[cella(i0, j)] = ca; pc.celle[cella(i0 + 1, j)] = ca; }
      }
    }
    controllaPiano(); posaPiano(); Motore.sporco();
  }
  // Pianta della coperta: prua a destra, dritta in basso
  function piantaPiano(c, x, y, w, h) {
    const cw = Math.min((w - 160) / BAIE, (h - 60) / FILE * 2.4); const ch = cw / 2.4; const x0 = x + 60; const y0 = y + 20;
    c.strokeStyle = C.ink; c.lineWidth = 4; c.beginPath();
    c.moveTo(x0 - 40, y0 - 10); c.lineTo(x0 + BAIE * cw + 20, y0 - 10); c.quadraticCurveTo(x0 + BAIE * cw + 90, y0 + (FILE * ch) / 2, x0 + BAIE * cw + 20, y0 + FILE * ch + 10);
    c.lineTo(x0 - 40, y0 + FILE * ch + 10); c.closePath(); c.stroke();
    for (let i = 0; i < BAIE; i++) for (let j = 0; j < FILE; j++) { c.strokeStyle = C.ink2; c.lineWidth = 1.5; c.strokeRect(x0 + i * cw, y0 + j * ch, cw, ch); }
    carichi().forEach((ca) => {
      const lung = ca.tipo === 40 ? 2 : 1;
      c.fillStyle = TINTE_C[ca.id % TINTE_C.length]; c.fillRect(x0 + ca.i * cw + 3, y0 + ca.j * ch + 3, lung * cw - 6, ch - 6);
    });
    c.fillStyle = C.ink2; c.font = Pagina.font('n', 26);
    c.fillText('prua →', x0 + BAIE * cw - 60, y + h - 8); c.fillText('sinistra in alto, dritta in basso', x0, y + h - 8);
  }

  /* Simulazione 4: la pianta del porto (figura della slide 26) ------------------------------------ */
  const LUOGHI = {
    diga: '**Diga foranea**: protegge lo specchio d\'acqua dalle onde.',
    imboccatura: '**Imboccatura**: tra le testate della diga, segnalata da fanali rossi e verdi.',
    avamporto: '**Avamporto**: lo specchio d\'acqua subito dentro l\'imboccatura.',
    bacino: '**Bacino**: lo specchio d\'acqua protetto.',
    darsena: '**Darsena**: lo specchio d\'acqua tra i moli.',
    banchina: '**Banchina**: dove ormeggiano le navi.',
    molo: '**Molo**: anche qui ormeggiano le navi.',
    piazzale: '**Piazzale**: a terra, per i container e le altre merci.',
    magazzino: '**Magazzino**: a terra, insieme a silos e serbatoi.',
  };
  const po = { luogo: null };
  const creaPorto = Lezione.simula({
    scala: 0.0075, centro: [0, 2], k: 2.5, pedana: [0, 92, 'al largo'],
    vista: () => ({ target: new THREE.Vector3(0, 0, 8), theta: 0, phi: 0.72, r: 190 }),
    modello(k, tocca) {
      const g = new THREE.Group();
      const nomina = (m, id) => { m.userData.tocco = id; tocca(m); return m; };
      g.add(nomina(scatola(160, 3, 26, '#C5CBD3', 0, 1, -30), 'banchina'));
      g.add(nomina(scatola(160, 2.6, 40, '#D9CFB5', 0, 0.9, -63), 'piazzale'));
      ['#B3362B', '#C9A227', '#5B6B7C', '#B3362B', '#C9A227'].forEach((col, i) => g.add(nomina(scatola(7, 4, 18, col, -66 + i * 9, 4, -64), 'piazzale')));
      g.add(nomina(scatola(38, 11, 22, '#EEF2F8', 44, 7, -64), 'magazzino'));
      [-36, 0, 36].forEach((x) => g.add(nomina(scatola(11, 3, 40, '#C5CBD3', x, 1, -1), 'molo')));
      g.add(nomina(scatola(100, 4, 7, '#5B6B7C', -30, 1.5, 58), 'diga'), nomina(scatola(34, 4, 7, '#5B6B7C', 63, 1.5, 44), 'diga'));
      const fanale = (x, z, col) => { const f = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 8, 12), new THREE.MeshBasicMaterial({ color: col })); f.position.set(x, 5, z); return f; };
      g.add(fanale(20, 58, 0xB3362B), fanale(46, 44, 0x2F7A55));
      const zona = (w, d, x, z, id) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), new THREE.MeshBasicMaterial({ visible: false })); m.position.set(x, 0.3, z); g.add(nomina(m, id)); };
      zona(30, 40, -18, -1, 'darsena'); zona(25, 40, 18, -1, 'darsena'); zona(150, 28, 0, 34, 'bacino'); zona(26, 30, 33, 52, 'imboccatura'); zona(60, 40, 40, 84, 'avamporto');
      [['banchina', -60, 8, -28], ['molo', 0, 8, 2], ['diga foranea', -40, 9, 58], ['imboccatura', 33, 9, 52], ['magazzino', 44, 18, -64], ['piazzale', -50, 12, -64]].forEach(([t, x, y, z]) => { const e = etichetta(t, 3.5 + k, '#0B2545'); e.position.set(x, y, z); g.add(e); });
      return g;
    },
  });
  function comandiPorto(id) { if (id.startsWith('t:')) po.luogo = id.slice(2).split(',')[0]; }

  const DOMANDE = [
    ['Gioia Tauro movimenta quasi il doppio dei container di Genova. Perché Genova è più importante per le imprese del Nord?', 'Gioia Tauro è un hub: gran parte dei container passa da nave a nave. Genova è un gateway: i container vanno davvero alle fabbriche del Nord.'],
    ['Da Shanghai a Milano, passando per Genova e poi in treno: multimodale, intermodale o combinato?', 'Multimodale e intermodale, perché la merce resta nello stesso container. Anche combinato se i tratti stradali sono brevi.'],
    ['Una fabbrica just in time riceve i componenti con cinque giorni di ritardo. Che cosa succede?', 'Senza scorte la catena si ferma. Si riduce il rischio con una piccola scorta di sicurezza, più fornitori, fornitori più vicini, trasporti più affidabili.'],
  ];
  const ri = new Set();
  function comandiDomande(id) { if (id.startsWith('r:')) ri.add(Number(id.slice(2))); }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const RISPOSTE = { a: '1 TEU', b: '2 TEU', c: '4 TEU' };
    const fatto = passoCiclo();
    const lista = Object.keys(TIPI);
    const bott = (ids) => ({ t: 'bottoni', h: 76, size: 30, lista: ids.map((id) => ({ id: `c:${id}`, testo: TIPI[id][0], on: co.tipo === id })) });
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Il viaggio di uno smartphone' },
          { t: 'p', testo: 'Assemblato in Cina, parte su un camion per Shanghai, viaggia in container su una nave da oltre 20.000 TEU, passa per un grande porto del Mediterraneo e arriva in Italia: un treno o un camion lo porta al magazzino, poi al negozio. {{slide 3}}' },
          { t: 'riquadro', size: 38, testo: 'Oltre l\'80% del commercio mondiale, in volume, viaggia per mare. {{slide 3}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Che cos\'è la logistica' },
          { t: 'p', size: 38, testo: 'La parte della *supply chain* che pianifica, realizza e controlla il flusso e lo stoccaggio di merci, servizi e informazioni, dal punto di origine al punto di consumo. {{slide 5}}' },
          { t: 'p', size: 38, testo: 'In parole semplici: la cosa giusta, nel posto giusto, al momento giusto, spendendo il meno possibile. {{slide 5}}' },
          { t: 'p', size: 38, testo: 'La parola viene da *logis*, alloggio: era l\'arte militare di muovere, alloggiare e rifornire le truppe. {{slide 6}}' },
        ],
      },
      {
        passo: 0, mondo: creaCatena, azione: comandiCatena,
        sx: [
          { t: 'titolo', testo: 'Tre flussi' },
          { t: 'p', size: 38, testo: 'Le merci vanno verso il cliente. Il denaro torna verso i fornitori. Le informazioni corrono nei due sensi. {{slide 7}}' },
          { t: 'riquadro', size: 38, testo: ca.guasto < 0 ? 'Tocca un blocco della catena per fermarlo.' : `**${NODI[ca.guasto][0]}** fermo: un errore in un punto della catena blocca tutto il resto. {{slide 7}}` },
          { t: 'nota', testo: 'Catena schematica' },
        ],
        dx: Lezione.finestra(760, 'Punta un blocco e premi il grilletto per fermarlo.'),
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Il traffico dei porti si misura in **TEU** (*twenty-foot equivalent unit*): l\'unità è il container da 20 piedi. {{slide 22}}' },
        ],
        dx: [
          { t: 'sotto', testo: 'Quanti TEU vale un container da 40 piedi?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:a', testo: '1 TEU', on: p === 'a' },
          { t: 'scelta', id: 'p:b', testo: '2 TEU', on: p === 'b' },
          { t: 'scelta', id: 'p:c', testo: '4 TEU', on: p === 'c' },
        ],
      },
      {
        passo: 2, mondo: creaTerminal, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Il ciclo di un container' },
          ...PASSI.map((t, i) => ({ t: 'spunta', testo: `${i + 1}. ${t}`, fatta: i < fatto || te.p >= 0.995 })),
          { t: 'riquadro', size: 38, testo: te.p >= 0.995 ? 'Il container è uscito dal gate.' : `Ora: **${PASSI[fatto]}**. {{slide 33}}` },
          ...lez.missioni().slice(0, 1),
        ],
        dx: [
          ...Lezione.finestra(760),
          { t: 'nota', testo: 'Trascina la sfera d\'oro verso destra: guidi tu il container. Per l\'export il ciclo è lo stesso, al contrario. Terminal schematico.' },
        ],
      },
      {
        passo: 2, mondo: creaContainer, azione: comandiContainer, richiede: () => lez.fatte.has('ciclo'), avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'sotto', testo: 'Il container da vicino' },
          { t: 'bottoni', h: 80, size: 32, lista: [{ id: 'l:20', testo: '20 piedi', on: co.lun === 20 }, { id: 'l:40', testo: '40 piedi', on: co.lun === 40 }] },
          { t: 'formula', testo: co.lun === 40 ? '40\' = 2 TEU = 1 FEU' : '20\' = 1 TEU' },
          bott(lista.slice(0, 3)), bott(lista.slice(3)),
          { t: 'riquadro', size: 36, testo: `**${TIPI[co.tipo][0]}**: ${TIPI[co.tipo][1]} {{slide 23}}` },
          ...(co.parte ? [{ t: 'riquadro', size: 36, testo: PARTI[co.parte] }] : []),
          ...lez.missioni().slice(1, 3),
        ],
        dx: [
          ...Lezione.finestra(760, 'Punta il codice sulle porte, gli angoli o la targa e premi il grilletto.'),
          { t: 'nota', testo: 'Tocca sulle porte le quattro parti del codice, i blocchi d\'angolo, la targa. Misure vere: slide 22. Il codice è inventato.' },
        ],
      },
      {
        passo: 2, mondo: creaPiano, azione: comandiPiano,
        sx: [
          { t: 'titolo', testo: 'Piano di carico' },
          { t: 'bottoni', h: 80, size: 30, lista: [{ id: 'pc:20', testo: 'Da 20\' (1 TEU)', on: pc.tipo === 20 }, { id: 'pc:40', testo: 'Da 40\' (2 TEU)', on: pc.tipo === 40 }, { id: 'pc:svuota', testo: 'Svuota' }] },
          { t: 'riquadro', size: 34, testo: testoPiano() },
          { t: 'disegno', h: 300, fn: piantaPiano },
          ...lez.missioni().slice(3),
        ],
        dx: [
          ...Lezione.finestra(700, 'Punta una casella sulla coperta e premi il grilletto per caricare.'),
          { t: 'nota', testo: 'Tocca una casella della coperta: carichi lì il container, tocca un container per toglierlo. Pesi uguali; assetto e sbandamento sono schematici, ingranditi per vederli.' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'b' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Il container da 40 piedi è lungo il doppio di quello da 20: vale il doppio.' },
        ],
        dx: [
          { t: 'titolo', testo: '2 TEU, cioè 1 FEU' },
          { t: 'p', testo: 'Misure ISO: lunghi 20 o 40 piedi, larghi 8, alti 8,5 (9,5 nei *high cube*). {{slide 22}}' },
          { t: 'p', testo: 'Le portacontainer più grandi superano i 24.000 TEU e sono lunghe circa 400 m. {{slide 22}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Le 7 R' },
          { t: 'tabella', col: [36, 64], size: 32, righe: [
            ['Right…', 'Esempio'],
            ['*product*', 'il ricambio esatto, non uno simile'],
            ['*quantity*', 'ordinati 500 pezzi, consegnati 500'],
            ['*condition*', 'il surgelato arriva surgelato'],
            ['*place*', 'il porto e la banchina giusti'],
            ['*time*', 'i giocattoli prima di Natale'],
            ['*customer*', 'proprio a chi l\'ha ordinato'],
            ['*cost*', 'senza spendere più del necessario'],
          ] },
          { t: 'nota', testo: 'slide 10' },
        ],
        dx: [
          { t: 'titolo', testo: 'Il just in time' },
          { t: 'p', size: 38, testo: 'Nato alla Toyota: produrre e consegnare solo ciò che serve, quando serve. I fornitori consegnano piccoli lotti, richiamati dai cartellini *kanban*. {{slide 12}}' },
          { t: 'p', size: 38, testo: 'Vantaggi: meno denaro fermo, meno spazio, meno sprechi. Rischio: basta un ritardo per fermare la produzione. {{slide 13}}' },
          { t: 'riquadro', size: 36, testo: 'Marzo 2021: la Ever Given blocca il canale di Suez per sei giorni. {{slide 13}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Le modalità' },
          { t: 'tabella', col: [22, 39, 39], size: 30, righe: [
            ['Modalità', 'Punti di forza', 'Limiti'],
            ['Strada', 'flessibile, porta a porta', 'traffico, inquinamento'],
            ['Ferrovia', 'grandi quantità, meno emissioni', 'percorsi fissi'],
            ['Mare', 'costi bassi per grandi volumi', 'lento, serve un porto'],
            ['Aereo', 'velocissimo', 'costoso, poco carico'],
            ['Condotte', 'flusso continuo ed economico', 'solo liquidi e gas'],
          ] },
          { t: 'nota', testo: 'slide 15' },
        ],
        dx: [
          { t: 'titolo', testo: 'Intermodalità' },
          { t: 'p', size: 36, testo: '**Multimodale**: due o più modalità. **Intermodale**: la merce resta nella stessa unità di carico. **Combinato**: treno o mare, e strada solo all\'inizio e alla fine. {{slide 16}}' },
          { t: 'p', size: 36, testo: 'UTI: container, cassa mobile, semirimorchio. {{slide 17}}' },
          { t: 'p', size: 36, testo: '**Retroporto**: area vicina al porto. **Interporto**: nodo nell\'entroterra, come Verona, Bologna, Nola. **Autostrade del mare**: linee ro-ro. {{slide 18}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Incoterms 2020' },
          { t: 'tabella', col: [34, 66], size: 32, righe: [
            ['Sigla', 'Che cosa dice'],
            ['EXW', 'franco fabbrica: il compratore pensa a tutto'],
            ['FCA, CPT, CIP', 'consegna al primo vettore'],
            ['DAP, DPU, DDP', 'consegna a destino; DDP: anche dazi e dogana'],
            ['FAS', 'sotto bordo, in banchina'],
            ['FOB', 'a bordo nel porto d\'imbarco'],
            ['CFR, CIF', 'nolo pagato fino a destino; CIF: anche assicurazione'],
          ] },
          { t: 'nota', testo: 'slide 19' },
        ],
        dx: [
          { t: 'titolo', testo: 'I documenti' },
          { t: 'p', size: 38, testo: '**Polizza di carico** (*bill of lading*): ricevuta della merce, prova del contratto, titolo per ritirarla. {{slide 20}}' },
          { t: 'p', size: 38, testo: '**Manifesto di carico**: l\'elenco delle merci a bordo, per la dogana. {{slide 20}}' },
          { t: 'p', size: 38, testo: '**CMR** per la strada, **CIM** per la ferrovia, **AWB** per l\'aereo. {{slide 20}}' },
        ],
      },
      {
        passo: 3, mondo: creaPorto, azione: comandiPorto,
        sx: [
          { t: 'titolo', testo: 'La pianta di un porto' },
          { t: 'p', size: 38, testo: 'Dentro la diga ci sono l\'avamporto, i bacini e le darsene; a terra piazzali, magazzini, silos e serbatoi. {{slide 26}}' },
          { t: 'riquadro', size: 40, testo: po.luogo ? LUOGHI[po.luogo] : 'Tocca una parte del porto.' },
          { t: 'nota', testo: 'Pianta schematica' },
        ],
        dx: Lezione.finestra(760, 'Punta una parte del porto e premi il grilletto.'),
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'I terminal' },
          { t: 'tabella', col: [28, 72], size: 32, righe: [
            ['Terminal', 'Attrezzature'],
            ['Container', 'gru di banchina, mezzi di piazzale'],
            ['Ro-ro e ro-pax', 'rampe, rimorchiatori di piazzale'],
            ['Rinfuse secche', 'gru con benna, nastri, silos'],
            ['Rinfuse liquide', 'bracci di carico, tubazioni, serbatoi'],
            ['Merci varie', 'gru, carrelli elevatori, magazzini'],
          ] },
          { t: 'nota', testo: 'slide 27' },
          { t: 'p', size: 36, testo: '**Lo-lo**: il carico si solleva con le gru. **Ro-ro**: sale su ruote, per rampe. {{slide 34}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Hub e gateway' },
          { t: 'p', size: 36, testo: '**Hub di transshipment**: dalle navi madri alle *feeder*, senza uscire dal porto. **Gateway**: la merce va verso l\'entroterra. {{slide 29}}' },
          { t: 'tabella', col: [48, 52], size: 32, righe: [
            ['Porto, 2025', 'Container (TEU)'],
            ['Gioia Tauro', '4,49 milioni'],
            ['Genova', '2,41 milioni'],
            ['La Spezia', '1,22 milioni'],
            ['Italia', '12,8 milioni'],
          ] },
          { t: 'nota', testo: 'slide 30' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Chi fa che cosa' },
          { t: 'p', size: 38, testo: 'Le 16 **Autorità di sistema portuale** programmano, coordinano e controllano; rilasciano concessioni e autorizzazioni. {{slide 31}}' },
          { t: 'p', size: 38, testo: 'La **Capitaneria di porto** si occupa della sicurezza della navigazione e regola i servizi tecnico-nautici. {{slide 31}}' },
          { t: 'p', size: 38, testo: 'Operazioni portuali: carico, scarico, trasbordo, deposito, movimentazione. {{slide 33}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'I servizi tecnico-nautici' },
          { t: 'tabella', col: [34, 66], size: 34, righe: [
            ['Servizio', 'Che cosa fa'],
            ['Pilotaggio', 'il pilota sale a bordo e assiste il comandante'],
            ['Rimorchio', 'i rimorchiatori spingono e tirano la nave'],
            ['Ormeggio', 'gli ormeggiatori fissano le cime'],
            ['Battellaggio', 'trasporto tra nave e terra'],
          ] },
          { t: 'nota', testo: 'slide 36' },
        ],
      },
      {
        passo: 3, azione: comandiDomande,
        sx: [
          { t: 'titolo', testo: 'Pensaci' },
          ...DOMANDE.slice(0, 2).flatMap(([d, r], i) => [{ t: 'p', size: 36, testo: d }, ri.has(i) ? { t: 'riquadro', size: 34, testo: r } : { t: 'bottoni', h: 76, size: 32, lista: [{ id: `r:${i}`, testo: 'Vedi la risposta' }] }]),
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', size: 36, testo: DOMANDE[2][0] },
          ri.has(2) ? { t: 'riquadro', size: 34, testo: DOMANDE[2][1] } : { t: 'bottoni', h: 76, size: 32, lista: [{ id: 'r:2', testo: 'Vedi la risposta' }] },
          { t: 'nota', testo: 'Domande teoriche delle slide 38–40' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'titolo', testo: 'Esercizi' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'titolo', testo: 'Ancora' }, ...lez.domanda(7)],
        dx: [{ t: 'nota', testo: 'Esercizi delle slide 41–44.' }, ...lez.domanda(8)],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'titolo', testo: 'Calcola' }, ...lez.calcoloSx()],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ, ...CALCOLI].map((q) => q.n))),
    ];
  });
})();
