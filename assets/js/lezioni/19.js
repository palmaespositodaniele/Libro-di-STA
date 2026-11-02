/* Lezione 19: la legislazione marittima. Dati ed esercizi dalle slide 3-39 e dalle figure delle slide 8,
   11, 19, 23, 28, 30. Scene schematiche; il numero di Stati e di ratifiche va ricontrollato ogni anno */
(function () {
  const N = 19;
  const { COL, etichetta, maniglia, cuoci } = Tavola;

  const MISSIONI = [
    { id: 'territoriali', testo: 'Porta la nave al limite delle acque territoriali.' },
    { id: 'alto', testo: 'Porta la nave in alto mare.' },
    { id: 'pilastri', testo: 'Assegna ogni argomento al suo pilastro.' },
  ];
  const QUIZ = [
    { n: 1, testo: 'Chi deve dare la precedenza tra due navi in rotta di collisione: dove si trova la regola?', scelte: ['COLREG', 'MLC', 'SAR'], giusta: 0, perche: 'Le regole per prevenire gli abbordi.' },
    { n: 2, testo: 'Chi ispeziona una nave straniera nel porto di Livorno?', scelte: ['L\'IMO', 'La Guardia Costiera', 'Lo Stato di bandiera'], giusta: 1, perche: 'Port State Control (Paris MoU, Direttiva 2009/16/CE).' },
    { n: 3, testo: 'Dove si trova la definizione di «nave» nella legge italiana?', scelte: ['SOLAS', 'Codice della navigazione, art. 136', 'UNCLOS'], giusta: 1, perche: 'Art. 136 del Codice della navigazione.' },
    { n: 4, testo: 'Chi gestisce un grande porto italiano?', scelte: ['L\'Autorità di sistema portuale', 'L\'EMSA', 'Il RINA'], giusta: 0, perche: 'Autorità di sistema portuale: porti di rilevanza nazionale.' },
    { n: 5, testo: 'Dove è fissata la larghezza delle acque territoriali?', scelte: ['MARPOL', 'UNCLOS', 'STCW'], giusta: 1, perche: 'UNCLOS: 12 miglia dalla linea di base.' },
    { n: 6, testo: 'Un regolamento europeo…', scelte: ['Vale subito, uguale, in tutti gli Stati membri', 'Va ratificato', 'È una raccomandazione'], giusta: 0, perche: 'La direttiva, invece, va recepita con una legge entro un termine.' },
  ];
  const lez = Lezione.crea({ n: N, missioni: MISSIONI, quiz: QUIZ });
  const BOX = (w, h, d, col, x, y, z) => { const m = new THREE.Mesh(cuoci(new THREE.BoxGeometry(w, h, d), col), new THREE.MeshBasicMaterial({ vertexColors: true })); m.position.set(x, y, z); return m; };

  /* Simulazione 1: bandiera, porto, costa (slide 7) ------------------------------------------------ */
  const STATI = {
    bandiera: '**Stato di bandiera**: la nave è soggetta alle sue leggi; rilascia i certificati, anche tramite le Società di classificazione.',
    porto: '**Stato del porto**: controlla le navi straniere che arrivano nei suoi porti (*Port State Control*).',
    costa: '**Stato costiero**: applica le sue regole nelle proprie acque, nei limiti fissati dalla UNCLOS.',
  };
  const st = { scelto: null };
  const creaStati = Lezione.simula({
    scala: 0.0095, centro: [45, 2], k: 3, pedana: [45, 44, 'accanto alla nave'],
    vista: () => ({ target: new THREE.Vector3(45, 6, 0), theta: 0.28, phi: 1.2, r: 150 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const dim = 4 + k;
      const nave = Scafo.crea(k); nave.position.y = -6; g.add(nave);
      const asta = Tavola.segmento(new THREE.Vector3(9, 10, 0), new THREE.Vector3(9, 24, 0), 0.25 * Math.sqrt(k), COL.inchiostro); g.add(asta);
      const bandiera = BOX(10, 6, 0.4, '#B3362B', 3.5, 21, 0); bandiera.userData.tocco = 'bandiera'; g.add(bandiera); tocca(bandiera);
      const porto = BOX(120, 4, 26, '#C5CBD3', 45, 1, -26); porto.userData.tocco = 'porto'; g.add(porto); tocca(porto);
      const gru = BOX(4, 20, 4, '#C9A227', 62, 12, -28); gru.userData.tocco = 'porto'; g.add(gru); tocca(gru);
      const costa = BOX(40, 3, 150, '#8FA36E', 128, 1, 0); costa.userData.tocco = 'costa'; g.add(costa); tocca(costa);
      [['Bandiera', 3, 28, 0], ['Porto', 45, 9, -26], ['Costa', 128, 8, 0]].forEach(([t, x, y, z]) => { const e = etichetta(t, dim, '#FBFAF4'); e.position.set(x, y, z); g.add(e); });
      return g;
    },
  });
  function comandiStati(id) { if (id.startsWith('t:')) st.scelto = id.slice(2).split(',')[0]; }

  /* Simulazione 2: le zone del mare (slide 8). Distanze compresse, come nella figura ------------------- */
  const zo = { d: 6, copie: [] };
  const XZ = (d) => 34 * Math.log2(1 + d / 3);
  function zonaMare() {
    if (zo.d <= 12) return ['Acque territoriali', 'fino a 12 miglia dalla linea di base'];
    if (zo.d <= 24) return ['Zona contigua', 'fino a 24 miglia dalla linea di base'];
    if (zo.d <= 200) return ['Zona economica esclusiva', 'fino a 200 miglia dalla linea di base'];
    return ['Alto mare', 'oltre le 200 miglia'];
  }
  const potere = () => (zo.d <= 12 ? 4 : zo.d <= 24 ? 3 : zo.d <= 200 ? 2 : 1);
  function posaZone() { zo.copie.forEach((c) => { c.nave.position.x = XZ(zo.d); }); }
  const creaZone = Lezione.simula({
    scala: 0.0048, centro: [100, 2], k: 3.5, pedana: [100, 86, 'sul mare'], dopo: posaZone,
    vista: () => ({ target: new THREE.Vector3(98, 2, 0), theta: 0, phi: 1.08, r: 275 }),
    modello(k, tocca) {
      const g = new THREE.Group(); const dim = 7 + k;
      g.add(BOX(70, 3, 240, '#D9CFB5', -36, 1, 0));
      const banda = (d0, d1, col, nome) => {
        const x0 = d0 ? XZ(d0) : 0; const x1 = XZ(d1);
        const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.3, 200), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 })); m.position.set((x0 + x1) / 2, 0.25, 0); g.add(m);
        const e = etichetta(nome, dim, '#FBFAF4'); e.position.set((x0 + x1) / 2, 9, 66); g.add(e);
      };
      banda(0, 12, 0x0B2545, '12'); banda(12, 24, 0x13315C, '24'); banda(24, 200, 0x5B6B7C, '200');
      const nave = new THREE.Group(); const sc = Scafo.crea(k); sc.scale.setScalar(0.42); sc.position.set(-19, -2.5, 0); nave.add(sc); g.add(nave);
      const presa = maniglia(4 + k * 0.6, 'd'); presa.position.set(0, 17, 0); nave.add(presa); tocca(presa);
      zo.copie.push({ nave });
      return g;
    },
    trascina(id, dx) {
      const prima = `${Math.round(zo.d)}|${zonaMare()[0]}`;
      const x = Math.max(XZ(1), Math.min(XZ(330), XZ(zo.d) + dx * 0.24));
      zo.d = 3 * (2 ** (x / 34) - 1);
      posaZone();
      if (Math.abs(zo.d - 12) < 1.5) lez.completa('territoriali');
      if (zo.d > 200) lez.completa('alto');
      if (`${Math.round(zo.d)}|${zonaMare()[0]}` !== prima) Motore.ridisegna();
    },
  });

  /* Simulazione 3: il tempio dei quattro pilastri (slide 25, esercizi delle slide 36 e 38) -------------- */
  const PILASTRI = [['SOLAS', 'la vita umana in mare'], ['MARPOL', 'l\'ambiente marino'], ['STCW', 'formazione e guardia'], ['MLC', 'il lavoro a bordo']];
  const TEMI = [
    ['Il corso di Basic Training che serve per imbarcare', 'STCW', 'Capitolo VI, i «corsi IMO».'],
    ['Le ore di riposo e il contratto di arruolamento', 'MLC', 'Titolo 2, condizioni d\'impiego.'],
    ['Il numero di zattere e salvagenti a bordo', 'SOLAS', 'Capitolo III, mezzi di salvataggio.'],
    ['Lo scarico in mare dei rifiuti di cucina', 'MARPOL', 'Annesso V, rifiuti.'],
    ['Le emissioni di zolfo dei motori', 'MARPOL', 'Annesso VI, inquinamento dell\'aria.'],
  ];
  const te = { i: 0, esito: null };
  const creaTempio = Lezione.simula({
    scala: 0.016, centro: [0, 12], mare: false, k: 2, pedana: [0, 40, 'davanti al tempio'],
    vista: () => ({ target: new THREE.Vector3(0, 13, 0), theta: 0.03, phi: 1.42, r: 74 }),
    modello(k, tocca) {
      const g = new THREE.Group();
      g.add(BOX(60, 2, 22, '#D8E0EC', 0, 1, 0), BOX(62, 3, 24, '#0B2545', 0, 28, 0));
      const tetto = new THREE.Shape([new THREE.Vector2(-32, 0), new THREE.Vector2(32, 0), new THREE.Vector2(0, 9)]);
      const t = new THREE.Mesh(new THREE.ExtrudeGeometry(tetto, { depth: 24, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: COL.ocra })); t.position.set(0, 29.5, -12); g.add(t);
      PILASTRI.forEach(([nome], i) => {
        const c = new THREE.Mesh(cuoci(new THREE.CylinderGeometry(5.2, 5.6, 24, 18), i % 2 ? '#13315C' : '#EEF2F8'), new THREE.MeshBasicMaterial({ vertexColors: true }));
        c.position.set(-21 + i * 14, 14.5, 3); c.userData.tocco = nome; g.add(c); tocca(c);
        const e = etichetta(nome, 2.6 + k * 0.5, i % 2 ? '#FBFAF4' : '#0B2545'); e.position.set(-21 + i * 14, 15, 10); g.add(e);
      });
      return g;
    },
  });
  function comandiTempio(id) {
    if (!id.startsWith('t:') || te.i >= TEMI.length) return;
    const scelto = id.slice(2).split(',')[0]; const [, giusto, dove] = TEMI[te.i];
    if (scelto === giusto) {
      te.esito = { tipo: 'giusto', testo: `${giusto}: ${dove}` }; te.i += 1;
      if (te.i === TEMI.length) lez.completa('pilastri');
    } else te.esito = { tipo: 'errato', testo: 'Non è questo pilastro: riprova.' };
  }

  /* Simulazione 4: l'accettazione tacita (slide 19) ------------------------------------------------- */
  const ta = { stati: 10, tonn: 20, copie: [] };
  const accettato = () => ta.stati <= 100 / 3 && ta.tonn < 50;
  function posaTacita() {
    ta.copie.forEach((c) => {
      [[c.a, c.pa, ta.stati], [c.b, c.pb, ta.tonn]].forEach(([m, p, v]) => { const h = Math.max(0.1, v * 0.4); m.scale.y = h; m.position.y = h / 2; p.position.y = h + 3; });
      c.luce.material.color.setHex(accettato() ? 0x2F7A55 : COL.rosso);
    });
  }
  const creaTacita = Lezione.simula({
    scala: 0.016, centro: [0, 18], mare: false, k: 2, pedana: [0, 36, 'davanti alle colonne'], dopo: posaTacita,
    vista: () => ({ target: new THREE.Vector3(0, 19, 0), theta: 0.1, phi: 1.46, r: 90 }),
    modello(k, tocca) {
      const g = new THREE.Group();
      g.add(BOX(46, 1, 16, '#D8E0EC', 0, -0.5, 0));
      const colonna = (x, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(9, 1, 9), new THREE.MeshBasicMaterial({ color: col })); m.position.x = x; g.add(m); return m; };
      const a = colonna(-12, 0x13315C); const b = colonna(12, 0x5B6B7C);
      g.add(BOX(13, 0.5, 11, '#B3362B', -12, (100 / 3) * 0.4, 0), BOX(13, 0.5, 11, '#B3362B', 12, 20, 0));
      [['Stati contrari', -12], ['Tonnellaggio contrario', 12]].forEach(([t, x]) => { const e = etichetta(t, 2.8 + k * 0.4); e.position.set(x, -2.5, 7); g.add(e); });
      const pa = maniglia(2 * Math.sqrt(k), 'stati'); pa.position.x = -12; const pb = maniglia(2 * Math.sqrt(k), 'tonn'); pb.position.x = 12;
      g.add(pa, pb); tocca(pa); tocca(pb);
      const luce = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshBasicMaterial({ color: 0x2F7A55 })); luce.position.set(0, 40, 0); g.add(luce);
      ta.copie.push({ a, b, pa, pb, luce });
      return g;
    },
    trascina(id, dx, dy) {
      const prima = `${Math.round(ta.stati)}|${Math.round(ta.tonn)}`;
      ta[id] = Math.max(0, Math.min(100, ta[id] - dy * 0.25));
      posaTacita();
      if (`${Math.round(ta.stati)}|${Math.round(ta.tonn)}` !== prima) Motore.ridisegna();
    },
  });

  const CAPITOLI_SOLAS = [
    ['I', 'Disposizioni generali'], ['II-1', 'Costruzione e stabilità'], ['II-2', 'Antincendio'], ['III', 'Mezzi di salvataggio'], ['IV', 'Radiocomunicazioni (GMDSS)'], ['V', 'Sicurezza della navigazione'], ['VI', 'Trasporto dei carichi'], ['VII', 'Merci pericolose'], ['VIII', 'Navi nucleari'], ['IX', 'Gestione della sicurezza (ISM)'], ['X', 'Unità veloci'], ['XI-1', 'Misure speciali di sicurezza'], ['XI-2', 'Security (ISPS)'], ['XII', 'Navi portarinfuse'], ['XIII', 'Verifica della conformità'], ['XIV', 'Acque polari (Polar Code)'], ['XV', 'Personale industriale'],
  ];
  const so = { c: 5 };
  function comandiSolas(id) { if (id === 'c+') so.c = (so.c + 1) % CAPITOLI_SOLAS.length; if (id === 'c-') so.c = (so.c + CAPITOLI_SOLAS.length - 1) % CAPITOLI_SOLAS.length; }
  const ri = new Set();
  function comandiDomande(id) { if (id.startsWith('r:')) ri.add(Number(id.slice(2))); }

  lez.registra(() => {
    const p = Libro.stato(N).prevedi; const RISPOSTE = { a: '6 miglia', b: '12 miglia', c: '24 miglia' };
    const z = zonaMare();
    const DOM = [
      ['Una nave con bandiera di Malta e un equipaggio filippino arriva a Genova. Chi può ispezionarla?', 'Malta certifica la nave. L\'Italia, Stato del porto, può ispezionarla con la Guardia Costiera, verificando SOLAS, MARPOL, STCW, MLC e Load Lines.'],
      ['Perché un regolamento UE vale subito, mentre una convenzione IMO va ratificata?', 'L\'IMO non può imporre norme agli Stati: servono firma e ratifica. I regolamenti sono direttamente applicabili; le direttive vanno recepite con una legge.'],
    ];
    return [
      {
        passo: 0,
        sx: [
          { t: 'titolo', testo: 'Una nave, quante leggi?' },
          { t: 'p', testo: 'Una portacontainer batte bandiera di Malta, appartiene a una società greca, ha un equipaggio filippino e italiano e arriva a Genova. Di quale Stato sono le regole? Di molti. {{slide 3}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Tre livelli' },
          { t: 'tabella', col: [28, 72], size: 34, righe: [['Livello', 'Chi scrive'], ['Mondiale', 'agenzie ONU, soprattutto l\'IMO: standard minimi'], ['Regionale', 'Unione Europea: spesso chiede di più'], ['Nazionale', 'in Italia, il Codice della navigazione']] },
          { t: 'p', size: 38, testo: 'Più che una gerarchia, sono livelli da tenere allineati. {{slide 5}}' },
        ],
      },
      {
        passo: 0, mondo: creaStati, azione: comandiStati,
        sx: [
          { t: 'titolo', testo: 'Bandiera, porto, costa' },
          { t: 'riquadro', size: 38, testo: st.scelto ? `${STATI[st.scelto]} {{slide 7}}` : 'Tocca la bandiera, il porto o la costa.' },
          { t: 'nota', testo: 'Scena schematica' },
        ],
        dx: Lezione.finestra(760, 'Punta la bandiera, il porto o la costa e premi il grilletto.'),
      },
      {
        passo: 1,
        sx: [{ t: 'titolo', testo: 'Prima di provare' }, { t: 'p', testo: 'La UNCLOS, firmata a Montego Bay nel 1982, divide il mare in zone misurate dalla linea di base. {{slide 8}}' }],
        dx: [
          { t: 'sotto', testo: 'Fino a quante miglia arrivano le acque territoriali?' },
          { t: 'spazio', h: 20 },
          { t: 'scelta', id: 'p:a', testo: '6 miglia', on: p === 'a' }, { t: 'scelta', id: 'p:b', testo: '12 miglia', on: p === 'b' }, { t: 'scelta', id: 'p:c', testo: '24 miglia', on: p === 'c' },
        ],
      },
      {
        passo: 2, mondo: creaZone, richiede: lez.fatto.prevedi, avviso: 'Se salti, niente bandiera.',
        sx: [
          ...(p ? [{ t: 'nota', testo: `La tua previsione: ${RISPOSTE[p]}.` }] : []),
          { t: 'sotto', testo: 'Le zone del mare' },
          { t: 'riquadro', size: 40, testo: `A ${Math.round(zo.d)} miglia: **${z[0]}**, ${z[1]}. {{slide 8}}` },
          { t: 'p', size: 36, testo: `Poteri dello Stato costiero: ${'■'.repeat(potere())}${'□'.repeat(4 - potere())}` },
          { t: 'nota', testo: 'Più ci si allontana dalla costa, meno poteri ha lo Stato costiero. Le tacche sono solo un confronto.' },
          ...lez.missioni().slice(0, 2),
        ],
        dx: [...Lezione.finestra(760), { t: 'nota', testo: 'Trascina la sfera d\'oro verso il largo. Distanze non in scala.' }],
      },
      {
        passo: 2, mondo: creaTempio, azione: comandiTempio, richiede: () => lez.fatte.has('alto'), avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'sotto', testo: 'Chi se ne occupa?' },
          { t: 'riquadro', size: 40, testo: te.i < TEMI.length ? `**${TEMI[te.i][0]}**` : 'Tutti gli argomenti sono al loro posto.' },
          ...(te.esito ? [{ t: 'esito', ...te.esito }] : []),
          ...lez.missioni().slice(2),
          { t: 'nota', testo: 'Tocca il pilastro giusto: sono gli esercizi delle slide 36 e 38.' },
        ],
        dx: Lezione.finestra(760, 'Punta un pilastro e premi il grilletto.'),
      },
      {
        passo: 3, aletta: lez.fatto.aletta, richiede: lez.fatto.missioni, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Che cosa succede' },
          ...(p ? [{ t: 'nota', testo: p === 'b' ? 'Avevi previsto giusto.' : `Avevi previsto: ${RISPOSTE[p]}.` }] : []),
          { t: 'p', testo: 'Le acque territoriali arrivano a 12 miglia dalla linea di base; la zona contigua a 24; la ZEE a 200. {{slide 8}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'I quattro pilastri' },
          { t: 'tabella', col: [24, 16, 22, 38], size: 30, righe: [['Convenzione', 'Org.', 'In vigore', 'Tema'], ['SOLAS', 'IMO', '1980', 'sicurezza della nave'], ['MARPOL', 'IMO', '1983', 'inquinamento dalle navi'], ['STCW', 'IMO', '1984', 'formazione e guardia'], ['MLC', 'ILO', '2013', 'lavoro a bordo']] },
          { t: 'nota', testo: 'slide 31' },
        ],
      },
      {
        passo: 3, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [
          { t: 'titolo', testo: 'Convenzioni e direttive' },
          { t: 'p', size: 38, testo: '**Convenzione**: accordo tra Stati; vale solo dopo la ratifica. {{slide 6}}' },
          { t: 'p', size: 38, testo: '**Regolamento**: vale subito, uguale, in tutti gli Stati membri. {{slide 6}}' },
          { t: 'p', size: 38, testo: '**Direttiva**: fissa un obiettivo; ogni Stato la recepisce con una sua legge entro un termine. {{slide 6}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Il Codice della navigazione' },
          { t: 'p', size: 36, testo: 'R.D. 30 marzo 1942, n. 327. Quattro Parti: marittima e interna, aerea, norme penali e disciplinari, norme transitorie e complementari. {{slide 10, 11}}' },
          { t: 'riquadro', size: 36, testo: '«Al comandante della nave, in modo esclusivo, spetta la direzione della manovra e della navigazione.» {{art. 295}}' },
          { t: 'p', size: 36, testo: 'Art. 178: le annotazioni sul giornale nautico, se regolari, hanno valore di prova. {{slide 12}}' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'L\'IMO' },
          { t: 'p', size: 36, testo: 'Agenzia ONU con sede a Londra: IMCO dal 1948, IMO dal 1982. 176 Stati membri e 3 associati. Non può imporre le regole: servono le ratifiche. {{slide 16}}' },
          { t: 'p', size: 36, testo: '**Assemblea**: tutti gli Stati, ogni due anni. **Consiglio**: 40 Stati. **MSC** e **MEPC**: comitati tecnici. {{slide 17}}' },
          { t: 'p', size: 36, testo: 'Produce convenzioni, codici, risoluzioni e circolari. {{slide 18}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Chi controlla in Italia' },
          { t: 'p', size: 36, testo: '**MIT**: indirizzo e norme. **Capitanerie di porto – Guardia Costiera**: sicurezza, soccorso, controlli, gente di mare. **AdSP**: i porti principali. **Società di classificazione**, come il RINA. {{slide 13}}' },
          { t: 'p', size: 36, testo: 'Agenzie ONU: IMO, ILO, ITU, WMO. {{slide 15}}' },
        ],
      },
      {
        passo: 3, mondo: creaTacita,
        sx: [
          { t: 'titolo', testo: 'L\'accettazione tacita' },
          { t: 'p', size: 36, testo: 'Il silenzio vale come sì: l\'emendamento passa se non si oppongono più di un terzo degli Stati, o Stati con almeno metà del tonnellaggio. {{slide 19}}' },
          { t: 'riquadro', size: 38, testo: `Stati contrari ${Math.round(ta.stati)}%, tonnellaggio contrario ${Math.round(ta.tonn)}%: **${accettato() ? 'emendamento accettato' : 'emendamento non accettato'}**.` },
          { t: 'nota', testo: 'Tira su le sfere d\'oro. Le fasce rosse sono le soglie; la luce è verde se l\'emendamento passa.' },
        ],
        dx: Lezione.finestra(760),
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'Europa e controlli' },
          { t: 'p', size: 36, testo: 'L\'UE interviene soprattutto dopo i grandi disastri: Erika (1999), Prestige (2002). Oggi regola anche le emissioni: ETS e FuelEU Maritime. {{slide 21}}' },
          { t: 'p', size: 36, testo: '**EMSA**: Lisbona, 2002. **Paris MoU**: 1982, coordina le ispezioni e pubblica le liste bianca, grigia e nera. {{slide 22}}' },
        ],
        dx: [
          { t: 'titolo', testo: 'Il Port State Control' },
          { t: 'tabella', col: [12, 88], size: 32, righe: [['', 'Passo'], ['1', 'ispezione iniziale: certificati, condizioni, igiene'], ['2', '«chiari indizi» di irregolarità?'], ['3', 'no: nave in regola'], ['4', 'sì: ispezione approfondita'], ['5', 'carenze o fermo nave']] },
          { t: 'nota', testo: 'slide 23' },
        ],
      },
      {
        passo: 3, azione: comandiSolas,
        sx: [
          { t: 'titolo', testo: 'SOLAS' },
          { t: 'p', size: 36, testo: '*Safety Of Life At Sea*: nasce dopo il Titanic; versione attuale del 1974. Vale per le navi in viaggi internazionali. {{slide 26}}' },
          { t: 'passo', id: 'c', nome: `Capitolo ${CAPITOLI_SOLAS[so.c][0]}`, valore: CAPITOLI_SOLAS[so.c][1] },
          { t: 'nota', testo: 'slide 27' },
        ],
        dx: [
          { t: 'titolo', testo: 'MARPOL' },
          { t: 'tabella', col: [16, 84], size: 32, righe: [['Ann.', 'Argomento'], ['I', 'idrocarburi'], ['II', 'sostanze liquide nocive'], ['III', 'sostanze nocive in colli'], ['IV', 'acque nere (liquami)'], ['V', 'rifiuti (*garbage*)'], ['VI', 'inquinamento dell\'aria']] },
          { t: 'nota', testo: 'slide 28' },
        ],
      },
      {
        passo: 3,
        sx: [
          { t: 'titolo', testo: 'STCW e MLC' },
          { t: 'p', size: 36, testo: '**STCW**: competenze minime su tre livelli; Capitolo VI, i «corsi IMO». {{slide 29}}' },
          { t: 'p', size: 36, testo: '**MLC 2006**: la «carta dei diritti» della gente di mare, ratificata da 113 Stati. {{slide 30}}' },
          { t: 'tabella', col: [14, 86], size: 30, righe: [['Tit.', 'Argomento'], ['1', 'età, visita medica'], ['2', 'contratto, salario, orari'], ['3', 'alloggi, svago, cibo'], ['4', 'salute, cure, previdenza'], ['5', 'certificati, ispezioni, reclami']] },
        ],
        dx: [
          { t: 'titolo', testo: 'Altre norme' },
          { t: 'p', size: 36, testo: 'COLREG 1972, SAR 1979, Load Lines 1966, BWM 2004. {{slide 32}}' },
          { t: 'p', size: 36, testo: 'Codici: ISM, ISPS, LSA, FSS, IMDG. {{slide 32}}' },
        ],
      },
      {
        passo: 3, azione: comandiDomande,
        sx: [
          { t: 'titolo', testo: 'Pensaci' },
          ...DOM.flatMap(([d, r], i) => [{ t: 'p', size: 36, testo: d }, ri.has(i) ? { t: 'riquadro', size: 34, testo: r } : { t: 'bottoni', h: 76, size: 32, lista: [{ id: `r:${i}`, testo: 'Vedi la risposta' }] }]),
        ],
        dx: [{ t: 'nota', testo: 'Domande teoriche delle slide 34 e 35' }],
      },
      {
        passo: 4, richiede: lez.fatto.aletta, avviso: 'Se salti, niente bandiera.',
        sx: [{ t: 'titolo', testo: 'Chi se ne occupa?' }, ...lez.domanda(1), ...lez.domanda(2), ...lez.domanda(3)],
        dx: [{ t: 'nota', testo: 'Domande da 1 a 5: esercizi delle slide 37 e 39. La 6 viene dalla slide 6.' }, ...lez.domanda(4), ...lez.domanda(5), ...lez.domanda(6)],
      },
      lez.premio(() => lez.fatto.quiz(QUIZ.map((q) => q.n))),
    ];
  });
})();
