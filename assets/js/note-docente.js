/* Note per il docente: uso in classe, fonti citate nelle slide, crediti e licenze */
(function () {
  Motore.sezione('docente', {
    spreads: () => [
      {
        sx: [
          { t: 'titolo', testo: 'Note per il docente' },
          { t: 'p', size: 38, testo: 'Il libro accompagna le slide, non le sostituisce: lo studente prevede, prova e verifica. Ogni pagina cita la slide da cui vengono dati ed esercizi.' },
          { t: 'sotto', testo: 'Sulla LIM' },
          { t: 'p', size: 38, testo: 'Quando manca un passaggio, Avanti diventa **Salta**: si può presentare la lezione senza svolgerla. Senza tutti i passaggi la bandiera non arriva.' },
        ],
        dx: [
          { t: 'sotto', testo: 'In realtà virtuale' },
          { t: 'p', size: 38, testo: 'Serve un visore con un browser WebXR. Meglio sessioni brevi, di 5–10 minuti, a turno, mentre la classe segue sulla LIM.' },
          { t: 'p', size: 38, testo: 'Si punta e si preme il grilletto; ci si sposta con il teletrasporto.' },
          { t: 'sotto', testo: 'I progressi' },
          { t: 'p', size: 38, testo: 'Restano nel browser di ogni dispositivo: non arrivano al docente. Si azzerano dalla pagina delle bandiere.' },
        ],
      },
      {
        sx: [
          { t: 'titolo', testo: 'Fonti citate nelle slide' },
          { t: 'tabella', col: [16, 84], size: 36, righe: [
            ['Lez.', 'Fonte'],
            ['14', 'difesa.it, «Perché la velocità delle navi si misura in nodi»'],
            ['14', 'nauticareport.it, «Il solcometro e l\'origine del nodo»'],
            ['14', 'treccani.it, vocabolario, voce «solcometro»'],
            ['16', 'NASA, svs.gsfc.nasa.gov/5660'],
          ] },
        ],
        dx: [
          { t: 'tabella', col: [16, 84], size: 36, righe: [
            ['Lez.', 'Fonte'],
            ['18', 'P. Di Candia, Appunti di Scienze della Navigazione e Tecnologie Navali 1-III: Meteorologia generale (Parte Prima)'],
            ['18', 'G. Budillon, Appunti del corso di Meteorologia, A.A. 2018-19'],
            ['18', 'NASA Science, Earth\'s Atmosphere e Electromagnetic Spectrum; NASA Earth Observatory, Climate and Earth\'s Energy Budget'],
            ['18', 'IPCC, AR6 Synthesis Report (2023), Summary for Policymakers, e Regional Fact Sheet – Mediterranean'],
          ] },
        ],
      },
      {
        sx: [
          { t: 'titolo', testo: 'Legislazione' },
          { t: 'tabella', col: [16, 84], size: 36, righe: [
            ['Lez.', 'Fonte'],
            ['19', 'Fondamenti di Navigazione 1, capp. 1–2'],
            ['19', 'Fondamenti di Costruzione e Gestione della nave 1, cap. 23; 2, cap. 3'],
            ['19', 'Codice della navigazione, R.D. 30 marzo 1942, n. 327'],
            ['19', 'Direttiva (UE) 2024/3099'],
            ['19', 'imo.org, ilo.org, parismou.org, emsa.europa.eu, gazzettaufficiale.it'],
          ] },
        ],
        dx: [
          { t: 'titolo', testo: 'Logistica' },
          { t: 'tabella', col: [16, 84], size: 36, righe: [
            ['Lez.', 'Fonte'],
            ['20', 'Fondamenti di Costruzione e Gestione della nave 2, cap. 12 e Incoterms'],
            ['20', 'L. 84/1994, D.Lgs. 169/2016, L. 240/1990'],
            ['20', 'ICC, Incoterms 2020; iccwbo.org'],
            ['20', 'Assoporti, Shipping Italy, temi.camera.it, UNCTAD'],
            ['20', 'CSCMP, Lean Enterprise Institute, Etymonline'],
          ] },
        ],
      },
      {
        sx: [
          { t: 'titolo', testo: 'Da ricontrollare' },
          { t: 'p', size: 38, testo: 'Le lezioni 19 e 20 usano dati consultati a ottobre 2026: numero di Stati, ratifiche, traffici e norme cambiano e vanno ricontrollati ogni anno.' },
          { t: 'sotto', testo: 'Scelte del libro' },
          { t: 'p', size: 38, testo: 'Le scene 3D sono schematiche, non disegni tecnici di navi reali. Dove la scala è alterata, la pagina lo dice. I significati delle bandiere vengono dal Codice internazionale dei segnali, non dalle slide.' },
        ],
        dx: [
          { t: 'titolo', testo: 'Crediti e licenze' },
          { t: 'tabella', col: [46, 54], size: 36, righe: [
            ['Componente', 'Licenza'],
            ['Three.js r158', 'MIT, © 2010-2023 Three.js Authors'],
            ['Bitter', 'OFL 1.1, © 2011 The Bitter Project Authors'],
            ['Atkinson Hyperlegible', 'OFL 1.1, © 2020 Braille Institute of America, Inc.'],
            ['Architects Daughter', 'OFL 1.1, © 2010 Kimberly Geswein'],
          ] },
          { t: 'nota', testo: 'Testi completi nel file assets/LICENZE.txt' },
        ],
      },
    ],
  });
})();
