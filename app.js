(() => {
'use strict';
// Không cho trang khác nhúng trang này vào khung (chống lừa bấm / đọc trộm)
if (window.top !== window.self) { document.documentElement.innerHTML = ''; return; }
const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- danh mục ----------
const CATS = {
  chi: [['an', 'Ăn uống'], ['dilai', 'Đi lại'], ['muasam', 'Mua sắm'], ['hoadon', 'Hóa đơn'], ['nha', 'Nhà ở'], ['suckhoe', 'Sức khỏe'], ['giaitri', 'Giải trí'], ['caulong', 'Cầu lông'], ['hoctap', 'Học tập'], ['giadinh', 'Gia đình'], ['khac', 'Khác']],
  thu: [['luong', 'Lương'], ['thuong', 'Thưởng'], ['banhang', 'Bán hàng'], ['dautu', 'Đầu tư'], ['duoccho', 'Được cho'], ['khacthu', 'Khác']],
};
const CAT_NAME = Object.fromEntries([...CATS.chi, ...CATS.thu]);
const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
// Icon động Lordicon (bộ miễn phí "Wired Lineal", cần ghi nguồn lordicon.com)
const LI_KEY = {
  an: 'njrwmskv', dilai: 'pvoxxjof', muasam: 'hwpohgdf', hoadon: 'tcbkwnah', nha: 'pgirtdfe', suckhoe: 'ipbffwpl',
  giaitri: 'zsyzaums', caulong: 'wmqqbxlm', hoctap: 'lufygyut', giadinh: 'xvmmqwjv', khac: 'lzsupfwm',
  luong: 'ylscktzo', thuong: 'mchvarrg', banhang: 'uepnupwh', dautu: 'fcwmlcjj', duoccho: 'ewmfucya', khacthu: 'kkdnopsh',
  home: 'pgirtdfe', piggy: 'opqmrqco', chart: 'fcwmlcjj', book: 'zbtbhzsg', wrench: 'fvkvwmsp', plus: 'ueoydrft',
  exit: 'txuhvtae', bell: 'ypbuyaqd', warning: 'pilfbsjh', coins: 'kkdnopsh', calendar: 'laobovmg', cloud: 'evearxpv', check: 'pxixoqxa',
};
const CAT_HEX = {
  an: '#f4a259', dilai: '#62b6f0', muasam: '#e987b8', hoadon: '#e8c65a', nha: '#a699f5', suckhoe: '#f47c6c', giaitri: '#4fd6d0',
  caulong: '#b4de6a', hoctap: '#8aa2fa', giadinh: '#ea9a62', khac: '#9db2ad', luong: '#63e4a4', thuong: '#6fddb0', banhang: '#93d477',
  dautu: '#4fd1c0', duoccho: '#a6d47a', khacthu: '#9db2ad',
};
// Tất cả icon có sẵn (đã lưu trong thư mục icons/) để chọn cho danh mục tự tạo
const ICON_SET = [...new Set(Object.values(LI_KEY))];
const COLOR_SET = ['#f4a259', '#62b6f0', '#e987b8', '#e8c65a', '#a699f5', '#f47c6c', '#4fd6d0', '#b4de6a', '#8aa2fa', '#ea9a62', '#63e4a4', '#9db2ad'];
function li(name, { size = 24, trigger = 'hover', target = '', primary = '#e7f3f1', secondary = '#36d6c4', delay = 0 } = {}) {
  const key = LI_KEY[name] || (ICON_SET.includes(name) ? name : LI_KEY.khac);
  return `<lord-icon src="icons/${key}.json" trigger="${trigger}"${target ? ` target="${target}"` : ''}${delay ? ` delay="${delay}"` : ''} colors="primary:${primary},secondary:${secondary}" style="width:${size}px;height:${size}px"></lord-icon>`;
}
// Danh mục mặc định; người dùng thêm/sửa/xóa được (lưu mã hóa ở so/vault/cfg/cats)
const DEFAULT_CATS = [
  ...CATS.chi.map(([id, name]) => ({ id, k: 'chi', name, icon: LI_KEY[id], color: CAT_HEX[id] })),
  ...CATS.thu.map(([id, name]) => ({ id, k: 'thu', name, icon: LI_KEY[id], color: CAT_HEX[id] })),
];
const CAT_ICON = {};
let CAT_LIST = DEFAULT_CATS;
function applyCats(list) {
  CAT_LIST = Array.isArray(list) && list.length ? list : DEFAULT_CATS;
  for (const k of Object.keys(CAT_NAME)) delete CAT_NAME[k];
  for (const c of CAT_LIST) { CAT_NAME[c.id] = c.name; CAT_HEX[c.id] = c.color || '#9db2ad'; CAT_ICON[c.id] = c.icon || LI_KEY.khac; }
  CATS.chi = CAT_LIST.filter((c) => c.k === 'chi' && !c.del).map((c) => [c.id, c.name]);
  CATS.thu = CAT_LIST.filter((c) => c.k === 'thu' && !c.del).map((c) => [c.id, c.name]);
}
applyCats(DEFAULT_CATS);
// Icon danh mục: tự chạy khi rê chuột vào cả hàng chứa nó
const catIcon = (c, size = 24, target = 'button') => li(CAT_ICON[c] || c, { size, target, secondary: CAT_HEX[c] || '#9db2ad' });
const ICON = new Proxy({}, { get: (_, c) => catIcon(String(c)) });
const ccVar = (id) => CAT_HEX[id] || '#9db2ad';
const UI = {
  prev: P('<path d="M15 5l-7 7 7 7"/>'),
  next: P('<path d="M9 5l7 7-7 7"/>'),
};

// ---------- tiền & ngày ----------
const NF = new Intl.NumberFormat('vi-VN');
const money = (n) => NF.format(Math.round(n)) + ' ₫';
const MINUS = '−';
const trim1 = (x) => (Math.round(x * 10) / 10).toString().replace('.', ',');
const short = (n) => n >= 1e9 ? trim1(n / 1e9) + ' tỷ' : n >= 1e6 ? trim1(n / 1e6) + 'tr' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(Math.round(n));
const WD = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const WDS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
const dm = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
function isoWeek(d) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(t.getFullYear(), 0, 4);
  return 1 + Math.round(((t - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}
function rangeOf(view, a) {
  if (view === 'day') return [a, a];
  if (view === 'week') { const s = addDays(a, -((a.getDay() + 6) % 7)); return [s, addDays(s, 6)]; }
  return [new Date(a.getFullYear(), a.getMonth(), 1), new Date(a.getFullYear(), a.getMonth() + 1, 0)];
}
function shifted(view, a, dir) {
  if (view === 'day') return addDays(a, dir);
  if (view === 'week') return addDays(a, 7 * dir);
  const last = new Date(a.getFullYear(), a.getMonth() + dir + 1, 0).getDate();
  return new Date(a.getFullYear(), a.getMonth() + dir, Math.min(a.getDate(), last));
}
const daysBetween = (s, e) => { const out = []; for (let d = s; d <= e; d = addDays(d, 1)) out.push(d); return out; };

// ---------- mã hóa (PIN -> khóa AES-GCM, dữ liệu được mã hóa trước khi lưu) ----------
const te = new TextEncoder(), td = new TextDecoder();
const b64 = (buf) => { const a = new Uint8Array(buf); let s = ''; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function deriveKey(pin, salt, iter, extractable = false) {
  const base = await crypto.subtle.importKey('raw', te.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, extractable, ['encrypt', 'decrypt']);
}
async function seal(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(obj)));
  return { iv: b64(iv), c: b64(c) };
}
async function unseal(key, box) {
  const p = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.c));
  return JSON.parse(td.decode(p));
}
const ITER = 600000; // PBKDF2-SHA256, mức khuyến nghị OWASP: làm chậm việc dò mật khẩu
const MIN_PASS = 8;
// Mã kích hoạt: chỉ người có mã mới tạo được tài khoản. Trang chỉ chứa mã băm, không chứa mã.
const ACT_HASH = '2fb4762376c470b2bec91a31af3213f9a24ea3141e0c5e566b0085b446adf155';
async function activationOk(input) {
  const d = await crypto.subtle.digest('SHA-256', te.encode('ghi-chu-kich-hoat:' + normCode(input)));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('') === ACT_HASH;
}
// Chống dò mật khẩu: sai 5 lần thì phải chờ, mỗi lần sai thêm chờ gấp đôi (tối đa 1 giờ)
function failState() { try { return JSON.parse(localStorage.getItem('gc.fail')) || { n: 0, until: 0 }; } catch { return { n: 0, until: 0 }; } }
function waitLeft() { return Math.max(0, Math.ceil((failState().until - Date.now()) / 1000)); }
function noteFail() {
  const f = failState(); f.n++;
  if (f.n >= 5) f.until = Date.now() + Math.min(3600, 30 * 2 ** (f.n - 5)) * 1000;
  try { localStorage.setItem('gc.fail', JSON.stringify(f)); } catch {}
  return f;
}
function clearFail() { try { localStorage.removeItem('gc.fail'); } catch {} }
function failMsg(base) {
  const f = failState(), w = waitLeft();
  if (w) return `${base} Đã sai ${f.n} lần, thử lại sau ${w >= 60 ? Math.ceil(w / 60) + ' phút' : w + ' giây'}.`;
  return f.n >= 2 ? `${base} Còn ${Math.max(0, 5 - f.n)} lần thử trước khi bị khóa tạm.` : base;
}
const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
const importData = (raw) => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
async function encRaw(key, bytes) {
  const iv = rand(12);
  return { iv: b64(iv), c: b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes)) };
}
async function decRaw(key, box) {
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.c)));
}
// Mã khôi phục: 16 ký tự, bỏ các chữ dễ nhầm (0/O, 1/I/L)
const ALPH = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
function genCode() {
  let out = '';
  while (out.length < 16) for (const b of rand(32)) if (b < 248 && out.length < 16) out += ALPH[b % 31];
  return out.match(/.{4}/g).join('-');
}
const normCode = (s) => String(s).toUpperCase().replace(/[^0-9A-Z]/g, '');
// Sổ dùng một khóa dữ liệu ngẫu nhiên; khóa này được bọc 2 lần: bằng mã PIN và bằng mã khôi phục
async function buildVault(raw, dataKey, pin, code) {
  const salt = rand(16), rsalt = rand(16);
  const [pinKey, recKey] = await Promise.all([deriveKey(pin, salt, ITER), deriveKey(normCode(code), rsalt, ITER)]);
  return {
    v: 2, iter: ITER, riter: ITER, salt: b64(salt), rsalt: b64(rsalt),
    pinWrap: await encRaw(pinKey, raw), recWrap: await encRaw(recKey, raw),
    recBox: await seal(dataKey, { code }), check: await seal(dataKey, { ok: 1 }),
    created: (vault && vault.created) || Date.now(), updated: Date.now(),
  };
}
async function pinFields(raw, pin) {
  const salt = rand(16);
  return { salt: b64(salt), iter: ITER, pinWrap: await encRaw(await deriveKey(pin, salt, ITER), raw), updated: Date.now() };
}

