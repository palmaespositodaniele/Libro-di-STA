/* Lezione 15: calcoli di navigazione. Esercizi e risultati dalle slide 12-13, 21-22, 25-26, 35-36.
   Nella prova la rotta è in scala (1 NM = 1 unità), le navi no; un'ora dura 1,5 secondi */
(function () {
  const N = 15;
  const { COL, tratto, segmento, etichetta, pedana, compatta } = Tavola;

  const MISSIONI = [
    { id: 'ins', testo: 'Inseguimento: fai raggiungere A da B.' },
    { id: 'col', testo: 'Collisione: trova l\'ora dell\'incontro.' },
    { id: 'mai', testo: 'Inseguimento: quando B non raggiunge mai A?' },
    { id: 'es15', testo: 'Sulla carta, verifica l\'esercizio 15.' },
    { id: 'es16', testo: 'Sulla carta, verifica l\'esercizio 16.' },
    { id: 'incrocio', testo: 'Rotte che si incrociano: trova la rotta di collisione di B.' },
  ];
  const ANG = 1; const OPE = 2; const REL = 3; const ROT = 4;
  const dms = (a, b, c) => [['gradi', a, 0.0001], ['primi', b, 0.0001], ['secondi', c, 0.0001]];
  const CALCOLI = [
    { n: 1, g: ANG, testo: 'Converti 38°15\'30" in gradi sessadecimali (4 cifre decimali).', campi: [['angolo', 38.2583, 0.0001, '°']], soluzione: '30/60 = 0,5; 15,5/60 = 0,2583: 38,2583°' },
    { n: 2, g: ANG, testo: 'Converti 124,4625° in gradi, primi e secondi.', campi: dms(124, 27, 45), soluzione: '0,4625 · 60 = 27,75; 0,75 · 60 = 45: 124°27\'45"' },
    { n: 3, g: ANG, testo: 'Converti 63° in radianti e in gon.', campi: [['radianti', 1.0996, 0.0001, 'rad'], ['gon', 70, 0.001, 'gon']], soluzione: '63 · π/180 = 1,0996 rad; 63 · 400/360 = 70 gon' },
    { n: 4, g: ANG, testo: 'Converti 250 gon in gradi.', campi: [['angolo', 225, 0.001, '°']], soluzione: '250 · 360/400 = 225°' },
    { n: 5, g: OPE, testo: 'Somma: 47°38\'52" + 23°45\'29"', campi: dms(71, 24, 21), soluzione: '81" = 1\'21"; 84\' = 1°24\'; 71°24\'21"' },
    { n: 6, g: OPE, testo: 'Che ore sono? 18:47:30 + 7h 28m 45s', campi: [['ore', 2, 0.0001], ['minuti', 16, 0.0001], ['secondi', 15, 0.0001]], soluzione: '75 s = 1 m 15 s; 76 m = 1 h 16 m; 26 h → 02:16:15 del giorno dopo' },
    { n: 7, g: OPE, testo: 'Sottrazione: 120°15\'20" − 78°42\'45"', campi: dms(41, 32, 35), soluzione: '80" − 45" = 35"; 74\' − 42\' = 32\'; 119° − 78° = 41°' },
    { n: 8, g: OPE, testo: 'Moltiplicazione: 12°34\'45" × 4', campi: dms(50, 19, 0), soluzione: '180" = 3\'; 139\' = 2°19\'; 50°19\'00"' },
    { n: 9, g: OPE, testo: 'Divisione: 100°45\'30" ÷ 6', campi: dms(16, 47, 35), soluzione: '16 resto 4; 285\'/6 = 47 resto 3; 210"/6 = 35": 16°47\'35"' },
    { n: 10, g: REL, testo: 'V = 14 kn, T = 3h 30m. Spazio percorso?', campi: [['spazio', 49, 0.001, 'NM'], ['spazio', 90748, 0.5, 'm']], soluzione: '14 · 3,5 = 49 NM, cioè 90 748 m' },
    { n: 11, g: REL, testo: 'S = 245 NM, V = 16 kn. Durata della traversata?', campi: [['ore', 15, 0.0001], ['minuti', 18, 0.0001], ['secondi', 45, 0.0001]], soluzione: '245/16 = 15,3125 h: 15h 18m 45s' },
    { n: 12, g: REL, testo: 'La stessa nave parte alle 06:30. Ora di arrivo?', campi: [['ore', 21, 0.0001], ['minuti', 48, 0.0001], ['secondi', 45, 0.0001]], soluzione: 'Arrivo alle 21:48:45' },
    { n: 13, g: REL, testo: '37 NM in 2h 30m. Velocità?', campi: [['velocità', 14.8, 0.001, 'kn']], soluzione: '37/2,5 = 14,8 kn' },
    { n: 14, g: REL, testo: 'Converti 36 km/h in nodi.', campi: [['velocità', 19.44, 0.005, 'kn']], soluzione: '36 000/1852 = 19,44 kn' },
    { n: 15, g: ROT, testo: 'A parte alle 06:00 a 10 kn. B parte dallo stesso porto alle 08:00 a 15 kn. Quando e dove B raggiunge A?', campi: [['ora', 12, 0.0001], ['distanza', 60, 0.001, 'NM']], soluzione: 'Vantaggio 20 NM, Vrel = 5 kn, T = 4 h: alle 12:00, a 60 NM dal porto' },
    { n: 16, g: ROT, testo: 'VA = 14 kn, VB = 16 kn, distanza 75 NM alle 08:00, collisione frontale. A che ora si incontrano? Ora e minuti.', campi: [['ora', 10, 0.0001], ['minuti', 30, 0.0001]], soluzione: 'Vrel = 30 kn, T = 2,5 h: alle 10:30 (A: 35 NM, B: 40 NM)' },
    { n: 17, g: ROT, testo: 'Treni nella stessa direzione: 90 km/h e 150 km/h, distanza 120 km. Tempo di raggiungimento, Vrel e distanza in NM?', campi: [['tempo', 2, 0.001, 'h'], ['Vrel', 32.4, 0.005, 'kn'], ['distanza', 64.79, 0.005, 'NM']], soluzione: 'T = 120/60 = 2 h; 60/1,852 = 32,40 kn; 120/1,852 = 64,79 NM' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, calcoli: CALCOLI });

  const CASI = {
    ins: { nome: 'Inseguimento', t0: 6, va: 10, vb: 15 },
    col: { nome: 'Collisione', t0: 8, va: 14, vb: 16 },
  };
  const VANTAGGIO = 2; const DISTANZA = 75; const CARTA = 100; const ORA = 1.5;
  const s = { modo: 'ins', va: 10, vb: 15, t: 0, corre: false, fine: null, quarto: 0 };
  const posA = (t) => s.va * t;
  const posB = (t) => (s.modo === 'ins' ? s.vb * Math.max(0, t - VANTAGGIO) : DISTANZA - s.vb * t);
  const vrel = () => (s.modo === 'ins' ? s.vb - s.va : s.va + s.vb);
  const incontro = () => (s.modo === 'col' ? DISTANZA / (s.va + s.vb) : s.vb > s.va ? (VANTAGGIO * s.vb) / (s.vb - s.va) : null);
  const num = (x) => x.toFixed(1).replace('.', ',').replace(',0', '');
  function ora(t) {
    const m = Math.round((CASI[s.modo].t0 + t) * 60); const p = (x) => String(x).padStart(2, '0');
    return `${p(Math.floor(m / 60) % 24)}:${p(m % 60)}`;
  }

  const copie = []; const SC = 0.26; const prese = { schermo: [], mini: [] }; const resto = { va: 0, vb: 0 };
  function nave(base, k, col) {
    const p = new THREE.Group(); const m = base.clone(); m.scale.setScalar(SC); m.position.set((-Scafo.L / 2) * SC, -5.6 * SC, 0); p.add(m);
    const e = etichetta(col, 7 + k, col === 'A' ? '#8C7020' : '#B3362B'); e.position.y = 9 + k; p.add(e);
    return p;
  }
  const scia = (z, k, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.25 * k, 0.8 * k), new THREE.MeshBasicMaterial({ color: col })); m.position.set(0, 0.15, z); m.visible = false; return m; };
  function copia(k) {
    const g = new THREE.Group(); const base = Scafo.crea(2.5 * k);
    const carta = new THREE.Group();
    carta.add(tratto([new THREE.Vector3(-6, 0.1, 0), new THREE.Vector3(CARTA + 6, 0.1, 0)], 0.1 * k));
    for (let i = 0; i <= CARTA; i += 10) carta.add(segmento(new THREE.Vector3(i, 0.1, -1.5), new THREE.Vector3(i, 0.1, 1.5), 0.08 * k));
    g.add(compatta(carta));
    for (let i = 0; i <= CARTA; i += 20) { const e = etichetta(`${i}`, 5 + k); e.position.set(i, 1.5, 16); g.add(e); }
    const nm = etichetta('NM', 5 + k, '#5B6B7C'); nm.position.set(CARTA + 9, 1.5, 16); g.add(nm);
    const a = nave(base, k, 'A'); a.position.z = -6; const b = nave(base, k, 'B'); b.position.z = 6;
    // Sfera d'oro sulla nave: tirandola di lato cambia la velocità
    [[a, 'va'], [b, 'vb']].forEach(([n, id]) => { const m = Tavola.maniglia(1.6 + k, id); m.position.set(0, 6 + k, 0); n.add(m); prese[k > 1 ? 'mini' : 'schermo'].push(m); });
    const sa = scia(-6, k, COL.ocra); const sb = scia(6, k, COL.rosso);
    g.add(a, b, sa, sb);
    copie.push({ a, b, sa, sb });
    return g;
  }
  function posa() {
    const xa = posA(s.t); const xb = posB(s.t); const x0b = s.modo === 'ins' ? 0 : DISTANZA;
    copie.forEach((c) => {
      c.a.position.x = xa; c.b.position.x = xb;
      c.b.rotation.y = s.modo === 'col' ? Math.PI : 0;
      [[c.sa, 0, xa], [c.sb, x0b, xb]].forEach(([m, u, v]) => {
        const l = Math.abs(v - u); m.visible = l > 0.05;
        m.scale.x = Math.max(l, 0.01); m.position.x = (u + v) / 2;
      });
    });
  }

  let mondo = null;
  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    radice.add(copia(1), Scafo.mare());
    const stazioni = [
      { pedana: pedana(50, 42, 'lungo la rotta'), pos: new THREE.Vector3(50, 0.25, 42), yaw: 0 },
      { pedana: pedana(-16, 0, 'al porto'), pos: new THREE.Vector3(-16, 0.25, 0), yaw: -Math.PI / 2 },
    ];
    stazioni.forEach((st) => { st.pedana.visible = false; });
    const SCM = 0.0058; const mini = new THREE.Group();
    mini.add(copia(2.2)); mini.scale.setScalar(SCM); mini.position.set(-50 * SCM, 0.03, 0);
    posa();
    mondo = {
      radice, stazioni, modellino: mini,
      vistaIniziale: () => ({ target: new THREE.Vector3(50, 0, 0), theta: 0, phi: 0.85, r: 170 }),
      tocchi: (v) => (s.corre ? [] : prese[v === 'mini' ? 'mini' : 'schermo']),
      trascina(id, dx) {
        resto[id] += dx / 16;
        const n = Math.trunc(resto[id]); if (!n) return;
        resto[id] -= n;
        for (let i = 0; i < Math.abs(n); i++) comandi(`${id}${n > 0 ? '+' : '-'}`);
        Motore.ridisegna();
      },
      frame(dt) {
        if (!s.corre) return false;
        s.t += dt / ORA;
        const ti = incontro();
        if (ti !== null && s.t >= ti) {
          s.t = ti; s.corre = false; s.fine = 'incontro'; lez.completa(s.modo);
        } else if (Math.max(posA(s.t), posB(s.t)) >= CARTA + 4) {
          s.corre = false;
          if (ti === null) { s.fine = 'mai'; lez.completa('mai'); } else s.fine = 'fuori';
        }
        posa();
        const q = Math.floor(s.t * 4);
        if (!s.corre || q !== s.quarto) { s.quarto = q; Motore.ridisegna(); }
        return true;
      },
    };
    return mondo;
  }

  function daCapo() { s.t = 0; s.corre = false; s.fine = null; s.quarto = 0; posa(); }
  function comandi(id) {
    if (id === 'ins' || id === 'col') { s.modo = id; s.va = CASI[id].va; s.vb = CASI[id].vb; daCapo(); }
    const passo = { 'va+': ['va', 1], 'va-': ['va', -1], 'vb+': ['vb', 1], 'vb-': ['vb', -1] }[id];
    if (passo) { s[passo[0]] = Math.max(5, Math.min(20, s[passo[0]] + passo[1])); daCapo(); }
    if (id === 'avvia') { daCapo(); s.corre = true; }
    if (id === 'daccapo') daCapo();
    Motore.sporco();
  }
  function lettura() {
    const a = posA(s.t); const b = posB(s.t); const ti = incontro();
    if (s.fine === 'incontro') return s.modo === 'ins' ? `Vrel = ${vrel()} kn. Incontro alle ${ora(ti)}, a ${num(a)} NM dal porto.` : `Vrel = ${vrel()} kn. Incontro alle ${ora(ti)}. A: ${num(a)} NM, B: ${num(DISTANZA - b)} NM.`;
    if (s.fine === 'mai') return `Vrel = ${String(vrel()).replace('-', '−')} kn: la distanza non cala mai.`;
    if (s.fine === 'fuori') return `Si incontrerebbero dopo ${num(ti)} ore, oltre questa carta.`;
    if (!s.corre) return s.modo === 'ins' ? 'Ore 06:00: parte A. B parte alle 08:00.' : 'Ore 08:00: le navi sono a 75 NM.';
    return `Ore ${ora(s.t)}. Distanza tra le navi: ${num(Math.abs(b - a))} NM.`;
  }

  /* Carteggio: le navi su una carta, con rotta e velocità. Esercizi 15 e 16 dalle slide 35-36;
     le rotte che si incrociano sono un esempio della slide 33, senza dati nelle slide */
  const PROVE = {
    es15: { nome: 'Esercizio 15', ora0: 6, testo: 'A parte alle 06:00 a 10 kn per 090°. B parte dallo stesso porto alle 08:00 a 15 kn. {{slide 35}}', A: { p: [10, 33], r: 90, v: 10, t0: 0 }, B: { p: [10, 33], r: 90, v: 15, t0: 2 } },
    es16: { nome: 'Esercizio 16', ora0: 8, testo: 'Alle 08:00 le navi sono a 75 NM: A a 14 kn per 090°, B a 16 kn per 270°. {{slide 35}}', A: { p: [10, 33], r: 90, v: 14, t0: 0 }, B: { p: [85, 33], r: 270, v: 16, t0: 0 } },
    libere: { nome: 'Rotte incrociate', ora0: 8, A: { p: [10, 20], r: 45, v: 10, t0: 0 }, B: { p: [70, 10], v: 12, t0: 0 } },
  };
  const ct = { prova: 'es15', rb: 0, t: 0, corre: false, finito: false, resto: 0 };
  const navi = () => { const pr = PROVE[ct.prova]; return [pr.A, { ...pr.B, r: pr.B.r === undefined ? ct.rb : pr.B.r }]; };
  const dove = (n, t) => { const u = Math.max(0, t - n.t0); const a = (n.r * Math.PI) / 180; return [n.p[0] + n.v * u * Math.sin(a), n.p[1] + n.v * u * Math.cos(a)]; };
  // Minima distanza dopo la partenza di entrambe: t = −(Δp · Δv) / |Δv|²
  function minimo() {
    const [A, B] = navi(); const t0 = Math.max(A.t0, B.t0);
    const pa = dove(A, t0); const pb = dove(B, t0);
    const va = [A.v * Math.sin((A.r * Math.PI) / 180), A.v * Math.cos((A.r * Math.PI) / 180)];
    const vb = [B.v * Math.sin((B.r * Math.PI) / 180), B.v * Math.cos((B.r * Math.PI) / 180)];
    const dp = [pb[0] - pa[0], pb[1] - pa[1]]; const dv = [vb[0] - va[0], vb[1] - va[1]];
    const q = dv[0] ** 2 + dv[1] ** 2; const u = q ? Math.max(0, -(dp[0] * dv[0] + dp[1] * dv[1]) / q) : 0;
    const t = t0 + u; const a = dove(A, t); const b = dove(B, t);
    return { t, d: Math.hypot(a[0] - b[0], a[1] - b[1]), a, b };
  }
  const oraCarta = (t) => { const m = Math.round((PROVE[ct.prova].ora0 + t) * 60); const p = (x) => String(x).padStart(2, '0'); return `${p(Math.floor(m / 60) % 24)}:${p(m % 60)}`; };
  const nm = (x) => x.toFixed(1).replace('.', ',').replace(',0', '');
  function letturaCarta() {
    const [A, B] = navi(); const m = minimo();
    if (!ct.finito) {
      if (!ct.corre) return 'Premi Avvia: le navi si muovono sulla carta.';
      const a = dove(A, ct.t); const b = dove(B, ct.t);
      return `Ore ${oraCarta(ct.t)}. Distanza tra le navi: ${nm(Math.hypot(a[0] - b[0], a[1] - b[1]))} NM.`;
    }
    if (ct.prova === 'es15') return `Incontro alle **${oraCarta(m.t)}**, a **${nm(m.a[0] - A.p[0])} NM** dal porto. Come alla slide 36.`;
    if (ct.prova === 'es16') return `Incontro alle **${oraCarta(m.t)}**: A ha percorso ${nm(m.a[0] - A.p[0])} NM, B ${nm(B.p[0] - m.b[0])} NM. Come alla slide 36.`;
    return m.d < 1
      ? `Rotta di collisione: B incontra A alle **${oraCarta(m.t)}**, a meno di 1 NM.`
      : `Le navi si avvicinano al massimo alle ${oraCarta(m.t)}, a **${nm(m.d)} NM**: non è una rotta di collisione.`;
  }
  // La carta è una tela: 1 NM = 15 px, 100 × 66 NM
  const CW = 1500; const CH = 1000; const PX = 15;
  const telaCarta = document.createElement('canvas'); telaCarta.width = CW; telaCarta.height = CH;
  const texCarta = new THREE.CanvasTexture(telaCarta); texCarta.colorSpace = THREE.SRGBColorSpace; texCarta.anisotropy = 4;
  function disegnaCarta() {
    const c = telaCarta.getContext('2d'); const X = (x) => x * PX; const Y = (y) => CH - y * PX;
    c.fillStyle = '#F4EFE0'; c.fillRect(0, 0, CW, CH);
    c.strokeStyle = '#C9D3DF'; c.lineWidth = 2;
    for (let i = 0; i <= 100; i += 10) { c.beginPath(); c.moveTo(X(i), 0); c.lineTo(X(i), CH); c.stroke(); }
    for (let j = 0; j <= 66; j += 10) { c.beginPath(); c.moveTo(0, Y(j)); c.lineTo(CW, Y(j)); c.stroke(); }
    c.fillStyle = '#5B6B7C'; c.font = '36px Atkinson, sans-serif'; c.fillText('1 quadretto = 10 NM', 20, CH - 22);
    c.font = '700 44px Bitter, Georgia, serif'; c.fillText('N ↑', CW - 110, 60);
    const [A, B] = navi(); const tf = ct.corre || ct.finito ? ct.t : 0;
    [[A, '#C9A227', 'A'], [B, '#B3362B', 'B']].forEach(([n, col, nome]) => {
      const p0 = n.p; const p1 = dove(n, tf);
      c.strokeStyle = col; c.lineWidth = 10; c.beginPath(); c.moveTo(X(p0[0]), Y(p0[1])); c.lineTo(X(p1[0]), Y(p1[1])); c.stroke();
      if (!ct.corre && !ct.finito) { c.setLineDash([16, 12]); c.lineWidth = 5; const pf = dove(n, n.t0 + 8); c.beginPath(); c.moveTo(X(p0[0]), Y(p0[1])); c.lineTo(X(pf[0]), Y(pf[1])); c.stroke(); c.setLineDash([]); }
      c.fillStyle = col; c.font = '700 34px Atkinson, sans-serif';
      for (let h = Math.ceil(n.t0); h <= tf; h++) { const q = dove(n, h); c.beginPath(); c.arc(X(q[0]), Y(q[1]), 13, 0, Math.PI * 2); c.fill(); c.fillText(oraCarta(h).slice(0, 2), X(q[0]) + 14, Y(q[1]) + (nome === 'A' ? -18 : 42)); }
      // La nave: triangolo nel verso della rotta
      const a = (n.r * Math.PI) / 180; c.save(); c.translate(X(p1[0]), Y(p1[1])); c.rotate(a);
      c.beginPath(); c.moveTo(0, -40); c.lineTo(22, 24); c.lineTo(-22, 24); c.closePath(); c.fill(); c.restore();
      c.font = '700 54px Atkinson, sans-serif'; c.fillText(nome, X(p1[0]) + 24, Y(p1[1]) - 22);
    });
    if (ct.prova === 'es15') { c.fillStyle = '#0B2545'; c.font = '30px Atkinson, sans-serif'; c.fillText('porto', X(10) - 40, Y(33) + 52); }
    c.strokeStyle = '#0B2545'; c.lineWidth = 6; c.strokeRect(3, 3, CW - 6, CH - 6);
    texCarta.needsUpdate = true;
  }
  const creaCarta = Lezione.simula({
    scala: 0.6, centro: [0, 0.9], k: 1.5, mare: false, pedana: [0, 1.3, 'al tavolo'], dopo: disegnaCarta,
    vista: () => ({ target: new THREE.Vector3(0.04, 0.88, 0.02), theta: 0, phi: 0.5, r: 1.55 }),
    modello(k, tocca) {
      const g = new THREE.Group();
      const BOX = (w, h, d, col, x, y, z) => { const m = new THREE.Mesh(Tavola.cuoci(new THREE.BoxGeometry(w, h, d), col), new THREE.MeshBasicMaterial({ vertexColors: true })); m.position.set(x, y, z); return m; };
      g.add(BOX(1.3, 0.05, 0.92, '#7A4E2D', 0, 0.865, 0));
      [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]].forEach(([x, z]) => g.add(BOX(0.05, 0.84, 0.05, '#5E3920', x, 0.42, z)));
      const carta = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ map: texCarta }));
      carta.rotation.x = -Math.PI / 2; carta.position.y = 0.892; g.add(carta);
      const presa = Tavola.maniglia(0.025 * Math.sqrt(k), 'rb'); presa.position.set(0.66, 0.93, 0.3); g.add(presa); tocca(presa);
      const e = etichetta('rotta di B', 0.05 * k, '#B3362B'); e.position.set(0.66, 0.99, 0.3); g.add(e);
      return g;
    },
    trascina(id, dx) {
      if (ct.prova !== 'libere' || ct.corre) return;
      ct.resto += dx / 8;
      const n = Math.trunc(ct.resto); if (!n) return;
      ct.resto -= n; ct.rb = (ct.rb + n + 360) % 360; ct.finito = false; disegnaCarta(); Motore.ridisegna();
    },
    frame(dt) {
      if (!ct.corre) return false;
      const m = minimo(); const fine = Math.min(10, m.t + (m.d < 1 ? 0 : 1.5));
      ct.t = Math.min(fine, ct.t + dt);
      if (ct.t >= fine) {
        ct.corre = false; ct.finito = true;
        if (ct.prova === 'libere' && m.d < 1) lez.completa('incrocio');
        if (ct.prova !== 'libere') lez.completa(ct.prova);
        Motore.ridisegna();
      } else if (Math.floor(ct.t * 4) !== Math.floor((ct.t - dt) * 4)) Motore.ridisegna();
      disegnaCarta(); return true;
    },
  });
  function comandiCarta(id) {
    if (id.startsWith('ca:') && PROVE[id.slice(3)]) { ct.prova = id.slice(3); ct.t = 0; ct.corre = false; ct.finito = false; }
    if (id === 'rb+' || id === 'rb-') { ct.rb = (ct.rb + (id === 'rb+' ? 5 : 355)) % 360; ct.finito = false; ct.t = 0; }
    if (id === 'ca:via') { ct.t = 0; ct.corre = true; ct.finito = false; }
    if (id === 'ca:capo') { ct.t = 0; ct.corre = false; ct.finito = false; }
    disegnaCarta(); Motore.sporco();
  }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { a: 'dopo 48 minuti', b: 'dopo 1h 20m', c: 'dopo 4 ore', d: 'mai' };
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Angoli e ore' },
          { t: 'p', testo: 'Il grado sessagesimale divide l\'angolo giro in 360 parti: 1° = 60\', 1\' = 60". In inglese: *degrees, minutes, seconds*. {{slide 4}}' },
          { t: 'p', testo: 'È il sistema dell\'orologio: 11°38\' + 4°30\' è come chiedersi che ore saranno fra 4 ore e mezza, se sono le 11:38. {{slide 5}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Come si muove la nave' },
          { t: 'p', testo: 'Spazio in miglia nautiche, velocità in nodi, tempo in giorni, ore, minuti e secondi. {{slide 24}}' },
          { t: 'formula', testo: 'S = V · Δt' },
          { t: 'formula', testo: 'V = S / Δt' },
          { t: 'formula', testo: 'Δt = S / V' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'La nave A viaggia a 10 kn e ha 20 NM di vantaggio. Dietro, sulla stessa rotta, la nave B viaggia a 15 kn.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Le due navi si incontrano? Quando?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:a', testo: 'Dopo 48 minuti', on: p === 'a' },
          { t: 'scelta', id: 'p:b', testo: 'Dopo 1h 20m', on: p === 'b' },
          { t: 'scelta', id: 'p:c', testo: 'Dopo 4 ore', on: p === 'c' },
          { t: 'scelta', id: 'p:d', testo: 'Mai', on: p === 'd' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'bottoni', h: 84, size: 32, lista: ['ins', 'col'].map((id) => ({ id, testo: CASI[id].nome, on: s.modo === id })) },
          { t: 'passo', id: 'va', nome: 'Nave A', valore: `${s.va} kn` },
          { t: 'passo', id: 'vb', nome: 'Nave B', valore: `${s.vb} kn` },
          { t: 'bottoni', h: 84, size: 34, lista: [{ id: 'avvia', testo: 'Avvia', off: s.corre }, { id: 'daccapo', testo: 'Da capo' }] },
          { t: 'riquadro', size: 36, testo: lettura() },
          ...lez.missioni().slice(0, 3),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 760,
            testo: !vr ? '' : vera
              ? 'Punta una pedana e premi il grilletto per spostarti. Le navi si muovono sulla rotta.'
              : 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.',
          },
          ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          { t: 'nota', testo: 'Tira di lato la sfera d\'oro di una nave per cambiarne la velocità. La rotta è in scala, le navi no. Un\'ora dura 1,5 secondi.' },
        ],
      },
      {
        passo: 2, mondo: creaCarta, azione: comandiCarta,
        sx: [
          { t: 'titolo', testo: 'Carteggio' },
          { t: 'bottoni', h: 80, size: 30, lista: Object.keys(PROVE).map((id) => ({ id: `ca:${id}`, testo: PROVE[id].nome, on: ct.prova === id })) },
          ...(ct.prova === 'libere'
            ? [
              { t: 'p', size: 34, testo: 'A va per 045° a 10 kn. Scegli la rotta di B, a 12 kn, per andarle incontro. La slide 33 dice che si può fare anche fuori dalla stessa retta.' },
              { t: 'passo', id: 'rb', nome: 'Rotta di B', valore: `${String(ct.rb).padStart(3, '0')}°` },
            ]
            : [{ t: 'p', size: 34, testo: PROVE[ct.prova].testo }]),
          { t: 'bottoni', h: 80, size: 32, lista: [{ id: 'ca:via', testo: 'Avvia', off: ct.corre }, { id: 'ca:capo', testo: 'Da capo' }] },
          { t: 'riquadro', size: 34, testo: letturaCarta() },
          ...lez.missioni().slice(3),
        ],
        dx: [
          ...Lezione.finestra(700, 'Il tavolo di carteggio è davanti a te: la carta è in scala.'),
          { t: 'nota', testo: 'Pallini: posizione a ogni ora. 1 quadretto = 10 NM; un\'ora dura un secondo. Esercizi e risultati: slide 35, 36.' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'c' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Non contano le singole velocità, ma la **velocità relativa**: dice solo come il bersaglio si muove rispetto a noi. {{slide 28}}' },
          { t: 'formula', testo: 'T = 20 NM / 5 kn = 4 h' },
        ],
        dx: [
          { t: 'tabella', col: [36, 64], size: 34, righe: [
            ['Rotta', 'Vrel'],
            ['D\'inseguimento', 'si sottraggono le velocità'],
            ['Di collisione', 'si sommano le velocità'],
          ] },
          { t: 'nota', testo: 'slide 36' },
          { t: 'p', size: 38, testo: 'Due treni nella stessa direzione: 100 e 130 km/h, il secondo 200 km dietro. Vrel = 30 km/h. {{slide 29}}' },
          { t: 'p', size: 38, testo: 'In verso opposto: 80 e 120 km/h, a 500 km. Vrel = 200 km/h. {{slide 31}}' },
          { t: 'p', size: 38, testo: 'Il problema si svolge anche se i mezzi non sono sulla stessa retta. {{slide 33}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Da gradi, primi, secondi' },
          { t: 'p', size: 38, testo: 'In sessadecimale l\'angolo ha parte intera e parte decimale. Esempio: 75°22\'42". {{slide 6, 7}}' },
          { t: 'formula', testo: '42" / 60 = 0,7\'' },
          { t: 'formula', testo: '22\' + 0,7\' = 22,7\'' },
          { t: 'formula', testo: '22,7\' / 60 = 0,3783°' },
          { t: 'formula', testo: '75° + 0,3783° = 75,3783°' },
        ],
        dx: [
          { t: 'titolo', testo: 'E viceversa' },
          { t: 'p', size: 38, testo: 'Si moltiplica per 60 la parte decimale: si ottengono i primi; poi di nuovo, per i secondi. {{slide 8}}' },
          { t: 'formula', testo: '0,3783 · 60 = 22,698' },
          { t: 'formula', testo: '0,698 · 60 = 41,88 ≈ 42' },
          { t: 'formula', testo: '75°22\'42"' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Altre unità' },
          { t: 'p', size: 38, testo: 'Il **radiante** è l\'angolo al centro che sottende un arco lungo come il raggio. Angolo giro: 2π. {{slide 9}}' },
          { t: 'p', size: 38, testo: 'Negli angoli **centesimali** (gon o grad) l\'angolo retto ha 100 parti. Angolo giro: 400 gon. {{slide 9}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Conversioni' },
          { t: 'p', size: 38, testo: 'Lo stesso angolo è la stessa porzione dell\'angolo giro: si confrontano gli angoli piatti. {{slide 10, 11}}' },
          { t: 'formula', testo: 'αDEG/180° = αRAD/π = αGRAD/200' },
          { t: 'p', size: 38, testo: 'Si moltiplica per l\'angolo piatto del sistema desiderato e si divide per quello di partenza. {{slide 11}}' },
          { t: 'formula', testo: 'αDEG = αRAD · 180°/π' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Somma e sottrazione' },
          { t: 'p', size: 36, testo: 'In colonna, da destra. A 60 si sottrae 60 e si riporta 1. {{slide 15}}' },
          { t: 'tabella', col: [34, 22, 22, 22], size: 32, righe: [
            ['', 'Gradi', 'Primi', 'Secondi'],
            ['Dati', '63', '45', '58'],
            ['+', '51', '28', '49'],
            ['In colonna', '114', '73', '107'],
            ['Riporti', '115', '14', '47'],
          ] },
          { t: 'p', size: 36, testo: 'Nella sottrazione, se manca, si prende in prestito 1 dalla colonna a sinistra: vale 60. Se il secondo numero è più grande si ribaltano i ruoli e il risultato prende il suo segno. {{slide 16, 17}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Per e diviso' },
          { t: 'p', size: 36, testo: 'Per moltiplicare: gradi, primi e secondi uno per uno, poi i riporti. {{slide 18}}' },
          { t: 'formula', testo: '35°41\'37" · 3 = 107°04\'51"' },
          { t: 'p', size: 36, testo: 'Per dividere: prima i gradi. Il resto, per 60, si somma ai primi; così anche per i secondi. {{slide 19}}' },
          { t: 'formula', testo: '35°41\'37" / 3 ≈ 11°53\'52"' },
          { t: 'p', size: 36, testo: 'Tra due angoli conviene passare ai sessadecimali: 1°30\' diventa 1,5. {{slide 20}}' },
        ],
      },
      ...[[ANG, 'Unità di misura degli angoli', 'slide 12–13'], [OPE, 'Operazioni fra angoli e tempi', 'slide 21–22'], [REL, 'Relazioni fondamentali', 'slide 25–26'], [ROT, 'Rotte', 'slide 35–36']].map(([g, titolo, fonte]) => ({
        passo: 4, gruppo: g, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'sotto', testo: titolo }, { t: 'nota', testo: `Esercizi delle ${fonte}. Virgola per i decimali.` }, ...lez.calcoloSx(g)],
        dx: lez.calcoloDx(g),
      })),
      lez.premio(() => lez.fatto.quiz(CALCOLI.map((q) => q.n))),
    ];
  });
})();
