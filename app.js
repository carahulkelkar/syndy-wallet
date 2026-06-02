// ============================================================
// SYNDY WALLET — app.js  v13
// Model B: Checkpoint-based balance system
// SYNDY Governance | Rahul Kelkar (Sole Authority)
// ============================================================

const OPENING_DATE = '2026-06-01';

const ACCOUNTS = [
  { name: 'Cash',              type: 'Cash',        balance: 927      },
  { name: 'ICICI Savings',     type: 'Bank',        balance: 885.84   },
  { name: 'Kotak Savings',     type: 'Bank',        balance: 3.06     },
  { name: 'Kotak LAS OD',      type: 'Liability',   balance: -70110   },
  { name: 'Kotak Credit Card', type: 'Credit Card', balance: -15364   }
];

// ── CHECKPOINT MIGRATION GUARD ────────────────────────────────
// Wipes any checkpoint older than 2026-06 so the corrected
// June 1 opening balances above become the anchor.
(function migrateCheckpoints() {
  // V13: Wipe ALL checkpoints from before June 2026 so the correct
  // June 1st opening balances in ACCOUNTS become the clean anchor.
  // Any June-onwards checkpoints (created by Rahul) are preserved.
  try {
    const raw = localStorage.getItem('sw_checkpoints');
    if (!raw) return;
    const all = JSON.parse(raw);
    let changed = false;
    Object.keys(all).forEach(k => {
      if (k < '2026-06') { delete all[k]; changed = true; }
    });
    if (!changed) return;
    if (!Object.keys(all).length) {
      localStorage.removeItem('sw_checkpoints');
    } else {
      localStorage.setItem('sw_checkpoints', JSON.stringify(all));
    }
  } catch(e) {}
})();

const EXP_CATS = ['Food','Grocery','Housing','Utilities','Health','Personal','Lifestyle','Misc'];
const INC_SUBS = ['Salary','Professional Fees','Sav Int-Kotak','Sav Int-ICICI','Bond Interest'];

const CATEGORIES = {
  Expense: {
    Food:      ['BF-Maggie','BF-Milk','BF-Muselli','BF-Eggs','BF-Whey Protein','BF-Coffee','BF-Other','Lunch-Tiffin','Lunch-Outside','Snacks-Biscuits etc','Snacks-Outside','Dinner-Tiffin','Nonveg-Chicken','Nonveg-Mutton'],
    Grocery:   ['Rice Surti-Indra','Dal Toor-Moong','Oil Groundnut','Ghee Govardhan','Salt & Pepper etc','Sugar & Others','Thums Up','Shrikhand','Coconut Water','Amul Masti','Delivery charges','Fruits-Apple-Banana','Fruits-Others','Salads','Vegetables'],
    Housing:   ['Rent-Landlord','Rent Mojo','Snabbit','Phenol-Harpic','Washing Powder','Malad Pagdi','Ratnagiri Maintenance'],
    Utilities: ['Electricity','Gas','Internet','Postpaid Vi','Prepaid Jio','Ironing'],
    Health:    ['Medicines','Doctor','Tests'],
    Personal:  ['Clothings','Hair Oil','Deodorant','Face Cream-Powder','Tooth Paste-Brush','Blade-Foam','Rituals','Haircutting','System'],
    Lifestyle: ['Netflix','AI-Astra','ICAI fees','Entertainment','Travelling'],
    Misc:      ['Online Charges','Transport-Auto','Tobacco','Others']
  },
  Income: {
    Income: ['Rent-Prathana','Salary','Professional Fees','Sav Int-Kotak','Sav Int-ICICI','Bond Interest']
  }
};

// ── STORAGE ──────────────────────────────────────────────────
function loadTxns()       { try { return JSON.parse(localStorage.getItem('sw_txns') || '[]'); } catch { return []; } }
function saveTxns(d)      { localStorage.setItem('sw_txns', JSON.stringify(d)); }
function loadReminders()  { try { return JSON.parse(localStorage.getItem('sw_reminders') || '[]'); } catch { return []; } }
function saveReminders(d) { localStorage.setItem('sw_reminders', JSON.stringify(d)); }
function loadBudgets()    { try { return JSON.parse(localStorage.getItem('sw_budgets') || '{}'); } catch { return {}; } }
function saveBudgets(d)   { localStorage.setItem('sw_budgets', JSON.stringify(d)); }

// ── CHECKPOINT STORAGE ────────────────────────────────────────
// Schema: { "2026-05": { closedOn:"2026-06-01", balances:{Cash:X,...} }, ... }
function loadCheckpoints()    { try { return JSON.parse(localStorage.getItem('sw_checkpoints') || '{}'); } catch { return {}; } }
function saveCheckpoints(d)   { localStorage.setItem('sw_checkpoints', JSON.stringify(d)); }

// Returns the most recent checkpoint or null (falls back to hardcoded ACCOUNTS)
function getLatestCheckpoint() {
  const all    = loadCheckpoints();
  const months = Object.keys(all).sort();
  if (!months.length) return null;
  const key = months[months.length - 1];
  return { month: key, ...all[key] };
}

let txns      = loadTxns();
let reminders = loadReminders();

// ── HELPERS ───────────────────────────────────────────────────
// IST-aware using Intl — correct for all timezones including UTC+5:30
function istNow() {
  // Returns a Date object whose local methods reflect IST (Asia/Kolkata)
  const now = new Date();
  const istStr = now.toLocaleString('en-CA', { timeZone: 'Asia/Kolkata', hour12: false });
  // en-CA gives YYYY-MM-DD HH:mm:ss format
  return new Date(istStr.replace(',', ''));
}
function todayStr() {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
}
function currentMonth() {
  return todayStr().slice(0, 7);
}

