/* Lezione 17: strumentazione di bordo. Tabella delle deviazioni dalla slide 25, declinazioni dalle
   slide 14, 15 e 31, formule dalle slide 11, 12, 22, 30. La plancia disegnata è schematica */
(function () {
  const N = 17;
  const { COL, tela, etichetta, pedana, segmento, scatola, maniglia } = Tavola;
  const { C } = Pagina;

  const MISSIONI = [
    { id: 'luoghi', testo: 'Confronta Roma e New York: quanto vale d?' },
    { id: 'ferri', testo: 'Togli e rimetti i ferri: dove va il nord bussola?' },
    { id: 'esempio', testo: 'Esempio della slide 31: Pb = 150°. Quanto vale Pv?' },
    { id: 'cardinali', testo: 'Primo giro: annota δ a 000°, 090°, 180° e 270°.' },
    { id: 'giro', testo: 'Completa il giro ogni 45° e confronta con la tabella.' },
  ];
  const CALCOLI = [
    { n: 1, testo: 'Declinazione all\'anno in corso: 3°10\' E nel 2015, 8\' E all\'anno. Valore per il 2020?', campi: [['gradi', 3, 0.01, '°'], ['primi', 50, 0.01, '\' E']], soluzione: '8\' × 5 = 40\', da sommare perché verso E: d = 3°50\' E' },
    { n: 2, testo: 'Prora vera da prora bussola: Pb 150°, d 2°24\' E nel 2014 (6\' E all\'anno), nel 2020, δ = 3,9° W.', campi: [['Pv', 149.1, 0.051, '°']], soluzione: 'd = 3,0° E; Pv = 150° − 3,9° + 3,0° = 149,1°' },
    { n: 3, testo: 'Profondità con l\'ecoscandaglio: Δt = 0,4 s, v = 1500 m/s.', campi: [['d', 300, 0.01, 'm']], soluzione: 'd = v · t / 2 = 1500 × 0,4 / 2 = 300 m' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, calcoli: CALCOLI });

  // Slide 25: δ per Pb ogni 15°; E positivo, W negativo
  const DEV = [2.8, 1.0, -1.0, -2.9, -4.8, -6.4, -7.4, -7.3, -6.3, -5.3, -3.9, -1.9, -0.1, 1.6, 3.0, 3.9, 5.6, 7.1, 7.8, 7.6, 7.1, 6.5, 5.6, 4.2];
  const deviazione = (pb) => {
    const p = ((pb % 360) + 360) % 360; const i = Math.floor(p / 15); const f = p / 15 - i;
    return DEV[i] + (DEV[(i + 1) % 24] - DEV[i]) * f; // per i valori intermedi si interpola (slide 24)
  };
  // Slide 14, 15, 31
  const LUOGHI = [
    { nome: 'Roma, 2026', d: 4, id: 'roma' },
    { nome: 'Lisbona, 2026', d: -1 },
    { nome: 'New York, 2026', d: -12, id: 'ny' },
    { nome: 'Seattle, 2026', d: 15 },
    { nome: 'Roma, 1900', d: -10 },
    { nome: 'Esempio slide 31', d: 3, id: 'es' },
  ];
  const s = { pb: 0, luogo: 0, ferri: true, tratti: new Set(), vista: 'bussola' };
  const delta = () => (s.ferri ? deviazione(s.pb) : 0);
  const dic = () => LUOGHI[s.luogo].d;
  const norm = (a) => ((a % 360) + 360) % 360;
  const num = (v) => v.toFixed(1).replace('.', ',');
  const angolo = (v) => (Math.abs(v) < 0.05 ? '0°' : `${num(Math.abs(v))}° ${v > 0 ? 'E' : 'W'}`);
  const prora = (v) => `${num(norm(v)).padStart(5, '0')}°`;

  /* Rosa dei gradi ---------------------------------------------------------------------- */
  function texRosa() {
    return tela(1024, 1024, (c) => {
      const O = 512; const R = 500;
      c.fillStyle = '#FBFAF4'; c.beginPath(); c.arc(O, O, R, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#0B2545'; c.lineWidth = 6; c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let g = 0; g < 360; g += 5) {
        const a = ((g - 90) * Math.PI) / 180; const lung = g % 10 === 0 ? 38 : 20;
        c.lineWidth = g % 10 === 0 ? 5 : 3; c.beginPath();
        c.moveTo(O + (R - 6) * Math.cos(a), O + (R - 6) * Math.sin(a));
        c.lineTo(O + (R - 6 - lung) * Math.cos(a), O + (R - 6 - lung) * Math.sin(a)); c.stroke();
      }
      c.fillStyle = '#0B2545'; c.font = '700 44px Atkinson, sans-serif';
      for (let g = 0; g < 360; g += 30) {
        const a = ((g - 90) * Math.PI) / 180;
        c.save(); c.translate(O + (R - 90) * Math.cos(a), O + (R - 90) * Math.sin(a)); c.rotate(a + Math.PI / 2);
        c.fillText(String(g).padStart(3, '0'), 0, 0); c.restore();
      }
      c.font = '700 74px Bitter, Georgia, serif';
      [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([t, g]) => {
        const a = ((g - 90) * Math.PI) / 180;
        c.save(); c.translate(O + (R - 180) * Math.cos(a), O + (R - 180) * Math.sin(a)); c.rotate(a + Math.PI / 2); c.fillText(t, 0, 0); c.restore();
      });
    });
  }

  /* Bussola: chiesuola, sospensione cardanica, rosa e tre nord */
  function bussola() {
    const g = new THREE.Group();
    const carta = new THREE.MeshBasicMaterial({ color: COL.scafo, side: THREE.DoubleSide });
    const R = 0.34; const Y = 1.2;
    const colonna = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 1.05, 24), carta);
    colonna.position.y = 0.52;
    g.add(colonna, new THREE.LineSegments(new THREE.EdgesGeometry(colonna.geometry, 30), new THREE.LineBasicMaterial({ color: COL.inchiostro })));
    g.children[1].position.copy(colonna.position);
    const anello = (r) => new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 8, 48), new THREE.MeshBasicMaterial({ color: COL.inchiostro }));
    const a1 = anello(R + 0.08); a1.rotation.x = Math.PI / 2; a1.position.y = Y;
    const a2 = anello(R + 0.04); a2.rotation.x = Math.PI / 2; a2.position.y = Y;
    g.add(a1, a2);
    const rosa = new THREE.Group(); rosa.position.y = Y;
    const piatto = new THREE.Mesh(new THREE.CircleGeometry(R, 64), new THREE.MeshBasicMaterial({ map: texRosa() }));
    piatto.rotation.x = -Math.PI / 2;
    rosa.add(piatto);
    const lancia = (colore, r, lung) => {
      const p = new THREE.Group();
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r, lung), new THREE.MeshBasicMaterial({ color: colore }));
      m.rotation.x = -Math.PI / 2; m.position.set(0, 0.004, -lung / 2);
      p.add(m);
      return p;
    };
    const nb = lancia(COL.inchiostro, 0.012, R * 0.86);
    const nm = lancia(COL.medio, 0.012, R * 0.86);
    const nv = lancia(COL.ocra, 0.016, R * 0.86);
    rosa.add(nb, nm, nv);
    const lab = (t, col) => { const e = etichetta(t, 0.06, col); e.position.set(0, 0.03, -R * 0.96); return e; };
    nb.add(lab('Nb', '#0B2545')); nm.add(lab('Nm', '#5B6B7C')); nv.add(lab('Nv', '#8C7020'));
    g.add(rosa);
    // Sfera d'oro: tirandola di lato la nave accosta e la rosa gira
    const presa = Tavola.maniglia(0.035, 'pb'); presa.position.set(0, Y + 0.1, R + 0.14); g.add(presa);
    prese.push(presa);
    // Linea di fede: fissa alla nave, verso prua
    g.add(segmento(new THREE.Vector3(0, Y + 0.01, -R - 0.1), new THREE.Vector3(0, Y + 0.01, -R + 0.08), 0.006, COL.rosso));
    return { g, rosa, nb, nm, nv };
  }

  /* Plancia a linee: finestre, timone, radar */
  function plancia() {
    const g = new THREE.Group();
    const X = 5; const Z = 4;
    const pav = new THREE.Mesh(new THREE.PlaneGeometry(2 * X, 2 * Z), new THREE.MeshBasicMaterial({ color: COL.scafo, side: THREE.DoubleSide }));
    pav.rotation.x = -Math.PI / 2;
    g.add(pav);
    const griglia = new THREE.GridHelper(10, 10, COL.griglia, COL.griglia); g.add(griglia);
    // Finestre di prua
    for (let i = -4; i <= 4; i++) g.add(segmento(new THREE.Vector3(i * 1.2, 0, -Z), new THREE.Vector3(i * 1.2, 2.6, -Z), 0.03));
    [1.1, 2.6].forEach((y) => g.add(segmento(new THREE.Vector3(-X, y, -Z), new THREE.Vector3(X, y, -Z), 0.03)));
    g.add(scatola(-X, X, 0, 1.1, -Z - 0.1, -Z, 0.02));
    // Ruota di governo
    const ruota = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 40), new THREE.MeshBasicMaterial({ color: COL.inchiostro }));
    ruota.position.set(-1.6, 1.15, -1.2); g.add(ruota);
    g.add(scatola(-1.9, -1.3, 0, 0.9, -1.2, -0.8, 0.012));
    // Radar con PPI: la nave al centro, anelli di distanza e linea di prora (slide 45)
    g.add(scatola(1.3, 2.3, 0, 1.1, -1.4, -0.7, 0.012));
    const ppi = new THREE.Mesh(new THREE.CircleGeometry(0.34, 48), new THREE.MeshBasicMaterial({
      map: tela(512, 512, (c) => {
        c.fillStyle = '#0B2545'; c.fillRect(0, 0, 512, 512);
        c.strokeStyle = '#8FB2D6'; c.lineWidth = 3;
        [80, 160, 240].forEach((r) => { c.beginPath(); c.arc(256, 256, r, 0, Math.PI * 2); c.stroke(); });
        c.beginPath(); c.moveTo(256, 256); c.lineTo(256, 8); c.stroke();
        c.fillStyle = '#F2C230'; [[170, 120], [352, 200], [300, 396], [120, 330]].forEach(([x, y]) => { c.fillRect(x, y, 14, 9); });
      }),
    }));
    ppi.rotation.x = -Math.PI / 2 + 0.5; ppi.position.set(1.8, 1.2, -1);
    g.add(ppi);
    const giro = new THREE.Group(); giro.position.copy(ppi.position); giro.rotation.x = 0.5;
    const raggio = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.33), new THREE.MeshBasicMaterial({ color: COL.ocra }));
    raggio.rotation.x = -Math.PI / 2; raggio.position.set(0, 0.006, -0.165);
    giro.add(raggio);
    g.add(giro);
    const nome = (t, x, y, z) => { const e = etichetta(t, 0.2); e.position.set(x, y, z); g.add(e); };
    nome('radar', 1.8, 1.75, -1); nome('ruota di governo', -1.6, 1.75, -1.2); nome('prua →', 0, 3, -3.9);
    Tavola.compatta(g);
    return { g, giro };
  }

  /* Le declinazioni sulla pagina, come alla slide 26 */
  const LW = 1040; const LH = 300;
  const telaLente = document.createElement('canvas');
  telaLente.width = LW; telaLente.height = LH;
  const texLente = new THREE.CanvasTexture(telaLente);
  texLente.colorSpace = THREE.SRGBColorSpace;
  function disegnaLente() {
    const c = telaLente.getContext('2d');
    c.fillStyle = C.carta; c.fillRect(0, 0, LW, LH);
    const O = { x: 300, y: LH - 26 }; const R = 165; const k = 2.2;
    const raggio = (ang, col, nome, sp, sale) => {
      const a = ((ang * k - 90) * Math.PI) / 180;
      c.strokeStyle = col; c.lineWidth = sp; c.beginPath(); c.moveTo(O.x, O.y); c.lineTo(O.x + R * Math.cos(a), O.y + R * Math.sin(a)); c.stroke();
      c.fillStyle = col; c.font = '700 32px Atkinson, sans-serif'; c.textAlign = 'center';
      c.fillText(nome, O.x + (R + 18 + sale) * Math.cos(a), O.y + (R + 18 + sale) * Math.sin(a));
    };
    const d = dic(); const dv = delta();
    // Le sigle stanno su altezze diverse: i tre nord possono essere vicinissimi
    raggio(0, C.ocra, 'Nv', 7, 0);
    raggio(d, C.ink2, 'Nm', 6, 30);
    raggio(d + dv, C.ink, 'Nb', 6, 60);
    c.textAlign = 'left'; c.fillStyle = C.ink; c.font = '700 36px Atkinson, sans-serif';
    c.fillText(`d = ${angolo(d)}`, 620, 80);
    c.fillText(`δ = ${angolo(dv)}`, 620, 134);
    c.fillText(`V = d + δ = ${angolo(d + dv)}`, 620, 188);
    c.fillStyle = C.ink2; c.font = '28px Disegno, cursive'; c.fillText('angoli ingranditi per leggerli', 620, 260);
    c.strokeStyle = C.ink; c.lineWidth = 4; c.strokeRect(2, 2, LW - 4, LH - 4);
    texLente.needsUpdate = true;
  }

  const copie = []; const prese = []; let restoPb = 0;
  const VISTE = {
    bussola: () => ({ target: new THREE.Vector3(0, 1.2, 0), theta: 0, phi: 0.5, r: 1.55 }),
    plancia: () => ({ target: new THREE.Vector3(0, 1, -0.5), theta: 0.5, phi: 1.2, r: 8.5 }),
  };
  let mondo = null; let visPb = 0;

  function aggiornaRosa() {
    const r = (visPb * Math.PI) / 180;
    const dv = delta(); const d = dic();
    copie.forEach((b) => {
      b.rosa.rotation.y = r;
      b.nb.rotation.y = 0;
      b.nm.rotation.y = (dv * Math.PI) / 180;
      b.nv.rotation.y = ((dv + d) * Math.PI) / 180;
    });
  }

  function creaMondo() {
    if (mondo) return mondo;
    const radice = new THREE.Group();
    const pl = plancia();
    const b1 = bussola(); copie.push(b1);
    radice.add(pl.g, b1.g);
    const piazzola = (x, z, nome, yaw) => {
      const p = pedana(x, z, nome); p.scale.setScalar(0.18); p.position.y = 0.01;
      return { pedana: p, pos: new THREE.Vector3(x, 0.03, z), yaw };
    };
    const stazioni = [piazzola(0, 0.85, 'bussola', 0), piazzola(1.8, 0.2, 'radar', 0), piazzola(-1.6, 0, 'timone', 0)];
    stazioni.forEach((st) => { st.pedana.visible = false; });
    const mini = new THREE.Group();
    const b2 = bussola(); copie.push(b2);
    mini.add(b2.g); mini.scale.setScalar(1.45); mini.position.y = -1.2 * 1.45 + 0.05;
    aggiornaRosa(); disegnaLente();
    mondo = {
      radice, stazioni, modellino: mini, vistaIniziale: VISTE.bussola,
      lente: () => { disegnaLente(); return texLente; },
      tocchi: () => prese,
      trascina(id, dx) {
        restoPb += dx / 10;
        const n = Math.trunc(restoPb); if (!n) return;
        restoPb -= n;
        for (let i = 0; i < Math.abs(n); i++) comandi(n > 0 ? 'pb+' : 'pb-');
        Motore.ridisegna();
      },
      frame(dt) {
        pl.giro.rotation.y -= dt * 1.2;
        const fine = Math.abs(s.pb - visPb) > 0.02;
        if (fine) visPb += (s.pb - visPb) * (1 - Math.exp(-dt * 3));
        aggiornaRosa();
        return true;
      },
    };
    return mondo;
  }

  function comandi(id) {
    if (id === 'pb+') s.pb += 5;
    if (id === 'pb-') s.pb -= 5;
    if (id === 'dove+') s.luogo = (s.luogo + 1) % LUOGHI.length;
    if (id === 'dove-') s.luogo = (s.luogo + LUOGHI.length - 1) % LUOGHI.length;
    if (id === 'f:si' || id === 'f:no') { const prima = s.ferri; s.ferri = id === 'f:si'; if (prima !== s.ferri) s.tratti.add(id); if (s.tratti.has('f:si') && s.tratti.has('f:no')) lez.completa('ferri'); }
    if (id === 'v:bussola' || id === 'v:plancia') { s.vista = id.slice(2); Motore.vista(VISTE[s.vista]()); }
    const l = LUOGHI[s.luogo];
    if (l.id) s.tratti.add(l.id);
    if (s.tratti.has('roma') && s.tratti.has('ny')) lez.completa('luoghi');
    if (l.id === 'es' && norm(s.pb) === 150 && s.ferri) lez.completa('esempio');
    disegnaLente();
  }

  /* Giro di bussola (slide 29): la nave ruota in porto, il GPS dà Pv, si annota δ = Pm − Pb.
     δ viene dalla tabella della slide 25; d = 4° E, Roma nel 2026 (slide 14) */
  const D_GIRO = 4;
  const ga = { pb: 0, vista: 0, resto: 0, note: new Map(), copie: [] };
  const pvGiro = () => ga.pb + deviazione(ga.pb) + D_GIRO;
  function posaGiro() {
    const r = ((90 - (ga.vista + deviazione(ga.vista) + D_GIRO)) * Math.PI) / 180; // sulla rosa la nave sta a Pv
    ga.copie.forEach((c) => { c.perno.rotation.y = r; });
  }
  const creaGiro = Lezione.simula({
    scala: 0.006, centro: [0, 4], k: 5, pedana: [0, 70, 'sulla banchina'], dopo: posaGiro,
    vista: () => ({ target: new THREE.Vector3(0, 0, -30), theta: 0.3, phi: 0.62, r: 340 }),
    modello(k, tocca) {
      const g = new THREE.Group();
      const rosa = new THREE.Mesh(new THREE.CircleGeometry(80, 96), new THREE.MeshBasicMaterial({ map: texRosa(), transparent: true, opacity: 0.9, depthWrite: false }));
      rosa.rotation.x = -Math.PI / 2; rosa.position.y = 0.2; g.add(rosa);
      // Nord vero e nord magnetico, fuori dalla rosa
      const freccia = (ang, col, nome, colNome, alto) => {
        const a = (ang * Math.PI) / 180; const fine = new THREE.Vector3(118 * Math.sin(a), 0.5, -118 * Math.cos(a));
        g.add(segmento(new THREE.Vector3(84 * Math.sin(a), 0.5, -84 * Math.cos(a)), fine, 1.3 * Math.sqrt(k), col));
        const e = etichetta(nome, 14 + k, colNome); e.position.copy(fine).add(new THREE.Vector3(0, alto, 0)); g.add(e);
      };
      freccia(0, COL.ocra, 'Nv', '#8C7020', 6);
      freccia(D_GIRO, COL.medio, 'Nm', '#5B6B7C', 16);
      const perno = new THREE.Group(); const nave = Scafo.crea(k); nave.position.set(-45, -6, 0); perno.add(nave);
      perno.add(segmento(new THREE.Vector3(45, 1, 0), new THREE.Vector3(70, 1, 0), 0.6 * Math.sqrt(k), COL.rosso)); // linea di prora
      const presa = maniglia(2.6 * Math.sqrt(k), 'giro'); presa.position.set(30, 14, 0); perno.add(presa); tocca(presa);
      g.add(perno);
      ga.copie.push({ perno });
      return g;
    },
    trascina(id, dx) {
      ga.resto += dx / 60;
      const n = Math.trunc(ga.resto); if (!n) return;
      ga.resto -= n; comandiGiro(n > 0 ? 'gp+' : 'gp-'); Motore.ridisegna();
    },
    frame(dt) {
      if (ga.vista === ga.pb) return false;
      let diff = ga.pb - ga.vista; if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
      ga.vista = Math.abs(diff) < 0.3 ? ga.pb : ga.vista + diff * (1 - Math.exp(-dt * 3));
      posaGiro(); return true;
    },
  });
  function comandiGiro(id) {
    if (id === 'gp+') ga.pb = norm(ga.pb + 45);
    if (id === 'gp-') ga.pb = norm(ga.pb - 45);
    if (id === 'g:annota') ga.note.set(ga.pb, deviazione(ga.pb));
    if ([0, 90, 180, 270].every((p) => ga.note.has(p))) lez.completa('cardinali');
    if (ga.note.size === 8) lez.completa('giro');
    Motore.sporco();
  }
  // Curva delle deviazioni: punti annotati; a giro finito, la curva della tabella per confronto
  function curvaGiro(c, x, y, w, h) {
    const x0 = x + 70; const lw = w - 90; const X = (p) => x0 + (p / 360) * lw; const Y = (d) => y + h / 2 - 20 - (d / 9) * (h / 2 - 40);
    c.strokeStyle = C.ink2; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, Y(0)); c.lineTo(x0 + lw, Y(0)); c.moveTo(x0, Y(9)); c.lineTo(x0, Y(-9)); c.stroke();
    c.fillStyle = C.ink; c.font = Pagina.font('n', 26); c.textAlign = 'center';
    for (let p = 0; p <= 360; p += 90) c.fillText(String(p).padStart(3, '0'), X(p), Y(-9) + 30);
    c.textAlign = 'right'; [[6, '6° E'], [0, '0°'], [-6, '6° W']].forEach(([d, t]) => c.fillText(t, x0 - 10, Y(d) + 9));
    c.textAlign = 'left';
    if (ga.note.size === 8) {
      c.strokeStyle = C.ocra; c.lineWidth = 3; c.setLineDash([10, 8]); c.beginPath();
      for (let p = 0; p <= 360; p += 15) { const v = deviazione(p); if (p === 0) c.moveTo(X(p), Y(v)); else c.lineTo(X(p), Y(v)); }
      c.stroke(); c.setLineDash([]);
      c.fillStyle = C.ocraT; c.fillText('tabella della slide 25', x0 + 10, y + 26);
    }
    c.fillStyle = C.ink;
    ga.note.forEach((v, p) => { c.beginPath(); c.arc(X(p), Y(v), 9, 0, Math.PI * 2); c.fill(); });
    c.fillStyle = C.rosso; c.beginPath(); c.arc(X(ga.pb), Y(deviazione(ga.pb)), 5, 0, Math.PI * 2); c.fill();
    c.fillStyle = C.ink2; c.font = Pagina.font('n', 26); c.textAlign = 'right'; c.fillText(`δ annotate: ${ga.note.size} su 8`, x0 + lw, y + 26); c.textAlign = 'left';
  }

  const righeDev = (da, a) => [['Pb', 'δ'], ...DEV.slice(da, a).map((v, i) => [`${String((da + i) * 15).padStart(3, '0')}°`, `${num(Math.abs(v))}° ${v >= 0 ? 'E' : 'W'}`])];

  lez.registra(() => {
    const p = Libro.stato(N).prevedi;
    const vr = Motore.presente(); const vera = vr && Motore.scalaVera();
    const RISPOSTE = { si: 'Sì, coincide', mag: 'Coincide col nord magnetico', no: 'No, né col vero né col magnetico' };
    const pm = s.pb + delta(); const pv = pm + dic();
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Strumenti di bordo' },
          { t: 'p', testo: 'Come fa una nave, senza punti di riferimento visibili, a sapere dove sta andando? Servono degli strumenti: bussola magnetica, girobussola, log, scandaglio, cronometro, sestante, radar e GNSS. {{slide 3}}' },
        ],
        dx: [
          { t: 'spazio', h: 120 },
          { t: 'p', testo: 'Il più importante è la **bussola magnetica**, perché per capirla bisogna ragionare su magnetismo, geometria e ferro della nave. {{slide 3}}' },
          { t: 'p', testo: 'La Terra si comporta come un dipolo magnetico: i poli magnetici non coincidono con quelli geografici. {{slide 5, 8}}' },
        ],
      },
      {
        passo: 1,
        sx: [
          { t: 'titolo', testo: 'Prima di provare' },
          { t: 'p', testo: 'In plancia leggi la rosa della bussola. Il suo zero indica un nord.' },
        ],
        dx: [
          { t: 'sotto', testo: 'Il nord della bussola coincide col nord vero?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:si', testo: 'Sì, coincide', on: p === 'si' },
          { t: 'scelta', id: 'p:mag', testo: 'No, ma coincide col nord magnetico', on: p === 'mag' },
          { t: 'scelta', id: 'p:no', testo: 'No, né col vero né col magnetico', on: p === 'no' },
        ],
      },
      {
        passo: 2, mondo: creaMondo, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        azione: comandi,
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'passo', id: 'pb', nome: 'Prora bussola Pb', valore: prora(s.pb) },
          { t: 'passo', id: 'dove', nome: 'Dove e quando', valore: `${LUOGHI[s.luogo].nome}: d = ${angolo(dic())}` },
          { t: 'bottoni', h: 84, size: 32, lista: [{ id: 'f:si', testo: 'Con i ferri di bordo', on: s.ferri }, { id: 'f:no', testo: 'Senza ferri', on: !s.ferri }] },
          { t: 'formula', testo: `Pm = Pb + δ = ${prora(pm)}` },
          { t: 'formula', testo: `Pv = Pm + d = ${prora(pv)}` },
          ...lez.missioni().slice(0, 3),
        ],
        dx: [
          {
            t: 'zona', id: 'finestra', h: 640,
            testo: !vr ? '' : vera
              ? 'Sei in plancia. Punta una piazzola e premi il grilletto: bussola, radar, timone.'
              : 'Punta la bussola, tieni premuto il grilletto e ruota la mano per girarla.',
          },
          vr
            ? { t: 'bottoni', h: 76, size: 34, lista: [{ id: 'vr:scala', testo: vera ? 'Torna alla bussola' : 'Vai in plancia', on: true }] }
            : { t: 'bottoni', h: 76, size: 34, lista: [{ id: 'v:bussola', testo: 'Bussola', on: s.vista === 'bussola' }, { id: 'v:plancia', testo: 'Plancia', on: s.vista === 'plancia' }] },
          { t: 'zona', id: 'lente', h: 300 },
          { t: 'nota', testo: 'Tira di lato la sfera d\'oro: accosta e guarda girare la rosa. Tabella δ: slide 25. Plancia schematica.' },
        ],
      },
      {
        passo: 2, mondo: creaGiro, azione: comandiGiro,
        sx: [
          { t: 'titolo', testo: 'Giro di bussola' },
          { t: 'p', size: 34, testo: 'In porto a Roma (d = 4° E), la nave si mette su prore diverse. Il GPS dà la prora vera: da lì si ricava δ. {{slide 14, 29}}' },
          { t: 'passo', id: 'gp', nome: 'Prora bussola Pb', valore: prora(ga.pb) },
          { t: 'riquadro', size: 34, testo: `Pv (GPS) = ${prora(pvGiro())} → Pm = Pv − d = ${prora(pvGiro() - D_GIRO)} → **δ = Pm − Pb = ${angolo(deviazione(ga.pb))}** {{slide 30}}` },
          { t: 'bottoni', h: 80, size: 32, lista: [{ id: 'g:annota', testo: ga.note.has(ga.pb) ? 'Già annotata' : 'Annota δ a questa prora', on: ga.note.has(ga.pb) }] },
          ...lez.missioni().slice(3),
        ],
        dx: [
          ...Lezione.finestra(520, 'Tira di lato la sfera d\'oro: la nave accosta di 45° alla volta.'),
          { t: 'disegno', h: 400, fn: curvaGiro },
          { t: 'nota', testo: 'Tira di lato la sfera d\'oro: la nave accosta di 45°. I valori di δ sono quelli della tabella della slide 25.' },
        ],
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'no' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Sulla rosa i tre nord sono separati. Cambiando prora si sposta Nb, cambiando luogo si sposta Nm.' },
        ],
        dx: [
          { t: 'titolo', testo: 'Tre nord diversi' },
          { t: 'p', size: 40, testo: 'Il campo di bordo agisce sugli aghi, che indicano un **nord bussola** Nb. Non coincide né con il nord vero né con quello magnetico. {{slide 22}}' },
          { t: 'p', size: 40, testo: 'È deviato rispetto a Nm dell\'angolo di **deviazione** δ, che varia con la prora, nasce a bordo e non si trova sulle carte. {{slide 22}}' },
          { t: 'formula', testo: 'Pv = Pb + δ + d' },
          { t: 'p', size: 38, testo: 'V = d + δ è la variazione magnetica (*compass error*). Segno + per Est, − per Ovest. {{slide 30}}' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Il magnetismo terrestre' },
          { t: 'p', size: 38, testo: 'L\'asse magnetico è inclinato di circa 10° rispetto all\'asse di rotazione. {{slide 5}}' },
          { t: 'p', size: 38, testo: 'L\'angolo tra F e il piano orizzontale è l\'**inclinazione magnetica** (*dip*). F si scompone in una componente orizzontale H e una verticale Z. {{slide 6}}' },
          { t: 'p', size: 38, testo: 'La forza direttiva è la sola H, massima all\'equatore magnetico e nulla ai poli: lì la bussola è inservibile. {{slide 6, 7}}' },
          { t: 'p', size: 38, testo: 'Coordinate attuali del polo nord magnetico: 85,76°N e 139,30°E. {{slide 8}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'La declinazione' },
          { t: 'p', size: 38, testo: 'La **declinazione** d (*variation*) è l\'angolo fra meridiano geografico e magnetico: positiva (Est) se Nm è a destra di Nv. {{slide 10}}' },
          { t: 'formula', testo: 'd = d(carta) ± var. annua × anni' },
          { t: 'tabella', col: [55, 45], size: 32, righe: [['Luogo', 'd nel 2026'], ['Roma', 'circa 4° E'], ['Lisbona', '1° W'], ['New York', '12° W'], ['Seattle', '15° E']] },
          { t: 'nota', testo: 'slide 12, 14. Roma nel 1900: circa 10° W (slide 15)' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'La bussola' },
          { t: 'p', size: 38, testo: 'Il **mortaio**, amagnetico, contiene la rosa da 0° a 360°. La rosa resta orientata al nord bussola, il mortaio le ruota intorno: la **linea di fede** indica la prora bussola. {{slide 16}}' },
          { t: 'p', size: 38, testo: 'La **sospensione cardanica** mantiene orizzontale il mortaio con rollio e beccheggio. Il tutto è nella **chiesuola**. {{slide 17}}' },
          { t: 'p', size: 38, testo: 'Il timoniere vede la rosa su un visore (*mirror head*). {{slide 18}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'I ferri di bordo' },
          { t: 'tabella', col: [28, 36, 36], size: 32, righe: [
            ['', 'Ferri duri', 'Ferri dolci'],
            ['Carbonio', 'tra 0,2% e 2%', 'sotto lo 0,2%'],
            ['Magnetismo', 'permanente, quasi costante', 'temporaneo, indotto'],
            ['Deviazione', 'semicircolare', 'quadrantale'],
          ] },
          { t: 'nota', testo: 'slide 21' },
          { t: 'p', size: 38, testo: 'La **compensazione** riduce al minimo la deviazione: «magnete contro magnete», nella chiesuola. Fasi: regolazione fisica, giri di bussola, tabella delle deviazioni residue. {{slide 27, 28}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'La tabella delle deviazioni' },
          { t: 'tabella', col: [50, 50], size: 32, righe: righeDev(0, 12) },
          { t: 'nota', testo: 'slide 25' },
        ],
        dx: [
          { t: 'p', size: 36, testo: 'Si entra sempre con la prora bussola o magnetica, mai con il rilevamento. Per i valori intermedi si interpola. {{slide 24}}' },
          { t: 'tabella', col: [50, 50], size: 32, righe: righeDev(12, 24) },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Esempi svolti' },
          { t: 'sotto', testo: 'Correzione' },
          { t: 'p', size: 38, testo: 'Pb = 150°, d = 2°24\' E nel 2014 (6\' E all\'anno): nel 2020 d = 3,0° E. Dalla tabella δ = 3,9° W. Pv = 150° − 3,9° + 3,0° = 149,1°. {{slide 31}}' },
          { t: 'sotto', testo: 'Conversione' },
          { t: 'p', size: 38, testo: 'Pv = 041°, d = 14,2° W nel 2020. Pm = 41° + 14,2° = 055,2°. Dalla tabella δ = 4,8° W. Pb = 41° + 14,2° + 4,8° = 060°. {{slide 31}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'La girobussola' },
          { t: 'p', size: 38, testo: 'Sfrutta inerzia giroscopica e precessione per puntare al nord vero. Servono circa 3 ore di assestamento. {{slide 33, 34}}' },
          { t: 'p', size: 38, testo: 'La bussola madre trasmette il dato alle ripetitrici, all\'autopilota, al radar e all\'ECDIS. La SOLAS la richiede dalle 500 GT. {{slide 35}}' },
          { t: 'formula', testo: 'cg = RilV − Rilg' },
          { t: 'p', size: 38, testo: 'Accuratezza attesa ±0,3°. Ai poli è inservibile. {{slide 36}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Log e scandaglio' },
          { t: 'formula', testo: 'd = V · t' },
          { t: 'p', size: 36, testo: 'Il nodo è un miglio nautico all\'ora; un miglio vale 1852 metri. La SOLAS richiede la velocità rispetto all\'acqua (STW); quella rispetto al fondo (SOG) è data da GPS e doppler. {{slide 37}}' },
          { t: 'formula', testo: 'd = v · t / 2' },
          { t: 'p', size: 36, testo: 'L\'ecoscandaglio misura il tirante d\'acqua sotto la chiglia (UKC). Valore standard 1500 m/s; se l\'eco torna dopo 0,2 s: d = 150 m. Obbligatorio dalle 300 GT. {{slide 39, 40}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Cronometro e sestante' },
          { t: 'p', size: 38, testo: 'La Terra ruota di 15° ogni ora: confrontando l\'ora del cronometro, su Greenwich, con l\'ora locale si ottiene la differenza di longitudine. {{slide 41}}' },
          { t: 'p', size: 38, testo: 'Il **sestante** misura l\'angolo tra due direzioni, di solito l\'altezza di un astro sull\'orizzonte. {{slide 43}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Il radar' },
          { t: 'formula', testo: 'D = c · Δt / 2' },
          { t: 'p', size: 36, testo: 'A ogni miglio corrispondono circa 12,4 µs. Gli echi sono sul PPI, con la nave al centro; EBL e VRM danno rilevamento e distanza. {{slide 44, 45}}' },
          { t: 'p', size: 36, testo: 'Banda X (circa 3 cm): adatta alla costa. Banda S (circa 10 cm): meno disturbata. SOLAS: dalle 300 GT, due radar dalle 3000 GT. {{slide 45}}' },
          { t: 'p', size: 36, testo: 'CPA: minima distanza a cui il bersaglio passerà. TCPA: tempo che manca. ARPA (*Automatic Radar Plotting Aid*): calcola tutto in automatico. {{slide 46}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Il GNSS' },
          { t: 'p', size: 38, testo: 'GPS (USA), GLONASS (Russia), Galileo (UE), BeiDou (Cina). {{slide 47}}' },
          { t: 'formula', testo: 'D = c · Δt' },
          { t: 'p', size: 38, testo: 'Tre sfere si intersecano in un punto; l\'errore dell\'orologio del ricevitore è un\'incognita in più: servono almeno quattro satelliti. {{slide 47}}' },
          { t: 'p', size: 38, testo: 'Orbita media, circa 20.000 km di quota. Datum globale WGS 84. {{slide 48}}' },
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
