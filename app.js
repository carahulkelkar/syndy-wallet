// ============================================================
// SYNDY WALLET — app.js  v11
// Astral Financial Tracker
// Changes v11:
//   • Edit / Modify transaction functionality
//   • Amul Curd added to Grocery subcategories
//   • Astral logo in header + PWA icons
//   • Opening balances confirmed: Cash 984, ICICI 1110.84,
//     Kotak Savings 66.01, Kotak LAS OD -109433, CC 0
//   • All balance recalculation on edit
// ============================================================

const OPENING_DATE = '2026-05-05';

const ACCOUNTS = [
  { name: 'Cash',              type: 'Cash',        balance: 984      },
  { name: 'ICICI Savings',     type: 'Bank',        balance: 1110.84  },
  { name: 'Kotak Savings',     type: 'Bank',        balance: 66.01    },
  { name: 'Kotak LAS OD',      type: 'Liability',   balance: -109433  },
  { name: 'Kotak Credit Card', type: 'Credit Card', balance: 0        }
];

const EXP_CATS = ['Food','Grocery','Housing','Utilities','Health','Personal','Lifestyle','Misc'];
const INC_SUBS = ['Salary','Professional Fees','Sav Int-Kotak','Sav Int-ICICI','Bond Interest'];

const CATEGORIES = {
  Expense: {
    Food:      ['BF-Maggie','BF-Milk','BF-Muselli','BF-Eggs','BF-Whey Protein','BF-Coffee','BF-Other','Lunch-Tiffin','Lunch-Outside','Snacks-Biscuits etc','Snacks-Outside','Dinner-Tiffin','Nonveg-Chicken','Nonveg-Mutton'],
    Grocery:   ['Rice Surti-Indra','Dal Toor-Moong','Oil Groundnut','Ghee Govardhan','Salt & Pepper etc','Sugar & Others','Thums Up','Shrikhand','Coconut Water','Amul Masti','Amul Curd','Delivery charges','Fruits-Apple-Banana','Fruits-Others','Salads','Vegetables'],
    Housing:   ['Rent-Landlord','Rent Mojo','Snabbit','Phenol-Harpic','Washing Powder','Malad Pagdi','Ratnagiri Maintenance'],
    Utilities: ['Electricity','Gas','Internet','Postpaid Vi','Prepaid Jio','Ironing'],
    Health:    ['Medicines','Doctor','Tests'],
    Personal:  ['Clothings','Hair Oil','Deodorant','Face Cream-Powder','Tooth Paste-Brush','Blade-Foam'],
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

let txns      = loadTxns();
let reminders = loadReminders();

// ── EDIT STATE ────────────────────────────────────────────────
let editingTxnId = null;   // null = new entry, string id = editing

// ── HELPERS ───────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0,10); }
function currentMonth() { return new Date().toISOString().slice(0,7); }

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

// ── BALANCE ENGINE ────────────────────────────────────────────
// Proper asset vs liability accounting:
//   Asset (Cash, Bank, CC with positive bal): +Income, +TransferIn, -Expense, -TransferOut
//   Liability (OD, CC with negative bal):
//     Expense on CC   → increases liability (balance goes more negative)
//     CC payment      → Transfer from Bank to CC → reduces liability
//     Borrow from OD  → Transfer from OD to Cash → OD goes more negative
function calcBalances() {
  const bal = {};
  ACCOUNTS.forEach(a => bal[a.name] = a.balance);
  txns.filter(t => t.date >= OPENING_DATE).forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'Expense') {
      if (bal[t.fromAccount] !== undefined) bal[t.fromAccount] -= amt;
    } else if (t.type === 'Income') {
      if (bal[t.toAccount] !== undefined) bal[t.toAccount] += amt;
    } else if (t.type === 'Transfer') {
      if (bal[t.fromAccount] !== undefined) bal[t.fromAccount] -= amt;
      if (bal[t.toAccount]   !== undefined) bal[t.toAccount]   += amt;
    }
  });
  return bal;
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
  if (id === 'budget')    renderBudgetPage();
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  const bal = calcBalances();
  const grid = document.getElementById('accountsGrid');
  grid.innerHTML = '';

  // OD — full width, liability red
  const odBal = bal['Kotak LAS OD'];
  grid.innerHTML += `
    <div style="background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.3);border-radius:14px;padding:16px 18px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Kotak LAS OD</div>
        <div style="font-size:11px;color:var(--text3)">Liability</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:var(--mono);font-size:22px;font-weight:700;color:var(--expense)">-${fmtAmtDec(Math.abs(odBal))}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px">Outstanding</div>
      </div>
    </div>`;

  // CC — full width
  const ccBal = bal['Kotak Credit Card'];
  grid.innerHTML += `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 18px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Kotak Credit Card</div>
        <div style="font-size:11px;color:var(--text3)">Credit Card</div>
      </div>
      <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:${ccBal < 0 ? 'var(--expense)' : 'var(--text)'}">${fmtAmtDec(ccBal)}</div>
    </div>`;

  // ICICI + Kotak side by side
  const row2 = document.createElement('div');
  row2.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px';
  [['ICICI Savings', 'var(--accent)'], ['Kotak Savings', 'var(--accent2)']].forEach(([name, col]) => {
    const b = bal[name];
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px';
    div.innerHTML = `<div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">${name}</div>
      <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:${col}">${fmtAmtDec(b)}</div>
      <div style="font-size:10px;color:var(--text3);margin-top:4px">Bank</div>`;
    row2.appendChild(div);
  });
  grid.appendChild(row2);

  // Cash
  const cashBal = bal['Cash'];
  grid.innerHTML += `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div>
        <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Cash</div>
        <div style="font-size:11px;color:var(--text3)">In Hand</div>
      </div>
      <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:#f59e0b">${fmtAmtDec(cashBal)}</div>
    </div>`;

  document.getElementById('balanceDate').textContent = 'as on ' + new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

  const today = todayStr(), m = currentMonth();
  let todayExp = 0, monthExp = 0, monthInc = 0;
  txns.forEach(t => {
    const a = parseFloat(t.amount) || 0;
    if (t.type === 'Expense') { if (t.date === today) todayExp += a; if (t.date?.startsWith(m)) monthExp += a; }
    if (t.type === 'Income' && t.date?.startsWith(m)) monthInc += a;
  });
  document.getElementById('statToday').textContent    = fmtAmtDec(todayExp);
  document.getElementById('statMonthExp').textContent = fmtAmtDec(monthExp);
  document.getElementById('statMonthInc').textContent = fmtAmtDec(monthInc);
  document.getElementById('statTotal').textContent    = txns.length;

  const recents = [...txns].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
  const list = document.getElementById('recentList');
  list.innerHTML = recents.length === 0
    ? '<div class="empty-state"><div class="empty-icon">📭</div><p>No transactions yet. Tap + to add one.</p></div>'
    : recents.map(txnRowHTML).join('');

  checkReminders();
  checkBudgetAlerts();
}

