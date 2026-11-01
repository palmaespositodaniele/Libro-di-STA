/* Lezione 11: il timone. Formule e valori dalle slide 8-27. La forza F non ha valori nelle slide:
   traiettoria e lunghezza delle frecce sono schematiche, con le tendenze della slide 25 */
(function () {
  const N = 11;
  const { COL, etichetta, pedana } = Tavola;
  const { C } = Pagina;
  const { L } = Scafo;

  const MISSIONI = [
    { id: 'ferma', testo: 'A nave ferma, metti barra: che cosa succede?' },
    { id: 'stallo', testo: 'A velocità alta confronta 30° e 40° di barra.' },
    { id: 'becker', testo: 'Confronta timone normale e timone Becker.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'La componente trasversale della forza sul timone è…', scelte: ['X = F · sin α', 'Y = F · cos α', 'MT = F · GC'], giusta: 1, perche: 'Y = F · cos α fa ruotare la nave intorno a un asse verticale.' },
    { n: 2, testo: 'La componente X della forza…', scelte: ['Fa rallentare la nave', 'Fa accelerare la nave', 'Non ha effetti'], giusta: 0, perche: 'Si oppone al moto in avanti e causa anche un leggero appruamento.' },
    { n: 3, testo: 'All\'inizio dell\'accostata la nave si inclina…', scelte: ['Sul lato dell\'accostata', 'Sul lato opposto', 'Non si inclina'], giusta: 0, perche: 'È lo sbandamento di saluto; poi si inclina dal lato opposto.' },
    { n: 4, testo: 'Il grado di compenso non supera normalmente…', scelte: ['0,10', '0,30', '0,50'], giusta: 1, perche: 'Non è mai superiore a 0,30 per motivi di stabilità idrodinamica.' },
    { n: 5, testo: 'L\'angolo di stallo dei timoni tradizionali è intorno a…', scelte: ['15°', '35°', '60°'], giusta: 1, perche: 'Si aggira intorno ai 35°.' },
    { n: 6, testo: 'Il flap del timone Becker si inclina…', scelte: ['Della metà dell\'angolo di barra', 'Dello stesso angolo', 'Di circa il doppio'], giusta: 2, perche: 'Di un angolo pressoché doppio dell\'angolo di barra.' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });

  const VEL = [{ nome: 'Nave ferma', v: 0 }, { nome: 'Bassa', v: 8 }, { nome: 'Media', v: 13 }, { nome: 'Alta', v: 18 }];
  const s = { alfa: 0, vel: 2, tipo: 'normale', x: 0, z: 0, psi: 0, salute: 0, tScia: 0, prove: new Set() };
  const STALLO = { normale: 35, becker: 45 }; // 35° dalla slide 25; per il Becker le slide dicono solo «angoli maggiori»

  // Efficacia schematica: cresce con la barra fino allo stallo, poi cade (slide 25)
  function efficacia(a, tipo) {
    const m = Math.abs(a); const st = STALLO[tipo || s.tipo];
    const e = m <= st ? m / 35 : (st / 35) * Math.max(0.3, 1 - (m - st) / 8);
    return e * (tipo === 'becker' || s.tipo === 'becker' ? 1.25 : 1);
  }
  const forza = () => (VEL[s.vel].v / 18) ** 2 * efficacia(s.alfa);
  const rad = (g) => (g * Math.PI) / 180;

  /* Pala del timone, con flap per il Becker */
  function timone(k) {
    const g = new THREE.Group(); g.position.set(-1.6, 0, 0);
    const carta = new THREE.MeshBasicMaterial({ color: COL.scafo, side: THREE.DoubleSide });
    const lamina = (l, h) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, 0.3 * Math.max(1, k * 0.5)), carta);
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: COL.inchiostro })));
      return m;
    };
    const pala = new THREE.Group();
    const corpo = lamina(4, 4.4); corpo.position.set(-1.4, 2.4, 0);
    pala.add(corpo);
    const perno = new THREE.Group(); perno.position.set(-3.4, 2.4, 0);
    const flap = lamina(1.3, 4.4); flap.position.x = -0.65;
    perno.add(flap);
    pala.add(perno);
    g.add(pala);
    return { g, pala, perno };
  }

  /* Forze sul timone, viste dall'alto: frecce e pala sulla pagina */
  const LW = 1040; const LH = 400;
  const telaLente = document.createElement('canvas');
  telaLente.width = LW; telaLente.height = LH;
  const texLente = new THREE.CanvasTexture(telaLente);
  texLente.colorSpace = THREE.SRGBColorSpace;

  function freccia(c, x0, y0, x1, y1, col, nome) {
    if (Math.hypot(x1 - x0, y1 - y0) < 6) return;
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 7;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    const a = Math.atan2(y1 - y0, x1 - x0);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - 22 * Math.cos(a - 0.4), y1 - 22 * Math.sin(a - 0.4)); c.lineTo(x1 - 22 * Math.cos(a + 0.4), y1 - 22 * Math.sin(a + 0.4)); c.closePath(); c.fill();
    c.font = '700 40px Atkinson, sans-serif'; c.fillText(nome, x1 + 10 * Math.sign(x1 - x0 || 1), y1 + (y1 < y0 ? -8 : 34));
  }
  function disegnaLente() {
    const c = telaLente.getContext('2d'); const a = rad(s.alfa);
    c.fillStyle = C.carta; c.fillRect(0, 0, LW, LH);
    c.fillStyle = C.ink2; c.font = '30px Disegno, cursive'; c.textAlign = 'left';
    c.fillText('dall\'alto, prua a destra', 18, 36);
    c.fillText('frecce schematiche', 18, LH - 16);
    // Poppa della nave
    const ax = 560; const ay = LH / 2 - 6;
    c.strokeStyle = C.ink; c.lineWidth = 6; c.beginPath();
    c.moveTo(LW - 10, ay - 120); c.lineTo(ax + 120, ay - 120); c.quadraticCurveTo(ax + 40, ay - 90, ax + 30, ay);
    c.quadraticCurveTo(ax + 40, ay + 90, ax + 120, ay + 120); c.lineTo(LW - 10, ay + 120); c.stroke();
    c.setLineDash([12, 9]); c.strokeStyle = C.ink2; c.lineWidth = 3; c.beginPath(); c.moveTo(60, ay); c.lineTo(LW, ay); c.stroke(); c.setLineDash([]);
    c.fillStyle = C.ink2; c.font = '28px Disegno, cursive'; c.fillText('dritta', LW - 100, ay + 158); c.fillText('sinistra', LW - 120, ay - 134);
    // Pala: con barra a dritta la coda va verso dritta
    const lp = 190;
    const bx = ax - lp * Math.cos(a); const by = ay + lp * Math.sin(a);
    c.strokeStyle = C.ink; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
    if (s.tipo === 'becker') {
      const f = 80;
      c.strokeStyle = C.ocra; c.lineWidth = 12; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - f * Math.cos(2 * a), by + f * Math.sin(2 * a)); c.stroke();
    }
    c.lineCap = 'butt';
    c.fillStyle = C.ink; c.beginPath(); c.arc(ax, ay, 12, 0, Math.PI * 2); c.fill();
    // Forza F sul centro di pressione: componenti come alla slide 11
    const F = forza() * 150; const cx = ax - lp * 0.45 * Math.cos(a); const cy = ay + lp * 0.45 * Math.sin(a);
    const segno = Math.sign(s.alfa);
    const Y = F * Math.cos(a) * segno; const X = F * Math.abs(Math.sin(a));
    freccia(c, cx, cy, cx, cy - Y, C.ocraT, 'Y');
    freccia(c, cx, cy, cx - X, cy, C.rosso, 'X');
    c.strokeStyle = C.ink; c.lineWidth = 4; c.strokeRect(2, 2, LW - 4, LH - 4);
    texLente.needsUpdate = true;
  }

  /* Modello --------------------------------------------------------------------------- */
  const copie = [];
  function copia(k) {
    const nave = new THREE.Group();     // posizione e prora
    const rollio = new THREE.Group();   // sbandamento
    const scafo = Scafo.crea(k);
    scafo.position.set(-L / 2, -6, 0);
    const t = timone(k);
    t.g.position.y = -6;
    t.g.position.x = -L / 2 - 1.6;
    rollio.add(scafo, t.g);
    nave.add(rollio);
    const NS = 110;
    const scia = new THREE.InstancedMesh(new THREE.CylinderGeometry(k > 1 ? 7 : 4, k > 1 ? 7 : 4, 0.4, 10), new THREE.MeshBasicMaterial({ color: COL.ocra }), NS);
    scia.frustumCulled = false;
    const m = new THREE.Matrix4().makeTranslation(0, -500, 0);
    for (let i = 0; i < NS; i++) scia.setMatrixAt(i, m);
    copie.push({ nave, rollio, t, scia });
    return { nave, scia };
  }
  let iScia = 0;

  function mettiPunto() {
    const m = new THREE.Matrix4().makeTranslation(s.x, 0.3, s.z);
    copie.forEach((c) => { c.scia.setMatrixAt(iScia, m); c.scia.instanceMatrix.needsUpdate = true; });
    iScia = (iScia + 1) % 110;
  }
  function azzeraScia() {
    const m = new THREE.Matrix4().makeTranslation(0, -500, 0);
    copie.forEach((c) => { for (let i = 0; i < 110; i++) c.scia.setMatrixAt(i, m); c.scia.instanceMatrix.needsUpdate = true; });
    iScia = 0;
  }

  const VISTA = () => ({ target: new THREE.Vector3(0, 0, 0), theta: 0.5, phi: 0.72, r: 300 });
  let mondo = null;

  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    const a = copia(1);
    const mare = Scafo.mare(); mare.position.x = -L / 2;
    radice.add(a.nave, a.scia, mare);
    const stazioni = [
      { pedana: pedana(-45, 13, 'vicino al timone'), pos: new THREE.Vector3(-45, 0.25, 13), yaw: 0 },
      { pedana: pedana(-72, 0, 'dietro la poppa'), pos: new THREE.Vector3(-72, 0.25, 0), yaw: -Math.PI / 2 },
      { pedana: pedana(0, 26, 'a dritta'), pos: new THREE.Vector3(0, 0.25, 26), yaw: 0 },
    ];
    stazioni.forEach((st) => { st.pedana.visible = false; });

    // Modellino: nave piccola su un grande specchio d'acqua, per vedere la traiettoria
    const SC = 0.0029; const mini = new THREE.Group();
    const b = copia(16);
    const disco = new THREE.Mesh(new THREE.CircleGeometry(190, 64), new THREE.MeshBasicMaterial({ color: COL.acqua, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }));
    disco.rotation.x = -Math.PI / 2;
    const bordo = new THREE.Mesh(new THREE.RingGeometry(187, 190, 64), new THREE.MeshBasicMaterial({ color: COL.acqua, side: THREE.DoubleSide }));
    bordo.rotation.x = -Math.PI / 2;
    mini.add(b.nave, b.scia, disco, bordo);
    const e = etichetta('la scia mostra la traiettoria', 22); e.position.set(0, 26, -190); mini.add(e);
    mini.scale.setScalar(SC); mini.position.y = -0.05;

    mondo = {
      radice, stazioni, modellino: mini, vistaIniziale: VISTA,
      lente: () => { disegnaLente(); return texLente; },
      frame(dt) {
        const a0 = rad(s.alfa);
        const fermiVera = Motore.presente() && Motore.scalaVera();
        const v = fermiVera ? 0 : VEL[s.vel].v * (1 - 0.3 * Math.abs(Math.sin(a0)) * (s.vel ? 1 : 0)); // X rallenta la nave
        const r = fermiVera ? 0 : -Math.sign(s.alfa) * efficacia(s.alfa) * v * v * 0.0004;
        s.psi += r * dt;
        s.x += Math.cos(s.psi) * v * dt; s.z -= Math.sin(s.psi) * v * dt;
        if (fermiVera) { s.x = 0; s.z = 0; s.psi = 0; }
        if (Math.hypot(s.x, s.z) > 175) { s.x = 0; s.z = 0; azzeraScia(); }
        s.tScia += v * dt;
        if (s.tScia > 22) { s.tScia = 0; mettiPunto(); }
        // Sbandamento di saluto sul lato dell'accostata, poi dal lato opposto (slide 15, 16)
        s.salute *= Math.exp(-dt * 0.7);
        const roll = fermiVera ? 0 : s.salute * 0.1 - Math.sign(r) * Math.min(0.08, Math.abs(r) * 0.7);
        copie.forEach((c) => {
          c.nave.position.set(s.x, 0, s.z); c.nave.rotation.y = s.psi;
          c.rollio.rotation.x = roll;
          c.t.pala.rotation.y = rad(s.alfa);
          c.t.perno.visible = s.tipo === 'becker';
          c.t.perno.rotation.y = rad(s.alfa);
        });
        if (!Motore.presente()) Motore.vista({ target: new THREE.Vector3(s.x, 0, s.z) });
        return true;
      },
    };
    return mondo;
  }

  function comandi(id) {
    const prima = s.alfa;
    if (id === 'a+') s.alfa = Math.min(45, s.alfa + 5);
    if (id === 'a-') s.alfa = Math.max(-45, s.alfa - 5);
    if (id === 'a0') s.alfa = 0;
    if (id === 'vel+') s.vel = Math.min(3, s.vel + 1);
    if (id === 'vel-') s.vel = Math.max(0, s.vel - 1);
    if (id === 't:normale' || id === 't:becker') { s.tipo = id.slice(2); s.prove.add(s.tipo); if (s.prove.has('normale') && s.prove.has('becker')) lez.completa('becker'); }
    if (id === 'scia') { azzeraScia(); s.x = 0; s.z = 0; s.psi = 0; }
    if (s.alfa !== prima) s.salute = Math.sign(s.alfa - prima) || 0;
    if (s.vel === 0 && s.alfa !== 0) lez.completa('ferma');
    const m = Math.abs(s.alfa);
    if (s.vel === 3 && m === 30) s.prove.add('30');
    if (s.vel === 3 && m === 40) s.prove.add('40');
    if (s.prove.has('30') && s.prove.has('40')) lez.completa('stallo');
    disegnaLente();
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { si: 'Sì, sempre', fino: 'Solo fino all\'angolo di stallo', no: 'No, la virata non cambia' };
    const m = Math.abs(s.alfa); const st = STALLO[s.tipo];
    const lato = s.alfa > 0 ? ' a dritta' : s.alfa < 0 ? ' a sinistra' : '';
    const giudizio = s.vel === 0 ? 'Nave ferma: effetto evolutivo assente.' : m === 0 ? 'Timone al centro: la nave va dritta.' : m > st ? '**Oltre l\'angolo di stallo**: l\'efficacia cade.' : `Efficacia in aumento, fino allo stallo intorno ai ${s.tipo === 'normale' ? '35°' : 'valori maggiori'}.`;
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Il timone' },
          { t: 'p', testo: 'Il **timone** è l\'organo che consente di variare la prora della nave e di controllarne il movimento. {{slide 6}}' },
          { t: 'p', testo: 'Si compone di una pala immersa, posta a poppavia dell\'elica, che può essere ruotata dell\'**angolo di barra** α (*rudder angle*). {{slide 6, 9}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: 'Sezionando la pala con piani perpendicolari all\'asse di rotazione si ottengono dei profili alari. {{slide 6}}' },
          { t: 'p', testo: 'Quando la pala forma un angolo con i filetti fluidi si genera una forza netta (*rudder force*) che fa ruotare la nave. {{slide 10}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Il timone è a 20° di barra. Lo porti a 40°: l\'angolo è raddoppiato.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Raddoppiare l\'angolo raddoppia la virata?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:si', testo: 'Sì, sempre', on: p === 'si' },
          { t: 'scelta', id: 'p:fino', testo: 'Solo fino a un certo angolo', on: p === 'fino' },
          { t: 'scelta', id: 'p:no', testo: 'No, la virata non cambia', on: p === 'no' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'passo', id: 'a', nome: 'Angolo di barra α', valore: `${m}°${lato}` },
          { t: 'passo', id: 'vel', nome: 'Velocità della nave', valore: VEL[s.vel].nome },
          { t: 'bottoni', h: 84, size: 32, lista: [{ id: 't:normale', testo: 'Timone normale', on: s.tipo === 'normale' }, { id: 't:becker', testo: 'Timone Becker', on: s.tipo === 'becker' }] },
          { t: 'bottoni', h: 84, size: 32, lista: [{ id: 'a0', testo: 'Barra al centro' }, { id: 'scia', testo: 'Cancella la scia' }] },
          { t: 'riquadro', size: 36, testo: giudizio },
          ...lez.missioni(),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 610,
            testo: !vr ? '' : vera
              ? 'Qui la nave resta ferma: guarda muoversi il timone. Punta una pedana e premi il grilletto.'
              : 'La scia mostra la traiettoria. Punta il modellino, tieni premuto il grilletto e ruota la mano.',
          },
          ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          { t: 'zona', id: 'lente', h: 400 },
          { t: 'nota', testo: 'Traiettoria schematica' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'fino' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Oltre un certo angolo la scia si apre invece di stringersi: più barra non significa più virata.' },
          { t: 'nota', testo: 'Le slide non danno una legge numerica: la virata del modello è schematica' },
        ],
        dx: [
          { t: 'titolo', testo: 'Solo fino allo stallo' },
          { t: 'p', testo: 'L\'efficacia del timone aumenta con l\'angolo di barra fino all\'**angolo di stallo**, intorno ai 35° per i timoni tradizionali, come per le ali di un aereo. {{slide 25}}' },
          { t: 'p', testo: 'Gli effetti evolutivi massimi si ottengono per angoli di barra pari a 30-35°. {{slide 10}}' },
          { t: 'p', testo: 'L\'effetto è assente a nave ferma, moderato a bassa velocità e cresce rapidamente con la velocità. {{slide 25}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'La forza sul timone' },
          { t: 'p', size: 38, testo: 'Sul centro di pressione C della pala si genera una forza F, con due componenti. {{slide 11}}' },
          { t: 'formula', testo: 'X = F · sin α' },
          { t: 'p', size: 38, testo: 'Componente longitudinale: si oppone al moto e rallenta la nave. {{slide 11, 12}}' },
          { t: 'formula', testo: 'Y = F · cos α' },
          { t: 'p', size: 38, testo: 'Componente trasversale: fa ruotare la nave intorno a un asse verticale. {{slide 11}}' },
          { t: 'formula', testo: 'MT = F · cos α · GC' },
          { t: 'p', size: 38, testo: 'Momento evolutivo rispetto al baricentro G. {{slide 11}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Gli effetti' },
          { t: 'p', testo: 'La **variazione della prora** (accostata): l\'effetto desiderato. {{slide 18}}' },
          { t: 'p', testo: 'Lo **sbandamento di saluto**, sul lato dell\'accostata; poi la nave si inclina sul lato opposto, per la forza centrifuga. {{slide 15, 16, 18}}' },
          { t: 'p', testo: 'Un **moto di deriva**, dalla parte opposta all\'accostata. {{slide 13}}' },
          { t: 'p', testo: 'Un **rallentamento** e un leggero **appruamento**. {{slide 17, 18}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Timone compensato' },
          { t: 'p', size: 38, testo: 'Se parte della pala sta a proravia dell\'asse di rotazione, il timone è **compensato** (*balanced rudder*). Si riducono i carichi torsionali sull\'asta. {{slide 7, 8}}' },
          { t: 'p', size: 38, testo: 'Il **grado di compenso** (*balance ratio*) è il rapporto tra l\'area di pala a proravia dell\'asse e l\'area totale. {{slide 7}}' },
          { t: 'riquadro', size: 36, testo: 'Mai superiore a 0,30. Normalmente 0,10 per navi da carico, 0,20-0,25 per navi passeggeri. {{slide 8}}' },
          { t: 'p', size: 36, testo: 'L\'area della pala è tra l\'1% e il 3,5% della proiezione longitudinale dell\'opera viva. {{slide 9}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Tipi di timone' },
          { t: 'tabella', col: [58, 42], size: 32, righe: [
            ['Tipo', 'Note'],
            ['Non compensato a semplice lamiera (*unbalanced single plate rudder*)', 'il più semplice; agugliotti'],
            ['Compensato con appoggio su calcagnolo (*balanced bolt axle rudder*)', 'compenso 25-30%; navi medie'],
            ['Semi-compensato con appoggio su pinna (*semi-balanced Mariner-type rudder*)', 'sotto il 20%; navi grandi'],
            ['A spada sospeso (*balanced spade-type rudder*)', 'fino al 30%; navi medio-piccole'],
          ] },
          { t: 'nota', testo: 'slide 19–23' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'L\'impianto di governo' },
          { t: 'p', size: 38, testo: 'L\'impianto di governo (*steering system*) consente il brandeggio del timone a distanza. {{slide 2}}' },
          { t: 'p', size: 38, testo: 'Dalla ruota di governo (*steering wheel*), nella stazione di governo, il comando va al **telemotore**, che controlla l\'unità di potenza (*power unit*). {{slide 2, 4}}' },
          { t: 'p', size: 38, testo: 'L\'unità di potenza aziona l\'agghiaccio (*rudder actuator*), che fa ruotare il timone (*helm*). {{slide 4}}' },
        ],
        dx: [
          { t: 'sotto', testo: 'Le due unità di potenza' },
          { t: 'tabella', col: [28, 36, 36], size: 34, righe: [
            ['Unità', 'Rotazione', 'Condizioni'],
            ['Primaria', 'da -35° a +30° in massimo 28 s', 'alla massima velocità'],
            ['Secondaria', 'da -15° a +15° in massimo 60 s', 'a una velocità massima di 7 kn'],
          ] },
          { t: 'nota', testo: 'slide 24' },
          { t: 'titolo', testo: 'Timone Becker' },
          { t: 'p', size: 38, testo: 'All\'estremità poppiera ha un alettone (*flap*) che ruota insieme alla pala, di un angolo pressoché doppio dell\'angolo di barra. {{slide 27}}' },
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
