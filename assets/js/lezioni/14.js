/* Lezione 14: miglio nautico e nodo. Valori dalle slide 9-19. Nella prova il globo e i righelli non
   sono in scala; le velocità delle navi sono scelte qui e il tempo è accelerato. La cima segue le
   misure vere: un nodo ogni 15,433 m, clessidra di 30 s */
(function () {
  const N = 14;
  const { COL, tratto, segmento, etichetta, pedana, compatta } = Tavola;

  const MISSIONI = [
    { id: 'primo', testo: 'Dividi il meridiano fino a 1 primo d\'arco.' },
    { id: 'conta', testo: 'Lancia la barchetta e conta i nodi.' },
    { id: 'seconda', testo: 'Rifallo con un\'altra nave: il conto torna?' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Un miglio nautico è pari a circa…', scelte: ['1000 m', '1852 m', '2000 m'], giusta: 1, perche: '1 NM è circa 1852 m.' },
    { n: 2, testo: 'Il nodo è il rapporto tra…', scelte: ['Miglia nautiche e ore', 'Chilometri e ore', 'Metri e secondi'], giusta: 0, perche: '1 kn = 1 NM / 1 h.' },
    { n: 3, testo: 'Quanto durava la clessidra del solcometro?', scelte: ['30 s', '60 s', '120 s'], giusta: 0, perche: '30 secondi, la 120ª parte di un\'ora.' },
    { n: 4, testo: 'La stazza è una misura di…', scelte: ['Peso', 'Volume', 'Lunghezza'], giusta: 1, perche: 'È il volume degli spazi chiusi della nave.' },
    { n: 5, testo: 'La stazza netta (NT) rappresenta…', scelte: ['Tutti gli spazi chiusi', 'Il volume per il carico', 'Il peso della nave'], giusta: 1, perche: 'Il volume degli spazi destinati a contenere il carico.' },
    { n: 6, testo: 'Nel radar c\'è ½ nella formula perché il segnale…', scelte: ['Va e torna', 'Rallenta', 'Si divide in due'], giusta: 0, perche: 'Percorre 2 volte la distanza tra noi e il bersaglio.' },
  ];
  const CALCOLI = [
    { n: 7, testo: 'Circonferenza della Terra: 40 000 km. Quanti metri è 1 NM?', campi: [['1 NM', 1851.85, 0.01, 'm']], soluzione: '40 000 000 m / 21 600 = 1851,85 m' },
    { n: 8, testo: 'Converti 20 kts in km/h.', campi: [['velocità', 37.04, 0.001, 'km/h']], soluzione: '20 kts · 1,852 = 37,04 km/h' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  const s = { livello: 0, fase: 'pronta', t: 0, nave: 0, nodi: 0, sbagli: 0, esito: null, sec: 30 };

  /* ---- Il meridiano diviso ---- */
  const CY = 16; const R = 12; const LAT = (44.33 * Math.PI) / 180;
  const LIVELLI = [
    { testo: 'Meridiano intero: 360°, circa 40 000 km.', vista: { target: new THREE.Vector3(0, CY, 0), r: 64 } },
    { testo: '40 000 km / 360 = 111,11 km: è 1 grado. Ha 60 primi.', vista: { target: new THREE.Vector3(18, CY, 0), r: 88 } },
    { testo: '111 111 m / 60 = 1851,85 m ≈ 1852 m: è 1 primo, cioè 1 miglio.', vista: { target: new THREE.Vector3(24, CY, 0), r: 128 } },
  ];
  const copieGlobo = []; const toccaGlobo = { schermo: [], mini: [] };
  function cerchio(punto, raggio, col) {
    const q = []; for (let i = 0; i < 48; i++) q.push(punto((i / 48) * Math.PI * 2));
    return tratto(q, raggio, col, true);
  }
  // Righello leggermente curvo come l'arco che ingrandisce
  function righello(x, tacche, k, col) {
    const g = new THREE.Group(); const H = 20;
    const p = (t) => new THREE.Vector3(x + 2.4 * (1 - (2 * t - 1) ** 2), CY + (t - 0.5) * H, 0);
    const q = []; for (let i = 0; i <= 24; i++) q.push(p(i / 24));
    g.add(tratto(q, 0.11 * k, col));
    for (let i = 0; i <= tacche; i++) {
      const a = p(i / tacche); const lungo = i % 10 === 0;
      g.add(segmento(a, new THREE.Vector3(a.x + (lungo ? 1.3 : 0.7), a.y, 0), 0.04 * k, col));
    }
    return { g, p };
  }
  function globo(k) {
    const g = new THREE.Group(); const c = new THREE.Vector3(0, CY, 0);
    const sfera = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 24), new THREE.MeshBasicMaterial({ color: COL.scafo, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 }));
    sfera.position.copy(c); g.add(sfera);
    sfera.userData.tocco = 'globo'; toccaGlobo[k > 1 ? 'mini' : 'schermo'].push(sfera);
    const reticolo = new THREE.Group();
    [-60, -30, 0, 30, 60].forEach((a) => {
      const l = (a * Math.PI) / 180;
      reticolo.add(cerchio((t) => new THREE.Vector3(R * Math.cos(l) * Math.cos(t), CY + R * Math.sin(l), R * Math.cos(l) * Math.sin(t)), 0.05 * k, COL.medio));
    });
    [30, 60, 90, 120, 150].forEach((a) => {
      const l = (a * Math.PI) / 180;
      reticolo.add(cerchio((t) => new THREE.Vector3(R * Math.cos(t) * Math.cos(l), CY + R * Math.sin(t), R * Math.cos(t) * Math.sin(l)), 0.05 * k, COL.medio));
    });
    g.add(compatta(reticolo));
    g.add(cerchio((t) => new THREE.Vector3((R + 0.1) * Math.cos(t), CY + (R + 0.1) * Math.sin(t), 0), 0.16 * k, COL.ocra));
    const dim = 3 + k;
    const nome = etichetta('meridiano: 40 000 km', dim, '#8C7020'); nome.position.set(0, CY + R + 3, 0); g.add(nome);

    const p = new THREE.Vector3(c.x + R * Math.cos(LAT), c.y + R * Math.sin(LAT), 0);
    const punto = new THREE.Mesh(new THREE.SphereGeometry(0.5 * k, 12, 8), new THREE.MeshBasicMaterial({ color: COL.rosso }));
    punto.position.copy(p);
    const lat = etichetta('44°20\'', dim, '#B3362B'); lat.position.set(p.x + 1, p.y + 2.6, 0);

    const uno = new THREE.Group(); const r1 = righello(22, 60, k, COL.inchiostro);
    uno.add(compatta(r1.g), punto, lat);
    uno.add(segmento(p, r1.p(0), 0.05 * k, COL.rosso), segmento(p, r1.p(1), 0.05 * k, COL.rosso));
    const e1 = etichetta('1° = 111,11 km', dim); e1.position.set(23, CY + 12.6, 0); uno.add(e1);
    const e11 = etichetta('60 primi', dim, '#5B6B7C'); e11.position.set(23, CY - 12.6, 0); uno.add(e11);
    g.add(uno);

    const due = new THREE.Group(); const r2 = righello(48, 10, k, COL.rosso);
    const a = r1.p(0.5); const b = r1.p(0.5 + 1 / 60);
    due.add(compatta(r2.g), tratto([a, a.clone().lerp(b, 0.5), b], 0.22 * k, COL.rosso));
    due.add(segmento(a, r2.p(0), 0.05 * k, COL.rosso), segmento(b, r2.p(1), 0.05 * k, COL.rosso));
    const e2 = etichetta('1\' = 1 miglio', dim, '#B3362B'); e2.position.set(49, CY + 12.6, 0); due.add(e2);
    const e21 = etichetta('≈ 1852 m', dim, '#B3362B'); e21.position.set(49, CY - 12.6, 0); due.add(e21);
    g.add(due);
    copieGlobo.push({ uno, due });
    return g;
  }
  function mostraLivello() {
    copieGlobo.forEach((c) => { c.uno.visible = s.livello >= 1; c.due.visible = s.livello >= 2; });
  }

  let mondoGlobo = null;
  function creaGlobo() {
    if (mondoGlobo) return mondoGlobo;
    const radice = new THREE.Group();
    radice.add(globo(1), Scafo.mare());
    const fine = etichetta('non in scala', 2.4, '#5B6B7C'); fine.position.set(30, 1.8, 6); radice.add(fine);
    const stazioni = [
      { pedana: pedana(0, 36, 'davanti al globo'), pos: new THREE.Vector3(0, 0.25, 36), yaw: 0 },
      { pedana: pedana(36, 34, 'davanti ai righelli'), pos: new THREE.Vector3(36, 0.25, 34), yaw: 0 },
    ];
    stazioni.forEach((st) => { st.pedana.visible = false; });
    const SC = 0.0085; const mini = new THREE.Group();
    mini.add(globo(2.4)); mini.scale.setScalar(SC); mini.position.set(-22 * SC, -0.02, 0);
    mostraLivello();
    mondoGlobo = {
      radice, stazioni, modellino: mini,
      vistaIniziale: () => ({ target: LIVELLI[0].vista.target.clone(), theta: 0, phi: 1.52, r: 64 }),
      tocchi: (v) => toccaGlobo[v === 'mini' ? 'mini' : 'schermo'],
      frame() { return false; },
    };
    return mondoGlobo;
  }
  function comandiGlobo(idTocco) {
    // Toccando il globo si divide; all'ultimo tocco si ricomincia
    const id = idTocco.startsWith('t:') ? (s.livello < 2 ? 'dividi' : 'daccapo') : idTocco;
    if (id === 'dividi' && s.livello < 2) {
      s.livello += 1;
      if (s.livello === 2) lez.completa('primo');
    }
    if (id === 'daccapo') s.livello = 0;
    mostraLivello();
    Motore.vista({ target: LIVELLI[s.livello].vista.target.clone(), r: LIVELLI[s.livello].vista.r });
    Motore.sporco();
  }

  /* ---- Il solcometro a barchetta ---- */
  const PASSO = 15.433; const TEMPO = 30; const ACCELERA = 3;
  const VEL = [8, 12, 17]; // 17 nodi è l'esempio della slide 17; le altre sono scelte qui
  const MANI = new THREE.Vector3(1.3, 4.8, 0); const ROTOLO = new THREE.Vector3(3.1, 5, 0);
  const copieSolco = []; const toccaSolco = { schermo: [], mini: [] };
  function solco(k) {
    const g = new THREE.Group();
    const nave = Scafo.crea(k); nave.position.y = -6; g.add(nave);
    const inc = new THREE.MeshBasicMaterial({ color: COL.inchiostro });
    const rotolo = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * k, 0.4 * k, 1.2 * k, 12), inc);
    rotolo.rotation.x = Math.PI / 2; rotolo.position.copy(ROTOLO); g.add(rotolo);
    // Bersaglio largo: toccando il rotolo si lancia la barchetta
    const lancio = new THREE.Mesh(new THREE.SphereGeometry(3 * Math.sqrt(k), 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    lancio.position.copy(ROTOLO); lancio.userData.tocco = 'lancia'; g.add(lancio);
    toccaSolco[k > 1 ? 'mini' : 'schermo'].push(lancio);
    const mani = new THREE.Mesh(new THREE.TorusGeometry(0.55 * k, 0.1 * k, 6, 18), new THREE.MeshBasicMaterial({ color: COL.rosso }));
    mani.position.copy(MANI); mani.rotation.y = Math.PI / 2; g.add(mani);
    const sopra = segmento(ROTOLO, MANI, 0.05 * k, COL.inchiostro); g.add(sopra);
    const cima = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * k, 0.05 * k, 1, 5), inc); cima.frustumCulled = false; g.add(cima);
    // La barchetta vera è una tavoletta: qui è ingrandita per vederla
    const forma = new THREE.Shape([new THREE.Vector2(0, 1.5), new THREE.Vector2(-1.3, -0.8), new THREE.Vector2(1.3, -0.8)]);
    const barchetta = new THREE.Mesh(new THREE.ShapeGeometry(forma), new THREE.MeshBasicMaterial({ color: COL.rosso, side: THREE.DoubleSide }));
    barchetta.scale.setScalar(Math.sqrt(k)); barchetta.rotation.y = Math.PI / 2; g.add(barchetta);
    const pallina = new THREE.SphereGeometry(0.75 * Math.sqrt(k), 10, 8); const ocra = new THREE.MeshBasicMaterial({ color: COL.ocra });
    const nodi = []; for (let i = 0; i < 19; i++) { const m = new THREE.Mesh(pallina, ocra); m.visible = false; g.add(m); nodi.push(m); }
    // Segni sull'acqua, fermi con la barchetta: fanno vedere che la nave avanza
    const onde = new THREE.Group();
    const segniA = []; for (let i = 0; i < 26; i++) { const x = -250 + (i * 37) % 300; const z = (i % 2 ? 1 : -1) * (12 + (i * 13) % 42); segniA.push(segmento(new THREE.Vector3(x, 0.03, z), new THREE.Vector3(x + 5, 0.03, z), 0.1 * k, COL.medio)); }
    onde.add(...segniA); compatta(onde); g.add(onde);
    copieSolco.push({ cima, barchetta, nodi, onde });
    return g;
  }
  const dir = new THREE.Vector3(); const su = new THREE.Vector3(0, 1, 0);
  function posaSolco() {
    const d = (s.t / TEMPO) * VEL[s.nave] * PASSO; const lanciata = s.fase !== 'pronta';
    const b = new THREE.Vector3(MANI.x - d, 0.12, 0);
    copieSolco.forEach((c) => {
      c.barchetta.visible = lanciata; c.cima.visible = lanciata && d > 0.1;
      c.barchetta.position.copy(b);
      c.onde.position.x = -(d % 37);
      if (c.cima.visible) {
        dir.subVectors(MANI, b); const l = dir.length();
        c.cima.position.copy(b).addScaledVector(dir, 0.5); c.cima.scale.set(1, l, 1);
        c.cima.quaternion.setFromUnitVectors(su, dir.clone().normalize());
      }
      // Il primo nodo sta a mezzo passo dalla barchetta: allo scadere nessun nodo è a metà conteggio
      c.nodi.forEach((m, i) => {
        const q = (i + 0.5) * PASSO;
        m.visible = lanciata && q < d + 2;
        if (!m.visible) return;
        if (q < d) m.position.lerpVectors(b, MANI, q / d); else m.position.lerpVectors(MANI, ROTOLO, (q - d) / 2);
      });
    });
  }

  let mondoSolco = null;
  function creaSolco() {
    if (mondoSolco) return mondoSolco;
    const radice = new THREE.Group();
    radice.add(solco(1), Scafo.mare());
    const sulTetto = (() => { const p = pedana(3.2, -3.2, 'a poppa, sul cassero'); p.scale.setScalar(0.3); p.position.y = 4.45; return p; })();
    const stazioni = [
      { pedana: sulTetto, pos: new THREE.Vector3(3.2, 4.55, -3.2), yaw: Math.PI / 2 },
      { pedana: pedana(-30, 34, 'in mare, di lato'), pos: new THREE.Vector3(-30, 0.25, 34), yaw: 0 },
    ];
    stazioni.forEach((st) => { st.pedana.visible = false; });
    const SC = 0.0032; const mini = new THREE.Group();
    mini.add(solco(5)); mini.scale.setScalar(SC); mini.position.set(50 * SC, 0.03, 0);
    posaSolco();
    mondoSolco = {
      radice, stazioni, modellino: mini,
      vistaIniziale: () => ({ target: new THREE.Vector3(-10, 3, 0), theta: -0.5, phi: 1.2, r: 58 }),
      tocchi: (v) => (s.fase === 'corre' ? [] : toccaSolco[v === 'mini' ? 'mini' : 'schermo']),
      frame(dt) {
        if (s.fase !== 'corre') return false;
        s.t = Math.min(TEMPO, s.t + dt * ACCELERA);
        posaSolco();
        const sec = Math.ceil(TEMPO - s.t);
        if (s.t >= TEMPO) { s.fase = 'conta'; s.sec = 0; Motore.ridisegna(); } else if (sec !== s.sec && sec % 3 === 0) { s.sec = sec; Motore.ridisegna(); }
        return true;
      },
    };
    return mondoSolco;
  }
  function prossima() { s.nave = (s.nave + 1) % VEL.length; s.fase = 'pronta'; s.t = 0; s.sec = TEMPO; s.sbagli = 0; s.nodi = 0; posaSolco(); }
  function comandiSolco(idTocco) {
    const id = idTocco === 't:lancia' ? 'lancia' : idTocco;
    if (id === 'lancia') { s.fase = 'corre'; s.t = 0; s.sec = TEMPO; s.esito = null; }
    if (id === 'n+') s.nodi = Math.min(30, s.nodi + 1);
    if (id === 'n-') s.nodi = Math.max(0, s.nodi - 1);
    if (id === 'controlla' && s.fase === 'conta') {
      const v = VEL[s.nave];
      if (s.nodi === v) {
        s.esito = { tipo: 'giusto', testo: `${v} nodi in 30 s: la nave fa ${v} nodi.` };
        lez.completa(lez.fatte.has('conta') ? 'seconda' : 'conta');
        prossima();
      } else if (s.sbagli >= 1) {
        s.esito = { tipo: 'errato', testo: `Erano ${v} nodi. Prova con la prossima nave.` };
        prossima();
      } else {
        s.sbagli += 1; s.esito = { tipo: 'errato', testo: 'Non torna: rilancia e conta di nuovo.' };
      }
    }
    Motore.sporco();
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { c: 'si contavano i nodi di una cima', i: 'è il nome di chi la inventò', e: 'dipende dai giri dell\'elica' };
    const zona = (a, b) => ({ t: 'zona', id: 'finestra', h: 760, testo: !vr ? '' : vera ? a : b });
    const scala = () => (vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
    const clessidra = s.fase === 'pronta' ? `Nave ${s.nave + 1}: pronta al lancio.` : s.fase === 'corre' ? `Clessidra: ${s.sec} s. Conta i nodi!` : 'Clessidra finita. Quanti nodi?';
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Misurare in mare' },
          { t: 'p', testo: 'Un\'**unità di misura** è una quantità definita e condivisa di una grandezza fisica, usata come campione per misurare tutte le altre dello stesso tipo. {{slide 4}}' },
          { t: 'p', testo: 'Il metro, introdotto nel 1791, era la quarantamilionesima parte del meridiano terrestre. {{slide 5}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: 'In navigazione si lavora con latitudini, longitudini e tempi: le distanze si misurano in **miglia**, le velocità in **nodi**. {{slide 7}}' },
          { t: 'p', testo: 'Per la massa si usa la tonnellata, per la forza la tonnellata-peso, per il volume le tonnellate di stazza. {{slide 7}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Le navi non misurano la velocità in chilometri all\'ora, ma in nodi.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Perché si chiamano nodi?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:i', testo: 'È il nome di chi inventò questa misura', on: p === 'i' },
          { t: 'scelta', id: 'p:c', testo: 'Si contavano i nodi di una cima', on: p === 'c' },
          { t: 'scelta', id: 'p:e', testo: 'Dipende dai giri dell\'elica', on: p === 'e' },
        ],
      },
      {
        passo: 2, mondo: creaGlobo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandiGlobo,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Che cos\'è un miglio?' },
          { t: 'p', size: 38, testo: 'È l\'arco di meridiano sotteso da 1 primo, alla latitudine di 44°20\'. {{slide 9}}' },
          { t: 'bottoni', h: 84, size: 34, lista: [{ id: 'dividi', testo: s.livello === 0 ? 'Dividi per 360' : 'Dividi per 60', off: s.livello === 2 }, { id: 'daccapo', testo: 'Da capo' }] },
          { t: 'riquadro', size: 36, testo: LIVELLI[s.livello].testo },
          ...lez.missioni(),
        ],
        dx: [
          zona('Punta una pedana e premi il grilletto per spostarti davanti ai righelli.', 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.'),
          ...scala(),
          { t: 'nota', testo: 'Tocca il globo per dividere il meridiano. Globo e righelli non sono in scala: 1 primo sarebbe invisibile.' },
        ],
      },
      {
        passo: 2, mondo: creaSolco, richiede: () => lez.fatte.has('primo'), avviso: 'Se salti, niente bandiera.',
        azione: comandiSolco,
        sx: [
          { t: 'sotto', testo: 'Il solcometro a barchetta' },
          { t: 'bottoni', h: 84, size: 34, lista: [{ id: 'lancia', testo: 'Lancia la barchetta', off: s.fase === 'corre' }] },
          { t: 'riquadro', size: 36, testo: clessidra },
          { t: 'passo', id: 'n', nome: 'Nodi contati', valore: String(s.nodi) },
          { t: 'bottoni', h: 84, size: 34, lista: [{ id: 'controlla', testo: 'Controlla', off: s.fase !== 'conta' }] },
          ...(s.esito ? [{ t: 'esito', ...s.esito }] : []),
          ...lez.missioni(),
        ],
        dx: [
          zona('Sul cassero guarda i nodi passare nell\'anello rosso, che sono le dita del marinaio.', 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.'),
          ...scala(),
          { t: 'nota', testo: 'Tocca il rotolo a poppa per lanciare, poi conta i nodi nell\'anello rosso. Tempo accelerato: i 30 s durano 10 s. Barchetta ingrandita.' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'c' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Si lanciava la barchetta e si contavano i nodi che passavano tra le dita mentre un altro teneva la clessidra. {{slide 15}}' },
          { t: 'formula', testo: '15,433 m = 1/120 di miglio' },
          { t: 'formula', testo: '30 s = 1/120 di ora' },
          { t: 'p', testo: 'Per questo i nodi contati in 30 secondi sono la velocità della nave. {{slide 15}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Miglio e nodo' },
          { t: 'p', size: 38, testo: 'Il miglio nautico: simboli M, mg, nmi, NM. La circonferenza si divide per 360 · 60 = 21 600. {{slide 9, 11}}' },
          { t: 'formula', testo: '1 NM = 40 000 000 m / 21 600' },
          { t: 'formula', testo: '= 1851,85 m ≈ 1852 m' },
          { t: 'p', size: 38, testo: 'Il nodo: simboli kn, kts. {{slide 13}}' },
          { t: 'formula', testo: '1 kn = 1 NM / 1 h = 1,852 km/h' },
          { t: 'formula', testo: '20 kts · 1,852 = 37,04 km/h' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'La stazza' },
          { t: 'p', testo: 'È il volume degli spazi chiusi della nave: un riferimento amministrativo e identificativo. Non è un peso. {{slide 17, 19}}' },
          { t: 'formula', testo: '1 t di stazza = 100 piedi cubi = 2,832 m³' },
          { t: 'p', size: 38, testo: 'Nasce dal *tun*, il barile con cui si misurava la capacità di carico per tassare le navi. Oggi i valori sono ottenuti con algoritmi definiti dalla convenzione entrata in vigore nel 1982. {{slide 19, 20}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'tabella', col: [30, 70], size: 34, righe: [
            ['Stazza', 'Che cosa misura'],
            ['Lorda GT (*gross tonnage*)', 'tutti gli spazi chiusi, fuori ossatura, tranne alcune zone'],
            ['Netta NT (*net tonnage*)', 'gli spazi destinati a contenere il carico'],
          ] },
          { t: 'nota', testo: 'slide 21' },
          { t: 'p', size: 38, testo: 'La stazza lorda identifica la nave insieme a nome e nazionalità. La netta è il riferimento per tasse marittime e costi del contratto di trasporto. {{slide 21}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'I solcometri di oggi' },
          { t: 'p', size: 38, testo: 'Il sensore è di solito sulla chiglia, nella spada del solcometro. {{slide 24}}' },
          { t: 'tabella', col: [28, 72], size: 32, righe: [
            ['Tipo', 'Come misura'],
            ['A elica', 'una piccola elica gira con velocità proporzionale a quella della nave'],
            ['A pressione', 'due tubi di Pitot: differenza tra pressione dinamica e statica'],
            ['Doppler', 'energia acustica: può dare la velocità rispetto al fondo'],
          ] },
          { t: 'formula', testo: 'v = √( 2 (Ptotale − Pstatica) / ρ )' },
          { t: 'nota', testo: 'slide 24–26' },
        ],
        dx: [
          { t: 'titolo', testo: 'Misure di distanza' },
          { t: 'p', size: 38, testo: 'Dalla velocità si ricava la distanza percorsa: è la **navigazione stimata** (*dead reckoning*). {{slide 28}}' },
          { t: 'formula', testo: 'S = V · Δt' },
          { t: 'p', size: 38, testo: 'Il **radar** misura il tempo di volo di un segnale: parte dalla nave, colpisce il bersaglio e torna, percorrendo 2 volte la distanza. {{slide 29}}' },
          { t: 'formula', testo: 'd = ½ c · Δt' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sulle definizioni delle slide. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: () => lez.fatto.quiz(QUIZ.map((q) => q.n)), avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'titolo', testo: 'Calcola' }, { t: 'nota', testo: 'I due calcoli svolti nelle slide 11 e 13.' }, ...lez.calcoloSx()],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ, ...CALCOLI].map((q) => q.n))),
    ];
  });
})();
