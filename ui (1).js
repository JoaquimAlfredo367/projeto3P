'use strict';

// ── UI — badges, navegação, simulação, utilitários ──

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
  // registra o cliente simulado
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
   UI
══════════════════════════════════════════════ */
/* ══════════════════════════════════════════════
   MODAL DE CONFIRMAÇÃO POR PIN
   PIN padrão: 1234 — altere CLEAR_PIN abaixo
══════════════════════════════════════════════ */
const CLEAR_PIN = '1234';

function showPinModal(onConfirm) {
  // Remove modal anterior se existir
  const existing = document.getElementById('pinModal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'pinModal';
  overlay.className = 'pin-overlay';
  overlay.innerHTML = `
    <div class="pin-box" role="dialog" aria-modal="true" aria-labelledby="pinTitle">
      <div class="pin-header">
        <div class="pin-icon">🔐</div>
        <div class="pin-title" id="pinTitle">Confirmar ação</div>
        <div class="pin-sub">Digite o PIN de 4 dígitos para limpar todos os dados</div>
      </div>
      <div class="pin-dots" id="pinDots">
        <div class="pin-dot" id="pd0"></div>
        <div class="pin-dot" id="pd1"></div>
        <div class="pin-dot" id="pd2"></div>
        <div class="pin-dot" id="pd3"></div>
      </div>
      <div class="pin-error" id="pinError"></div>
      <div class="pin-pad">
        ${[1,2,3,4,5,6,7,8,9].map(n =>
          `<button class="pin-key" data-n="${n}">${n}</button>`
        ).join('')}
        <button class="pin-key pin-key-cancel" id="pinCancel">Cancelar</button>
        <button class="pin-key" data-n="0">0</button>
        <button class="pin-key pin-key-del" id="pinDel">⌫</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  let entered = '';

  function updateDots() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById('pd' + i);
      if (!dot) return;
      dot.classList.toggle('filled', i < entered.length);
      dot.classList.remove('shake');
    }
  }

  function shake() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById('pd' + i);
      if (dot) { dot.classList.remove('shake'); void dot.offsetWidth; dot.classList.add('shake'); }
    }
  }

  function close() {
    overlay.classList.add('pin-closing');
    setTimeout(() => overlay.remove(), 200);
  }

  overlay.addEventListener('click', e => {
    const n = e.target.dataset?.n;
    if (n !== undefined && entered.length < 4) {
      entered += n;
      updateDots();
      const err = document.getElementById('pinError');
      if (err) err.textContent = '';
      if (entered.length === 4) {
        if (entered === CLEAR_PIN) {
          close();
          onConfirm();
        } else {
          shake();
          const errEl = document.getElementById('pinError');
          if (errEl) errEl.textContent = 'PIN incorreto. Tente novamente.';
          setTimeout(() => { entered = ''; updateDots(); }, 800);
        }
      }
    }
    if (e.target.id === 'pinDel') {
      entered = entered.slice(0, -1);
      updateDots();
    }
    if (e.target.id === 'pinCancel' || e.target.id === 'pinModal') {
      close();
    }
  });

  // Fecha com Escape, aceita teclado numérico
  function onKey(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); return; }
    if (/^[0-9]$/.test(e.key)) { e.target !== document.querySelector('.pin-key') && overlay.dispatchEvent(Object.assign(new Event('click'), { target: { dataset: { n: e.key } } })); }
    if (e.key === 'Backspace') { entered = entered.slice(0, -1); updateDots(); }
    if (/^[0-9]$/.test(e.key) && entered.length < 4) {
      entered += e.key; updateDots();
      const err = document.getElementById('pinError');
      if (err) err.textContent = '';
      if (entered.length === 4) {
        if (entered === CLEAR_PIN) {
          close(); document.removeEventListener('keydown', onKey); onConfirm();
        } else {
          shake();
          const errEl = document.getElementById('pinError');
          if (errEl) errEl.textContent = 'PIN incorreto. Tente novamente.';
          setTimeout(() => { entered = ''; updateDots(); }, 800);
        }
      }
    }
  }
  document.addEventListener('keydown', onKey);

  updateDots();
  // Foco inicial no overlay para capturar keydown
  overlay.setAttribute('tabindex', '-1');
  overlay.focus();
}

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
/* ══════════════════════════════════════════════
   PAINEL DE ALERTAS GRANULAR
══════════════════════════════════════════════ */

// Metadados dos toggles de alerta
const ALERT_DEFS = [
  { key: 'sndOrder',  icon: '🔔', label: 'Som — Novo pedido',       group: 'som',    critical: true  },
  { key: 'sndClient', icon: '🎵', label: 'Som — Novo cliente',       group: 'som',    critical: false },
  { key: 'sndReady',  icon: '🔔', label: 'Som — Pedido pronto',      group: 'som',    critical: false },
  { key: 'visOrder',  icon: '📦', label: 'Visual — Novos pedidos',   group: 'visual', critical: true  },
  { key: 'visClient', icon: '👤', label: 'Visual — Novos clientes',  group: 'visual', critical: false },
];

function toggleAlertPanel() {
  let panel = document.getElementById('alertPanel');
  if (panel) { panel.remove(); return; }

  panel = document.createElement('div');
  panel.id = 'alertPanel';
  panel.className = 'alert-panel';
  panel.innerHTML = renderAlertPanelHTML();

  // Posiciona abaixo do botão
  const btn = document.getElementById('alertsBtn');
  document.body.appendChild(panel);
  const br = btn.getBoundingClientRect();
  panel.style.top  = (br.bottom + 6) + 'px';
  panel.style.right = (window.innerWidth - br.right) + 'px';

  // Fecha ao clicar fora
  setTimeout(() => {
    document.addEventListener('click', function outsideClose(ev) {
      if (!panel.contains(ev.target) && ev.target.id !== 'alertsBtn') {
        panel.remove();
        document.removeEventListener('click', outsideClose);
      }
    });
  }, 50);
}

function renderAlertPanelHTML() {
  const groups = [
    { id: 'som',    title: '🔊 Sons',             keys: ALERT_DEFS.filter(d => d.group === 'som') },
    { id: 'visual', title: '👁 Notificações visuais', keys: ALERT_DEFS.filter(d => d.group === 'visual') },
  ];
  return `
    <div class="ap-header">
      <span class="ap-title">Configurar Alertas</span>
      <button class="ap-close" onclick="toggleAlertPanel()">✕</button>
    </div>
    ${groups.map(g => `
      <div class="ap-group">
        <div class="ap-group-label">${g.title}</div>
        ${g.keys.map(d => `
          <label class="ap-row${d.critical ? ' ap-critical' : ''}" onclick="toggleAlertPref('${d.key}')">
            <span class="ap-icon">${d.icon}</span>
            <span class="ap-label">${d.label}</span>
            ${d.critical ? '<span class="ap-badge-crit">crítico</span>' : ''}
            <div class="ap-switch${alertPrefs[d.key] ? ' on' : ''}">
              <div class="ap-switch-knob"></div>
            </div>
          </label>
        `).join('')}
      </div>
    `).join('')}
    <div class="ap-footer">
      <button class="ap-all-on"  onclick="setAllAlerts(true)">Ativar tudo</button>
      <button class="ap-all-off" onclick="setAllAlerts(false)">Silenciar tudo</button>
    </div>
  `;
}

function toggleAlertPref(key) {
  if (!(key in alertPrefs)) return;
  alertPrefs[key] = !alertPrefs[key];
  dbSaveSetting('alertPrefs', alertPrefs);
  // Atualiza só o painel sem fechar
  const panel = document.getElementById('alertPanel');
  if (panel) panel.innerHTML = renderAlertPanelHTML();
  updateAlertsBtnState();
}

function setAllAlerts(on) {
  Object.keys(alertPrefs).forEach(k => alertPrefs[k] = on);
  dbSaveSetting('alertPrefs', alertPrefs);
  const panel = document.getElementById('alertPanel');
  if (panel) panel.innerHTML = renderAlertPanelHTML();
  updateAlertsBtnState();
  showToast(on ? 'Todos os alertas ativados' : 'Todos os alertas silenciados');
}

function updateAlertsBtnState() {
  const btn = document.getElementById('alertsBtn');
  if (!btn) return;
  // Pisca vermelho se algum alerta crítico estiver desligado
  const criticalOff = ALERT_DEFS.filter(d => d.critical && !alertPrefs[d.key]).length > 0;
  btn.classList.toggle('alerts-warn', criticalOff);
  btn.title = criticalOff ? '⚠ Alerta crítico desligado' : 'Configurar alertas';
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