// ---------- trạng thái ----------
const S = {
  gate: 'boot', gateMsg: '', gateErr: '', busy: false,
  demo: false, key: null, raw: null, tx: new Map(), loading: true, stale: false, loadErr: '', gen: 0,
  recCode: '', pending: null, panel: '', shownCode: '', panelErr: '', panelMsg: '',
  bg: new Map(), bpanel: null, bErr: '', gateNote: '',
  view: 'week', anchor: today(), bk: 'chi',
};
try { const v = localStorage.getItem('stc.view'); if (['day', 'week', 'month'].includes(v)) S.view = v; } catch {}
let db = null, vaultRef = null, txCol = null, bgCol = null, cfgCol = null, vault = null, unsub = null, unsubBg = null, unsubCfg = null, loadTimer = null;

// ---------- lưu ngay trong máy (localStorage), không gửi đi đâu ----------
const PFX = 'gc1:';
function lsKeys() { const out = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PFX)) out.push(k.slice(PFX.length)); } return out; }
function localDB() {
  const listeners = new Set();
  const read = (p) => { const s = localStorage.getItem(PFX + p); return s ? JSON.parse(s) : null; };
  const write = (p, v) => { try { localStorage.setItem(PFX + p, JSON.stringify(v)); } catch { throw { code: 'quota_exceeded' }; } };
  const depth = (p) => p.split('/').length;
  const notify = () => { setTimeout(() => listeners.forEach((f) => f()), 0); scheduleSnap(); };
  addEventListener('storage', notify);
  const snap = (k, v) => ({ id: k.split('/').pop(), exists: v != null, data: () => (v == null ? undefined : v), metadata: { fromCache: false, hasPendingWrites: false } });
  const kids = (path) => lsKeys().filter((k) => k.startsWith(path + '/') && depth(k) === depth(path) + 1).sort();
  const doc = (path) => ({
    id: path.split('/').pop(), path,
    async get() { return snap(path, read(path)); },
    async set(d) { write(path, d); notify(); },
    async update(d) { const cur = read(path); if (!cur) throw { code: 'invalid_argument' }; write(path, { ...cur, ...d }); notify(); },
    async delete() { localStorage.removeItem(PFX + path); notify(); },
    collection: (p) => col(path + '/' + p),
  });
  const col = (path) => ({
    path,
    doc: (id) => doc(path + '/' + (id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8))),
    async get() { return { docs: kids(path).map((k) => snap(k, read(k))) }; },
    onSnapshot(next) {
      let prev = new Map();
      const fire = () => {
        const cur = new Map(kids(path).map((k) => [k, localStorage.getItem(PFX + k)]));
        const ch = [];
        for (const [k, s] of cur) if (prev.get(k) !== s) ch.push({ type: prev.has(k) ? 'modified' : 'added', doc: snap(k, JSON.parse(s)) });
        for (const [k, s] of prev) if (!cur.has(k)) ch.push({ type: 'removed', doc: snap(k, JSON.parse(s)) });
        prev = cur;
        if (ch.length || !fire.done) { fire.done = true; next({ docs: [], docChanges: () => ch, metadata: { fromCache: false } }); }
      };
      listeners.add(fire); setTimeout(fire, 0);
      return () => listeners.delete(fire);
    },
  });
  return { doc, collection: col };
}

// ---------- sao lưu / khôi phục bằng file (file đã mã hóa, cần PIN hoặc mã khôi phục để mở) ----------
// ---------- tự động sao lưu: bản sao mã hóa theo ngày trong IndexedDB (giữ 14 ngày gần nhất) ----------
const SNAP_KEEP = 14;
function snapDB() {
  return new Promise((ok, bad) => {
    const r = indexedDB.open('ghi-chu-saoluu', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('snaps');
    r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error);
  });
}
async function snapRun(mode, fn) {
  const d = await snapDB();
  try { return await new Promise((ok, bad) => { const tx = d.transaction('snaps', mode); const st = tx.objectStore('snaps'); const out = fn(st); tx.oncomplete = () => ok(out && out.result !== undefined ? out.result : out); tx.onerror = () => bad(tx.error); }); }
  finally { d.close(); }
}
function collectItems() { const items = {}; for (const k of lsKeys()) items[k] = JSON.parse(localStorage.getItem(PFX + k)); return items; }
let snapT;
function scheduleSnap() { clearTimeout(snapT); snapT = setTimeout(() => saveSnap().catch(() => {}), 2500); }
async function saveSnap() {
  const items = collectItems();
  if (!items['so/vault']) return;
  const day = ymd(today());
  await snapRun('readwrite', (st) => st.put({ day, at: Date.now(), n: Object.keys(items).length, items }, day));
  const keys = (await snapRun('readonly', (st) => st.getAllKeys())).sort();
  if (keys.length > SNAP_KEEP) await snapRun('readwrite', (st) => keys.slice(0, keys.length - SNAP_KEEP).forEach((k) => st.delete(k)));
}
async function listSnaps() {
  try { return (await snapRun('readonly', (st) => st.getAll())).map((s) => ({ day: s.day, at: s.at, n: s.n })).sort((a, b) => b.at - a.at); } catch { return []; }
}
async function restoreSnap(day) {
  const s = await snapRun('readonly', (st) => st.get(day));
  if (!s || !s.items || !s.items['so/vault']) throw new Error('Không đọc được bản sao lưu này.');
  for (const k of lsKeys()) localStorage.removeItem(PFX + k);
  for (const [k, v] of Object.entries(s.items)) localStorage.setItem(PFX + k, JSON.stringify(v));
}
// Tự tải file sao lưu khi đã quá 7 ngày chưa sao lưu (chạy ngay sau khi đăng nhập)
function autoFileBackup() {
  let lb = 0; try { lb = Number(localStorage.getItem('gc.lastBackup')) || 0; } catch {}
  const hasData = lsKeys().some((k) => k.startsWith('so/vault/tx/'));
  if (!hasData || Date.now() - lb < 7 * 864e5) return false;
  try { exportBackup(); return true; } catch { return false; }
}