function fmtAmt(n) {
  return '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits:0, maximumFractionDigits:0 });
}
function fmtAmtDec(n) {
  return '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
}
function monthLabel(ym) {
  return new Date(ym + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

// ── BALANCE ENGINE (MODEL B) ──────────────────────────────────
// LONG-TERM SAFETY GUARANTEE (verified V13):
//
// Priority order:
//   1. Most recent checkpoint  ← anchor (immune to transaction deletion)
//   2. Hardcoded ACCOUNTS      ← only used before first-ever checkpoint
//
// Transactions AFTER the checkpoint cutoff month are replayed on top.
// Transactions IN OR BEFORE the checkpoint month are ignored.
// → Deleting June transactions after a June checkpoint = SAFE
// → July / August / September balances = UNAFFECTED
// → Current balance = UNAFFECTED
//
// Workflow for Rahul:
//   End of month → Close Month (lock checkpoint) → Export CSV → Delete old txns
//   Next month's balances continue correctly from the locked checkpoint.
//
function calcBalances() {
  const cp = getLatestCheckpoint();

  let bal       = {};
  let replayFrom;

  if (cp) {
    // Use checkpoint as anchor
    ACCOUNTS.forEach(a => bal[a.name] = cp.balances[a.name] ?? a.balance);
    // Replay only transactions AFTER the checkpoint month
    // e.g. checkpoint = "2026-05" → replay date > "2026-05-31"
    const [y, m] = cp.month.split('-').map(Number);
    const cpLastDay = new Date(y, m, 0).getDate(); // last day of checkpoint month
    replayFrom = `${cp.month}-${String(cpLastDay).padStart(2,'0')}`;
    // strictly after: use > comparison
  } else {
    // No checkpoint — original behaviour, replay all from OPENING_DATE
    ACCOUNTS.forEach(a => bal[a.name] = a.balance);
    replayFrom = OPENING_DATE;
    // include OPENING_DATE itself
  }

  txns.forEach(t => {
    if (!t.date) return;
    // With checkpoint: replay only txns strictly after last day of checkpoint month
    // Without checkpoint: replay from OPENING_DATE inclusive
    const include = cp ? (t.date > replayFrom) : (t.date >= replayFrom);
    if (!include) return;

    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'Expense') {
      if (bal[t.fromAccount] !== undefined) bal[t.fromAccount] -= amt;
    } else if (t.type === 'Income') {
      if (bal[t.toAccount]   !== undefined) bal[t.toAccount]   += amt;
    } else if (t.type === 'Transfer') {
      if (bal[t.fromAccount] !== undefined) bal[t.fromAccount] -= amt;
      if (bal[t.toAccount]   !== undefined) bal[t.toAccount]   += amt;
    }
  });

  return bal;
}

// ── MONTH CLOSE / CHECKPOINT ──────────────────────────────────
// Called from the Entries page "Close Month" button.
// Computes CURRENT balances (which include all transactions to date),
// locks them as the checkpoint for the selected month, then saves.
// After this, ALL transactions in that month and prior can be safely
// deleted without affecting displayed balances.
function openCloseMonthModal() {
  const bal    = calcBalances();
  const cp     = getLatestCheckpoint();
  const allCps = loadCheckpoints();

  // Determine which month we are closing (defaults to previous month)
  const ist    = istNow();
  const prev   = new Date(ist.getFullYear(), ist.getMonth() - 1, 1);
  const suggestedMonth = prev.toISOString().slice(0, 7);

  // Build modal content
  const rows = ACCOUNTS.map(a => {
    const v = bal[a.name] ?? 0;
    const col = v < 0 ? 'var(--expense)' : 'var(--income)';
    return `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:13px">${a.name}</span>
      <span style="font-family:var(--mono);font-size:13px;font-weight:700;color:${col}">${v < 0 ? '-' : ''}${fmtAmtDec(v)}</span>
    </div>`;
  }).join('');

  // Existing checkpoints list
  const cpList = Object.keys(allCps).sort().reverse().map(k => {
    const c = allCps[k];
    return `<div style="font-size:11px;color:var(--text3);padding:3px 0">${monthLabel(k)} — closed on ${c.closedOn}</div>`;
  }).join('') || '<div style="font-size:11px;color:var(--text3)">None yet.</div>';

  document.getElementById('closeMonthModal').innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;max-width:380px;margin:0 auto">
      <div style="font-size:16px;font-weight:700;margin-bottom:4px">🔒 Close Month & Lock Balances</div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:14px">
        This creates a permanent balance checkpoint. After closing, you can safely delete
        transactions from that month for cleanup — current balances will not be affected.
      </div>

      <label class="form-label">Month to Close</label>
      <input id="closeMonthPicker" class="form-control" type="month" value="${suggestedMonth}" style="margin-bottom:14px" />

      <div style="font-size:12px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">
        Current Balances (will be locked as checkpoint)
      </div>
      ${rows}

      <div style="margin-top:14px;padding:10px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:8px;font-size:11px;color:#f87171">
        ⚠ Verify these balances match your real-world accounts before locking.
        A checkpoint cannot be undone without manual edit.
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">
        <button class="btn btn-secondary" onclick="closeCloseMonthModal()">Cancel</button>
        <button class="btn btn-primary" onclick="confirmCloseMonth()">🔒 Lock Checkpoint</button>
      </div>

      <div style="margin-top:16px">
        <div style="font-size:11px;color:var(--text2);text-transform:uppercase;margin-bottom:6px">Existing Checkpoints</div>
        ${cpList}
      </div>
    </div>`;

  document.getElementById('closeMonthOverlay').style.display = 'flex';
}

function closeCloseMonthModal() {
  document.getElementById('closeMonthOverlay').style.display = 'none';
}

function confirmCloseMonth() {
  const month = document.getElementById('closeMonthPicker').value;
  if (!month) { showToast('Select a month to close', 'error'); return; }

  const bal   = calcBalances();
  const today = todayStr();
  const all   = loadCheckpoints();

  // Build clean balance snapshot — only known accounts
  const snapshot = {};
  ACCOUNTS.forEach(a => snapshot[a.name] = bal[a.name] ?? a.balance);

  all[month] = { closedOn: today, balances: snapshot };
  saveCheckpoints(all);

  closeCloseMonthModal();
  showToast(`✓ ${monthLabel(month)} checkpoint locked`, 'success');
  renderDashboard();
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = 'toast ' + type; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

// ── CONFIRM ───────────────────────────────────────────────────
function showConfirm(msg, onYes) {
  document.getElementById('confirmMsg').textContent = msg;
  document.getElementById('confirmDialog').classList.add('open');
  document.getElementById('confirmYes').onclick = () => {
    document.getElementById('confirmDialog').classList.remove('open'); onYes();
  };
  document.getElementById('confirmNo').onclick = () =>
    document.getElementById('confirmDialog').classList.remove('open');
}

// ── NAVIGATION ────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.getElementById('nav-' + id).classList.add('active');
  if (id === 'dashboard') renderDashboard();
  if (id === 'add')       initAddPage();
  if (id === 'data')      renderTxnCards();
  if (id === 'reports')   renderReports();
  if (id === 'reminders') renderReminders();
  if (id === 'budget')    renderBudget();
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  const bal  = calcBalances();
  const cp   = getLatestCheckpoint();
  const grid = document.getElementById('accountsGrid');
  grid.innerHTML = '';

  // Liabilities first (OD, Credit Card), then Banks, then Cash
  const order = ['Kotak LAS OD','Kotak Credit Card','ICICI Savings','Kotak Savings','Cash'];
  order.forEach(name => {
    const acc = ACCOUNTS.find(a => a.name === name);
    if (!acc) return;
    const v   = bal[name] ?? 0;
    const isLiab = acc.type === 'Liability' || acc.type === 'Credit Card';
    const col    = isLiab ? 'var(--expense)' : name === 'Cash' ? '#f59e0b' : 'var(--income)';
    const badge  = isLiab ? 'Outstanding' : acc.type;
    const border = isLiab ? '1px solid rgba(248,113,113,0.25)' : '1px solid var(--border)';
    const bg     = isLiab ? 'rgba(248,113,113,0.06)' : 'var(--card)';
    const sign   = v < 0 ? '-' : '';
    const full   = name === 'Kotak LAS OD' || name === 'Kotak Credit Card';

    grid.innerHTML += `
      <div style="background:${bg};border:${border};border-radius:14px;padding:14px 18px;
                  ${full ? 'margin-bottom:10px' : 'display:inline-flex;flex-direction:column;justify-content:space-between;margin-bottom:10px;width:calc(50% - 5px);box-sizing:border-box'} ">
        <div>
          <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">${name}</div>
          <div style="font-size:11px;color:var(--text3)">${badge}</div>
        </div>
        <div style="font-family:var(--mono);font-size:${full?'22':'18'}px;font-weight:700;color:${col};${full?'text-align:right':'margin-top:8px'}">${sign}${fmtAmtDec(v)}</div>
      </div>`;
  });

  // Checkpoint badge
  if (cp) {
    grid.innerHTML += `<div style="font-size:10px;color:var(--text3);margin-top:-4px;margin-bottom:8px;padding:0 2px">
      🔒 Checkpoint: ${monthLabel(cp.month)} locked on ${cp.closedOn}</div>`;
  }

  document.getElementById('balanceDate').textContent = 'as on ' +
    istNow().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});

  const today = todayStr(), m = currentMonth();
  let todayExp=0, monthExp=0, monthInc=0;
  txns.forEach(t => {
    const a = parseFloat(t.amount)||0;
    if (t.type==='Expense') {
      if (t.date===today) todayExp+=a;
      if (t.date?.startsWith(m)) monthExp+=a;
    }
    if (t.type==='Income' && t.date?.startsWith(m)) monthInc+=a;
  });
  document.getElementById('statToday').textContent    = fmtAmtDec(todayExp);
  document.getElementById('statMonthExp').textContent = fmtAmtDec(monthExp);
  document.getElementById('statMonthInc').textContent = fmtAmtDec(monthInc);
  document.getElementById('statTotal').textContent    = txns.length;

  const recents = [...txns].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,15);
  const list = document.getElementById('recentList');
  list.innerHTML = recents.length === 0
    ? '<div class="empty-state"><div class="empty-icon">📭</div><p>No transactions yet. Tap + to add one.</p></div>'
    : recents.map(txnRowHTML).join('');

  checkReminders();
}

function txnRowHTML(t) {
  const icons = { Expense:'💸', Income:'💰', Transfer:'↔️' };
  const label = t.type==='Transfer' ? (t.autoName||`${t.fromAccount}→${t.toAccount}`) : `${t.category}`;
  const sub   = t.type==='Transfer' ? 'Transfer' : (t.subcategory||'');
  const acc   = t.type==='Expense' ? t.fromAccount : t.type==='Income' ? t.toAccount : '';
  const sign  = t.type==='Expense' ? '-' : t.type==='Income' ? '+' : '';
  const col   = t.type==='Expense' ? 'var(--expense)' : t.type==='Income' ? 'var(--income)' : 'var(--transfer)';
  return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="font-size:20px;width:28px;text-align:center;flex-shrink:0">${icons[t.type]}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:600">${label}${sub?' · '+sub:''}</div>
      <div style="font-size:11px;color:var(--text3)">${acc ? acc+' · ' : ''}${fmtDate(t.date)}</div>
    </div>
    <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:${col};flex-shrink:0">${sign}${fmtAmtDec(parseFloat(t.amount)||0)}</div>
  </div>`;
}

// ── ADD TRANSACTION PAGE ──────────────────────────────────────
let currentType = 'Expense';
function initAddPage() {
  document.getElementById('addDateLabel').textContent = istNow().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  document.getElementById('txnDate').value = todayStr();
  selectType('Expense');
}

function selectType(t) {
  currentType = t;
  // Update type buttons
  document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === t));

  // Show/hide form rows based on type using actual HTML IDs
  const fromRow    = document.getElementById('rowFromAccount');
  const incomeRow  = document.getElementById('rowIncomeAccount');
  const toRow      = document.getElementById('rowToAccount');
  const catRow     = document.getElementById('rowCategory');
  const subRow     = document.getElementById('rowSubcategory');

  if (t === 'Expense') {
    fromRow.style.display   = '';
    incomeRow.style.display = 'none';
    toRow.style.display     = 'none';
    catRow.style.display    = '';
    subRow.style.display    = '';
    populateExpenseCats();
  } else if (t === 'Income') {
    fromRow.style.display   = 'none';
    incomeRow.style.display = '';
    toRow.style.display     = 'none';
    catRow.style.display    = '';
    subRow.style.display    = '';
    populateIncomeSubcats();
  } else { // Transfer
    fromRow.style.display   = '';
    incomeRow.style.display = 'none';
    toRow.style.display     = '';
    catRow.style.display    = 'none';
    subRow.style.display    = 'none';
  }

  document.getElementById('txnCategory').value = '';
  document.getElementById('txnSubcategory').innerHTML = '<option value="">Subcategory</option>';
}

