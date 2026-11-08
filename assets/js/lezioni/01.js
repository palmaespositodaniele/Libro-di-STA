/* Lezione 1: generalità sul mezzo nave. Le slide non hanno numeri sulla nave disegnata:
   forma e oscillazione sono schematiche e non compaiono mai come dati */
(function () {
  const N = 1;
  const { COL, tratto, segmento, etichetta, pedana, maniglia, cuoci, compatta } = Tavola;
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

  const s = { parte: null, sopra: null, sbanda: -1, t: 0, a: 0, a0: 0.32 };
  // Con un clic sulla nave si prende la parte più precisa; cliccando di nuovo lo stesso punto le altre
  const ORDINE = ['cubia', 'bulbo', 'specchio', 'volta', 'mascone', 'giardinetto', 'castello', 'cassero', 'ponte', 'ginocchio', 'fondo', 'prua', 'poppa', 'viva', 'morta', 'dritta', 'sinistra', 'fianchi'];
  const toccabili = { schermo: [], mini: [] };
  const copieNave = [];

  /* Il modello ---------------------------------------------------------------- */
  const matLuce = () => new THREE.MeshBasicMaterial({ color: COL.ocra, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const luci = [];

  function nave(k) {
    const g = new THREE.Group();
    g.add(Scafo.crea(k));
    // Castello di prua
    [1, -1].forEach((lato) => {
      const c = new THREE.Mesh(Scafo.dipinto(formaCastello()), Scafo.vernice());
      c.scale.z = lato;
      g.add(c);
      const orlo = [];
      for (let i = 0; i <= 12; i++) { const u = 0.82 + (i / 12) * 0.18; const y = insellatura(u); orlo.push(new THREE.Vector3(ascissa(u, y), y + 2.2, lato * mezza(u, y))); }
      g.add(tratto(orlo, 0.04 * k));
    });
    const bulbo = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshBasicMaterial({ color: Scafo.TINTE.carena }));
    bulbo.scale.set(3.4, 1.3, 1.2); bulbo.position.set(ascissa(1, 2.6) - 0.6, 2.6, 0);
    g.add(bulbo);
    const dove = k > 1 ? 'mini' : 'schermo';
    PARTI.forEach((p) => {
      const gr = new THREE.Group();
      p.fa().forEach((geo) => {
        const m = new THREE.Mesh(geo, matLuce());
        m.userData.tocco = p.id; toccabili[dove].push(m);
        gr.add(m);
        if (p.id === 'castello') { const m2 = m.clone(); m2.scale.z = -1; m2.userData.tocco = p.id; toccabili[dove].push(m2); gr.add(m2); }
      });
      gr.visible = false;
      g.add(gr);
      luci.push({ id: p.id, gr });
    });
    const presa = maniglia(k > 1 ? 4 : 2.4, 'sbanda');
    presa.position.set(45, 21, 0); g.add(presa);
    presa.userData.vincolo = { giro: [1, 0, 0], centro: [0, 0, 0] }; // si inclina la nave attorno alla linea d'acqua
    toccabili[dove].push(presa);
    g.position.y = -Y_ACQUA;
    const perno = new THREE.Group(); // il rollio avviene attorno alla linea d'acqua, asse x
    perno.add(g);
    copieNave.push(perno);
    return perno;
  }
  function accendi() { luci.forEach((l) => { l.gr.visible = l.id === s.parte || l.id === s.sopra; }); }
  function candidati(ids) {
    const lista = ORDINE.filter((id) => ids.includes(id));
    // Il raggio attraversa la nave: conta il fianco che si vede
    if (lista.includes('dritta') && lista.includes('sinistra')) lista.splice(lista.indexOf(ids.indexOf('dritta') < ids.indexOf('sinistra') ? 'sinistra' : 'dritta'), 1);
    return lista;
  }
  const inclina = (a) => copieNave.forEach((p) => { p.rotation.x = a; });

  const VISTA = () => ({ target: new THREE.Vector3(45, 2, 0), theta: 0.6, phi: 1.3, r: 112 });
  let mondo = null;

  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    const grande = nave(1);
    radice.add(grande);
    radice.add(Scafo.mare());
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
      tocchi: (vista) => (vista === 'mini' ? toccabili.mini : vista === 'vera' ? toccabili.schermo.filter((o) => !o.userData.maniglia) : toccabili.schermo),
      sopra(ids) {
        const c = ids ? candidati(ids).filter((id) => id !== s.parte)[0] || null : null;
        if (c === s.sopra) return false;
        s.sopra = c; accendi();
        return true;
      },
      trascina(id, dx, dy, info) { s.sbanda = -1; s.a = Math.max(-0.35, Math.min(0.35, s.a + (info ? info.ang : dx * 0.0016))); inclina(s.a); },
      frame(dt) {
        if (s.sbanda < 0) return false;
        // A grandezza vera niente rollio: farebbe girare la testa a chi sta in coperta
        if (Motore.presente() && Motore.scalaVera()) { s.sbanda = -1; s.a = 0; inclina(0); return true; }
        // Oscillazione schematica: ritorno lento alla posizione di equilibrio, senza dati
        s.t += dt;
        inclina(s.a0 * Math.exp(-0.35 * s.t) * Math.cos(1.1 * s.t));
        if (s.t > 9) { s.sbanda = -1; s.a = 0; inclina(0); }
        return true;
      },
    };
    return mondo;
  }

  function scegli(id, gira = true) {
    s.parte = id; s.sopra = null;
    accendi();
    const p = PARTI.find((x) => x.id === id);
    if (gira) Motore.vista({ theta: p.theta, phi: p.phi || 1.3 });
    const visto = (lista) => lista.every((x) => viste.has(x));
    viste.add(id);
    if (visto(['prua', 'poppa', 'dritta', 'sinistra'])) lez.completa('lati');
    if (visto(['mascone', 'giardinetto', 'viva', 'morta'])) lez.completa('zone');
  }
  const viste = new Set();

  function comandi(id) {
    if (id.startsWith('n:')) scegli(id.slice(2));
    if (id.startsWith('t:')) {
      const lista = candidati(id.slice(2).split(','));
      if (lista.length) scegli(lista[(lista.indexOf(s.parte) + 1) % lista.length], false);
    }
    if (id === 'sbanda') { s.a0 = 0.32; s.sbanda = 1; s.t = 0; lez.completa('sbanda'); }
    if (id === 'lascia:sbanda') {
      if (Math.abs(s.a) > 0.03) { s.a0 = s.a; s.sbanda = 1; s.t = 0; lez.completa('sbanda'); }
      s.a = 0;
    }
  }

  /* Seconda simulazione: quanto lontano dalla costa. 20 miglia dalla slide 3, il resto è schematico */
  const NM = 4; const LIMITE = 20;
  const c1 = { dist: 8, tipo: 'minore', navi: [], prese: { schermo: [], mini: [] } };
  function posaCosta() {
    const sc = c1.tipo === 'minore' ? 0.22 : 0.38;
    c1.navi.forEach((n) => { n.position.x = c1.dist * NM; n.children[0].scale.setScalar(sc); n.children[0].position.set((-L / 2) * sc, -Y_ACQUA * sc, 0); });
  }
  function costa(k) {
    const g = new THREE.Group();
    const terra = new THREE.Mesh(cuoci(new THREE.BoxGeometry(90, 2.2, 300), (x, y) => (y > 0 ? '#8FA36E' : '#7C8F5E')), new THREE.MeshBasicMaterial({ vertexColors: true }));
    terra.position.set(-47, 1, 0); g.add(terra);
    const spiaggia = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 300), new THREE.MeshBasicMaterial({ color: 0xE3D4A4 }));
    spiaggia.position.set(-2, 0.3, 0); g.add(spiaggia);
    const faro = new THREE.Mesh(cuoci(new THREE.CylinderGeometry(1.2, 2, 16, 12), (x, y) => (Math.floor((y + 8) / 4) % 2 ? '#B3362B' : '#F4F0E6')), new THREE.MeshBasicMaterial({ vertexColors: true }));
    faro.position.set(-12, 9.5, -22); g.add(faro);
    const linea = new THREE.Group();
    for (let z = -110; z < 110; z += 12) linea.add(segmento(new THREE.Vector3(LIMITE * NM, 0.3, z), new THREE.Vector3(LIMITE * NM, 0.3, z + 7), 0.35 * Math.sqrt(k), COL.ocra));
    g.add(compatta(linea));
    const dim = k > 1 ? 9 : 6;
    const e = etichetta('20 miglia', dim, '#FBFAF4'); e.position.set(LIMITE * NM, 7, 30); g.add(e);
    const nome = etichetta('costa', dim, '#FBFAF4'); nome.position.set(-14, 7, 30); g.add(nome);
    const nave2 = new THREE.Group(); nave2.add(Scafo.crea(k > 1 ? 7 : 3)); g.add(nave2);
    const presa = maniglia(k > 1 ? 6 : 4, 'dist'); presa.position.set(0, k > 1 ? 17 : 14, 0); nave2.add(presa);
    presa.userData.vincolo = { asse: [1, 0, 0] }; // la nave si allontana dalla costa
    c1.navi.push(nave2); c1.prese[k > 1 ? 'mini' : 'schermo'].push(presa);
    return g;
  }
  let mondoCosta = null;
  function creaCosta() {
    if (mondoCosta) return mondoCosta;
    const radice = new THREE.Group(); radice.add(costa(1), Scafo.mare());
    const stazioni = [{ pedana: pedana(70, 62, 'in mare'), pos: new THREE.Vector3(70, 0.25, 62), yaw: 0 }];
    stazioni[0].pedana.visible = false;
    const SC = 0.0075; const mini = new THREE.Group();
    mini.add(costa(4), Scafo.vasca()); mini.scale.setScalar(SC); mini.position.set(-55 * SC, -0.03, 0);
    posaCosta();
    mondoCosta = {
      radice, stazioni, modellino: mini,
      vistaIniziale: () => ({ target: new THREE.Vector3(50, 2, 0), theta: 0, phi: 1.05, r: 150 }),
      tocchi: (vista) => c1.prese[vista === 'mini' ? 'mini' : 'schermo'],
      trascina(id, dx, dy, info) {
        const prima = Math.round(c1.dist);
        c1.dist = Math.max(1, Math.min(c1.tipo === 'minore' ? LIMITE : 34, c1.dist + (info ? info.s / NM : dx * 0.035)));
        posaCosta();
        if (Math.round(c1.dist) !== prima) Motore.ridisegna();
      },
      frame() { return false; },
    };
    return mondoCosta;
  }
  function comandiCosta(id) {
    if (id === 'tipo:minore' || id === 'tipo:maggiore') { c1.tipo = id.slice(5); c1.dist = Math.min(c1.dist, c1.tipo === 'minore' ? LIMITE : 34); posaCosta(); }
    Motore.sporco();
  }
  function letturaCosta() {
    const d = Math.round(c1.dist);
    if (c1.tipo === 'minore') return d >= LIMITE ? 'Nave minore a 20 miglia: più in là non può andare.' : `Nave minore a ${d} miglia dalla costa: qui può navigare.`;
    return d > LIMITE ? `Nave maggiore a ${d} miglia: è navigazione d'altura.` : `Nave maggiore a ${d} miglia dalla costa.`;
  }

  /* Terza simulazione: una sovrastruttura che si sposta e si allarga. Le soglie sono schematiche:
     le slide 18-20 danno i nomi, non le misure */
  const so = { x: 45, lun: 22, lar: 0.95, copie: [], prese: { schermo: [], mini: [] } };
  function nomeSovra() {
    if (so.lun >= 78) return ['Sovrastruttura completa', 'Interessa tutta la lunghezza nave (*full superstructure*).'];
    if (so.lar < 0.6) return ['Tuga', 'Occupa solo una piccola porzione della larghezza nave.'];
    if (so.x + so.lun / 2 > 84) return ['Castello di prua', 'Dall\'estrema prua verso poppa, per una parte limitata della lunghezza (*forecastle*).'];
    if (so.x - so.lun / 2 < 6) return ['Cassero poppiero', 'L\'equivalente del castello, ma a poppa (*poop*).'];
    return ['Cassero centrale', 'Si estende su tutta la larghezza e interessa la parte centrale (*bridge*).'];
  }
  function posaSovra() {
    const Y = insellatura(so.x / L) - Y_ACQUA + 1.3; const z = (so.lar * Scafo.B) / 2;
    so.copie.forEach((c) => {
      c.blocco.position.set(so.x, Y, 0); c.blocco.scale.set(so.lun, 2.6, 2 * z);
      c.pos.position.set(so.x, Y + 3.4, 0); c.lun.position.set(so.x + so.lun / 2 + 1.5, Y, 0); c.lar.position.set(so.x, Y, z + 1.8);
    });
  }
  function sovra(k) {
    const g = new THREE.Group();
    const nave2 = Scafo.crea(k, true); nave2.position.y = -Y_ACQUA; g.add(nave2);
    const blocco = new THREE.Mesh(cuoci(new THREE.BoxGeometry(1, 1, 1), '#F4F0E6'), new THREE.MeshBasicMaterial({ vertexColors: true })); g.add(blocco);
    const r = k > 1 ? 3 : 1.5; const pos = maniglia(r, 'pos'); const lun = maniglia(r, 'lun'); const lar = maniglia(r, 'lar');
    g.add(pos, lun, lar);
    pos.userData.vincolo = { asse: [1, 0, 0] }; lun.userData.vincolo = { asse: [1, 0, 0] }; lar.userData.vincolo = { asse: [0, 0, 1] };
    so.copie.push({ blocco, pos, lun, lar }); so.prese[k > 1 ? 'mini' : 'schermo'].push(pos, lun, lar);
    return g;
  }
  let mondoSovra = null;
  function creaSovra() {
    if (mondoSovra) return mondoSovra;
    const radice = new THREE.Group(); radice.add(sovra(1), Scafo.mare());
    [['prua', 84, 12, 0], ['poppa', 6, 12, 0]].forEach(([t, x, y, z]) => { const e = etichetta(t, 4, '#FBFAF4'); e.position.set(x, y, z); radice.add(e); });
    const stazioni = [{ pedana: pedana(45, 26, 'a dritta'), pos: new THREE.Vector3(45, 0.25, 26), yaw: 0 }];
    stazioni[0].pedana.visible = false;
    const SC = 0.012; const mini = new THREE.Group();
    mini.add(sovra(5), Scafo.vasca()); mini.scale.setScalar(SC); mini.position.set(-45 * SC, 0.02, 0);
    posaSovra();
    mondoSovra = {
      radice, stazioni, modellino: mini,
      vistaIniziale: () => ({ target: new THREE.Vector3(45, 2, 0), theta: 0.35, phi: 1.12, r: 112 }),
      tocchi: (vista) => so.prese[vista === 'mini' ? 'mini' : 'schermo'],
      trascina(id, dx, dy, info) {
        const prima = nomeSovra()[0];
        // Le sfere stanno sul blocco: al centro lo spostano, in testa lo allungano, sul fianco lo allargano
        const s1 = info ? info.s : 0;
        if (id === 'pos') so.x += info ? s1 : dx * 0.09;
        if (id === 'lun') so.lun = Math.max(6, Math.min(L, so.lun + (info ? 2 * s1 : dx * 0.12)));
        if (id === 'lar') so.lar = Math.max(0.2, Math.min(1, so.lar + (info ? (2 * s1) / Scafo.B : -dy * 0.003)));
        so.x = Math.max(so.lun / 2, Math.min(L - so.lun / 2, so.x));
        posaSovra();
        if (nomeSovra()[0] !== prima) Motore.ridisegna();
      },
      frame() { return false; },
    };
    return mondoSovra;
  }
  const bottoneScala = (vr) => (vr ? [{ t: 'bottoni', h: 80, size: 34, lista: [{ id: 'vr:scala', testo: Motore.scalaVera() ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []);
  const SUL_MODELLO = 'Punta la sfera d\'oro, tieni premuto il grilletto e muovi la mano.';

  function righeParti() {
    const out = [];
    for (let i = 0; i < PARTI.length; i += 3) {
      out.push({ t: 'bottoni', h: 72, size: 32, lista: PARTI.slice(i, i + 3).map((p) => ({ id: `n:${p.id}`, testo: p.nome, on: s.parte === p.id })) });
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
        passo: 0, mondo: creaCosta, azione: comandiCosta,
        sx: [
          { t: 'titolo', testo: 'Che cos\'è una nave' },
          { t: 'p', testo: '«Per nave si intende qualsiasi costruzione destinata al trasporto per acqua, anche a scopo di rimorchio, di pesca, di diporto, o ad altro scopo.» {{Codice della Navigazione, art. 136}}' },
          { t: 'p', testo: 'Le navi **maggiori** sono abilitate alla navigazione d\'altura, oltre le 20 miglia nautiche dalla costa. Le navi **minori** navigano entro le 20 miglia. {{slide 3}}' },
        ],
        dx: [
          { t: 'zona', id: 'finestra', h: 640, testo: !vr ? '' : Motore.scalaVera() ? 'Sei sul mare: guarda la nave rispetto alla linea delle 20 miglia.' : SUL_MODELLO },
          ...bottoneScala(vr),
          { t: 'bottoni', h: 84, size: 34, lista: [{ id: 'tipo:minore', testo: 'Nave minore', on: c1.tipo === 'minore' }, { id: 'tipo:maggiore', testo: 'Nave maggiore', on: c1.tipo === 'maggiore' }] },
          { t: 'riquadro', size: 36, testo: letturaCosta() },
          { t: 'nota', testo: 'Trascina la sfera d\'oro: porta la nave al largo. Disegno schematico.' },
        ],
      },
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Le tre qualità' },
          { t: 'p', testo: 'Una nave, per essere tale, deve avere tre qualità essenziali. {{slide 6}}' },
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
              : 'Punta la nave: tocca una parte per il nome, tieni premuto per girarla. Tira la sfera d\'oro per sbandarla.',
          },
          ...bottoneScala(vr),
          { t: 'riquadro', size: 36, testo: parte ? parte.testo : 'Tocca la nave o un nome: la parte si colora.' },
          { t: 'nota', testo: 'Tocca due volte lo stesso punto: una zona ha più nomi. Inclina la nave con la sfera d\'oro e lasciala andare. Disegno schematico.' },
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
        passo: 3, mondo: creaSovra,
        sx: [
          { t: 'titolo', testo: 'Costruisci la sovrastruttura' },
          { t: 'p', size: 38, testo: 'Sposta, allunga e allarga il blocco sulla coperta: il nome cambia con la forma. {{slide 18–20}}' },
          { t: 'riquadro', size: 40, testo: `**${nomeSovra()[0]}.** ${nomeSovra()[1]}` },
          { t: 'nota', testo: 'Tre sfere d\'oro: sopra sposta, in punta allunga, sul fianco allarga. Le soglie sono schematiche: le slide danno i nomi, non le misure.' },
        ],
        dx: [
          { t: 'zona', id: 'finestra', h: 760, testo: !vr ? '' : Motore.scalaVera() ? 'Sei accanto alla nave.' : SUL_MODELLO },
          ...bottoneScala(vr),
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
