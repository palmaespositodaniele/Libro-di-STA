/* Lezione 10: propulsori. Le slide non danno i giri a cui inizia la cavitazione: giri e immersione
   nella vasca sono livelli senza valori, schematici. Dati solo dalle slide */
(function () {
  const N = 10;
  const { COL, tratto, etichetta, pedana, segmento } = Tavola;
  const { C } = Pagina;
  const { griglia } = Scafo;

  const MISSIONI = [
    { id: 'bolle', testo: 'Fai comparire le bolle: prova giri e immersione.' },
    { id: 'verso', testo: 'Passa da elica destrorsa a sinistrorsa.' },
    { id: 'tipi', testo: 'Guarda Voith Schneider, Azipod e idrogetto.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'La cavitazione è il passaggio dell\'acqua da liquido a…', scelte: ['Ghiaccio', 'Vapore', 'Sale'], giusta: 1, perche: 'A vapore, per la forte riduzione di pressione sul dorso dell\'elica.' },
    { n: 2, testo: 'Su quale superficie della pala cade la pressione?', scelte: ['Dorso', 'Faccia', 'Mozzo'], giusta: 0, perche: 'Sul dorso, la superficie prodiera. Sulla faccia la pressione aumenta.' },
    { n: 3, testo: 'La differenza tra passo e avanzo si chiama…', scelte: ['Regresso', 'Rendimento', 'Portanza'], giusta: 0, perche: 'È il regresso.' },
    { n: 4, testo: 'Un\'elica che a marcia avanti ruota in senso orario è…', scelte: ['Sinistrorsa', 'Destrorsa', 'Intubata'], giusta: 1, perche: 'È destrorsa.' },
    { n: 5, testo: 'Efficienza dell\'elica nelle slide: circa…', scelte: ['30%', '50%', '70%'], giusta: 2, perche: 'Circa il 70%, contro il 30% circa della ruota a pale.' },
    { n: 6, testo: 'Quale propulsore non ha bisogno del timone?', scelte: ['Azipod', 'Elica a pale fisse', 'Ruota a pale'], giusta: 0, perche: 'L\'Azipod dirige la spinta in qualsiasi direzione sul piano orizzontale.' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  const TIPI = {
    elica: { nome: 'Elica', testo: 'L\'**elica** è composta da pale e mozzo. Girando si «avvita» nel fluido e dà una spinta contraria al verso di avvitamento. {{slide 13, 14}}' },
    voith: { nome: 'Voith Schneider', testo: 'Un **tamburo** sotto la volta di poppa porta pale verticali che oscillano mentre esso ruota: dà spinte propulsive e trasversali. {{slide 33}}' },
    azipod: { nome: 'Azipod', testo: 'Il **pod** contiene un motore elettrico, sta sotto la chiglia e ruota di 360° sul piano orizzontale: dirige la spinta ovunque. {{slide 38, 39}}' },
    idrogetto: { nome: 'Idrogetto', testo: 'Una presa grigliata aspira acqua, una pompa la accelera e l\'ugello la espelle ad elevata velocità. {{slide 45}}' },
  };
  const NOMI_GIRI = ['Fermo', 'Bassi', 'Medi', 'Alti', 'Massimi'];
  const NOMI_IMM = ['Molto poco immersa', 'Poco immersa', 'Immersa', 'Molto immersa'];
  const s = { tipo: 'elica', giri: 0, imm: 3, verso: 1, ang: 0, azi: 0 };
  const visti = new Set(['elica']);

  // Più giri e meno immersione abbassano la pressione sul dorso: livelli, non misure
  const pressione = () => (s.imm + 1) / 4 - s.giri * 0.17 + 0.05;
  const SOGLIA = 0.2;
  const cavita = () => (s.tipo === 'elica' ? Math.max(0, Math.min(1, (SOGLIA - pressione()) / 0.3 + (pressione() < SOGLIA ? 0.25 : 0))) : 0);
  const spinta = () => (s.giri / 4) * (1 - 0.6 * cavita());

  /* Elica: le pale sono porzioni di elicoide (slide 13) ---------------------------------- */
  function elica(R, k) {
    const g = new THREE.Group();
    const carta = new THREE.MeshBasicMaterial({ color: COL.scafo, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const mozzo = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.18, R * 0.15, R * 0.5, 16), carta);
    mozzo.rotation.z = Math.PI / 2;
    g.add(mozzo);
    const passo = R * 1.3; const Z = 4;
    for (let i = 0; i < Z; i++) {
      const a0 = (i / Z) * Math.PI * 2;
      const punto = (u, v) => {
        const r = R * (0.16 + 0.84 * u);
        const largh = 0.85 * Math.sin(Math.PI * (0.12 + 0.82 * u)) * (R / r) ** 0.25;
        const t = a0 + (v - 0.5) * largh;
        return [((t - a0) / (Math.PI * 2)) * passo, r * Math.cos(t), r * Math.sin(t)];
      };
      g.add(new THREE.Mesh(griglia(14, 8, punto), carta));
      const orlo = [];
      for (let u = 0; u <= 14; u++) orlo.push(new THREE.Vector3(...punto(u / 14, 0)));
      for (let v = 1; v <= 8; v++) orlo.push(new THREE.Vector3(...punto(1, v / 8)));
      for (let u = 13; u >= 0; u--) orlo.push(new THREE.Vector3(...punto(u / 14, 1)));
      g.add(tratto(orlo, 0.035 * k));
    }
    return Tavola.compatta(g);
  }

  const POS = (imm) => 2.4 + (3 - imm) * 1.3; // altezza del mozzo: l'acqua è a quota 10 meno lo spazio tra i livelli
  const ACQUA = 9.3;

  function propulsori(k) {
    const carta = new THREE.MeshBasicMaterial({ color: COL.scafo, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const out = {};

    // Elica su linea d'assi
    const gE = new THREE.Group();
    const rotore = elica(3, k);
    const albero = segmento(new THREE.Vector3(0, 0, 0), new THREE.Vector3(9, 0, 0), 0.2, COL.medio);
    gE.add(rotore, albero);
    out.elica = gE; gE.userData = { rotore };

    // Voith Schneider: tamburo e pale verticali
    const gV = new THREE.Group();
    const piatto = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.5, 32), carta);
    piatto.position.y = 2.8;
    gV.add(piatto, tratto(Array.from({ length: 33 }, (_, i) => new THREE.Vector3(3.2 * Math.cos(i * 0.1963), 2.55, 3.2 * Math.sin(i * 0.1963))), 0.05 * k));
    const tamburo = new THREE.Group(); const pale = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const p = new THREE.Group(); p.position.set(2.6 * Math.cos(a), 0, 2.6 * Math.sin(a));
      const lama = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.6, 0.14), carta);
      p.add(lama, new THREE.LineSegments(new THREE.EdgesGeometry(lama.geometry), new THREE.LineBasicMaterial({ color: COL.inchiostro })));
      tamburo.add(p); pale.push({ p, a });
    }
    gV.add(tamburo);
    gV.userData = { tamburo, pale };
    out.voith = gV;

    // Azipod: gondola con elica a proravia
    const gA = new THREE.Group();
    const orient = new THREE.Group();
    const pod = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), carta);
    pod.scale.set(3.4, 1, 1);
    const sagoma = [];
    for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; sagoma.push(new THREE.Vector3(3.4 * Math.cos(a), 1.02 * Math.sin(a), 0)); }
    const braccio = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4, 0.5), carta);
    braccio.position.y = 2.6;
    const rotoreA = elica(2.2, k); rotoreA.position.x = 3.6;
    orient.add(pod, tratto(sagoma, 0.05 * k), braccio, new THREE.LineSegments(new THREE.EdgesGeometry(braccio.geometry), new THREE.LineBasicMaterial({ color: COL.inchiostro })), rotoreA);
    gA.add(orient);
    gA.userData = { rotore: rotoreA, orient };
    out.azipod = gA;

    // Idrogetto: presa, pompa e ugello
    const gI = new THREE.Group();
    const percorso = [[6.5, -3.2], [4.8, -2.4], [2.5, -0.8], [0, 0], [-3, 0], [-6.5, 0]].map(([x, y]) => new THREE.Vector3(x, y, 0));
    const curva = new THREE.CatmullRomCurve3(percorso);
    const condotto = new THREE.Mesh(new THREE.TubeGeometry(curva, 40, 0.95, 12), new THREE.MeshBasicMaterial({ color: COL.medio, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false }));
    gI.add(condotto, tratto(percorso.map((p) => p.clone().add(new THREE.Vector3(0, 0.95, 0))), 0.05 * k), tratto(percorso.map((p) => p.clone().add(new THREE.Vector3(0, -0.95, 0))), 0.05 * k));
    const pompa = elica(0.85, Math.max(1, k * 0.4)); pompa.position.set(0.6, 0, 0);
    gI.add(pompa);
    gI.userData = { rotore: pompa, curva };
    out.idrogetto = gI;
    return out;
  }

  /* Bolle: stesse particelle per ogni copia del modello */
  const NP = 150; const part = [];
  for (let i = 0; i < NP; i++) part.push({ v: 0, x: 0, y: 0, z: 0, t: Math.random() });
  const m4 = new THREE.Matrix4(); const q0 = new THREE.Quaternion(); const v3 = new THREE.Vector3(); const sc = new THREE.Vector3();

  function aggiornaBolle(dt) {
    const cav = cavita(); const R = 3; const idro = s.tipo === 'idrogetto' && s.giri > 0;
    part.forEach((b) => {
      b.t += dt * (idro ? 0.5 + s.giri * 0.25 : 1.6);
      if (b.t >= 1) {
        b.t = Math.random() * 0.2;
        if (idro) { b.v = 1; b.off = Math.random() * 0.8 - 0.4; } else if (Math.random() < cav) {
          // Nascono sul dorso, verso prua, in punta di pala: poi implodono andando a poppa
          const a = s.ang * s.verso + Math.floor(Math.random() * 4) * (Math.PI / 2) + Math.random() * 0.5 - 0.25;
          const r = R * (0.65 + Math.random() * 0.33);
          b.y = r * Math.cos(a); b.z = r * Math.sin(a); b.v = 1;
        } else b.v = 0;
      }
    });
    copie.forEach((c) => {
      const prop = c.tipi.idrogetto.userData;
      part.forEach((b, i) => {
        if (!b.v || (!idro && cav === 0)) { sc.setScalar(0); v3.set(0, -50, 0); } else if (idro) {
          prop.curva.getPoint(b.t, v3); v3.y += b.off; v3.z += b.off * 0.7; v3.add(c.tipi.idrogetto.position);
          sc.setScalar(0.14);
        } else {
          v3.set(0.8 - b.t * 2.2, b.y, b.z).add(c.tipi.elica.position);
          sc.setScalar(0.1 + 0.18 * Math.sin(Math.PI * b.t)); // crescono, poi implodono
        }
        m4.compose(v3, q0, sc); c.bolle.setMatrixAt(i, m4);
      });
      c.bolle.instanceMatrix.needsUpdate = true;
    });
  }

  /* Modello --------------------------------------------------------------------------------- */
  const copie = [];
  function copia(k) {
    const g = new THREE.Group();
    const X = 11; const Z = 7.5; const H = 10.5;
    [[-X, -Z], [X, -Z], [X, Z], [-X, Z]].forEach(([x, z]) => g.add(segmento(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, H, z), 0.05 * k)));
    [0, H].forEach((y) => [[-X, -Z, X, -Z], [X, -Z, X, Z], [X, Z, -X, Z], [-X, Z, -X, -Z]].forEach(([a, b, c, d]) => g.add(segmento(new THREE.Vector3(a, y, b), new THREE.Vector3(c, y, d), 0.05 * k))));
    Tavola.compatta(g);
    const acqua = new THREE.Mesh(new THREE.PlaneGeometry(2 * X, 2 * Z), new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
    acqua.rotation.x = -Math.PI / 2; acqua.position.y = ACQUA;
    const volume = new THREE.Mesh(new THREE.BoxGeometry(2 * X, ACQUA, 2 * Z), new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.1, side: THREE.BackSide, depthWrite: false }));
    volume.position.y = ACQUA / 2;
    g.add(volume, acqua);
    const tipi = propulsori(k);
    Object.keys(tipi).forEach((id) => {
      tipi[id].position.set(0, id === 'elica' ? POS(s.imm) : 5.2, 0);
      g.add(tipi[id]);
    });
    const bolle = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({ color: COL.scafo }), NP);
    bolle.frustumCulled = false;
    g.add(bolle);
    const e = [['prua →', 8, H + 1.6, 0], ['poppa', -9, H + 1.6, 0]].map(([t, x, y, z]) => { const l = etichetta(t, k > 1 ? 1.4 : 1); l.position.set(x, y, z); return l; });
    g.add(...e);
    copie.push({ g, tipi, bolle });
    return g;
  }

  function mostra() {
    copie.forEach((c) => Object.keys(c.tipi).forEach((id) => { c.tipi[id].visible = id === s.tipo; }));
  }

  /* Pressione sul dorso: livelli, senza numeri */
  const LW = 1040; const LH = 300;
  const telaLente = document.createElement('canvas');
  telaLente.width = LW; telaLente.height = LH;
  const texLente = new THREE.CanvasTexture(telaLente);
  texLente.colorSpace = THREE.SRGBColorSpace;
  function disegnaLente() {
    const c = telaLente.getContext('2d');
    c.fillStyle = C.carta; c.fillRect(0, 0, LW, LH);
    const barra = (y, nome, v, col) => {
      c.fillStyle = C.ink; c.font = '700 34px Atkinson, sans-serif'; c.fillText(nome, 20, y + 34);
      c.fillStyle = C.carta2; c.fillRect(400, y, 600, 56);
      c.fillStyle = col; c.fillRect(400, y, 600 * Math.max(0, Math.min(1, v)), 56);
      c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(400, y, 600, 56);
    };
    const p = pressione();
    barra(30, 'Pressione sul dorso', p, cavita() > 0 ? C.rosso : C.ink2);
    barra(120, 'Spinta', spinta(), C.ink2);
    c.strokeStyle = C.ocra; c.lineWidth = 5; c.setLineDash([12, 8]); c.beginPath();
    c.moveTo(400 + 600 * SOGLIA, 14); c.lineTo(400 + 600 * SOGLIA, 100); c.stroke(); c.setLineDash([]);
    c.fillStyle = C.ocraT; c.font = '30px Disegno, cursive'; c.fillText('sotto questa linea l\'acqua diventa vapore', 400, 216);
    c.fillStyle = C.ink2; c.font = '30px Disegno, cursive'; c.fillText('livelli schematici, senza valori', 20, 268);
    c.strokeStyle = C.ink; c.lineWidth = 4; c.strokeRect(2, 2, LW - 4, LH - 4);
    texLente.needsUpdate = true;
  }

  const VISTA = () => ({ target: new THREE.Vector3(0, 5, 0), theta: 0.7, phi: 1.3, r: 21 });
  let mondo = null;
  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    radice.add(copia(1));
    const passerella = (x, z, nome, yaw) => {
      const p = pedana(x, z, nome); p.position.y = 4.85; p.scale.set(0.7, 1, 0.7);
      return { pedana: p, pos: new THREE.Vector3(x, 5, z), yaw };
    };
    const stazioni = [passerella(0, 12.5, 'di lato', 0), passerella(15, 0, 'a proravia', Math.PI / 2), passerella(-15, 0, 'a poppavia', -Math.PI / 2)];
    stazioni.forEach((st) => { st.pedana.visible = false; });
    const mini = new THREE.Group();
    mini.add(copia(4));
    mini.scale.setScalar(0.048); mini.position.set(0, -0.2, 0);
    mostra();
    let ultimo = '';
    mondo = {
      radice, stazioni, modellino: mini, vistaIniziale: VISTA,
      lente: () => { disegnaLente(); return texLente; },
      frame(dt) {
        const om = s.giri * 2.4 * s.verso;
        s.ang += dt * Math.abs(om);
        copie.forEach((c) => {
          const e = c.tipi;
          e.elica.userData.rotore.rotation.x = s.ang * s.verso;
          e.elica.userData.rotore.scale.y = s.verso; // la sinistrorsa è l'elica speculare
          e.elica.position.y += (POS(s.imm) - e.elica.position.y) * (1 - Math.exp(-dt * 3));
          e.azipod.userData.rotore.rotation.x = s.ang;
          e.azipod.userData.orient.rotation.y = s.azi;
          e.idrogetto.userData.rotore.rotation.x = s.ang;
          e.voith.userData.tamburo.rotation.y = s.ang * 0.4;
          e.voith.userData.pale.forEach(({ p, a }) => { p.rotation.y = -a + 0.5 * Math.sin(s.ang * 0.4 + a); });
          // Con la cavitazione l'elica vibra
          const cav = cavita();
          e.elica.position.z = cav ? Math.sin(s.ang * 9) * 0.02 * cav : 0;
        });
        if (s.giri > 0 || cavita() > 0 || s.tipo === 'idrogetto') aggiornaBolle(dt);
        const chiave = `${s.giri}|${s.imm}|${s.tipo}`;
        if (chiave !== ultimo) { ultimo = chiave; disegnaLente(); }
        return s.giri > 0 || Math.abs(POS(s.imm) - copie[0].tipi.elica.position.y) > 0.01;
      },
    };
    return mondo;
  }

  function comandi(id) {
    if (id === 'giri+') s.giri = Math.min(4, s.giri + 1);
    if (id === 'giri-') s.giri = Math.max(0, s.giri - 1);
    if (id === 'imm+') s.imm = Math.min(3, s.imm + 1);
    if (id === 'imm-') s.imm = Math.max(0, s.imm - 1);
    if (id === 'azi+') s.azi += Math.PI / 6;
    if (id === 'azi-') s.azi -= Math.PI / 6;
    if (id === 'v:d' || id === 'v:s') { const prima = s.verso; s.verso = id === 'v:d' ? 1 : -1; if (prima !== s.verso) lez.completa('verso'); }
    if (id.startsWith('t:')) {
      s.tipo = id.slice(2); visti.add(s.tipo); mostra();
      if (['voith', 'azipod', 'idrogetto'].every((x) => visti.has(x))) lez.completa('tipi');
    }
    if (cavita() > 0) lez.completa('bolle');
    disegnaLente();
    Motore.sporco();
  }

  // Passo e avanzo: disegno senza valori (slide 25, 26)
  function schemaPasso(c, x, y, w) {
    const L0 = x + 40; const P1 = x + w - 60; const A1 = x + w * 0.66;
    const riga = (yy, x1, nome, col) => {
      c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 7; c.beginPath(); c.moveTo(L0, yy); c.lineTo(x1, yy); c.stroke();
      c.beginPath(); c.moveTo(x1, yy); c.lineTo(x1 - 24, yy - 14); c.lineTo(x1 - 24, yy + 14); c.closePath(); c.fill();
      c.font = '700 38px Atkinson, sans-serif'; c.fillStyle = C.ink; c.fillText(nome, L0, yy - 22);
    };
    riga(y + 70, P1, 'Passo: un giro in un materiale non cedevole', C.ink);
    riga(y + 180, A1, 'Avanzo: un giro nell\'acqua', C.ink2);
    c.strokeStyle = C.ocra; c.lineWidth = 7; c.beginPath(); c.moveTo(A1, y + 260); c.lineTo(P1, y + 260); c.stroke();
    c.font = '700 38px Atkinson, sans-serif'; c.fillStyle = C.ocraT; c.fillText('Regresso', A1, y + 310);
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { poco: 'Quando è poco immersa', molto: 'Quando è molto immersa', uguale: 'L\'immersione non conta' };
    const cav = cavita();
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'I propulsori' },
          { t: 'p', testo: 'Si chiama **propulsore** ogni organo che comunica al veicolo la forza che ne produce e mantiene il moto. La propulsione è quindi una spinta. {{slide 2}}' },
          { t: 'p', testo: 'Gli organi propulsivi convertono l\'energia di un motore in una spinta idrodinamica. {{slide 2}}' },
        ],
        dx: [
          { t: 'sotto', testo: 'I principali' },
          { t: 'p', testo: 'Elica a pale fisse, elica a pale orientabili, elica intubata, propulsore Voith Schneider, propulsore di manovra, Azipod, eliche contro-rotanti, idrogetto. {{slide 3}}' },
          { t: 'sotto', testo: 'E prima di loro' },
          { t: 'p', testo: 'I remi, le vele, le ruote a pale. {{slide 4}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Sul dorso dell\'elica in rotazione la pressione cala. Se cala troppo, l\'acqua forma bolle di vapore: è la **cavitazione**. {{slide 17, 19}}' },
        ],
        dx: [
          { t: 'sotto', testo: 'Quando è più facile che compaiano le bolle?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:poco', testo: 'Quando l\'elica è poco immersa', on: p === 'poco' },
          { t: 'scelta', id: 'p:molto', testo: 'Quando l\'elica è molto immersa', on: p === 'molto' },
          { t: 'scelta', id: 'p:uguale', testo: 'L\'immersione non conta', on: p === 'uguale' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'bottoni', h: 84, size: 30, lista: Object.keys(TIPI).map((k) => ({ id: `t:${k}`, testo: TIPI[k].nome, on: s.tipo === k })) },
          { t: 'passo', id: 'giri', nome: 'Giri', valore: NOMI_GIRI[s.giri] },
          ...(s.tipo === 'elica' ? [
            { t: 'passo', id: 'imm', nome: 'Elica', valore: NOMI_IMM[s.imm] },
            { t: 'bottoni', h: 84, size: 32, lista: [{ id: 'v:d', testo: 'Destrorsa', on: s.verso === 1 }, { id: 'v:s', testo: 'Sinistrorsa', on: s.verso === -1 }] },
          ] : s.tipo === 'azipod' ? [{ t: 'passo', id: 'azi', nome: 'Orientamento del pod', valore: `${((Math.round((s.azi * 180) / Math.PI) % 360) + 360) % 360}°` }] : []),
          { t: 'riquadro', size: 36, testo: TIPI[s.tipo].testo },
          ...lez.missioni(),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 700,
            testo: !vr ? '' : vera
              ? 'Sei accanto alla vasca. Punta una pedana e premi il grilletto per spostarti.'
              : 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.',
          },
          ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          { t: 'zona', id: 'lente', h: 300 },
          { t: 'p', size: 36, colore: cav > 0 ? C.rosso : C.verde, testo: s.tipo !== 'elica' ? 'La cavitazione qui si studia sull\'elica.' : cav > 0 ? '**Cavitazione**: bolle sul dorso, vibrazioni, meno spinta.' : '**Nessuna cavitazione.**' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'poco' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Con gli stessi giri, alzando l\'elica verso la superficie compaiono le bolle.' },
          { t: 'nota', testo: 'Le slide non indicano a quali giri inizia: nella vasca sono solo livelli' },
        ],
        dx: [
          { t: 'titolo', testo: 'Quando è poco immersa' },
          { t: 'p', testo: 'La causa principale è la posizione dell\'elica: se è troppo poco immersa, la pressione dell\'acqua è bassa. {{slide 20}}' },
          { t: 'p', testo: 'Può dipendere da immersione, assetto o mare mosso. Un\'altra causa può essere la costruzione dell\'elica, dalla geometria non ottimale o troppo piccola. {{slide 20}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'La cavitazione' },
          { t: 'p', size: 40, testo: 'L\'elica è come una pompa: aspira acqua da prua e la spinge a poppa. Sulla superficie prodiera, il **dorso**, la pressione cade; su quella poppiera, la **faccia**, aumenta. {{slide 17}}' },
          { t: 'p', size: 40, testo: 'Le implosioni delle bolle «martellano» la superficie dell\'elica. {{slide 18}}' },
        ],
        dx: [
          { t: 'sotto', testo: 'Gli effetti' },
          { t: 'p', testo: 'Riduzione di efficienza: l\'elica gira «a vuoto», con più consumi e meno velocità. {{slide 19}}' },
          { t: 'p', testo: 'Stress per il motore. {{slide 19}}' },
          { t: 'p', testo: 'Danni all\'elica: col tempo, erosione delle pale. {{slide 18, 19}}' },
          { t: 'sotto', testo: 'E se si cerca apposta?' },
          { t: 'p', size: 38, testo: 'Le **eliche di superficie** lavorano in regime supercavitante: il dorso sta in una «bolla di gas», con meno attrito. Le cavità si chiudono a poppavia della pala, evitando i danni. {{slide 22, 23}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Passo, avanzo, regresso' },
          { t: 'disegno', h: 340, fn: schemaPasso },
          { t: 'p', size: 38, testo: 'Il regresso è la differenza fra passo e avanzo. È massimo quando l\'elica comincia a girare: l\'elica gira ma la nave è ancora ferma. {{slide 25, 26}}' },
          { t: 'nota', testo: 'Disegno senza valori' },
        ],
        dx: [
          { t: 'titolo', testo: 'Destrorsa e sinistrorsa' },
          { t: 'p', testo: '**Destrorsa**: a marcia avanti ruota in senso orario. **Sinistrorsa**: a marcia avanti ruota in senso antiorario. {{slide 27}}' },
          { t: 'p', testo: 'Il nome indica anche in che direzione l\'elica porta a spostare la poppa: influenza pesantemente la manovrabilità. {{slide 27, 28}}' },
          { t: 'p', testo: 'Un\'elica ha un mozzo e pale, solitamente tra 3 e 6. Per le unità più grandi il diametro è indicativamente da sei a nove metri. {{slide 24}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Prima dell\'elica' },
          { t: 'p', size: 38, testo: '**Remi**: il remo agisce come una leva di 2° genere, con il fulcro nell\'estremità immersa. {{slide 5}}' },
          { t: 'p', size: 38, testo: '**Vela**: una superficie che genera spinta quando il vento agisce su di essa, come un\'ala verticale che genera portanza. {{slide 7}}' },
          { t: 'p', size: 38, testo: '**W.A.S.P.** (*Wind Assisted Ship Propulsion*): versione moderna della propulsione velica, per ridurre le emissioni. {{slide 9}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: '**Ruote a pale**: una grande ruota contornata da palette, a poppa o ai due fianchi. Furono il principale sistema di propulsione navale nel diciannovesimo secolo. {{slide 10, 11}}' },
          { t: 'riquadro', size: 42, testo: 'Efficienza: ruota a pale circa 30%, elica circa 70%. {{slide 11}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Tipi di eliche' },
          { t: 'p', size: 38, testo: '**A pale fisse**: ottimizzata per la velocità di crociera. Per la marcia indietro bisogna invertire il senso di rotazione del mozzo. {{slide 29}}' },
          { t: 'p', size: 38, testo: '**A pale orientabili** (o a passo variabile): orientando le pale si varia il passo; si realizzano anche V=0 e la marcia indietro, con l\'asse che gira sempre nello stesso senso. {{slide 30}}' },
          { t: 'p', size: 38, testo: '**Intubata** (o con mantello): sistemata in un tronco di cono; a parità di potenza produce un aumento di spinta. {{slide 31}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Propulsore di manovra' },
          { t: 'p', size: 38, testo: 'Detto anche elica trasversale, è in un tunnel trasversale a prora (*bow thruster*) e spesso anche a poppa (*stern thruster*). {{slide 37}}' },
          { t: 'p', size: 38, testo: 'Si usa con nave ferma o con velocità non superiore ai 5 nodi, per evitare vortici nel tunnel. {{slide 37}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Voith Schneider' },
          { t: 'p', size: 38, testo: 'Usato prevalentemente da draghe e rimorchiatori, e su traghetti bidirezionali, con un propulsore a prua e uno a poppa. La velocità massima è solitamente intorno ai 15 nodi. {{slide 33–35}}' },
          { t: 'tabella', col: [50, 50], size: 32, righe: [
            ['Vantaggi', 'Svantaggi'],
            ['Manovre sicure e precise', 'Appendici in profondità'],
            ['Veloci tempi di risposta', 'Costi elevati'],
            ['Stabilizza i moti di rollio', 'Basse velocità'],
            ['Bassi consumi', ''],
            ['Alta affidabilità', ''],
          ] },
          { t: 'nota', testo: 'slide 36' },
        ],
        dx: [
          { t: 'titolo', testo: 'Azipod' },
          { t: 'p', size: 38, testo: 'AZImuthal POdded Device. Il propulsore è esterno allo scafo: meno rumorosità e vibrazioni, più spazio a bordo, nessun locale agghiaccio timone. {{slide 38, 39}}' },
          { t: 'p', size: 38, testo: 'L\'elica è all\'estremità prodiera dell\'astuccio: il flusso che la investe non ha ostacoli. {{slide 39, 40}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Eliche contro-rotanti' },
          { t: 'p', size: 38, testo: 'CRP (*Contra Rotating Propulsion*): un propulsore principale e un Azipod in linea, più a poppavia, con elica affacciata. Ruota in verso opposto. {{slide 42, 43}}' },
          { t: 'riquadro', size: 40, testo: 'Vantaggi: carico ripartito su due propulsori, efficienza propulsiva migliorata del 15%. {{slide 44}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Idrogetto' },
          { t: 'p', size: 38, testo: 'Presa grigliata, pompa, ugello di scarico. La pompa è azionata da un motore diesel, a benzina o da una turbina. {{slide 45}}' },
          { t: 'p', size: 38, testo: 'Il flusso in entrata non deve aspirare aria, per evitare la cavitazione. Il flusso in uscita può essere deviato per governare. {{slide 46}}' },
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
