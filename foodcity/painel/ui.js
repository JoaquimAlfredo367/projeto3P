'use strict';

// ── UI — badges, navegação, simulação, utilitários ──
// Edição #3: printOrder() thermal-ready + modal Configurações da Loja

/* ══════════════════════════════════════════════
   CONFIGURAÇÕES DA LOJA
   Persistidas via dbSaveSetting / dbGet (IndexedDB)
══════════════════════════════════════════════ */

// Valores padrão — substituídos ao carregar do DB em initStoreConfig()
let storeConfig = {
  name:       'FoodCity',
  address:    '',
  phone:      '',
  footer:     'Obrigado pela preferência! Volte sempre. 🍔',
  paperWidth: '80' // '58' | '80' | 'A4'
};

async function initStoreConfig() {
  const saved = await dbGet('settings', 'storeConfig');
  if (saved?.value) {
    try { Object.assign(storeConfig, JSON.parse(saved.value)); } catch(e) {}
  }
}

async function saveStoreConfig() {
  await dbSaveSetting('storeConfig', JSON.stringify(storeConfig));
}

/* ══════════════════════════════════════════════
   MODAL DE CONFIGURAÇÕES
══════════════════════════════════════════════ */
function openStoreConfig() {
  // Remove instâncias anteriores
  document.getElementById('fc-config-modal')?.remove();

  const m = document.createElement('div');
  m.id = 'fc-config-modal';
  m.style.cssText = [
    'position:fixed;inset:0;z-index:9000',
    'display:flex;align-items:center;justify-content:center',
    'background:rgba(0,0,0,.72)',
    'animation:fadeIn .15s ease'
  ].join(';');

  const widths = [
    { v: '58', l: '58 mm — Térmica estreita' },
    { v: '80', l: '80 mm — Térmica padrão'  },
    { v: 'A4', l: 'A4 — Impressora comum'   }
  ];

  m.innerHTML = `
    <div style="
      background:var(--card,#1a1008);
      border:1px solid var(--border,#3a2a23);
      border-radius:.6rem;
      width:min(480px,94vw);
      padding:1.5rem;
      font-family:'Barlow',sans-serif;
      color:var(--cream,#f5ede0);
      box-shadow:0 8px 40px rgba(0,0,0,.7)
    ">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem">
        <h3 style="font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase">
          ⚙️ Configurações da Loja
        </h3>
        <button onclick="document.getElementById('fc-config-modal').remove()"
          style="background:none;border:none;color:var(--muted,#a08060);font-size:1.3rem;cursor:pointer;line-height:1">✕</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:.8rem">

        <label style="font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#a08060)">
          Nome da Loja
          <input id="cfg-name" type="text" value="${escHtml(storeConfig.name)}"
            placeholder="Ex: FoodCity — Centro"
            style="${cfgInputStyle()}"/>
        </label>

        <label style="font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#a08060)">
          Endereço
          <input id="cfg-address" type="text" value="${escHtml(storeConfig.address)}"
            placeholder="Ex: Av. das Américas, 100 — Recife, PE"
            style="${cfgInputStyle()}"/>
        </label>

        <label style="font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#a08060)">
          Telefone / WhatsApp
          <input id="cfg-phone" type="text" value="${escHtml(storeConfig.phone)}"
            placeholder="Ex: (81) 99999-9999"
            style="${cfgInputStyle()}"/>
        </label>

        <label style="font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#a08060)">
          Mensagem de Rodapé
          <input id="cfg-footer" type="text" value="${escHtml(storeConfig.footer)}"
            placeholder="Ex: Obrigado pela preferência!"
            style="${cfgInputStyle()}"/>
        </label>

        <label style="font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#a08060)">
          Largura do Papel
          <div style="display:flex;gap:.5rem;margin-top:.35rem;flex-wrap:wrap">
            ${widths.map(w => `
              <label style="
                display:flex;align-items:center;gap:.35rem;
                cursor:pointer;font-size:.72rem;text-transform:none;
                background:var(--bg2,#0f0903);
                border:1px solid ${storeConfig.paperWidth === w.v ? 'var(--yellow,#F5C000)' : 'var(--border,#3a2a23)'};
                border-radius:.3rem;padding:.35rem .65rem;
                color:${storeConfig.paperWidth === w.v ? 'var(--yellow,#F5C000)' : 'var(--cream,#f5ede0)'};
                font-weight:${storeConfig.paperWidth === w.v ? '700' : '400'};
                transition:all .15s;
              " id="cfg-paper-lbl-${w.v}">
                <input type="radio" name="cfg-paper" value="${w.v}"
                  ${storeConfig.paperWidth === w.v ? 'checked' : ''}
                  style="accent-color:var(--yellow,#F5C000)"
                  onchange="updatePaperLabels()"/>
                ${w.l}
              </label>
            `).join('')}
          </div>
        </label>

      </div>

      <div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:1.4rem">
        <button onclick="document.getElementById('fc-config-modal').remove()"
          style="
            background:none;border:1px solid var(--border,#3a2a23);color:var(--muted,#a08060);
            padding:.4rem .9rem;border-radius:.35rem;cursor:pointer;
            font-family:'Barlow Condensed',sans-serif;font-size:.72rem;font-weight:700;
            text-transform:uppercase;letter-spacing:.06em
          ">Cancelar</button>
        <button onclick="applyStoreConfig()"
          style="
            background:var(--yellow,#F5C000);border:none;color:#1a1008;
            padding:.4rem 1rem;border-radius:.35rem;cursor:pointer;
            font-family:'Barlow Condensed',sans-serif;font-size:.72rem;font-weight:800;
            text-transform:uppercase;letter-spacing:.06em
          ">Salvar</button>
      </div>
    </div>
  `;

  document.body.appendChild(m);
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  document.getElementById('cfg-name')?.focus();
}

function cfgInputStyle() {
  return [
    'display:block;width:100%;margin-top:.35rem',
    'background:var(--bg2,#0f0903)',
    'border:1px solid var(--border,#3a2a23)',
    'border-radius:.3rem',
    'color:var(--cream,#f5ede0)',
    'padding:.4rem .65rem',
    'font-family:"Barlow",sans-serif',
    'font-size:.78rem',
    'outline:none'
  ].join(';');
}

function updatePaperLabels() {
  const sel = document.querySelector('input[name="cfg-paper"]:checked')?.value;
  ['58', '80', 'A4'].forEach(v => {
    const lbl = document.getElementById('cfg-paper-lbl-' + v);
    if (!lbl) return;
    const active = v === sel;
    lbl.style.borderColor = active ? 'var(--yellow,#F5C000)' : 'var(--border,#3a2a23)';
    lbl.style.color        = active ? 'var(--yellow,#F5C000)' : 'var(--cream,#f5ede0)';
    lbl.style.fontWeight   = active ? '700' : '400';
  });
}

async function applyStoreConfig() {
  storeConfig.name       = document.getElementById('cfg-name')?.value.trim()    || storeConfig.name;
  storeConfig.address    = document.getElementById('cfg-address')?.value.trim() || '';
  storeConfig.phone      = document.getElementById('cfg-phone')?.value.trim()   || '';
  storeConfig.footer     = document.getElementById('cfg-footer')?.value.trim()  || '';
  storeConfig.paperWidth = document.querySelector('input[name="cfg-paper"]:checked')?.value || '80';
  await saveStoreConfig();
  document.getElementById('fc-config-modal')?.remove();
  showToast('Configurações salvas!', 'order');
}

/* ══════════════════════════════════════════════
   IMPRESSÃO — printOrder() thermal-ready
══════════════════════════════════════════════ */

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtBrl(n) {
  return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',');
}

