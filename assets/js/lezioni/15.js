/* Lezione 15: calcoli di navigazione. Esercizi e risultati dalle slide 12-13, 21-22, 25-26, 35-36.
   Nella prova la rotta è in scala (1 NM = 1 unità), le navi no; un'ora dura 1,5 secondi */
(function () {
  const N = 15;
  const { COL, tratto, segmento, etichetta, pedana, compatta } = Tavola;

  const MISSIONI = [
    { id: 'ins', testo: 'Inseguimento: fai raggiungere A da B.' },
    { id: 'col', testo: 'Collisione: trova l\'ora dell\'incontro.' },
    { id: 'mai', testo: 'Inseguimento: quando B non raggiunge mai A?' },
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

  const copie = []; const SC = 0.26;
  function nave(base, k, col) {
    const p = new THREE.Group(); const m = base.clone(); m.scale.setScalar(SC); m.position.set((-Scafo.L / 2) * SC, -5.6 * SC, 0); p.add(m);
    const e = etichetta(col, 7 + k, col === 'A' ? '#8A6410' : '#B3362B'); e.position.y = 9 + k; p.add(e);
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
    const nm = etichetta('NM', 5 + k, '#4A76A8'); nm.position.set(CARTA + 9, 1.5, 16); g.add(nm);
    const a = nave(base, k, 'A'); a.position.z = -6; const b = nave(base, k, 'B'); b.position.z = 6;
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
          ...lez.missioni(),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 760,
            testo: !vr ? '' : vera
              ? 'Punta una pedana e premi il grilletto per spostarti. Le navi si muovono sulla rotta.'
              : 'Punta il modellino, tieni premuto il grilletto e ruota la mano per girarlo.',
          },
          ...(vr ? [{ t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna al modellino' : 'Vai a grandezza vera', on: true }] }] : []),
          { t: 'nota', testo: 'La rotta è in scala, le navi no. Un\'ora dura 1,5 secondi. I valori iniziali sono quelli degli esercizi delle slide.' },
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