function exportBackup() {
  const items = {};
  for (const k of lsKeys()) items[k] = JSON.parse(localStorage.getItem(PFX + k));
  const blob = new Blob([JSON.stringify({ app: 'ghi-chu', v: 1, at: new Date().toISOString(), items })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ghi-chu-sao-luu-${ymd(today())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  try { localStorage.setItem('gc.lastBackup', String(Date.now())); } catch {}
}
async function importBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { throw new Error('File này không đọc được. Chọn đúng file ghi-chu-sao-luu-….json.'); }
  if (!data || data.app !== 'ghi-chu' || !data.items || !data.items['so/vault']) throw new Error('Đây không phải file sao lưu của sổ này.');
  for (const k of lsKeys()) localStorage.removeItem(PFX + k);
  try { for (const [k, v] of Object.entries(data.items)) localStorage.setItem(PFX + k, JSON.stringify(v)); }
  catch { throw new Error('Bộ nhớ trình duyệt không đủ chỗ để nhập file này.'); }
}
async function afterImport() {
  S.gen++; if (unsub) { unsub(); unsub = null; }
  S.key = null; S.raw = null; S.tx = new Map(); S.panel = ''; closeSheet();
  vault = (await vaultRef.get()).data();
  S.gate = 'unlock'; S.gateErr = ''; S.gateNote = 'Đã nhập file sao lưu. Đăng nhập bằng tài khoản của sổ trong file đó.';
  render();
}
async function retryOnce(fn) {
  try { return await fn(); } catch (e) {
    if (e && e.code === 'unavailable') { await sleep(400 + Math.random() * 600); return fn(); }
    throw e;
  }
}
function errText(e) {
  const c = e && e.code;
  if (c === 'quota_exceeded') return 'Bộ nhớ trình duyệt đã đầy. Sao lưu ra file rồi xóa bớt các khoản cũ.';
  return 'Không lưu được. Thử lại.';
}

async function boot() {
  S.gate = 'boot'; S.gateErr = ''; render();
  if (!(window.crypto && crypto.subtle)) { S.gate = 'nodb'; S.gateMsg = 'Trình duyệt này không hỗ trợ mã hóa dữ liệu. Mở bằng Chrome hoặc Safari bản mới.'; return render(); }
  try { localStorage.setItem(PFX + '_t', '1'); localStorage.removeItem(PFX + '_t'); }
  catch { S.gate = 'nodb'; S.gateMsg = 'Trình duyệt đang chặn lưu dữ liệu (có thể đang ở chế độ ẩn danh). Mở bằng tab thường.'; return render(); }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch {}
  db = localDB();
  vaultRef = db.doc('so/vault');
  txCol = vaultRef.collection('tx');
  bgCol = vaultRef.collection('bg');
  cfgCol = vaultRef.collection('cfg');
  const snap = await vaultRef.get();
  vault = snap.exists ? snap.data() : null;
  S.gate = vault ? 'unlock' : 'setup';
  render();
}

function showRecCode(code, key, raw, upgraded) {
  S.gate = 'reccode'; S.recCode = code; S.pending = { key, raw }; S.recUpgraded = !!upgraded; S.gateErr = '';
  render();
}
const normUser = (s) => String(s).trim().toLowerCase();
// Hạn mức tạo sẵn theo yêu cầu: tháng
const DEFAULT_BUDGETS = [
  { cat: 'an', amt: 1000000, per: 'month' },
  { cat: 'caulong', amt: 500000, per: 'month' },
  { cat: 'muasam', amt: 500000, per: 'month' },
];
async function createPin(pin, user) {
  const raw = rand(32), dataKey = await importData(raw), code = genCode();
  const v = { ...(await buildVault(raw, dataKey, pin, code)), user: normUser(user) };
  await retryOnce(() => vaultRef.set(v));
  vault = v;
  for (const b of DEFAULT_BUDGETS) await bgCol.doc().set(await seal(dataKey, { ...b, ts: Date.now() }));
  showRecCode(code, dataKey, raw, false);
}
async function unlock(pin, user) {
  if (vault.user && normUser(user) !== vault.user) return false;
  if (vault.v === 2) {
    let raw;
    try { raw = await decRaw(await deriveKey(pin, unb64(vault.salt), vault.iter || ITER), vault.pinWrap); } catch { return false; }
    enterApp(await importData(raw), raw);
    return true;
  }
  // Sổ tạo từ bản đầu (chưa có mã khôi phục): mở bằng khóa cũ rồi nâng cấp, dữ liệu giữ nguyên
  const k1 = await deriveKey(pin, unb64(vault.salt), vault.iter || ITER, true);
  try { await unseal(k1, vault.check); } catch { return false; }
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', k1));
  const dataKey = await importData(raw);
  try {
    const code = genCode();
    const v = await buildVault(raw, dataKey, pin, code);
    await retryOnce(() => vaultRef.set(v));
    vault = v;
    showRecCode(code, dataKey, raw, true);
  } catch { enterApp(dataKey, raw); }
  return true;
}
async function recover(code, newPin) {
  let raw;
  try { raw = await decRaw(await deriveKey(normCode(code), unb64(vault.rsalt), vault.riter || ITER), vault.recWrap); } catch { return false; }
  const upd = await pinFields(raw, newPin);
  await retryOnce(() => vaultRef.update(upd));
  vault = { ...vault, ...upd };
  enterApp(await importData(raw), raw);
  return true;
}
async function changePin(newPin) {
  const upd = await pinFields(S.raw, newPin);
  await retryOnce(() => vaultRef.update(upd));
  vault = { ...vault, ...upd };
}
function enterApp(key, raw) {
  S.gateNote = ''; S.bpanel = null; S.bErr = ''; S.profile = {}; S.cpanel = null; applyCats(null); S.welcome = true;
  S.key = key; S.raw = raw || null; S.demo = false; S.panel = ''; S.shownCode = ''; S.tx = new Map(); S.loading = true; S.stale = false; S.loadErr = '';
  S.gate = 'app';
  const gen = ++S.gen;
  let chain = Promise.resolve();
  clearTimeout(loadTimer);
  loadTimer = setTimeout(() => { if (S.loading) { S.stale = true; render(); } }, 10000);
  unsub = txCol.onSnapshot((snap) => {
    const changes = snap.docChanges(); const confirmed = !snap.metadata.fromCache;
    chain = chain.then(async () => {
      for (const ch of changes) {
        if (gen !== S.gen) return;
        if (ch.type === 'removed') { S.tx.delete(ch.doc.id); continue; }
        try { const t = await unseal(key, ch.doc.data()); if (gen === S.gen) S.tx.set(ch.doc.id, { ...t, id: ch.doc.id }); } catch {}
      }
      if (gen !== S.gen) return;
      if (confirmed) { S.loading = false; S.stale = false; clearTimeout(loadTimer); }
      render();
    });
  }, (e) => {
    if (gen !== S.gen) return;
    S.loading = false; clearTimeout(loadTimer);
    S.loadErr = 'Không tải được sổ (' + (e && e.code) + '). Tải lại trang để thử lại.';
    render();
  });
  S.bg = new Map();
  let bchain = Promise.resolve();
  unsubBg = bgCol.onSnapshot((snap) => {
    const changes = snap.docChanges();
    bchain = bchain.then(async () => {
      for (const ch of changes) {
        if (gen !== S.gen) return;
        if (ch.type === 'removed') { S.bg.delete(ch.doc.id); continue; }
        try { const b = await unseal(key, ch.doc.data()); if (gen === S.gen) S.bg.set(ch.doc.id, { ...b, id: ch.doc.id }); } catch {}
      }
      if (gen === S.gen) render();
    });
  });
  // Cài đặt mã hóa: danh mục tự chỉnh + hồ sơ (tên hiển thị, ảnh đại diện)
  let cchain = Promise.resolve();
  unsubCfg = cfgCol.onSnapshot((snap) => {
    const changes = snap.docChanges();
    cchain = cchain.then(async () => {
      for (const ch of changes) {
        if (gen !== S.gen) return;
        const id = ch.doc.id;
        if (ch.type === 'removed') { if (id === 'cats') applyCats(null); if (id === 'profile') S.profile = {}; continue; }
        try {
          const v = await unseal(key, ch.doc.data());
          if (gen !== S.gen) return;
          if (id === 'cats') applyCats(v.list);
          if (id === 'profile') S.profile = v;
        } catch {}
      }
      if (gen === S.gen) render();
    });
  });
  render();
}
async function saveCfg(id, obj) {
  if (S.demo) return;
  await cfgCol.doc(id).set(await seal(S.key, obj));
}
function lock() {
  S.gen++;
  if (unsub) { unsub(); unsub = null; }
  if (unsubBg) { unsubBg(); unsubBg = null; }
  if (unsubCfg) { unsubCfg(); unsubCfg = null; }
  S.bg = new Map(); S.bpanel = null; S.profile = {}; S.cpanel = null; S.profDraft = null; applyCats(null);
  clearTimeout(loadTimer);
  S.key = null; S.raw = null; S.pending = null; S.recCode = ''; S.panel = ''; S.shownCode = ''; S.tx = new Map(); closeSheet();
  if (S.demo) { S.demo = false; return boot(); }
  S.gate = vault ? 'unlock' : 'setup'; S.gateErr = '';
  render();
}
async function wipe() {
  for (const c of [txCol, bgCol, cfgCol]) {
    const all = await c.get();
    for (const d of all.docs) await c.doc(d.id).delete();
  }
  await retryOnce(() => vaultRef.delete());
  vault = null; S.gate = 'setup'; S.gateErr = ''; render();
}

// Dữ liệu mẫu chỉ để xem thử, không lưu
function startDemo() {
  const t = today(); const m0 = new Date(t.getFullYear(), t.getMonth(), 1);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tx = new Map(); let n = 0;
  const add = (d, k, a, cat, note) => { const id = 'm' + (n++); tx.set(id, { id, k, a: Math.round(a / 1000) * 1000, cat, note, d: ymd(d), ts: n }); };
  for (let d = addDays(m0, -10); d <= t; d = addDays(d, 1)) {
    if (d.getDate() === 1) { add(d, 'thu', 15000000, 'luong', 'Lương tháng'); add(d, 'chi', 3500000, 'nha', 'Tiền phòng'); }
    if (d.getDate() === 5) add(d, 'chi', 465000, 'hoadon', 'Tiền điện');
    if (d.getDate() === 12) add(d, 'chi', 220000, 'hoadon', 'Internet');
    add(d, 'chi', 30000 + rnd() * 25000, 'an', 'Ăn sáng');
    add(d, 'chi', 35000 + rnd() * 30000, 'an', 'Cơm trưa');
    if (rnd() > 0.45) add(d, 'chi', 20000 + rnd() * 30000, 'dilai', 'Xăng xe / Grab');
    if (rnd() > 0.82) add(d, 'chi', 150000 + rnd() * 450000, 'muasam', 'Mua đồ');
    if (rnd() > 0.88) add(d, 'chi', 80000 + rnd() * 200000, 'giaitri', 'Cà phê, xem phim');
    if (rnd() > 0.93) add(d, 'thu', 300000 + rnd() * 900000, 'banhang', 'Bán đồ cũ');
    if (d.getDay() === 0) add(d, 'chi', 200000 + rnd() * 300000, 'giadinh', 'Đi chợ cuối tuần');
  }
  S.bg = new Map(DEFAULT_BUDGETS.map((b, i) => ['b' + i, { ...b, id: 'b' + i }]));
  S.welcome = true;
  S.demo = true; S.key = null; S.tx = tx; S.loading = false; S.stale = false; S.loadErr = ''; S.gate = 'app';
  render();
}

// ---------- vẽ ----------
const app = $('#app');
function render() { if (S.gate === 'app') renderApp(); else { renderGate(); syncWelcome(''); } }

function gateShell(inner) {
  app.innerHTML = `<div class="gate"><div class="gate-card"><div class="logo">${li('coins', { size: 34, trigger: 'loop', delay: 2500, primary: '#04201d', secondary: '#04201d' })}</div>${inner}</div></div>`;
}
function renderGate() {
  const g = S.gate;
  if (g === 'boot') return gateShell(`<h1>Ghi chú cá nhân</h1><p>Đang kết nối…</p><div class="skel"></div><div class="skel" style="width:70%"></div>`);
  if (g === 'nodb') return gateShell(`<h1>Ghi chú cá nhân</h1><p>${esc(S.gateMsg)}</p><button class="btn primary" data-act="demo">Xem thử với dữ liệu mẫu</button>`);
  if (g === 'offline') return gateShell(`<h1>Chưa kết nối được</h1><p>Không đọc được sổ lúc này. Kiểm tra mạng rồi thử lại.</p><button class="btn primary" data-act="retry">Thử lại</button>`);
  if (g === 'setup') return gateShell(`
    <h1>Tạo tài khoản</h1>
    <p>Sổ chỉ lưu trong máy này và được mã hóa bằng mật khẩu của bạn. Không ai khác đọc được.</p>
    <form id="gateForm" data-kind="setup">
      <label class="field">Mã kích hoạt<input id="actIn" class="code-in" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="24" placeholder="XXXXX-XXXXX-XXXXX"></label>
      <label class="field">Tên đăng nhập<input id="uname" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="40"></label>
      <label class="field">Mật khẩu (ít nhất ${MIN_PASS} ký tự)<input id="pin1" type="password" autocomplete="new-password" maxlength="64"></label>
      <label class="field">Nhập lại mật khẩu<input id="pin2" type="password" autocomplete="new-password" maxlength="64"></label>
      ${S.gateErr ? `<p class="err">${esc(S.gateErr)}</p>` : ''}
      <button class="btn primary" type="submit" ${S.busy ? 'disabled' : ''}>${S.busy ? 'Đang tạo…' : 'Tạo tài khoản'}</button>
    </form>
    <p class="fine">Sau khi tạo, bạn nhận một <b>mã khôi phục</b>. Quên mật khẩu thì dùng mã đó để đặt mật khẩu mới mà không mất dữ liệu.</p>
    <label class="link" for="importFile">Đổi máy? Mở sổ từ file sao lưu</label>
    <input type="file" id="importFile" accept=".json,application/json" hidden>`);
  if (g === 'reccode') return gateShell(`
    <h1>Lưu mã khôi phục</h1>
    <p>Khi quên mật khẩu, nhập mã này để đặt mật khẩu mới. Sau khi đăng nhập, bạn xem lại được mã trong mục Bảo mật.</p>
    <p>Tên đăng nhập: <b>${esc(vault && vault.user || '')}</b></p>
    <div class="code" id="recCodeText">${esc(S.recCode)}</div>
    <button class="btn ghost" style="flex:1" data-act="copycode" data-code="${esc(S.recCode)}">Chép mã</button>
    <p class="fine">Chụp màn hình hoặc ghi ra giấy, cất ở chỗ khác điện thoại. Ai cầm được máy này và có mã này thì mở được sổ.</p>
    <label class="check"><input type="checkbox" id="recOk"> Tôi đã lưu mã khôi phục</label>
    ${S.gateErr ? `<p class="err">${esc(S.gateErr)}</p>` : ''}
    <button class="btn primary" data-act="reccontinue">Vào sổ</button>`);
  if (g === 'unlock') return gateShell(`
    <h1>Đăng nhập</h1>
    <p>${S.gateNote ? esc(S.gateNote) : 'Nhập tên đăng nhập và mật khẩu để mở sổ.'}</p>
    <form id="gateForm" data-kind="unlock">
      <label class="field">Tên đăng nhập<input id="uname" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="40"></label>
      <label class="field">Mật khẩu<input id="pin1" type="password" autocomplete="current-password" maxlength="64"></label>
      ${S.gateErr ? `<p class="err">${esc(S.gateErr)}</p>` : ''}
      <button class="btn primary" type="submit" ${S.busy ? 'disabled' : ''}>${S.busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
    </form>
    <button class="link" data-act="forgot">Quên mật khẩu?</button>`);
  if (g === 'forgot') return gateShell(`
    <h1>Quên mật khẩu</h1>
    <p>Nhập mã khôi phục bạn đã lưu khi tạo tài khoản, rồi đặt mật khẩu mới. Dữ liệu được giữ nguyên. Tên đăng nhập sẽ hiện lại sau khi bạn đặt xong.</p>
    <form id="gateForm" data-kind="recover">
      <label class="field">Mã khôi phục<input id="recIn" class="code-in" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="24" placeholder="XXXX-XXXX-XXXX-XXXX"></label>
      <label class="field">Mật khẩu mới (ít nhất ${MIN_PASS} ký tự)<input id="pin1" type="password" autocomplete="new-password" maxlength="64"></label>
      <label class="field">Nhập lại mật khẩu mới<input id="pin2" type="password" autocomplete="new-password" maxlength="64"></label>
      ${S.gateErr ? `<p class="err">${esc(S.gateErr)}</p>` : ''}
      <button class="btn primary" type="submit" ${S.busy ? 'disabled' : ''}>${S.busy ? 'Đang kiểm tra…' : 'Đặt mật khẩu mới'}</button>
    </form>
    <button class="link" data-act="back">Quay lại đăng nhập</button>
    <button class="link" data-act="wipeask">Mất cả mã khôi phục? Xóa sổ làm lại</button>`);
  if (g === 'wipe') return gateShell(`
    <h1>Xóa sổ và làm lại</h1>
    <p>Xóa sổ sẽ xóa vĩnh viễn mọi khoản đã ghi trên máy này và không lấy lại được (trừ khi bạn có file sao lưu), rồi cho bạn tạo tài khoản mới.</p>
    <form id="gateForm" data-kind="wipe">
      <label class="field">Gõ chữ XOA để xác nhận<input id="pin1" autocomplete="off" maxlength="8"></label>
      ${S.gateErr ? `<p class="err">${esc(S.gateErr)}</p>` : ''}
      <button class="btn primary" type="submit" style="background:var(--out)" ${S.busy ? 'disabled' : ''}>${S.busy ? 'Đang xóa…' : 'Xóa vĩnh viễn'}</button>
    </form>
    <button class="link" data-act="back">Quay lại đăng nhập</button>`);
}

function inRange(s, e) { const a = ymd(s), b = ymd(e); return [...S.tx.values()].filter((t) => t.d >= a && t.d <= b); }
const total = (list, k) => list.reduce((x, t) => x + (t.k === k ? t.a : 0), 0);
const signed = (t) => (t.k === 'thu' ? '+' : MINUS) + money(t.a);

function periodText(view, s, e) {
  const t = today();
  if (view === 'day') {
    const diff = Math.round((s - t) / 864e5);
    const rel = diff === 0 ? 'Hôm nay' : diff === -1 ? 'Hôm qua' : diff === 1 ? 'Ngày mai' : `${s.getFullYear()}`;
    return [`${WD[s.getDay()]}, ${dm(s)}`, rel];
  }
  if (view === 'week') return [`Tuần ${isoWeek(s)}`, `${dm(s)} – ${dm(e)}/${e.getFullYear()}`];
  return [`Tháng ${s.getMonth() + 1}/${s.getFullYear()}`, `${e.getDate()} ngày`];
}
const WORD = { day: 'trong ngày', week: 'trong tuần', month: 'trong tháng' };
const PREV = { day: 'hôm trước', week: 'tuần trước', month: 'tháng trước' };

function niceMax(v) {
  if (v <= 0) return 100000;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
function chartWidth() {
  const vw = Math.min(innerWidth, 1320);
  if (innerWidth <= 760) return innerWidth - 32 - 38;
  if (innerWidth <= 1100) return vw - 32 - 84 - 18 - 38;
  return vw - 32 - 84 - 18 - 360 - 18 - 38;
}
function chartSVG(days, vals, avg) {
  const W = Math.max(260, Math.min(chartWidth(), 900)), H = 180, L = 38, R = 8, T = 16, B = 24;
  const n = days.length, iw = W - L - R, ih = H - T - B, bw = iw / n;
  const w = Math.max(3, Math.min(26, bw * (n <= 7 ? 0.46 : 0.62)));
  const max = niceMax(Math.max(...vals, avg));
  const y = (v) => T + ih - (v / max) * ih;
  const tk = ymd(today());
  let g = `<defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3BE0CB"/><stop offset="1" stop-color="#1C7FA0"/></linearGradient></defs>`;
  for (const v of [0, max / 2, max]) g += `<line class="grid-l" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ylab" x="${L - 6}" y="${y(v) + 3.5}" text-anchor="end">${v ? short(v) : '0'}</text>`;
  days.forEach((d, i) => {
    const key = ymd(d), v = vals[i], cx = L + i * bw + bw / 2, h = v > 0 ? Math.max(3, (v / max) * ih) : 3;
    const isT = key === tk;
    g += `<rect class="hit" x="${L + i * bw}" y="${T}" width="${bw}" height="${ih + B}" data-act="pickday" data-d="${key}" tabindex="0" role="button" aria-label="${WD[d.getDay()]} ${dm(d)}: chi ${money(v)}"/>`;
    g += `<rect class="bar${v > 0 ? '' : ' zero'}${isT ? ' is-today' : ''}" x="${cx - w / 2}" y="${T + ih - h}" width="${w}" height="${h}" rx="${Math.min(6, w / 2)}" pointer-events="none"/>`;
    const lab = n <= 7 ? WDS[d.getDay()] : ([1, 5, 10, 15, 20, 25].includes(d.getDate()) || i === n - 1 ? String(d.getDate()) : '');
    if (lab) g += `<text class="xlab${isT ? ' is-today' : ''}" x="${cx}" y="${H - 7}" text-anchor="middle" pointer-events="none">${lab}</text>`;
  });
  if (avg > 0) g += `<line class="avg" x1="${L}" x2="${W - R}" y1="${y(avg)}" y2="${y(avg)}" pointer-events="none"/><text class="avg-lab" x="${W - R}" y="${y(avg) - 5}" text-anchor="end">TB ${short(avg)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Biểu đồ chi tiêu theo ngày">${g}</svg>`;
}
// Vòng tròn thống kê theo danh mục (như "Your Statistic" ở ảnh mẫu)
function donutSVG(rows, totalV) {
  const r = 78, C = 2 * Math.PI * r, gap = rows.length > 1 ? 3 : 0;
  let off = 0, arcs = '';
  for (const [c, v] of rows) {
    const len = Math.max(0, (v / totalV) * C - gap);
    arcs += `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${CAT_HEX[c] || '#9db2ad'}" stroke-width="22" stroke-linecap="butt" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"/>`;
    off += (v / totalV) * C;
  }
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="${r}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="22"/>${arcs}<circle cx="100" cy="100" r="60" fill="rgba(8,17,19,.55)" stroke="rgba(255,255,255,.08)"/></svg>`;
}
function partOfDay() { const h = new Date().getHours(); return h < 11 ? 'sáng' : h < 13 ? 'trưa' : h < 18 ? 'chiều' : 'tối'; }
const NAV = [['top', 'home', 'Tổng quan'], ['budgets', 'piggy', 'Hạn mức'], ['stats', 'chart', 'Thống kê'], ['ledger', 'book', 'Sổ ghi'], ['security', 'wrench', 'Bảo mật']];

function renderApp() {
  const [s, e] = rangeOf(S.view, S.anchor);
  const list = inRange(s, e);
  const thu = total(list, 'thu'), chi = total(list, 'chi'), net = thu - chi;
  const [h2, sub] = periodText(S.view, s, e);
  const t = today();
  const isNow = t >= s && t <= e;
  // Kỳ đang chạy: so với cùng số ngày của kỳ trước, để đầu tuần/đầu tháng không bị so lệch
  const [ps, pe0] = rangeOf(S.view, shifted(S.view, S.anchor, -1));
  const span = isNow ? Math.round((t - s) / 864e5) : null;
  const pe = span !== null && S.view !== 'day' ? new Date(Math.min(+addDays(ps, span), +pe0)) : pe0;
  const pchi = total(inRange(ps, pe), 'chi');
  const prevWord = span !== null && S.view !== 'day' ? `cùng kỳ ${PREV[S.view]}` : PREV[S.view];

  let cmp = '';
  if (pchi > 0) {
    const pct = Math.round(((chi - pchi) / pchi) * 100);
    cmp = pct === 0 ? `Chi bằng ${prevWord}` : `Chi ${pct > 0 ? 'nhiều' : 'ít'} hơn ${prevWord} <b>${Math.abs(pct)}%</b> (${money(pchi)})`;
  } else if (chi > 0) cmp = `${cap(prevWord)} chưa có khoản chi để so sánh`;

  // biểu đồ theo ngày
  let chart = '';
  if (S.view !== 'day') {
    const days = daysBetween(s, e);
    const vals = days.map((d) => { const k = ymd(d); return list.reduce((x, tx) => x + (tx.k === 'chi' && tx.d === k ? tx.a : 0), 0); });
    const counted = isNow ? Math.round((t - s) / 864e5) + 1 : days.length;
    const avg = chi > 0 ? chi / counted : 0;
    chart = `<section class="card chart"><div class="card-head"><h3>Chi tiêu theo ngày</h3><p>${avg ? `Trung bình ${money(avg)}/ngày` : 'Chưa có khoản chi'}</p></div>${chartSVG(days, vals, avg)}<p class="pct" style="text-align:left">Chạm vào một cột để xem chi tiết ngày đó.</p></section>`;
  }

  // thống kê theo danh mục
  const by = {};
  list.filter((x) => x.k === S.bk).forEach((x) => (by[x.cat] = (by[x.cat] || 0) + x.a));
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]);
  const bTotal = S.bk === 'chi' ? chi : thu;
  const stats = `<section class="card" id="stats"><div class="card-head"><h3>Thống kê ${WORD[S.view]}</h3>
    <div class="mini-seg"><button data-act="bk" data-k="chi" aria-pressed="${S.bk === 'chi'}">Chi</button><button data-act="bk" data-k="thu" aria-pressed="${S.bk === 'thu'}">Thu</button></div></div>
    <div class="donut-wrap">${donutSVG(rows, bTotal || 1)}<div class="donut-mid"><div><small>Tổng ${S.bk}</small><b>${short(bTotal)}</b><small>${rows.length} danh mục</small></div></div></div>
    ${rows.length ? `<div class="bubbles">${rows.slice(0, 3).map(([c, v]) => `<div class="bubble" style="--cc:${ccVar(c)}"><span class="ci">${catIcon(c, 28, '.bubble')}</span><b>${short(v)}</b>${esc(CAT_NAME[c] || c)}</div>`).join('')}</div>
      <div class="cats-list">${rows.map(([c, v]) => `<div class="cat-row" style="--cc:${ccVar(c)}"><span class="ci">${catIcon(c, 24, '.cat-row')}</span><div class="cat-main"><div class="cat-top"><span>${esc(CAT_NAME[c] || c)}</span><b>${money(v)}</b></div><div class="track"><i style="width:${Math.max(2, (v / bTotal) * 100).toFixed(1)}%"></i></div></div><span class="pct">${Math.round((v / bTotal) * 100)}%</span></div>`).join('')}</div>`
      : `<p class="pct" style="text-align:center">Chưa có khoản ${S.bk} nào ${WORD[S.view]}.</p>`}</section>`;

  // sổ ghi
  const sorted = list.slice().sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : (b.ts || 0) - (a.ts || 0)));
  let ledger = '';
  if (S.loading && !sorted.length) ledger = `<div class="skel"></div><div class="skel" style="width:80%"></div><div class="skel" style="width:60%"></div>`;
  else if (!sorted.length) ledger = `<div class="empty">${li('book', { size: 48, trigger: 'loop', delay: 2500 })}<div><b>Chưa có khoản nào ${WORD[S.view]}.</b><br>Bấm nút <b>+</b> để ghi khoản đầu tiên.</div></div>`;
  else {
    let cur = '';
    for (const x of sorted) {
      if (x.d !== cur) {
        cur = x.d; const dd = parse(cur); const dl = sorted.filter((y) => y.d === cur);
        const dn = total(dl, 'thu') - total(dl, 'chi');
        ledger += `<div class="day-head"><span>${WD[dd.getDay()]}, ${dm(dd)}</span><span class="num ${dn >= 0 ? 'amt-in' : 'amt-out'}">${dn >= 0 ? '+' : MINUS}${money(Math.abs(dn))}</span></div>`;
      }
      ledger += `<button class="tx" data-act="edit" data-id="${esc(x.id)}" style="--cc:${ccVar(x.cat)}"><span class="ci">${catIcon(x.cat, 24, '.tx')}</span><span class="tx-main"><span class="tx-cat">${esc(CAT_NAME[x.cat] || x.cat)}</span>${x.note ? `<span class="tx-note">${esc(x.note)}</span>` : ''}</span><span class="tx-amt ${x.k === 'thu' ? 'in' : 'out'}">${signed(x)}</span></button>`;
    }
  }

  const alerts = remindLines(today()).length;
  const name = S.demo ? 'bạn' : (S.profile && S.profile.name) || (vault && vault.user) || 'bạn';
  app.innerHTML = `<div class="shell">
    <aside class="rail" aria-label="Menu">
      <div class="logo">${li('coins', { size: 30, trigger: 'loop', delay: 3000, primary: '#04201d', secondary: '#04201d' })}</div>
      <nav class="rail-nav">${NAV.map(([id, ic, lb], i) => `<button data-act="go" data-t="${id}" class="${(S.nav || 'top') === id ? 'on' : ''}" title="${lb}" aria-label="${lb}">${li(ic, { size: 26, target: 'button', secondary: (S.nav || 'top') === id ? '#36d6c4' : '#8ea8a5', primary: (S.nav || 'top') === id ? '#e7f3f1' : '#8ea8a5' })}<span>${lb}</span></button>${i === 1 ? '' : ''}`).join('')}</nav>
      <button class="rail-add" data-act="add" title="Thêm khoản" aria-label="Thêm khoản">${li('plus', { size: 30, target: 'button', primary: '#e7f3f1', secondary: '#36d6c4' })}</button>
    </aside>
    <main class="main" id="top">
      <header class="top">
        <div><p class="hello">Chào buổi ${partOfDay()}, <b>${esc(name)}</b></p><p class="sub-hello">${WD[t.getDay()]}, ${dm(t)}/${t.getFullYear()}${S.demo ? ' · đang xem dữ liệu mẫu' : ''}</p></div>
        <div class="top-actions">
          <button class="round" data-act="go" data-t="budgets" aria-label="Nhắc nhở hạn mức">${li('bell', { size: 24, target: 'button', secondary: alerts ? '#ff8b7b' : '#36d6c4' })}${alerts ? `<span class="badge">${alerts}</span>` : ''}</button>
          <button class="round" data-act="lock" aria-label="${S.demo ? 'Thoát xem thử' : 'Đăng xuất'}" title="${S.demo ? 'Thoát xem thử' : 'Đăng xuất'}">${li('exit', { size: 24, target: 'button' })}</button>
          <button class="avatar shine" data-act="profile" aria-label="Hồ sơ: đổi tên, ảnh đại diện" title="Hồ sơ">${avatarInner(S.profile, name)}</button>
        </div>
      </header>
      ${S.demo ? `<div class="demo-bar"><b>Dữ liệu mẫu.</b> Không lưu lại, chỉ để xem thử cách dùng.</div>` : ''}
      ${S.loadErr ? `<div class="note">${esc(S.loadErr)}</div>` : ''}
      ${remindBanner()}
      <div class="controls">
        <nav class="seg" aria-label="Xem theo">${[['day', 'Ngày'], ['week', 'Tuần'], ['month', 'Tháng']].map(([v, l]) => `<button data-act="view" data-v="${v}" aria-pressed="${S.view === v}">${l}</button>`).join('')}</nav>
        <div class="period"><button class="nav" data-act="shift" data-dir="-1" aria-label="Kỳ trước">${UI.prev}</button>
          <div class="period-mid"><h2>${h2}</h2><p>${esc(sub)}${isNow ? '' : ` · <button class="today-btn" data-act="today">Về hôm nay</button>`}</p></div>
          <button class="nav" data-act="shift" data-dir="1" aria-label="Kỳ sau">${UI.next}</button></div>
      </div>
      <div class="grid">
        <div class="col">
          <div class="hero-row">
            <section class="hero" aria-label="Tổng kết">
              <span class="sheen" aria-hidden="true"></span>
              <div class="hero-art">${li('coins', { size: 104, trigger: 'loop', delay: 1800, primary: '#e7f3f1', secondary: '#3be0cb' })}</div>
              <span class="pill">${li('calendar', { size: 16, trigger: 'loop', delay: 4000, primary: '#0c2a2b', secondary: '#1c9db7' })}${esc(h2)}</span>
              <div class="hero-label">Còn lại ${WORD[S.view]}</div>
              <div class="hero-num">${net < 0 ? MINUS : ''}${NF.format(Math.abs(net))}<small>₫</small></div>
              <div class="hero-chips"><div class="hero-chip in"><span><i class="dot"></i>Tổng thu</span><b>${money(thu)}</b></div><div class="hero-chip out"><span><i class="dot"></i>Tổng chi</span><b>${money(chi)}</b></div></div>
              ${cmp ? `<div class="hero-cmp">${cmp}</div>` : ''}
            </section>
            ${budgetCard()}
          </div>
          ${chart}
          <section class="card" id="ledger"><div class="card-head"><h3>Các khoản ${WORD[S.view]}</h3><p>${sorted.length} khoản</p></div><div class="ledger">${ledger}</div></section>
        </div>
        <div class="col">
          ${stats}
          ${catsCard()}
          ${S.demo ? '' : securityCard()}
        </div>
      </div>
      <p class="credit">Icon động: <a href="https://lordicon.com/" target="_blank" rel="noopener">Lordicon.com</a></p>
    </main>
  </div>`;
  syncWelcome(name);
}