function populateIncomeSubcats() {
  const catEl = document.getElementById('txnCategory');
  catEl.innerHTML = '<option value="Income">Income</option>';
  onCategoryChange();
}

function populateExpenseCats() {
  const catEl = document.getElementById('txnCategory');
  catEl.innerHTML = '<option value="">— Select Category —</option>';
  EXP_CATS.forEach(c => {
    const o = document.createElement('option'); o.value = c; o.textContent = c; catEl.appendChild(o);
  });
}

function onCategoryChange() {
  const cat  = document.getElementById('txnCategory').value;
  const sub  = document.getElementById('txnSubcategory');
  sub.innerHTML = '<option value="">Subcategory</option>';
  const opts = currentType==='Income'
    ? CATEGORIES.Income.Income
    : (CATEGORIES.Expense[cat] || []);
  opts.forEach(o => { const el=document.createElement('option'); el.value=o; el.textContent=o; sub.appendChild(el); });
}

function parseNL() {
  const raw = document.getElementById('nlInput').value.trim();
  if (!raw) { showToast('Type something first','error'); return; }

  document.getElementById('aiLoading').style.display = 'flex';
  document.getElementById('nlPreview').innerHTML = '';

  const accs    = ACCOUNTS.map(a=>a.name).join(', ');
  const catList = Object.entries(CATEGORIES.Expense).map(([c,s])=>`${c}: ${s.join(', ')}`).join('\n');
  const incList = CATEGORIES.Income.Income.join(', ');
  const today   = todayStr();

  const prompt = `You are a finance entry parser for Syndy Wallet (Indian personal finance app).
Parse this natural language transaction entry and return ONLY valid JSON, no markdown.

Input: "${raw}"
Today: ${today}
Accounts: ${accs}
Expense categories and subcategories:
${catList}
Income subcategories: ${incList}

Rules:
- type must be "Expense", "Income", or "Transfer"
- amount must be a positive number
- date must be YYYY-MM-DD (default today if not specified)
- For Expense: fromAccount (closest match from accounts list), category, subcategory
- For Income: toAccount (closest match), category="Income", subcategory (from income list)
- For Transfer: fromAccount, toAccount
- notes: any extra detail

Return JSON: {"type","amount","date","fromAccount","toAccount","category","subcategory","notes"}`;

  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  .then(r => r.json())
  .then(data => {
    document.getElementById('aiLoading').style.display = 'none';
    const raw_text = (data.content?.[0]?.text || '').replace(/```json|```/g,'').trim();
    let parsed;
    try { parsed = JSON.parse(raw_text); } catch { showToast('Could not parse AI response','error'); return; }
    showNLPreview(parsed);
  })
  .catch(() => {
    document.getElementById('aiLoading').style.display = 'none';
    showToast('AI unavailable — fill manually','error');
  });
}