function txnRowHTML(t) {
  const icons = { Expense: '💸', Income: '💰', Transfer: '↔️' };
  const label = t.type === 'Transfer' ? (t.autoName || `${t.fromAccount}→${t.toAccount}`) : `${t.category}`;
  const sub   = t.type === 'Transfer' ? 'Transfer' : (t.subcategory || '');
  const acc   = t.type === 'Expense' ? t.fromAccount : t.type === 'Income' ? t.toAccount : '';
  const sign  = t.type === 'Expense' ? '-' : t.type === 'Income' ? '+' : '';
  const col   = t.type === 'Expense' ? 'var(--expense)' : t.type === 'Income' ? 'var(--income)' : 'var(--transfer)';
  return `<div class="txn-item">
    <div class="txn-icon ${t.type.toLowerCase()}">${icons[t.type]}</div>
    <div class="txn-details">
      <div class="txn-cat">${label}${sub ? ' · ' + sub : ''}</div>
      <div class="txn-sub">${acc}${t.notes ? ' · ' + t.notes : ''}</div>
    </div>
    <div class="txn-right">
      <div class="txn-amt" style="color:${col}">${sign}${fmtAmtDec(parseFloat(t.amount) || 0)}</div>
      <div class="txn-date">${fmtDate(t.date)}</div>
    </div>
  </div>`;
}

// ── ADD PAGE ──────────────────────────────────────────────────
let currentType = 'Expense';

function initAddPage() {
  editingTxnId = null;
  document.getElementById('txnDate').value = todayStr();
  const el = document.getElementById('addDateLabel');
  if (el) el.textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  // Reset save button to "new entry" mode
  const btn = document.getElementById('saveTxnBtn');
  btn.textContent = '💾 Save Transaction';
  btn.style.background = 'var(--accent)';
  document.getElementById('page-add').querySelector('.page-title').textContent = 'Add Transaction';
  setType('Expense');
  resetForm();
}

function setType(type) {
  currentType = type;
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.remove('active', 'expense', 'income', 'transfer');
    if (b.dataset.type === type) b.classList.add('active', type.toLowerCase());
  });
  const isExp = type === 'Expense', isInc = type === 'Income', isTrf = type === 'Transfer';
  document.getElementById('rowFromAccount').style.display   = (isExp || isTrf) ? 'block' : 'none';
  document.getElementById('rowIncomeAccount').style.display = isInc ? 'block' : 'none';
  document.getElementById('rowToAccount').style.display     = isTrf ? 'block' : 'none';
  document.getElementById('rowCategory').style.display      = !isTrf ? 'block' : 'none';
  document.getElementById('rowSubcategory').style.display   = !isTrf ? 'block' : 'none';

  const catSel = document.getElementById('txnCategory');
  catSel.innerHTML = '<option value="">— Select Category —</option>';
  if (!isTrf) {
    const cats = isExp ? Object.keys(CATEGORIES.Expense) : Object.keys(CATEGORIES.Income);
    cats.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o); });
  }
  document.getElementById('txnSubcategory').innerHTML = '<option value="">— Select Subcategory —</option>';

  // Set sensible defaults only when not editing
  if (!editingTxnId) {
    setTimeout(() => {
      if (isExp) document.getElementById('txnFrom').value      = 'ICICI Savings';
      if (isInc) document.getElementById('txnToIncome').value  = 'Kotak Savings';
    }, 20);
  }
}

function resetForm() {
  document.getElementById('txnAmount').value   = '';
  document.getElementById('txnNotes').value    = '';
  document.getElementById('txnFrom').value     = 'ICICI Savings';
  document.getElementById('txnTo').value       = '';
  document.getElementById('txnToIncome').value = '';
  document.getElementById('txnCategory').value = '';
  document.getElementById('txnSubcategory').innerHTML = '<option value="">— Select Subcategory —</option>';
  document.getElementById('nlInput').value = '';
  document.getElementById('nlPreview').classList.remove('show');
  editingTxnId = null;
}

function onCategoryChange() {
  const cat = document.getElementById('txnCategory').value;
  const sub = document.getElementById('txnSubcategory');
  sub.innerHTML = '<option value="">— Select Subcategory —</option>';
  if (!cat) return;
  const subs = currentType === 'Expense' ? CATEGORIES.Expense[cat] : CATEGORIES.Income[cat];
  if (subs) subs.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; sub.appendChild(o); });
}

