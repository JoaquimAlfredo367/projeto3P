'use strict';

// ── Relatórios — Edição #2: métricas comparativas + renderReports + fecharDia ──

/* ══════════════════════════════════════════════
   EDIÇÃO #2 — HELPERS DE COMPARAÇÃO DIÁRIA
   dailySummaries: localStorage (compatibilidade)
                 + IndexedDB dailySummaries store
══════════════════════════════════════════════ */

function getDailySummaries() {
  try { return JSON.parse(localStorage.getItem('dailySummaries') || '[]'); }
  catch { return []; }
}
function saveDailySummaries(arr) {
  try { localStorage.setItem('dailySummaries', JSON.stringify(arr)); } catch(e) {}
}
function todayKey() { return new Date().toISOString().slice(0, 10); }

function liveMetrics() {
  const done = orders.filter(o => o.status !== 'cancelled');
  const rev  = revenue;
  const cnt  = doneCnt;
  const avg  = cnt > 0 ? rev / cnt : 0;
  return { revenue: rev, orders: done.length, doneCnt: cnt, avgTicket: avg };
}

function fmtVariation(current, previous) {
  if (previous == null || previous === 0) return { text: '—', cls: 'flat' };
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) return { text: '≈ 0%', cls: 'flat' };
  const arrow = pct > 0 ? '▲' : '▼';
  return { text: arrow + ' ' + Math.abs(pct).toFixed(1) + '%', cls: pct > 0 ? 'up' : 'down' };
}

function yesterdaySummary(summaries) {
  const d = new Date(); d.setDate(d.getDate() - 1);
  const key = d.toISOString().slice(0, 10);
  return summaries.find(s => s.date === key) || null;
}

function last7Days(summaries) {
  const live = liveMetrics();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key   = d.toISOString().slice(0, 10);
    const label = i === 0 ? 'hoje' : d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    if (i === 0) {
      days.push({ date: key, label, revenue: live.revenue, orders: live.doneCnt, avgTicket: live.avgTicket, isToday: true });
    } else {
      const snap = summaries.find(s => s.date === key);
      days.push({ date: key, label, revenue: snap ? snap.revenue : 0, orders: snap ? snap.orders : 0,
                  avgTicket: snap ? snap.avgTicket : 0, isToday: false, noData: !snap });
    }
  }
  return days;
}

function avg30Days(summaries) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const valid = summaries.filter(s => new Date(s.date) >= cutoff && s.orders > 0);
  if (!valid.length) return null;
  const n = valid.length;
  return {
    revenue:   valid.reduce((a, s) => a + s.revenue,   0) / n,
    orders:    valid.reduce((a, s) => a + s.orders,    0) / n,
    avgTicket: valid.reduce((a, s) => a + s.avgTicket, 0) / n,
    days: n
  };
}