function showNLPreview(p) {
  const sign = p.type==='Expense'?'-':p.type==='Income'?'+':'';
  const col  = p.type==='Expense'?'var(--expense)':p.type==='Income'?'var(--income)':'var(--transfer)';
  const acc  = p.type==='Expense'?p.fromAccount:p.type==='Income'?p.toAccount:`${p.fromAccount}→${p.toAccount}`;
  document.getElementById('nlPreview').innerHTML = `
    <div style="background:var(--bg3);border-radius:10px;padding:12px;margin-top:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:13px;font-weight:600">${p.category||p.type}${p.subcategory?' · '+p.subcategory:''}</span>
        <span style="font-family:var(--mono);font-weight:700;color:${col}">${sign}${fmtAmtDec(p.amount||0)}</span>
      </div>
      <div style="font-size:11px;color:var(--text3)">${acc} · ${fmtDate(p.date)}</div>
      ${p.notes?`<div style="font-size:11px;color:var(--text3);margin-top:3px">${p.notes}</div>`:''}
      <button class="btn btn-primary" style="margin-top:10px;width:100%" onclick='applyNL(${JSON.stringify(p)})'>
        ✓ Confirm & Save
      </button>
    </div>`;
}

function applyNL(p) {
  const txn = {
    id: Date.now().toString(),
    date: p.date || todayStr(),
    type: p.type,
    amount: parseFloat(p.amount) || 0,
    fromAccount: p.fromAccount || '',
    toAccount: p.toAccount || '',
    category: p.category || '',
    subcategory: p.subcategory || '',
    notes: p.notes || ''
  };
  if (p.type==='Transfer') txn.autoName = `${p.fromAccount} → ${p.toAccount}`;
  txns.push(txn); saveTxns(txns);
  document.getElementById('nlInput').value = '';
  document.getElementById('nlPreview').innerHTML = '';
  showToast('✓ Saved!','success');
  renderDashboard();
}