// ---------- hạn mức chi tiêu + nhắc nhở ----------
const PER_WORD = { day: 'ngày', week: 'tuần', month: 'tháng' };
const cap = (s) => s[0].toUpperCase() + s.slice(1);
function budgetStatus(b, anchor) {
  const [s, e] = rangeOf(b.per, anchor); const a = ymd(s), z = ymd(e);
  let spent = 0;
  for (const t of S.tx.values()) if (t.k === 'chi' && t.cat === b.cat && t.d >= a && t.d <= z) spent += t.a;
  const pct = b.amt ? spent / b.amt : 0;
  return { spent, pct, left: b.amt - spent, level: pct >= 1 ? 'over' : pct >= 0.8 ? 'warn' : 'ok' };
}
const budgetsSorted = () => [...(S.bg || new Map()).values()].sort((x, y) => (x.ts || 0) - (y.ts || 0));
function remindLines(anchor) {
  return budgetsSorted().map((b) => ({ b, st: budgetStatus(b, anchor) })).filter((x) => x.st.level !== 'ok');
}
function remindBanner() {
  const items = remindLines(today());
  if (!items.length) return '';
  const over = items.some((x) => x.st.level === 'over');
  return `<div class="remind lv-${over ? 'over' : 'warn'}" role="status">${li('bell', { size: 30, trigger: 'loop', delay: 2500, secondary: over ? '#ff8b7b' : '#f2c46b' })}<div><b>Nhắc nhở hạn mức</b><ul>${items.map(({ b, st }) => `<li>${esc(CAT_NAME[b.cat] || b.cat)}: ${st.level === 'over'
    ? `đã chi ${money(st.spent)}, <b>vượt ${money(-st.left)}</b> hạn mức ${PER_WORD[b.per]} này`
    : `đã dùng ${Math.round(st.pct * 100)}% hạn mức ${PER_WORD[b.per]} này, còn ${money(st.left)}`}</li>`).join('')}</ul></div></div>`;
}
function budgetForm() {
  const p = S.bpanel;
  return `<form id="budgetForm" class="stack" novalidate>
    <div class="field">Danh mục<div class="pick">${CATS.chi.map(([id, name]) => `<button type="button" data-act="bcat" data-c="${id}" aria-pressed="${p.cat === id}" style="--cc:${ccVar(id)}"><span class="ci">${ICON[id]}</span>${name}</button>`).join('')}</div></div>
    <label class="field">Chi tối đa (đồng)<input id="bAmt" inputmode="numeric" value="${p.amt ? NF.format(p.amt) : ''}" placeholder="VD: 1.000.000"></label>
    <div class="field">Tính theo<div class="mini-seg" style="align-self:flex-start">${['day', 'week', 'month'].map((v) => `<button type="button" data-act="bper" data-v="${v}" aria-pressed="${p.per === v}">${cap(PER_WORD[v])}</button>`).join('')}</div></div>
    ${S.bErr ? `<p class="err">${esc(S.bErr)}</p>` : ''}
    <div class="actions">${p.id ? `<button type="button" class="btn ghost danger${p.armed ? ' armed' : ''}" data-act="bdel">${p.armed ? 'Bấm lần nữa để xóa' : 'Xóa'}</button>` : ''}<button type="button" class="btn ghost" data-act="bcancel">Hủy</button><button type="submit" class="btn primary">Lưu hạn mức</button></div>
  </form>`;
}
function budgetCard() {
  const list = budgetsSorted();
  let body;
  if (S.bpanel) body = budgetForm();
  else if (!list.length) body = `<p class="pct" style="text-align:left">Chưa có hạn mức nào. Đặt hạn mức để được nhắc khi sắp chi quá tay.</p>`;
  else body = `<div class="bg-list">${list.map((b) => {
    const st = budgetStatus(b, S.anchor);
    return `<button class="bg-row lv-${st.level}" data-act="bedit" data-id="${esc(b.id)}" style="--cc:${ccVar(b.cat)}"><span class="ci">${catIcon(b.cat, 26, '.bg-row')}</span><span class="cat-main"><span class="cat-top"><span>${esc(CAT_NAME[b.cat] || b.cat)}</span><b>${short(st.spent)} / ${short(b.amt)}</b></span><span class="track"><i style="width:${Math.min(100, st.pct * 100).toFixed(1)}%"></i></span><span class="bg-note">${st.level === 'over' ? `Vượt ${money(-st.left)}` : `Còn ${money(st.left)}`} · ${Math.round(st.pct * 100)}% · theo ${PER_WORD[b.per]}</span></span></button>`;
  }).join('')}</div><p class="pct" style="text-align:left">Chạm vào một hạn mức để sửa hoặc xóa. Nhắc khi chi tới 80%.</p>`;
  return `<section class="card" id="budgets"><div class="card-head"><h3>${S.bpanel ? (S.bpanel.id ? 'Sửa hạn mức' : 'Thêm hạn mức') : 'Hạn mức chi tiêu'}</h3>${S.bpanel ? '' : `<button class="mini-add" data-act="badd">+ Thêm hạn mức</button>`}</div>${body}</section>`;
}
async function saveBudget() {
  const p = S.bpanel;
  p.amt = Number(digits(($('#bAmt') || {}).value || '') || 0);
  if (!p.amt) { S.bErr = 'Nhập số tiền tối đa lớn hơn 0.'; return render(); }
  const dup = budgetsSorted().find((b) => b.cat === p.cat && b.per === p.per && b.id !== p.id);
  if (dup) { S.bErr = `Đã có hạn mức ${CAT_NAME[p.cat]} theo ${PER_WORD[p.per]}. Chạm vào nó để sửa.`; return render(); }
  const obj = { cat: p.cat, amt: p.amt, per: p.per, ts: p.ts || Date.now() };
  try {
    let id = p.id;
    if (S.demo) id = id || 'b' + Date.now();
    else { const ref = id ? bgCol.doc(id) : bgCol.doc(); id = ref.id; await ref.set(await seal(S.key, obj)); }
    S.bg.set(id, { ...obj, id });
    S.bpanel = null; S.bErr = ''; render();
  } catch (e) { S.bErr = errText(e); render(); }
}
let toastT;
function showToast(msg, level) {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast lv-' + level; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 5000);
}

