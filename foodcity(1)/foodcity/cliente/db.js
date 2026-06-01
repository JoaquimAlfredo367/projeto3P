'use strict';

// ── IndexedDB — banco local do painel ──

/* ══════════════════════════════════════════════
   INDEXEDDB — banco de dados local do navegador
   Persiste: pedidos, clientes, receita, estoque,
             configurações, dailySummaries
   Banco: "foodcity_painel" · Versão: 2
   Sem servidor, sem instalação, sem limite prático de tamanho.
══════════════════════════════════════════════ */

const DB_NAME = 'foodcity_painel';
const DB_VER  = 2;           // ← bump: adiciona dailySummaries
let painelDB  = null;

function openPainelDB() {
  return new Promise((resolve, reject) => {
    if (painelDB) { resolve(painelDB); return; }
    const req = indexedDB.open(DB_NAME, DB_VER);

    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('orders'))
        db.createObjectStore('orders',   { keyPath: 'id' });
      if (!db.objectStoreNames.contains('clients'))
        db.createObjectStore('clients',  { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings'))
        db.createObjectStore('settings', { keyPath: 'field' });
      if (!db.objectStoreNames.contains('stock'))
        db.createObjectStore('stock',    { keyPath: 'name' });
      if (!db.objectStoreNames.contains('seen'))
        db.createObjectStore('seen',     { keyPath: 'id' });
      // ── NOVO: snapshots históricos de dias fechados ──
      if (!db.objectStoreNames.contains('dailySummaries'))
        db.createObjectStore('dailySummaries', { keyPath: 'date' });
    };

    req.onsuccess = e => { painelDB = e.target.result; resolve(painelDB); };
    req.onerror   = e => { console.warn('[IDB] Erro ao abrir:', e); reject(e); };
  });
}

/* ── helper: put em store ── */
async function dbPut(store, data) {
  try {
    const db = await openPainelDB();
    db.transaction(store, 'readwrite').objectStore(store).put(data);
  } catch(e) { console.warn('[IDB] put', store, e); }
}

/* ── helper: delete em store ── */
async function dbDelete(store, key) {
  try {
    const db = await openPainelDB();
    db.transaction(store, 'readwrite').objectStore(store).delete(key);
  } catch(e) { console.warn('[IDB] delete', store, e); }
}

/* ── helper: getAll de store ── */
async function dbGetAll(store) {
  try {
    const db = await openPainelDB();
    return await new Promise(res => {
      const req = db.transaction(store, 'readonly').objectStore(store).getAll();
      req.onsuccess = e => res(e.target.result || []);
      req.onerror   = () => res([]);
    });
  } catch(e) { return []; }
}

/* ── helper: get de store ── */
async function dbGet(store, key) {
  try {
    const db = await openPainelDB();
    return await new Promise(res => {
      const req = db.transaction(store, 'readonly').objectStore(store).get(key);
      req.onsuccess = e => res(e.target.result ?? null);
      req.onerror   = () => res(null);
    });
  } catch(e) { return null; }
}

/* ── salva/atualiza pedido ── */
async function dbSaveOrder(order) {
  const o = { ...order, time: order.time instanceof Date ? order.time.toISOString() : order.time };
  await dbPut('orders', o);
}

/* ── salva/atualiza cliente ── */
async function dbSaveClient(client) {
  await dbPut('clients', client);
}

/* ── salva configuração ── */
async function dbSaveSetting(field, value) {
  await dbPut('settings', { field, value });
}

/* ── marca evento como visto ── */
async function dbMarkSeen(evId) {
  await dbPut('seen', { id: evId });
}

/* ── salva array inteiro do estoque ── */
async function dbSaveStock() {
  try {
    const db = await openPainelDB();
    const tx = db.transaction('stock', 'readwrite');
    const st = tx.objectStore('stock');
    STOCK.forEach(item => st.put({ ...item }));
  } catch(e) { console.warn('[IDB] saveStock:', e); }
}

/* ── NOVO: salva snapshot de dia fechado ── */
async function dbSaveDailySummary(snap) {
  await dbPut('dailySummaries', snap);
}

/* ── NOVO: lê todos os snapshots ── */
async function dbGetAllDailySummaries() {
  return dbGetAll('dailySummaries');
}

/* ── restaura estado completo ao abrir o painel ── */
async function dbRestorePainel() {
  console.log('[IDB] Restaurando dados do painel…');

  const seenList = await dbGetAll('seen');
  seenList.forEach(ev => seen.add(ev.id));

  const savedClients = await dbGetAll('clients');
  savedClients.forEach(c => { clients[c.id] = c; });

  const savedOrders = await dbGetAll('orders');
  orders = savedOrders
    .filter(o => o.status !== 'cancelled')
    .map(o => ({ ...o, time: new Date(o.time) }))
    .sort((a, b) => b.time - a.time);

  const rev  = await dbGet('settings', 'revenue');
  const done = await dbGet('settings', 'doneCnt');
  const cli  = await dbGet('settings', 'newCliCnt');
  const ev   = await dbGet('settings', 'evCount');
  if (rev)  revenue   = rev.value  || 0;
  if (done) doneCnt   = done.value || 0;
  if (cli)  newCliCnt = cli.value  || 0;
  if (ev)   evCount   = ev.value   || 0;

  const savedStock = await dbGetAll('stock');
  if (savedStock.length === STOCK.length) {
    savedStock.forEach(s => {
      const local = STOCK.find(x => x.name === s.name);
      if (local) local.qty = s.qty;
    });
  }

  renderAll();
  renderStock();
  dbSet('dbEvCount', evCount);
  dbSet('dbStatus', 'IndexedDB OK — ' + orders.length + ' pedidos, ' + savedClients.length + ' clientes restaurados');
  console.log('[IDB] Restauração completa!');
}