function saveTxnForm() {
  const date = document.getElementById('txnDate').value;
  const amt  = parseFloat(document.getElementById('txnAmount').value);
  const note = document.getElementById('txnNotes').value.trim();
  if (!date) { showToast('Select date','error'); return; }
  if (!amt || amt <= 0) { showToast('Enter valid amount','error'); return; }

  const txn = { id: Date.now().toString(), date, type: currentType, amount: amt, notes: note,
                fromAccount:'', toAccount:'', category:'', subcategory:'' };

  if (currentType==='Expense') {
    const from=document.getElementById('txnFrom').value;
    const cat =document.getElementById('txnCategory').value;
    const sub =document.getElementById('txnSubcategory').value;
    if (!from) { showToast('Select From Account','error'); return; }
    if (!cat)  { showToast('Select Category','error'); return; }
    if (!sub)  { showToast('Select Subcategory','error'); return; }
    Object.assign(txn,{fromAccount:from,category:cat,subcategory:sub});
  } else if (currentType==='Income') {
    const to =document.getElementById('txnToIncome').value;
    const cat=document.getElementById('txnCategory').value;
    const sub=document.getElementById('txnSubcategory').value;
    if (!to)  { showToast('Select Account','error'); return; }
    if (!cat) { showToast('Select Category','error'); return; }
    if (!sub) { showToast('Select Subcategory','error'); return; }
    Object.assign(txn,{toAccount:to,fromAccount:'',category:cat,subcategory:sub});
  } else {
    const from=document.getElementById('txnFrom').value;
    const to  =document.getElementById('txnTo').value;
    if (!from) { showToast('Select From Account','error'); return; }
    if (!to)   { showToast('Select To Account','error'); return; }
    if (from===to) { showToast('From and To cannot be same','error'); return; }
    Object.assign(txn,{fromAccount:from,toAccount:to,category:'Internal',subcategory:'',autoName:`${from} → ${to}`});
  }

  txns.push(txn); saveTxns(txns);
  resetForm();
  showToast('✓ Saved!','success');
  renderDashboard();
}

function resetForm() {
  document.getElementById('txnAmount').value = '';
  document.getElementById('txnNotes').value  = '';
  document.getElementById('txnDate').value   = todayStr();
  selectType('Expense');
}

