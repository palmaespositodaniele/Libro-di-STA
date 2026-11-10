/* Lezione 7: materiali e corrosione. Serie galvanica dalla slide 28 (tabella V.2), dati sugli acciai
   e sulle leghe dalle slide 2-19. La velocità di consumo nel modello è schematica */
(function () {
  const N = 7;
  const { COL, etichetta, pedana, segmento } = Tavola;
  const { C } = Pagina;

  const MISSIONI = [
    { id: 'coppia', testo: 'Metti a contatto acciaio e zinco: quale si consuma?' },
    { id: 'ruolo', testo: 'Ora acciaio e rame: l\'acciaio cambia ruolo.' },
    { id: 'anodo', testo: 'Fasciame e bronzo dell\'elica: aggiungi l\'anodo di zinco.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'L\'acciaio è una lega ferro-carbonio con carbonio…', scelte: ['Minore del 2%', 'Maggiore del 2%', 'Uguale al 10%'], giusta: 0, perche: 'Tenore di carbonio minore del 2%; oltre si parla di ghisa.' },
    { n: 2, testo: 'I gradi A, B, D ed E si distinguono per…', scelte: ['La resistenza a trazione', 'La resilienza', 'Il colore'], giusta: 1, perche: 'Hanno la stessa resistenza: li distingue la resilienza.' },
    { n: 3, testo: 'La tensione di snervamento degli acciai ordinari è…', scelte: ['235 MPa', '355 MPa', '660 MPa'], giusta: 0, perche: 'ReH pari a 235 MPa.' },
    { n: 4, testo: 'Densità delle leghe leggere rispetto agli acciai da scafo…', scelte: ['2,75 contro 7,85 t/m³', '7,85 contro 2,75 t/m³', 'Uguale'], giusta: 0, perche: 'Leghe leggere 2,75 t/m³, acciai da scafo circa 7,85 t/m³.' },
    { n: 5, testo: 'In una cella galvanica che cosa si corrode?', scelte: ['Il catodo', 'L\'anodo', 'Entrambi'], giusta: 1, perche: 'Il catodo si conserva, l\'anodo si corrode.' },
    { n: 6, testo: 'Gli anodi sacrificali sono di…', scelte: ['Rame o bronzo', 'Zinco, alluminio o magnesio', 'Platino'], giusta: 1, perche: 'Materiali meno nobili dell\'acciaio.' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  // Slide 28: dalla estremità catodica o nobile a quella anodica o ignobile
  const SERIE = ['Platino, oro', 'Argento', 'Titanio', 'Acciaio inossidabile (passivo)', 'Nichel (passivo)', 'Bronzo', 'Rame', 'Nichel (attivo)', 'Ossido di ferro', 'Ottone', 'Piombo, stagno', 'Acciaio inossidabile (attivo)', 'Ferro, ghisa, acciaio al carbonio', 'Leghe di alluminio', 'Alluminio', 'Zinco', 'Magnesio'];
  const METALLI = [
    { nome: 'Rame', r: 6 }, { nome: 'Bronzo', r: 5 }, { nome: 'Acciaio', r: 12 },
    { nome: 'Alluminio', r: 14 }, { nome: 'Zinco', r: 15 }, { nome: 'Magnesio', r: 16 },
  ];
  const s = { a: 2, b: 1, anodo: false, cons: [0, 0, 0] }; // acciaio e bronzo: le coppie delle missioni le sceglie lo studente

  // Il meno nobile fa da anodo: il ruolo è relativo (slide 27)
  function presenti() {
    const l = [{ slot: 0, m: METALLI[s.a] }, { slot: 1, m: METALLI[s.b] }];
    if (s.anodo) l.push({ slot: 2, m: METALLI[4] });
    return l;
  }
  function anodo() {
    const l = presenti();
    if (s.a === s.b && !s.anodo) return null;
    return l.reduce((x, y) => (y.m.r > x.m.r ? y : x));
  }

  /* Elettrodi nella vasca */
  const X = [-0.95, 0.95, 0]; const Y_ACQUA = 1.15; const ALTO = 1.75;
  const copie = []; const prese = { schermo: [], mini: [] };
  const part = []; for (let i = 0; i < 44; i++) part.push({ t: Math.random() });
  function copia(k) {
    const g = new THREE.Group();
    const lato = 1.9; const prof = 0.8; const r = 0.012 * k;
    const spigoli = new THREE.Group();
    [0, 1.4].forEach((y) => [[-lato, -prof, lato, -prof], [lato, -prof, lato, prof], [lato, prof, -lato, prof], [-lato, prof, -lato, -prof]].forEach(([a, b, c, d]) => spigoli.add(segmento(new THREE.Vector3(a, y, b), new THREE.Vector3(c, y, d), r))));
    [[-lato, -prof], [lato, -prof], [lato, prof], [-lato, prof]].forEach(([a, b]) => spigoli.add(segmento(new THREE.Vector3(a, 0, b), new THREE.Vector3(a, 1.4, b), r)));
    Tavola.compatta(spigoli); g.add(spigoli);
    const acqua = new THREE.Mesh(new THREE.BoxGeometry(2 * lato, Y_ACQUA, 2 * prof), new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.2, depthWrite: false }));
    acqua.position.y = Y_ACQUA / 2; g.add(acqua);
    const mare = etichetta('acqua di mare', 0.16); mare.position.set(0, 0.16, prof); g.add(mare);

    const slot = [0, 1, 2].map((i) => {
      const e = new THREE.Group(); e.position.x = X[i];
      const mat = new THREE.MeshBasicMaterial({ color: COL.scafo });
      const sopra = new THREE.Mesh(new THREE.BoxGeometry(0.46, ALTO - Y_ACQUA, 0.12), mat);
      sopra.position.y = (ALTO + Y_ACQUA) / 2;
      sopra.add(new THREE.LineSegments(new THREE.EdgesGeometry(sopra.geometry), new THREE.LineBasicMaterial({ color: COL.inchiostro })));
      const perno = new THREE.Group(); perno.position.y = Y_ACQUA;
      const sotto = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.92, 0.12), mat);
      sotto.position.y = -0.46;
      sotto.add(new THREE.LineSegments(new THREE.EdgesGeometry(sotto.geometry), new THREE.LineBasicMaterial({ color: COL.inchiostro })));
      perno.add(sotto);
      e.add(sopra, perno);
      [sopra, sotto].forEach((o) => { o.userData.tocco = `el${i}`; prese[k > 1 ? 'mini' : 'schermo'].push(o); });
      const nomi = METALLI.map((m) => { const t = etichetta(m.nome, 0.3); t.position.set(0, 0.62, 0.3); t.visible = false; e.add(t); return t; });
      const tagA = etichetta('anodo', 0.26, '#8C7020'); tagA.position.set(0, 0.3, 0.3); tagA.visible = false; e.add(tagA);
      const tagC = etichetta('catodo', 0.26, '#2F7A55'); tagC.position.set(0, 0.3, 0.3); tagC.visible = false; e.add(tagC);
      g.add(e);
      return { e, mat, perno, nomi, tagA, tagC };
    });
    // Conduttore: arco tra i due elettrodi principali
    const curva = new THREE.CatmullRomCurve3([new THREE.Vector3(X[0], ALTO, 0), new THREE.Vector3(X[0], ALTO + 0.55, 0), new THREE.Vector3(0, ALTO + 0.7, 0), new THREE.Vector3(X[1], ALTO + 0.55, 0), new THREE.Vector3(X[1], ALTO, 0)]);
    const filo = new THREE.Mesh(new THREE.TubeGeometry(curva, 30, 0.01 * k, 6), new THREE.MeshBasicMaterial({ color: COL.inchiostro }));
    g.add(filo);
    const filo3 = segmento(new THREE.Vector3(0, ALTO, 0), new THREE.Vector3(0, ALTO + 0.7, 0), 0.01 * k); g.add(filo3);
    const el = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03 * Math.max(1, k * 0.6), 6, 4), new THREE.MeshBasicMaterial({ color: COL.ocra }), part.length);
    el.frustumCulled = false; g.add(el);
    copie.push({ slot, curva, el, filo3 });
    return g;
  }

  const m4 = new THREE.Matrix4(); const qn = new THREE.Quaternion(); const v3 = new THREE.Vector3(); const sc1 = new THREE.Vector3();

  function aggiornaCella() {
    const pr = presenti(); const an = anodo();
    copie.forEach((c) => {
      c.slot.forEach((sl, i) => {
        const p = pr.find((q) => q.slot === i);
        sl.e.visible = !!p;
        sl.nomi.forEach((t, j) => { t.visible = !!p && METALLI[j] === p.m; });
        sl.tagA.visible = !!an && an.slot === i; sl.tagC.visible = !!an && !!p && an.slot !== i;
      });
      c.filo3.visible = s.anodo;
    });
    disegnaLente();
    Motore.sporco();
  }

  /* Serie galvanica sulla pagina */
  const LW = 1040; const LH = 500;
  const telaLente = document.createElement('canvas');
  telaLente.width = LW; telaLente.height = LH;
  const texLente = new THREE.CanvasTexture(telaLente);
  texLente.colorSpace = THREE.SRGBColorSpace;
  function disegnaLente() {
    const c = telaLente.getContext('2d'); const pr = presenti(); const an = anodo();
    c.fillStyle = C.carta; c.fillRect(0, 0, LW, LH);
    c.fillStyle = C.ink; c.font = '700 36px Atkinson, sans-serif'; c.fillText('Estremità catodica o nobile', 18, 36);
    SERIE.forEach((nome, i) => {
      const col = i < 9 ? 0 : 1; const x = 18 + col * 510; const y = 76 + (col ? i - 9 : i) * 44;
      const qui = pr.find((p) => p.m.r === i);
      if (qui) { c.fillStyle = an && an.m.r === i ? C.ocra : 'rgba(74,118,168,0.3)'; c.fillRect(x - 6, y - 28, 494, 40); }
      c.fillStyle = C.ink; c.font = `${qui ? '700 ' : ''}36px Atkinson, sans-serif`; c.fillText(nome, x, y, 482);
    });
    c.fillStyle = C.ink; c.font = '700 36px Atkinson, sans-serif'; c.fillText('Estremità anodica o ignobile', 528, 76 + 8 * 44);
    c.strokeStyle = C.ink; c.lineWidth = 4; c.strokeRect(2, 2, LW - 4, LH - 4);
    texLente.needsUpdate = true;
  }

  const VISTA = () => ({ target: new THREE.Vector3(0, 1.1, 0), theta: 0.22, phi: 1.32, r: 6.4 });
  let mondo = null;
  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    const griglia = new THREE.GridHelper(20, 20, COL.griglia, COL.griglia);
    radice.add(griglia, copia(1));
    const posto = (x, z, nome, yaw) => { const p = pedana(x, z, nome); p.scale.setScalar(0.16); p.position.y = 0.01; return { pedana: p, pos: new THREE.Vector3(x, 0.03, z), yaw }; };
    const stazioni = [posto(0, 2.6, 'davanti', 0), posto(3.4, 0.4, 'di lato', 1.45), posto(-3.4, 0.4, 'dall\'altro lato', -1.45)];
    stazioni.forEach((st) => { st.pedana.visible = false; });
    const mini = new THREE.Group();
    mini.add(copia(1.6)); mini.scale.setScalar(0.42); mini.position.y = -0.45;
    aggiornaCella();
    mondo = {
      radice, stazioni, modellino: mini, vistaIniziale: VISTA,
      lente: () => { disegnaLente(); return texLente; },
      tocchi: (v) => prese[v === 'mini' ? 'mini' : 'schermo'].filter((o) => o.userData.tocco !== 'el2' || s.anodo),
      frame(dt) {
        const an = anodo();
        if (an) s.cons[an.slot] = Math.min(1, s.cons[an.slot] + dt * 0.05);
        const att = !!an && s.cons[an.slot] < 1;
        copie.forEach((c) => {
          c.slot.forEach((sl, i) => {
            const k = s.cons[i];
            sl.perno.scale.set(1 - 0.5 * k, 1 - 0.75 * k, 1 - 0.6 * k);
            sl.mat.color.setHex(COL.scafo).lerp(new THREE.Color(COL.ocra), k);
          });
          // Elettroni nel conduttore, dall'anodo verso l'altro elettrodo (figura della slide 26)
          part.forEach((p, i) => {
            p.t = (p.t + dt * 0.0009 * 60 * 0.28) % 1;
            if (!att || an.slot === 2) sc1.setScalar(0);
            else {
              c.curva.getPoint(an.slot === 0 ? p.t : 1 - p.t, v3); sc1.setScalar(1);
              m4.compose(v3, qn, sc1); c.el.setMatrixAt(i, m4); return;
            }
            v3.set(0, -50, 0); m4.compose(v3, qn, sc1); c.el.setMatrixAt(i, m4);
          });
          c.el.instanceMatrix.needsUpdate = true;
        });
        return att;
      },
    };
    return mondo;
  }

  // Toccando un elettrodo nella vasca si cambia il metallo; toccando lo zinco lo si toglie
  function comandi(idTocco) {
    const SUL = { 't:el0': 'a+', 't:el1': 'b+', 't:el2': 'anodo' };
    const id = SUL[idTocco.split(',')[0]] || idTocco;
    const prima = `${s.a}|${s.b}|${s.anodo}`;
    if (id === 'a+') s.a = (s.a + 1) % METALLI.length;
    if (id === 'a-') s.a = (s.a + METALLI.length - 1) % METALLI.length;
    if (id === 'b+') s.b = (s.b + 1) % METALLI.length;
    if (id === 'b-') s.b = (s.b + METALLI.length - 1) % METALLI.length;
    if (id === 'anodo') s.anodo = !s.anodo;
    if (id === 'riparti' || prima !== `${s.a}|${s.b}|${s.anodo}`) s.cons = [0, 0, 0];
    const coppia = [METALLI[s.a].nome, METALLI[s.b].nome];
    const ha = (x, y) => coppia.includes(x) && coppia.includes(y);
    if (ha('Acciaio', 'Zinco')) lez.completa('coppia');
    if (ha('Acciaio', 'Rame')) lez.completa('ruolo');
    if (ha('Acciaio', 'Bronzo') && s.anodo) lez.completa('anodo');
    aggiornaCella();
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { zinco: 'Lo zinco', acciaio: 'L\'acciaio', uguale: 'Tutti e due insieme' };
    const an = anodo();
    const giudizio = !an ? 'Due metalli uguali: non c\'è cella galvanica.' : `**${an.m.nome}** è il meno nobile: fa da anodo e si consuma.`;
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Di che cosa è fatta una nave' },
          { t: 'p', testo: 'Nella costruzione navale moderna domina l\'**acciaio**: costo, resistenza e facilità di fabbricazione. {{slide 2}}' },
          { t: 'p', testo: 'Si definisce acciaio una lega ferro-carbonio con carbonio minore del 2%. Oltre il 2% si parla di **ghisa**. {{slide 2}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: 'L\'unico svantaggio degli elementi metallici è la **corrosione** (*corrosion*): il «consumo» delle strutture per un processo elettrochimico con l\'acqua di mare, che fa da elettrolita. {{slide 25}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Acciaio e zinco sono immersi in acqua di mare e collegati da un conduttore. È una **cella galvanica**. {{slide 26}}' },
        ],
        dx: [
          { t: 'sotto', testo: 'Quale metallo si corrode per primo?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:zinco', testo: 'Lo zinco', on: p === 'zinco' },
          { t: 'scelta', id: 'p:acciaio', testo: 'L\'acciaio', on: p === 'acciaio' },
          { t: 'scelta', id: 'p:uguale', testo: 'Tutti e due insieme', on: p === 'uguale' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'passo', id: 'a', nome: 'Primo metallo', valore: METALLI[s.a].nome },
          { t: 'passo', id: 'b', nome: 'Secondo metallo', valore: METALLI[s.b].nome },
          { t: 'bottoni', h: 84, size: 32, lista: [{ id: 'anodo', testo: s.anodo ? 'Togli l\'anodo di zinco' : 'Aggiungi anodo di zinco', on: s.anodo }, { id: 'riparti', testo: 'Riparti' }] },
          { t: 'riquadro', size: 36, testo: giudizio },
          ...lez.missioni(),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 560,
            testo: !vr ? '' : vera
              ? 'Sei accanto alla vasca. Punta una pedana e premi il grilletto per spostarti.'
              : 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.',
          },
          ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          { t: 'zona', id: 'lente', h: 490 },
          { t: 'nota', testo: 'Serie galvanica: slide 28. Consumo schematico.' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'zinco' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Con lo zinco l\'acciaio resta intatto. Con il rame, invece, è l\'acciaio a consumarsi: lo stesso metallo cambia ruolo.' },
        ],
        dx: [
          { t: 'titolo', testo: 'Si corrode lo zinco' },
          { t: 'p', testo: 'Il catodo si conserva, mentre l\'**anodo** si corrode. Il ruolo non è fisso, ma relativo. {{slide 27}}' },
          { t: 'p', testo: 'Lo si studia con la **serie galvanica** degli elementi in acqua di mare: l\'elemento nobile si conserverà, quello ignobile si degraderà. {{slide 28}}' },
          { t: 'p', testo: 'Sullo scafo accade, per esempio, con la coppia fasciame/elica, o dove un danno lascia scoperto l\'acciaio vivo. {{slide 28}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Prevenire la corrosione' },
          { t: 'p', size: 38, testo: '**Vernici protettive** (*protective coatings*): una pellicola che isola il metallo; spesso anche antivegetative (*antifouling*). {{slide 29}}' },
          { t: 'p', size: 38, testo: '**Anodi sacrificali**: leghe di zinco, alluminio o magnesio, meno nobili dell\'acciaio, che si consumano e vanno riapplicate. {{slide 30, 31}}' },
          { t: 'p', size: 38, testo: '**Corrente impressa** (ICCP): sensori e pannello mantengono la corrente adeguata; gli anodi possono essere non consumabili. {{slide 32, 33}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Gli acciai da scafo' },
          { t: 'tabella', col: [34, 66], size: 32, righe: [
            ['Famiglia', 'Snervamento ReH'],
            ['Ordinari (NSS)', '235 MPa'],
            ['Elevata resistenza (HSS)', '315, 355 o 390 MPa'],
          ] },
          { t: 'tabella', col: [30, 70], size: 32, righe: [
            ['Grado', 'Test di resilienza'],
            ['A', '+20 °C (o non richiesto)'],
            ['B', '0 °C'],
            ['D', '−20 °C'],
            ['E', '−40 °C'],
          ] },
          { t: 'nota', testo: 'slide 12–14. Densità circa 7,85 t/m³, modulo di Young 206 GPa' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Le prove sui materiali' },
          { t: 'p', size: 38, testo: 'Le prove si eseguono su un **provino**. {{slide 6}}' },
          { t: 'p', size: 38, testo: '**Trazione**: costruisce il diagramma forza-allungamento. Oltre lo snervamento le deformazioni diventano permanenti. {{slide 7, 8}}' },
          { t: 'p', size: 38, testo: '**Resilienza**: si rompe con un colpo una provetta intagliata, con il pendolo di Charpy. {{slide 9, 10}}' },
          { t: 'p', size: 38, testo: '**Durezza**: resistenza a essere penetrato da un altro materiale. {{slide 11}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Le leghe leggere' },
          { t: 'p', size: 36, testo: 'Alluminio e altri elementi. Peso specifico 2,75 t/m³ contro 7,85 degli acciai. Buona resistenza alla corrosione. {{slide 16}}' },
          { t: 'p', size: 36, testo: 'Sovrastrutture in alluminio abbassano il centro di gravità; scafi veloci in alluminio raggiungono velocità maggiori. {{slide 17}}' },
          { t: 'p', size: 36, testo: 'Limiti: fonde a 660 °C contro circa 1400 °C dell\'acciaio e si degrada già da 200 °C; caratteristiche inferiori; saldabilità ridotta. {{slide 19}}' },
          { t: 'p', size: 36, testo: 'A bordo anche ghisa e leghe del rame: bronzo, cupronickel, ottone. {{slide 22}}' },
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