// ---------- lời chào mỗi lần vào sổ ----------
function welcomeHTML(name) {
  const tk = ymd(today());
  const chiToday = [...S.tx.values()].reduce((x, t) => x + (t.k === 'chi' && t.d === tk ? t.a : 0), 0);
  const warn = remindLines(today());
  const line = chiToday
    ? `Hôm nay bạn đã chi <b>${money(chiToday)}</b>.`
    : 'Hôm nay bạn chưa chi đồng nào. Giữ vững nhé!';
  const extra = warn.length
    ? `<p class="w-warn">${li('bell', { size: 20, trigger: 'loop', delay: 1500, secondary: '#f2c46b' })}${warn.length} hạn mức đang sắp chạm hoặc đã vượt.</p>`
    : '';
  return `<div class="welcome-scrim" data-act="wclose"><div class="welcome shine-box" role="dialog" aria-modal="true" aria-labelledby="wTitle" data-stop="1">
    <span class="sheen" aria-hidden="true"></span>
    <span class="avatar big">${avatarInner(S.profile, name)}</span>
    <h2 id="wTitle">${esc(name)} ơi, hôm nay đã tiết kiệm chưa?</h2>
    <p>${line}</p>${extra}
    <div class="actions" style="width:100%"><button class="btn ghost" data-act="wclose">Vào sổ</button><button class="btn primary" data-act="wadd">${li('plus', { size: 20, target: 'button', primary: '#04201d', secondary: '#04201d' })}Ghi khoản</button></div>
  </div></div>`;
}

