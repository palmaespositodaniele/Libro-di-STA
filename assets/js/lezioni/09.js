/* Lezione 9: dimensioni geometriche dello scafo. Formule, valori tipici ed esercizi dalle slide 21-38.
   Le immersioni della nave disegnata le sceglie lo studente: non sono dati */
(function () {
  const N = 9;
  const { COL, tratto, etichetta, pedana } = Tavola;
  const { C } = Pagina;
  const { ascissa, L } = Scafo;

  const MISSIONI = [
    { id: 'poppa', testo: 'Carica a poppa finché TA supera TF: leggi il TRIM.' },
    { id: 'lettura', testo: 'Porta TF a 4,90 m: è la lettura della slide 26.' },
    { id: 'cb', testo: 'Confronta CB 0,85 e CB 0,50.' },
  ];
  const CALCOLI = [
    { n: 1, testo: 'Calcola il volume di carena di una nave RO-RO: LWL = 192 m, BWL = 32 m, T = 6,8 m, CB = 0,72.', campi: [['∇', 30081.024, 0.6, 'm³']], soluzione: '∇ = 192 · 32 · 6,8 · 0,72 = 30 081,024 m³' },
    { n: 2, testo: 'Calcola assetto e immersione media: TA = 8,4 m, TF = 7,6 m.', campi: [['TRIM', 0.8, 0.001, 'm'], ['Tm', 8, 0.001, 'm']], soluzione: 'TRIM = 8,4 – 7,6 = 0,8 m; Tm = (8,4 + 7,6) / 2 = 8,0 m' },
    { n: 3, testo: 'Calcola il coefficiente della figura di galleggiamento: LWL = 180 m, BWL = 30 m, AW = 4 590 m².', campi: [['CWP', 0.85, 0.001, '']], soluzione: 'CWP = 4 590 / (180 · 30) = 0,85' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, calcoli: CALCOLI });

  const s = { ta: 6, tf: 6, cb: 0.72, vistiCb: new Set() };
  const virgola = (v, d = 2) => v.toFixed(d).replace('.', ',');
  const interoSpaziato = (v) => v.toFixed(3).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))(?=.*,)/g, ' ');
  const trim = () => s.ta - s.tf;
  const media = () => (s.ta + s.tf) / 2;

  /* Scale dei pescaggi: numeri ogni 20 cm, alti 10 cm, la base indica il valore (slide 24) */
  const LW = 1040; const LH = 440; const PX_M = 380;
  const telaLente = document.createElement('canvas');
  telaLente.width = LW; telaLente.height = LH;
  const texLente = new THREE.CanvasTexture(telaLente);
  texLente.colorSpace = THREE.SRGBColorSpace;
  const vis = { ta: 6, tf: 6 };

  function scala(c, cx, nome, t) {
    const y0 = LH / 2 + 10;
    c.font = `700 ${Math.round(0.1 * PX_M * 1.25)}px Atkinson, sans-serif`;
    c.textAlign = 'left'; c.fillStyle = C.ink;
    const base = Math.round(t * 5) / 5;
    for (let k = -2; k <= 2; k++) {
      const v = base + k * 0.2;
      const y = y0 - (v - t) * PX_M;
      const dm = Math.round(v * 10);
      c.fillText(dm % 10 === 0 ? `${dm / 10} m` : String(dm % 10), cx - 40, y);
    }
    c.fillStyle = C.ink2; c.font = '32px Disegno, cursive'; c.fillText(nome, cx - 110, 38);
    c.fillStyle = C.ink; c.font = '700 40px Atkinson, sans-serif'; c.fillText(`${virgola(t)} m`, cx + 110, y0 - 12);
  }
  function disegnaLente() {
    const c = telaLente.getContext('2d');
    c.fillStyle = C.carta; c.fillRect(0, 0, LW, LH);
    scala(c, 230, 'scala a poppa (TA)', vis.ta);
    scala(c, 730, 'scala a prua (TF)', vis.tf);
    c.fillStyle = 'rgba(46,125,181,0.32)'; c.fillRect(0, LH / 2 + 10, LW, LH);
    c.fillStyle = C.acqua; c.fillRect(0, LH / 2 + 8, LW, 4);
    c.strokeStyle = C.ink; c.lineWidth = 4; c.strokeRect(2, 2, LW - 4, LH - 4);
    texLente.needsUpdate = true;
  }

  /* Forma con la stessa frazione del rettangolo: il valore di CB, a vista */
  function areaSuperellisse(n) {
    let a = 0; const M = 200;
    for (let i = 0; i < M; i++) { const x = (i + 0.5) / M; a += (1 - x ** n) ** (1 / n); }
    return a / M;
  }
  function esponente(cb) {
    let lo = 0.9; let hi = 12;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (areaSuperellisse(m) < cb) lo = m; else hi = m; }
    return lo;
  }
  function schemaCb(c, x, y, w, h) {
    const rx = w / 2 - 6; const ry = h / 2 - 8; const cx = x + w / 2; const cy = y + h / 2; const n = esponente(s.cb);
    c.fillStyle = C.carta; c.fillRect(cx - rx, cy - ry, 2 * rx, 2 * ry);
    c.strokeStyle = C.ocra; c.lineWidth = 5; c.strokeRect(cx - rx, cy - ry, 2 * rx, 2 * ry);
    c.fillStyle = 'rgba(74,118,168,0.32)'; c.strokeStyle = C.ink; c.lineWidth = 5; c.beginPath();
    for (let i = 0; i <= 200; i++) {
      const a = (i / 200) * Math.PI * 2;
      const px = Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** (2 / n);
      const py = Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** (2 / n);
      if (i === 0) c.moveTo(cx + px * rx, cy + py * ry); else c.lineTo(cx + px * rx, cy + py * ry);
    }
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = C.ink; c.font = '700 54px Atkinson, sans-serif'; c.textAlign = 'center'; c.fillText(`CB = ${virgola(s.cb)}`, cx, cy + 18); c.textAlign = 'left';
  }

  /* Modello ---------------------------------------------------------------------------- */
  const copie = [];
  function copia(k) {
    const perno = new THREE.Group(); perno.position.set(L / 2, 0, 0);
    const nave = Scafo.crea(k);
    nave.position.set(-L / 2, -6, 0);
    const fp = ascissa(1, 6);
    [[0, 'AP'], [fp / 2, 'MP'], [fp, 'FP']].forEach(([x, nome]) => {
      nave.add(tratto([new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, 8, 0), new THREE.Vector3(x, 16, 0)], 0.1 * k, COL.ocra));
      const e = etichetta(nome, k > 1 ? 7 : 4);
      e.position.set(x, 19, 0);
      nave.add(e);
    });
    perno.add(nave);
    copie.push({ perno, nave });
    return perno;
  }

  const VISTA = () => ({ target: new THREE.Vector3(45, 3, 0), theta: 0.15, phi: 1.42, r: 124 });
  let mondo = null;

  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    radice.add(copia(1), Scafo.mare());
    const stazioni = [
      { pedana: pedana(45, 26, 'a dritta'), pos: new THREE.Vector3(45, 0.25, 26), yaw: 0 },
      { pedana: pedana(90, 22, 'a prua'), pos: new THREE.Vector3(90, 0.25, 22), yaw: 0 },
      { pedana: pedana(4, 22, 'a poppa'), pos: new THREE.Vector3(4, 0.25, 22), yaw: 0 },
    ];
    stazioni.forEach((st) => { st.pedana.visible = false; });
    const SC = 0.012; const mini = new THREE.Group();
    mini.add(copia(7), Scafo.vasca());
    mini.scale.setScalar(SC); mini.position.set(-45 * SC, 0, 0);
    let chiave = '';
    mondo = {
      radice, stazioni, modellino: mini, vistaIniziale: VISTA,
      lente: () => { disegnaLente(); return texLente; },
      frame(dt) {
        const k = 1 - Math.exp(-dt * 3);
        vis.ta += (s.ta - vis.ta) * k; vis.tf += (s.tf - vis.tf) * k;
        if (Math.abs(s.ta - vis.ta) < 0.0005) vis.ta = s.ta;
        if (Math.abs(s.tf - vis.tf) < 0.0005) vis.tf = s.tf;
        const nuova = `${vis.ta}|${vis.tf}`;
        if (nuova === chiave) return false;
        chiave = nuova;
        const fp = ascissa(1, 6);
        copie.forEach((c) => {
          c.nave.position.y = -(vis.ta + vis.tf) / 2;
          c.perno.rotation.z = Math.atan2(vis.ta - vis.tf, fp); // scala vera: l'assetto si legge sulle scale
        });
        disegnaLente();
        return true;
      },
    };
    return mondo;
  }

  function comandi(id) {
    const passo = 0.05; const lim = (v) => Math.min(6.6, Math.max(4.5, Math.round(v * 100) / 100));
    if (id === 'ta+') s.ta = lim(s.ta + passo);
    if (id === 'ta-') s.ta = lim(s.ta - passo);
    if (id === 'tf+') s.tf = lim(s.tf + passo);
    if (id === 'tf-') s.tf = lim(s.tf - passo);
    if (s.ta > s.tf) lez.completa('poppa');
    if (Math.abs(s.tf - 4.9) < 0.001) lez.completa('lettura');
  }
  function comandiCb(id) {
    if (!id.startsWith('b:')) return;
    s.cb = Number(id.slice(2));
    s.vistiCb.add(s.cb);
    if (s.vistiCb.has(0.85) && s.vistiCb.has(0.5)) lez.completa('cb');
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { poppa: 'Quello di poppa', prua: 'Quello di prua', uguali: 'Tutti e due uguali' };
    const t = trim();
    const stato = Math.abs(t) < 0.001 ? 'assetto nullo: *on even keel*' : t > 0 ? 'poppa più immersa della prua' : 'prua più immersa della poppa';
    const volume = 192 * 32 * 6.8 * s.cb;
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Le misure dello scafo' },
          { t: 'p', testo: 'Una nave ha linee curve e un fondo che può non essere orizzontale: per descriverla servono molte misure. {{slide 3}}' },
          { t: 'p', testo: 'Si parte dalle **linee di riferimento**: rette verticali e orizzontali rispetto alle quali si misura tutto il resto. {{slide 3}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: '**AP** (*aft perpendicular*): perpendicolare addietro, limite poppiero della lunghezza. {{slide 6}}' },
          { t: 'p', testo: '**FP** (*forward perpendicular*): perpendicolare avanti, limite prodiero. {{slide 7}}' },
          { t: 'p', testo: '**MP** (*midship perpendicular*): equidistante dalle altre due. Lì si trova la sezione maestra. {{slide 7}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'Sulla nave si imbarca altro carico, tutto verso poppa.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Se carichi a poppa, quale pescaggio aumenta?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:poppa', testo: 'Quello di poppa', on: p === 'poppa' },
          { t: 'scelta', id: 'p:prua', testo: 'Quello di prua', on: p === 'prua' },
          { t: 'scelta', id: 'p:uguali', testo: 'Tutti e due uguali', on: p === 'uguali' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Carica la nave' },
          { t: 'passo', id: 'ta', nome: 'Carico a poppa: TA', valore: `${virgola(s.ta)} m` },
          { t: 'passo', id: 'tf', nome: 'Carico a prua: TF', valore: `${virgola(s.tf)} m` },
          { t: 'formula', testo: `TRIM = TA – TF = ${virgola(t)} m` },
          { t: 'formula', testo: `Tm = (TA + TF) / 2 = ${virgola(media(), 3)} m` },
          { t: 'p', size: 36, testo: stato },
          ...lez.missioni().slice(0, 2),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 560,
            testo: !vr ? '' : vera
              ? 'La nave è davanti a te. Punta una pedana e premi il grilletto per spostarti.'
              : 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.',
          },
          ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          { t: 'zona', id: 'lente', h: 430 },
          { t: 'nota', testo: 'Numeri ogni 20 cm, alti 10 cm: la base indica il valore. Se l\'acqua taglia a metà un numero, il pescaggio supera di circa 5 cm il valore di quel numero (slide 24). Disegno schematico, assetto in scala vera.' },
        ],
      },
      {
        passo: 2, azione: comandiCb,
        sx: [
          { t: 'titolo', testo: 'Nave tozza, nave snella' },
          { t: 'p', testo: 'CB dice quale frazione del parallelepipedo circoscritto è davvero occupata dalla carena. {{slide 36}}' },
          { t: 'bottoni', h: 92, size: 36, lista: [0.85, 0.72, 0.5].map((v) => ({ id: `b:${v}`, testo: `CB ${virgola(v)}`, on: s.cb === v })) },
          { t: 'p', size: 36, testo: 'CB 0,85: petroliere e bulk. CB 0,72: la nave RO-RO dell\'esercizio. Sotto 0,50: scafi plananti. {{slide 34, 37}}' },
          ...lez.missioni().slice(2),
        ],
        dx: [
          { t: 'disegno', h: 460, fn: schemaCb },
          { t: 'nota', testo: 'Forma schematica con la stessa frazione del rettangolo' },
          { t: 'formula', testo: '∇ = LWL · BWL · T · CB' },
          { t: 'p', size: 38, testo: `Con LWL = 192 m, BWL = 32 m, T = 6,8 m: ∇ = **${interoSpaziato(volume)} m³** {{dati: slide 37}}` },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'poppa' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Caricando a poppa, l\'acqua sale sulla scala di poppa. Il TRIM diventa positivo.' },
        ],
        dx: [
          { t: 'titolo', testo: 'Aumenta quello di poppa' },
          { t: 'formula', testo: 'TRIM = TA – TF' },
          { t: 'p', testo: 'Un TRIM positivo (TA > TF) indica che la poppa è più immersa della prua; un TRIM negativo indica il contrario. {{slide 21}}' },
          { t: 'p', testo: 'Una nave con assetto nullo, cioè dritta, si dice *on even keel*. {{slide 21}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Immersioni e pescaggi' },
          { t: 'p', size: 40, testo: 'Le **immersioni** si misurano dalla linea di costruzione al galleggiamento: TF (*forward draught*) sulla FP, TA (*aft draught*) sulla AP, TM (*midship draught*) sulla MP. {{slide 20, 23}}' },
          { t: 'p', size: 40, testo: 'I **pescaggi** (*extreme draught*) si riferiscono alla linea di sottochiglia. Differiscono di pochissimi centimetri. {{slide 23}}' },
        ],
        dx: [
          { t: 'formula', testo: 'Tm = (TA + TF) / 2' },
          { t: 'p', size: 40, testo: 'Se lo scafo non è deformato, Tm coincide con TM. {{slide 22}}' },
          { t: 'sotto', testo: 'Le scale dei pescaggi' },
          { t: 'p', size: 40, testo: 'Sono dipinte sui fianchi, il più possibile in corrispondenza delle perpendicolari. Le scale in piedi, oggi poco usate, hanno numeri in cifre romane. {{slide 24}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Le linee del fondo' },
          { t: 'tabella', col: [36, 64], size: 34, righe: [
            ['Linea', 'Definizione e uso'],
            ['Linea di base (BL)', 'orizzontale per il punto K; riferimento per le coordinate verticali'],
            ['Linea di costruzione', 'tangente al fondo fuori ossatura in K; origine delle immersioni e dell\'altezza D'],
            ['Linea di sottochiglia', 'tangente alla chiglia nel punto più basso; riferimento dei pescaggi'],
          ] },
          { t: 'nota', testo: 'slide 11' },
        ],
        dx: [
          { t: 'titolo', testo: 'Il bolzone' },
          { t: 'p', size: 40, testo: 'Il **bolzone** (*camber*) è la distanza verticale, a centro nave, tra il profilo superiore del baglio e la linea retta del baglio. {{slide 12}}' },
          { t: 'p', size: 40, testo: 'Vale usualmente 1/50 della larghezza della nave. {{slide 12}}' },
          { t: 'riquadro', size: 40, testo: 'Per una nave larga 30 m il bolzone è circa 30/50 = 0,6 m. {{slide 12}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Le dimensioni lineari' },
          { t: 'tabella', col: [20, 80], size: 34, righe: [
            ['Sigla', 'Nome'],
            ['LPP', 'lunghezza fra le perpendicolari (*length between perpendiculars*): distanza fra AP e FP'],
            ['LOA', 'lunghezza fuori tutto (*length overall*): il massimo ingombro'],
            ['LWL', 'lunghezza al galleggiamento (*length of water line*): varia con il carico'],
            ['B', 'larghezza di dimensionamento (*breadth, moulded*), fuori ossatura'],
            ['BWL', 'larghezza al galleggiamento'],
            ['D', 'altezza di costruzione (*depth*)'],
          ] },
          { t: 'nota', testo: 'slide 15–18' },
        ],
        dx: [
          { t: 'titolo', testo: 'La lunghezza L' },
          { t: 'formula', testo: 'L = max { 0,96 · LWL ; LPP }' },
          { t: 'p', size: 40, testo: 'È la lunghezza di dimensionamento, definita dalla LL Convention. Nella gran parte dei casi coincide con la LPP. {{slide 16}}' },
          { t: 'p', size: 40, testo: 'D arriva alla linea retta del baglio: il bolzone non entra nella misura. {{slide 18}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'I rapporti' },
          { t: 'tabella', col: [22, 22, 56], size: 34, righe: [
            ['Rapporto', 'Valori', 'Indica'],
            ['LPP/B', 'da 4 a 10', 'stabilità statica trasversale, resistenza al moto, manovrabilità e stabilità di rotta'],
            ['LPP/D', 'da 7 a 18', 'robustezza longitudinale'],
            ['BWL/T', 'da 1,8 a 4,5', 'stabilità, riferito alla sola carena'],
            ['B/D', 'da 1,5 a 2,5', 'stabilità statica trasversale'],
          ] },
          { t: 'nota', testo: 'slide 28, 29' },
        ],
        dx: [
          { t: 'titolo', testo: 'I coefficienti di finezza' },
          { t: 'formula', testo: 'CWP = AW / (LWL · BWL)' },
          { t: 'formula', testo: 'CM = AM / (BWL · T)' },
          { t: 'formula', testo: 'CB = ∇ / (LWL · BWL · T)' },
          { t: 'p', size: 38, testo: 'Vicino a 1 indicano forme tozze, bassi forme affusolate. In generale si aggirano tra 0,60 e 0,90. {{slide 31}}' },
          { t: 'p', size: 38, testo: 'CWP tipico: 0,85 portacontainer, 0,91 tanker e bulk. {{slide 32}}' },
        ],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'titolo', testo: 'Esercizi' }, ...lez.calcoloSx()],
        dx: [...lez.calcoloDx()],
      },
      lez.premio(() => lez.fatto.quiz(CALCOLI.map((q) => q.n))),
    ];
  });
})();