// ── EDIT TRANSACTION ──────────────────────────────────────────
function editTxn(id) {
  const t = txns.find(x => x.id === id);
  if (!t) return;

  editingTxnId = id;
  showPage('add');

  // Update page UI for edit mode
  setTimeout(() => {
    document.getElementById('page-add').querySelector('.page-title').textContent = '✏️ Edit Transaction';
    document.getElementById('addDateLabel').textContent = 'Modifying entry — update and save';
    const btn = document.getElementById('saveTxnBtn');
    btn.textContent = '✅ Update Transaction';
    btn.style.background = 'var(--accent2)';

    // Set type first (builds form fields)
    setType(t.type);

    setTimeout(() => {
      document.getElementById('txnDate').value   = t.date || todayStr();
      document.getElementById('txnAmount').value = t.amount;
      document.getElementById('txnNotes').value  = t.notes || '';

      if (t.type === 'Expense') {
        document.getElementById('txnFrom').value = t.fromAccount || '';
        document.getElementById('txnCategory').value = t.category || '';
        onCategoryChange();
        setTimeout(() => { document.getElementById('txnSubcategory').value = t.subcategory || ''; }, 60);
      } else if (t.type === 'Income') {
        document.getElementById('txnToIncome').value = t.toAccount || '';
        document.getElementById('txnCategory').value = t.category || '';
        onCategoryChange();
        setTimeout(() => { document.getElementById('txnSubcategory').value = t.subcategory || ''; }, 60);
      } else if (t.type === 'Transfer') {
        document.getElementById('txnFrom').value = t.fromAccount || '';
        document.getElementById('txnTo').value   = t.toAccount   || '';
      }
    }, 80);
  }, 150);
}

// ── SAVE / UPDATE ─────────────────────────────────────────────
function saveTxn() {
  const date   = document.getElementById('txnDate').value || todayStr();
  const amount = parseFloat(document.getElementById('txnAmount').value);
  const notes  = document.getElementById('txnNotes').value.trim();
  if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }

  let txnData = { date, amount, type: currentType, notes };

  if (currentType === 'Expense') {
    const from = document.getElementById('txnFrom').value;
    const cat  = document.getElementById('txnCategory').value;
    const sub  = document.getElementById('txnSubcategory').value;
    if (!from) { showToast('Select From Account', 'error'); return; }
    if (!cat)  { showToast('Select Category', 'error'); return; }
    if (!sub)  { showToast('Select Subcategory', 'error'); return; }
    Object.assign(txnData, { fromAccount: from, toAccount: '', category: cat, subcategory: sub });

  } else if (currentType === 'Income') {
    const to  = document.getElementById('txnToIncome').value;
    const cat = document.getElementById('txnCategory').value;
    const sub = document.getElementById('txnSubcategory').value;
    if (!to)  { showToast('Select Account', 'error'); return; }
    if (!cat) { showToast('Select Category', 'error'); return; }
    if (!sub) { showToast('Select Subcategory', 'error'); return; }
    Object.assign(txnData, { toAccount: to, fromAccount: '', category: cat, subcategory: sub });

  } else {
    const from = document.getElementById('txnFrom').value;
    const to   = document.getElementById('txnTo').value;
    if (!from) { showToast('Select From Account', 'error'); return; }
    if (!to)   { showToast('Select To Account', 'error'); return; }
    if (from === to) { showToast('From and To cannot be same', 'error'); return; }
    Object.assign(txnData, { fromAccount: from, toAccount: to, category: 'Internal', subcategory: '', autoName: `${from} → ${to}` });
  }

  if (editingTxnId) {
    // UPDATE existing transaction — preserve original id, replace all other fields
    const idx = txns.findIndex(x => x.id === editingTxnId);
    if (idx !== -1) {
      txns[idx] = { id: editingTxnId, ...txnData };
      saveTxns(txns);
      editingTxnId = null;
      showToast('✅ Transaction updated!', 'success');
      // Restore button
      const btn = document.getElementById('saveTxnBtn');
      btn.textContent = '💾 Save Transaction';
      btn.style.background = 'var(--accent)';
      document.getElementById('page-add').querySelector('.page-title').textContent = 'Add Transaction';
      resetForm();
      // Recalculate everything
      renderDashboard();
      // If user was on data or reports, refresh those too
      if (document.getElementById('page-data').classList.contains('active'))    renderTxnCards();
      if (document.getElementById('page-reports').classList.contains('active')) renderReports();
    }
  } else {
    // NEW transaction
    txns.push({ id: Date.now().toString(), ...txnData });
    saveTxns(txns);
    resetForm();
    showToast('✓ Saved!', 'success');
    renderDashboard();
  }
}

// ── TRANSACTIONS PAGE ─────────────────────────────────────────
// ── ACCOUNT PILL FILTER ───────────────────────────────────────
function setAccountPill(el, acct) {
  document.querySelectorAll('.acct-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  const dd = document.getElementById('dataFilterAccount');
  if (dd) dd.value = acct;
  renderTxnCards();
}

function syncPillFromDropdown() {
  const acct = document.getElementById('dataFilterAccount').value;
  document.querySelectorAll('.acct-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.acct === acct);
  });
}