// Giữ khung chào cố định, chỉ cập nhật nội dung để hiệu ứng mở không chạy lại mỗi lần vẽ lại
function syncWelcome(name) {
  const host = $('#welcomeHost');
  if (!host) return;
  if (!S.welcome || S.gate !== 'app') { host.innerHTML = ''; return; }
  const tmp = document.createElement('div'); tmp.innerHTML = welcomeHTML(name);
  const cur = host.querySelector('.welcome'), nw = tmp.querySelector('.welcome');
  if (!cur) { host.replaceChildren(tmp.firstElementChild); host.dataset.sig = nw.textContent; return; }
  if (host.dataset.sig !== nw.textContent || !!cur.querySelector('img') !== !!nw.querySelector('img')) { cur.innerHTML = nw.innerHTML; host.dataset.sig = nw.textContent; }
}

// ---------- quản lý danh mục ----------
function catsCard() {
  if (S.cpanel) return `<section class="card" id="cats"><div class="card-head"><h3>${S.cpanel.id ? 'Sửa danh mục' : 'Thêm danh mục'}</h3></div>${catForm()}</section>`;
  const k = S.ck || 'chi';
  const list = CAT_LIST.filter((c) => c.k === k && !c.del);
  return `<section class="card" id="cats"><div class="card-head"><h3>Danh mục</h3>
    <div class="mini-seg"><button data-act="ck" data-k="chi" aria-pressed="${k === 'chi'}">Chi</button><button data-act="ck" data-k="thu" aria-pressed="${k === 'thu'}">Thu</button></div></div>
    <div class="chip-grid">${list.map((c) => `<button class="cat-chip" data-act="cedit" data-id="${esc(c.id)}" style="--cc:${esc(c.color)}"><span class="ci">${catIcon(c.id, 22, '.cat-chip')}</span><span>${esc(c.name)}</span></button>`).join('')}
      <button class="cat-chip add" data-act="cadd"><span class="ci" style="--cc:#36d6c4">${li('plus', { size: 22, target: '.cat-chip' })}</span><span>Thêm</span></button></div>
    <p class="pct" style="text-align:left">Chạm vào một danh mục để đổi tên, icon, màu hoặc xóa.</p></section>`;
}
function catForm() {
  const p = S.cpanel;
  return `<form id="catForm" class="stack" novalidate>
    <label class="field">Tên danh mục<input id="cName" maxlength="24" value="${esc(p.name || '')}" placeholder="VD: Cà phê"></label>
    ${p.id ? '' : `<div class="field">Loại<div class="mini-seg" style="align-self:flex-start"><button type="button" data-act="ckind" data-k="chi" aria-pressed="${p.k === 'chi'}">Khoản chi</button><button type="button" data-act="ckind" data-k="thu" aria-pressed="${p.k === 'thu'}">Khoản thu</button></div></div>`}
    <div class="field">Icon<div class="icon-grid">${ICON_SET.map((key) => `<button type="button" data-act="cicon" data-v="${key}" aria-pressed="${p.icon === key}" aria-label="Chọn icon">${li(key, { size: 26, target: 'button', secondary: p.color })}</button>`).join('')}</div></div>
    <div class="field">Màu<div class="swatches">${COLOR_SET.map((c) => `<button type="button" data-act="ccolor" data-v="${c}" aria-pressed="${p.color === c}" style="background:${c}" aria-label="Chọn màu"></button>`).join('')}</div></div>
    ${S.cErr ? `<p class="err">${esc(S.cErr)}</p>` : ''}
    <div class="actions">${p.id ? `<button type="button" class="btn ghost danger${p.armed ? ' armed' : ''}" data-act="cdel">${p.armed ? 'Bấm lần nữa để xóa' : 'Xóa'}</button>` : ''}<button type="button" class="btn ghost" data-act="ccancel">Hủy</button><button type="submit" class="btn primary">Lưu danh mục</button></div>
    ${p.id ? '<p class="pct" style="text-align:left">Xóa danh mục không xóa các khoản đã ghi, chúng vẫn hiện tên cũ.</p>' : ''}
  </form>`;
}
async function writeCats(list) {
  await saveCfg('cats', { list });
  applyCats(list); S.cpanel = null; S.cErr = ''; render();
}
async function saveCat() {
  const p = S.cpanel;
  p.name = (($('#cName') || {}).value || '').trim();
  if (!p.name) { S.cErr = 'Nhập tên danh mục.'; return render(); }
  if (CAT_LIST.some((c) => !c.del && c.k === p.k && c.id !== p.id && c.name.toLowerCase() === p.name.toLowerCase())) { S.cErr = 'Đã có danh mục tên này.'; return render(); }
  const list = CAT_LIST.map((c) => ({ ...c }));
  if (p.id) Object.assign(list.find((x) => x.id === p.id), { name: p.name, icon: p.icon, color: p.color });
  else list.push({ id: 'c' + Date.now().toString(36), k: p.k, name: p.name, icon: p.icon, color: p.color });
  try { await writeCats(list); } catch (e) { S.cErr = errText(e); render(); }
}
async function deleteCat() {
  const p = S.cpanel;
  if (CAT_LIST.filter((c) => c.k === p.k && !c.del).length <= 1) { S.cErr = 'Phải giữ lại ít nhất một danh mục.'; return render(); }
  const list = CAT_LIST.map((c) => (c.id === p.id ? { ...c, del: true } : { ...c }));
  try { await writeCats(list); } catch (e) { S.cErr = errText(e); render(); }
}

// ---------- hồ sơ: tên hiển thị + ảnh đại diện ----------
const safeImg = (s) => (typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) ? s : '');
function avatarInner(p, fallback) {
  const src = safeImg(p && p.avatar);
  return src ? `<img src="${src}" alt="">` : esc(((p && p.name) || fallback || 'S').trim()[0] || 'S');
}
async function shrinkImage(file) {
  if (!/^image\//.test(file.type)) throw new Error('Chọn một file ảnh (JPG, PNG…).');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    const s = Math.min(img.naturalWidth, img.naturalHeight), c = document.createElement('canvas');
    c.width = c.height = 192;
    c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, 192, 192);
    return c.toDataURL('image/jpeg', 0.85);
  } finally { URL.revokeObjectURL(url); }
}
function profilePanel() {
  const d = S.profDraft || {};
  return `<div class="prof"><span class="avatar big">${avatarInner(d, vault && vault.user)}</span>
      <div class="actions"><label class="btn ghost" for="avatarFile">Chọn ảnh</label>${d.avatar ? '<button class="btn ghost" data-act="avdel">Bỏ ảnh</button>' : ''}</div></div>
    <input type="file" id="avatarFile" accept="image/*" hidden>
    <form id="profForm" class="stack" novalidate>
      <label class="field">Tên hiển thị<input id="pName" maxlength="30" value="${esc(d.name || '')}" placeholder="${esc(vault && vault.user || '')}"></label>
      ${S.panelErr ? `<p class="err">${esc(S.panelErr)}</p>` : ''}
      <div class="actions"><button type="button" class="btn ghost" data-act="panel" data-p="">Hủy</button><button type="submit" class="btn primary">Lưu hồ sơ</button></div>
    </form>
    <p class="pct" style="text-align:left">Ảnh được thu nhỏ, mã hóa và chỉ lưu trong máy này. Tên đăng nhập vẫn là <b>${esc(vault && vault.user || '')}</b>.</p>`;
}

