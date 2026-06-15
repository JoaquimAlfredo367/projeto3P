'use strict';

// ── Kanban — ações sobre pedidos ──

//COUNTDOWN para mostrar tempo restante de preparo, atualizado a cada segundo
setInterval(function tickCountdowns() {
  document.querySelectorAll('[data-countdown-end]').forEach(el => {
    const end  = parseInt(el.dataset.countdownEnd, 10);
    const diff = Math.max(0, Math.round((end - Date.now()) / 1000));
    const m = Math.floor(diff / 60), s = diff % 60;
    el.textContent = m + ':' + String(s).padStart(2, '0');
    el.classList.toggle('countdown-urgent', diff <= 120 && diff > 0);
    el.classList.toggle('countdown-done',   diff === 0);
  });
}, 1000);

// Modal de tempo estimado de preparo, mostrado ao aceitar um pedido
function showPrepTimeModal(id) {
  // remove modal anterior se houver
  const old = document.getElementById('prepTimeModal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'prepTimeModal';
  modal.className = 'pt-overlay';
  modal.innerHTML =
    '<div class="pt-modal">' +
      '<div class="pt-title">⏱ Tempo de preparo</div>' +
      '<div class="pt-sub">Pedido <strong>' + id + '</strong></div>' +
      '<div class="pt-presets">' +
        '<button class="pt-preset" data-min="10">10 min</button>' +
        '<button class="pt-preset" data-min="15">15 min</button>' +
        '<button class="pt-preset" data-min="20">20 min</button>' +
        '<button class="pt-preset" data-min="25">25 min</button>' +
        '<button class="pt-preset" data-min="30">30 min</button>' +
        '<button class="pt-preset" data-min="45">45 min</button>' +
      '</div>' +
      '<div class="pt-custom-row">' +
        '<input id="ptCustom" class="pt-input" type="number" min="1" max="240" placeholder="Outro (min)" />' +
      '</div>' +
      '<div class="pt-actions">' +
        '<button class="pt-btn pt-cancel" id="ptCancelBtn">Cancelar</button>' +
        '<button class="pt-btn pt-confirm" id="ptConfirmBtn">Aceitar</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);

  // seleção de preset
  let selectedMin = 25;
  modal.querySelectorAll('.pt-preset').forEach(btn => {
    if (parseInt(btn.dataset.min) === selectedMin) btn.classList.add('active');
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.pt-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMin = parseInt(btn.dataset.min);
      document.getElementById('ptCustom').value = '';
    });
  });

  document.getElementById('ptCancelBtn').addEventListener('click', () => modal.remove());

  document.getElementById('ptConfirmBtn').addEventListener('click', () => {
    const custom = parseInt(document.getElementById('ptCustom').value);
    const minutes = (!isNaN(custom) && custom > 0) ? custom : selectedMin;
    modal.remove();
    _doAcceptOrder(id, minutes);
  });

  // fechar clicando fora
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // foco no input para facilitar digitação manual
  setTimeout(() => document.getElementById('ptCustom')?.focus(), 50);
}

//ACOES KANBAN 
function acceptOrder(id) {
  showPrepTimeModal(id);
}

function _doAcceptOrder(id, minutes) {
  const o = orders.find(x => x.id === id); if (!o) return;
  o.status   = 'prep';
  o.prepMins = minutes;
  o.prepEnd  = Date.now() + minutes * 60 * 1000;
  dbSaveOrder(o);
  renderAll();
  showToast('Pedido ' + id + ' aceito! ⏱ ' + minutes + ' min', 'order');
}
function advOrder(id) {
  const o = orders.find(x => x.id === id); if (!o) return;
  if (o.status === 'prep') {
    o.status = 'ready';
    dbSaveOrder(o);
    renderAll();
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
  const w = window.open('', '_blank');
  w.document.write(
    '<html><head><title>Pedido ' + o.id + '</title>' +
    '<style>body{font-family:monospace;padding:1rem;max-width:300px}hr{border:1px dashed #000}.r{display:flex;justify-content:space-between}</style></head><body>' +
    '<h2 style="text-align:center">FOODCITY</h2><hr/>' +
    '<p><b>Pedido:</b> ' + o.id + '</p><p><b>Cliente:</b> ' + (o.client?.name || '—') + '</p>' +
    '<p><b>Tipo:</b> ' + o.type + '</p><p><b>Horario:</b> ' + o.time.toLocaleTimeString('pt-BR') + '</p><hr/>' +
    (o.items || []).map(i => '<div class="r"><span>' + i.qty + 'x ' + i.name + '</span><span>R$ ' + (i.price || 0).toFixed(2) + '</span></div>').join('') +
    '<hr/><div class="r"><b>TOTAL</b><b>R$ ' + (o.total || 0).toFixed(2) + '</b></div>' +
    '<p><b>Pagamento:</b> ' + (o.pay || '—') + '</p>' +
    (o.type !== 'pickup' ? '<p><b>Endereco:</b> ' + (o.client?.addr || o.client?.address || '—') + '</p>' : '') +
    '<hr/><p style="text-align:center">Obrigado!</p></body></html>'
  );
  w.print();
}