// ── TRANSACTIONS PAGE ─────────────────────────────────────────
function renderTxnCards() {
  // Update checkpoint status line
  const cpStatus = document.getElementById('checkpointStatus');
  if (cpStatus) {
    const cp = getLatestCheckpoint();
    if (cp) {
      cpStatus.innerHTML = `✅ Latest checkpoint: <b>${monthLabel(cp.month)}</b> locked on ${cp.closedOn}. Safe to delete transactions up to and including that month.`;
    } else {
      cpStatus.innerHTML = `⚠ No checkpoint yet. Create one before deleting historical transactions.`;
    }
  }
  const search = document.getElementById('dataSearch').value.toLowerCase();
  const fType  = document.getElementById('dataFilterType').value;
  const fMonth = document.getElementById('dataFilterMonth').value;
  let filtered = [...txns].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if (fType)  filtered = filtered.filter(t=>t.type===fType);
  if (fMonth) filtered = filtered.filter(t=>t.date?.startsWith(fMonth));
  if (search) filtered = filtered.filter(t=>[t.category,t.subcategory,t.fromAccount,t.toAccount,t.notes,t.type].join(' ').toLowerCase().includes(search));

  const container = document.getElementById('txnCardList');
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No transactions found.</p></div>';
    return;
  }
  const icons={Expense:'💸',Income:'💰',Transfer:'↔️'};
  container.innerHTML = filtered.map(t => {
    const isExp=t.type==='Expense', isInc=t.type==='Income', isTrf=t.type==='Transfer';
    const sign=isExp?'-':isInc?'+':'';
    const col =isExp?'var(--expense)':isInc?'var(--income)':'var(--transfer)';
    const label=isTrf?(t.autoName||`${t.fromAccount}→${t.toAccount}`):t.category||'';
    const sub  =isTrf?'':t.subcategory||'';
    const acc  =isExp?t.fromAccount:isInc?t.toAccount:'';
    return `<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px">
      <div style="font-size:22px;width:36px;text-align:center;flex-shrink:0">${icons[t.type]}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:600">${label}${sub?' · '+sub:''}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:2px">${acc}${t.notes?' · '+t.notes:''}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${fmtDate(t.date)}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-family:var(--mono);font-size:15px;font-weight:700;color:${col}">${sign}${fmtAmtDec(parseFloat(t.amount)||0)}</div>
        <button onclick="deleteTxn('${t.id}')" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:18px;margin-top:4px;padding:0">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function deleteTxn(id) {
  showConfirm('Delete this transaction?', () => {
    txns=txns.filter(t=>t.id!==id); saveTxns(txns);
    renderTxnCards(); renderDashboard();
    showToast('Deleted','success');
  });
}

function deleteByRange() {
  const f=document.getElementById('manageFrom').value, t=document.getElementById('manageTo').value;
  if (!f||!t) { showToast('Select both dates','error'); return; }
  const count=txns.filter(x=>x.date>=f&&x.date<=t).length;
  if (!count) { showToast('No transactions in that range','error'); return; }

  // Warn if deleting pre-checkpoint transactions without a checkpoint
  const cp = getLatestCheckpoint();
  const warn = !cp
    ? '\n\n⚠ WARNING: No checkpoint exists. Deleting these transactions will change your account balances. Create a checkpoint first if these transactions are real.'
    : '';

  showConfirm(`Delete ${count} transactions from ${fmtDate(f)} to ${fmtDate(t)}?${warn}`, () => {
    txns=txns.filter(x=>!(x.date>=f&&x.date<=t)); saveTxns(txns);
    renderTxnCards(); renderDashboard();
    showToast(`Deleted ${count}`,'success');
  });
}

// ── EXPORT ────────────────────────────────────────────────────
function getExportData() {
  const f=document.getElementById('manageFrom').value, t=document.getElementById('manageTo').value;
  return f&&t ? txns.filter(x=>x.date>=f&&x.date<=t) : txns;
}

function exportCSV() {
  const data = getExportData();
  if (!data.length) { showToast('No data to export','error'); return; }
  const h=['Date','Type','Amount','From','To','Category','Subcategory','Notes'];
  const rows=data.map(t=>[t.date,t.type,t.amount,t.fromAccount||'',t.toAccount||'',t.category||'',t.subcategory||'',t.notes||'']);
  const csv=[h,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  dl(csv,'syndy-export.csv','text/csv');
  showToast('CSV downloaded!','success');
}

function exportExcel() {
  const data = getExportData();
  if (!data.length) { showToast('No data to export','error'); return; }
  const h=['Date','Type','Amount','From','To','Category','Subcategory','Notes'];
  const rows=data.map(t=>[t.date,t.type,t.amount,t.fromAccount||'',t.toAccount||'',t.category||'',t.subcategory||'',t.notes||'']);
  dl([h,...rows].map(r=>r.join('\t')).join('\n'),'syndy-export.xls','application/vnd.ms-excel');
  showToast('Excel downloaded!','success');
}

function dl(content, filename, mime) {
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type:mime}));
  a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── REPORTS ───────────────────────────────────────────────────
function renderReports() {
  const picker = document.getElementById('reportMonthPicker');
  if (!picker.value) picker.value = currentMonth();
  const m = picker.value;
  document.getElementById('ledgerTitle').textContent = `Income & Expenditure — ${monthLabel(m)}`;

  const expMap={}, incMap={};
  txns.filter(t=>t.date?.startsWith(m)).forEach(t => {
    const a=parseFloat(t.amount)||0;
    if (t.type==='Expense') expMap[t.category]=(expMap[t.category]||0)+a;
    if (t.type==='Income')  incMap[t.subcategory]=(incMap[t.subcategory]||0)+a;
  });

  const totalExp=Object.values(expMap).reduce((s,v)=>s+v,0);
  const totalInc=Object.values(incMap).reduce((s,v)=>s+v,0);

  const row=(label,val,col)=>`<div style="display:flex;justify-content:space-between;margin-bottom:8px">
    <span style="font-size:12px;color:var(--text2)">${label}</span>
    <span style="font-family:var(--mono);font-size:12px;font-weight:600;color:${col||'var(--text)'}">${fmtAmt(val)}</span>
  </div>`;

  const expCats=EXP_CATS.filter(c=>expMap[c]);
  document.getElementById('ledgerExpenses').innerHTML = expCats.length
    ? expCats.map(c=>row(c,expMap[c],'var(--expense)')).join('')
    : '<div style="font-size:12px;color:var(--text3)">No expenses</div>';
  document.getElementById('ledgerTotalExp').textContent = fmtAmt(totalExp);

  const incSubs=INC_SUBS.filter(s=>incMap[s]);
  document.getElementById('ledgerIncome').innerHTML = incSubs.length
    ? incSubs.map(s=>row(s,incMap[s],'var(--income)')).join('')
    : '<div style="font-size:12px;color:var(--text3)">No income</div>';
  document.getElementById('ledgerTotalInc').textContent = fmtAmt(totalInc);

  // Bar chart
  const maxVal=Math.max(...Object.values(expMap),1);
  const chart=document.getElementById('catChart');
  chart.innerHTML = expCats.length
    ? expCats.sort((a,b)=>expMap[b]-expMap[a]).map(c=>`
        <div style="margin-bottom:10px;cursor:pointer" onclick="document.getElementById('reportCatSelect').value='${c}';renderCategoryDetails()">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="font-size:12px;font-weight:500">${c}</span>
            <span style="font-family:var(--mono);font-size:12px;color:var(--expense)">${fmtAmt(expMap[c])}</span>
          </div>
          <div style="height:6px;background:var(--bg3);border-radius:3px">
            <div style="height:100%;width:${(expMap[c]/maxVal*100).toFixed(1)}%;background:var(--accent);border-radius:3px"></div>
          </div>
        </div>`).join('')
    : '<div style="font-size:12px;color:var(--text3);padding:8px 0">No expense data.</div>';
}

function renderCategoryDetails() {
  const cat = document.getElementById('reportCatSelect').value;
  const m   = document.getElementById('reportMonthPicker').value || currentMonth();
  if (!cat) return;
  const subMap={};
  txns.filter(t=>t.date?.startsWith(m)&&t.type==='Expense'&&t.category===cat).forEach(t=>{
    subMap[t.subcategory]=(subMap[t.subcategory]||0)+(parseFloat(t.amount)||0);
  });
  const subs=Object.entries(subMap).sort((a,b)=>b[1]-a[1]);
  const total=subs.reduce((s,[,v])=>s+v,0);
  const list=document.getElementById('categoryDetailsList');
  list.innerHTML = subs.length
    ? subs.map(([s,v])=>`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:13px">${s}</span>
        <div style="text-align:right">
          <span style="font-family:var(--mono);font-size:13px;color:var(--expense)">${fmtAmt(v)}</span>
          <span style="font-size:10px;color:var(--text3);margin-left:6px">${total?((v/total)*100).toFixed(0):'0'}%</span>
        </div>
      </div>`).join('') +
      `<div style="display:flex;justify-content:space-between;padding:8px 0">
        <span style="font-size:12px;color:var(--text2);text-transform:uppercase">Total</span>
        <span style="font-family:var(--mono);font-weight:700;color:var(--expense)">${fmtAmt(total)}</span>
      </div>`
    : '<p style="font-size:13px;color:var(--text3)">No transactions in this category.</p>';
}

// ── REMINDERS ─────────────────────────────────────────────────
function renderReminders() {
  const list = document.getElementById('reminderList');
  list.innerHTML = reminders.length
    ? reminders.map(r=>`
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:14px;font-weight:600">${r.title}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px">Day ${r.day}${r.amount?' · '+fmtAmt(r.amount):''}${r.account?' · '+r.account:''}</div>
          </div>
          <button onclick="deleteReminder('${r.id}')" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:18px;padding:0">🗑</button>
        </div>`).join('')
    : '<div class="empty-state"><div class="empty-icon">🔔</div><p>No reminders set.</p></div>';
}

function saveReminder() {
  const title  = document.getElementById('remTitle').value.trim();
  const day    = document.getElementById('remDay').value;
  const amount = document.getElementById('remAmount').value;
  const account= document.getElementById('remAccount').value;
  if (!title) { showToast('Enter title','error'); return; }
  if (!day)   { showToast('Enter day','error'); return; }
  reminders.push({ id:Date.now().toString(), title, day:parseInt(day), amount:parseFloat(amount)||0, account });
  saveReminders(reminders);
  document.getElementById('remTitle').value='';
  document.getElementById('remDay').value='';
  document.getElementById('remAmount').value='';
  document.getElementById('remAccount').value='';
  renderReminders();
  showToast('Reminder saved','success');
}

function deleteReminder(id) {
  showConfirm('Delete this reminder?', () => {
    reminders=reminders.filter(r=>r.id!==id); saveReminders(reminders);
    renderReminders(); showToast('Deleted','success');
  });
}

function checkReminders() {
  const today = istNow().getDate();
  const due   = reminders.filter(r => parseInt(r.day) === today);
  const banner= document.getElementById('reminderBanner');

  // Check over-budget for current IST month
  const m      = currentMonth();
  const allB   = loadBudgets();
  const bItems = allB[m] || [];
  const spendMap = {};
  txns.filter(t => t.date?.startsWith(m) && t.type === 'Expense').forEach(t => {
    const key = t.category + '||' + t.subcategory;
    spendMap[key] = (spendMap[key] || 0) + (parseFloat(t.amount) || 0);
  });
  const over = bItems.filter(b => (spendMap[b.category+'||'+b.subcategory]||0) > b.amount);

  const msgs = [];
  if (over.length) msgs.push(`🚨 ${over[0].subcategory} is OVER budget!${over.length>1?' (+'+(over.length-1)+' more)':''}`);
  if (due.length)  msgs.push(`🔔 Due today: ${due.map(r=>r.title).join(', ')}`);

  if (msgs.length) { banner.textContent=msgs.join('  |  '); banner.style.display='block'; }
  else banner.style.display='none';
}

// ── BUDGET ENGINE ─────────────────────────────────────────────
function onBudgetCatChange() {
  const cat = document.getElementById('budgetCat').value;
  const sub = document.getElementById('budgetSub');
  sub.innerHTML = '<option value="">Subcategory</option>';
  if (!cat || !CATEGORIES.Expense[cat]) return;
  CATEGORIES.Expense[cat].forEach(s => {
    const o=document.createElement('option'); o.value=s; o.textContent=s; sub.appendChild(o);
  });
}

function addBudgetItem() {
  const cat   = document.getElementById('budgetCat').value;
  const sub   = document.getElementById('budgetSub').value;
  const amt   = parseFloat(document.getElementById('budgetAmt').value);
  const month = document.getElementById('budgetMonthPicker').value || currentMonth();

  if (!cat) { showToast('Select a category','error'); return; }
  if (!sub) { showToast('Select a subcategory','error'); return; }
  if (!amt || amt <= 0) { showToast('Enter a valid amount','error'); return; }

  const all = loadBudgets();
  if (!all[month]) all[month] = [];
  const existing = all[month].find(b => b.category===cat && b.subcategory===sub);
  if (existing) { existing.amount=amt; showToast('Budget updated!','success'); }
  else { all[month].push({ id:Date.now().toString(), category:cat, subcategory:sub, amount:amt }); showToast('Budget added!','success'); }
  saveBudgets(all);
  document.getElementById('budgetCat').value='';
  document.getElementById('budgetSub').innerHTML='<option value="">Subcategory</option>';
  document.getElementById('budgetAmt').value='';
  renderBudget();
}

function deleteBudgetItem(month, id) {
  showConfirm('Delete this budget item?', () => {
    const all=loadBudgets();
    if (all[month]) all[month]=all[month].filter(b=>b.id!==id);
    saveBudgets(all);
    renderBudget();
    showToast('Deleted','success');
  });
}

// Auto-carry forward: if opening a new month with no budget, copy from previous month
function ensureBudgetCarryForward(month) {
  const all = loadBudgets();
  if (all[month] && all[month].length > 0) return; // already has budget

  // Find previous month
  const [y, m] = month.split('-').map(Number);
  const prevDate = new Date(y, m - 2, 1); // m-2 because months are 0-indexed
  const prevMonth = prevDate.toISOString().slice(0, 7);

  if (all[prevMonth] && all[prevMonth].length > 0) {
    // Copy with new IDs, same amounts
    all[month] = all[prevMonth].map(b => ({ ...b, id: Date.now().toString() + Math.random().toString(36).slice(2) }));
    saveBudgets(all);
    showToast(`Budget carried forward from ${monthLabel(prevMonth)}`, 'success');
  }
}

function renderBudget() {
  const picker = document.getElementById('budgetMonthPicker');
  if (!picker.value) picker.value = currentMonth();
  const month = picker.value;

  // Auto carry-forward if new month has no budget
  ensureBudgetCarryForward(month);

  const label = monthLabel(month);
  document.getElementById('budgetMonthLabel').textContent = label + ' — Budget vs Actual';

  const all      = loadBudgets();
  const items    = all[month] || [];
  const container= document.getElementById('budgetList');

  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div>
      <p>No budgets set for ${label}.<br>Add items above.</p></div>`;
    document.getElementById('budgetAlertBar').style.display='none';
    return;
  }

  const spendMap={};
  txns.filter(t=>t.date?.startsWith(month)&&t.type==='Expense').forEach(t=>{
    const key=t.category+'||'+t.subcategory;
    spendMap[key]=(spendMap[key]||0)+(parseFloat(t.amount)||0);
  });

  const [y, mo] = month.split('-').map(Number);
  const daysInMonth = new Date(y, mo, 0).getDate();
  const dayOfMonth  = (month===currentMonth()) ? istNow().getDate() : daysInMonth;
  const daysLeft    = Math.max(0, daysInMonth - dayOfMonth);
  const overItems   = [];

  const html = items
    .sort((a,b)=>a.category.localeCompare(b.category)||a.subcategory.localeCompare(b.subcategory))
    .map(item => {
      const key    = item.category+'||'+item.subcategory;
      const spent  = spendMap[key]||0;
      const budget = item.amount;
      const left   = budget - spent;
      const pct    = Math.min((spent/budget)*100, 100);
      const isOver = spent > budget;
      const isWarn = !isOver && pct >= 75;
      if (isOver) overItems.push(`${item.subcategory} (${item.category})`);
      const barCol  = isOver?'#f87171':isWarn?'#f59e0b':'var(--accent)';
      const leftCol = isOver?'var(--expense)':isWarn?'#f59e0b':'var(--income)';
      const border  = isOver?'1px solid rgba(248,113,113,0.35)':isWarn?'1px solid rgba(245,158,11,0.3)':'1px solid var(--border)';
      return `<div style="background:var(--card);border:${border};border-radius:12px;padding:14px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
          <div>
            <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px">${item.category}</div>
            <div style="font-size:14px;font-weight:600;margin-top:2px">${item.subcategory}</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:${leftCol}">${isOver?'-':''}${fmtAmt(Math.abs(left))}</div>
            <div style="font-size:10px;color:${leftCol};margin-top:1px">${isOver?'OVER BUDGET':'Left'}</div>
          </div>
        </div>
        <div style="height:7px;background:var(--bg3);border-radius:4px;overflow:hidden;margin-bottom:8px">
          <div style="height:100%;width:${pct.toFixed(1)}%;background:${barCol};border-radius:4px;transition:width 0.4s ease"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px;color:var(--text3)">Spent ${fmtAmt(spent)} of ${fmtAmt(budget)}</span>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:11px;color:var(--text3)">${pct.toFixed(0)}% used${daysLeft>0?' · '+daysLeft+'d left':''}</span>
            <button onclick="deleteBudgetItem('${month}','${item.id}')" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:16px;padding:0">🗑</button>
          </div>
        </div>
      </div>`;
    }).join('');

  container.innerHTML = html;
  const alertBar = document.getElementById('budgetAlertBar');
  if (overItems.length) { alertBar.style.display='block'; alertBar.textContent='🚨 Over budget: '+overItems.join(', '); }
  else alertBar.style.display='none';
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
  const istDate = istNow();
  document.getElementById('dashDate').textContent = istDate.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  document.getElementById('reportMonthPicker').value = currentMonth();
  const bp = document.getElementById('budgetMonthPicker');
  if (bp && !bp.value) bp.value = currentMonth();
  showPage('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
