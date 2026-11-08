/* Lezione 6: fasi di costruzione della nave. Sequenza dalle slide 2-21 e dalle note della slide 17.
   Cantiere, bacino e dimensioni sono schematici */
(function () {
  const N = 6;
  const { COL, tratto, segmento, tela, etichetta, pedana, scatola, compatta, maniglia } = Tavola;
  const { fiancata, griglia, insellatura, mezza, ascissa, fondo, L } = Scafo;

  const MISSIONI = [
    { id: 'ordine', testo: 'Metti le sei fasi nell\'ordine giusto.' },
    { id: 'varo', testo: 'Allaga il bacino con il cursore: è il varo tecnico.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Chi decide di far costruire una nave?', scelte: ['L\'armatore', 'Il cantiere', 'La capitaneria'], giusta: 0, perche: 'L\'idea nasce dalla volontà di un armatore di ampliare o rinnovare la flotta.' },
    { n: 2, testo: 'Che cosa fa il CAM?', scelte: ['Disegna il progetto', 'Traduce i modelli in istruzioni per le macchine', 'Calcola la rotta'], giusta: 1, perche: 'Traduce i modelli CAD in istruzioni per le macchine a controllo numerico.' },
    { n: 3, testo: 'Dagli anni \'60 agli scali di costruzione subentrano…', scelte: ['I bacini di costruzione', 'Le chiatte', 'I blocchi'], giusta: 0, perche: 'Spariscono gli scali (slipway) a favore dei bacini di costruzione.' },
    { n: 4, testo: 'Il varo che allaga il bacino si chiama…', scelte: ['Varo a scivolamento', 'Varo tecnico', 'Varo di poppa'], giusta: 1, perche: 'È il varo tecnico (float-out launching).' },
    { n: 5, testo: 'Dove si fa la gran parte dell\'allestimento?', scelte: ['Sullo scalo', 'Nel bacino di allestimento', 'In ufficio tecnico'], giusta: 1, perche: 'Nel bacino di allestimento (fitting out basin), dopo il varo tecnico.' },
    { n: 6, testo: 'Le navi costruite replicando lo stesso progetto si dicono…', scelte: ['Affini', 'Gemelle', 'Sistematiche'], giusta: 1, perche: 'Sono navi gemelle: si spalmano i costi di progettazione.' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  const FASI = [
    { id: 'progetto', nome: 'Progettazione', testo: 'Il progetto finale (*contract design*) nasce con l\'armatore. Oggi si usano CAD e CAM: il modello digitale della nave guida anche il taglio delle lamiere. {{slide 3, 8, 9}}' },
    { id: 'lamiere', nome: 'Taglio delle lamiere', testo: 'Le lamiere si stoccano, si puliscono con la granigliatura (*shot blast*), poi si tagliano, si piegano e si modellano. {{slide 17, note}}' },
    { id: 'blocchi', nome: 'Unità e blocchi', testo: 'Si costruiscono moduli o unità già completi di strutture e spesso di impianti, poi composti in **blocchi** di grandi dimensioni. {{slide 14, 15}}' },
    { id: 'montaggio', nome: 'Montaggio in bacino', testo: 'Il montaggio (*assembly*): i blocchi vengono uniti fra loro nel bacino di costruzione, a mezzo saldatura (*erection*). {{slide 15, 17 note}}' },
    { id: 'varo', nome: 'Varo tecnico', testo: 'A scafo terminato si allaga il bacino: è il **varo tecnico** (*float-out launching*). {{slide 16}}' },
    { id: 'allestimento', nome: 'Allestimento', testo: 'L\'allestimento (*outfit*): impianti, strumentazione di plancia, arredi. La nave, già galleggiante, passa nel bacino di allestimento (*fitting out basin*). {{slide 19, 20}}' },
  ];
  const ORDINE_BOTTONI = ['varo', 'progetto', 'allestimento', 'blocchi', 'lamiere', 'montaggio'];
  const s = { f: 0, a: 1, errore: '', testo: null };

  /* Blocchi: fette di scafo */
  const NB = 6;
  function blocco(i, k) {
    const g = new THREE.Group();
    const u0 = i / NB; const u1 = (i + 1) / NB;
    const lamiera = Scafo.vernice();
    [1, -1].forEach((sg) => g.add(new THREE.Mesh(Scafo.dipinto(fiancata(u0 + 0.002, u1 - 0.002, 0, 11, sg)), lamiera)));
    const deck = griglia(10, 4, (a, b) => { const u = u0 + a * (u1 - u0); const y = insellatura(u); return [ascissa(u, y), y, (2 * b - 1) * mezza(u, y)]; });
    g.add(new THREE.Mesh(deck, new THREE.MeshBasicMaterial({ color: Scafo.TINTE.ponte, side: THREE.DoubleSide })));
    const anello = (u) => {
      const fk = fondo(u); const h = insellatura(u); const p = [];
      for (let j = 12; j >= -12; j--) { const y = fk + (Math.abs(j) / 12) * (h - fk); p.push(new THREE.Vector3(ascissa(u, y), y, Math.sign(j || 1) * (mezza(u, y) + 0.08))); }
      p.push(p[0].clone());
      return p.filter((q, n) => n === 0 || q.distanceTo(p[n - 1]) > 0.01);
    };
    const linee = new THREE.Group();
    [u0 + 0.004, u1 - 0.004].forEach((u) => { if (u > 0.02 && u < 0.98) linee.add(tratto(anello(u), 0.07 * k)); });
    [1, -1].forEach((sg) => { const q = []; for (let n = 0; n <= 8; n++) { const u = u0 + (n / 8) * (u1 - u0); q.push(new THREE.Vector3(ascissa(u, insellatura(u)), insellatura(u) + 0.05, sg * mezza(u, insellatura(u)))); } linee.add(tratto(q, 0.05 * k)); });
    compatta(linee);
    g.add(linee);
    return g;
  }

  const copie = [];
  function pianoProgetto() {
    return new THREE.Mesh(new THREE.PlaneGeometry(40, 16), new THREE.MeshBasicMaterial({
      map: tela(1024, 410, (c) => {
        c.fillStyle = '#FBFAF4'; c.fillRect(0, 0, 1024, 410);
        c.strokeStyle = '#D8E0EC'; c.lineWidth = 2; c.beginPath();
        for (let x = 0; x <= 1024; x += 40) { c.moveTo(x, 0); c.lineTo(x, 410); }
        for (let y = 0; y <= 410; y += 40) { c.moveTo(0, y); c.lineTo(1024, y); }
        c.stroke();
        c.strokeStyle = '#0B2545'; c.lineWidth = 5; c.beginPath();
        c.moveTo(60, 150); c.bezierCurveTo(220, 200, 620, 210, 960, 110); c.lineTo(900, 300); c.quadraticCurveTo(890, 320, 850, 320); c.lineTo(120, 320); c.quadraticCurveTo(90, 320, 76, 280); c.closePath(); c.stroke();
        c.strokeStyle = '#5B6B7C'; c.lineWidth = 2; c.beginPath();
        for (let x = 140; x < 900; x += 76) { c.moveTo(x, 190); c.lineTo(x, 320); }
        c.moveTo(70, 250); c.lineTo(925, 250); c.stroke();
        c.fillStyle = '#0B2545'; c.font = '44px Disegno, cursive'; c.fillText('piano di costruzione', 330, 380);
      }),
    }));
  }

  function copia(k) {
    const g = new THREE.Group();
    // Terreno, bacino di costruzione e bacino di allestimento
    const pareti = new THREE.Group();
    const X0 = -8; const X1 = 98; const Z = 12; const FONDO = -8;
    [[X0, -Z, X1, -Z], [X0, Z, X1, Z], [X0, -Z, X0, Z]].forEach(([a, b, c, d]) => {
      pareti.add(segmento(new THREE.Vector3(a, 0, b), new THREE.Vector3(c, 0, d), 0.12 * k));
      pareti.add(segmento(new THREE.Vector3(a, FONDO, b), new THREE.Vector3(c, FONDO, d), 0.06 * k, COL.medio));
    });
    [[X0, -Z], [X0, Z], [X1, -Z], [X1, Z]].forEach(([a, b]) => pareti.add(segmento(new THREE.Vector3(a, 0, b), new THREE.Vector3(a, FONDO, b), 0.06 * k, COL.medio)));
    compatta(pareti); g.add(pareti);
    const griglia3 = new THREE.GridHelper(300, 30, COL.griglia, COL.griglia); griglia3.position.set(80, 0, 40); g.add(griglia3);

    const acquaB = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, 2 * Z), new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.36, depthWrite: false, side: THREE.DoubleSide }));
    acquaB.rotation.x = -Math.PI / 2; acquaB.position.set((X0 + X1) / 2, FONDO, 0); acquaB.visible = false;
    g.add(acquaB);
    const mare = new THREE.Mesh(new THREE.PlaneGeometry(120, 44), new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
    mare.rotation.x = -Math.PI / 2; mare.position.set(160, -0.8, 0);
    g.add(mare);
    const porta = scatola(X1 - 0.6, X1 + 0.6, FONDO, 0, -Z, Z, 0.05 * k); g.add(porta);
    const e1 = etichetta('bacino di costruzione', k > 1 ? 9 : 4); e1.position.set(45, 9, -Z - 7); g.add(e1);
    const e2 = etichetta('bacino di allestimento', k > 1 ? 9 : 4); e2.position.set(160, 9, -Z - 7); g.add(e2);

    const progetto = pianoProgetto(); progetto.rotation.x = -Math.PI / 2; progetto.position.set(45, 0.1, 34); g.add(progetto);
    const lamiere = new THREE.Group();
    for (let i = 0; i < 7; i++) lamiere.add(scatola(10 + i * 12, 20 + i * 12, 0, 0.5 + (i % 3) * 0.5, 26, 42, 0.05 * k));
    g.add(lamiere);
    const blocchi = [];
    for (let i = 0; i < NB; i++) { const b = blocco(i, k); g.add(b); blocchi.push(b); }
    const finita = Scafo.crea(k); finita.visible = false; g.add(finita);
    copie.push({ g, blocchi, finita, progetto, lamiere, acquaB, porta });
    return g;
  }

  const liscia = (t) => { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); };

  function applica() {
    const { f, a } = s;
    const LIV = -0.8; const POS = (i) => ({ x: (i - 2.5) * 5, y: 0, z: 36 }); // sul piazzale
    copie.forEach((c) => {
      c.progetto.visible = f === 0;
      c.lamiere.visible = f === 1;
      const hanno = f >= 2 && f <= 4;
      c.blocchi.forEach((b, i) => {
        b.visible = hanno;
        if (!hanno) return;
        const p = POS(i);
        if (f === 2) { b.position.set(p.x, p.y, p.z); return; }
        const t = f === 3 ? liscia(a * NB - i) : 1;
        // Dal piazzale al bacino, sollevato dalla gru
        b.position.set(p.x * (1 - t), p.y * (1 - t) - 8 * t + Math.sin(Math.PI * t) * 12, p.z * (1 - t));
      });
      const livello = f < 4 ? -8 : f === 4 ? -8 + liscia(a) * (LIV + 8) : LIV;
      c.acquaB.visible = f >= 4; c.acquaB.position.y = livello;
      if (f === 4) { const y = Math.max(-8, livello - 6); c.blocchi.forEach((b) => { b.position.y = y; }); }
      c.porta.visible = f < 5;
      c.finita.visible = f === 5;
      if (f === 5) c.finita.position.set(liscia(a) * 118, LIV - 6, 0);
    });
  }

  const VISTA = () => ({ target: new THREE.Vector3(45, 0, 30), theta: 0.35, phi: 0.95, r: 105 });
  let mondo = null;
  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    radice.add(copia(1));
    const posto = (x, z, nome, yaw) => { const p = pedana(x, z, nome); p.scale.setScalar(0.6); p.position.y = 0.05; return { pedana: p, pos: new THREE.Vector3(x, 0.15, z), yaw }; };
    const stazioni = [posto(45, 18, 'sul bordo del bacino', 0), posto(45, 30, 'sul piazzale', 0), posto(150, 28, 'al bacino di allestimento', 0)];
    stazioni.forEach((st) => { st.pedana.visible = false; });
    const SC = 0.0075; const mini = new THREE.Group();
    mini.add(copia(8)); mini.scale.setScalar(SC); mini.position.set(-85 * SC, 0.03, -10 * SC);
    applica();
    mondo = {
      radice, stazioni, modellino: mini, vistaIniziale: VISTA,
      tocchi: () => [],
      frame() { return false; },
    };
    return mondo;
  }
  const Z_GRU = 20;

  function comandi(id) {
    const a = Lezione.letto(id, 'avanza', 0, 1, 0.01);
    if (typeof a === 'number' && s.f >= 3) {
      s.a = a; applica(); Motore.sporco();
      if (s.a >= 1 && s.f === 4) lez.completa('varo');
      return;
    }
    if (id === 'ricomincia') { s.f = 0; s.a = 1; s.fatte = 1; s.errore = ''; s.testo = null; applica(); Motore.sporco(); return; }
    if (!id.startsWith('f:')) return;
    const i = FASI.findIndex((x) => x.id === id.slice(2));
    const fatte = s.fatte || 1;
    if (i > fatte) { s.errore = `Non ancora: prima viene ${FASI[fatte].nome}.`; return; }
    if (i === fatte) s.fatte = fatte + 1;
    s.f = i; s.a = i >= 3 ? 0 : 1; s.errore = ''; s.testo = FASI[i].testo;
    // La vista segue il lavoro: piazzale, bacino, allestimento
    if (i <= 2) Motore.vista({ target: new THREE.Vector3(45, 0, 30), r: 105, phi: 0.95 });
    else if (i <= 4) Motore.vista({ target: new THREE.Vector3(45, -3, 2), r: 125, phi: 1.02 });
    else Motore.vista({ target: new THREE.Vector3(125, -2, 0), r: 150, phi: 1.1 });
    if ((s.fatte || 1) === FASI.length) lez.completa('ordine');
    applica(); Motore.sporco();
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { prima: 'Prima il varo', dopo: 'Prima l\'allestimento', insieme: 'Nello stesso momento' };
    const fatte = s.fatte || 1;
    const bot = ORDINE_BOTTONI.map((id) => { const i = FASI.findIndex((x) => x.id === id); return { id: `f:${id}`, testo: `${i < fatte ? `${i + 1}. ` : ''}${FASI[i].nome}`, on: i === s.f }; });
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Come nasce una nave' },
          { t: 'p', testo: 'L\'idea di una nave nasce dalla volontà di un **armatore** di ampliare o rinnovare la propria flotta. {{slide 2}}' },
          { t: 'p', testo: 'L\'armatore analizza le proprie necessità: tipologia di nave, dimensioni, peso, portata, velocità, stabilità. {{slide 2}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: 'Poi si indice una gara tra i cantieri e si sceglie il progetto più convincente. {{slide 3}}' },
          { t: 'p', testo: 'Le grandi fasi sono tre: **progettazione**, **montaggio**, **allestimento**. {{slide 2, 12, 18}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Lo scafo è finito. Mancano impianti, strumenti di plancia, arredi.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Il varo avviene prima o dopo l\'allestimento?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:prima', testo: 'Prima il varo, poi la gran parte dell\'allestimento', on: p === 'prima' },
          { t: 'scelta', id: 'p:dopo', testo: 'Prima l\'allestimento, poi il varo', on: p === 'dopo' },
          { t: 'scelta', id: 'p:insieme', testo: 'Nello stesso momento', on: p === 'insieme' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Che cosa viene dopo?' },
          { t: 'bottoni', h: 84, size: 32, lista: bot.slice(0, 2) },
          { t: 'bottoni', h: 84, size: 32, lista: bot.slice(2, 4) },
          { t: 'bottoni', h: 84, size: 32, lista: bot.slice(4) },
          ...(s.errore ? [{ t: 'esito', tipo: 'errato', testo: s.errore }] : []),
          { t: 'bottoni', h: 76, size: 32, lista: [{ id: 'ricomincia', testo: 'Ricomincia' }] },
          ...lez.missioni(),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 760,
            testo: !vr ? '' : vera
              ? 'Sei in cantiere. Punta una pedana e premi il grilletto per spostarti.'
              : 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.',
          },
          ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          ...(s.f >= 3 ? [Lezione.cursore('avanza', ['La gru porta i blocchi', 'L\'acqua entra nel bacino', 'Il rimorchio porta la nave'][s.f - 3], `${Math.round(s.a * 100)}%`, s.a, 0, 1)] : []),
          { t: 'riquadro', size: 36, testo: s.testo || FASI[0].testo },
          { t: 'nota', testo: 'Dal montaggio in poi fai scorrere il cursore: muovi tu la gru, l\'acqua, il rimorchio. Cantiere schematico.' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'prima' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'La nave lascia il bacino di costruzione già galleggiante, e solo dopo riceve la gran parte di impianti e arredi.' },
        ],
        dx: [
          { t: 'titolo', testo: 'Prima il varo' },
          { t: 'p', testo: 'L\'allestimento inizia di fatto con l\'assemblaggio delle unità, perché molti impianti sono già predisposti. {{slide 20}}' },
          { t: 'p', testo: 'La gran parte del lavoro avviene però **dopo il varo tecnico**: la nave, già galleggiante, va in un bacino di allestimento (*fitting out basin*). {{slide 20}}' },
          { t: 'p', testo: 'Intanto nel bacino di costruzione si può iniziare una nuova costruzione. {{slide 20}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'La progettazione' },
          { t: 'p', size: 38, testo: 'Si sceglie tra progetti standard e si realizza il progetto finale (*contract design*). {{slide 3}}' },
          { t: 'p', size: 38, testo: 'Si può allungare il corpo centrale cilindrico, o definire uno **scafo affine**. Le **serie sistematiche** sono famiglie di scafi che differiscono per alcuni parametri. {{slide 4, 5}}' },
          { t: 'p', size: 38, testo: 'Replicando un progetto si costruiscono **navi gemelle**, spalmando i costi. {{slide 6}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Dal disegno al CAD' },
          { t: 'p', size: 38, testo: 'In passato il piano di costruzione si disegnava a mano in scala 1:1. {{slide 7}}' },
          { t: 'p', size: 38, testo: 'Dagli anni \'90 si diffondono i software: il **CAD** (*Computer-Aided Design*) progetta in 2D e 3D, il **CAM** (*Computer-Aided Manufacturing*) traduce i modelli in istruzioni per le macchine. {{slide 8, 9}}' },
          { t: 'p', size: 38, testo: 'Oltre al piano di costruzione (*lines plan*) si ha la specifica del fasciame (*shell expansion*). {{slide 10}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Il montaggio' },
          { t: 'p', size: 38, testo: 'Dagli anni \'60 spariscono gli scali di costruzione (*slipway*), per il varo a scivolamento, a favore dei bacini. {{slide 13}}' },
          { t: 'p', size: 38, testo: 'Non si parte più dalla chiglia: si costruiscono moduli completi, poi composti in blocchi. {{slide 14, 15}}' },
        ],
        dx: [
          { t: 'sotto', testo: 'I passi in un cantiere moderno' },
          { t: 'tabella', col: [12, 88], size: 32, righe: [
            ['', 'Passo'],
            ['1', 'stoccaggio (*stowage*) delle lamiere'],
            ['2', 'granigliatura (*shot blast*)'],
            ['3', 'taglio, piegatura, modellazione'],
            ['4', 'assemblaggio delle unità'],
            ['5', 'composizione dei blocchi (*block*)'],
            ['6', 'collegamento in bacino (*erection*)'],
            ['7', 'allestimento finale (*outfit*)'],
          ] },
          { t: 'nota', testo: 'slide 17, note' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'L\'allestimento' },
          { t: 'p', testo: 'Consiste nel dotare la nave di impianti di bordo, collegamenti elettrici, strumentazione di plancia, mezzi per il carico, arredo degli alloggi. {{slide 19}}' },
          { t: 'p', testo: 'A volte in questa fase si installano anche alcune sovrastrutture. {{slide 19}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: 'Per le **navi passeggeri** l\'allestimento avviene con cura particolare: conta anche l\'estetica delle zone per i passeggeri. {{slide 21}}' },
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