function renderTxnCards() {
  const search = document.getElementById('dataSearch').value.toLowerCase();
  const fType  = document.getElementById('dataFilterType').value;
  const fMonth = document.getElementById('dataFilterMonth').value;
  const fAcct  = document.getElementById('dataFilterAccount')?.value || '';

  let filtered = [...txns].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (fType)  filtered = filtered.filter(t => t.type === fType);
  if (fMonth) filtered = filtered.filter(t => t.date?.startsWith(fMonth));
  if (fAcct)  filtered = filtered.filter(t =>
    t.fromAccount === fAcct || t.toAccount === fAcct
  );
  if (search) filtered = filtered.filter(t =>
    [t.category, t.subcategory, t.fromAccount, t.toAccount, t.notes, t.type]
      .join(' ').toLowerCase().includes(search)
  );

  // Count label
  const countEl = document.getElementById('txnCountLabel');
  if (countEl) {
    const total    = filtered.length;
    const totalExp = filtered.filter(t => t.type === 'Expense')
                             .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    countEl.textContent = total
      ? `${total} transaction${total > 1 ? 's' : ''}${fAcct ? ' \u00b7 ' + fAcct : ''}`
        + (totalExp ? '  |  Exp: ' + fmtAmt(totalExp) : '')
      : '';
  }

  const container = document.getElementById('txnCardList');
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">\u{1F4ED}</div><p>No transactions found.</p></div>';
    return;
  }

  const icons = { Expense: '\u{1F4B8}', Income: '\u{1F4B0}', Transfer: '\u2194\uFE0F' };

  container.innerHTML = filtered.map((t, idx) => {
    const isExp = t.type === 'Expense', isInc = t.type === 'Income', isTrf = t.type === 'Transfer';
    const sign  = isExp ? '-' : isInc ? '+' : '';
    const col   = isExp ? 'var(--expense)' : isInc ? 'var(--income)' : 'var(--transfer)';
    const label = isTrf ? (t.autoName || `${t.fromAccount} \u2192 ${t.toAccount}`) : (t.category || '');
    const sub   = isTrf ? '' : (t.subcategory || '');
    const badge = isExp  ? (t.fromAccount || '')
                : isInc  ? (t.toAccount   || '')
                : `${t.fromAccount || ''} \u2192 ${t.toAccount || ''}`;
    const delay = Math.min(idx * 35, 300);
    return `
    <div class="txn-card" id="tc-${t.id}" style="animation-delay:${delay}ms">
      <div class="txn-card-main" onclick="toggleTxnActions('${t.id}')">
        <div class="txn-card-icon ${t.type.toLowerCase()}">${icons[t.type]}</div>
        <div class="txn-card-body">
          <div class="txn-card-label">${label}${sub ? ' \u00b7 ' + sub : ''}</div>
          <div class="txn-card-sub">${t.notes || ''}</div>
          <span class="txn-acct-badge">${badge}</span>
        </div>
        <div class="txn-card-right">
          <div class="txn-card-amt" style="color:${col}">${sign}${fmtAmtDec(parseFloat(t.amount) || 0)}</div>
          <div class="txn-card-date">${fmtDate(t.date)}</div>
          <div class="txn-card-chevron" id="chev-${t.id}">\u203a</div>
        </div>
      </div>
      <div class="txn-card-actions" id="act-${t.id}" style="display:none">
        <button class="txn-act-btn edit"   onclick="editTxn('${t.id}')">\u270F\uFE0F Edit</button>
        <button class="txn-act-btn delete" onclick="deleteTxn('${t.id}')">\u{1F5D1} Delete</button>
      </div>
    </div>`;
  }).join('');
}

function toggleTxnActions(id) {
  const actEl  = document.getElementById('act-' + id);
  const chevEl = document.getElementById('chev-' + id);
  const isOpen = actEl.style.display !== 'none';
  document.querySelectorAll('.txn-card-actions').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.txn-card-chevron').forEach(el => {
    el.textContent = '\u203a'; el.style.transform = '';
  });
  if (!isOpen) {
    actEl.style.display    = 'flex';
    chevEl.style.transform = 'rotate(90deg)';
  }
}

function deleteTxn(id) {
  showConfirm('Delete this transaction?', () => {
    txns = txns.filter(t => t.id !== id);
    saveTxns(txns);
    renderTxnCards();
    renderDashboard();
    if (document.getElementById('page-reports').classList.contains('active')) renderReports();
    showToast('Deleted', 'success');
  });
}

function deleteByRange() {
  const f = document.getElementById('manageFrom').value, t = document.getElementById('manageTo').value;
  if (!f || !t) { showToast('Select both dates', 'error'); return; }
  const count = txns.filter(x => x.date >= f && x.date <= t).length;
  if (!count) { showToast('No transactions in that range', 'error'); return; }
  showConfirm(`Delete ${count} transactions from ${fmtDate(f)} to ${fmtDate(t)}?`, () => {
    txns = txns.filter(x => !(x.date >= f && x.date <= t));
    saveTxns(txns);
    renderTxnCards();
    renderDashboard();
    showToast(`Deleted ${count}`, 'success');
  });
}

// ── EXPORT ────────────────────────────────────────────────────
function getExportData() {
  const f = document.getElementById('manageFrom').value, t = document.getElementById('manageTo').value;
  return f && t ? txns.filter(x => x.date >= f && x.date <= t) : txns;
}

