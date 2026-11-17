(function () {
  var BR = 'pt-BR';
  var DATA = window.CHURN_DATA;
  var BASE = '#ff7a3d';
  var INK = '#ffffff';
  var MIN_N = 30;

  // Linhas: 8 códigos de categoria + clientes, cancelados, soma de meses (todos), soma de meses (cancelados)
  var ROWS = DATA.split(';').map(function (r) {
    var a = r.split(','), o = [], i;
    for (i = 0; i < 8; i++) o.push(+a[0].charAt(i));
    o.push(+a[1], +a[2], +a[3], +a[4]);
    return o;
  });
  var IN = 8, IC = 9, IST = 10, ISC = 11;

  // pos = posição do código na linha; order = ordem de exibição dos códigos
  var DIMS = [
    { id: 'tempo', pos: 0, name: 'Tempo de casa', title: 'Churn por tempo de casa', span: 6,
      labels: ['0 a 6 meses', '7 a 12 meses', '13 a 24 meses', '25 a 48 meses', '49+ meses'], order: [0, 1, 2, 3, 4] },
    { id: 'pagamento', pos: 2, name: 'Pagamento', title: 'Churn por forma de pagamento', span: 6,
      labels: ['Cheque eletrônico', 'Cheque pelo correio', 'Transferência automática', 'Cartão de crédito automático'], order: [0, 1, 2, 3] },
    { id: 'contrato', pos: 1, name: 'Contrato', title: 'Churn por tipo de contrato', span: 4,
      labels: ['Mensal', '1 ano', '2 anos'], order: [0, 1, 2] },
    { id: 'internet', pos: 3, name: 'Internet', title: 'Churn por serviço de internet', span: 4,
      labels: ['DSL', 'Fibra óptica', 'Sem internet'], order: [1, 0, 2] },
    { id: 'suporte', pos: 6, name: 'Suporte técnico', title: 'Churn por suporte técnico', span: 4,
      labels: ['Sem suporte', 'Com suporte', 'Sem internet'], order: [0, 1, 2] },
    { id: 'telefone', pos: 4, name: 'Telefone', title: 'Churn por serviço de telefone', span: 4,
      labels: ['Sem telefone', 'Com telefone'], order: [1, 0] },
    { id: 'idoso', pos: 5, name: 'Idoso', title: 'Churn por cliente idoso', span: 4,
      labels: ['Não idoso', 'Idoso'], order: [1, 0] },
    { id: 'dep', pos: 7, name: 'Dependentes', title: 'Churn por dependentes', span: 4,
      labels: ['Sem dependentes', 'Com dependentes'], order: [0, 1] }
  ];
  function dimById(id) { return DIMS.filter(function (d) { return d.id === id; })[0]; }

  var sel = {};            // id da dimensão -> lista de códigos selecionados
  var metric = 'rate';     // 'rate' | 'count'
  var openTbl = {};        // tabelas abertas
  var narrow = window.innerWidth < 600;

  function n(v) { return v.toLocaleString(BR); }
  function p(v) { return (v * 100).toLocaleString(BR, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'; }
  function m1(v) { return v.toLocaleString(BR, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function hex(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function mix(a, b, t) {
    var A = hex(a), B = hex(b);
    return '#' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0'); }).join('');
  }
  var C_TOP = mix(BASE, '#ffffff', 0.35);
  var C_SIDE = mix(BASE, '#000000', 0.38);
  var C_BACK = mix(BASE, '#000000', 0.62);
  var C_GREY = '#97a0af';

  function pass(row, skipId) {
    var i, d, a;
    for (i = 0; i < DIMS.length; i++) {
      d = DIMS[i];
      if (d.id === skipId) continue;
      a = sel[d.id];
      if (a && a.length && a.indexOf(row[d.pos]) < 0) return false;
    }
    return true;
  }
  // Totais com todos os filtros
  function totals() {
    var t = { n: 0, c: 0, st: 0, sc: 0 };
    ROWS.forEach(function (r) {
      if (!pass(r, null)) return;
      t.n += r[IN]; t.c += r[IC]; t.st += r[IST]; t.sc += r[ISC];
    });
    return t;
  }
  // Grupos de uma dimensão, com os filtros das outras dimensões
  function groups(d) {
    var out = d.labels.map(function () { return { n: 0, c: 0 }; });
    ROWS.forEach(function (r) {
      if (!pass(r, d.id)) return;
      out[r[d.pos]].n += r[IN]; out[r[d.pos]].c += r[IC];
    });
    return d.order.map(function (code) {
      return { code: code, label: d.labels[code], n: out[code].n, c: out[code].c };
    });
  }
  function rateOf(g) { return g.n ? g.c / g.n : 0; }
  function val(g) { return metric === 'rate' ? rateOf(g) : g.c; }

  // Escala com até 4 intervalos e passos redondos
  function nice(mx, steps) {
    var i, k;
    for (i = 0; i < steps.length; i++) {
      k = Math.max(1, Math.ceil(mx / steps[i] - 1e-9));
      if (k <= 4) return { step: steps[i], k: k, max: steps[i] * k };
    }
    k = 4; return { step: mx / 4, k: k, max: mx };
  }

  function labelSvg(text, cx, y, maxW, on, fs) {
    var est = text.length * fs * 0.53, w = on ? ' font-weight="500"' : '';
    if (est <= maxW || text.indexOf(' ') < 0) {
      return '<text x="' + cx + '" y="' + y + '" text-anchor="middle" font-size="' + fs + '"' + w + ' fill="' + INK + '">' + esc(text) + '</text>';
    }
    var words = text.split(' '), best = 1, diff = 1e9, i;
    for (i = 1; i < words.length; i++) {
      var dd = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
      if (dd < diff) { diff = dd; best = i; }
    }
    return '<text x="' + cx + '" text-anchor="middle" font-size="' + fs + '"' + w + ' fill="' + INK + '">' +
      '<tspan x="' + cx + '" y="' + y + '">' + esc(words.slice(0, best).join(' ')) + '</tspan>' +
      '<tspan x="' + cx + '" y="' + (y + fs + 3) + '">' + esc(words.slice(best).join(' ')) + '</tspan></text>';
  }

  function chart3d(d, items, sc, avg) {
    var uid = d.id, cnt = items.length;
    var W = d.span === 6 ? (narrow ? 340 : 640) : 380, H = 300;
    var padL = metric === 'count' ? 46 : 34, padR = 14, padT = 50, padB = 56;
    var baseY = H - padB, plotH = baseY - padT;
    var slot = (W - padL - padR) / cnt;
    var bw = Math.min(64, Math.round(slot * 0.5));
    var dp = Math.round(bw * 0.32);
    var vals = items.map(val);
    var peak = Math.max.apply(null, vals);
    var dimSel = sel[d.id] || [];
    function yOf(v) { return baseY - v / sc.max * plotH; }

    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(d.title) + '">';
    s += '<defs>' +
      '<linearGradient id="glass-' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + mix(BASE, '#ffffff', 0.2) + '" stop-opacity="0.96"/><stop offset="1" stop-color="' + BASE + '" stop-opacity="0.9"/></linearGradient>' +
      '<linearGradient id="shine-' + uid + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0.42"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>' +
      '<filter id="blur-' + uid + '" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>' +
      '</defs>';

    var j, v, y;
    for (j = 0; j <= sc.k; j++) {
      v = sc.step * j; y = yOf(v);
      s += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="' + (j === 0 ? '#4d4d4d' : '#262626') + '" stroke-width="1"/>';
      s += '<text x="' + (padL - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="#999999">' + (metric === 'rate' ? Math.round(v * 100) + '%' : n(Math.round(v))) + '</text>';
    }
    if (avg !== null && avg <= sc.max) {
      var ya = yOf(avg);
      s += '<line x1="' + padL + '" y1="' + ya + '" x2="' + (W - padR) + '" y2="' + ya + '" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.5"/>';
    }

    items.forEach(function (it, i) {
      var vv = vals[i];
      var h = vv > 0 ? Math.max(vv / sc.max * plotH, 3) : 0;
      var cx = padL + slot * (i + 0.5);
      var x = cx - (bw + dp) / 2;
      var yTop = baseY - h;
      var on = dimSel.indexOf(it.code) >= 0;
      var dim = dimSel.length > 0 && !on;
      var small = it.n > 0 && it.n < MIN_N;
      var tip = it.label + ': ' + (it.n ? p(rateOf(it)) + ' de churn. ' : 'sem clientes nesta seleção. ') +
        n(it.c) + ' cancelados de ' + n(it.n) + ' clientes.' + (small ? ' Amostra pequena.' : '') +
        (on ? ' Clique para remover o filtro.' : ' Clique para filtrar.');
      s += '<g class="col' + (on ? ' on' : '') + (dim ? ' dim' : '') + '" tabindex="0" role="button" aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="' + esc(tip) + '" data-tip="' + esc(tip) + '" data-dim="' + d.id + '" data-code="' + it.code + '">';
      s += '<rect x="' + (padL + slot * i) + '" y="' + (padT - 12) + '" width="' + slot + '" height="' + (H - padT + 12) + '" fill="transparent"/>';
      if (h > 0) {
        s += '<ellipse cx="' + (x + (bw + dp) / 2) + '" cy="' + (baseY - dp / 2 + 5) + '" rx="' + (bw * 0.7 + dp * 0.6) + '" ry="7" fill="#000000" opacity="0.55" filter="url(#blur-' + uid + ')"/>';
        s += '<g class="bar3d">';
        s += '<rect x="' + (x + dp) + '" y="' + (yTop - dp) + '" width="' + bw + '" height="' + h + '" fill="' + C_BACK + '"/>';
        s += '<polygon points="' + (x + bw) + ',' + yTop + ' ' + (x + bw + dp) + ',' + (yTop - dp) + ' ' + (x + bw + dp) + ',' + (baseY - dp) + ' ' + (x + bw) + ',' + baseY + '" fill="' + C_SIDE + '"/>';
        s += '<polygon points="' + x + ',' + yTop + ' ' + (x + dp) + ',' + (yTop - dp) + ' ' + (x + bw + dp) + ',' + (yTop - dp) + ' ' + (x + bw) + ',' + yTop + '" fill="' + C_TOP + '"/>';
        s += '<rect class="face-front" x="' + x + '" y="' + yTop + '" width="' + bw + '" height="' + h + '" fill="url(#glass-' + uid + ')" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1"/>';
        s += '<rect x="' + (x + bw * 0.12) + '" y="' + (yTop + 2) + '" width="' + (bw * 0.22) + '" height="' + Math.max(h - 4, 0) + '" fill="url(#shine-' + uid + ')"/>';
        if (vv === peak && !dim) {
          s += '<rect class="pulse" x="' + x + '" y="' + yTop + '" width="' + bw + '" height="' + h + '"/>';
        }
        s += '</g>';
      }
      var txt = metric === 'rate' ? (it.n ? p(rateOf(it)) : '–') : n(it.c);
      if (small && metric === 'rate') txt += '*';
      s += '<text x="' + cx + '" y="' + (h > 0 ? yTop - dp - 8 : baseY - 8) + '" text-anchor="middle" font-size="' + (vv === peak && vv > 0 ? 16 : 14) + '" font-weight="500" fill="#ffffff" stroke="#141414" stroke-width="4" stroke-linejoin="round" paint-order="stroke">' + txt + '</text>';
      if (on) s += '<rect class="mark" x="' + (cx - 14) + '" y="' + (baseY + 4) + '" width="28" height="3" fill="' + INK + '"/>';
      s += labelSvg(it.label, cx, baseY + 22, slot - 8, on, slot < 90 ? 11 : 13);
      s += '</g>';
    });
    s += '</svg>';
    return s;
  }

  function subtitle(items) {
    var ok = items.filter(function (g) { return g.n > 0; });
    if (!ok.length) return 'Nenhum cliente nesta seleção.';
    if (ok.length === 1) return ok[0].label + ': ' + p(rateOf(ok[0])) + ' (' + n(ok[0].c) + ' de ' + n(ok[0].n) + ').';
    var best = ok[0], worst = ok[0];
    ok.forEach(function (g) {
      if (val(g) > val(best)) best = g;
      if (val(g) < val(worst)) worst = g;
    });
    if (metric === 'rate') return 'Maior churn: ' + best.label + ' (' + p(rateOf(best)) + '). Menor: ' + worst.label + ' (' + p(rateOf(worst)) + ').';
    return 'Mais cancelamentos: ' + best.label + ' (' + n(best.c) + '). Menos: ' + worst.label + ' (' + n(worst.c) + ').';
  }

  function card(d, items, sc, avg) {
    var trs = items.map(function (g) {
      return '<tr><td>' + esc(g.label) + '</td><td>' + n(g.n) + '</td><td>' + n(g.c) + '</td><td>' + (g.n ? p(rateOf(g)) : '–') + '</td></tr>';
    }).join('');
    var hasSel = (sel[d.id] || []).length > 0;
    return '<article class="card span' + d.span + '">' +
      '<div class="card-head"><i class="tick"></i><h2>' + esc(d.title) + '</h2></div>' +
      '<p class="sub">' + esc(subtitle(items)) + '</p>' +
      chart3d(d, items, sc, avg) +
      '<div class="key">' + (avg !== null ? '<i></i>' + (anySel() ? 'Média da seleção ' : 'Média geral ') + p(avg) : 'Altura = número de clientes cancelados') +
      (hasSel ? '<span class="own">Filtro neste gráfico</span>' : '') + '</div>' +
      '<details data-dim="' + d.id + '"' + (openTbl[d.id] ? ' open' : '') + '><summary>Ver como tabela</summary><div class="tbl"><table>' +
      '<thead><tr><th>Grupo</th><th>Clientes</th><th>Cancelados</th><th>Churn</th></tr></thead><tbody>' + trs + '</tbody></table></div></details>' +
      '</article>';
  }

  function anySel() { return Object.keys(sel).length > 0; }

  function renderKpis(t) {
    var ativos = t.n - t.c;
    function pct(a, b) { return b ? p(a / b) : '–'; }
    document.getElementById('kAtivos').textContent = n(ativos);
    document.getElementById('kAtivosSub').textContent = pct(ativos, t.n) + ' da seleção';
    document.getElementById('kCanc').textContent = n(t.c);
    document.getElementById('kCancSub').textContent = pct(t.c, t.n) + ' da seleção';
    document.getElementById('kRate').textContent = t.n ? p(t.c / t.n) : '–';
    document.getElementById('kRateSub').textContent = n(t.c) + ' de ' + n(t.n) + ' clientes';
    document.getElementById('kTA').innerHTML = ativos ? m1((t.st - t.sc) / ativos) + '<small>meses</small>' : '–';
    document.getElementById('kTC').innerHTML = t.c ? m1(t.sc / t.c) + '<small>meses</small>' : '–';
  }

  function renderReading(t, all) {
    var cand = [];
    DIMS.forEach(function (d) {
      if ((sel[d.id] || []).length) return;
      groups(d).forEach(function (g) { if (g.n > 0) cand.push({ d: d, g: g }); });
    });
    var big = cand.filter(function (x) { return x.g.n >= MIN_N; });
    var el = document.getElementById('reading');
    if (!big.length) {
      el.innerHTML = '<div><b>–</b><p>Poucos clientes nesta seleção para comparar grupos. Remova um filtro.</p></div>';
      return;
    }
    var hi = big[0], lo = big[0], vol = cand[0];
    big.forEach(function (x) {
      if (rateOf(x.g) > rateOf(hi.g)) hi = x;
      if (rateOf(x.g) < rateOf(lo.g)) lo = x;
    });
    cand.forEach(function (x) { if (x.g.c > vol.g.c) vol = x; });
    function line(x) { return esc(x.g.label) + ' <span class="dn">(' + esc(x.d.name) + ')</span>'; }
    var scope = anySel() ? 'na seleção' : 'na base';
    el.innerHTML =
      '<div><b>' + p(rateOf(hi.g)) + '</b><p>Maior churn ' + scope + ': ' + line(hi) + ', com ' + n(hi.g.c) + ' de ' + n(hi.g.n) + ' clientes.</p></div>' +
      '<div><b>' + p(rateOf(lo.g)) + '</b><p>Menor churn ' + scope + ' (grupos com ' + MIN_N + '+ clientes): ' + line(lo) + ', com ' + n(lo.g.c) + ' de ' + n(lo.g.n) + '.</p></div>' +
      '<div><b>' + (t.c ? p(vol.g.c / t.c) : '–') + '</b><p>dos cancelamentos ' + scope + ' estão em ' + line(vol) + ': ' + n(vol.g.c) + ' de ' + n(t.c) + '.</p></div>';
  }

  function renderFilters(t) {
    var el = document.getElementById('filters');
    var chips = '';
    DIMS.forEach(function (d) {
      (sel[d.id] || []).slice().sort(function (a, b) { return d.order.indexOf(a) - d.order.indexOf(b); }).forEach(function (code) {
        chips += '<button type="button" class="chip" data-dim="' + d.id + '" data-code="' + code + '" aria-label="Remover filtro ' + esc(d.name + ': ' + d.labels[code]) + '">' +
          '<span>' + esc(d.name) + ': <b>' + esc(d.labels[code]) + '</b></span><i aria-hidden="true">×</i></button>';
      });
    });
    if (chips) {
      el.innerHTML = '<span class="cap">Filtros</span>' + chips + '<button type="button" class="link" id="clearBtn">Limpar filtros</button>';
    } else {
      el.innerHTML = '<span class="hint">Clique em uma coluna para filtrar o painel. Combine grupos diferentes.</span>';
    }
    document.getElementById('live').textContent = anySel()
      ? 'Seleção com ' + n(t.n) + ' clientes e ' + n(t.c) + ' cancelados.'
      : 'Sem filtros. Base completa.';
  }

  function update(focusKey) {
    var t = totals();
    var all = null;
    renderFilters(t);
    renderKpis(t);
    renderReading(t, all);

    var data = DIMS.map(function (d) { return groups(d); });
    var mx = 0;
    data.forEach(function (items) { items.forEach(function (g) { mx = Math.max(mx, val(g)); }); });
    var sc = metric === 'rate'
      ? nice(mx || 0.05, [0.05, 0.1, 0.2, 0.25])
      : nice(mx || 10, [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000]);
    var avg = metric === 'rate' && t.n ? t.c / t.n : null;

    document.getElementById('grid').innerHTML = DIMS.map(function (d, i) { return card(d, data[i], sc, avg); }).join('');
    document.getElementById('foot').textContent = metric === 'rate'
      ? 'Dados do modelo do projeto pw. A taxa de cada grupo é cancelados dividido por clientes do grupo, com os filtros dos outros gráficos aplicados. Todas as colunas usam a mesma escala. A linha fina marca a média ' + (anySel() ? 'da seleção' : 'geral') + '. * = menos de ' + MIN_N + ' clientes, leia com cautela.'
      : 'Dados do modelo do projeto pw. Cada coluna mostra quantos clientes cancelaram no grupo, com os filtros dos outros gráficos aplicados. Todas as colunas usam a mesma escala.';

    if (focusKey) {
      var f = document.querySelector('.col[data-dim="' + focusKey[0] + '"][data-code="' + focusKey[1] + '"]');
      if (f) f.focus();
    }
  }

  function toggle(id, code, viaKey) {
    var a = sel[id] || (sel[id] = []);
    var i = a.indexOf(code);
    if (i < 0) a.push(code); else a.splice(i, 1);
    if (!a.length) delete sel[id];
    tip.hidden = true;
    update(viaKey ? [id, code] : null);
  }

  var tip = document.getElementById('tip');
  var grid = document.getElementById('grid');
  grid.addEventListener('click', function (e) {
    var el = e.target.closest('.col');
    if (el) toggle(el.getAttribute('data-dim'), +el.getAttribute('data-code'), false);
  });
  grid.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest ? e.target.closest('.col') : null;
    if (!el) return;
    e.preventDefault();
    toggle(el.getAttribute('data-dim'), +el.getAttribute('data-code'), true);
  });
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d && d.tagName === 'DETAILS' && d.getAttribute('data-dim')) openTbl[d.getAttribute('data-dim')] = d.open;
  }, true);
  document.getElementById('filters').addEventListener('click', function (e) {
    var c = e.target.closest('.chip');
    if (c) { toggle(c.getAttribute('data-dim'), +c.getAttribute('data-code'), false); return; }
    if (e.target.closest('#clearBtn')) { sel = {}; update(null); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && anySel()) { sel = {}; update(null); }
  });
  function setMetric(m) {
    metric = m;
    document.getElementById('mRate').setAttribute('aria-pressed', m === 'rate' ? 'true' : 'false');
    document.getElementById('mCount').setAttribute('aria-pressed', m === 'count' ? 'true' : 'false');
    update(null);
  }
  document.getElementById('mRate').addEventListener('click', function () { setMetric('rate'); });
  document.getElementById('mCount').addEventListener('click', function () { setMetric('count'); });

  window.addEventListener('resize', function () {
    var now = window.innerWidth < 600;
    if (now !== narrow) { narrow = now; update(null); }
  });

  // Pausar pulso
  var root = document.getElementById('root');
  var btn = document.getElementById('pauseBtn');
  function setPaused(v) {
    root.classList.toggle('is-paused', v);
    btn.setAttribute('aria-pressed', v ? 'true' : 'false');
    btn.textContent = v ? 'Retomar pulso' : 'Pausar pulso';
  }
  btn.addEventListener('click', function () { setPaused(btn.getAttribute('aria-pressed') !== 'true'); });
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true);
  } catch (e) {}

  // Tooltip
  function place(x, y) {
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(x + 14, window.innerWidth - w - 8);
    var top = y + 18;
    if (top + h > window.innerHeight - 8) top = y - h - 12;
    tip.style.left = Math.max(8, left) + 'px';
    tip.style.top = Math.max(8, top) + 'px';
  }
  function onPointer(e) {
    var el = e.target.closest ? e.target.closest('.col') : null;
    if (!el) { tip.hidden = true; return; }
    tip.textContent = el.getAttribute('data-tip');
    tip.hidden = false;
    place(e.clientX, e.clientY);
  }
  document.addEventListener('pointermove', onPointer);
  document.addEventListener('pointerleave', function () { tip.hidden = true; });
  document.addEventListener('focusin', function (e) {
    var el = e.target.closest ? e.target.closest('.col') : null;
    if (!el) return;
    var r = el.getBoundingClientRect();
    tip.textContent = el.getAttribute('data-tip');
    tip.hidden = false;
    place(r.left + r.width / 2, r.top);
  });
  document.addEventListener('focusout', function () { tip.hidden = true; });

  update(null);
})();
