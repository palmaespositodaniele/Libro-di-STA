/* Lezione 1: generalità sul mezzo nave. Le slide non hanno numeri sulla nave disegnata:
   forma e oscillazione sono schematiche e non compaiono mai come dati */
(function () {
  const N = 1;
  const { COL, tratto, etichetta, pedana } = Tavola;
  const { C } = Pagina;
  const { insellatura, mezza, ascissa, fiancata, ponte, specchio, griglia, L } = Scafo;
  const Y_ACQUA = 6;

  const MISSIONI = [
    { id: 'lati', testo: 'Trova prua, poppa, dritta e sinistra.' },
    { id: 'zone', testo: 'Trova masconi, giardinetti, opera viva e opera morta.' },
    { id: 'sbanda', testo: 'Sbanda la nave e guarda che cosa fa.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Entro quante miglia nautiche dalla costa navigano le navi minori?', scelte: ['6', '20', '200'], giusta: 1, perche: 'Le navi minori navigano entro le 20 miglia nautiche dalla costa.' },
    { n: 2, testo: 'Come si chiama la capacità di resistere alla penetrazione dell\'acqua?', scelte: ['Robustezza', 'Impermeabilità', 'Galleggiabilità'], giusta: 1, perche: 'È l\'impermeabilità (impermeability).' },
    { n: 3, testo: 'Come si chiama la zona laterale prodiera dello scafo?', scelte: ['Giardinetto', 'Ginocchio', 'Mascone'], giusta: 2, perche: 'È il mascone (starboard/port bow).' },
    { n: 4, testo: 'Come si chiama la parte immersa dello scafo?', scelte: ['Opera viva', 'Opera morta', 'Murata'], giusta: 0, perche: 'È l\'opera viva o carena (underwater body).' },
    { n: 5, testo: 'Come si chiama il collegamento curvo tra fondo e fianchi?', scelte: ['Cassero', 'Ginocchio', 'Tuga'], giusta: 1, perche: 'È il ginocchio (turn of the bilge).' },
    { n: 6, testo: 'Seguire la traiettoria con il timone al centro è…', scelte: ['Manovrabilità', 'Velocità', 'Stabilità di rotta'], giusta: 2, perche: 'È la stabilità di rotta (course stability).' },
  ];

  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  // Parti della nave, dalle slide 10-20. fa: quali pezzi si colorano; vista: da dove guardarla
  const PARTI = [
    { id: 'prua', nome: 'Prua', testo: 'La parte anteriore della nave. {{slide 11}}', fa: () => [fiancata(0.86, 1, 0, 11, 1), fiancata(0.86, 1, 0, 11, -1)], theta: 1.0 },
    { id: 'poppa', nome: 'Poppa', testo: 'La parte posteriore della nave. {{slide 11}}', fa: () => [fiancata(0, 0.13, 0, 10, 1), fiancata(0, 0.13, 0, 10, -1)], theta: -0.9 },
    { id: 'dritta', nome: 'Dritta', testo: '**Dritta** (*starboard*): il lato a destra, guardando verso prua. {{slide 10}}', fa: () => [fiancata(0, 1, 0, 11, 1)], theta: 0.3 },
    { id: 'sinistra', nome: 'Sinistra', testo: '**Sinistra** (*port*): l\'altro lato. Lo scafo è simmetrico rispetto all\'asse longitudinale. {{slide 10}}', fa: () => [fiancata(0, 1, 0, 11, -1)], theta: 2.85 },
    { id: 'mascone', nome: 'Masconi', testo: '**Mascone** (*starboard/port bow*): ciascuna zona laterale prodiera dello scafo. {{slide 12}}', fa: () => [fiancata(0.72, 0.93, 3, 11, 1), fiancata(0.72, 0.93, 3, 11, -1)], theta: 0.9 },
    { id: 'giardinetto', nome: 'Giardinetti', testo: '**Giardinetto** (*starboard/port quarter*): ogni equivalente poppiero del mascone. {{slide 14}}', fa: () => [fiancata(0.03, 0.2, 3, 11, 1), fiancata(0.03, 0.2, 3, 11, -1)], theta: -0.6 },
    { id: 'viva', nome: 'Opera viva', testo: '**Opera viva** o carena (*underwater body*): la parte immersa dello scafo. {{slide 15}}', fa: () => [fiancata(0, 1, 0, Y_ACQUA, 1), fiancata(0, 1, 0, Y_ACQUA, -1)], theta: 0.5 },
    { id: 'morta', nome: 'Opera morta', testo: '**Opera morta** (*upperworks*): la parte emersa dello scafo. {{slide 15}}', fa: () => [fiancata(0, 1, Y_ACQUA, 11, 1), fiancata(0, 1, Y_ACQUA, 11, -1)], theta: 0.5 },
    { id: 'specchio', nome: 'Specchio di poppa', testo: 'La parte slanciata verso l\'esterno: qui si trovano il nome della nave, il numero IMO e il luogo di registrazione. {{slide 11}}', fa: () => [specchio()], theta: -1.5 },
    { id: 'volta', nome: 'Volta di poppa', testo: 'La rientranza dello scafo a poppa, dovuta all\'alloggiamento dell\'elica e del timone. {{slide 11}}', fa: () => [fiancata(0, 0.18, 1, 5.2, 1), fiancata(0, 0.18, 1, 5.2, -1)], theta: -1.0 },
    { id: 'cubia', nome: 'Occhio di cubia', testo: 'Nel mascone: l\'alloggio dell\'ancora, da cui poi potrà scendere verso il mare. {{slide 13}}', fa: () => [fiancata(0.84, 0.87, 7.2, 8.2, 1), fiancata(0.84, 0.87, 7.2, 8.2, -1)], theta: 1.0 },
    { id: 'bulbo', nome: 'Bulbo', testo: 'Il bulbo, a prua, sotto il galleggiamento. {{slide 13}}', fa: () => [new THREE.SphereGeometry(1.06, 16, 10).scale(3.4, 1.3, 1.2).translate(ascissa(1, 2.6) - 0.6, 2.6, 0)], theta: 0.9, phi: 1.5 },
    { id: 'ponte', nome: 'Ponte principale', testo: 'Il ponte principale (*main deck*) delimita superiormente lo scafo. {{slide 17}}', fa: () => [ponte()], theta: 0.7, phi: 0.75 },
    { id: 'fondo', nome: 'Fondo', testo: 'Il fondo (*bottom*) delimita inferiormente lo scafo. {{slide 17}}', fa: () => [fiancata(0.2, 0.92, 0, 0.5, 1), fiancata(0.2, 0.92, 0, 0.5, -1)], theta: 0.5, phi: 1.5 },
    { id: 'ginocchio', nome: 'Ginocchio', testo: 'Il ginocchio (*turn of the bilge*): le strutture curve che collegano fondo e fianchi. {{slide 17}}', fa: () => [fiancata(0.2, 0.9, 0.5, 2.6, 1), fiancata(0.2, 0.9, 0.5, 2.6, -1)], theta: 0.5, phi: 1.5 },
    { id: 'fianchi', nome: 'Fianchi', testo: 'I fianchi (*side*) delimitano lateralmente lo scafo. Le parti emerse si dicono **murate** (*topside*). {{slide 17}}', fa: () => [fiancata(0, 1, 2.6, 11, 1), fiancata(0, 1, 2.6, 11, -1)], theta: 0.4 },
    { id: 'castello', nome: 'Castello di prua', testo: 'Castello di prua (*forecastle*): sovrastruttura dall\'estrema prua verso poppa, per una percentuale limitata della lunghezza nave. {{slide 19}}', fa: () => [formaCastello()], theta: 0.9 },
    { id: 'cassero', nome: 'Cassero poppiero', testo: 'Cassero poppiero (*poop*): l\'equivalente del castello, ma a poppa. {{slide 19}}', fa: () => [new THREE.BoxGeometry(16.6, 2.7, 11.4).translate(9.75, 9.1, 0)], theta: -0.5 },
  ];

  function formaCastello() {
    const u0 = 0.82; const ALTO = 2.2;
    const g = griglia(20, 12, (a, b) => {
      const u = u0 + a * (1 - u0); const y = insellatura(u);
      // Prima la fiancata che sale, poi il ponte del castello fino al centro
      const fiancata = b < 0.5;
      const quota = fiancata ? b * 2 * ALTO : ALTO;
      const z = mezza(u, y) * (fiancata ? 1 : 2 - b * 2);
      return [ascissa(u, y), y + quota, z];
    });
    return g;
  }

  const s = { parte: null, sbanda: -1, t: 0 };

  /* Il modello ---------------------------------------------------------------- */
  const matLuce = () => new THREE.MeshBasicMaterial({ color: COL.ocra, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const luci = [];

  function nave(k) {
    const g = new THREE.Group();
    g.add(Scafo.crea(k));
    // Castello di prua
    [1, -1].forEach((lato) => {
      const c = new THREE.Mesh(formaCastello(), new THREE.MeshBasicMaterial({ color: COL.scafo, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
      c.scale.z = lato;
      g.add(c);
      const orlo = [];
      for (let i = 0; i <= 12; i++) { const u = 0.82 + (i / 12) * 0.18; const y = insellatura(u); orlo.push(new THREE.Vector3(ascissa(u, y), y + 2.2, lato * mezza(u, y))); }
      g.add(tratto(orlo, 0.04 * k));
    });
    const bulbo = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshBasicMaterial({ color: COL.scafo }));
    bulbo.scale.set(3.4, 1.3, 1.2); bulbo.position.set(ascissa(1, 2.6) - 0.6, 2.6, 0);
    g.add(bulbo);
    PARTI.forEach((p) => {
      const gr = new THREE.Group();
      p.fa().forEach((geo) => {
        const m = new THREE.Mesh(geo, matLuce());
        gr.add(m);
        if (p.id === 'castello') { const m2 = m.clone(); m2.scale.z = -1; gr.add(m2); }
      });
      gr.visible = false;
      g.add(gr);
      luci.push({ id: p.id, gr });
    });
    g.position.y = -Y_ACQUA;
    const perno = new THREE.Group(); // il rollio avviene attorno alla linea d'acqua, asse x
    perno.add(g);
    return perno;
  }

  const VISTA = () => ({ target: new THREE.Vector3(45, 2, 0), theta: 0.6, phi: 1.3, r: 112 });
  let mondo = null;

  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    const grande = nave(1);
    radice.add(grande);
    const acqua = new THREE.Mesh(new THREE.CircleGeometry(420, 72), new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }));
    acqua.rotation.x = -Math.PI / 2; acqua.position.set(45, 0, 0);
    radice.add(acqua);
    const griglia3 = new THREE.GridHelper(640, 64, COL.medio, COL.medio);
    griglia3.material.transparent = true; griglia3.material.opacity = 0.28;
    griglia3.position.set(45, 0.01, 0);
    radice.add(griglia3);
    const nomi = [['prua', 103, 8, 0], ['poppa', -8, 11, 0], ['dritta', 45, 16, 16], ['sinistra', 45, 16, -16]];
    nomi.forEach(([t, x, y, z]) => { const e = etichetta(t, 5); e.position.set(x, y, z); radice.add(e); });

    // In scala vera si cammina da prua a poppa: le pedane stanno anche in coperta
    const inCoperta = (x, nome) => {
      const u = x / L; const y = insellatura(u) + 0.25;
      const p = pedana(x, 0, nome); p.position.y = y - 0.15; p.scale.set(0.5, 1, 0.8);
      return { pedana: p, pos: new THREE.Vector3(x, y, 0), yaw: -Math.PI / 2 };
    };
    const stazioni = [
      { pedana: pedana(45, 26, 'a dritta'), pos: new THREE.Vector3(45, 0.25, 26), yaw: 0 },
      inCoperta(72, 'in coperta a prua'),
      inCoperta(23, 'in coperta a poppa'),
      { pedana: pedana(-26, 0, 'a poppa'), pos: new THREE.Vector3(-26, 0.25, 0), yaw: -Math.PI / 2 },
    ];
    stazioni.forEach((st) => { st.pedana.visible = false; });

    const SC = 0.012; const mini = new THREE.Group();
    const piccola = nave(7);
    mini.add(piccola);
    const vasca = new THREE.Mesh(new THREE.CircleGeometry(58, 64), new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
    vasca.rotation.x = -Math.PI / 2; vasca.position.set(45, 0, 0);
    mini.add(vasca);
    const bordo = new THREE.Mesh(new THREE.RingGeometry(57.2, 58, 64), new THREE.MeshBasicMaterial({ color: COL.acqua, side: THREE.DoubleSide }));
    bordo.rotation.x = -Math.PI / 2; bordo.position.set(45, 0.02, 0);
    mini.add(bordo);
    [['prua', 101, 9, 0], ['poppa', -8, 15, 0], ['dritta', 45, 16, 26]].forEach(([t, x, y, z]) => { const e = etichetta(t, 7); e.position.set(x, y, z); mini.add(e); });
    mini.scale.setScalar(SC); mini.position.set(-45 * SC, 0, 0);

    mondo = {
      radice, stazioni, modellino: mini, vistaIniziale: VISTA,
      frame(dt) {
        if (s.sbanda < 0) return false;
        // A grandezza vera niente rollio: farebbe girare la testa a chi sta in coperta
        if (Motore.presente() && Motore.scalaVera()) { s.sbanda = -1; grande.rotation.x = 0; piccola.rotation.x = 0; return true; }
        // Oscillazione schematica: ritorno lento alla posizione di equilibrio, senza dati
        s.t += dt;
        const a = 0.32 * Math.exp(-0.35 * s.t) * Math.cos(1.1 * s.t);
        grande.rotation.x = a; piccola.rotation.x = a;
        if (s.t > 9) { s.sbanda = -1; grande.rotation.x = 0; piccola.rotation.x = 0; }
        return true;
      },
    };
    return mondo;
  }

  function scegli(id) {
    s.parte = id;
    luci.forEach((l) => { l.gr.visible = l.id === id; });
    const p = PARTI.find((x) => x.id === id);
    Motore.vista({ theta: p.theta, phi: p.phi || 1.3 });
    const visto = (lista) => lista.every((x) => viste.has(x));
    viste.add(id);
    if (visto(['prua', 'poppa', 'dritta', 'sinistra'])) lez.completa('lati');
    if (visto(['mascone', 'giardinetto', 'viva', 'morta'])) lez.completa('zone');
  }
  const viste = new Set();

  function comandi(id) {
    if (id.startsWith('n:')) scegli(id.slice(2));
    if (id === 'sbanda') { s.sbanda = 1; s.t = 0; lez.completa('sbanda'); }
  }

  function righeParti() {
    const out = [];
    for (let i = 0; i < PARTI.length; i += 3) {
      out.push({ t: 'bottoni', h: 72, size: 28, lista: PARTI.slice(i, i + 3).map((p) => ({ id: `n:${p.id}`, testo: p.nome, on: s.parte === p.id })) });
    }
    return out;
  }

  // Sezione maestra con le tre qualità essenziali, ridisegnata
  function schemaQualita(c, x, y, w, h) {
    const cx = x + w / 2; const top = y + 60;
    c.strokeStyle = C.ink; c.lineWidth = 6; c.lineJoin = 'round'; c.beginPath();
    c.moveTo(cx - 330, top + 80); c.lineTo(cx + 370, top + 40); c.lineTo(cx + 310, top + 230);
    c.quadraticCurveTo(cx + 300, top + 260, cx + 260, top + 260); c.lineTo(cx - 280, top + 260);
    c.quadraticCurveTo(cx - 320, top + 260, cx - 330, top + 80); c.stroke();
    c.lineWidth = 4; c.strokeRect(cx - 280, top - 20, 150, 94); c.strokeRect(cx - 245, top - 80, 80, 60);
    c.strokeStyle = C.acqua; c.lineWidth = 5; c.beginPath(); c.moveTo(x, top + 180); c.lineTo(x + w, top + 180); c.stroke();
    c.fillStyle = 'rgba(46,125,181,0.18)'; c.fillRect(x, top + 180, w, h - 240);
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const parte = PARTI.find((x) => x.id === s.parte);
    const vr = Motore.presente();
    const RISPOSTE = { si: 'Sì, torna dritta', no: 'No, resta inclinata', mare: 'Solo se il mare la raddrizza' };
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Che cos\'è una nave' },
          { t: 'p', testo: '«Per nave si intende qualsiasi costruzione destinata al trasporto per acqua, anche a scopo di rimorchio, di pesca, di diporto, o ad altro scopo.» {{Codice della Navigazione, art. 136}}' },
          { t: 'p', testo: 'Le navi **maggiori** sono abilitate alla navigazione d\'altura, oltre le 20 miglia nautiche dalla costa. Le navi **minori** navigano entro le 20 miglia. {{slide 3}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Le qualità essenziali' },
          { t: 'disegno', h: 350, fn: schemaQualita },
          { t: 'p', size: 38, testo: '**Galleggiabilità** (*buoyancy*): trovare un equilibrio alla traslazione verticale, in acqua, in posizione dritta. {{slide 6}}' },
          { t: 'p', size: 38, testo: '**Impermeabilità** (*impermeability*): resistere a ogni penetrazione dell\'acqua. {{slide 6}}' },
          { t: 'p', size: 38, testo: '**Robustezza** (*strength*): fronteggiare le sollecitazioni. {{slide 6}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Un\'onda sbanda la nave: ora è inclinata su un lato.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Una nave sbandata torna dritta da sola?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:si', testo: 'Sì, torna dritta', on: p === 'si' },
          { t: 'scelta', id: 'p:no', testo: 'No, resta inclinata', on: p === 'no' },
          { t: 'scelta', id: 'p:mare', testo: 'Solo se il mare la raddrizza', on: p === 'mare' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          ...righeParti(),
          ...lez.missioni(),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 800,
            testo: !vr ? '' : Motore.scalaVera()
              ? 'Sei accanto alla nave. Punta una pedana e premi il grilletto: puoi salire in coperta.'
              : 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.',
          },
          ...(vr ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          { t: 'bottoni', h: 88, size: 36, lista: [{ id: 'sbanda', testo: 'Sbanda la nave', on: true, off: vr && Motore.scalaVera() }] },
          { t: 'riquadro', size: 36, testo: parte ? parte.testo : 'Tocca il nome di una parte: si colora sulla nave.' },
          { t: 'nota', testo: 'Disegno schematico' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'si' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'La nave oscilla da un lato all\'altro, sempre meno, poi torna dritta.' },
          { t: 'nota', testo: 'L\'oscillazione nel modello è schematica' },
        ],
        dx: [
          { t: 'titolo', testo: 'Sì, torna dritta' },
          { t: 'p', testo: 'È la **stabilità statica** (*static stability*): la capacità di una nave, in seguito a uno sbandamento, di ritornare nella posizione di equilibrio iniziale. {{slide 7}}' },
          { t: 'p', testo: 'La **dolcezza al rollio** o tenuta al mare (*seakeeping*) fa risultare dolci e moderati i moti oscillatori: lenti e con ampiezza non eccessiva. {{slide 7}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Le qualità nautiche' },
          { t: 'p', testo: '**Velocità** (*speed*): la rapidità con cui si muove un corpo, data dal rapporto tra lo spazio percorso e il tempo impiegato. Si misura in nodi. {{slide 8}}' },
          { t: 'p', testo: '**Manovrabilità** (*manoeuvrability*): evoluire facilmente in ogni condizione, in particolare in acque ristrette. {{slide 8}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: '**Stabilità di rotta** (*course stability*): seguire la traiettoria pianificata senza deviazioni, con il timone al centro. {{slide 8}}' },
          { t: 'riquadro', size: 40, testo: 'Le qualità nautiche sono cinque: stabilità statica, dolcezza al rollio, velocità, manovrabilità, stabilità di rotta. {{slide 5, 7, 8}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Lo scafo' },
          { t: 'tabella', col: [40, 60], size: 34, righe: [
            ['Parte', 'Inglese'],
            ['Dritta / sinistra', '*starboard / port*'],
            ['Mascone', '*starboard/port bow*'],
            ['Giardinetto', '*starboard/port quarter*'],
            ['Opera viva o carena', '*underwater body*'],
            ['Opera morta', '*upperworks*'],
            ['Ponte principale', '*main deck*'],
            ['Fondo', '*bottom*'],
            ['Fianchi', '*side*'],
            ['Ginocchio', '*turn of the bilge*'],
            ['Murate', '*topside*'],
          ] },
          { t: 'nota', testo: 'slide 10–17' },
        ],
        dx: [
          { t: 'titolo', testo: 'Le sovrastrutture' },
          { t: 'p', size: 38, testo: 'Sono qualsiasi elemento al di sopra del ponte di bordo libero, quello che limita superiormente la parte stagna della nave. {{slide 18}}' },
          { t: 'tabella', col: [40, 60], size: 34, righe: [
            ['Nome', 'Che cos\'è'],
            ['Cassero', 'si estende per tutta la larghezza, o quasi'],
            ['Tuga', 'occupa solo una piccola porzione della larghezza'],
            ['Castello di prua', '*forecastle*'],
            ['Cassero poppiero', '*poop*'],
            ['Cassero centrale', '*bridge*: interessa la parte centrale'],
            ['Sovrastruttura completa', '*full superstructure*: tutta la lunghezza nave'],
          ] },
          { t: 'nota', testo: 'slide 18–20' },
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
