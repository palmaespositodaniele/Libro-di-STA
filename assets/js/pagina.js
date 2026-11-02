/* Impaginazione delle pagine del libro su tela (canvas): stessa pagina su schermo, LIM e visore.
   Una pagina è una lista di blocchi; disegna() restituisce le zone toccabili. Regole in design.md */
window.Pagina = (function () {
  const W = 1200; const H = 1640; const MX = 90; const TOP = 64; const FONDO = 1470;
  const LARGA = W - MX * 2;
  const C = {
    carta: '#FBFAF4', carta2: '#EEF2F8', griglia: '#D8E0EC', ink: '#0B2545', ink2: '#5B6B7C',
    ocra: '#C9A227', ocraT: '#8C7020', rosso: '#B3362B', verde: '#2F7A55', acqua: '#2E7DB5',
  };
  const TESTO = 44; // 2 cm sul libro in VR: mai meno di 34 per qualsiasi scritta

  function font(stile, size) {
    if (stile === 'b') return `700 ${size}px Atkinson, sans-serif`;
    if (stile === 'i') return `italic ${size}px Atkinson, sans-serif`;
    if (stile === 'c') return `${Math.round(size * 0.74)}px Disegno, cursive`;
    return `${size}px Atkinson, sans-serif`;
  }

  // **grassetto**, *corsivo*, {{slide 5}}
  function pezzi(testo) {
    const out = []; const re = /\*\*(.+?)\*\*|\*(.+?)\*|\{\{(.+?)\}\}/g;
    let ultimo = 0; let m; let spazio = false;
    const aggiungi = (seg, stile, intero) => {
      if (intero) { out.push({ t: seg, stile, sp: true }); spazio = false; return; }
      seg.split(' ').forEach((p, i) => {
        if (i > 0) spazio = true;
        if (p) { out.push({ t: p, stile, sp: spazio }); spazio = false; }
      });
    };
    while ((m = re.exec(testo))) {
      if (m.index > ultimo) aggiungi(testo.slice(ultimo, m.index), 'n');
      if (m[1]) aggiungi(m[1], 'b');
      else if (m[2]) aggiungi(m[2], 'i');
      else aggiungi(m[3], 'c', true);
      ultimo = re.lastIndex;
    }
    if (ultimo < testo.length) aggiungi(testo.slice(ultimo), 'n');
    return out;
  }

  function righe(ctx, testo, size, larg) {
    const lista = []; let riga = []; let x = 0;
    ctx.font = font('n', size);
    const sp = ctx.measureText(' ').width;
    pezzi(testo).forEach((p) => {
      ctx.font = font(p.stile, size);
      const w = ctx.measureText(p.t).width; const dx = (riga.length && p.sp ? sp : 0);
      if (x + dx + w > larg && riga.length) { lista.push(riga); riga = []; x = 0; riga.push({ ...p, x: 0, w }); x = w; } else { riga.push({ ...p, x: x + dx, w }); x += dx + w; }
    });
    if (riga.length) lista.push(riga);
    return lista;
  }

  function scrivi(ctx, testo, x, y, size, larg, colore, centro) {
    const lh = Math.round(size * 1.32);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    righe(ctx, testo, size, larg).forEach((r, i) => {
      const w = r.length ? r[r.length - 1].x + r[r.length - 1].w : 0;
      const ox = centro ? x + (larg - w) / 2 : x;
      r.forEach((p) => {
        ctx.font = font(p.stile, size);
        ctx.fillStyle = p.stile === 'c' ? C.ink2 : colore || C.ink;
        ctx.fillText(p.t, ox + p.x, y + size + i * lh);
      });
    });
    return righe(ctx, testo, size, larg).length * lh;
  }
  const quanteRighe = (ctx, testo, size, larg) => righe(ctx, testo, size, larg).length;

  function bottone(ctx, zone, b) {
    const on = b.on; const off = b.off;
    ctx.globalAlpha = off ? 0.42 : 1;
    ctx.fillStyle = on ? C.ink : C.carta2;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 4;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    const size = b.size || 38;
    ctx.fillStyle = on ? C.carta : C.ink;
    ctx.font = font('b', size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.testo, b.x + b.w / 2, b.y + b.h / 2 + 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
    if (b.id && !off) zone.push({ id: b.id, x: b.x, y: b.y, w: b.w, h: b.h, ripeti: b.ripeti });
  }

  const BLOCCO = {
    titolo(c, b, y) { c.fillStyle = C.ink; return scriviTitolo(c, b.testo, y, 68); },
    sotto(c, b, y) { return scriviTitolo(c, b.testo, y, 48) ; },
    p(c, b, y) { return scrivi(c, b.testo, MX, y, b.size || TESTO, LARGA, b.colore) + 22; },
    nota(c, b, y) { c.save(); const h = scriviDisegno(c, b.testo, y); c.restore(); return h + 16; },
    spazio(c, b) { return b.h; },
    formula(c, b, y) {
      c.font = font('b', 46); const w = Math.min(LARGA, c.measureText(b.testo).width + 56);
      c.fillStyle = C.carta2; c.fillRect(MX, y, w, 88);
      c.fillStyle = C.ink; c.fillText(b.testo, MX + 28, y + 60);
      return 106;
    },
    riquadro(c, b, y) {
      const size = b.size || TESTO; const pad = 28;
      const n = quanteRighe(c, b.testo, size, LARGA - pad * 2);
      const h = n * Math.round(size * 1.32) + pad * 2;
      c.fillStyle = C.carta; c.fillRect(MX, y, LARGA, h);
      c.strokeStyle = b.colore || C.ocra; c.lineWidth = 5; c.strokeRect(MX, y, LARGA, h);
      scrivi(c, b.testo, MX + pad, y + pad, size, LARGA - pad * 2, b.colore);
      return h + 22;
    },
    tabella(c, b, y) {
      const size = b.size || 34; const lh = Math.round(size * 1.3); const pad = 10;
      const tot = b.col.reduce((a, v) => a + v, 0); const larg = b.col.map((v) => (v / tot) * LARGA);
      let yy = y;
      b.righe.forEach((r, i) => {
        const celle = r.map((t, k) => (i === 0 || k === 0 ? `**${t.replace(/\*/g, '')}**` : t));
        const n = Math.max(...celle.map((t, k) => quanteRighe(c, t, size, larg[k] - pad * 2)));
        const h = n * lh + pad * 2;
        let x = MX;
        celle.forEach((t, k) => {
          c.fillStyle = i === 0 ? C.carta2 : C.carta; c.fillRect(x, yy, larg[k], h);
          c.strokeStyle = C.ink2; c.lineWidth = 2; c.strokeRect(x, yy, larg[k], h);
          scrivi(c, t, x + pad, yy + pad - 4, size, larg[k] - pad * 2);
          x += larg[k];
        });
        yy += h;
      });
      return yy - y + 22;
    },
    bottoni(c, b, y, zone) {
      const gap = 16; const n = b.lista.length; const h = b.h || 96;
      const w = (LARGA - gap * (n - 1)) / n;
      b.lista.forEach((x, i) => bottone(c, zone, { ...x, x: MX + i * (w + gap), y, w, h, size: b.size }));
      return h + 22;
    },
    scelta(c, b, y, zone) {
      const n = quanteRighe(c, b.testo, TESTO, LARGA - 60); const h = Math.max(120, n * 58 + 40);
      c.fillStyle = b.on ? C.ink : C.carta2; c.fillRect(MX, y, LARGA, h);
      c.strokeStyle = C.ink; c.lineWidth = 4; c.strokeRect(MX, y, LARGA, h);
      scrivi(c, b.testo, MX + 30, y + 16, TESTO, LARGA - 60, b.on ? C.carta : C.ink);
      zone.push({ id: b.id, x: MX, y, w: LARGA, h });
      return h + 22;
    },
    // Regolatore: al posto di cursori e menu, comodi anche col controller
    passo(c, b, y, zone) {
      const h = 112; const bw = 124;
      bottone(c, zone, { id: `${b.id}-`, testo: '◀', x: MX, y, w: bw, h, ripeti: true, size: 40 });
      bottone(c, zone, { id: `${b.id}+`, testo: '▶', x: MX + LARGA - bw, y, w: bw, h, ripeti: true, size: 40 });
      c.textAlign = 'center';
      c.font = font('n', 34); c.fillStyle = C.ink2; c.fillText(b.nome, W / 2, y + 40);
      c.font = font('b', 40); c.fillStyle = C.ink; c.fillText(b.valore, W / 2, y + 92);
      c.textAlign = 'left';
      return h + 16;
    },
    spunta(c, b, y) {
      const size = 34; const n = quanteRighe(c, b.testo, size, LARGA - 66);
      c.strokeStyle = b.fatta ? C.verde : C.ink; c.lineWidth = 5; c.strokeRect(MX + 3, y + 9, 36, 36);
      if (b.fatta) { c.fillStyle = C.verde; c.fillRect(MX + 3, y + 9, 36, 36); }
      scrivi(c, b.testo, MX + 62, y - 4, size, LARGA - 66);
      return n * 45 + 14;
    },
    esito(c, b, y) { return scrivi(c, b.testo, MX, y, 36, LARGA, b.tipo === 'giusto' ? C.verde : b.tipo === 'errato' ? C.rosso : C.ink2) + 14; },
    voce(c, b, y, zone) {
      const h = 68;
      if (b.pronta) { c.fillStyle = C.carta2; c.fillRect(MX, y, LARGA, h - 6); }
      c.font = font('c', 54); c.fillStyle = C.ink2; c.fillText(String(b.n), MX + 12, y + 46);
      c.font = font(b.pronta ? 'b' : 'n', 36); c.fillStyle = b.pronta ? C.ink : C.ink2;
      c.fillText(b.testo, MX + 80, y + 45);
      if (b.fatta) { c.fillStyle = C.verde; c.fillRect(MX + LARGA - 34, y + 18, 26, 26); }
      if (b.pronta) zone.push({ id: b.id, x: MX, y, w: LARGA, h: h - 6 });
      return h;
    },
    rail(c, b, y, zone) {
      const gap = 6; const w = (LARGA - gap * 4) / 5;
      b.lista.forEach((x, i) => bottone(c, zone, { ...x, x: MX + i * (w + gap), y, w, h: 76, size: 30 }));
      return 96;
    },
    disegno(c, b, y) { b.fn(c, MX, y, LARGA, b.h); return b.h + 20; },
    // Zone riempite dal motore: finestra 3D e lente
    zona(c, b, y, zone) {
      c.strokeStyle = C.ink; c.lineWidth = 4; c.strokeRect(MX, y, LARGA, b.h);
      if (b.testo) scrivi(c, b.testo, MX + 40, y + b.h / 2 - 60, 40, LARGA - 80, C.ink2, true);
      zone.push({ id: b.id, x: MX, y, w: LARGA, h: b.h, area: true });
      return b.h + 18;
    },
    griglia(c, b, y, zone) {
      const gap = 16; const w = (LARGA - gap * (b.col - 1)) / b.col; const h = b.h;
      b.celle.forEach((x, i) => {
        const cx = MX + (i % b.col) * (w + gap); const cy = y + Math.floor(i / b.col) * (h + gap);
        x.fn(c, cx, cy, w, h);
        if (x.id) zone.push({ id: x.id, x: cx, y: cy, w, h });
      });
      return Math.ceil(b.celle.length / b.col) * (h + gap);
    },
    tastierino(c, b, y, zone) {
      const tasti = b.virgola
        ? ['7', '8', '9', '4', '5', '6', '1', '2', '3', ',', '0', 'canc']
        : ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'canc', '0', 'ok'];
      const gap = 14; const w = (LARGA - gap * 2) / 3; const h = b.virgola ? 96 : 104;
      tasti.forEach((t, i) => bottone(c, zone, {
        id: `k:${t}`, testo: t === 'canc' ? 'Cancella' : t === 'ok' ? 'Controlla' : t, on: t === 'ok',
        x: MX + (i % 3) * (w + gap), y: y + Math.floor(i / 3) * (h + gap), w, h, size: 42,
      }));
      if (b.virgola) bottone(c, zone, { id: 'k:ok', testo: 'Controlla', on: true, x: MX, y: y + 4 * (h + gap), w: LARGA, h, size: 42 });
      return (b.virgola ? 5 : 4) * (h + gap) + 8;
    },
    fondo(c, b, y, zone) { b.fn(c, W, H); if (b.id) zone.push({ id: b.id, x: 0, y: 0, w: W, h: H }); return 0; },
  };

  function scriviTitolo(c, testo, y, size) {
    const n = quanteRigheTitolo(c, testo, size);
    c.font = `700 ${size}px Bitter, Georgia, serif`; c.fillStyle = C.ink; c.textBaseline = 'alphabetic';
    const parole = testo.split(' '); let riga = ''; let yy = y + size;
    parole.forEach((p) => {
      const prova = riga ? `${riga} ${p}` : p;
      if (c.measureText(prova).width > LARGA && riga) { c.fillText(riga, MX, yy); riga = p; yy += size * 1.2; } else riga = prova;
    });
    c.fillText(riga, MX, yy);
    return n * size * 1.2 + 24;
  }
  function quanteRigheTitolo(c, testo, size) {
    c.font = `700 ${size}px Bitter, Georgia, serif`;
    let n = 1; let riga = '';
    testo.split(' ').forEach((p) => {
      const prova = riga ? `${riga} ${p}` : p;
      if (c.measureText(prova).width > LARGA && riga) { n++; riga = p; } else riga = prova;
    });
    return n;
  }
  function scriviDisegno(c, testo, y) {
    const size = 42; c.font = `${size}px Disegno, cursive`; c.fillStyle = C.ink2; c.textBaseline = 'alphabetic';
    let riga = ''; let yy = y + size; let n = 1;
    testo.split(' ').forEach((p) => {
      const prova = riga ? `${riga} ${p}` : p;
      if (c.measureText(prova).width > LARGA && riga) { c.fillText(riga, MX, yy); riga = p; yy += size * 1.25; n++; } else riga = prova;
    });
    c.fillText(riga, MX, yy);
    return n * size * 1.25;
  }

  function carta(c, lato) {
    c.fillStyle = C.carta; c.fillRect(0, 0, W, H);
    c.strokeStyle = C.griglia; c.lineWidth = 2; c.beginPath();
    for (let x = 60; x < W; x += 60) { c.moveTo(x, 0); c.lineTo(x, H); }
    for (let y = 60; y < H; y += 60) { c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
    // Piega centrale del libro
    const g = lato === 'sx' ? c.createLinearGradient(W - 90, 0, W, 0) : c.createLinearGradient(90, 0, 0, 0);
    g.addColorStop(0, 'rgba(18,53,91,0)'); g.addColorStop(1, 'rgba(18,53,91,0.22)');
    c.fillStyle = g;
    if (lato === 'sx') c.fillRect(W - 90, 0, 90, H); else c.fillRect(0, 0, 90, H);
  }

  // piede: { sinistra: [bottoni], destra: [bottoni], avviso, numero }
  function disegna(c, blocchi, opz) {
    carta(c, opz.lato);
    const zone = []; let y = TOP; const testo = [];
    (blocchi || []).forEach((b) => {
      y += BLOCCO[b.t](c, b, y, zone);
      if (b.testo) testo.push(String(b.testo).replace(/\*|\{\{|\}\}/g, ''));
    });
    if (opz.piede) {
      const p = opz.piede; const lista = p.bottoni || []; const bw = 330; const gap = 16; const yb = 1516; const hb = 92;
      lista.forEach((b, i) => {
        const x = opz.lato === 'sx' ? MX + i * (bw + gap) : W - MX - bw - i * (bw + gap);
        bottone(c, zone, { ...b, x, y: yb, w: bw, h: hb, size: 36 });
      });
      if (p.avviso) { c.font = font('b', 34); c.fillStyle = C.ocraT; c.textAlign = 'right'; c.fillText(p.avviso, W - MX, 1496); c.textAlign = 'left'; }
    }
    return { zone, trabocco: y > FONDO + 26 ? y : 0, testo: testo.join(' ') };
  }

  return { W, H, MX, LARGA, C, TESTO, disegna, quanteRighe, font };
})();