/* ══════════════════════════════════════════════
   FECHAR DIA — abre modal de confirmação
   (substitui o confirm() simples da Edição #1)
══════════════════════════════════════════════ */
function fecharDia() {
  // injeta estilos uma vez
  if (!document.getElementById('dc-styles')) {
    const s = document.createElement('style');
    s.id = 'dc-styles';
    s.textContent = `
      #dc-overlay{position:fixed;inset:0;z-index:9000;background:rgba(15,11,9,.85);
        backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;
        animation:dcFIn .2s ease;}
      @keyframes dcFIn{from{opacity:0}to{opacity:1}}
      #dc-modal{background:var(--s1);border:2px solid var(--red);border-radius:.45rem;
        width:min(510px,94vw);max-height:90vh;overflow-y:auto;
        padding:1.5rem 1.5rem 1.2rem;box-shadow:0 20px 60px rgba(0,0,0,.75);
        animation:dcUp .26s cubic-bezier(.34,1.56,.64,1);}
      @keyframes dcUp{from{transform:translateY(22px);opacity:0}to{transform:none;opacity:1}}
      #dc-modal h2{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:.06em;color:#fff;margin-bottom:.12rem;}
      .dc-sub{font-size:.62rem;color:var(--muted);font-family:'Barlow Condensed',sans-serif;letter-spacing:.1em;text-transform:uppercase;margin-bottom:1rem;}
      .dc-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:.55rem;margin-bottom:.9rem;}
      .dc-kpi{background:var(--s2);border:1px solid var(--border);border-radius:.35rem;
        padding:.75rem .65rem .6rem;text-align:center;position:relative;overflow:hidden;}
      .dc-kpi::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;}
      .dc-kpi.gn::after{background:var(--olive3);}.dc-kpi.yw::after{background:var(--yellow);}.dc-kpi.rd::after{background:var(--redbright);}
      .dc-kv{font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:.03em;line-height:1;margin-bottom:.15rem;}
      .dc-kv.gn{color:var(--olive3);}.dc-kv.yw{color:var(--yellow);}.dc-kv.rd{color:var(--redbright);}
      .dc-kl{font-size:.58rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;font-family:'Barlow Condensed',sans-serif;font-weight:700;}
      .dc-top-hd{font-size:.58rem;color:var(--muted2);text-transform:uppercase;letter-spacing:.12em;font-family:'Barlow Condensed',sans-serif;font-weight:700;margin-bottom:.45rem;}
      .dc-top-list{list-style:none;margin:0 0 .9rem;padding:0;}
      .dc-top-list li{display:flex;align-items:center;gap:.5rem;padding:.35rem 0;border-bottom:1px solid var(--border);font-size:.7rem;color:var(--muted2);}
      .dc-top-list li:last-child{border:none;}
      .dc-rank{width:15px;text-align:center;font-size:.58rem;color:var(--muted);font-family:'Barlow Condensed',sans-serif;flex-shrink:0;}
      .dc-bar-w{flex:1;height:3px;background:var(--s4,#3a2a23);border-radius:2px;overflow:hidden;}
      .dc-bar-f{height:100%;background:var(--redbright);border-radius:2px;}
      .dc-qty{font-size:.6rem;color:var(--muted);min-width:22px;text-align:right;font-family:'Barlow Condensed',sans-serif;flex-shrink:0;}
      .dc-warn{background:rgba(245,192,0,.06);border:1px solid rgba(245,192,0,.22);border-radius:.3rem;
        padding:.55rem .72rem;font-size:.67rem;color:var(--yellow);line-height:1.5;margin-bottom:.9rem;
        font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.02em;}
      .dc-actions{display:flex;gap:.45rem;justify-content:flex-end;}
      .dc-btn{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:.7rem;letter-spacing:.08em;
        text-transform:uppercase;padding:.42rem 1rem;border-radius:.28rem;border:1px solid;cursor:pointer;transition:.15s;}
      .dc-btn:active{transform:scale(.97);}
      .dc-btn-cancel{background:var(--s3,#2e211c);border-color:var(--border2);color:var(--muted2);}
      .dc-btn-cancel:hover{border-color:var(--cream);color:var(--cream);}
      .dc-btn-confirm{background:rgba(139,26,42,.18);border-color:rgba(224,48,64,.45);color:var(--redbright);}
      .dc-btn-confirm:hover{background:rgba(224,48,64,.16);border-color:var(--redbright);}
      .dc-btn-confirm:disabled{opacity:.45;cursor:default;}
      #dc-hist-wrap{overflow-x:auto;}
      .dc-hist-tbl{width:100%;border-collapse:collapse;font-size:.72rem;}
      .dc-hist-tbl th{text-align:left;padding:.48rem .62rem;font-size:.58rem;text-transform:uppercase;
        letter-spacing:.1em;color:var(--muted);border-bottom:2px solid var(--border);
        font-family:'Barlow Condensed',sans-serif;font-weight:700;white-space:nowrap;}
      .dc-hist-tbl td{padding:.55rem .62rem;color:var(--muted2);border-bottom:1px solid var(--border);}
      .dc-hist-tbl tr:hover td{background:var(--s2);}
      .dc-hist-tbl .col-rev{color:var(--olive3);font-weight:700;font-family:'Bebas Neue',sans-serif;font-size:.92rem;letter-spacing:.04em;}
      .dc-hist-tbl .col-cnt{color:var(--yellow);font-weight:700;}
      .dc-hist-tbl .col-avg{color:var(--redbright);}
      .dc-hist-tbl .col-date{color:var(--cream);font-weight:700;}
      .dc-empty-hist{text-align:center;padding:3rem 0;color:var(--muted);
        font-family:'Barlow Condensed',sans-serif;font-size:.82rem;letter-spacing:.06em;text-transform:uppercase;}
      .dc-empty-hist span{font-size:2.2rem;display:block;margin-bottom:.55rem;opacity:.4;}
      .dc-chips{display:flex;gap:.28rem;flex-wrap:wrap;}
      .dc-chip{font-size:.56rem;font-family:'Barlow Condensed',sans-serif;font-weight:700;
        letter-spacing:.05em;padding:.08rem .38rem;border-radius:.2rem;white-space:nowrap;}
      .dc-chip-del{background:rgba(139,155,58,.12);color:var(--olive2);}
      .dc-chip-pic{background:rgba(189,208,80,.1);color:var(--olive3);}
      .dc-chip-mkt{background:rgba(245,192,0,.1);color:var(--yellow);}
      #btnFecharDiaTop{background:rgba(139,26,42,.2);border:1px solid rgba(224,48,64,.45);color:var(--redbright);}
      #btnFecharDiaTop:hover{background:rgba(224,48,64,.15);border-color:var(--redbright);}
    `;
    document.head.appendChild(s);
  }

  if (document.getElementById('dc-overlay')) return;

  // monta snapshot
  const live   = liveMetrics();
  const byType = { delivery: 0, pickup: 0, market: 0 };
  orders.filter(o => o.status === 'done').forEach(o => { if (byType[o.type] !== undefined) byType[o.type]++; });
  const counts = {};
  orders.filter(o => o.status === 'done').forEach(o =>
    (o.items || []).forEach(it => { counts[it.name] = (counts[it.name] || 0) + (it.qty || 1); })
  );
  const topItems = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));
  const snap = {
    date:        todayKey(),
    revenue:     live.revenue,
    orders:      live.doneCnt,
    avgTicket:   live.avgTicket,
    topItems,
    byType,
    clientCount: Object.keys(clients).length,
    closedAt:    new Date().toISOString()
  };

  const maxQty  = topItems[0]?.qty || 1;
  const now     = new Date();
  const subLbl  = snap.date.split('-').reverse().join('/') + ' · ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fmtBRL  = v => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');

  const topHtml = topItems.length
    ? topItems.map((it, i) => `
        <li>
          <span class="dc-rank">${i + 1}</span>
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--cream)">${it.name}</span>
          <div class="dc-bar-w"><div class="dc-bar-f" style="width:${Math.round(it.qty/maxQty*100)}%"></div></div>
          <span class="dc-qty">${it.qty}×</span>
        </li>`).join('')
    : `<li style="color:var(--muted);font-size:.67rem;padding:.45rem 0">Nenhum item entregue ainda</li>`;

  const ov = document.createElement('div');
  ov.id = 'dc-overlay';
  ov.innerHTML = `
    <div id="dc-modal" role="dialog" aria-modal="true">
      <h2>☀ Fechar o Dia</h2>
      <div class="dc-sub">${subLbl}</div>
      <div class="dc-kpis">
        <div class="dc-kpi gn"><div class="dc-kv gn">${fmtBRL(snap.revenue)}</div><div class="dc-kl">Receita Total</div></div>
        <div class="dc-kpi yw"><div class="dc-kv yw">${snap.orders}</div><div class="dc-kl">Entregues</div></div>
        <div class="dc-kpi rd"><div class="dc-kv rd">${fmtBRL(snap.avgTicket)}</div><div class="dc-kl">Ticket Médio</div></div>
      </div>
      <div class="dc-top-hd">Top Itens do Dia</div>
      <ul class="dc-top-list">${topHtml}</ul>
      <div class="dc-warn">
        ⚠ Ao confirmar, pedidos ativos e contadores são zerados para o próximo turno.
        O resumo fica salvo em <strong>Histórico de Dias</strong> e não é apagado pelo "Limpar Turno".
      </div>
      <div class="dc-actions">
        <button class="dc-btn dc-btn-cancel" id="dc-cancel">Cancelar</button>
        <button class="dc-btn dc-btn-confirm" id="dc-confirm">Confirmar Fechamento</button>
      </div>
    </div>`;
  document.body.appendChild(ov);

  document.getElementById('dc-cancel').onclick = dcClose;
  document.getElementById('dc-confirm').onclick = () => dcConfirm(snap);
  ov.addEventListener('click', e => { if (e.target === ov) dcClose(); });
  document.addEventListener('keydown', dcEscHandler);
}

