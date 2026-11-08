/* Lezione 3: tipi di navi. Definizioni dalle slide 2-14. Le slide non hanno esercizi né misure:
   le sagome sono schematiche, tutte costruite sullo stesso scafo comune */
(function () {
  const N = 3;
  const { COL, etichetta, maniglia, cuoci, segmento } = Tavola;

  const MISSIONI = [
    { id: 'petrolio', testo: 'Trova la nave che porta il petrolio greggio.' },
    { id: 'quattro', testo: 'Classifica una nave per ognuna delle quattro categorie.' },
    { id: 'semi', testo: 'Carica la piattaforma sulla nave semisommergibile.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Le navi mercantili si distinguono perché sono…', scelte: ['Una fonte di guadagno per una Compagnia', 'Sempre passeggeri', 'Di proprietà dello Stato'], giusta: 0, perche: 'Rappresentano una fonte di guadagno per una Compagnia normalmente privata.' },
    { n: 2, testo: 'Le bulk carrier trasportano…', scelte: ['Carico secco senza imballaggio', 'Solo petrolio', 'Animali vivi'], giusta: 0, perche: 'Carbone, minerali di ferro o granaglie.' },
    { n: 3, testo: 'Le navi da pesca sono navi…', scelte: ['Commerciali', 'Industriali', 'Di servizio'], giusta: 1, perche: 'Contribuiscono alla produzione di qualcosa, non al semplice trasporto.' },
    { n: 4, testo: 'Le bettoline servono per…', scelte: ['Il rifornimento (bunker)', 'Il pilotaggio', 'La pesca'], giusta: 0, perche: 'Provvedono alle operazioni di rifornimento.' },
    { n: 5, testo: 'Le piattaforme petrolifere amministrativamente sono…', scelte: ['Edifici', 'Navi', 'Porti'], giusta: 1, perche: 'Sono classificate come navi, anche se senza propulsione autonoma.' },
    { n: 6, testo: 'A che cosa serve una draga?', scelte: ['A rendere navigabili le acque', 'A posare cavi', 'A rompere il ghiaccio'], giusta: 0, perche: 'Anche per le navi con immersione più grande, in porto o in bassi fondali.' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  const BIANCO = '#F4F0E6'; const GRIGIO = '#5B6B7C'; const VETRO = '#1F2A37'; const BLU = '#13315C'; const ORO = '#C9A227'; const ROSSO = '#B3362B';
  const cassa = (g, x0, x1, y0, y1, z0, z1, col) => {
    const m = new THREE.Mesh(cuoci(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), col), new THREE.MeshBasicMaterial({ vertexColors: true }));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); g.add(m);
    return m;
  };
  const tuga = (g, x0, x1, alto) => { cassa(g, x0, x1, 8, alto, -5.5, 5.5, BIANCO); cassa(g, x0 + 0.5, x1 - 0.5, alto - 1.8, alto - 0.9, -5.55, 5.55, VETRO); };
  const torre = (g, x, y0, y1, r) => {
    [[-r, -r], [r, -r], [r, r], [-r, r]].forEach(([a, b]) => g.add(segmento(new THREE.Vector3(x + a, y0, b), new THREE.Vector3(x + a / 5, y1, b / 5), 0.2, COL.ocra)));
    for (let t = 0.2; t < 1; t += 0.2) { const q = r * (1 - 0.8 * t); const y = y0 + t * (y1 - y0); g.add(segmento(new THREE.Vector3(x - q, y, 0), new THREE.Vector3(x + q, y, 0), 0.12, COL.ocra)); }
  };
  function piattaforma(g, y = 0) {
    [[-16, -12], [16, -12], [-16, 12], [16, 12]].forEach(([x, z]) => cassa(g, x - 2.5, x + 2.5, y, y + 18, z - 2.5, z + 2.5, ORO));
    cassa(g, -22, 22, y + 18, y + 22, -16, 16, GRIGIO);
    cassa(g, -18, -4, y + 22, y + 26, -12, 12, BIANCO);
    torre(g, 12, y + 22, y + 42, 5);
  }

  // Slide 3-14. fa: sovrastrutture sullo scafo comune; sc: scala dello scafo; piena: niente scafo
  const TIPI = [
    { nome: 'Nave da crociera', en: 'cruise vessel', cat: 'c', t: 'Luogo di vacanza per viaggi solitamente circolari.', fa(g) { cassa(g, 8, 84, 8, 14, -6, 6, BIANCO); cassa(g, 8, 84, 10, 10.8, -6.05, 6.05, VETRO); cassa(g, 8, 84, 12, 12.8, -6.05, 6.05, VETRO); cassa(g, 14, 78, 14, 19, -5.5, 5.5, BIANCO); cassa(g, 14, 78, 16, 16.8, -5.55, 5.55, VETRO); cassa(g, 22, 68, 19, 23, -4.5, 4.5, BIANCO); cassa(g, 28, 36, 23, 28, -1.5, 1.5, BLU); } },
    { nome: 'Nave traghetto', en: 'ferry/ro-ro pax', cat: 'c', t: 'Tratte brevi: passeggeri, anche con auto al seguito, e mezzi rotabili.', fa(g) { cassa(g, 4, 80, 8, 13, -6, 6, BIANCO); cassa(g, 22, 62, 13, 17, -5, 5, BIANCO); cassa(g, 22, 62, 14.8, 15.6, -5.05, 5.05, VETRO); cassa(g, -4, 3, 7, 8, -3, 3, ORO); } },
    { nome: 'Portacontainer', en: 'container carrier', cat: 'c', t: 'Unità di carico con misure standard, facili da trasferire su altri mezzi.', fa(g) { tuga(g, 6, 15, 19); ['#B3362B', '#C9A227', GRIGIO, '#2F7A55', BLU, '#B3362B', '#C9A227'].forEach((c, i) => { cassa(g, 19 + i * 8.6, 27 + i * 8.6, 8, 12 + (i % 3) * 2, -5.4, 5.4, c); }); } },
    { nome: 'General cargo', en: 'multipurpose', cat: 'c', t: 'Estremamente versatile, per una grande varietà di merci generiche.', fa(g) { tuga(g, 6, 15, 15); [24, 42, 60].forEach((x) => { cassa(g, x, x + 12, 7.3, 8.6, -4.5, 4.5, GRIGIO); g.add(segmento(new THREE.Vector3(x - 2, 7.2, 0), new THREE.Vector3(x - 2, 16, 0), 0.25, COL.ocra), segmento(new THREE.Vector3(x - 2, 9, 0), new THREE.Vector3(x + 8, 14, 0), 0.14, COL.ocra)); }); } },
    { nome: 'Porta rinfuse', en: 'bulk carrier', cat: 'c', t: 'Carico secco senza imballaggio: carbone, minerali di ferro, granaglie.', fa(g) { tuga(g, 6, 16, 16); for (let i = 0; i < 6; i++) cassa(g, 22 + i * 10, 30 + i * 10, 7.3, 8.8, -4.8, 4.8, GRIGIO); } },
    { nome: 'Petroliera', en: 'oil tanker', cat: 'c', chiave: 'petrolio', t: 'Nave cisterna per il carico liquido: il petrolio.', fa(g) { tuga(g, 6, 16, 16); g.add(segmento(new THREE.Vector3(18, 8, 0), new THREE.Vector3(82, 8, 0), 0.5, 0xB3362B)); [-2.5, 2.5].forEach((z) => g.add(segmento(new THREE.Vector3(18, 7.9, z), new THREE.Vector3(82, 7.9, z), 0.22, 0xC9A227))); cassa(g, 46, 52, 7.4, 9.4, -6, 6, ORO); } },
    { nome: 'Nave per gas liquefatto', en: 'gas carrier', cat: 'c', t: 'Nave cisterna per il gas liquefatto.', fa(g) { tuga(g, 6, 15, 15); [28, 44, 60, 76].forEach((x) => { const m = new THREE.Mesh(cuoci(new THREE.SphereGeometry(1, 20, 12), BIANCO), new THREE.MeshBasicMaterial({ vertexColors: true })); m.scale.set(7, 5, 5.4); m.position.set(x, 8.2, 0); g.add(m); }); } },
    { nome: 'Car carrier', en: 'RO-RO solo cargo', cat: 'c', t: 'Auto nuove, dal mercato di produzione a quello di vendita.', fa(g) { cassa(g, 2, 86, 8, 20, -6, 6, BIANCO); cassa(g, 72, 80, 20, 22, -5, 5, VETRO); } },
    { nome: 'Nave da pesca', en: 'fishing vessel', cat: 'i', sc: 0.42, t: 'Contribuisce alla produzione, non al semplice trasporto.', fa(g) { tuga(g, 55, 75, 17); g.add(segmento(new THREE.Vector3(14, 7.4, -5), new THREE.Vector3(14, 19, 0), 0.5, 0xC9A227), segmento(new THREE.Vector3(14, 7.4, 5), new THREE.Vector3(14, 19, 0), 0.5, 0xC9A227)); } },
    { nome: 'Piattaforma petrolifera', en: 'offshore', cat: 'i', piena: true, t: 'Amministrativamente è una nave, anche senza propulsione autonoma.', fa(g) { const p = new THREE.Group(); p.position.set(45, 0, 0); piattaforma(p); g.add(p); } },
    { nome: 'Rimorchiatore', en: 'tug', cat: 's', sc: 0.34, t: 'Coadiuva la manovra delle navi.', fa(g) { cassa(g, 52, 76, 8, 13, -5.5, 5.5, BIANCO); tuga(g, 58, 72, 18); cassa(g, 14, 20, 8, 10, -2, 2, ORO); } },
    { nome: 'Bettolina', en: 'harbour tanker', cat: 's', sc: 0.42, t: 'Provvede alle operazioni di rifornimento (bunker).', fa(g) { tuga(g, 4, 18, 15); cassa(g, 24, 80, 8, 10, -5, 5, ROSSO); } },
    { nome: 'Chiatta', en: 'barge', cat: 's', piena: true, t: 'Fondo piatto, forma a scatola, senza sovrastrutture né propulsione.', fa(g) { cassa(g, 10, 80, -3, 3, -9, 9, GRIGIO); cassa(g, 10, 80, 3, 3.3, -9, 9, ROSSO); } },
    { nome: 'Pilotina', en: 'pilot vessel', cat: 's', sc: 0.24, t: 'Un servizio portuale: porta il pilota.', fa(g) { tuga(g, 40, 70, 16); } },
    { nome: 'Draga', en: 'dredge', cat: 'x', sc: 0.62, t: 'Rende le acque navigabili, in porto o in bassi fondali.', fa(g) { tuga(g, 6, 20, 16); cassa(g, 30, 74, 8, 12, -4, 4, GRIGIO); g.add(segmento(new THREE.Vector3(36, 8, 7), new THREE.Vector3(70, 0, 7), 0.8, 0xC9A227)); } },
    { nome: 'Posacavi', en: 'cable-laying ship', cat: 'x', sc: 0.78, t: 'Installa linee elettriche sottomarine.', fa(g) { tuga(g, 50, 72, 18); const d = new THREE.Mesh(cuoci(new THREE.CylinderGeometry(6, 6, 7, 24), ORO), new THREE.MeshBasicMaterial({ vertexColors: true })); d.rotation.x = Math.PI / 2; d.position.set(22, 14, 0); g.add(d); } },
    { nome: 'Rompighiaccio', en: 'icebreaker', cat: 'x', sc: 0.7, t: 'Una delle navi speciali, molto avanzate tecnologicamente.', fa(g) { cassa(g, 8, 62, 8, 14, -6, 6, ROSSO); tuga(g, 14, 50, 20); cassa(g, 26, 30, 20, 26, -2, 2, BIANCO); } },
    { nome: 'Nave oceanografica', en: 'oceanographic ship', cat: 'x', sc: 0.62, t: 'Per motivi di ricerca in ambito marino.', fa(g) { tuga(g, 34, 74, 18); g.add(segmento(new THREE.Vector3(8, 7.4, -6), new THREE.Vector3(2, 15, -6), 0.4, 0xC9A227), segmento(new THREE.Vector3(8, 7.4, 6), new THREE.Vector3(2, 15, 6), 0.4, 0xC9A227), segmento(new THREE.Vector3(2, 15, -6), new THREE.Vector3(2, 15, 6), 0.4, 0xC9A227)); } },
    { nome: 'Drillship', en: 'drillship', cat: 'x', t: 'Trivella il fondale per individuare i giacimenti.', fa(g) { tuga(g, 66, 80, 18); cassa(g, 36, 54, 8, 11, -5.5, 5.5, GRIGIO); torre(g, 45, 11, 34, 6); } },
  ];
  const CATEGORIE = { c: 'Commerciali', i: 'Industriali', s: 'Di servizio', x: 'Speciali' };
  const st = { i: 0, resto: 0, esito: null, risposte: {}, azzecca: new Set(), copie: [] };

  function posaGalleria() {
    const t = TIPI[st.i];
    st.copie.forEach((c) => {
      c.ponti.forEach((d, i) => { d.visible = i === st.i; });
      c.scafo.visible = !t.piena;
      const s = t.sc || 1;
      c.gruppo.scale.setScalar(s); c.gruppo.position.set(45 * (1 - s), -6 * s, 0);
      c.nomi.forEach((e, i) => { e.visible = i === st.i; });
    });
    if (t.chiave) lez.completa(t.chiave);
  }
  function cambia(d) { st.i = (st.i + d + TIPI.length) % TIPI.length; st.esito = null; posaGalleria(); }
  const creaGalleria = Lezione.simula({
    scala: 0.0115, centro: [45, 2], k: 3, pedana: [45, 44, 'a dritta'], dopo: posaGalleria,
    vista: () => ({ target: new THREE.Vector3(45, 4, 0), theta: 0.42, phi: 1.28, r: 124 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const gruppo = new THREE.Group(); g.add(gruppo);
      const scafo = Scafo.crea(k, true); gruppo.add(scafo);
      const ponti = TIPI.map((t) => { const d = new THREE.Group(); t.fa(d); d.visible = false; gruppo.add(d); return d; });
      const nomi = TIPI.map((t) => { const e = etichetta(t.nome, 3 + k, '#FBFAF4'); e.position.set(45, 34, 0); g.add(e); return e; });
      st.copie.push({ scafo, gruppo, ponti, nomi });
      return g;
    },
  });
  function comandiGalleria(id) {
    if (id === 'g+') cambia(1);
    if (id === 'g-') cambia(-1);
    if (id.startsWith('c:')) {
      const t = TIPI[st.i]; const scelta = id.slice(2);
      if (scelta === t.cat) {
        st.esito = { tipo: 'giusto', testo: `${t.nome}: nave ${CATEGORIE[t.cat].toLowerCase()}.` };
        st.azzecca.add(t.cat);
        if (st.azzecca.size === 4) lez.completa('quattro');
      } else st.esito = { tipo: 'errato', testo: 'Non è questa categoria: rileggi la frase.' };
    }
    Motore.sporco();
  }

  /* Seconda simulazione: la nave semisommergibile carica una piattaforma (slide 14) --------------- */
  const se = { imm: 0, z: 34, a: false, copie: [] }; const MAX = 12;
  function posaSemi() {
    const dy = -se.imm * MAX; const a = se.z < 3;
    se.copie.forEach((c) => {
      c.nave.position.y = dy - 6;
      // A bordo la piattaforma sale e scende con la nave; prima galleggia
      c.carico.position.set(45, a ? dy + 2 : -10, se.z);
      c.pImm.position.set(82, 18 + dy, 0); c.pZ.position.set(45, 30 + (a ? dy + 14 : 0), se.z);
    });
  }
  const creaSemi = Lezione.simula({
    scala: 0.009, centro: [45, 2], k: 3, pedana: [45, 62, 'al largo'], dopo: posaSemi,
    vista: () => ({ target: new THREE.Vector3(45, 6, 8), theta: 0.5, phi: 1.26, r: 150 }),
    modello(k, tocca) {
      const g = new THREE.Group();
      const nave = new THREE.Group(); nave.add(Scafo.crea(k, true)); tuga(nave, 76, 86, 16); g.add(nave);
      const carico = new THREE.Group(); carico.scale.setScalar(0.72); piattaforma(carico); g.add(carico);
      const pImm = maniglia(2 + k * 0.4, 'imm'); const pZ = maniglia(2 + k * 0.4, 'zeta'); g.add(pImm, pZ); tocca(pImm); tocca(pZ);
      pImm.userData.vincolo = { asse: [0, 1, 0] }; pZ.userData.vincolo = { asse: [0, 0, 1] }; // la nave scende, la piattaforma scorre sopra
      se.copie.push({ nave, carico, pImm, pZ });
      return g;
    },
    trascina(id, dx, dy, info) {
      const eraA = se.z < 3; const prima = `${Math.round(se.imm * 4)}|${eraA}`;
      const giu = info ? -info.s / MAX : dy * 0.004; const dz = info ? info.s : dx * 0.1;
      if (id === 'imm') se.imm = Math.max(0, Math.min(1, se.imm + giu));
      // La piattaforma entra sopra la coperta solo con la nave affondata
      if (id === 'zeta' && (se.imm > 0.75 || se.z < 3)) se.z = Math.max(0, Math.min(34, se.z + dz));
      if (id === 'zeta' && se.imm <= 0.75 && !eraA) se.z = Math.max(16, Math.min(34, se.z + dz));
      posaSemi();
      if (se.z < 3 && se.imm < 0.08) lez.completa('semi');
      if (`${Math.round(se.imm * 4)}|${se.z < 3}` !== prima) Motore.ridisegna();
    },
  });
  function faseSemi() {
    if (se.z < 3) return se.imm < 0.08 ? 'La nave è risalita con il carico.' : 'Ora fai risalire la nave.';
    return se.imm > 0.75 ? 'Coperta sott\'acqua: porta la piattaforma sopra la nave.' : 'Abbassa la nave: la coperta deve andare sott\'acqua.';
  }

  /* Terza simulazione: la draga (slide 13) ---------------------------------------------------------- */
  const dr = { fondo: 4.5, x: -60, copie: [] }; const T = 6;
  function posaDraga() {
    dr.copie.forEach((c) => {
      c.fondale.position.y = -dr.fondo - 5; c.nave.position.x = dr.x; c.presa.position.y = -dr.fondo + 9;
    });
  }
  const creaDraga = Lezione.simula({
    scala: 0.0072, centro: [10, 0], k: 3, mare: false, pedana: [10, 60, 'davanti alla sezione'], dopo: posaDraga,
    vista: () => ({ target: new THREE.Vector3(14, -2, 0), theta: 0, phi: 1.54, r: 172 }),
    modello(k, tocca) {
      const g = new THREE.Group();
      // Sezione: l'acqua è una lastra trasparente, così si vede il fondale sotto la nave
      const acqua = new THREE.Mesh(new THREE.BoxGeometry(240, 22, 40), new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.3, depthWrite: false }));
      acqua.position.set(40, -11, 0); g.add(acqua);
      const prima = new THREE.Mesh(cuoci(new THREE.BoxGeometry(120, 10, 40), '#D9CFB5'), new THREE.MeshBasicMaterial({ vertexColors: true })); prima.position.set(70, -7.5, 0); g.add(prima);
      const fondale = new THREE.Mesh(cuoci(new THREE.BoxGeometry(120, 10, 40), '#C9B98E'), new THREE.MeshBasicMaterial({ vertexColors: true })); g.add(fondale);
      prima.position.set(-70, -24, 0);
      fondale.position.x = 40;
      const nave = new THREE.Group(); const sc = Scafo.crea(k); sc.scale.setScalar(0.8); sc.position.set(-36, -T, 0); nave.add(sc); g.add(nave);
      const presa = maniglia(2.4 + k * 0.5, 'fondo'); presa.position.set(40, 6, 16); g.add(presa); tocca(presa);
      presa.userData.vincolo = { asse: [0, 1, 0] }; // la sfera scende col fondale
      const e = etichetta('fondale da dragare', 4 + k, '#FBFAF4'); e.position.set(40, 14, 16); g.add(e);
      dr.copie.push({ fondale, nave, presa });
      return g;
    },
    trascina(id, dx, dy, info) {
      const prima = dr.fondo > T;
      dr.fondo = Math.max(4.5, Math.min(11, dr.fondo + (info ? -info.s : dy * 0.02)));
      posaDraga();
      if ((dr.fondo > T) !== prima) Motore.ridisegna();
    },
    frame(dt) {
      const meta = dr.fondo > T ? 60 : -60;
      if (Math.abs(dr.x - meta) < 0.2) return false;
      dr.x += Math.sign(meta - dr.x) * Math.min(Math.abs(meta - dr.x), dt * 14);
      posaDraga();
      return true;
    },
  });

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const RISPOSTE = { b: 'La bulk carrier', o: 'La oil tanker', c: 'La portacontainer' };
    const t = TIPI[st.i];
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Le navi mercantili' },
          { t: 'p', testo: 'Sono impegnate nel normale trasporto di merci e passeggeri, o attrezzate per attività e lavori specifici. {{slide 2}}' },
          { t: 'p', testo: 'Si distinguono da navi militari e imbarcazioni da diporto perché sono una fonte di guadagno per una Compagnia normalmente privata. {{slide 2}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Quattro categorie' },
          { t: 'tabella', col: [30, 70], size: 34, righe: [
            ['Navi', 'A che cosa servono'],
            ['Commerciali', 'trasporto di merci e/o passeggeri'],
            ['Industriali', 'contribuiscono alla produzione di qualcosa'],
            ['Di servizio', 'attività utili alle altre navi'],
            ['Speciali', 'attività particolari, tecnologia avanzata'],
          ] },
          { t: 'nota', testo: 'slide 3, 9, 10, 13' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Ogni nave è specializzata per il suo carico: la forma della coperta lo racconta.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Quale nave porta il petrolio greggio?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:b', testo: 'La bulk carrier', on: p === 'b' },
          { t: 'scelta', id: 'p:o', testo: 'La oil tanker', on: p === 'o' },
          { t: 'scelta', id: 'p:c', testo: 'La portacontainer', on: p === 'c' },
        ],
      },
      {
        passo: 2, mondo: creaGalleria, azione: comandiGalleria, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'passo', id: 'g', nome: `Nave ${st.i + 1} di ${TIPI.length}`, valore: t.nome },
          { t: 'riquadro', size: 36, testo: `*${t.en}*. ${t.t}` },
          { t: 'sotto', testo: 'Di quale categoria è?' },
          { t: 'bottoni', h: 80, size: 32, lista: ['c', 'i'].map((k) => ({ id: `c:${k}`, testo: CATEGORIE[k] })) },
          { t: 'bottoni', h: 80, size: 32, lista: ['s', 'x'].map((k) => ({ id: `c:${k}`, testo: CATEGORIE[k] })) },
          ...(st.esito ? [{ t: 'esito', ...st.esito }] : []),
          ...lez.missioni().slice(0, 2),
        ],
        dx: [
          ...Lezione.finestra(760),
          { t: 'nota', testo: 'Le frecce cambiano nave. Sagome schematiche sullo stesso scafo: scale e forme non sono misure.' },
        ],
      },
      {
        passo: 2, mondo: creaSemi, richiede: () => lez.fatte.has('petrolio'), avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Caricare una piattaforma' },
          { t: 'p', size: 38, testo: 'Le navi semisommergibili (*semi-submersible heavy-lift ship*) caricano elementi mastodontici, come piattaforme petrolifere intere. {{slide 14}}' },
          { t: 'riquadro', size: 38, testo: faseSemi() },
          ...lez.missioni().slice(2),
          { t: 'nota', testo: 'Sfera a prua: giù e su affonda e solleva la nave. Sfera sulla piattaforma: di lato la porti sulla coperta.' },
        ],
        dx: Lezione.finestra(760),
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'o' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Il petrolio è un carico liquido: viaggia in una nave cisterna, non in una porta rinfuse.' },
        ],
        dx: [
          { t: 'titolo', testo: 'Senza imballaggio' },
          { t: 'tabella', col: [46, 54], size: 32, righe: [
            ['Nave', 'Carico'],
            ['Bulk carrier', 'carbone, minerali di ferro, granaglie'],
            ['Oil tanker', 'petrolio'],
            ['Product carrier', 'prodotti raffinati'],
            ['Gas carrier', 'gas liquefatto'],
            ['Chemical tanker', 'prodotti chimici'],
          ] },
          { t: 'nota', testo: 'slide 7' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Navi commerciali' },
          { t: 'p', size: 38, testo: 'Le **navi da crociera** sono luogo di vacanza; le **navi traghetto** servono tratte brevi. {{slide 3}}' },
          { t: 'p', size: 38, testo: 'Le **portacontainer** trasportano unità di carico con misure standard: facili da trasferire su altri mezzi. {{slide 5}}' },
          { t: 'p', size: 38, testo: 'Le **general cargo** sono versatili, ma piuttosto superate dalla specializzazione merceologica. {{slide 5, 6}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Navi di servizio' },
          { t: 'p', size: 38, testo: 'Servizi portuali: **rimorchiatori** (*tug*), **bettoline** (*harbour tanker*), **pilotine** (*pilot vessel*), **chiatte** (*barge*). {{slide 10, 11}}' },
          { t: 'p', size: 38, testo: 'In ambito oceanico: i *supply vessel*, con sigle come PSV, OSV e AHTS. {{slide 12}}' },
          { t: 'nota', testo: 'Il rimorchiatore della lezione 2 è tra le navi speciali perché il suo scopo non è il trasporto; qui la categoria è più precisa.' },
        ],
      },
      {
        passo: 3, mondo: creaDraga,
        sx: [
          { t: 'titolo', testo: 'La draga' },
          { t: 'p', size: 38, testo: 'Le draghe (*dredge*), in porto o in bassi fondali, rendono le acque navigabili anche per le navi con immersione più grande. {{slide 13}}' },
          { t: 'riquadro', size: 38, testo: dr.fondo > T ? 'Fondale abbastanza profondo: la nave passa.' : 'La nave si ferma: il fondale è più basso della sua immersione.' },
          { t: 'nota', testo: 'Tira giù la sfera d\'oro: scavi il fondale. Profondità schematiche.' },
        ],
        dx: Lezione.finestra(760),
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Navi speciali' },
          { t: 'tabella', col: [40, 60], size: 32, righe: [
            ['Nave', 'A che cosa serve'],
            ['Posacavi, posatubi', 'linee elettriche o condotti sottomarini'],
            ['Rompighiaccio', '*icebreaker*'],
            ['Oceanografiche', 'ricerca in ambito marino'],
            ['Semisommergibili', 'elementi mastodontici'],
            ['Drillship', 'trivellano il fondale per i giacimenti'],
          ] },
          { t: 'nota', testo: 'slide 13, 14' },
        ],
        dx: [
          { t: 'titolo', testo: 'Navi industriali' },
          { t: 'p', testo: 'Navi da pesca (*fishing vessel*) e mezzi dell\'offshore, cioè l\'estrazione di combustibili fossili. {{slide 9}}' },
          { t: 'p', testo: 'Le piattaforme petrolifere sono classificate come navi anche se non hanno propulsione autonoma. {{slide 9}}' },
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