function exportCSV() {
  const data = getExportData();
  if (!data.length) { showToast('No data to export', 'error'); return; }
  const h = ['Date','Type','Amount','From','To','Category','Subcategory','Notes'];
  const rows = data.map(t => [t.date, t.type, t.amount, t.fromAccount||'', t.toAccount||'', t.category||'', t.subcategory||'', t.notes||'']);
  const csv = [h, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  dl(csv, 'syndy-export.csv', 'text/csv');
  showToast('CSV downloaded!', 'success');
}

function exportExcel() {
  const data = getExportData();
  if (!data.length) { showToast('No data to export', 'error'); return; }
  const h = ['Date','Type','Amount','From','To','Category','Subcategory','Notes'];
  const rows = data.map(t => [t.date, t.type, t.amount, t.fromAccount||'', t.toAccount||'', t.category||'', t.subcategory||'', t.notes||'']);
  dl([h, ...rows].map(r => r.join('\t')).join('\n'), 'syndy-export.xls', 'application/vnd.ms-excel');
  showToast('Excel downloaded!', 'success');
}

function dl(content, filename, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── AI NL ─────────────────────────────────────────────────────
async function parseNL() {
  const text = document.getElementById('nlInput').value.trim();
  if (!text) { showToast('Type something first', 'error'); return; }
  document.getElementById('aiLoading').style.display = 'flex';
  document.getElementById('nlPreview').classList.remove('show');

  const expCats = Object.entries(CATEGORIES.Expense).map(([c,s]) => `${c}: ${s.join(', ')}`).join('\n');
  const prompt = `Parse this personal finance entry. Return ONLY valid JSON, no other text.
Entry: "${text}"
Today: ${todayStr()}
Accounts: Cash, ICICI Savings, Kotak Savings, Kotak LAS OD, Kotak Credit Card
Expense categories:\n${expCats}
Income subcategories: Rent-Prathana, Salary, Professional Fees, Sav Int-Kotak, Sav Int-ICICI, Bond Interest
Rules: type=Expense|Income|Transfer. Expense: fromAccount=payer. Income: toAccount=receiver, category=Income. Transfer: fromAccount+toAccount, category=Internal.
Default expense account: ICICI Savings. Default income account: Kotak Savings.
Return: {"type":"","amount":0,"fromAccount":"","toAccount":"","category":"","subcategory":"","notes":"","confidence":"high"}`;

  try {
    const res  = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 300, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    const m    = (data.content?.[0]?.text || '').match(/\{[\s\S]*\}/);
    if (m) { const p = JSON.parse(m[0]); showNLPreview(p); }
    else showToast('Could not parse. Fill manually.', 'error');
  } catch { showToast('AI error. Fill manually.', 'error'); }
  document.getElementById('aiLoading').style.display = 'none';
}

function showNLPreview(p) {
  const el = document.getElementById('nlPreview');
  el.innerHTML = `<div class="nl-preview-title">✨ AI Detected</div>
    <div class="nl-preview-grid">
      <div class="nl-preview-item"><span>Type</span> ${p.type||'—'}</div>
      <div class="nl-preview-item"><span>Amount</span> ${p.amount ? '₹'+p.amount : '—'}</div>
      <div class="nl-preview-item"><span>Account</span> ${p.fromAccount||p.toAccount||'—'}</div>
      <div class="nl-preview-item"><span>Category</span> ${p.category||'—'}</div>
      <div class="nl-preview-item"><span>Sub</span> ${p.subcategory||'—'}</div>
      <div class="nl-preview-item"><span>Confidence</span> ${p.confidence||'—'}</div>
    </div>
    <button class="btn btn-primary" style="margin-top:12px;padding:10px" onclick='applyNL(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Apply ✓</button>`;
  el.classList.add('show');
}

function applyNL(p) {
  setType(p.type || 'Expense');
  document.getElementById('txnAmount').value = p.amount || '';
  document.getElementById('txnNotes').value  = p.notes  || '';
  setTimeout(() => {
    if (p.type === 'Expense')   document.getElementById('txnFrom').value      = p.fromAccount || 'ICICI Savings';
    if (p.type === 'Income')    document.getElementById('txnToIncome').value  = p.toAccount   || 'Kotak Savings';
    if (p.type === 'Transfer') {
      document.getElementById('txnFrom').value = p.fromAccount || '';
      document.getElementById('txnTo').value   = p.toAccount   || '';
    }
    if (p.category) {
      document.getElementById('txnCategory').value = p.category; onCategoryChange();
      setTimeout(() => { if (p.subcategory) document.getElementById('txnSubcategory').value = p.subcategory; }, 60);
    }
  }, 80);
  document.getElementById('nlPreview').classList.remove('show');
  showToast('Applied! Review and save.', 'success');
}

// ── REPORTS ───────────────────────────────────────────────────
function renderReports() {
  const picker = document.getElementById('reportMonthPicker');
  if (!picker.value) picker.value = currentMonth();
  const m = picker.value;
  const label = new Date(m + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  document.getElementById('ledgerTitle').textContent = `Income & Expenditure — ${label}`;

  const filtered = txns.filter(t => t.date?.startsWith(m));

  const expMap = {};
  filtered.filter(t => t.type === 'Expense').forEach(t => {
    expMap[t.category] = (expMap[t.category] || 0) + (parseFloat(t.amount) || 0);
  });
  let totalExp = 0;
  document.getElementById('ledgerExpenses').innerHTML = EXP_CATS.map(cat => {
    const val = expMap[cat] || 0; totalExp += val;
    const display = val === 0
      ? '<span style="color:var(--text3)">—</span>'
      : `<span style="color:var(--expense);font-family:var(--mono)">${fmtAmt(val)}</span>`;
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;cursor:pointer" onclick="drillCat('${cat}')">
      <span style="font-size:12px;color:var(--text)">${cat}</span>${display}</div>`;
  }).join('');
  document.getElementById('ledgerTotalExp').textContent = fmtAmt(totalExp);

  const incMap = {};
  filtered.filter(t => t.type === 'Income').forEach(t => {
    incMap[t.subcategory] = (incMap[t.subcategory] || 0) + (parseFloat(t.amount) || 0);
  });
  let totalInc = 0;
  document.getElementById('ledgerIncome').innerHTML = INC_SUBS.map(sub => {
    const val = incMap[sub] || 0; totalInc += val;
    const display = val === 0
      ? '<span style="color:var(--text3)">—</span>'
      : `<span style="color:var(--income);font-family:var(--mono)">${fmtAmt(val)}</span>`;
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0">
      <span style="font-size:12px;color:var(--text)">${sub}</span>${display}</div>`;
  }).join('');
  document.getElementById('ledgerTotalInc').textContent = fmtAmt(totalInc);

  const maxVal = Math.max(...EXP_CATS.map(c => expMap[c] || 0), 1);
  document.getElementById('catChart').innerHTML = EXP_CATS.map(cat => {
    const val = expMap[cat] || 0;
    const pct = (val / maxVal * 100).toFixed(1);
    return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:12px;color:var(--text)">${cat}</span>
        <span style="font-family:var(--mono);font-size:12px;color:${val ? 'var(--expense)' : 'var(--text3)'}">${val ? fmtAmt(val) : '—'}</span>
      </div>
      <div style="height:7px;background:var(--bg3);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:var(--accent);border-radius:4px;transition:width 0.5s ease"></div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('reportCatSelect').value = '';
  document.getElementById('categoryDetailsList').innerHTML = '<p style="font-size:13px;color:var(--text3)">Select a category above to see subcategory breakdown.</p>';
}

function drillCat(cat) {
  document.getElementById('reportCatSelect').value = cat;
  renderCategoryDetails();
  document.getElementById('reportCatSelect').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderCategoryDetails() {
  const cat = document.getElementById('reportCatSelect').value;
  const container = document.getElementById('categoryDetailsList');
  if (!cat) { container.innerHTML = '<p style="font-size:13px;color:var(--text3)">Select a category above.</p>'; return; }

  const m = document.getElementById('reportMonthPicker').value || currentMonth();
  const filtered = txns.filter(t => t.date?.startsWith(m) && t.type === 'Expense' && t.category === cat);

  const subMap = {};
  filtered.forEach(t => {
    const s = t.subcategory || 'Other';
    if (!subMap[s]) subMap[s] = { total: 0, entries: [] };
    subMap[s].total += parseFloat(t.amount) || 0;
    subMap[s].entries.push(t);
  });

  const sorted = Object.entries(subMap).sort((a, b) => b[1].total - a[1].total);
  const catTotal = sorted.reduce((s, [, v]) => s + v.total, 0);
  const maxV = sorted[0]?.[1].total || 1;

  if (!sorted.length) {
    container.innerHTML = `<p style="font-size:13px;color:var(--text3)">No expenses for ${cat} this month.</p>`;
    return;
  }

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border)">
      <span style="font-size:13px;font-weight:600">${cat}</span>
      <span style="font-family:var(--mono);font-size:15px;font-weight:700;color:var(--expense)">-${fmtAmtDec(catTotal)}</span>
    </div>
    ${sorted.map(([sub, data]) => `
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:13px">${sub}</span>
          <span style="font-family:var(--mono);font-size:12px;color:var(--expense)">-${fmtAmt(data.total)}</span>
        </div>
        <div style="height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;margin-bottom:6px">
          <div style="height:100%;width:${(data.total / maxV * 100).toFixed(1)}%;background:var(--accent2);border-radius:3px"></div>
        </div>
        <div style="padding-left:8px;border-left:2px solid var(--border)">
          ${data.entries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(42,42,58,0.4)">
              <span style="font-size:11px;color:var(--text2)">${fmtDate(t.date)}${t.notes ? ' · ' + t.notes : ''}</span>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-family:var(--mono);font-size:11px">₹${(parseFloat(t.amount)||0).toLocaleString('en-IN')}</span>
                <button onclick="editTxn('${t.id}')" style="background:none;border:none;cursor:pointer;color:var(--accent2);font-size:13px;padding:0" title="Edit">✏️</button>
              </div>
            </div>`).join('')}
        </div>
      </div>`).join('')}`;
}

// ── REMINDERS ─────────────────────────────────────────────────
function renderReminders() {
  const list = document.getElementById('reminderList');
  if (!reminders.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔔</div><p>No reminders yet</p></div>';
    return;
  }
  list.innerHTML = [...reminders].sort((a, b) => (a.day || 0) - (b.day || 0)).map(r => `
    <div class="reminder-item">
      <div class="reminder-day"><div class="day-num">${r.day}</div><div class="day-label">${r.recurring ? 'Monthly' : 'Once'}</div></div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:500">${r.title}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:2px">${r.account}${r.amount ? ' · ₹' + r.amount : ''}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button style="background:rgba(0,212,170,0.15);color:var(--accent);border:1px solid rgba(0,212,170,0.3);border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer" onclick="reminderToTxn('${r.id}')">+ Add</button>
        <button style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:18px" onclick="deleteReminder('${r.id}')">🗑</button>
      </div>
    </div>`).join('');
}

function saveReminder() {
  const title     = document.getElementById('remTitle').value.trim();
  const day       = parseInt(document.getElementById('remDay').value);
  const amount    = document.getElementById('remAmount').value;
  const account   = document.getElementById('remAccount').value;
  const recurring = document.getElementById('remRecurring').checked;
  if (!title)                  { showToast('Enter title', 'error'); return; }
  if (!day || day < 1 || day > 31) { showToast('Enter valid day 1-31', 'error'); return; }
  if (!account)                { showToast('Select account', 'error'); return; }
  reminders.push({ id: Date.now().toString(), title, day, amount, account, recurring });
  saveReminders(reminders);
  document.getElementById('remTitle').value  = '';
  document.getElementById('remDay').value    = '';
  document.getElementById('remAmount').value = '';
  renderReminders();
  showToast('Reminder added!', 'success');
}

function deleteReminder(id) {
  showConfirm('Delete reminder?', () => {
    reminders = reminders.filter(r => r.id !== id);
    saveReminders(reminders);
    renderReminders();
    showToast('Deleted', 'success');
  });
}

function reminderToTxn(id) {
  const r = reminders.find(x => x.id === id); if (!r) return;
  showPage('add');
  setTimeout(() => {
    document.getElementById('txnAmount').value = r.amount || '';
    document.getElementById('txnFrom').value   = r.account;
    document.getElementById('txnNotes').value  = r.title;
    showToast('Filled from reminder. Review & save.', 'success');
  }, 150);
}

function checkReminders() {
  const today = new Date().getDate();
  const due = reminders.filter(r => parseInt(r.day) === today);
  const banner = document.getElementById('reminderBanner');
  if (due.length) {
    banner.textContent = `🔔 Due today: ${due.map(r => r.title).join(', ')}`;
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
  checkBudgetAlerts();
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/syndy-wallet/service-worker.js', { scope: '/syndy-wallet/' }).catch(() => {});
  }
  document.getElementById('dashDate').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('reportMonthPicker').value = currentMonth();
  showPage('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
// ============================================================
// PATCH 3 of 3 — app.js additions
//
// TWO CHANGES NEEDED IN EXISTING app.js:
//
// CHANGE A — In showPage() function, add this line after the
//            existing reminders line:
//   if (id === 'budget') renderBudgetPage();
//
// CHANGE B — In checkReminders() function, add this line
//            at the very end of that function (before closing }):
//   checkBudgetAlerts();
//
// CHANGE C — In renderDashboard() function, add this line
//            right after checkReminders(); call:
//   checkBudgetAlerts();
//
// Then APPEND everything below this comment block to the
// END of app.js (before the init function or after it — both work)
// ============================================================


// ── BUDGET STORAGE ────────────────────────────────────────────
// Budget entries stored as: { id, category, subcategory, amount }
// One entry per subcategory. Budgets are month-independent (reuse
// every month). Spent is calculated live from txns for current month.

function loadBudgets()  { try { return JSON.parse(localStorage.getItem('sw_budgets') || '[]'); } catch { return []; } }
function saveBudgets(d) { localStorage.setItem('sw_budgets', JSON.stringify(d)); }

let budgets = loadBudgets();

// ── BUDGET HELPERS ────────────────────────────────────────────
function daysLeftInMonth() {
  const now      = new Date();
  const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

function daysInMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function getSpentBySubcat(month) {
  // Returns { 'Food|Lunch-Outside': 1450, ... }
  const map = {};
  txns.filter(t => t.type === 'Expense' && t.date && t.date.startsWith(month))
      .forEach(t => {
        const key = `${t.category}|${t.subcategory}`;
        map[key] = (map[key] || 0) + (parseFloat(t.amount) || 0);
      });
  return map;
}

function getBudgetStatus(budgeted, spent) {
  // Returns: safe / warn / danger / over
  if (spent >= budgeted)          return 'over';
  const pct = spent / budgeted;
  if (pct >= 0.85)                return 'danger';
  if (pct >= 0.65)                return 'warn';
  return 'safe';
}

function getBudgetBarClass(status) {
  return 'bi-bar-fill ' + status;  // safe / warn / danger / over
}

// ── RENDER BUDGET PAGE ────────────────────────────────────────
function renderBudgetPage() {
  const month     = currentMonth();
  const monthLabel = new Date(month + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  document.getElementById('budgetMonthLabel').textContent = monthLabel;

  const spentMap  = getSpentBySubcat(month);
  const dLeft     = daysLeftInMonth();
  const dTotal    = daysInMonth();

  let totalBudgeted = 0, totalSpent = 0;

  const container = document.getElementById('budgetList');

  if (!budgets.length) {
    container.innerHTML = `
      <div class="budget-empty">
        <div class="icon">🎯</div>
        <p>No budgets set yet.</p>
        <p style="margin-top:6px;font-size:12px;color:var(--text3)">Use the form below to set your first subcategory budget.</p>
      </div>`;
    // Zero out summary
    document.getElementById('bSumTotal').textContent = '₹0';
    document.getElementById('bSumSpent').textContent = '₹0';
    document.getElementById('bSumLeft').textContent  = '₹0';
    document.getElementById('bSumDays').textContent  = dLeft + 'd';
    return;
  }

  // Group budgets by category for organised display
  const grouped = {};
  budgets.forEach(b => {
    if (!grouped[b.category]) grouped[b.category] = [];
    grouped[b.category].push(b);
  });

  let html = '';

  Object.entries(grouped).forEach(([cat, items]) => {
    html += `<div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px;
                         font-weight:600;margin-bottom:8px;margin-top:4px">${cat}</div>`;

    items.forEach(b => {
      const key      = `${b.category}|${b.subcategory}`;
      const spent    = spentMap[key] || 0;
      const budgeted = parseFloat(b.amount) || 0;
      const left     = budgeted - spent;
      const pct      = Math.min((spent / budgeted) * 100, 100).toFixed(1);
      const status   = getBudgetStatus(budgeted, spent);
      const isOver   = status === 'over';

      totalBudgeted += budgeted;
      totalSpent    += spent;

      // Days warning text
      let daysHtml = '';
      if (dLeft <= 5  && !isOver) daysHtml = `<span class="days-danger">⚠ ${dLeft}d left!</span>`;
      else if (dLeft <= 10 && !isOver) daysHtml = `<span class="days-warn">⏱ ${dLeft}d left</span>`;
      else daysHtml = `<span>${dLeft}d left</span>`;

      // Left amount colour
      const leftCol = isOver
        ? 'var(--expense)'
        : status === 'danger' ? '#f97316'
        : status === 'warn'   ? '#fbbf24'
        : 'var(--income)';

      const leftLabel = isOver ? 'OVER BUDGET' : 'Left';

      html += `
        <div class="budget-item ${status}" id="bi-${b.id}">
          <div class="bi-header">
            <div class="bi-labels">
              <div class="bi-cat">${b.category}</div>
              <div class="bi-sub">${b.subcategory}</div>
            </div>
            <div class="bi-right">
              <div class="bi-left-amt" style="color:${leftCol}">
                ${isOver ? '-' : ''}${fmtAmt(Math.abs(left))}
              </div>
              <div class="bi-left-label">${leftLabel}</div>
            </div>
          </div>

          <!-- Squeeze bar -->
          <div class="bi-bar-track">
            <div class="${getBudgetBarClass(status)}" style="width:${pct}%"></div>
          </div>

          <!-- Meta row -->
          <div class="bi-meta">
            <span>Spent: <span class="spent-val">${fmtAmt(spent)}</span> of ${fmtAmt(budgeted)}</span>
            <span>${daysHtml}</span>
          </div>

          <!-- Action row -->
          <div class="bi-footer">
            <span style="font-size:11px;color:var(--text3)">${pct}% used</span>
            <div style="display:flex;gap:4px">
              <button class="bi-edit-btn" onclick="editBudgetEntry('${b.id}')">✏️ Edit</button>
              <button class="bi-del-btn"  onclick="deleteBudgetEntry('${b.id}')">🗑</button>
            </div>
          </div>
        </div>`;
    });
  });

  container.innerHTML = html;

  // Update summary strip
  const totalLeft = totalBudgeted - totalSpent;
  document.getElementById('bSumTotal').textContent = fmtAmt(totalBudgeted);
  document.getElementById('bSumSpent').textContent = fmtAmt(totalSpent);
  document.getElementById('bSumLeft').textContent  = fmtAmt(Math.max(totalLeft, 0));
  document.getElementById('bSumDays').textContent  = dLeft + 'd';
}

// ── BUDGET FORM HELPERS ───────────────────────────────────────
function onBudgetCatChange() {
  const cat = document.getElementById('budgetCatSelect').value;
  const sub = document.getElementById('budgetSubSelect');
  sub.innerHTML = '<option value="">— Select Subcategory —</option>';
  if (!cat || !CATEGORIES.Expense[cat]) return;
  CATEGORIES.Expense[cat].forEach(s => {
    const o = document.createElement('option'); o.value = s; o.textContent = s; sub.appendChild(o);
  });
}

function saveBudgetEntry() {
  const cat    = document.getElementById('budgetCatSelect').value;
  const sub    = document.getElementById('budgetSubSelect').value;
  const amount = parseFloat(document.getElementById('budgetAmount').value);

  if (!cat)              { showToast('Select a category','error');    return; }
  if (!sub)              { showToast('Select a subcategory','error'); return; }
  if (!amount || amount <= 0) { showToast('Enter a valid amount','error'); return; }

  // Check if entry already exists for this subcategory
  const existing = budgets.findIndex(b => b.category === cat && b.subcategory === sub);

  if (existing !== -1) {
    // Update
    budgets[existing].amount = amount;
    showToast(`Updated: ${sub} → ${fmtAmt(amount)}/mo`, 'success');
  } else {
    // New
    budgets.push({ id: Date.now().toString(), category: cat, subcategory: sub, amount });
    showToast(`Budget set: ${sub} → ${fmtAmt(amount)}/mo`, 'success');
  }

  saveBudgets(budgets);

  // Reset form
  document.getElementById('budgetCatSelect').value = '';
  document.getElementById('budgetSubSelect').innerHTML = '<option value="">— Select Subcategory —</option>';
  document.getElementById('budgetAmount').value = '';

  renderBudgetPage();
  checkBudgetAlerts();
}

function editBudgetEntry(id) {
  const b = budgets.find(x => x.id === id);
  if (!b) return;

  document.getElementById('budgetCatSelect').value = b.category;
  onBudgetCatChange();
  setTimeout(() => {
    document.getElementById('budgetSubSelect').value = b.subcategory;
    document.getElementById('budgetAmount').value    = b.amount;
    // Remove old entry so saveBudgetEntry creates fresh (or updates by key match)
    document.getElementById('budgetAmount').scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Edit the amount and save', '');
  }, 80);
}

function deleteBudgetEntry(id) {
  showConfirm('Remove this budget?', () => {
    budgets = budgets.filter(b => b.id !== id);
    saveBudgets(budgets);
    renderBudgetPage();
    checkBudgetAlerts();
    showToast('Budget removed', 'success');
  });
}

function clearAllBudgets() {
  if (!budgets.length) { showToast('No budgets to clear', ''); return; }
  showConfirm(`Clear all ${budgets.length} budget entries?`, () => {
    budgets = [];
    saveBudgets(budgets);
    renderBudgetPage();
    checkBudgetAlerts();
    showToast('All budgets cleared', 'success');
  });
}

// ── DASHBOARD BUDGET ALERT BANNER ────────────────────────────
// Shows on dashboard when any subcategory is >= 70% spent
// or has <= 10 days left and is >= 50% spent

function checkBudgetAlerts() {
  const banner = document.getElementById('budgetAlertBanner');
  if (!banner) return;   // banner not in DOM yet

  if (!budgets.length) { banner.style.display = 'none'; return; }

  const month    = currentMonth();
  const spentMap = getSpentBySubcat(month);
  const dLeft    = daysLeftInMonth();
  const alerts   = [];

  budgets.forEach(b => {
    const key      = `${b.category}|${b.subcategory}`;
    const spent    = spentMap[key] || 0;
    const budgeted = parseFloat(b.amount) || 0;
    if (!budgeted) return;

    const pct    = spent / budgeted;
    const left   = budgeted - spent;
    const isOver = spent >= budgeted;

    if (isOver) {
      alerts.push({ sub: b.subcategory, left, pct, level: 'over' });
    } else if (pct >= 0.85) {
      alerts.push({ sub: b.subcategory, left, pct, level: 'danger' });
    } else if (pct >= 0.70 || (dLeft <= 10 && pct >= 0.50)) {
      alerts.push({ sub: b.subcategory, left, pct, level: 'warn' });
    }
  });

  if (!alerts.length) {
    banner.style.display = 'none';
    return;
  }

  // Sort — over first, then danger, then warn
  const order = { over: 0, danger: 1, warn: 2 };
  alerts.sort((a, b) => order[a.level] - order[b.level]);

  const topAlert = alerts[0];
  const isOver   = topAlert.level === 'over';
  const isDanger = topAlert.level === 'danger';

  let msg = '';
  if (isOver) {
    msg = `🚨 ${topAlert.sub} is OVER budget!`;
  } else {
    msg = `${isDanger ? '🔴' : '🟡'} ${topAlert.sub}: only ${fmtAmt(topAlert.left)} left`;
    if (dLeft <= 10) msg += ` · ${dLeft} days to go`;
  }

  if (alerts.length > 1) msg += `  (+${alerts.length - 1} more)`;

  banner.className   = 'budget-alert-banner' + (isDanger || isOver ? '' : ' warn');
  banner.style.display = 'block';
  banner.textContent   = msg;
  banner.onclick       = () => showPage('budget');
}

// ── MAKE SURE budgets reloads on each session ─────────────────
// (already handled since loadBudgets() runs at top of patch —
//  but reinit here for safety in case patch is appended after init)
if (typeof budgets === 'undefined') {
  var budgets = loadBudgets();
}