function securityCard() {
  let body;
  if (S.panel === 'pin') body = `
    <form id="panelForm" data-kind="changepin" class="stack">
      <input type="text" autocomplete="username" value="${esc(vault && vault.user || '')}" hidden>
      <label class="field">Mật khẩu mới (ít nhất ${MIN_PASS} ký tự)<input id="np1" type="password" autocomplete="new-password" maxlength="64"></label>
      <label class="field">Nhập lại mật khẩu mới<input id="np2" type="password" autocomplete="new-password" maxlength="64"></label>
      ${S.panelErr ? `<p class="err">${esc(S.panelErr)}</p>` : ''}
      <div class="actions"><button type="button" class="btn ghost" data-act="panel" data-p="">Hủy</button><button type="submit" class="btn primary" ${S.busy ? 'disabled' : ''}>${S.busy ? 'Đang lưu…' : 'Lưu mật khẩu mới'}</button></div>
    </form>`;
  else if (S.panel === 'code') body = `
    <p class="pct" style="text-align:left">Dùng mã này khi quên mật khẩu. Đừng gửi cho người khác.</p>
    <div class="code">${esc(S.shownCode)}</div>
    <div class="actions"><button class="btn ghost" style="flex:1" data-act="copycode" data-code="${esc(S.shownCode)}">Chép mã</button><button class="btn ghost" style="flex:1" data-act="panel" data-p="">Ẩn mã</button></div>`;
  else if (S.panel === 'import') body = `
    <p class="pct" style="text-align:left">Nhập file sẽ <b>thay toàn bộ</b> dữ liệu đang có trên máy này bằng dữ liệu trong file. Sau đó đăng nhập bằng tài khoản của sổ trong file.</p>
    ${S.panelErr ? `<p class="err">${esc(S.panelErr)}</p>` : ''}
    <div class="actions"><button class="btn ghost" data-act="panel" data-p="">Hủy</button><label class="btn primary" for="importFile">Chọn file sao lưu</label></div>
    <input type="file" id="importFile" accept=".json,application/json" hidden>`;
  else if (S.panel === 'profile') body = profilePanel();
  else if (S.panel === 'snaps') body = `
    <p class="pct" style="text-align:left">Bản tự lưu trong máy, mỗi ngày một bản, giữ ${SNAP_KEEP} ngày. Khôi phục sẽ đưa sổ về đúng lúc đó (các khoản ghi sau đó sẽ mất), rồi đăng nhập lại.</p>
    ${S.panelErr ? `<p class="err">${esc(S.panelErr)}</p>` : ''}
    <div class="ledger">${(S.snaps || []).length ? S.snaps.map((s) => { const d = new Date(s.at); return `<div class="tx" style="cursor:default"><span class="ci" style="--cc:var(--accent)">${li('cloud', { size: 22, target: '.tx' })}</span><span class="tx-main"><span class="tx-cat">${WD[d.getDay()]}, ${dm(d)}/${d.getFullYear()}</span><span class="tx-note">Lưu lúc ${pad(d.getHours())}:${pad(d.getMinutes())} · ${Math.max(0, s.n - 1)} mục</span></span><button class="btn ghost${S.snapArm === s.day ? ' danger armed' : ''}" data-act="snaprestore" data-day="${s.day}">${S.snapArm === s.day ? 'Bấm lần nữa' : 'Khôi phục'}</button></div>`; }).join('') : '<p class="pct" style="text-align:left">Chưa có bản tự lưu nào.</p>'}</div>
    <div class="actions"><button class="btn ghost" data-act="panel" data-p="">Đóng</button></div>`;
  else {
    let lb = 0; try { lb = Number(localStorage.getItem('gc.lastBackup')) || 0; } catch {}
    const days = lb ? Math.floor((Date.now() - lb) / 864e5) : null;
    body = `
    ${S.panelMsg ? `<p class="ok">${esc(S.panelMsg)}</p>` : ''}
    <p class="pct" style="text-align:left">Tên đăng nhập: <b>${esc(vault && vault.user || '')}</b>. Dữ liệu chỉ nằm trong máy này, đã mã hóa.</p>
    <p class="pct" style="text-align:left"><b>Tự động sao lưu:</b> mỗi lần thay đổi, trang tự giữ bản sao trong máy (${SNAP_KEEP} ngày). Quá 7 ngày chưa có file sao lưu thì lúc đăng nhập trang tự tải file về. File sao lưu gần nhất: ${lb ? (days === 0 ? 'hôm nay' : days + ' ngày trước') : '<b>chưa có</b>'}. Hãy cất file lên Drive riêng để phòng mất máy.</p>
    <div class="grid2">
      <button class="btn ghost" data-act="profile">Đổi tên, ảnh đại diện</button>
      <button class="btn ghost" data-act="backup">Sao lưu ra file ngay</button>
      <button class="btn ghost" data-act="snaps">Bản tự lưu (${SNAP_KEEP} ngày)</button>
      <button class="btn ghost" data-act="panel" data-p="import">Nhập file sao lưu</button>
      ${vault && vault.v === 2 && S.raw ? `<button class="btn ghost" data-act="panel" data-p="pin">Đổi mật khẩu</button><button class="btn ghost" data-act="showcode">Xem mã khôi phục</button>` : ''}
    </div>`;
  }
  return `<section class="card" id="security"><div class="card-head"><h3>${S.panel === 'profile' ? 'Hồ sơ' : 'Tài khoản & sao lưu'}</h3><p>Tự khóa khi rời trang 3 phút hoặc để yên 10 phút</p></div>${body}</section>`;
}

// ---------- form thêm / sửa ----------
const F = { id: null, k: 'chi', cat: 'an', ts: 0 };
const fAmt = $('#fAmt'), fNote = $('#fNote'), fDate = $('#fDate'), fErr = $('#fErr'), fDel = $('#fDel'), fSave = $('#fSave');
const digits = (s) => String(s).replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 13);
const setAmt = (n) => { fAmt.value = n ? NF.format(n) : ''; };
const getAmt = () => Number(digits(fAmt.value) || 0);
function paintForm() {
  $('#kChi').setAttribute('aria-pressed', F.k === 'chi');
  $('#kThu').setAttribute('aria-pressed', F.k === 'thu');
  $('#fCats').innerHTML = CATS[F.k].map(([id, name]) => `<button type="button" data-act="cat" data-c="${id}" aria-pressed="${F.cat === id}" style="--cc:${ccVar(id)}"><span class="ci">${ICON[id]}</span>${name}</button>`).join('');
  fSave.textContent = F.id ? 'Lưu thay đổi' : F.k === 'chi' ? 'Lưu khoản chi' : 'Lưu khoản thu';
}
function openSheet(tx) {
  F.id = tx ? tx.id : null; F.k = tx ? tx.k : 'chi'; F.cat = tx ? tx.cat : (CATS.chi[0] || ['khac'])[0]; F.ts = tx ? tx.ts : 0;
  setAmt(tx ? tx.a : 0); fNote.value = tx ? tx.note || '' : '';
  fDate.value = tx ? tx.d : ymd(S.view === 'day' ? S.anchor : today());
  $('#sheetTitle').textContent = tx ? 'Sửa khoản' : 'Thêm khoản';
  fDel.hidden = !tx; fDel.classList.remove('armed'); fDel.textContent = 'Xóa';
  fErr.hidden = true; fSave.disabled = false;
  paintForm();
  $('#scrim').hidden = false; $('#sheet').hidden = false;
  if (!tx) setTimeout(() => fAmt.focus(), 60);
}
function closeSheet() { $('#scrim').hidden = true; $('#sheet').hidden = true; }
function showErr(m) { fErr.textContent = m; fErr.hidden = false; }

fAmt.addEventListener('input', () => setAmt(getAmt()));
document.addEventListener('input', (ev) => {
  if (ev.target.id === 'bAmt') { const n = Number(digits(ev.target.value) || 0); ev.target.value = n ? NF.format(n) : ''; }
});
$('#sheet').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const a = getAmt();
  if (!a) return showErr('Nhập số tiền lớn hơn 0.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fDate.value)) return showErr('Chọn ngày cho khoản này.');
  const tx = { k: F.k, a, cat: F.cat, note: fNote.value.trim().slice(0, 80), d: fDate.value, ts: F.ts || Date.now() };
  fSave.disabled = true;
  try {
    if (S.demo) { const id = F.id || 'm' + Date.now(); S.tx.set(id, { ...tx, id }); }
    else {
      const ref = F.id ? txCol.doc(F.id) : txCol.doc();
      const box = await seal(S.key, tx);
      await retryOnce(() => ref.set(box));
      S.tx.set(ref.id, { ...tx, id: ref.id });
    }
    S.anchor = parse(tx.d);
    closeSheet(); render();
    if (tx.k === 'chi') {
      const hit = remindLines(parse(tx.d)).filter((x) => x.b.cat === tx.cat).sort((a, b) => b.st.pct - a.st.pct)[0];
      if (hit) {
        const nm = CAT_NAME[tx.cat], per = PER_WORD[hit.b.per];
        showToast(hit.st.level === 'over'
          ? `${nm}: đã vượt hạn mức ${per} ${money(-hit.st.left)}`
          : `${nm}: đã dùng ${Math.round(hit.st.pct * 100)}% hạn mức ${per}, còn ${money(hit.st.left)}`, hit.st.level);
      }
    }
  } catch (e) { showErr(errText(e)); fSave.disabled = false; }
});

