'use strict';

// ── Kanban — ações sobre pedidos ──

/* ══════════════════════════════════════════════
   ACOES KANBAN
══════════════════════════════════════════════ */
function acceptOrder(id) {
  const o = orders.find(x => x.id === id); if (!o) return;
  o.status = 'prep';
  dbSaveOrder(o);
  renderAll();
  showToast('Pedido ' + id + ' aceito!', 'order');
}
function advOrder(id) {
  const o = orders.find(x => x.id === id); if (!o) return;
  if (o.status === 'prep') {
    o.status = 'ready';
    dbSaveOrder(o);
    renderAll();
    if (alertPrefs.sndReady) playChime();
    showToast('Pedido ' + id + ' pronto!', 'order');
  } else if (o.status === 'ready') {
    o.status = 'done'; revenue += (o.total || 0); doneCnt++;
    if (o.client?.id && clients[o.client.id]) {
      clients[o.client.id].totalSpent = (clients[o.client.id].totalSpent || 0) + (o.total || 0);
      dbSaveClient(clients[o.client.id]);
    }
    dbSaveOrder(o);
    dbSaveSetting('revenue', revenue);
    dbSaveSetting('doneCnt', doneCnt);
    renderAll();
    showToast('Entregue ' + id + '! +R$ ' + (o.total || 0).toFixed(2), 'order');
  }
}
function rejectOrder(id) {
  const o = orders.find(x => x.id === id); if (!o) return;
  o.status = 'cancelled';
  dbSaveOrder(o);
  renderAll();
  showToast('Pedido ' + id + ' recusado.');
}
function clearDone() {
  const toRemove = orders.filter(o => o.status === 'done');
  toRemove.forEach(o => dbDelete('orders', o.id));
  orders = orders.filter(o => o.status !== 'done');
  renderAll();
  showToast('Entregues removidos.');
}
function clearAll() {
  if (!confirm('Limpar TODOS os dados (pedidos, clientes, eventos)?')) return;
  orders = []; clients = {}; revenue = 0; doneCnt = 0; newCliCnt = 0; seen.clear(); evCount = 0;
  try { localStorage.removeItem('fc_events'); localStorage.removeItem('fc_trigger'); } catch(e) {}
  // Limpa o IndexedDB completamente
  openPainelDB().then(db => {
    ['orders','clients','settings','seen'].forEach(store => {
      try { db.transaction(store, 'readwrite').objectStore(store).clear(); } catch(e) {}
    });
  });
  dbSet('dbEvCount', 0); dbSet('dbLast', '—'); dbSet('dbLS', '—');
  dbSet('dbStatus', 'IndexedDB limpo');
  renderAll();
  showToast('Todos os dados foram limpos.');
}
function printOrder(id) {
  const o = orders.find(x => x.id === id); if (!o) return;

  // Remove janela anterior se existir
  document.getElementById('fc-print-window')?.remove();

  const wClass = { '58': 'w58', '80': 'w80', 'A4': 'wA4' }[storeConfig.paperWidth] || 'w80';
  const pageW  = { w58: '58mm', w80: '80mm', wA4: '210mm' }[wClass] || '80mm';
  const pageM  = { w58: '2mm',  w80: '3mm',  wA4: '10mm'  }[wClass] || '3mm';

  // Injeta @page dinâmico para o tamanho correto (sem diálogo manual)
  let dynStyle = document.getElementById('fc-print-page-style');
  if (!dynStyle) {
    dynStyle = document.createElement('style');
    dynStyle.id = 'fc-print-page-style';
    document.head.appendChild(dynStyle);
  }
  dynStyle.textContent = '@page { size: ' + pageW + ' auto; margin: ' + pageM + '; }';

  // Cria div de impressão — oculto na tela, visível no print via print.css
  const win = document.createElement('div');
  win.id = 'fc-print-window';
  win.style.cssText = 'display:none';
  win.innerHTML = buildReceiptHTML(o);
  document.body.appendChild(win);

  // Aguarda render antes de acionar impressão
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.print();
      setTimeout(() => win.remove(), 3000);
    });
  });
}