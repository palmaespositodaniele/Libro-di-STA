/* Lezione 18: nozioni di meteorologia. Dati e formule dalle slide; carta sinottica schematica:
   valori di pressione e velocità del vento nel modello non sono dati */
(function () {
  const N = 18;
  const { COL, tratto, etichetta, pedana } = Tavola;
  const { C } = Pagina;
  const { griglia } = Scafo;

  const MISSIONI = [
    { id: 'sud', testo: 'Porta la nave a sud della bassa: da dove viene il vento?' },
    { id: 'fitte', testo: 'Rendi profonda la bassa: isobare fitte, vento forte.' },
    { id: 'emisfero', testo: 'Passa all\'emisfero sud: come gira il vento?' },
    { id: 'fronte', testo: 'Guarda il passaggio del fronte freddo.' },
  ];
  const QUIZ = [{ n: 3, testo: 'Vento da ovest, emisfero nord. In quale direzione si trova la bassa pressione?', scelte: ['A nord', 'A sud', 'A est'], giusta: 0, perche: 'A nord, a sinistra di chi ha il vento alle spalle.' }];
  const CALCOLI = [
    { n: 1, testo: 'Temperatura a 3000 m di quota con il gradiente standard: 15 °C al livello del mare, gradiente 6,5 °C / 1000 m. Scrivi quanti gradi sotto zero.', campi: [['sotto zero', 4.5, 0.01, '°C']], soluzione: '15 − 6,5 × 3 = −4,5 °C' },
    { n: 2, testo: 'Converti 25 °C in kelvin e in gradi Fahrenheit.', campi: [['kelvin', 298.15, 0.2, 'K'], ['Fahrenheit', 77, 0.01, '°F']], soluzione: '298,15 K (circa 298 K) e 77 °F' },
    { n: 4, testo: 'Il barometro a mercurio segna 750 mmHg. Esprimi la pressione in hPa.', campi: [['pressione', 1000, 0.01, 'hPa']], soluzione: '750 × 4/3 = 1000 hPa' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ, calcoli: CALCOLI });

  const DOVE = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ovest', 'ovest', 'nord-ovest'];
  const VENTI = ['Tramontana', 'Grecale', 'Levante', 'Scirocco', 'Ostro', 'Libeccio', 'Ponente', 'Maestrale']; // slide 51
  const FORZA = [{ nome: 'Debole', a: 9 }, { nome: 'Media', a: 17 }, { nome: 'Profonda', a: 26 }];
  const FASI = ['Prima del fronte', 'Il fronte passa', 'Dopo il passaggio'];
  const s = { dove: 0, forza: 1, sud: false, fase: 0, viste: new Set(), visteFronte: new Set() };

  /* Campo di pressione: nord verso -z, est verso +x ------------------------------------- */
  const CA = { x: -14, z: 1 }; const CB = { x: 12, z: -1 };
  const pres = (x, z) => 1013
    + 15 * Math.exp(-((x - CA.x) ** 2 + (z - CA.z) ** 2) / 120)
    - FORZA[s.forza].a * Math.exp(-((x - CB.x) ** 2 + (z - CB.z) ** 2) / 75);
  const quota = (p) => 1.1 + (p - 1013) * 0.055;
  function vento(x, z) {
    const e = 0.2;
    const gx = -(pres(x + e, z) - pres(x - e, z)) / (2 * e); const gz = -(pres(x, z + e) - pres(x, z - e)) / (2 * e); // verso la bassa
    let vx = -gz; let vz = gx; // bassa a sinistra, emisfero nord (slide 47)
    if (s.sud) { vx = -vx; vz = -vz; }
    const c = Math.cos((15 * Math.PI) / 180); const n = Math.sin((15 * Math.PI) / 180); // attrito: circa 15° sul mare (slide 46)
    return { x: vx * c + gx * n, z: vz * c + gz * n, gx, gz };
  }

  /* Isobare: una ogni 4 hPa, cercate lungo raggi dal centro */
  function anello(c, liv) {
    const punti = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2; let lo = 0; let hi = 24; const dx = Math.cos(a); const dz = Math.sin(a);
      const dentro = (r) => (pres(c.x + r * dx, c.z + r * dz) - liv) * (pres(c.x, c.z) - liv) > 0;
      if (!dentro(0) || dentro(hi)) return null;
      for (let k = 0; k < 16; k++) { const m = (lo + hi) / 2; if (dentro(m)) lo = m; else hi = m; }
      const x = c.x + lo * dx; const z = c.z + lo * dz;
      punti.push(new THREE.Vector3(x, quota(liv) + 0.05, z));
    }
    return punti;
  }

  const copie = [];
  function copia(k) {
    const g = new THREE.Group();
    const superficie = griglia(60, 40, (a, b) => [-30 + a * 60, 0, -20 + b * 40]);
    const pieno = new THREE.Mesh(superficie, new THREE.MeshBasicMaterial({ color: COL.scafo, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
    const reticolo = new THREE.Mesh(superficie, new THREE.MeshBasicMaterial({ color: COL.griglia, wireframe: true }));
    g.add(pieno, reticolo);
    const isobare = new THREE.Group(); g.add(isobare);
    const frecce = new THREE.InstancedMesh(new THREE.ConeGeometry(0.22 * Math.max(1, k * 0.6), 0.9 * Math.max(1, k * 0.6), 6), new THREE.MeshBasicMaterial({ color: COL.acqua }), NP);
    frecce.frustumCulled = false;
    g.add(frecce);
    const nave = new THREE.Group();
    const scafetto = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2, 4), new THREE.MeshBasicMaterial({ color: COL.inchiostro }));
    scafetto.scale.y = 0.6; scafetto.position.y = 0.6;
    nave.add(scafetto);
    const freccia = new THREE.Group();
    const asta = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 4, 8), new THREE.MeshBasicMaterial({ color: COL.ocra }));
    asta.rotation.x = Math.PI / 2; asta.position.z = -2;
    const punta = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 10), new THREE.MeshBasicMaterial({ color: COL.ocra }));
    punta.rotation.x = -Math.PI / 2; punta.position.z = -4.4;
    freccia.add(asta, punta); freccia.position.y = 1;
    nave.add(freccia); g.add(nave);
    const A = etichetta('A', 3.6); A.position.set(CA.x, 3.4, CA.z);
    const B = etichetta('B', 3.6, '#B3362B'); B.position.set(CB.x, 1.9, CB.z);
    const Nn = etichetta('N ↑', 1.8); Nn.position.set(-27, 1.6, -19);
    g.add(A, B, Nn);
    copie.push({ k, g, superficie, isobare, frecce, nave, freccia, B });
    return g;
  }

  function aggiornaCampo() {
    copie.forEach((c) => {
      const p = c.superficie.attributes.position;
      for (let i = 0; i < p.count; i++) p.setY(i, quota(pres(p.getX(i), p.getZ(i))));
      p.needsUpdate = true;
      c.superficie.computeBoundingSphere();
      while (c.isobare.children.length) { const o = c.isobare.children[0]; c.isobare.remove(o); o.geometry.dispose(); }
      const r = 0.06 * c.k;
      [[CB, -4], [CA, 4]].forEach(([cen, passo]) => {
        for (let l = 1012 + (passo > 0 ? 4 : 0); l > 960 && l < 1040; l += passo) {
          const pt = anello(cen, l);
          if (!pt) break;
          c.isobare.add(tratto(pt, r, COL.inchiostro, true));
        }
      });
      c.B.position.y = quota(pres(CB.x, CB.z)) + 1.2;
    });
  }

  function posizione() {
    const a = (s.dove / 8) * Math.PI * 2;
    return { x: CB.x + 10 * Math.sin(a), z: CB.z - 10 * Math.cos(a) };
  }
  function letturaVento() {
    const p = posizione(); const v = vento(p.x, p.z);
    // Direzione di provenienza, misurata da nord in senso orario
    const da = (Math.atan2(-v.x, v.z) * 180) / Math.PI;
    const g = ((da % 360) + 360) % 360;
    const settore = Math.round(g / 45) % 8;
    return { p, v, gradi: g, settore };
  }

  /* Particelle che seguono il vento */
  const NP = 130; const part = [];
  for (let i = 0; i < NP; i++) part.push({ x: Math.random() * 56 - 28, z: Math.random() * 36 - 18, t: Math.random() });
  const m4 = new THREE.Matrix4(); const qq = new THREE.Quaternion(); const v3 = new THREE.Vector3(); const sc = new THREE.Vector3(1, 1, 1); const su = new THREE.Vector3(0, 1, 0); const dir = new THREE.Vector3();
  function muoviVento(dt) {
    part.forEach((b, i) => {
      const v = vento(b.x, b.z); const f = 0.4;
      b.x += v.x * f * dt * 3; b.z += v.z * f * dt * 3; b.t += dt * 0.35;
      if (b.t > 1 || Math.abs(b.x) > 29 || Math.abs(b.z) > 19) { b.x = Math.random() * 56 - 28; b.z = Math.random() * 36 - 18; b.t = 0; }
      dir.set(v.x, 0, v.z);
      const l = dir.length();
      if (l > 1e-4) qq.setFromUnitVectors(su, dir.divideScalar(l));
      v3.set(b.x, quota(pres(b.x, b.z)) + 0.4, b.z);
      sc.setScalar(l < 0.08 ? 0.001 : Math.min(1.3, 0.5 + l * 0.5));
      m4.compose(v3, qq, sc);
      copie.forEach((c) => c.frecce.setMatrixAt(i, m4));
    });
    copie.forEach((c) => { c.frecce.instanceMatrix.needsUpdate = true; });
  }

  function aggiornaNave() {
    const l = letturaVento();
    copie.forEach((c) => {
      c.nave.position.set(l.p.x, quota(pres(l.p.x, l.p.z)), l.p.z);
      c.freccia.rotation.y = Math.atan2(-l.v.x, -l.v.z); // punta dove va il vento
    });
  }

  /* Spalle al vento: schema dall'alto */
  const LW = 1040; const LH = 300;
  const telaLente = document.createElement('canvas');
  telaLente.width = LW; telaLente.height = LH;
  const texLente = new THREE.CanvasTexture(telaLente);
  texLente.colorSpace = THREE.SRGBColorSpace;
  function disegnaLente() {
    const c = telaLente.getContext('2d'); const l = letturaVento();
    c.fillStyle = C.carta; c.fillRect(0, 0, LW, LH);
    const cx = 250; const cy = 155; const R = 110;
    c.strokeStyle = C.ink2; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    c.fillStyle = C.ink2; c.font = '28px Disegno, cursive'; c.textAlign = 'center'; c.fillText('N', cx, cy - R - 8);
    // Vento: arriva da g, scorre attraverso il centro
    const a = ((l.gradi - 90) * Math.PI) / 180;
    const x0 = cx + (R + 30) * Math.cos(a); const y0 = cy + (R + 30) * Math.sin(a); const x1 = cx - 40 * Math.cos(a); const y1 = cy - 40 * Math.sin(a);
    c.strokeStyle = C.ocra; c.fillStyle = C.ocra; c.lineWidth = 9; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.beginPath(); c.moveTo(x1 - 26 * Math.cos(a) * 1, y1 - 26 * Math.sin(a)); c.lineTo(x1 + 16 * Math.sin(a), y1 - 16 * Math.cos(a)); c.lineTo(x1 - 16 * Math.sin(a), y1 + 16 * Math.cos(a)); c.closePath(); c.fill();
    // Bassa pressione
    const bx = CB.x - l.p.x; const bz = CB.z - l.p.z; const m = Math.hypot(bx, bz);
    c.fillStyle = C.rosso; c.font = '700 44px Atkinson, sans-serif'; c.fillText('B', cx + (bx / m) * (R - 14), cy + (bz / m) * (R - 14) + 16);
    c.textAlign = 'left'; c.fillStyle = C.ink; c.font = '700 36px Atkinson, sans-serif';
    c.fillText(`Vento da ${DOVE[l.settore]}`, 490, 90);
    c.font = '34px Atkinson, sans-serif'; c.fillText(`nel Mediterraneo: ${VENTI[l.settore]}`, 490, 138);
    c.fillText(s.sud ? 'Spalle al vento: bassa a destra' : 'Spalle al vento: bassa a sinistra', 490, 186);
    c.fillStyle = C.ink2; c.font = '28px Disegno, cursive'; c.fillText('carta schematica', 490, 250);
    c.strokeStyle = C.ink; c.lineWidth = 4; c.strokeRect(2, 2, LW - 4, LH - 4);
    texLente.needsUpdate = true;
  }

  const VISTA = () => ({ target: new THREE.Vector3(0, 1, 0), theta: 0.25, phi: 0.78, r: 76 });
  let mondo = null;
  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    radice.add(copia(1));
    const bordo = (x, z, nome, yaw) => { const p = pedana(x, z, nome); p.scale.setScalar(0.5); p.position.y = 0.02; return { pedana: p, pos: new THREE.Vector3(x, 0.1, z), yaw }; };
    const stazioni = [bordo(0, 25, 'lato sud', 0), bordo(36, 0, 'lato est', Math.PI / 2), bordo(-36, 0, 'lato ovest', -Math.PI / 2)];
    stazioni.forEach((st) => { st.pedana.visible = false; });
    const mini = new THREE.Group();
    mini.add(copia(5));
    mini.scale.setScalar(0.019); mini.position.y = -0.05;
    aggiornaCampo(); aggiornaNave();
    mondo = {
      radice, stazioni, modellino: mini, vistaIniziale: VISTA,
      lente: () => { disegnaLente(); return texLente; },
      frame(dt) { muoviVento(dt); return true; },
    };
    return mondo;
  }

  function comandi(id) {
    let campo = false;
    if (id === 'dove+') s.dove = (s.dove + 1) % 8;
    if (id === 'dove-') s.dove = (s.dove + 7) % 8;
    if (id === 'forza+') { s.forza = Math.min(2, s.forza + 1); campo = true; }
    if (id === 'forza-') { s.forza = Math.max(0, s.forza - 1); campo = true; }
    if (id === 'e:n') s.sud = false;
    if (id === 'e:s') { s.sud = true; lez.completa('emisfero'); }
    if (campo) aggiornaCampo();
    aggiornaNave(); disegnaLente();
    if (s.dove === 4 && !s.sud) lez.completa('sud');
    if (s.forza === 2) lez.completa('fitte');
    Motore.sporco();
  }
  function comandiFronte(id) {
    if (id === 'f+') s.fase = Math.min(2, s.fase + 1);
    if (id === 'f-') s.fase = Math.max(0, s.fase - 1);
    s.visteFronte.add(s.fase);
    if (s.visteFronte.has(2)) lez.completa('fronte');
  }

  /* Sezione del fronte freddo, dalla slide 65 */
  function sezioneFronte(c, x, y, w, h) {
    const f = s.fase; const suolo = y + h - 40; const testa = x + w * (0.2 + f * 0.33);
    c.fillStyle = 'rgba(200,150,43,0.14)'; c.fillRect(x, y, w, h - 40);
    // Aria fredda a cuneo, da sinistra verso destra
    c.fillStyle = 'rgba(46,125,181,0.32)'; c.beginPath(); c.moveTo(x, suolo); c.lineTo(testa, suolo); c.quadraticCurveTo(testa - w * 0.1, y + h * 0.5, x, y + h * 0.16); c.closePath(); c.fill();
    c.strokeStyle = C.ink; c.lineWidth = 5; c.beginPath(); c.moveTo(testa, suolo); c.quadraticCurveTo(testa - w * 0.1, y + h * 0.5, x, y + h * 0.16); c.stroke();
    c.lineWidth = 6; c.beginPath(); c.moveTo(x, suolo); c.lineTo(x + w, suolo); c.stroke();
    c.fillStyle = C.ink; c.font = '700 34px Atkinson, sans-serif'; c.fillText('aria fredda', x + 30, suolo - 26);
    c.fillText('aria calda', x + w - 200, y + 50);
    if (f === 1) {
      // Cumulonembo sopra il fronte, con rovesci
      c.fillStyle = C.carta; c.strokeStyle = C.ink; c.lineWidth = 4;
      [[0, 190, 80], [-70, 140, 62], [70, 140, 62], [0, 70, 72]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(testa + 30 + dx, suolo - dy - 90, r, 0, Math.PI * 2); c.fill(); c.stroke(); });
      c.strokeStyle = C.acqua; c.lineWidth = 4; c.beginPath();
      for (let i = -3; i <= 3; i++) { c.moveTo(testa + 30 + i * 26, suolo - 110); c.lineTo(testa + 16 + i * 26, suolo - 16); }
      c.stroke();
    }
    // Simbolo del fronte freddo: triangoli
    c.fillStyle = C.ink;
    for (let i = 0; i < 3; i++) { const q = testa - 70 + i * 34; c.beginPath(); c.moveTo(q, suolo + 8); c.lineTo(q + 30, suolo + 8); c.lineTo(q + 15, suolo + 34); c.closePath(); c.fill(); }
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { sin: 'A sinistra', des: 'A destra', dav: 'Davanti a te' };
    const TESTO_FASE = [
      'L\'aria fredda avanza velocemente verso l\'aria calda.',
      'L\'aria fredda spinge bruscamente verso l\'alto l\'aria calda: cumulonembi, rovesci, temporali e groppi.',
      'Temperatura in calo, pressione in aumento, cielo che si schiarisce e vento da nord-ovest.',
    ];
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Il tempo e il clima' },
          { t: 'p', testo: 'La **meteorologia** studia i fenomeni fisici dell\'atmosfera. L\'insieme delle condizioni fisiche in un dato istante è il **tempo**. {{slide 4}}' },
          { t: 'p', testo: 'La media degli elementi meteorologici su una regione, per almeno trent\'anni, è il **clima**. {{slide 4}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: 'L\'atmosfera è come un\'enorme macchina termica: trasforma l\'energia del Sole in energia di movimento dell\'aria. {{slide 4}}' },
          { t: 'p', testo: 'Il **vento** nasce dalle differenze di pressione: l\'aria è accelerata dalle zone di alta verso quelle di bassa pressione. {{slide 44}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Sei in coperta, nell\'emisfero nord. Ti metti con le spalle al vento.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Da che parte si trova la bassa pressione?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:sin', testo: 'A sinistra', on: p === 'sin' },
          { t: 'scelta', id: 'p:des', testo: 'A destra', on: p === 'des' },
          { t: 'scelta', id: 'p:dav', testo: 'Davanti a te', on: p === 'dav' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Carta sinottica in rilievo' },
          { t: 'passo', id: 'dove', nome: 'La nave è, rispetto alla bassa, a', valore: DOVE[s.dove] },
          { t: 'passo', id: 'forza', nome: 'Bassa pressione', valore: FORZA[s.forza].nome },
          { t: 'bottoni', h: 84, size: 32, lista: [{ id: 'e:n', testo: 'Emisfero nord', on: !s.sud }, { id: 'e:s', testo: 'Emisfero sud', on: s.sud }] },
          ...lez.missioni().slice(0, 3),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 640,
            testo: !vr ? '' : vera
              ? 'Sei accanto alla carta. Punta una pedana e premi il grilletto per spostarti.'
              : 'Punta la carta, tieni premuto il grilletto e ruota la mano per girarla.',
          },
          ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          { t: 'zona', id: 'lente', h: 300 },
          { t: 'nota', testo: 'Isobare fitte: vento forte. Freccia ocra: il vento sulla nave.' },
        ],
      },
      {
        passo: 2, azione: comandiFronte,
        sx: [
          { t: 'titolo', testo: 'Passa il fronte freddo' },
          { t: 'passo', id: 'f', nome: 'Momento', valore: FASI[s.fase] },
          { t: 'riquadro', size: 38, testo: `${TESTO_FASE[s.fase]} {{slide 65}}` },
          ...lez.missioni().slice(3),
        ],
        dx: [{ t: 'spazio', h: 60 }, { t: 'disegno', h: 760, fn: sezioneFronte }, { t: 'nota', testo: 'Sezione verticale schematica' }],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'sin' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Ovunque tu metta la nave, con le spalle al vento la B resta sulla stessa mano. Nell\'emisfero sud cambia mano.' },
        ],
        dx: [
          { t: 'titolo', testo: 'La regola di Buys Ballot' },
          { t: 'riquadro', size: 44, testo: 'Spalle al vento: bassa a sinistra' },
          { t: 'p', testo: 'Nell\'emisfero nord la bassa pressione si trova a sinistra, un poco in avanti, e l\'alta a destra, un poco indietro. Nell\'emisfero sud è il contrario. {{slide 47}}' },
          { t: 'p', testo: 'Con vento da ovest, dando le spalle all\'ovest si guarda verso est: la bassa è a nord. {{slide 47}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'nota', testo: 'Parte prima' },
          { t: 'titolo', testo: 'L\'atmosfera' },
          { t: 'p', size: 36, testo: 'Aria secca: 78,08% azoto, 20,95% ossigeno, 0,93% argon, circa 0,04% CO₂. Vapore acqueo fino a circa il 4%. {{slide 6}}' },
          { t: 'tabella', col: [34, 66], size: 32, righe: [
            ['Strato', 'Temperatura con la quota'],
            ['Troposfera', 'diminuisce'],
            ['Stratosfera', 'aumenta: l\'ozono assorbe gli ultravioletti'],
            ['Mesosfera', 'diminuisce, fino a circa −90 °C'],
            ['Termosfera', 'cresce ancora'],
          ] },
          { t: 'nota', testo: 'slide 7' },
        ],
        dx: [
          { t: 'titolo', testo: 'L\'atmosfera standard' },
          { t: 'riquadro', size: 38, testo: 'ISA: 15 °C e 1013,25 hPa (760 mmHg) al livello del mare; −6,5 °C ogni 1000 m, fino a circa −56,5 °C a circa 11 km. {{slide 9}}' },
          { t: 'p', size: 38, testo: 'La troposfera è spessa circa 8 km ai poli, 11 km alle medie latitudini, fino a 16–18 km all\'equatore. {{slide 8}}' },
          { t: 'p', size: 38, testo: 'Il Sole invia circa 1370 W/m² (costante solare); circa il 30% è riflesso (albedo). {{slide 11}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Le stagioni' },
          { t: 'p', size: 38, testo: 'L\'asse terrestre è inclinato di circa 23,4°: è la vera causa delle stagioni, non la distanza dal Sole. Il perielio è intorno al 3 gennaio! {{slide 16, 17}}' },
          { t: 'p', size: 38, testo: 'Contano l\'angolo di incidenza dei raggi e la durata del giorno. {{slide 18}}' },
          { t: 'p', size: 38, testo: 'Il periodo più caldo arriva dopo il solstizio per l\'inerzia termica, soprattutto del mare. {{slide 22}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Solstizi ed equinozi' },
          { t: 'tabella', col: [46, 54], size: 32, righe: [
            ['Quando', 'Sole allo zenit su'],
            ['≈ 21 giugno', 'Tropico del Cancro (23,4° N)'],
            ['≈ 21 dicembre', 'Tropico del Capricorno (23,4° S)'],
            ['≈ 21 marzo, 23 settembre', 'equatore'],
          ] },
          { t: 'nota', testo: 'slide 19, 20' },
          { t: 'p', size: 36, testo: 'Effetto serra: senza, circa −18 °C; con, circa +15 °C. Il riscaldamento globale attuale è causato dalle attività umane. Tempo ≠ clima. {{slide 15, 24, 25}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'La temperatura' },
          { t: 'p', size: 38, testo: 'L\'aria è scaldata indirettamente dal suolo. {{slide 31}}' },
          { t: 'formula', testo: 'γ = ΔT / Δz ≈ −0,65 °C / 100 m' },
          { t: 'formula', testo: 'K = °C + 273,15' },
          { t: 'formula', testo: '°F = 9/5 · °C + 32' },
          { t: 'p', size: 36, testo: 'Nell\'**inversione termica** la temperatura aumenta con la quota: l\'aria è molto stabile. {{slide 33, 34}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'La pressione' },
          { t: 'p', size: 36, testo: 'È il peso della colonna d\'aria: Torricelli la misurò nel 1643. {{slide 35}}' },
          { t: 'formula', testo: '1 mmHg ≈ 4/3 hPa' },
          { t: 'p', size: 36, testo: 'Tendenza barometrica: variazione nelle ultime 3 ore. Se scende il tempo tende a peggiorare, se sale a migliorare. {{slide 36, 37}}' },
          { t: 'tabella', col: [30, 35, 35], size: 30, righe: [
            ['', 'Alta (A)', 'Bassa (B)'],
            ['Aria', 'scende', 'sale'],
            ['Vento (nord)', 'orario, debole', 'antiorario, forte'],
            ['Tempo', 'bello', 'perturbato'],
          ] },
          { t: 'nota', testo: 'slide 39' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'nota', testo: 'Parte seconda' },
          { t: 'titolo', testo: 'Le forze sul vento' },
          { t: 'p', size: 36, testo: '**Gradiente barico**: la vera forza motrice. **Coriolis**: devia a destra nell\'emisfero nord, a sinistra nel sud; nulla all\'equatore. **Attrito**. **Centrifuga**, con isobare curve. {{slide 45}}' },
          { t: 'p', size: 36, testo: 'Il **vento geostrofico** è parallelo alle isobare, in quota. Vicino alla superficie l\'attrito lo piega verso la bassa: circa 15° sul mare, fino a circa 40° sulla terraferma. {{slide 46}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'La scala Beaufort' },
          { t: 'tabella', col: [20, 26, 54], size: 30, righe: [
            ['Forza', 'Nodi', 'Denominazione'],
            ['0–1', 'meno di 4', 'Calma, bava di vento'],
            ['2–3', '4–10', 'Brezza leggera, brezza tesa'],
            ['4–5', '11–21', 'Vento moderato, vento teso'],
            ['6–7', '22–33', 'Vento fresco, vento forte'],
            ['8–9', '34–47', 'Burrasca, burrasca forte'],
            ['10–11', '48–63', 'Tempesta, tempesta violenta'],
            ['12', '64 e oltre', 'Uragano'],
          ] },
          { t: 'nota', testo: 'slide 49' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'La circolazione' },
          { t: 'tabella', col: [36, 64], size: 32, righe: [
            ['Cella', 'Dove'],
            ['Hadley', 'dall\'equatore a 30° circa'],
            ['Ferrel', '30°–60° circa: venti da ovest'],
            ['Polare', 'da 60° circa ai poli'],
          ] },
          { t: 'nota', testo: 'slide 54' },
          { t: 'p', size: 36, testo: 'Alisei: da nord-est nell\'emisfero nord, da sud-est nel sud. Correnti a getto (*jet stream*), anche oltre 200 km/h. {{slide 55}}' },
          { t: 'p', size: 36, testo: 'Brezza di mare di giorno, brezza di terra di notte. {{slide 51}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Umidità e nubi' },
          { t: 'formula', testo: 'Ur = e / E × 100 %' },
          { t: 'p', size: 36, testo: 'Il **punto di rugiada** è la temperatura a cui l\'aria diventa satura. {{slide 58}}' },
          { t: 'tabella', col: [34, 66], size: 30, righe: [
            ['Nubi', 'Generi'],
            ['Alte', 'cirri, cirrocumuli, cirrostrati'],
            ['Medie', 'altocumuli, altostrati'],
            ['Basse', 'stratocumuli, strati, nembostrati'],
            ['Verticali', 'cumuli e cumulonembi'],
          ] },
          { t: 'nota', testo: 'slide 60' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'I fronti' },
          { t: 'tabella', col: [24, 38, 38], size: 30, righe: [
            ['', 'Caldo', 'Freddo'],
            ['Aria', 'avanza e sale lentamente', 'avanza veloce, spinge in alto'],
            ['Nubi', 'cirri … nembostrati', 'cumulonembi'],
            ['Pioggia', 'continua e debole', 'rovesci, temporali, groppi'],
            ['Simbolo', 'semicerchi', 'triangoli'],
          ] },
          { t: 'nota', testo: 'slide 65' },
          { t: 'p', size: 36, testo: 'Il fronte freddo raggiunge quello caldo: nasce il **fronte occluso**. {{slide 66}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Nebbia e carta sinottica' },
          { t: 'p', size: 36, testo: 'La nebbia riduce la visibilità sotto 1 km. Quella tipica del mare è la **nebbia di avvezione**: aria calda e umida su una superficie più fredda. {{slide 61}}' },
          { t: 'p', size: 36, testo: 'Sulla **carta sinottica** si individuano A, B e fronti; dalle isobare, ogni 4 hPa, si stima il vento e con Buys Ballot la direzione. {{slide 67}}' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'titolo', testo: 'Esercizi' }, ...lez.calcoloSx()],
        dx: [...lez.calcoloDx()],
      },
      {
        passo: 4,
        sx: [{ t: 'titolo', testo: 'Esercizio 3' }, ...lez.domanda(3)],
        dx: [
          { t: 'titolo', testo: 'Per il ripasso' },
          { t: 'p', size: 36, testo: 'Perché nell\'emisfero nord fa freddo a gennaio anche se la Terra è più vicina al Sole?' },
          { t: 'p', size: 36, testo: 'Quali sono gli strati dell\'atmosfera e come varia la temperatura in ciascuno?' },
          { t: 'p', size: 36, testo: 'Quali sono le differenze tra fronte caldo e fronte freddo?' },
          { t: 'nota', testo: 'Altre domande alla slide 69' },
        ],
      },
      lez.premio(() => lez.fatto.quiz([1, 2, 3, 4])),
    ];
  });
})();