function dcEscHandler(e) { if (e.key === 'Escape') dcClose(); }
function dcClose() {
  document.getElementById('dc-overlay')?.remove();
  document.removeEventListener('keydown', dcEscHandler);
}

async function dcConfirm(snap) {
  const btn = document.getElementById('dc-confirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando…'; }

  // 1. grava no IDB
  await dbSaveDailySummary(snap);

  // 2. mantém localStorage para compatibilidade com renderReports (gráfico 7d, avg30d)
  let ls = getDailySummaries();
  ls = ls.filter(s => s.date !== snap.date);
  ls.unshift({ date: snap.date, revenue: snap.revenue, orders: snap.orders, avgTicket: snap.avgTicket });
  if (ls.length > 60) ls.length = 60;
  saveDailySummaries(ls);

  // 3. remove pedidos do IDB individualmente
  const all = orders.slice();
  for (const o of all) await dbDelete('orders', o.id);

  // 4. zera estado
  orders = []; revenue = 0; doneCnt = 0; newCliCnt = 0;
  await dbSaveSetting('revenue',   0);
  await dbSaveSetting('doneCnt',   0);
  await dbSaveSetting('newCliCnt', 0);

  renderAll();
  dcClose();
  showToast('Dia fechado! Resumo salvo em Histórico de Dias.', 'order');
  dbSet('dbStatus', 'Dia fechado — ' + snap.date + ' · IDB OK');
}

