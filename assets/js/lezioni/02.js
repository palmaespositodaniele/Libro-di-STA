/* Lezione 2: categorie di navi. Definizioni, limiti e formula HSC dalle slide 2-21.
   La quota di spinta idrodinamica nel modello è schematica; il limite HSC è quello della slide 5 */
(function () {
  const N = 2;
  const { COL, etichetta, maniglia, cuoci, segmento } = Tavola;

  const MISSIONI = [
    { id: 'hsc', testo: 'Accelera fino a superare il limite HSC.' },
    { id: 'planante', testo: 'Accelera ancora: la spinta idrodinamica diventa prevalente.' },
    { id: 'misure', testo: 'In vasca, registra cinque misure a velocità diverse.' },
    { id: 'pari', testo: 'Registra la velocità in cui le due spinte si equivalgono.' },
    { id: 'carte', testo: 'Metti ogni nave nella categoria giusta.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'In quanti elementi caratterizzanti si classificano le navi?', scelte: ['2', '4', '6'], giusta: 1, perche: 'Sostentamento, estensione della navigazione, propulsione, servizio.' },
    { n: 2, testo: 'Una carena è dislocante se la galleggiabilità è assicurata…', scelte: ['Dalla sola spinta idrostatica', 'Dalla spinta idrodinamica', 'Dalle ali'], giusta: 0, perche: 'Esclusivamente dalla spinta idrostatica di carena: Δ = ρ · ∇.' },
    { n: 3, testo: 'La navigazione internazionale breve è a non più di…', scelte: ['20 miglia dalla costa', '200 miglia da un porto sicuro', '6 miglia dalla costa'], giusta: 1, perche: 'A non più di 200 miglia nautiche da un porto sicuro.' },
    { n: 4, testo: 'Una motonave ha il propulsore mosso da…', scelte: ['Turbine a vapore', 'Motori a combustione interna', 'Sole vele'], giusta: 1, perche: 'Motori a combustione interna.' },
    { n: 5, testo: 'Una nave passeggeri trasporta più di…', scelte: ['12 persone oltre l\'equipaggio', '50 persone', '100 persone'], giusta: 0, perche: 'Più di 12 persone oltre l\'equipaggio.' },
    { n: 6, testo: 'Un\'imbarcazione da diporto ha lo scafo lungo…', scelte: ['Meno di 10 m', 'Tra 10 e 24 m', 'Più di 24 m'], giusta: 1, perche: '10 m < L < 24 m.' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });
  const Y_ACQUA = 6;
  const num = (v, d = 1) => v.toFixed(d).replace('.', ',');

  /* Simulazione 1: dislocante, veloce, planante (slide 3-6) ------------------------------------ */
  const DISLOCAMENTI = [100, 500, 1000, 5000, 20000]; // scelti qui per provare la formula della slide 5
  const so = { v: 0, d: 2, copie: [] };
  const limiteHSC = () => 7.16 * DISLOCAMENTI[so.d] ** (1 / 6);
  // Quota della spinta idrodinamica: cresce col quadrato di v, schematica
  const quota = (v) => Math.min(0.85, 0.3 * (v / limiteHSC()) ** 2);
  const quotaS = () => quota(so.v);
  function statoCarena() {
    if (so.v < limiteHSC()) return ['Carena dislocante', 'la spinta idrodinamica è ancora poca.'];
    if (quotaS() <= 0.5) return ['Nave veloce (HSC)', 'componente idrodinamica significativa, ma minore di quella idrostatica.'];
    return ['Carena planante', 'la spinta idrodinamica è prevalente su quella idrostatica.'];
  }
  function posaCarena() {
    const f = quotaS();
    so.copie.forEach((c) => {
      c.nave.position.y = f * 4.2; c.nave.rotation.z = f * 0.07;
      c.idro.scale.y = Math.max(0.01, (1 - f) * 22); c.idro.position.y = c.idro.scale.y / 2;
      c.dina.scale.y = Math.max(0.01, f * 22); c.dina.position.y = c.idro.scale.y + c.dina.scale.y / 2;
    });
  }
  const creaCarena = Lezione.simula({
    scala: 0.0095, centro: [45, 2], k: 5, pedana: [45, 34, 'di fianco'], dopo: posaCarena,
    vista: () => ({ target: new THREE.Vector3(36, 9, 0), theta: 0.1, phi: 1.36, r: 158 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const dim = 3 + k * 0.5;
      const perno = new THREE.Group(); perno.position.set(45, 0, 0);
      const nave = new THREE.Group(); const sc = Scafo.crea(k); sc.position.set(-45, -Y_ACQUA, 0); nave.add(sc); perno.add(nave); g.add(perno);
      const bar = (col) => new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), new THREE.MeshBasicMaterial({ color: col }));
      const colonna = new THREE.Group(); colonna.position.set(-16, 0, 0);
      const idro = bar(COL.acqua); const dina = bar(COL.ocra); colonna.add(idro, dina); g.add(colonna);
      const e1 = etichetta('idrostatica', dim, '#FBFAF4'); e1.position.set(-16, 26, 6); g.add(e1);
      const e2 = etichetta('idrodinamica', dim, '#8C7020'); e2.position.set(-16, 30, 6); g.add(e2);
      so.copie.push({ nave: perno, idro, dina });
      return g;
    },
  });
  function comandiCarena(id) {
    const v = Lezione.letto(id, 'v', 0, 60, 1);
    if (typeof v === 'number') {
      so.v = v;
      if (so.v >= limiteHSC()) lez.completa('hsc');
      if (quotaS() > 0.5) lez.completa('planante');
    }
    if (id === 'd+') so.d = Math.min(DISLOCAMENTI.length - 1, so.d + 1);
    if (id === 'd-') so.d = Math.max(0, so.d - 1);
    posaCarena(); Motore.sporco();
  }

  /* Simulazione 1b: in laboratorio, la vasca navale (slide 3-6). Il carro traina il modello e il
     dinamometro divide Δ = ρ · ∇(v) + S(v) nelle due spinte. Stessa quota schematica della simulazione 1 */
  const va = { v: 0, misure: [], copie: [], scia: 0 };
  const VMAX = 60;
  const BOX = (w, h, d, col, x, y, z) => { const m = new THREE.Mesh(cuoci(new THREE.BoxGeometry(w, h, d), col), new THREE.MeshBasicMaterial({ vertexColors: true })); m.position.set(x, y, z); return m; };
  const vetro = (w, h, d, col, op, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false })); m.position.set(x, y, z); return m; };
  const pc = (f) => `${Math.round(f * 100)}%`;
  function posaVasca() {
    const f = quota(va.v);
    va.copie.forEach((c) => {
      c.nave.position.y = f * 4.2; c.nave.rotation.z = f * 0.07;
      c.idro.scale.y = Math.max(0.01, (1 - f) * 22); c.idro.position.y = c.idro.scale.y / 2;
      c.dina.scale.y = Math.max(0.01, f * 22); c.dina.position.y = c.idro.scale.y + c.dina.scale.y / 2;
      c.prua.forEach((o) => { o.scale.set(0.2 + (va.v / VMAX) * 1.6, 1, 0.2 + (va.v / VMAX) * 2.2); o.visible = va.v > 0.5; });
    });
  }
  const creaVasca = Lezione.simula({
    scala: 0.006, centro: [45, 4], k: 5, mare: false, pedana: [45, 70, 'sul bordo della vasca'], dopo: posaVasca,
    vista: () => ({ target: new THREE.Vector3(45, 18, 0), theta: 0.3, phi: 1.24, r: 175 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const dim = 5 + k * 0.6;
      // Vasca: fondo, parete di fondo, parete di vetro verso chi guarda, acqua
      g.add(BOX(270, 2, 74, '#5B6B7C', 45, -25, 0), BOX(270, 30, 2, '#D8E0EC', 45, -9, -37));
      g.add(vetro(270, 30, 1, 0x9FC3D6, 0.16, 45, -9, 37), vetro(270, 24, 72, 0x2E7DB5, 0.3, 45, -12, 0));
      const pelo = new THREE.Mesh(new THREE.PlaneGeometry(270, 72), new THREE.MeshBasicMaterial({ color: 0x5FA3CF, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }));
      pelo.rotation.x = -Math.PI / 2; pelo.position.set(45, 0, 0); g.add(pelo);
      // Rotaie del carro e tacche che scorrono: il carro resta in vista, è la vasca a scorrere
      [-37, 37].forEach((z) => g.add(BOX(270, 1.4, 2.4, '#1F2A37', 45, 6.7, z), BOX(270, 0.6, 2, '#C5CBD3', 45, 6, z)));
      const tacche = [];
      for (let i = 0; i < 14; i++) [-37, 37].forEach((z) => { const t = BOX(1.2, 1.6, 3, i % 5 ? '#C9A227' : '#B3362B', -88 + i * 20, 7.6, z); g.add(t); tacche.push(t); });
      // Carro dinamometrico
      g.add(BOX(16, 5, 80, '#13315C', 45, 32, 0));
      [-37, 37].forEach((z) => g.add(BOX(5, 24, 5, '#13315C', 45, 19, z)));
      g.add(BOX(8, 6, 8, '#C9A227', 45, 26.5, 0));
      // Modello trainato: il dinamometro tiene l'asta, la carena si alza con la velocità
      const perno = new THREE.Group(); perno.position.set(45, 0, 0);
      const nave = new THREE.Group(); const sc = Scafo.crea(k, true); sc.position.set(-45, -Y_ACQUA, 0); nave.add(sc);
      nave.add(segmento(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 26, 0), 0.5 * Math.sqrt(k), COL.inchiostro));
      perno.add(nave); g.add(perno);
      // Onda di prua: cresce con la velocità
      const prua = [1, -1].map((lato) => {
        const o = new THREE.Mesh(new THREE.ConeGeometry(4, 2.4, 3), new THREE.MeshBasicMaterial({ color: 0xFBFAF4, transparent: true, opacity: 0.85 }));
        o.rotation.z = -Math.PI / 2; o.position.set(90, 0.6, lato * 5); g.add(o); return o;
      });
      // Scia: creste che scorrono verso poppa
      const creste = [];
      for (let i = 0; i < 7; i++) { const c = vetro(1.4, 0.5, 30, 0xFBFAF4, 0.8, 0, 0.3, 0); g.add(c); creste.push(c); }
      // Dinamometro: le due spinte, sempre a somma Δ
      const colonna = new THREE.Group(); colonna.position.set(45, 34.5, -30);
      const bar = (col) => new THREE.Mesh(new THREE.BoxGeometry(6, 1, 6), new THREE.MeshBasicMaterial({ color: col }));
      const idro = bar(COL.acqua); const dina = bar(COL.ocra); colonna.add(idro, dina); g.add(colonna);
      const e0 = etichetta('Δ', dim + 1, '#0B2545'); e0.position.set(45, 61, -30); g.add(e0);
      const e1 = etichetta('idrostatica ρ·∇', dim, '#0B2545'); e1.position.set(82, 40, -30); g.add(e1);
      const e2 = etichetta('idrodinamica S', dim, '#8C7020'); e2.position.set(82, 52, -30); g.add(e2);
      va.copie.push({ nave: perno, idro, dina, prua, tacche, creste });
      return g;
    },
    frame(dt) {
      if (va.v < 0.5 && va.scia <= 0) return false;
      const passo = va.v * dt * 1.6;
      va.scia = va.v > 0.5 ? 1 : Math.max(0, va.scia - dt);
      va.copie.forEach((c) => {
        c.tacche.forEach((t) => { t.position.x -= passo; if (t.position.x < -88) t.position.x += 280; });
        c.creste.forEach((o, i) => {
          const u = ((performance.now() / 1000) * (0.25 + va.v / VMAX) + i / c.creste.length) % 1;
          o.position.x = -2 - u * 80; o.scale.set(1, 1, 0.3 + u * 1.6);
          o.material.opacity = va.scia * (va.v / VMAX) * 0.9 * (1 - u);
        });
      });
      return true;
    },
  });
  function comandiVasca(id) {
    if (id === 'd+' || id === 'd-') { comandiCarena(id); va.misure = []; }
    const v = Lezione.letto(id, 'v', 0, VMAX, 1);
    if (typeof v === 'number') va.v = v;
    if (id === 'svuota') va.misure = [];
    if (id === 'registra') {
      const v = Math.round(va.v);
      va.misure = va.misure.filter((m) => m.v !== v).concat([{ v, q: quota(v) }]).sort((a, b) => a.v - b.v);
      if (va.misure.length >= 5) lez.completa('misure');
      if (va.misure.some((m) => Math.abs(m.q - 0.5) <= 0.03)) lez.completa('pari');
    }
    posaVasca(); Motore.sporco();
  }
  // Grafico delle misure: le due spinte in percentuale di Δ, al variare della velocità
  function grafico(c, x, y, w, h) {
    const { C, font } = Pagina;
    const ox = x + 70; const oy = y + h - 50; const gw = w - 90; const gh = h - 100;
    const X = (v) => ox + (v / VMAX) * gw; const Y = (f) => oy - f * gh;
    c.strokeStyle = C.ink2; c.lineWidth = 2; c.strokeRect(ox, oy - gh, gw, gh);
    c.font = font('n', 32); c.fillStyle = C.ink2; c.textAlign = 'right';
    [0, 50, 100].forEach((p) => c.fillText(`${p}%`, ox - 10, Y(p / 100) + 9));
    c.textAlign = 'center';
    [0, 20, 40].forEach((v) => c.fillText(String(v), X(v), oy + 34));
    c.textAlign = 'right'; c.fillText('60 kn', X(60), oy + 34); c.textAlign = 'center';
    c.setLineDash([10, 8]); c.strokeStyle = C.ink2;
    c.beginPath(); c.moveTo(ox, Y(0.5)); c.lineTo(ox + gw, Y(0.5)); c.stroke();
    const vh = limiteHSC();
    if (vh <= VMAX) { c.strokeStyle = C.rosso; c.beginPath(); c.moveTo(X(vh), oy); c.lineTo(X(vh), oy - gh); c.stroke(); c.fillStyle = C.rosso; c.textAlign = 'left'; c.fillText('HSC', X(vh) + 8, oy - gh + 30); c.textAlign = 'center'; }
    c.setLineDash([]);
    [[(m) => 1 - m.q, C.acqua], [(m) => m.q, C.ocra]].forEach(([val, col]) => {
      c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 4;
      c.beginPath(); va.misure.forEach((m, i) => { if (i) c.lineTo(X(m.v), Y(val(m))); else c.moveTo(X(m.v), Y(val(m))); }); c.stroke();
      va.misure.forEach((m) => { c.beginPath(); c.arc(X(m.v), Y(val(m)), 9, 0, Math.PI * 2); c.fill(); });
    });
    c.textAlign = 'left'; c.font = font('b', 32);
    c.fillStyle = C.acqua; c.fillText('● idrostatica', ox, y + 26);
    c.fillStyle = C.ocraT; c.fillText('● idrodinamica', ox + 250, y + 26);
    if (!va.misure.length) { c.fillStyle = C.ink2; c.font = font('n', 32); c.textAlign = 'center'; c.fillText('Nessuna misura registrata', ox + gw / 2, Y(0.75)); c.textAlign = 'left'; }
  }

  /* Simulazione 2: in quale categoria? -------------------------------------------------------- */
  const CESTE = [['p', 'Passeggeri'], ['c', 'Da carico'], ['s', 'Speciali'], ['m', 'Militari'], ['d', 'Diporto']];
  const CARTE = [
    ['Traghetto', 'p', 'Trasporto misto di persone e mezzi su gomma.'],
    ['Portacontainer', 'c', 'Specializzata per una unità merceologica.'],
    ['Rimorchiatore', 's', 'Lo scopo non è il trasporto ma un\'attività in mare.'],
    ['Nave da guerra', 'm', 'Appartiene alle Forze armate di uno Stato.'],
    ['Natante', 'd', 'Unità a remi o con scafo fino a dieci metri.'],
    ['Petroliera', 'c', 'Specializzata per una unità merceologica.'],
    ['Rompighiaccio', 's', 'Lo scopo non è il trasporto ma un\'attività in mare.'],
    ['Nave da crociera', 'p', 'Trasporta più di 12 persone oltre l\'equipaggio.'],
  ];
  const ca = { i: 0, x: 0, z: 0, esito: null, copie: [] };
  const XC = (i) => -44 + i * 22;
  function posaCarta() {
    ca.copie.forEach((c) => {
      c.nomi.forEach((e, i) => { e.visible = i === ca.i; });
      c.barca.visible = ca.i < CARTE.length;
      c.barca.position.set(ca.x, 0, 14 + ca.z); c.presa.position.set(ca.x, 5, 14 + ca.z); c.presa.visible = ca.i < CARTE.length;
      c.fatte.forEach((m, i) => { m.visible = i < ca.i; });
    });
  }
  function assegna(id) {
    if (ca.i >= CARTE.length) return;
    const [nome, giusta, perche] = CARTE[ca.i];
    if (id === giusta) {
      ca.esito = { tipo: 'giusto', testo: `${nome}: ${perche}` };
      ca.i += 1;
      if (ca.i === CARTE.length) lez.completa('carte');
    } else ca.esito = { tipo: 'errato', testo: `${nome} non va lì: riprova.` };
    ca.x = 0; ca.z = 0; posaCarta();
  }
  const creaCarte = Lezione.simula({
    scala: 0.0105, centro: [0, 2], k: 3, pedana: [0, 44, 'al largo'], dopo: posaCarta,
    vista: () => ({ target: new THREE.Vector3(0, 3, 4), theta: 0, phi: 1.02, r: 110 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const dim = 3 + k * 0.5;
      CESTE.forEach(([id, nome], i) => {
        const m = new THREE.Mesh(cuoci(new THREE.BoxGeometry(19, 1.6, 15), i % 2 ? '#C9A227' : '#13315C'), new THREE.MeshBasicMaterial({ vertexColors: true }));
        m.position.set(XC(i), 0.5, -14); m.userData.tocco = id; g.add(m); tocca(m);
        const e = etichetta(nome, dim, '#FBFAF4'); e.position.set(XC(i), 7, -14); g.add(e);
      });
      const barca = new THREE.Group(); const sc = Scafo.crea(k); sc.scale.setScalar(0.17); sc.position.set(-7.6, -1, 0); barca.add(sc); barca.position.z = 14; g.add(barca);
      const nomi = CARTE.map(([t]) => { const e = etichetta(t, dim + 1, '#0B2545'); e.position.set(0, 9, 14); g.add(e); return e; });
      const presa = maniglia(1.6 + k * 0.4, 'carta'); presa.position.set(0, 5, 14); g.add(presa); tocca(presa);
      presa.userData.vincolo = { piano: [0, 1, 0] }; // la nave si porta sull'acqua fino alla banchina
      const fatte = CARTE.map((c, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 2.4), new THREE.MeshBasicMaterial({ color: 0xFBFAF4 })); const q = CESTE.findIndex(([id]) => id === c[1]); m.position.set(XC(q) - 3 + (i % 3) * 3.4, 2, -14 + (i % 2) * 3); g.add(m); return m; });
      ca.copie.push({ barca, presa, nomi, fatte });
      return g;
    },
    trascina(id, dx, dy, info) {
      if (info) { ca.x += info.v.x; ca.z += info.v.z; } else ca.x += dx * 0.1;
      ca.x = Math.max(-54, Math.min(54, ca.x)); ca.z = Math.max(-28, Math.min(8, ca.z));
      posaCarta();
    },
  });
  function comandiCarte(id) {
    if (id.startsWith('t:')) assegna(id.slice(2).split(',')[0]);
    if (id === 'lascia:carta' && (Math.abs(ca.x) > 3 || ca.z < -8)) {
      let vic = 0; CESTE.forEach((c, i) => { if (Math.abs(XC(i) - ca.x) < Math.abs(XC(vic) - ca.x)) vic = i; });
      assegna(CESTE[vic][0]);
    }
    if (id === 'lascia:carta' && ca.i < CARTE.length && (ca.x || ca.z)) { ca.x = 0; ca.z = 0; posaCarta(); }
    if (id === 'daccapo') { ca.i = 0; ca.esito = null; ca.x = 0; ca.z = 0; posaCarta(); }
    Motore.sporco();
  }

  /* Simulazione 3: quanto lontano dalla costa (slide 10, 11). Distanze in scala logaritmica ------- */
  const es = { d: 2, tipo: 'nazionale', copie: [] };
  const XD = (d) => 24 * Math.log2(1 + d) - 10;
  function nomeNavigazione() {
    const d = es.d;
    if (es.tipo === 'nazionale') return d <= 3 ? ['Locale', 'entro 3 miglia dalla costa'] : d <= 6 ? ['Litoranea', 'entro 6 miglia dalla costa'] : d <= 20 ? ['Costiera', 'entro 20 miglia dalla costa'] : ['Senza limiti', 'senza limiti dalla costa'];
    return d <= 20 ? ['Costiera', 'entro 20 miglia dalla costa'] : d <= 200 ? ['Breve', 'a non più di 200 miglia da un porto sicuro'] : ['Lunga', 'senza limiti dalla costa'];
  }
  function posaEstensione() {
    es.copie.forEach((c) => {
      c.nave.position.x = XD(es.d);
      c.linee.forEach(([g2, nazionale]) => { g2.visible = nazionale === (es.tipo === 'nazionale'); });
    });
  }
  const creaEstensione = Lezione.simula({
    scala: 0.0058, centro: [70, 2], k: 3, pedana: [70, 80, 'sul mare'], dopo: posaEstensione,
    vista: () => ({ target: new THREE.Vector3(66, 2, 0), theta: 0, phi: 1.04, r: 215 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const dim = 5 + k;
      const terra = new THREE.Mesh(cuoci(new THREE.BoxGeometry(70, 2.2, 300), (x, y) => (y > 0 ? '#8FA36E' : '#7C8F5E')), new THREE.MeshBasicMaterial({ vertexColors: true }));
      terra.position.set(-45, 1, 0); g.add(terra);
      const linea = (d, t) => {
        const q = new THREE.Group(); const x = XD(d);
        for (let z = -80; z < 80; z += 12) q.add(segmento(new THREE.Vector3(x, 0.3, z), new THREE.Vector3(x, 0.3, z + 7), 0.4 * Math.sqrt(k), COL.ocra));
        const e = etichetta(t, dim, '#FBFAF4'); e.position.set(x, 7, 58); q.add(e);
        return q;
      };
      const linee = [[3, '3 NM', true], [6, '6 NM', true], [20, '20 NM', true], [20, '20 NM', false], [200, '200 NM', false]].map(([d, t, naz]) => { const q = linea(d, t); g.add(q); return [q, naz]; });
      const nave = new THREE.Group(); const sc = Scafo.crea(k); sc.scale.setScalar(0.26); sc.position.set(-12, -1.5, 0); nave.add(sc); g.add(nave);
      const presa = maniglia(3 + k * 0.5, 'd'); presa.position.set(0, 12, 0); nave.add(presa); tocca(presa);
      presa.userData.vincolo = { asse: [1, 0, 0] }; // la nave si allontana dalla costa
      es.copie.push({ nave, linee });
      return g;
    },
    trascina(id, dx, dy, info) {
      const prima = nomeNavigazione()[0]; const pd = Math.round(es.d);
      const x = Math.max(XD(1), Math.min(XD(320), XD(es.d) + (info ? info.s : dx * 0.16)));
      es.d = 2 ** ((x + 10) / 24) - 1;
      posaEstensione();
      if (nomeNavigazione()[0] !== prima || Math.round(es.d) !== pd) Motore.ridisegna();
    },
  });
  function comandiEstensione(id) {
    if (id === 'n:nazionale' || id === 'n:internazionale') es.tipo = id.slice(2);
    posaEstensione(); Motore.sporco();
  }

  /* Simulazione 4: come si chiama l'unità da diporto (slide 21) --------------------------------- */
  const di = { L: 8, gt: 300, copie: [] };
  function nomeDiporto() {
    if (di.L > 24) return di.gt > 500 ? ['Nave da diporto maggiore', 'L > 24 m e stazza oltre 500 GT.'] : ['Nave da diporto minore', 'L > 24 m ma stazza sotto 500 GT.'];
    if (di.L > 10) return ['Imbarcazione da diporto', '10 m < L < 24 m.'];
    if (di.L < 4) return ['Natante o moto d\'acqua', 'Moto d\'acqua: meno di 4 m, con pompa a getto d\'acqua; si guida sullo scafo, non al suo interno.'];
    return ['Natante da diporto', 'Unità a remi o con scafo fino a dieci metri.'];
  }
  function posaDiporto() {
    const sc = di.L / Scafo.L;
    di.copie.forEach((c) => {
      c.barca.scale.setScalar(sc); c.barca.position.set(-di.L / 2, -Y_ACQUA * sc, 0);
      c.presa.position.x = di.L / 2 + 3;
    });
  }
  const creaDiporto = Lezione.simula({
    scala: 0.016, centro: [0, 1], k: 2, pedana: [0, 34, 'sul pontile'], dopo: posaDiporto,
    vista: () => ({ target: new THREE.Vector3(2, 2, 0), theta: 0.16, phi: 1.2, r: 58 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const dim = 1.4 + k * 0.5;
      const barca = Scafo.crea(14); g.add(barca);
      // Righello dal centro della barca: la metà di 10 m e di 24 m
      [[5, '10 m'], [12, '24 m']].forEach(([x, t]) => {
        g.add(segmento(new THREE.Vector3(x, 0.2, 9), new THREE.Vector3(x, 0.2, -9), 0.14 * k, COL.ocra), segmento(new THREE.Vector3(-x, 0.2, 9), new THREE.Vector3(-x, 0.2, -9), 0.14 * k, COL.ocra));
        const e = etichetta(t, dim + 2, '#FBFAF4'); e.position.set(x, 2.5, 12); g.add(e);
      });
      const presa = maniglia(1 + k * 0.3, 'L'); presa.position.set(0, 3, 0); g.add(presa); tocca(presa);
      presa.userData.vincolo = { asse: [1, 0, 0] }; // la sfera sta sulla prua: tirandola lo scafo si allunga
      di.copie.push({ barca, presa });
      return g;
    },
    trascina(id, dx, dy, info) {
      const prima = `${Math.round(di.L)}|${nomeDiporto()[0]}`;
      di.L = Math.max(3, Math.min(60, di.L + (info ? 2 * info.s : dx * 0.045)));
      posaDiporto();
      if (`${Math.round(di.L)}|${nomeDiporto()[0]}` !== prima) Motore.ridisegna();
    },
  });
  function comandiDiporto(id) {
    if (id === 'gt+') di.gt = Math.min(1500, di.gt + 100);
    if (id === 'gt-') di.gt = Math.max(100, di.gt - 100);
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const RISPOSTE = { c: 'Nave da carico', p: 'Nave passeggeri', s: 'Nave speciale' };
    const st = statoCarena(); const ne = nomeNavigazione(); const nd = nomeDiporto();
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Quattro modi di classificare' },
          { t: 'p', testo: 'Partendo dalla definizione di nave del Codice della Navigazione, le navi si classificano in base a quattro elementi. {{slide 2}}' },
          { t: 'tabella', col: [8, 92], size: 36, righe: [['', 'Elemento'], ['1', 'Tipo di sostentamento'], ['2', 'Estensione della navigazione'], ['3', 'Tipo di mezzo di propulsione'], ['4', 'Servizio cui la nave è destinata']] },
        ],
        dx: [
          { t: 'titolo', testo: 'Il sostentamento' },
          { t: 'p', size: 38, testo: 'Una carena è **dislocante** se la galleggiabilità è assicurata esclusivamente dalla spinta idrostatica. {{slide 3}}' },
          { t: 'formula', testo: 'Δ = ρ · ∇' },
          { t: 'p', size: 38, testo: 'Al crescere della velocità si genera una **spinta idrodinamica** e il volume immerso si riduce. {{slide 4}}' },
          { t: 'formula', testo: 'Δ = ρ · ∇(v) + S(v)' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Un rimorchiatore non porta né merci né passeggeri: aiuta le altre navi nelle manovre.' },
        ],
        dx: [
          { t: 'sotto', testo: 'In quale categoria va un rimorchiatore?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:c', testo: 'Nave da carico', on: p === 'c' },
          { t: 'scelta', id: 'p:p', testo: 'Nave passeggeri', on: p === 'p' },
          { t: 'scelta', id: 'p:s', testo: 'Nave speciale', on: p === 's' },
        ],
      },
      {
        passo: 2, mondo: creaCarena, azione: comandiCarena, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Dai velocità alla nave' },
          { t: 'passo', id: 'd', nome: 'Dislocamento Δ', valore: `${DISLOCAMENTI[so.d].toLocaleString('it-IT')} t` },
          Lezione.cursore('v', 'Velocità', `${Math.round(so.v)} kn`, so.v, 0, 60),
          { t: 'formula', testo: `v ≥ 7,16 · Δ^(1/6) = ${num(limiteHSC())} kn` },
          { t: 'riquadro', size: 38, testo: `**${Math.round(so.v)} kn. ${st[0]}**: ${st[1]} {{slide 3–6}}` },
          ...lez.missioni().slice(0, 2),
        ],
        dx: [
          ...Lezione.finestra(760),
          { t: 'nota', testo: 'Fai scorrere la velocità sulla pagina. Il limite HSC è la formula della slide 5; la quota di spinta e il sollevamento sono schematici.' },
        ],
      },
      {
        passo: 2, mondo: creaVasca, azione: comandiVasca, richiede: () => lez.fatte.has('planante'), avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'sotto', testo: 'In laboratorio: la vasca navale' },
          { t: 'passo', id: 'd', nome: 'Dislocamento Δ', valore: `${DISLOCAMENTI[so.d].toLocaleString('it-IT')} t` },
          Lezione.cursore('v', 'Velocità del carro', `${Math.round(va.v)} kn`, va.v, 0, VMAX),
          { t: 'riquadro', size: 34, testo: `Idrostatica **${pc(1 - quota(va.v))}**, idrodinamica **${pc(quota(va.v))}** di Δ. Volume immerso: ${pc(1 - quota(va.v))} di quello da fermo. {{slide 4}}` },
          { t: 'bottoni', h: 84, size: 32, lista: [{ id: 'registra', testo: 'Registra la misura', on: true }, { id: 'svuota', testo: 'Cancella' }] },
          { t: 'disegno', h: 360, fn: grafico },
          ...lez.missioni().slice(2, 4),
        ],
        dx: [
          ...Lezione.finestra(760),
          { t: 'nota', testo: 'Il carro traina il modello; il dinamometro divide il dislocamento nelle due spinte. Valori schematici; il limite HSC è la formula della slide 5.' },
        ],
      },
      {
        passo: 2, mondo: creaCarte, azione: comandiCarte, richiede: () => lez.fatte.has('pari'), avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'sotto', testo: 'In quale categoria?' },
          { t: 'riquadro', size: 40, testo: ca.i < CARTE.length ? `Nave ${ca.i + 1} di ${CARTE.length}: **${CARTE[ca.i][0]}**` : 'Tutte le navi sono al loro posto.' },
          ...(ca.esito ? [{ t: 'esito', ...ca.esito }] : []),
          { t: 'bottoni', h: 76, size: 32, lista: [{ id: 'daccapo', testo: 'Da capo' }] },
          ...lez.missioni().slice(4),
          { t: 'nota', testo: 'Trascina la nave sulla banchina giusta, oppure tocca la banchina.' },
        ],
        dx: Lezione.finestra(760, 'Tira la sfera d\'oro sulla banchina, oppure punta la banchina e premi il grilletto.'),
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 's' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Il rimorchiatore non trasporta: lavora in mare. Conta lo scopo prevalente, non la forma.' },
        ],
        dx: [
          { t: 'titolo', testo: 'Le navi mercantili' },
          { t: 'tabella', col: [26, 74], size: 32, righe: [
            ['Tipo', 'Definizione'],
            ['Passeggeri', 'più di 12 persone oltre l\'equipaggio, o trasporto misto di persone e mezzi su gomma'],
            ['Da carico', 'specializzate per una o più unità merceologiche'],
            ['Speciali', 'scopo prevalente: una o più attività in mare, non il trasporto'],
          ] },
          { t: 'nota', testo: 'slide 16' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Veloci, subacquee, SWATH' },
          { t: 'p', size: 38, testo: '**Navi veloci** (*High Speed Craft*): componente idrodinamica significativa, benché minore di quella idrostatica. {{slide 5}}' },
          { t: 'formula', testo: 'vmax (kn) ≥ 7,16 · Δ(t)^(1/6)' },
          { t: 'p', size: 38, testo: '**Carene plananti** (*planing hull*): la spinta idrodinamica è prevalente. {{slide 6}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', size: 38, testo: '**Unità subacquee** (*underwater unit*): operano sotto la superficie dell\'acqua. {{slide 7}}' },
          { t: 'p', size: 38, testo: '**Semisommergibili** (SWATH): ridotta area della figura di galleggiamento, che consente una rapida variazione dell\'immersione. Per carichi pesanti o eccezionali, attività offshore e scientifiche. {{slide 8}}' },
        ],
      },
      {
        passo: 3, mondo: creaEstensione, azione: comandiEstensione,
        sx: [
          { t: 'titolo', testo: 'L\'estensione della navigazione' },
          { t: 'p', size: 36, testo: 'Internazionale: fra porti di Stati diversi. Nazionale: fra porti dello stesso Stato. {{slide 9}}' },
          { t: 'bottoni', h: 80, size: 32, lista: [{ id: 'n:nazionale', testo: 'Nazionale', on: es.tipo === 'nazionale' }, { id: 'n:internazionale', testo: 'Internazionale', on: es.tipo === 'internazionale' }] },
          { t: 'riquadro', size: 38, testo: `A ${Math.round(es.d)} miglia: **${ne[0]}**, ${ne[1]}. {{slide 10, 11}}` },
          { t: 'nota', testo: 'Trascina la sfera d\'oro. Distanze compresse per farle stare tutte.' },
        ],
        dx: Lezione.finestra(760),
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Navigazioni speciali' },
          { t: 'p', size: 38, testo: 'Definite dagli Enti di Classificazione. {{slide 12}}' },
          { t: 'tabella', col: [36, 64], size: 32, righe: [
            ['Navigazione', 'Dove'],
            ['Mediterranea', 'Mediterraneo, mar Nero, mar d\'Azov'],
            ['Interna', 'laghi, fiumi o canali'],
            ['Grande e piccolo cabotaggio', 'prevalentemente nel Mediterraneo e parzialmente oltre gli stretti'],
          ] },
        ],
        dx: [
          { t: 'titolo', testo: 'La propulsione' },
          { t: 'tabella', col: [40, 60], size: 32, righe: [
            ['Nome', 'Il propulsore è mosso da'],
            ['Piroscafo', 'turbine a vapore'],
            ['Motonave', 'motori a combustione interna'],
            ['Propulsione elettrica', 'un motore elettrico'],
            ['Veliero', 'esclusivamente vele'],
          ] },
          { t: 'nota', testo: 'slide 13' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Il servizio' },
          { t: 'p', size: 38, testo: 'Tre macrocategorie: navi **mercantili** (*merchant ships*), navi **militari** (*war ships*), imbarcazioni **da diporto** (*pleasure crafts*). {{slide 14}}' },
          { t: 'p', size: 38, testo: 'Una nave mercantile trasporta merci e passeggeri: sono il suo carico utile. {{slide 15}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Le navi militari' },
          { t: 'p', size: 36, testo: 'Sono iscritte nel ruolo del naviglio militare, comandate ed equipaggiate da personale militare, e recano i segni distintivi. {{slide 17}}' },
          { t: 'p', size: 36, testo: 'La **nave da guerra** appartiene alle Forze armate di uno Stato e costituisce una parte del territorio dello Stato. {{slide 18}}' },
        ],
      },
      {
        passo: 3, mondo: creaDiporto, azione: comandiDiporto,
        sx: [
          { t: 'titolo', testo: 'Le unità da diporto' },
          { t: 'p', size: 36, testo: 'Navigazione a scopi sportivi o ricreativi, senza fine di lucro, oppure a scopi commerciali. {{slide 19}}' },
          { t: 'passo', id: 'gt', nome: 'Stazza', valore: `${di.gt} GT` },
          { t: 'riquadro', size: 38, testo: `L = ${Math.round(di.L)} m: **${nd[0]}**. ${nd[1]} {{slide 21}}` },
          { t: 'nota', testo: 'Trascina la sfera d\'oro: allunghi lo scafo.' },
        ],
        dx: Lezione.finestra(760),
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
