/* Lezione 16: forma della Terra, coordinate e orientamento. Definizioni ed esempi dalle slide 4-27.
   Nei modelli le deformazioni del geoide e lo schiacciamento sono esagerati: non sono misure */
(function () {
  const N = 16;
  const { COL, tela, etichetta, maniglia, cuoci, segmento, tratto } = Tavola;
  const { griglia } = Scafo;

  const MISSIONI = [
    { id: 'equatore', testo: 'Porta il punto sull\'equatore.' },
    { id: 'polo', testo: 'Supera il polo: che cosa succede a latitudine e longitudine?' },
    { id: 'anti', testo: 'Passa i 180° di longitudine: che cosa cambia?' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Il geoide è…', scelte: ['Un solido di rotazione', 'La superficie del livello medio ideale del mare', 'Una carta nautica'], giusta: 1, perche: 'Equipotenziale del campo gravitazionale, esteso anche sotto i continenti.' },
    { n: 2, testo: 'Nell\'ellissoide, b è…', scelte: ['Il semiasse polare', 'Il semiasse equatoriale', 'Il raggio medio'], giusta: 0, perche: 'a è il semiasse maggiore (equatoriale), b il minore (polare).' },
    { n: 3, testo: 'I meridiani sono…', scelte: ['Circonferenze minori', 'Semi-circonferenze massime tra i poli', 'Paralleli all\'equatore'], giusta: 1, perche: 'Vanno dal polo nord al polo sud.' },
    { n: 4, testo: 'La longitudine può arrivare a…', scelte: ['90°', '180°', '360°'], giusta: 1, perche: 'Da 0 a 180°, con cardini Est (+) o Ovest (−).' },
    { n: 5, testo: 'Il Sole a mezzogiorno, da noi, indica…', scelte: ['Il Sud', 'Il Nord', 'L\'Est'], giusta: 0, perche: 'Il Sud è la direzione del Sole quando è più alto nel cielo.' },
    { n: 6, testo: 'Il vento da Sud-Ovest è il…', scelte: ['Grecale', 'Maestrale', 'Libeccio'], giusta: 2, perche: 'Il Libeccio, che arriva dalla Libia.' },
  ];
  const CALCOLI = [
    { n: 7, testo: 'Calcola Δφ tra φA = 15° S e φB = 30° N.', campi: [['Δφ', 45, 0.001, '°']], soluzione: '+30° − (−15°) = 45°' },
    { n: 8, testo: 'φA = 85° N, Δφ = 20° N. Quale latitudine raggiungi?', campi: [['φB', 75, 0.001, '° N']], soluzione: '105° N supera 90° di 15°: 90° − 15° = 75° N' },
    { n: 9, testo: 'λA = 165° E, Δλ = 60° E. Quale longitudine raggiungi?', campi: [['λB', 135, 0.001, '° W']], soluzione: '225° E = 180° + 45°: −180° + 45° = −135°, cioè 135° W' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  /* Simulazione 1: dal geoide al piano --------------------------------------------------- */
  const FORME = [
    { nome: 'Geoide', testo: 'Superficie del livello medio ideale del mare, estesa sotto i continenti. Teorica: la sua formula è troppo complessa. {{slide 7}}' },
    { nome: 'Sferoide', testo: 'Massa supposta simmetrica rispetto all\'asse di rotazione: un solido di rotazione, ma ancora senza equazione operativa. {{slide 10}}' },
    { nome: 'Ellissoide', testo: 'Formula risolvibile, abbastanza precisa per satelliti, cartografia e pubblicazioni nautiche. {{slide 11}}' },
    { nome: 'Sfera', testo: 'Semplifica le formule della navigazione marittima, con errori trascurabili nella pratica. {{slide 12}}' },
    { nome: 'Piano', testo: 'Porzioni della Terra su un foglio: carte nautiche, con errori di aree, distanze o forme, e schemi sull\'orizzonte. {{slide 13}}' },
  ];
  const fo = { t: 0, copie: [] }; const RF = 24; const CYF = 34;
  const FU = 48; const FV = 24;
  function puntoForma(lon, lat, t) {
    const dolce = (a) => Math.max(0, Math.min(1, a));
    const tutto = 0.09 * Math.sin(3 * lon + 1) * Math.cos(2 * lat) + 0.06 * Math.sin(2 * lon) * Math.cos(lat);
    const asse = 0.06 * Math.sin(3 * lat);
    const bozze = (1 - dolce(t)) * tutto + (1 - dolce(t - 1)) * asse;
    const schiaccia = 1 - 0.14 * (dolce(t - 0.5) * (1 - dolce(t - 2)));
    const r = RF * (1 + bozze);
    const sx = r * Math.cos(lat) * Math.sin(lon); const sy = r * Math.sin(lat) * schiaccia; const sz = r * Math.cos(lat) * Math.cos(lon);
    const f = dolce(t - 3);
    return [sx + (RF * 1.1 * lon - sx) * f, sy + (RF * 1.1 * lat - sy) * f, sz * (1 - f)];
  }
  function posaForme() {
    fo.copie.forEach((c) => {
      const p = c.geo.attributes.position; let n = 0;
      for (let i = 0; i <= FU; i++) for (let j = 0; j <= FV; j++) { p.setXYZ(n++, ...puntoForma(-Math.PI + (i / FU) * 2 * Math.PI, -Math.PI / 2 + (j / FV) * Math.PI, fo.t)); }
      p.needsUpdate = true; c.geo.computeBoundingSphere();
      cuoci(c.geo, '#2E7DB5');
      c.presa.position.x = -40 + fo.t * 20;
    });
  }
  const creaForme = Lezione.simula({
    scala: 0.0075, centro: [0, 30], mare: false, k: 3, pedana: [0, 66, 'davanti alla Terra'], dopo: posaForme,
    vista: () => ({ target: new THREE.Vector3(0, 28, 0), theta: 0, phi: 1.5, r: 132 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const t = new THREE.Group(); t.position.y = CYF; g.add(t);
      const geo = griglia(FU, FV, () => [0, 0, 0]);
      t.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
      t.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xEEF2F8, wireframe: true, transparent: true, opacity: 0.22 })));
      g.add(segmento(new THREE.Vector3(-42, 2, 0), new THREE.Vector3(42, 2, 0), 0.12 * k, COL.inchiostro));
      FORME.forEach((f, i) => { const e = etichetta(f.nome, 2 + k * 0.6); e.position.set(-40 + i * 20, -1, 0); g.add(e); });
      const presa = maniglia(1.6 * Math.sqrt(k), 'forma'); presa.position.set(-40, 2, 0); g.add(presa); tocca(presa);
      fo.copie.push({ geo, presa });
      return g;
    },
    trascina(id, dx) {
      const prima = Math.round(fo.t);
      fo.t = Math.max(0, Math.min(4, fo.t + dx * 0.011));
      posaForme();
      if (Math.round(fo.t) !== prima) Motore.ridisegna();
    },
  });

  /* Simulazione 2: il punto sul globo ------------------------------------------------------- */
  const g1 = { fi: 42, la: 12, verso: 1, copie: [] }; const R = 30; const CY = 34;
  const rad = (a) => (a * Math.PI) / 180;
  const cardFi = (v) => (Math.round(v) === 0 ? '0°' : `${Math.abs(Math.round(v))}° ${v > 0 ? 'N' : 'S'}`);
  const cardLa = (v) => (Math.round(v) === 0 ? '0°' : Math.abs(Math.round(v)) === 180 ? '180°' : `${Math.abs(Math.round(v))}° ${v > 0 ? 'E' : 'W'}`);
  function texGlobo() {
    return tela(2048, 1024, (c) => {
      c.fillStyle = '#2E7DB5'; c.fillRect(0, 0, 2048, 1024);
      c.strokeStyle = 'rgba(238,242,248,0.55)'; c.lineWidth = 2;
      for (let a = 0; a < 360; a += 15) { const x = (a / 360) * 2048; c.lineWidth = a % 30 ? 1 : 3; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 1024); c.stroke(); }
      for (let a = 15; a < 180; a += 15) { const y = (a / 180) * 1024; c.lineWidth = a % 30 ? 1 : 3; c.beginPath(); c.moveTo(0, y); c.lineTo(2048, y); c.stroke(); }
      c.strokeStyle = '#C9A227'; c.lineWidth = 9; c.beginPath(); c.moveTo(0, 512); c.lineTo(2048, 512); c.stroke();
      c.strokeStyle = '#B3362B'; c.beginPath(); c.moveTo(512, 0); c.lineTo(512, 1024); c.stroke();
    });
  }
  function posaGlobo() {
    const f = rad(g1.fi); const l = rad(g1.la);
    const p = [R * Math.cos(f) * Math.sin(l), R * Math.sin(f), R * Math.cos(f) * Math.cos(l)];
    g1.copie.forEach((c) => {
      c.terra.rotation.y = -l; // il punto resta davanti a chi guarda: gira la Terra
      c.presa.position.set(p[0] * 1.05, p[1] * 1.05, p[2] * 1.05);
      const rp = Math.cos(f) * R;
      c.parallelo.position.y = R * Math.sin(f); c.parallelo.scale.set(rp, rp, R);
      c.meridiano.rotation.y = l - Math.PI / 2;
    });
  }
  function muoviGlobo(dFi, dLa) {
    let f = g1.fi + dFi * g1.verso; let l = g1.la + dLa; let eventi = false;
    // Oltre il polo si scende dall'altra parte e si passa dall'altra parte del mondo (slide 21)
    if (f > 90 || f < -90) { f = Math.sign(f) * 180 - f; l += 180; g1.verso = -g1.verso; lez.completa('polo'); eventi = true; }
    if (l > 180) { l -= 360; if (dLa) { lez.completa('anti'); eventi = true; } } else if (l < -180) { l += 360; if (dLa) { lez.completa('anti'); eventi = true; } }
    g1.fi = f; g1.la = l;
    if (Math.abs(f) < 0.6 && !lez.fatte.has('equatore')) { lez.completa('equatore'); eventi = true; }
    posaGlobo();
    return eventi;
  }
  const creaGlobo = Lezione.simula({
    scala: 0.0085, centro: [0, 34], mare: false, k: 3, pedana: [0, 72, 'davanti al globo'], dopo: posaGlobo,
    vista: () => ({ target: new THREE.Vector3(0, 34, 0), theta: 0, phi: 1.5, r: 112 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const terra = new THREE.Group(); terra.position.y = CY; g.add(terra);
      terra.add(new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), new THREE.MeshBasicMaterial({ map: texGlobo() })));
      terra.add(segmento(new THREE.Vector3(0, -R - 7, 0), new THREE.Vector3(0, R + 7, 0), 0.22 * Math.sqrt(k), COL.inchiostro));
      const oro = new THREE.MeshBasicMaterial({ color: COL.ocra });
      const parallelo = new THREE.Mesh(new THREE.TorusGeometry(1.01, 0.008 * Math.sqrt(k), 6, 64), oro); parallelo.rotation.x = Math.PI / 2; terra.add(parallelo);
      const meridiano = new THREE.Group(); const arco = new THREE.Mesh(new THREE.TorusGeometry(R * 1.01, 0.24 * Math.sqrt(k), 6, 48, Math.PI), oro); arco.rotation.z = -Math.PI / 2; meridiano.add(arco); terra.add(meridiano);
      const dim = 3 + k;
      [['Polo Nord', 0, R + 10, 0, '#0B2545'], ['Polo Sud', 0, -R - 10, 0, '#0B2545']].forEach(([t, x, y, z, col]) => { const e = etichetta(t, dim, col); e.position.set(x, y, z); terra.add(e); });
      const gr = etichetta('Greenwich', dim, '#B3362B'); gr.position.set(0, 12, R + 3); terra.add(gr);
      const eq = etichetta('equatore', dim, '#8C7020'); eq.position.set(R + 3, 2, 0); terra.add(eq);
      const presa = maniglia(1.3 * Math.sqrt(k), 'punto'); terra.add(presa); tocca(presa);
      g1.copie.push({ terra, parallelo, meridiano, presa });
      return g;
    },
    trascina(id, dx, dy) {
      const prima = `${cardFi(g1.fi)}|${cardLa(g1.la)}`;
      const evento = muoviGlobo(-dy * 0.2, dx * 0.2);
      if (evento || `${cardFi(g1.fi)}|${cardLa(g1.la)}` !== prima) Motore.ridisegna();
    },
  });
  function comandiGlobo(id) {
    if (id === 'fi+') muoviGlobo(5, 0);
    if (id === 'fi-') muoviGlobo(-5, 0);
    if (id === 'la+') muoviGlobo(0, 15);
    if (id === 'la-') muoviGlobo(0, -15);
    Motore.sporco();
  }

  /* Simulazione 3: la rosa dei venti --------------------------------------------------------- */
  const VENTI = [
    ['Tramontana', 'Nord', 'Prende il nome dai monti (le Alpi) situati a nord del Mediterraneo.'],
    ['Grecale', 'Nord-Est', 'Arriva dalla direzione della Grecia.'],
    ['Levante', 'Est', 'Arriva da dove «leva» (sorge) il Sole.'],
    ['Scirocco', 'Sud-Est', 'Arriva dai deserti dell\'Africa o dalla Siria.'],
    ['Ostro o Mezzogiorno', 'Sud', 'Arriva dal sud, la direzione del sole a mezzogiorno.'],
    ['Libeccio', 'Sud-Ovest', 'Arriva dalla Libia.'],
    ['Ponente', 'Ovest', 'Arriva da dove il Sole «pone» (tramonta).'],
    ['Maestrale', 'Nord-Ovest', 'Il vento «maestro», che soffiava con forza da Roma verso il mare.'],
  ];
  const ro = { g: 0, copie: [] }; const RR = 46;
  function texRosa() {
    return tela(1024, 1024, (c) => {
      const O = 512; c.fillStyle = '#FBFAF4'; c.beginPath(); c.arc(O, O, 505, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#C9A227'; c.lineWidth = 10; c.stroke();
      for (let i = 7; i >= 0; i--) {
        c.save(); c.translate(O, O); c.rotate((i * Math.PI) / 4);
        const l = i % 2 ? 250 : 340;
        c.fillStyle = i % 2 ? '#C9A227' : '#0B2545'; c.beginPath(); c.moveTo(0, -l); c.lineTo(46, -46); c.lineTo(0, 0); c.closePath(); c.fill();
        c.fillStyle = i % 2 ? '#E3C878' : '#13315C'; c.beginPath(); c.moveTo(0, -l); c.lineTo(-46, -46); c.lineTo(0, 0); c.closePath(); c.fill();
        c.restore();
      }
      c.fillStyle = '#0B2545'; c.font = '700 40px Atkinson, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      VENTI.forEach(([n], i) => {
        c.save(); c.translate(O, O); c.rotate((i * Math.PI) / 4); c.fillText(n.split(' ')[0], 0, -420); c.restore();
      });
    });
  }
  const settore = () => ((Math.round(ro.g / 45) % 8) + 8) % 8;
  function posaRosa() {
    const a = rad(ro.g);
    ro.copie.forEach((c) => {
      c.vento.rotation.y = -a;
      c.presa.position.set(Math.sin(a) * (RR + 5), 3, -Math.cos(a) * (RR + 5));
    });
  }
  const creaRosa = Lezione.simula({
    scala: 0.0105, centro: [0, 0], k: 3, pedana: [0, 62, 'sul mare'], mare: true, dopo: posaRosa,
    vista: () => ({ target: new THREE.Vector3(0, 0, 0), theta: 0, phi: 0.72, r: 168 }),
    modello(k, tocca) {
      const g = new THREE.Group();
      const disco = new THREE.Mesh(new THREE.CircleGeometry(RR, 64), new THREE.MeshBasicMaterial({ map: texRosa(), side: THREE.DoubleSide }));
      disco.rotation.x = -Math.PI / 2; disco.position.y = 0.2; g.add(disco);
      const nave2 = Scafo.crea(k > 1 ? 5 : 2); nave2.scale.setScalar(0.34); nave2.rotation.y = Math.PI / 2; nave2.position.set(0, 0, (Scafo.L / 2) * 0.34); g.add(nave2);
      // Freccia del vento: arriva dal bordo verso il centro
      const vento = new THREE.Group();
      vento.add(tratto([new THREE.Vector3(0, 3, -RR), new THREE.Vector3(0, 3, -26), new THREE.Vector3(0, 3, -12)], 0.5 * Math.sqrt(k), COL.rosso));
      const punta = new THREE.Mesh(new THREE.ConeGeometry(2 * Math.sqrt(k), 5 * Math.sqrt(k), 10), new THREE.MeshBasicMaterial({ color: COL.rosso }));
      punta.rotation.x = Math.PI / 2; punta.position.set(0, 3, -10); vento.add(punta);
      g.add(vento);
      const presa = maniglia(2 * Math.sqrt(k), 'vento'); g.add(presa); tocca(presa);
      ro.copie.push({ vento, presa });
      return g;
    },
    trascina(id, dx) {
      const prima = settore();
      ro.g += dx * 0.45;
      posaRosa();
      if (settore() !== prima) Motore.ridisegna();
    },
  });
  function comandiRosa(id) {
    if (id === 'lascia:vento') { ro.g = settore() * 45; posaRosa(); }
    if (id === 'v+') { ro.g = (settore() + 1) * 45; posaRosa(); }
    if (id === 'v-') { ro.g = (settore() - 1) * 45; posaRosa(); }
    Motore.sporco();
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const RISPOSTE = { z: '0°', q: '45°', n: '90°' };
    const f = FORME[Math.round(fo.t)]; const v = VENTI[settore()];
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Che forma ha la Terra?' },
          { t: 'p', testo: 'La **geodesia** studia la forma e le dimensioni della Terra, il suo campo gravitazionale e le sue variazioni nel tempo. Dal greco *gê* (terra) e *daío* (divido). {{slide 4}}' },
          { t: 'p', testo: 'La superficie esterna è irregolare, non rappresentabile con una superficie matematica. {{slide 5}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: 'Serviva una superficie matematica, vicina a quella fisica, riferita a una terna cartesiana: origine nel baricentro, asse Z sull\'asse di rotazione, asse X verso Greenwich. {{slide 5, 6}}' },
          { t: 'riquadro', size: 38, testo: 'Il raggio della Terra è 6371 km; il punto più profondo mai raggiunto è a 10 994 m. Non sapremo mai che cosa c\'è in ogni punto. {{slide 9}}' },
        ],
      },
      {
        passo: 0, mondo: creaForme,
        sx: [
          { t: 'titolo', testo: 'Cinque forme' },
          { t: 'p', size: 38, testo: 'Si usa solo la forma con il livello di accuratezza necessario. {{slide 12}}' },
          { t: 'riquadro', size: 38, testo: `**${f.nome}.** ${f.testo}` },
          ...(Math.round(fo.t) === 2 ? [{ t: 'formula', testo: '(X² + Y²) / a² + Z² / b² = 1' }] : []),
          { t: 'nota', testo: 'Trascina la sfera d\'oro lungo la riga. Deformazioni e schiacciamento sono esagerati per vederli.' },
        ],
        dx: Lezione.finestra(760),
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Il polo Nord e il polo Sud si trovano ai due estremi dell\'asse di rotazione. L\'equatore sta a metà strada.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Che latitudine ha l\'equatore?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:q', testo: '45°', on: p === 'q' },
          { t: 'scelta', id: 'p:z', testo: '0°', on: p === 'z' },
          { t: 'scelta', id: 'p:n', testo: '90°', on: p === 'n' },
        ],
      },
      {
        passo: 2, mondo: creaGlobo, azione: comandiGlobo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Dov\'è il punto?' },
          { t: 'formula', testo: `φ = ${cardFi(g1.fi)}` },
          { t: 'formula', testo: `λ = ${cardLa(g1.la)}` },
          { t: 'passo', id: 'fi', nome: 'Verso nord o sud', valore: cardFi(g1.fi) },
          { t: 'passo', id: 'la', nome: 'Verso est o ovest', valore: cardLa(g1.la) },
          ...lez.missioni(),
        ],
        dx: [
          ...Lezione.finestra(760),
          { t: 'nota', testo: 'Trascina la sfera d\'oro: è il punto. Oro: il suo parallelo e il suo meridiano. Rosso: Greenwich. Il globo è un reticolato, senza continenti.' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'z' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Sull\'equatore φ vale 0°: la latitudine si conta da lì. La longitudine si conta da Greenwich.' },
        ],
        dx: [
          { t: 'titolo', testo: 'Latitudine e longitudine' },
          { t: 'p', size: 38, testo: 'La **latitudine** φ è l\'angolo al centro che sottende l\'arco di meridiano dall\'equatore al parallelo del punto: da 0 a 90°, Nord (+) o Sud (−). {{slide 19}}' },
          { t: 'p', size: 38, testo: 'La **longitudine** λ è l\'angolo al centro che sottende l\'arco di equatore dal piede del meridiano di Greenwich al piede del meridiano del punto: da 0 a 180°, Est (+) o Ovest (−). {{slide 19}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Il reticolato geografico' },
          { t: 'tabella', col: [28, 72], size: 34, righe: [
            ['Nome', 'Che cos\'è'],
            ['Poli', 'i due punti in cui l\'asse di rotazione interseca la superficie'],
            ['Equatore', 'circolo massimo equidistante fra i poli'],
            ['Meridiani', 'semi-circonferenze massime dal polo nord al polo sud'],
            ['Paralleli', 'circonferenze minori parallele all\'equatore'],
          ] },
          { t: 'nota', testo: 'slide 17, 18' },
        ],
        dx: [
          { t: 'titolo', testo: 'I poli' },
          { t: 'p', testo: 'Osservando la Terra dal polo Nord, ruota in senso antiorario; dal polo Sud, in senso orario. {{slide 17}}' },
          { t: 'p', testo: 'Il sistema di coordinate geografiche individua in modo univoco un punto sulla superficie con valori numerici, partendo dall\'asse di rotazione. {{slide 16}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Operazioni' },
          { t: 'p', size: 38, testo: 'Si sottraggono le coordinate tenendo conto del segno del cardine. {{slide 20}}' },
          { t: 'formula', testo: 'Δφ = φB − φA' },
          { t: 'formula', testo: '30° N − 15° S = 45°' },
          { t: 'formula', testo: 'φB = φA + Δφ' },
          { t: 'nota', testo: 'Lo stesso avviene per λ.' },
        ],
        dx: [
          { t: 'titolo', testo: 'Casi particolari' },
          { t: 'p', size: 36, testo: 'Se φ supera 90° si è passato il polo: la parte eccedente si sottrae a 90°, e alla longitudine si somma o sottrae 180°. {{slide 21}}' },
          { t: 'formula', testo: '85° N + 20° N → 75° N' },
          { t: 'p', size: 36, testo: 'Se λ supera 180° si cambia il cardine e si percorre il resto. {{slide 22}}' },
          { t: 'formula', testo: '165° E + 60° E → 135° W' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Orientarsi' },
          { t: 'p', size: 38, testo: 'Orientarsi significava «volgersi verso Oriente»: dal latino *oriri*, nascere, sorgere. {{slide 24}}' },
          { t: 'tabella', col: [20, 80], size: 34, righe: [
            ['Punto', 'Come si trova'],
            ['Nord', 'nel nostro emisfero, con la stella Polare'],
            ['Sud', 'il Sole a mezzogiorno'],
            ['Est', '90° a destra del Nord: più o meno dove sorge il Sole'],
            ['Ovest', '90° a sinistra del Nord: più o meno dove tramonta'],
          ] },
          { t: 'nota', testo: 'slide 25' },
        ],
        dx: [
          { t: 'titolo', testo: 'La rosa dei venti' },
          { t: 'p', testo: 'Diagramma circolare con i punti cardinali e le direzioni intermedie, basato sui venti storici del Mediterraneo. Si chiama rosa perché le punte ricordavano i petali. {{slide 26}}' },
        ],
      },
      {
        passo: 3, mondo: creaRosa, azione: comandiRosa,
        sx: [
          { t: 'titolo', testo: 'Che vento soffia?' },
          { t: 'passo', id: 'v', nome: 'Direzione', valore: v[1] },
          { t: 'riquadro', size: 40, testo: `**${v[0]}** (${v[1]}). ${v[2]} {{slide 27}}` },
          { t: 'nota', testo: 'Trascina la sfera d\'oro intorno alla rosa: la freccia rossa è il vento che arriva da lì.' },
        ],
        dx: Lezione.finestra(760),
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'titolo', testo: 'Riconosci' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande sulle definizioni delle slide. Dopo due tentativi vedi la soluzione.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      {
        passo: 4, richiede: () => lez.fatto.quiz(QUIZ.map((q) => q.n)), avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'titolo', testo: 'Calcola' }, { t: 'nota', testo: 'Gli esempi delle slide 20, 21 e 22.' }, ...lez.calcoloSx()],
        dx: lez.calcoloDx(),
      },
      lez.premio(() => lez.fatto.quiz([...QUIZ, ...CALCOLI].map((q) => q.n))),
    ];
  });
})();