function buildReceiptHTML(o) {
  const t     = o.time instanceof Date ? o.time : new Date(o.time || Date.now());
  const items = o.items || [];
  const typeLabel = { delivery: 'Delivery', pickup: 'Retirada', market: 'Mercado' }[o.type] || o.type || '—';
  const wClass = { '58': 'w58', '80': 'w80', 'A4': 'wA4' }[storeConfig.paperWidth] || 'w80';
  const addr  = o.type !== 'pickup' ? (o.client?.addr || o.client?.address || '') : '';

  const deliverySection = addr
    ? `<div class="rc-delivery-addr">
        <strong>Entregar em:</strong><br/>
        ${escHtml(addr)}
      </div>`
    : '';

  const newClientBadge = o.isNewClient
    ? `<div class="rc-new-client-badge">★ Primeiro Pedido do Cliente ★</div>`
    : '';

  const itemRows = items.map(i =>
    `<div class="rc-item-row">
      <span class="item-qty">${i.qty}×</span>
      <span class="item-name">${escHtml(i.name)}</span>
      <span class="item-price">${fmtBrl(i.price)}</span>
    </div>`
  ).join('');

  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
  const frete    = o.total > subtotal ? o.total - subtotal : 0;
  const freteRow = frete > 0.01
    ? `<div class="rc-total-row"><span>Taxa de entrega</span><span>${fmtBrl(frete)}</span></div>`
    : '';

  const storeName = storeConfig.name ? `<div class="rc-store-name">${escHtml(storeConfig.name)}</div>` : '';
  const storeAddr = storeConfig.address
    ? `<div class="rc-store-addr">${escHtml(storeConfig.address)}</div>` : '';
  const storePhone = storeConfig.phone
    ? `<div class="rc-store-phone">${escHtml(storeConfig.phone)}</div>` : '';
  const footerMsg = storeConfig.footer
    ? `<div class="rc-footer-msg">${escHtml(storeConfig.footer)}</div>` : '';

  return `
    <div class="fc-receipt ${wClass}">

      <!-- Cabeçalho -->
      <div class="rc-header">
        <div class="rc-logo">Food<span>City</span></div>
        ${storeName}
        ${storeAddr}
        ${storePhone}
      </div>

      <hr class="rc-sep-solid"/>

      <!-- ID do pedido em destaque -->
      <div class="rc-order-id">${escHtml(o.id)}</div>

      <div class="rc-type-center">
        <span class="rc-type-badge">${escHtml(typeLabel)}</span>
      </div>

      ${newClientBadge}

      <hr class="rc-sep"/>

      <!-- Metadados -->
      <div class="rc-meta">
        <div class="rc-meta-row">
          <span class="label">Cliente</span>
          <span class="value">${escHtml(o.client?.name || '—')}</span>
        </div>
        ${o.client?.phone ? `
        <div class="rc-meta-row">
          <span class="label">Telefone</span>
          <span class="value">${escHtml(o.client.phone)}</span>
        </div>` : ''}
        <div class="rc-meta-row">
          <span class="label">Horário</span>
          <span class="value">${t.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>
        </div>
      </div>

      ${deliverySection}

      <hr class="rc-sep"/>

      <!-- Itens -->
      <div class="rc-items-title">Itens do Pedido</div>
      ${itemRows}

      <hr class="rc-sep"/>

      <!-- Totais -->
      ${freteRow}
      <div class="rc-grand-total">
        <span>TOTAL</span>
        <span>${fmtBrl(o.total)}</span>
      </div>

      <!-- Pagamento -->
      <div class="rc-pay-section">
        <div class="rc-pay-method">
          <span>Pagamento</span>
          <span>${escHtml(o.pay || '—')}</span>
        </div>
      </div>

      <hr class="rc-sep"/>

      <!-- Rodapé -->
      <div class="rc-footer">
        ${footerMsg}
        <div class="rc-footer-timestamp">${t.toLocaleString('pt-BR')}</div>
      </div>

      <div class="rc-cut-mark">- - - - - - - - - - - -</div>

    </div>
  `;
}