// ---------- sự kiện ----------
document.addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'view') { S.view = b.dataset.v; try { localStorage.setItem('stc.view', S.view); } catch {} render(); }
  else if (act === 'shift') { S.anchor = shifted(S.view, S.anchor, Number(b.dataset.dir)); render(); }
  else if (act === 'today') { S.anchor = today(); render(); }
  else if (act === 'pickday') { S.anchor = parse(b.dataset.d); S.view = 'day'; render(); }
  else if (act === 'bk') { S.bk = b.dataset.k; render(); }
  else if (act === 'add') openSheet(null);
  else if (act === 'edit') { const tx = S.tx.get(b.dataset.id); if (tx) openSheet(tx); }
  else if (act === 'close') closeSheet();
  else if (act === 'kind') { F.k = b.dataset.k; F.cat = (CATS[F.k][0] || ['khac'])[0]; paintForm(); }
  else if (act === 'cat') { F.cat = b.dataset.c; paintForm(); }
  else if (act === 'q') {
    const v = b.dataset.v, cur = getAmt();
    if (v === 'clear') setAmt(0); else if (v === 'x1000') setAmt(cur ? cur * 1000 : 0); else setAmt(cur + Number(v));
  }
  else if (act === 'del') {
    if (!b.classList.contains('armed')) { b.classList.add('armed'); b.textContent = 'Bấm lần nữa để xóa'; return; }
    try {
      if (!S.demo) await retryOnce(() => txCol.doc(F.id).delete());
      S.tx.delete(F.id); closeSheet(); render();
    } catch (e) { showErr(errText(e)); }
  }
  else if (act === 'lock') lock();
  else if (act === 'demo') startDemo();
  else if (act === 'retry') boot();
  else if (act === 'forgot') { S.gate = 'forgot'; S.gateErr = ''; render(); }
  else if (act === 'wclose') { if (ev.target.closest('[data-stop]') && b.classList.contains('welcome-scrim')) return; S.welcome = false; render(); }
  else if (act === 'wadd') { S.welcome = false; render(); openSheet(null); }
  else if (act === 'ck') { S.ck = b.dataset.k; render(); }
  else if (act === 'cadd') { const k = S.ck || 'chi'; S.cpanel = { id: null, k, name: '', icon: ICON_SET[0], color: COLOR_SET[0] }; S.cErr = ''; render(); const c = $('#cats'); if (c) c.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  else if (act === 'cedit') { const c = CAT_LIST.find((x) => x.id === b.dataset.id); if (c) { S.cpanel = { ...c }; S.cErr = ''; render(); } }
  else if (['ckind', 'cicon', 'ccolor'].includes(act)) {
    S.cpanel.name = (($('#cName') || {}).value || S.cpanel.name || '');
    if (act === 'ckind') S.cpanel.k = b.dataset.k; else if (act === 'cicon') S.cpanel.icon = b.dataset.v; else S.cpanel.color = b.dataset.v;
    S.cpanel.armed = false; render();
  }
  else if (act === 'ccancel') { S.cpanel = null; S.cErr = ''; render(); }
  else if (act === 'cdel') {
    if (!S.cpanel.armed) { S.cpanel.name = (($('#cName') || {}).value || S.cpanel.name); S.cpanel.armed = true; return render(); }
    await deleteCat();
  }
  else if (act === 'profile') {
    if (S.demo) return;
    S.profDraft = { ...(S.profile || {}) }; S.panel = 'profile'; S.panelErr = ''; S.panelMsg = ''; S.nav = 'security'; render();
    const el = $('#security'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  else if (act === 'avdel') { S.profDraft.name = ($('#pName') || {}).value || ''; S.profDraft.avatar = ''; render(); }
  else if (act === 'snaps') { S.snaps = await listSnaps(); S.snapArm = ''; S.panel = 'snaps'; S.panelErr = ''; render(); }
  else if (act === 'snaprestore') {
    const day = b.dataset.day;
    if (S.snapArm !== day) { S.snapArm = day; return render(); }
    try { await restoreSnap(day); S.snapArm = ''; await afterImport(); S.gateNote = 'Đã khôi phục bản tự lưu. Đăng nhập lại để mở sổ.'; render(); }
    catch (e) { S.panelErr = e.message || 'Không khôi phục được.'; render(); }
  }
  else if (act === 'go') {
    S.nav = b.dataset.t; render();
    const el = document.getElementById(S.nav);
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  else if (act === 'badd') {
    const used = new Set(budgetsSorted().filter((x) => x.per === 'month').map((x) => x.cat));
    const free = CATS.chi.find(([id]) => !used.has(id));
    S.bpanel = { id: null, cat: free ? free[0] : (CATS.chi[0] || ['khac'])[0], amt: 0, per: 'month' }; S.bErr = ''; render();
    const c = $('#budgets'); if (c) c.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  else if (act === 'bedit') { const x = S.bg.get(b.dataset.id); if (x) { S.bpanel = { ...x }; S.bErr = ''; render(); } }
  else if (act === 'bcat' || act === 'bper') {
    S.bpanel.amt = Number(digits(($('#bAmt') || {}).value || '') || 0);
    if (act === 'bcat') S.bpanel.cat = b.dataset.c; else S.bpanel.per = b.dataset.v;
    S.bpanel.armed = false; render();
  }
  else if (act === 'bcancel') { S.bpanel = null; S.bErr = ''; render(); }
  else if (act === 'bdel') {
    if (!S.bpanel.armed) { S.bpanel.amt = Number(digits(($('#bAmt') || {}).value || '') || 0); S.bpanel.armed = true; return render(); }
    try { if (!S.demo) await bgCol.doc(S.bpanel.id).delete(); S.bg.delete(S.bpanel.id); S.bpanel = null; render(); }
    catch (e) { S.bErr = errText(e); render(); }
  }
  else if (act === 'backup') { exportBackup(); S.panelMsg = 'Đã tạo file sao lưu. Cất file ở nơi an toàn (Drive riêng, Zalo Cloud của bạn…).'; render(); }
  else if (act === 'wipeask') { S.gate = 'wipe'; S.gateErr = ''; render(); }
  else if (act === 'reccontinue') {
    const ok = $('#recOk');
    if (!ok || !ok.checked) { S.gateErr = 'Đánh dấu ô "Tôi đã lưu mã khôi phục" trước khi vào sổ.'; return render(); }
    const p = S.pending; S.pending = null; S.recCode = '';
    enterApp(p.key, p.raw);
  }
  else if (act === 'copycode') {
    const code = b.dataset.code;
    try { await navigator.clipboard.writeText(code); b.textContent = 'Đã chép mã'; }
    catch {
      const el = b.parentElement.querySelector('.code') || $('.code');
      if (el) { const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
      b.textContent = 'Đã bôi đen, hãy tự chép';
    }
  }
  else if (act === 'panel') { S.panel = b.dataset.p; S.panelErr = ''; S.panelMsg = ''; S.shownCode = ''; render(); }
  else if (act === 'showcode') {
    try { S.shownCode = (await unseal(S.key, vault.recBox)).code; S.panel = 'code'; } catch { S.panelMsg = 'Không đọc được mã khôi phục.'; }
    render();
  }
  else if (act === 'back') { S.gate = 'unlock'; S.gateErr = ''; render(); }
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && !$('#sheet').hidden) closeSheet();
  const h = ev.target.closest && ev.target.closest('.hit');
  if (h && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); h.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
});
document.addEventListener('submit', async (ev) => {
  const f = ev.target;
  if (f.id === 'budgetForm') { ev.preventDefault(); return saveBudget(); }
  if (f.id === 'catForm') { ev.preventDefault(); return saveCat(); }
  if (f.id === 'profForm') {
    ev.preventDefault();
    const prof = { name: (($('#pName') || {}).value || '').trim().slice(0, 30), avatar: safeImg(S.profDraft && S.profDraft.avatar) };
    try { await saveCfg('profile', prof); S.profile = prof; S.panel = ''; S.panelMsg = 'Đã lưu hồ sơ.'; S.profDraft = null; }
    catch (e) { S.panelErr = errText(e); }
    return render();
  }
  if (f.id === 'panelForm') {
    ev.preventDefault();
    const a = $('#np1').value, c = $('#np2').value;
    S.panelErr = '';
    if (a.length < MIN_PASS) { S.panelErr = `Mật khẩu cần ít nhất ${MIN_PASS} ký tự.`; return render(); }
    if (a !== c) { S.panelErr = 'Hai lần nhập mật khẩu không khớp.'; return render(); }
    S.busy = true; render();
    try { await changePin(a); S.panel = ''; S.panelMsg = 'Đã đổi mật khẩu. Lần sau đăng nhập dùng mật khẩu mới.'; }
    catch (e) { S.panelErr = errText(e); }
    S.busy = false; render();
    return;
  }
  if (f.id !== 'gateForm') return;
  ev.preventDefault();
  const p1 = ($('#pin1') || {}).value || '', p2 = ($('#pin2') || {}).value || '', un = ($('#uname') || {}).value || '';
  const kind = f.dataset.kind;
  S.gateErr = '';
  const locked = () => { const w = waitLeft(); if (w) { S.gateErr = failMsg('Tạm khóa do nhập sai nhiều lần.'); render(); return true; } return false; };
  if (kind === 'setup') {
    if (locked()) return;
    const act = ($('#actIn') || {}).value || '';
    if (!(await activationOk(act))) { noteFail(); await sleep(600); S.gateErr = failMsg('Mã kích hoạt không đúng.'); return render(); }
    if (normUser(un).length < 3) { S.gateErr = 'Tên đăng nhập cần ít nhất 3 ký tự.'; return render(); }
    if (p1.length < MIN_PASS) { S.gateErr = `Mật khẩu cần ít nhất ${MIN_PASS} ký tự.`; return render(); }
    if (normUser(p1) === normUser(un)) { S.gateErr = 'Mật khẩu không được trùng tên đăng nhập.'; return render(); }
    if (p1 !== p2) { S.gateErr = 'Hai lần nhập mật khẩu không khớp.'; return render(); }
    clearFail();
    S.busy = true; render();
    try { await createPin(p1, un); } catch (e) { S.gate = 'setup'; S.gateErr = errText(e); }
    S.busy = false; render();
  } else if (kind === 'unlock') {
    if (locked()) return;
    if (!p1 || !un) { S.gateErr = 'Nhập đủ tên đăng nhập và mật khẩu.'; return render(); }
    S.busy = true; render();
    const ok = await unlock(p1, un).catch(() => false);
    S.busy = false;
    if (ok) {
      clearFail(); scheduleSnap();
      if (autoFileBackup()) S.panelMsg = 'Đã tự tải file sao lưu tuần này về máy. Hãy cất file lên Drive riêng.';
    }
    else { noteFail(); await sleep(800); S.gateErr = failMsg('Tên đăng nhập hoặc mật khẩu chưa đúng.'); }
    render();
    if (!ok) { const i = $('#uname'); if (i) { i.value = un; $('#pin1').focus(); } }
  } else if (kind === 'recover') {
    if (locked()) return;
    const code = ($('#recIn') || {}).value || '';
    if (normCode(code).length !== 16) { S.gateErr = 'Mã khôi phục gồm 16 ký tự, dạng XXXX-XXXX-XXXX-XXXX.'; return render(); }
    if (p1.length < MIN_PASS) { S.gateErr = `Mật khẩu mới cần ít nhất ${MIN_PASS} ký tự.`; return render(); }
    if (p1 !== p2) { S.gateErr = 'Hai lần nhập mật khẩu mới không khớp.'; return render(); }
    S.busy = true; render();
    let ok = false;
    try { ok = await recover(code, p1); } catch (e) { S.gateErr = errText(e); }
    S.busy = false;
    if (ok) clearFail();
    else if (!S.gateErr) { noteFail(); await sleep(800); S.gateErr = failMsg('Mã khôi phục chưa đúng. Kiểm tra lại từng ký tự.'); }
    if (ok) S.panelMsg = `Đã đặt mật khẩu mới. Tên đăng nhập của bạn: ${vault.user || ''}`;
    render();
  } else if (kind === 'wipe') {
    if (p1.trim().toUpperCase() !== 'XOA') { S.gateErr = 'Gõ đúng chữ XOA để xác nhận.'; return render(); }
    S.busy = true; render();
    try { await wipe(); } catch (e) { S.gateErr = errText(e); }
    S.busy = false; render();
  }
});

// Tự khóa: rời trang quá 3 phút, hoặc để yên không chạm 10 phút
let hiddenAt = 0, lastAct = Date.now();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else if (S.gate === 'app' && !S.demo && hiddenAt && Date.now() - hiddenAt > 3 * 60 * 1000) lock();
});
for (const ev of ['pointerdown', 'keydown', 'scroll', 'touchstart']) addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true });
setInterval(() => { if (S.gate === 'app' && !S.demo && Date.now() - lastAct > 10 * 60 * 1000) lock(); }, 30000);
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (S.gate === 'app') render(); }, 150); });

document.addEventListener('change', async (ev) => {
  if (ev.target.id === 'avatarFile' && ev.target.files[0]) {
    try { S.profDraft.name = ($('#pName') || {}).value || ''; S.profDraft.avatar = await shrinkImage(ev.target.files[0]); S.panelErr = ''; }
    catch (e) { S.panelErr = e.message || 'Không đọc được ảnh này.'; }
    return render();
  }
  if (ev.target.id !== 'importFile' || !ev.target.files[0]) return;
  try { await importBackup(ev.target.files[0]); await afterImport(); }
  catch (e) {
    if (S.gate === 'app') { S.panelErr = e.message || 'Không nhập được file.'; } else { S.gateErr = e.message || 'Không nhập được file.'; }
    render();
  }
});

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
boot();
})();