/* ══════════════════════════════════════════════
   ABA HISTÓRICO DE DIAS
══════════════════════════════════════════════ */
async function renderDayHistory() {
  const container = document.getElementById('dc-hist-container');
  if (!container) return;

  container.innerHTML = '<div class="dc-empty-hist"><span>📅</span>Carregando…</div>';

  // lê do IDB
  let all = await dbGetAllDailySummaries();

  // fallback: migra do localStorage se IDB ainda estiver vazio
  if (!all.length) {
    const ls = getDailySummaries();
    for (const s of ls) await dbSaveDailySummary(s);
    all = ls;
  }

  all.sort((a, b) => (b.date > a.date ? 1 : -1));

  if (!all.length) {
    container.innerHTML = `
      <div class="dc-empty-hist">
        <span>📅</span>
        Nenhum dia fechado ainda.<br>
        Use <strong>Fechar Dia</strong> ao encerrar o turno.
      </div>`;
    return;
  }

  const fmtDate = str => str.split('-').reverse().join('/');
  const fmtBRL  = v   => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');

  const rows = all.map(s => {
    const chips = [
      s.byType?.delivery ? `<span class="dc-chip dc-chip-del">🛵 ${s.byType.delivery}</span>` : '',
      s.byType?.pickup   ? `<span class="dc-chip dc-chip-pic">🏃 ${s.byType.pickup}</span>`   : '',
      s.byType?.market   ? `<span class="dc-chip dc-chip-mkt">🛒 ${s.byType.market}</span>`   : '',
    ].filter(Boolean).join('');
    const hora = s.closedAt
      ? new Date(s.closedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '—';
    return `
      <tr>
        <td class="col-date">${fmtDate(s.date)}</td>
        <td class="col-rev">${fmtBRL(s.revenue)}</td>
        <td class="col-cnt">${s.orders ?? '—'}</td>
        <td class="col-avg">${fmtBRL(s.avgTicket)}</td>
        <td>${s.clientCount ?? '—'}</td>
        <td><div class="dc-chips">${chips || '<span style="color:var(--muted)">—</span>'}</div></td>
        <td style="color:var(--muted);font-size:.62rem;font-family:'Barlow Condensed',sans-serif">${hora}</td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <div id="dc-hist-wrap">
      <table class="dc-hist-tbl">
        <thead>
          <tr>
            <th>Data</th><th>Receita</th><th>Pedidos</th>
            <th>Ticket Médio</th><th>Clientes</th><th>Por Tipo</th><th>Fechado às</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}