function printOrder(id) {
  const o = orders.find(x => x.id === id); if (!o) return;

  // Remove janela anterior se existir
  document.getElementById('fc-print-window')?.remove();

  const wClass = { '58': 'w58', '80': 'w80', 'A4': 'wA4' }[storeConfig.paperWidth] || 'w80';
  const pageW  = { w58: '58mm', w80: '80mm', wA4: '210mm' }[wClass] || '80mm';
  const pageM  = { w58: '2mm', w80: '3mm', wA4: '10mm' }[wClass] || '3mm';

  // Injeta @page dinâmico para o tamanho correto
  let dynStyle = document.getElementById('fc-print-page-style');
  if (!dynStyle) {
    dynStyle = document.createElement('style');
    dynStyle.id = 'fc-print-page-style';
    document.head.appendChild(dynStyle);
  }
  dynStyle.textContent = `@page { size: ${pageW} auto; margin: ${pageM}; }`;

  // Cria div de impressão (oculta na tela, visível no print via CSS)
  const win = document.createElement('div');
  win.id = 'fc-print-window';
  win.style.cssText = 'display:none';
  win.innerHTML = buildReceiptHTML(o);
  document.body.appendChild(win);

  // Aguarda render antes de acionar impressão
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.print();
      // Remove após 3s para não sujar o DOM
      setTimeout(() => win.remove(), 3000);
    });
  });
}

/* ══════════════════════════════════════════════
   BADGES & SIDEBAR
══════════════════════════════════════════════ */
function updateBadges() {
  const nc = orders.filter(o => o.status === 'new').length;
  const bn = document.getElementById('sbBadgeNew');
  if (bn) { bn.textContent = nc; bn.style.display = nc ? 'inline' : 'none'; }
  const nCli = Object.keys(clients).length;
  const bc = document.getElementById('sbBadgeCli');
  if (bc) { bc.textContent = nCli; bc.style.display = nCli ? 'inline' : 'none'; }
  const bh = document.getElementById('sbBadgeHist');
  if (bh) { bh.textContent = orders.length; bh.style.display = orders.length ? 'inline' : 'none'; }
}
function updateSidebar() {
  setText('sbRevenue', 'R$ ' + revenue.toFixed(2).replace('.', ','));
  setText('sbRevSub',  doneCnt + ' pedidos');
  setText('sbCliNew',  newCliCnt);
  setText('sbPending', orders.filter(o => o.status === 'new' || o.status === 'prep').length);
}

/* ══════════════════════════════════════════════
   NAVEGACAO
══════════════════════════════════════════════ */
function showPage(id, el, color) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(t => t.classList.remove('active', 'or', 'tl', 'gn', 'pp', 'rd'));
  const pg = document.getElementById('page-' + id);
  if (pg) pg.classList.add('active');
  if (el) { el.classList.add('active'); if (color) el.classList.add(color); }
  if (id === 'pedidos')    { renderBoards(); renderKPIs(); }
  if (id === 'clientes')   renderCliTable();
  if (id === 'historico')  renderHistory();
  if (id === 'relatorios') renderReports();
  if (id === 'estoque')    renderStock();
  updateBadges(); updateSidebar();
}
function filterOrders(type, el) {
  filterType = type;
  document.querySelectorAll('.fchip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  renderBoards();
}
function toggleStore() {
  storeOpen = !storeOpen;
  const b = document.getElementById('storeBadge');
  if (b) b.classList.toggle('closed', !storeOpen);
  setText('storeTxt', storeOpen ? 'Loja Aberta' : 'Loja Fechada');
  const sd = document.getElementById('sdot');
  if (sd) sd.style.animation = storeOpen ? 'pulse 1.2s infinite' : 'none';
  showToast(storeOpen ? 'Loja aberta' : 'Loja fechada');
}

/* ══════════════════════════════════════════════
   SIMULACAO
══════════════════════════════════════════════ */
const DNAMES = ['Ana Silva','Joao Costa','Maria Oliveira','Pedro Santos','Carla Lima','Lucas Ferreira','Beatriz Nunes','Rafael Gomes'];
const DITEMS = [['Classic Smash Burger',35],['Pizza Margherita',45],['Combinado Sushi 20un',78],['Frango Inteiro 1kg',13.90],['Agua Mineral',2.50],['Moqueca de Camarao',72],['Baiao de Dois',32],['Croissant',5.90]];
function simulateOrder() {
  const name = DNAMES[Math.floor(Math.random() * DNAMES.length)];
  const n = 1 + Math.floor(Math.random() * 3);
  const items = DITEMS.slice(0, n).map(([nm, p]) => ({name: nm, qty: 1, price: p}));
  const total = items.reduce((s, i) => s + i.price, 0) + 5;
  const cid = 'sim_' + Date.now();
  onNewClient({id: cid, name, email: name.toLowerCase().replace(' ', '.') + '@email.com',
    phone: '(82) 99' + Math.floor(Math.random()*9000+1000) + '-' + Math.floor(Math.random()*9000+1000),
    address: 'Rua Demo, ' + Math.floor(Math.random()*999+1), registeredAt: new Date().toISOString()});
  onNewOrder({
    id: '#' + Math.floor(Math.random() * 9000 + 1000), items, total,
    client: {id: cid, name, email: name.toLowerCase().replace(' ', '.') + '@email.com',
      phone: '(82) 9999-9999',
      addr: 'Rua Demo, ' + Math.floor(Math.random()*999+1)},
    pay: ['Pix','Cartão','Dinheiro'][Math.floor(Math.random() * 3)],
    type: ['delivery','pickup','market'][Math.floor(Math.random() * 3)],
    time: new Date().toISOString(), status: 'new'
  });
  renderAll();
}

/* ══════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════ */
function showToast(msg, type = 'info') {
  const w = document.getElementById('toastWrap'); if (!w) return;
  const t = document.createElement('div'); t.className = 'toast ' + type;
  t.textContent = msg; w.appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 220); }, 3000);
}
function showNotif(icon, title, sub, type = 'no') {
  const a = document.getElementById('notifArea'); if (!a) return;
  const el = document.createElement('div'); el.className = 'nt ' + type;
  el.innerHTML = '<div class="ntic">' + icon + '</div><div><div class="ntt">' + title + '</div><div class="nts">' + sub.replace(/\n/g, '<br/>') + '</div><div class="ntm">' + hhmm() + '</div></div>';
  a.appendChild(el);
  el.addEventListener('click', () => el.classList.add('removing'));
  setTimeout(() => { el.classList.add('removing'); setTimeout(() => el.remove(), 240); }, 7000);
}
function playBeep() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    [880, 660, 880].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination); o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(.3, c.currentTime + i * .18);
      g.gain.exponentialRampToValueAtTime(.001, c.currentTime + i * .18 + .18);
      o.start(c.currentTime + i * .18); o.stop(c.currentTime + i * .18 + .18);
    });
  } catch(e) {}
}
function playChime() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination); o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(.2, c.currentTime + i * .2);
      g.gain.exponentialRampToValueAtTime(.001, c.currentTime + i * .2 + .25);
      o.start(c.currentTime + i * .2); o.stop(c.currentTime + i * .2 + .25);
    });
  } catch(e) {}
}
function toggleSound() {
  soundOn = !soundOn;
  const b = document.getElementById('sndBtn');
  if (b) { b.textContent = soundOn ? 'Som On' : 'Som Off'; b.classList.toggle('snd-off', !soundOn); }
}
function hhmm() {
  return new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
}
function exportCSV() {
  const list = Object.values(clients);
  if (!list.length) { showToast('Nenhum cliente para exportar'); return; }
  const rows = [['Nome','Email','Telefone','Endereco','CEP','Pedidos','Total Gasto','Cadastrado em'].join(','),
    ...list.map(c => [
      '"' + c.name + '"', '"' + (c.email || '') + '"', '"' + (c.phone || '') + '"',
      '"' + (c.address || '') + '"', '"' + (c.cep || '') + '"',
      c.orderCount || 0, (c.totalSpent || 0).toFixed(2),
      '"' + (c.registeredAt || '') + '"'
    ].join(','))].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows);
  a.download = 'clientes_foodcity.csv'; a.click();
  showToast('CSV exportado!');
}
