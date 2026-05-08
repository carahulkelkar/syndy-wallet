// ============================================================
// SYNDY WALLET — app.js  V12
// Astral Financial Tracker
// Features: Dashboard · Add/Edit Txn · Entries (account filter
//   + pills + stagger) · Reports · Reminders · Budget (6th tab)
// ============================================================

'use strict';

// ── OPENING BALANCES ──────────────────────────────────────────
const ACCOUNTS = [
  { name:'Cash',              type:'Cash',        balance:984      },
  { name:'ICICI Savings',     type:'Bank',        balance:1110.84  },
  { name:'Kotak Savings',     type:'Bank',        balance:66.01    },
  { name:'Kotak LAS OD',      type:'Liability',   balance:-109433  },
  { name:'Kotak Credit Card', type:'Credit Card', balance:0        }
];

// ── CATEGORY MASTER ───────────────────────────────────────────
const EXP_CATS = ['Food','Grocery','Housing','Utilities','Health','Personal','Lifestyle','Misc'];
const INC_SUBS = ['Salary','Professional Fees','Sav Int-Kotak','Sav Int-ICICI','Bond Interest','Rent-Prathana'];

const CATEGORIES = {
  Expense: {
    Food:      ['BF-Maggie','BF-Milk','BF-Muselli','BF-Eggs','BF-Whey Protein','BF-Coffee','BF-Other',
                'Lunch-Tiffin','Lunch-Outside','Snacks-Biscuits etc','Snacks-Outside','Dinner-Tiffin',
                'Nonveg-Chicken','Nonveg-Mutton'],
    Grocery:   ['Rice Surti-Indra','Dal Toor-Moong','Oil Groundnut','Ghee Govardhan','Salt & Pepper etc',
                'Sugar & Others','Thums Up','Shrikhand','Coconut Water','Amul Masti','Amul Curd',
                'Delivery charges','Fruits-Apple-Banana','Fruits-Others','Salads','Vegetables'],
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

// ── STORAGE ───────────────────────────────────────────────────
function loadTxns()       { try { return JSON.parse(localStorage.getItem('sw_txns')      || '[]'); } catch(e) { return []; } }
function saveTxns(d)      { localStorage.setItem('sw_txns',      JSON.stringify(d)); }
function loadReminders()  { try { return JSON.parse(localStorage.getItem('sw_reminders') || '[]'); } catch(e) { return []; } }
function saveReminders(d) { localStorage.setItem('sw_reminders', JSON.stringify(d)); }
function loadBudgets()    { try { return JSON.parse(localStorage.getItem('sw_budgets')   || '[]'); } catch(e) { return []; } }
function saveBudgets(d)   { localStorage.setItem('sw_budgets',   JSON.stringify(d)); }

let txns      = loadTxns();
let reminders = loadReminders();
let budgets   = loadBudgets();

// ── HELPERS ───────────────────────────────────────────────────
function todayStr()     { return new Date().toISOString().slice(0,10); }
function currentMonth() { return new Date().toISOString().slice(0,7); }

function fmtAmt(n) {
  return '\u20b9' + Math.abs(n).toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:0});
}
function fmtAmtDec(n) {
  return '\u20b9' + Math.abs(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function fmtDate(d) {
  if (!d) return '';
  return new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
}

// ── BALANCE ENGINE ────────────────────────────────────────────
function calcBalances() {
  const bal = {};
  ACCOUNTS.forEach(a => { bal[a.name] = a.balance; });
  txns.forEach(t => {
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

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type) {
  type = type || '';
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + type;
  el.classList.add('show');
  setTimeout(function(){ el.classList.remove('show'); }, 2800);
}

// ── CONFIRM ───────────────────────────────────────────────────
function showConfirm(msg, onYes) {
  document.getElementById('confirmMsg').textContent = msg;
  document.getElementById('confirmDialog').classList.add('open');
  document.getElementById('confirmYes').onclick = function() {
    document.getElementById('confirmDialog').classList.remove('open');
    onYes();
  };
  document.getElementById('confirmNo').onclick = function() {
    document.getElementById('confirmDialog').classList.remove('open');
  };
}

// ── NAVIGATION ────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(function(p)   { p.classList.remove('active'); });
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('page-' + id).classList.add('active');
  document.getElementById('nav-'  + id).classList.add('active');
  if (id === 'dashboard') renderDashboard();
  if (id === 'add')       initAddPage();
  if (id === 'data')      renderTxnCards();
  if (id === 'reports')   renderReports();
  if (id === 'reminders') renderReminders();
  if (id === 'budget')    renderBudgetPage();
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  const bal  = calcBalances();
  const grid = document.getElementById('accountsGrid');
  grid.innerHTML = '';

  // LAS OD — full width red liability
  const odBal = bal['Kotak LAS OD'];
  grid.innerHTML +=
    '<div style="background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.3);border-radius:14px;padding:16px 18px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">' +
      '<div>' +
        '<div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Kotak LAS OD</div>' +
        '<div style="font-size:11px;color:var(--text3)">Liability</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-family:var(--mono);font-size:22px;font-weight:700;color:var(--expense)">-' + fmtAmtDec(Math.abs(odBal)) + '</div>' +
        '<div style="font-size:10px;color:var(--text3);margin-top:2px">Outstanding</div>' +
      '</div>' +
    '</div>';

  // Credit Card
  const ccBal = bal['Kotak Credit Card'];
  const ccCol = ccBal < 0 ? 'var(--expense)' : 'var(--text)';
  grid.innerHTML +=
    '<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 18px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">' +
      '<div>' +
        '<div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Kotak Credit Card</div>' +
        '<div style="font-size:11px;color:var(--text3)">Credit Card</div>' +
      '</div>' +
      '<div style="font-family:var(--mono);font-size:20px;font-weight:700;color:' + ccCol + '">' + (ccBal < 0 ? '-' : '') + fmtAmtDec(Math.abs(ccBal)) + '</div>' +
    '</div>';

  // ICICI + Kotak Savings — 2 column
  const row2 = document.createElement('div');
  row2.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px';
  [['ICICI Savings','var(--accent)'],['Kotak Savings','var(--accent2)']].forEach(function(pair) {
    const name = pair[0], col = pair[1];
    const b   = bal[name];
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px';
    div.innerHTML =
      '<div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">' + name + '</div>' +
      '<div style="font-family:var(--mono);font-size:18px;font-weight:700;color:' + col + '">' + fmtAmtDec(b) + '</div>' +
      '<div style="font-size:10px;color:var(--text3);margin-top:4px">Bank</div>';
    row2.appendChild(div);
  });
  grid.appendChild(row2);

  // Cash
  const cashBal = bal['Cash'];
  grid.innerHTML +=
    '<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
      '<div>' +
        '<div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Cash</div>' +
        '<div style="font-size:11px;color:var(--text3)">In Hand</div>' +
      '</div>' +
      '<div style="font-family:var(--mono);font-size:20px;font-weight:700;color:#f59e0b">' + fmtAmtDec(cashBal) + '</div>' +
    '</div>';

  document.getElementById('balanceDate').textContent =
    'as on ' + new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});

  // Stats
  const today = todayStr(), m = currentMonth();
  let todayExp=0, monthExp=0, monthInc=0;
  txns.forEach(function(t) {
    const a = parseFloat(t.amount)||0;
    if (t.type==='Expense') {
      if (t.date===today)          todayExp += a;
      if (t.date && t.date.startsWith(m)) monthExp += a;
    }
    if (t.type==='Income' && t.date && t.date.startsWith(m)) monthInc += a;
  });
  document.getElementById('statToday').textContent    = fmtAmtDec(todayExp);
  document.getElementById('statMonthExp').textContent = fmtAmtDec(monthExp);
  document.getElementById('statMonthInc').textContent = fmtAmtDec(monthInc);
  document.getElementById('statTotal').textContent    = txns.length;

  // Recent
  const recents = txns.slice().sort(function(a,b){ return new Date(b.date)-new Date(a.date); }).slice(0,15);
  const list = document.getElementById('recentList');
  list.innerHTML = recents.length === 0
    ? '<div class="empty-state"><div class="empty-icon">\uD83D\uDCED</div><p>No transactions yet. Tap + to add one.</p></div>'
    : recents.map(txnRowHTML).join('');

  checkReminders();
  checkBudgetAlerts();
}

function txnRowHTML(t) {
  const icons = { Expense:'\uD83D\uDCB8', Income:'\uD83D\uDCB0', Transfer:'\u21D4' };
  const label = t.type==='Transfer' ? (t.autoName || (t.fromAccount+' \u2192 '+t.toAccount)) : (t.category||'');
  const sub   = t.type==='Transfer' ? 'Transfer' : (t.subcategory||'');
  const acc   = t.type==='Expense'  ? t.fromAccount : t.type==='Income' ? t.toAccount : '';
  const sign  = t.type==='Expense'  ? '-' : t.type==='Income' ? '+' : '';
  const col   = t.type==='Expense'  ? 'var(--expense)' : t.type==='Income' ? 'var(--income)' : 'var(--transfer)';
  return '<div class="txn-item">' +
    '<div class="txn-icon ' + t.type.toLowerCase() + '">' + (icons[t.type]||'') + '</div>' +
    '<div class="txn-details">' +
      '<div class="txn-cat">' + label + (sub?' \u00b7 '+sub:'') + '</div>' +
      '<div class="txn-sub">' + (acc||'') + (t.notes?' \u00b7 '+t.notes:'') + '</div>' +
    '</div>' +
    '<div class="txn-right">' +
      '<div class="txn-amt" style="color:'+col+'">'+sign+fmtAmtDec(parseFloat(t.amount)||0)+'</div>' +
      '<div class="txn-date">'+fmtDate(t.date)+'</div>' +
    '</div>' +
  '</div>';
}

// ── ADD / EDIT TRANSACTION ────────────────────────────────────
let currentType = 'Expense';
let editingId   = null;

function initAddPage(prefill) {
  editingId = null;
  document.getElementById('addPageTitle').textContent = 'Add Transaction';
  document.getElementById('saveTxnBtn').textContent   = '\uD83D\uDCBE Save Transaction';
  document.getElementById('txnDate').value = todayStr();
  const el = document.getElementById('addDateLabel');
  if (el) el.textContent = new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  setType('Expense');
  resetForm();
  if (prefill) applyPrefill(prefill);
}

function setType(type) {
  currentType = type;
  document.querySelectorAll('.type-btn').forEach(function(b) {
    b.classList.remove('active','expense','income','transfer');
    if (b.dataset.type === type) { b.classList.add('active'); b.classList.add(type.toLowerCase()); }
  });
  var isExp = type==='Expense', isInc = type==='Income', isTrf = type==='Transfer';
  document.getElementById('rowFromAccount').style.display   = (isExp||isTrf) ? 'block' : 'none';
  document.getElementById('rowIncomeAccount').style.display = isInc          ? 'block' : 'none';
  document.getElementById('rowToAccount').style.display     = isTrf          ? 'block' : 'none';
  document.getElementById('rowCategory').style.display      = !isTrf         ? 'block' : 'none';
  document.getElementById('rowSubcategory').style.display   = !isTrf         ? 'block' : 'none';

  var catSel = document.getElementById('txnCategory');
  catSel.innerHTML = '<option value="">\u2014 Select Category \u2014</option>';
  if (!isTrf) {
    var cats = isExp ? Object.keys(CATEGORIES.Expense) : Object.keys(CATEGORIES.Income);
    cats.forEach(function(c) {
      var o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o);
    });
  }
  document.getElementById('txnSubcategory').innerHTML = '<option value="">\u2014 Select Subcategory \u2014</option>';

  if (!editingId) {
    setTimeout(function() {
      if (isExp) document.getElementById('txnFrom').value     = 'ICICI Savings';
      if (isInc) document.getElementById('txnToIncome').value = 'Kotak Savings';
    }, 20);
  }
}

function resetForm() {
  document.getElementById('txnAmount').value   = '';
  document.getElementById('txnNotes').value    = '';
  document.getElementById('txnFrom').value     = '';
  document.getElementById('txnTo').value       = '';
  document.getElementById('txnToIncome').value = '';
  document.getElementById('txnCategory').value = '';
  document.getElementById('txnSubcategory').innerHTML = '<option value="">\u2014 Select Subcategory \u2014</option>';
  document.getElementById('nlInput').value     = '';
  document.getElementById('nlPreview').classList.remove('show');
}

function applyPrefill(p) {
  setType(p.type||'Expense');
  document.getElementById('txnDate').value   = p.date   || todayStr();
  document.getElementById('txnAmount').value = p.amount || '';
  document.getElementById('txnNotes').value  = p.notes  || '';
  setTimeout(function() {
    if (p.type==='Expense')  document.getElementById('txnFrom').value       = p.fromAccount||'ICICI Savings';
    if (p.type==='Income')   document.getElementById('txnToIncome').value   = p.toAccount  ||'Kotak Savings';
    if (p.type==='Transfer') {
      document.getElementById('txnFrom').value = p.fromAccount||'';
      document.getElementById('txnTo').value   = p.toAccount  ||'';
    }
    if (p.category) {
      document.getElementById('txnCategory').value = p.category;
      onCategoryChange();
      setTimeout(function() {
        if (p.subcategory) document.getElementById('txnSubcategory').value = p.subcategory;
      }, 80);
    }
  }, 100);
}

function onCategoryChange() {
  var cat  = document.getElementById('txnCategory').value;
  var sub  = document.getElementById('txnSubcategory');
  sub.innerHTML = '<option value="">\u2014 Select Subcategory \u2014</option>';
  if (!cat) return;
  var subs = currentType==='Expense' ? CATEGORIES.Expense[cat] : CATEGORIES.Income[cat];
  if (subs) subs.forEach(function(s) {
    var o = document.createElement('option'); o.value = s; o.textContent = s; sub.appendChild(o);
  });
}

function editTxn(id) {
  var t = null;
  for (var i=0; i<txns.length; i++) { if (txns[i].id===id) { t=txns[i]; break; } }
  if (!t) return;
  editingId = id;
  showPage('add');
  setTimeout(function() {
    document.getElementById('addPageTitle').textContent = 'Edit Transaction';
    document.getElementById('saveTxnBtn').textContent  = '\u270F\uFE0F Update Transaction';
    document.getElementById('txnDate').value           = t.date || todayStr();
    setType(t.type);
    document.getElementById('txnAmount').value = t.amount;
    document.getElementById('txnNotes').value  = t.notes||'';
    setTimeout(function() {
      if (t.type==='Expense')  document.getElementById('txnFrom').value       = t.fromAccount||'';
      if (t.type==='Income')   document.getElementById('txnToIncome').value   = t.toAccount  ||'';
      if (t.type==='Transfer') {
        document.getElementById('txnFrom').value = t.fromAccount||'';
        document.getElementById('txnTo').value   = t.toAccount  ||'';
      }
      if (t.category && t.type!=='Transfer') {
        document.getElementById('txnCategory').value = t.category;
        onCategoryChange();
        setTimeout(function() {
          if (t.subcategory) document.getElementById('txnSubcategory').value = t.subcategory;
        }, 80);
      }
    }, 100);
  }, 60);
}

function saveTxn() {
  var date   = document.getElementById('txnDate').value || todayStr();
  var amount = parseFloat(document.getElementById('txnAmount').value);
  var notes  = document.getElementById('txnNotes').value.trim();
  if (!amount || amount <= 0) { showToast('Enter a valid amount','error'); return; }

  var txn = { date:date, amount:amount, type:currentType, notes:notes };

  if (currentType==='Expense') {
    var from=document.getElementById('txnFrom').value;
    var cat =document.getElementById('txnCategory').value;
    var sub =document.getElementById('txnSubcategory').value;
    if (!from) { showToast('Select From Account','error'); return; }
    if (!cat)  { showToast('Select Category','error');    return; }
    if (!sub)  { showToast('Select Subcategory','error'); return; }
    txn.fromAccount=from; txn.toAccount=''; txn.category=cat; txn.subcategory=sub;

  } else if (currentType==='Income') {
    var to  =document.getElementById('txnToIncome').value;
    var cat2=document.getElementById('txnCategory').value;
    var sub2=document.getElementById('txnSubcategory').value;
    if (!to)   { showToast('Select Account','error');    return; }
    if (!cat2) { showToast('Select Category','error');   return; }
    if (!sub2) { showToast('Select Subcategory','error');return; }
    txn.fromAccount=''; txn.toAccount=to; txn.category=cat2; txn.subcategory=sub2;

  } else {
    var fr=document.getElementById('txnFrom').value;
    var to2=document.getElementById('txnTo').value;
    if (!fr)       { showToast('Select From Account','error'); return; }
    if (!to2)      { showToast('Select To Account','error');   return; }
    if (fr===to2)  { showToast('From and To cannot be same','error'); return; }
    txn.fromAccount=fr; txn.toAccount=to2;
    txn.category='Internal'; txn.subcategory='';
    txn.autoName=fr+' \u2192 '+to2;
  }

  if (editingId) {
    txn.id = editingId;
    for (var i=0; i<txns.length; i++) {
      if (txns[i].id===editingId) { txns[i]=txn; break; }
    }
    showToast('\u2713 Updated!','success');
    editingId = null;
    document.getElementById('addPageTitle').textContent = 'Add Transaction';
    document.getElementById('saveTxnBtn').textContent   = '\uD83D\uDCBE Save Transaction';
  } else {
    txn.id = Date.now().toString();
    txns.push(txn);
    showToast('\u2713 Saved!','success');
  }

  saveTxns(txns);
  resetForm();
  renderDashboard();
}

// ── AI QUICK ENTRY ────────────────────────────────────────────
async function parseNL() {
  var text = document.getElementById('nlInput').value.trim();
  if (!text) { showToast('Type something first','error'); return; }
  document.getElementById('aiLoading').style.display = 'flex';
  document.getElementById('nlPreview').classList.remove('show');

  var expCats = Object.entries(CATEGORIES.Expense).map(function(e){ return e[0]+': '+e[1].join(', '); }).join('\n');
  var prompt = 'Parse this personal finance entry. Return ONLY valid JSON, no other text.\n' +
    'Entry: "' + text + '"\nToday: ' + todayStr() + '\n' +
    'Accounts: Cash, ICICI Savings, Kotak Savings, Kotak LAS OD, Kotak Credit Card\n' +
    'Expense categories:\n' + expCats + '\n' +
    'Income subcategories: Rent-Prathana, Salary, Professional Fees, Sav Int-Kotak, Sav Int-ICICI, Bond Interest\n' +
    'Rules: type=Expense|Income|Transfer. Default expense account: ICICI Savings. Default income account: Kotak Savings.\n' +
    'Return: {"type":"","amount":0,"fromAccount":"","toAccount":"","category":"","subcategory":"","notes":"","confidence":"high"}';

  try {
    var res  = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:300, messages:[{role:'user',content:prompt}] })
    });
    var data = await res.json();
    var m    = ((data.content && data.content[0] && data.content[0].text)||'').match(/\{[\s\S]*\}/);
    if (m) showNLPreview(JSON.parse(m[0]));
    else   showToast('Could not parse. Fill manually.','error');
  } catch(e) { showToast('AI error. Fill manually.','error'); }
  document.getElementById('aiLoading').style.display = 'none';
}

function showNLPreview(p) {
  var el = document.getElementById('nlPreview');
  el.innerHTML = '<div class="nl-preview-title">\u2728 AI Detected</div>' +
    '<div class="nl-preview-grid">' +
      '<div class="nl-preview-item"><span>Type</span> '+(p.type||'\u2014')+'</div>' +
      '<div class="nl-preview-item"><span>Amount</span> '+(p.amount?'\u20b9'+p.amount:'\u2014')+'</div>' +
      '<div class="nl-preview-item"><span>Account</span> '+(p.fromAccount||p.toAccount||'\u2014')+'</div>' +
      '<div class="nl-preview-item"><span>Category</span> '+(p.category||'\u2014')+'</div>' +
      '<div class="nl-preview-item"><span>Sub</span> '+(p.subcategory||'\u2014')+'</div>' +
      '<div class="nl-preview-item"><span>Confidence</span> '+(p.confidence||'\u2014')+'</div>' +
    '</div>' +
    '<button class="btn btn-primary" style="margin-top:12px;padding:10px" onclick="applyNL(' + JSON.stringify(p).replace(/'/g,"&#39;") + ')">Apply \u2713</button>';
  el.classList.add('show');
}

function applyNL(p) {
  setType(p.type||'Expense');
  document.getElementById('txnAmount').value = p.amount||'';
  document.getElementById('txnNotes').value  = p.notes ||'';
  setTimeout(function() {
    if (p.type==='Expense')  document.getElementById('txnFrom').value       = p.fromAccount||'ICICI Savings';
    if (p.type==='Income')   document.getElementById('txnToIncome').value   = p.toAccount  ||'Kotak Savings';
    if (p.type==='Transfer') {
      document.getElementById('txnFrom').value = p.fromAccount||'';
      document.getElementById('txnTo').value   = p.toAccount  ||'';
    }
    if (p.category) {
      document.getElementById('txnCategory').value = p.category;
      onCategoryChange();
      setTimeout(function() { if(p.subcategory) document.getElementById('txnSubcategory').value=p.subcategory; }, 60);
    }
  }, 80);
  document.getElementById('nlPreview').classList.remove('show');
  showToast('Applied! Review and save.','success');
}

// ── ENTRIES / TRANSACTIONS PAGE ───────────────────────────────
function setAccountPill(el, acct) {
  document.querySelectorAll('.acct-pill').forEach(function(p){ p.classList.remove('active'); });
  el.classList.add('active');
  var dd = document.getElementById('dataFilterAccount');
  if (dd) dd.value = acct;
  renderTxnCards();
}

function syncPillFromDropdown() {
  var acct = document.getElementById('dataFilterAccount').value;
  document.querySelectorAll('.acct-pill').forEach(function(p){
    p.classList.toggle('active', p.dataset.acct === acct);
  });
}

function renderTxnCards() {
  var search = document.getElementById('dataSearch').value.toLowerCase();
  var fType  = document.getElementById('dataFilterType').value;
  var fMonth = document.getElementById('dataFilterMonth').value;
  var fAcct  = (document.getElementById('dataFilterAccount')||{value:''}).value || '';

  var filtered = txns.slice().sort(function(a,b){ return new Date(b.date)-new Date(a.date); });
  if (fType)  filtered = filtered.filter(function(t){ return t.type===fType; });
  if (fMonth) filtered = filtered.filter(function(t){ return t.date && t.date.startsWith(fMonth); });
  if (fAcct)  filtered = filtered.filter(function(t){ return t.fromAccount===fAcct || t.toAccount===fAcct; });
  if (search) filtered = filtered.filter(function(t){
    return [t.category,t.subcategory,t.fromAccount,t.toAccount,t.notes,t.type].join(' ').toLowerCase().indexOf(search) !== -1;
  });

  // Count label
  var countEl = document.getElementById('txnCountLabel');
  if (countEl) {
    var total    = filtered.length;
    var totalExp = 0;
    filtered.filter(function(t){ return t.type==='Expense'; }).forEach(function(t){ totalExp += parseFloat(t.amount)||0; });
    countEl.textContent = total
      ? total + ' transaction' + (total>1?'s':'') + (fAcct?' \u00b7 '+fAcct:'') + (totalExp?'  |  Exp: '+fmtAmt(totalExp):'')
      : '';
  }

  var container = document.getElementById('txnCardList');
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">\uD83D\uDCED</div><p>No transactions found.</p></div>';
    return;
  }

  var icons = { Expense:'\uD83D\uDCB8', Income:'\uD83D\uDCB0', Transfer:'\u21D4\uFE0F' };
  container.innerHTML = filtered.map(function(t, idx) {
    var isExp = t.type==='Expense', isInc = t.type==='Income', isTrf = t.type==='Transfer';
    var sign  = isExp?'-':isInc?'+':'';
    var col   = isExp?'var(--expense)':isInc?'var(--income)':'var(--transfer)';
    var label = isTrf ? (t.autoName||(t.fromAccount+' \u2192 '+t.toAccount)) : (t.category||'');
    var sub   = isTrf ? '' : (t.subcategory||'');
    var badge = isExp  ? (t.fromAccount||'')
              : isInc  ? (t.toAccount  ||'')
              : (t.fromAccount||'') + ' \u2192 ' + (t.toAccount||'');
    var delay = Math.min(idx*35, 300);
    return '<div class="txn-card" id="tc-'+t.id+'" style="animation-delay:'+delay+'ms">' +
      '<div class="txn-card-main" onclick="toggleTxnActions(\''+t.id+'\')">' +
        '<div class="txn-card-icon '+t.type.toLowerCase()+'">'+(icons[t.type]||'')+'</div>' +
        '<div class="txn-card-body">' +
          '<div class="txn-card-label">'+label+(sub?' \u00b7 '+sub:'')+'</div>' +
          '<div class="txn-card-sub">'+(t.notes||'')+'</div>' +
          '<span class="txn-acct-badge">'+badge+'</span>' +
        '</div>' +
        '<div class="txn-card-right">' +
          '<div class="txn-card-amt" style="color:'+col+'">'+sign+fmtAmtDec(parseFloat(t.amount)||0)+'</div>' +
          '<div class="txn-card-date">'+fmtDate(t.date)+'</div>' +
          '<div class="txn-card-chevron" id="chev-'+t.id+'">\u203a</div>' +
        '</div>' +
      '</div>' +
      '<div class="txn-card-actions" id="act-'+t.id+'" style="display:none">' +
        '<button class="txn-act-btn edit"   onclick="editTxn(\''+t.id+'\')">\u270F\uFE0F Edit</button>' +
        '<button class="txn-act-btn delete" onclick="deleteTxn(\''+t.id+'\')">\uD83D\uDDD1 Delete</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function toggleTxnActions(id) {
  var actEl  = document.getElementById('act-'  + id);
  var chevEl = document.getElementById('chev-' + id);
  var isOpen = actEl.style.display !== 'none';
  document.querySelectorAll('.txn-card-actions').forEach(function(el){ el.style.display='none'; });
  document.querySelectorAll('.txn-card-chevron').forEach(function(el){ el.textContent='\u203a'; el.style.transform=''; });
  if (!isOpen) {
    actEl.style.display    = 'flex';
    chevEl.style.transform = 'rotate(90deg)';
  }
}

function deleteTxn(id) {
  showConfirm('Delete this transaction?', function() {
    txns = txns.filter(function(t){ return t.id!==id; });
    saveTxns(txns);
    renderTxnCards();
    renderDashboard();
    showToast('Deleted','success');
  });
}

function deleteByRange() {
  var f=document.getElementById('manageFrom').value, t2=document.getElementById('manageTo').value;
  if (!f||!t2) { showToast('Select both dates','error'); return; }
  var count = txns.filter(function(x){ return x.date>=f && x.date<=t2; }).length;
  if (!count)  { showToast('No transactions in that range','error'); return; }
  showConfirm('Delete '+count+' transaction'+(count>1?'s':'')+' from '+fmtDate(f)+' to '+fmtDate(t2)+'?', function() {
    txns = txns.filter(function(x){ return !(x.date>=f && x.date<=t2); });
    saveTxns(txns); renderTxnCards(); renderDashboard();
    showToast('Deleted '+count,'success');
  });
}

// ── EXPORT ────────────────────────────────────────────────────
function getExportData() {
  var f=document.getElementById('manageFrom').value, t2=document.getElementById('manageTo').value;
  return (f&&t2) ? txns.filter(function(x){ return x.date>=f && x.date<=t2; }) : txns;
}
function dl(content, filename, mime) {
  var a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type:mime}));
  a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function exportCSV() {
  var data=getExportData();
  if (!data.length){ showToast('No data to export','error'); return; }
  var h=['Date','Type','Amount','From','To','Category','Subcategory','Notes'];
  var rows=data.map(function(t){ return [t.date,t.type,t.amount,t.fromAccount||'',t.toAccount||'',t.category||'',t.subcategory||'',t.notes||'']; });
  var csv=[h].concat(rows).map(function(r){ return r.map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
  dl(csv,'syndy-export.csv','text/csv');
  showToast('CSV downloaded!','success');
}
function exportExcel() {
  var data=getExportData();
  if (!data.length){ showToast('No data to export','error'); return; }
  var h=['Date','Type','Amount','From','To','Category','Subcategory','Notes'];
  var rows=data.map(function(t){ return [t.date,t.type,t.amount,t.fromAccount||'',t.toAccount||'',t.category||'',t.subcategory||'',t.notes||'']; });
  dl([h].concat(rows).map(function(r){ return r.join('\t'); }).join('\n'),'syndy-export.xls','application/vnd.ms-excel');
  showToast('Excel downloaded!','success');
}

// ── REPORTS ───────────────────────────────────────────────────
function renderReports() {
  var picker=document.getElementById('reportMonthPicker');
  if (!picker.value) picker.value=currentMonth();
  var m=picker.value;
  var label=new Date(m+'-01').toLocaleString('en-IN',{month:'long',year:'numeric'});
  document.getElementById('ledgerTitle').textContent='Income & Expenditure \u2014 '+label;
  var filtered=txns.filter(function(t){ return t.date && t.date.startsWith(m); });

  var expMap={};
  filtered.filter(function(t){ return t.type==='Expense'; }).forEach(function(t){
    expMap[t.category]=(expMap[t.category]||0)+(parseFloat(t.amount)||0);
  });
  var totalExp=0;
  document.getElementById('ledgerExpenses').innerHTML=EXP_CATS.map(function(cat){
    var val=expMap[cat]||0; totalExp+=val;
    var disp=val===0?'<span style="color:var(--text3)">\u2014</span>':'<span style="color:var(--expense);font-family:var(--mono)">'+fmtAmt(val)+'</span>';
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;cursor:pointer" onclick="drillCat(\''+cat+'\')">' +
      '<span style="font-size:12px;color:var(--text)">'+cat+'</span>'+disp+'</div>';
  }).join('');
  document.getElementById('ledgerTotalExp').textContent=fmtAmt(totalExp);

  var incMap={};
  filtered.filter(function(t){ return t.type==='Income'; }).forEach(function(t){
    incMap[t.subcategory]=(incMap[t.subcategory]||0)+(parseFloat(t.amount)||0);
  });
  var totalInc=0;
  document.getElementById('ledgerIncome').innerHTML=INC_SUBS.map(function(sub){
    var val=incMap[sub]||0; totalInc+=val;
    var disp=val===0?'<span style="color:var(--text3)">\u2014</span>':'<span style="color:var(--income);font-family:var(--mono)">'+fmtAmt(val)+'</span>';
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0">' +
      '<span style="font-size:12px;color:var(--text)">'+sub+'</span>'+disp+'</div>';
  }).join('');
  document.getElementById('ledgerTotalInc').textContent=fmtAmt(totalInc);

  var maxVal=Math.max.apply(null, EXP_CATS.map(function(c){ return expMap[c]||0; }).concat([1]));
  document.getElementById('catChart').innerHTML=EXP_CATS.map(function(cat){
    var val=expMap[cat]||0; var pct=(val/maxVal*100).toFixed(1);
    return '<div style="margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:4px">' +
        '<span style="font-size:12px;color:var(--text)">'+cat+'</span>' +
        '<span style="font-family:var(--mono);font-size:12px;color:'+(val?'var(--expense)':'var(--text3)')+'">'+( val?fmtAmt(val):'\u2014')+'</span>' +
      '</div>' +
      '<div style="height:7px;background:var(--bg3);border-radius:4px;overflow:hidden">' +
        '<div style="height:100%;width:'+pct+'%;background:var(--accent);border-radius:4px;transition:width 0.5s ease"></div>' +
      '</div></div>';
  }).join('');

  document.getElementById('reportCatSelect').value='';
  document.getElementById('categoryDetailsList').innerHTML='<p style="font-size:13px;color:var(--text3)">Select a category above to see subcategory breakdown.</p>';
}

function drillCat(cat) {
  document.getElementById('reportCatSelect').value=cat;
  renderCategoryDetails();
  document.getElementById('reportCatSelect').scrollIntoView({behavior:'smooth',block:'start'});
}

function renderCategoryDetails() {
  var cat=document.getElementById('reportCatSelect').value;
  var container=document.getElementById('categoryDetailsList');
  if (!cat){ container.innerHTML='<p style="font-size:13px;color:var(--text3)">Select a category above.</p>'; return; }
  var m=document.getElementById('reportMonthPicker').value||currentMonth();
  var filtered=txns.filter(function(t){ return t.date && t.date.startsWith(m) && t.type==='Expense' && t.category===cat; });
  var subMap={};
  filtered.forEach(function(t){
    var s=t.subcategory||'Other';
    if (!subMap[s]) subMap[s]={total:0,entries:[]};
    subMap[s].total+=parseFloat(t.amount)||0; subMap[s].entries.push(t);
  });
  var sorted=Object.entries(subMap).sort(function(a,b){ return b[1].total-a[1].total; });
  var catTotal=sorted.reduce(function(s,e){ return s+e[1].total; },0);
  var maxV=(sorted[0]&&sorted[0][1].total)||1;
  if (!sorted.length){ container.innerHTML='<p style="font-size:13px;color:var(--text3)">No expenses for '+cat+' this month.</p>'; return; }
  container.innerHTML=
    '<div style="display:flex;justify-content:space-between;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border)">' +
      '<span style="font-size:13px;font-weight:600">'+cat+'</span>' +
      '<span style="font-family:var(--mono);font-size:15px;font-weight:700;color:var(--expense)">-'+fmtAmtDec(catTotal)+'</span>' +
    '</div>' +
    sorted.map(function(e){
      var sub=e[0], data=e[1];
      return '<div style="margin-bottom:14px">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:4px">' +
          '<span style="font-size:13px">'+sub+'</span>' +
          '<span style="font-family:var(--mono);font-size:12px;color:var(--expense)">-'+fmtAmt(data.total)+'</span>' +
        '</div>' +
        '<div style="height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;margin-bottom:6px">' +
          '<div style="height:100%;width:'+(data.total/maxV*100).toFixed(1)+'%;background:var(--accent2);border-radius:3px"></div>' +
        '</div>' +
        '<div style="padding-left:8px;border-left:2px solid var(--border)">' +
          data.entries.slice().sort(function(a,b){ return new Date(b.date)-new Date(a.date); }).map(function(t){
            return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,58,0.4)">' +
              '<span style="font-size:11px;color:var(--text2)">'+fmtDate(t.date)+(t.notes?' \u00b7 '+t.notes:'')+'</span>' +
              '<div style="display:flex;gap:8px;align-items:center">' +
                '<span style="font-family:var(--mono);font-size:11px">\u20b9'+( parseFloat(t.amount)||0).toLocaleString('en-IN')+'</span>' +
                '<button onclick="editTxn(\''+t.id+'\')" style="background:none;border:none;cursor:pointer;color:var(--accent);font-size:13px;padding:0">\u270F\uFE0F</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }).join('');
}

// ── REMINDERS ─────────────────────────────────────────────────
function renderReminders() {
  var list=document.getElementById('reminderList');
  if (!reminders.length){ list.innerHTML='<div class="empty-state"><div class="empty-icon">\uD83D\uDD14</div><p>No reminders yet</p></div>'; return; }
  list.innerHTML=reminders.slice().sort(function(a,b){ return (a.day||0)-(b.day||0); }).map(function(r){
    return '<div class="reminder-item">' +
      '<div class="reminder-day"><div class="day-num">'+r.day+'</div><div class="day-label">'+(r.recurring?'Monthly':'Once')+'</div></div>' +
      '<div style="flex:1"><div style="font-size:14px;font-weight:500">'+r.title+'</div>' +
      '<div style="font-size:12px;color:var(--text2);margin-top:2px">'+r.account+(r.amount?' \u00b7 \u20b9'+r.amount:'')+'</div></div>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
        '<button onclick="reminderToTxn(\''+r.id+'\')" style="background:rgba(0,212,170,0.15);color:var(--accent);border:1px solid rgba(0,212,170,0.3);border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer">+ Add</button>' +
        '<button onclick="deleteReminder(\''+r.id+'\')" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:18px">\uD83D\uDDD1</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function saveReminder() {
  var title=document.getElementById('remTitle').value.trim();
  var day=parseInt(document.getElementById('remDay').value);
  var amount=document.getElementById('remAmount').value;
  var account=document.getElementById('remAccount').value;
  var recurring=document.getElementById('remRecurring').checked;
  if (!title)             { showToast('Enter title','error');          return; }
  if (!day||day<1||day>31){ showToast('Enter valid day 1-31','error'); return; }
  if (!account)           { showToast('Select account','error');       return; }
  reminders.push({id:Date.now().toString(),title:title,day:day,amount:amount,account:account,recurring:recurring});
  saveReminders(reminders);
  document.getElementById('remTitle').value='';
  document.getElementById('remDay').value='';
  document.getElementById('remAmount').value='';
  renderReminders();
  showToast('Reminder added!','success');
}

function deleteReminder(id) {
  showConfirm('Delete reminder?', function(){
    reminders=reminders.filter(function(r){ return r.id!==id; });
    saveReminders(reminders); renderReminders(); showToast('Deleted','success');
  });
}

function reminderToTxn(id) {
  var r=null; for(var i=0;i<reminders.length;i++){ if(reminders[i].id===id){r=reminders[i];break;} }
  if (!r) return;
  showPage('add');
  setTimeout(function(){
    document.getElementById('txnAmount').value=r.amount||'';
    document.getElementById('txnFrom').value=r.account;
    document.getElementById('txnNotes').value=r.title;
    showToast('Filled from reminder. Review & save.','success');
  },150);
}

function checkReminders() {
  var today=new Date().getDate();
  var due=reminders.filter(function(r){ return parseInt(r.day)===today; });
  var banner=document.getElementById('reminderBanner');
  if (!banner) return;
  if (due.length){
    banner.textContent='\uD83D\uDD14 Due today: '+due.map(function(r){ return r.title; }).join(', ');
    banner.style.display='block';
  } else {
    banner.style.display='none';
  }
}

// ── BUDGET ────────────────────────────────────────────────────
function daysLeftInMonth() {
  var now=new Date();
  return new Date(now.getFullYear(),now.getMonth()+1,0).getDate()-now.getDate();
}
function getSpentBySubcat(month) {
  var map={};
  txns.filter(function(t){ return t.type==='Expense' && t.date && t.date.startsWith(month); }).forEach(function(t){
    var key=t.category+'|'+t.subcategory;
    map[key]=(map[key]||0)+(parseFloat(t.amount)||0);
  });
  return map;
}
function getBudgetStatus(budgeted, spent) {
  if (spent>=budgeted) return 'over';
  var pct=spent/budgeted;
  if (pct>=0.85) return 'danger';
  if (pct>=0.65) return 'warn';
  return 'safe';
}

function renderBudgetPage() {
  var month=currentMonth();
  var monthLabel=new Date(month+'-01').toLocaleString('en-IN',{month:'long',year:'numeric'});
  document.getElementById('budgetMonthLabel').textContent=monthLabel;
  var spentMap=getSpentBySubcat(month);
  var dLeft=daysLeftInMonth();
  var container=document.getElementById('budgetList');

  if (!budgets.length){
    container.innerHTML='<div class="empty-state"><div class="empty-icon">\uD83C\uDFAF</div><p>No budgets set yet.</p><p style="margin-top:6px;font-size:12px;color:var(--text3)">Use the form below to set your first subcategory budget.</p></div>';
    document.getElementById('bSumTotal').textContent='\u20b90';
    document.getElementById('bSumSpent').textContent='\u20b90';
    document.getElementById('bSumLeft').textContent ='\u20b90';
    document.getElementById('bSumDays').textContent =dLeft+'d';
    return;
  }

  var grouped={};
  budgets.forEach(function(b){ if (!grouped[b.category]) grouped[b.category]=[]; grouped[b.category].push(b); });

  var totalBudgeted=0, totalSpent=0, html='';

  Object.entries(grouped).forEach(function(entry){
    var cat=entry[0], items=entry[1];
    html+='<div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px;font-weight:600;margin-bottom:8px;margin-top:4px">'+cat+'</div>';
    items.forEach(function(b){
      var key=b.category+'|'+b.subcategory;
      var spent=spentMap[key]||0;
      var budgeted=parseFloat(b.amount)||0;
      var left=budgeted-spent;
      var pct=Math.min((spent/budgeted)*100,100).toFixed(1);
      var status=getBudgetStatus(budgeted,spent);
      var isOver=status==='over';
      totalBudgeted+=budgeted; totalSpent+=spent;

      var daysHtml='';
      if (dLeft<=5 && !isOver)       daysHtml='<span class="days-danger">\u26A0 '+dLeft+'d left!</span>';
      else if (dLeft<=10 && !isOver) daysHtml='<span class="days-warn">\u23F1 '+dLeft+'d left</span>';
      else                           daysHtml='<span>'+dLeft+'d left</span>';

      var leftCol=isOver?'var(--expense)':status==='danger'?'#f97316':status==='warn'?'#fbbf24':'var(--income)';
      var leftLabel=isOver?'OVER BUDGET':'Left';

      html+='<div class="budget-item '+status+'" id="bi-'+b.id+'">' +
        '<div class="bi-header">' +
          '<div class="bi-labels"><div class="bi-cat">'+b.category+'</div><div class="bi-sub">'+b.subcategory+'</div></div>' +
          '<div class="bi-right">' +
            '<div class="bi-left-amt" style="color:'+leftCol+'">'+(isOver?'-':'')+fmtAmt(Math.abs(left))+'</div>' +
            '<div class="bi-left-label">'+leftLabel+'</div>' +
          '</div>' +
        '</div>' +
        '<div class="bi-bar-track"><div class="bi-bar-fill '+status+'" style="width:'+pct+'%"></div></div>' +
        '<div class="bi-meta">' +
          '<span>Spent: <span class="spent-val">'+fmtAmt(spent)+'</span> of '+fmtAmt(budgeted)+'</span>' +
          '<span>'+daysHtml+'</span>' +
        '</div>' +
        '<div class="bi-footer">' +
          '<span style="font-size:11px;color:var(--text3)">'+pct+'% used</span>' +
          '<div style="display:flex;gap:4px">' +
            '<button class="bi-edit-btn" onclick="editBudgetEntry(\''+b.id+'\')">\u270F\uFE0F Edit</button>' +
            '<button class="bi-del-btn"  onclick="deleteBudgetEntry(\''+b.id+'\')">\uD83D\uDDD1</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    });
  });

  container.innerHTML=html;
  var totalLeft=totalBudgeted-totalSpent;
  document.getElementById('bSumTotal').textContent=fmtAmt(totalBudgeted);
  document.getElementById('bSumSpent').textContent=fmtAmt(totalSpent);
  document.getElementById('bSumLeft').textContent =fmtAmt(Math.max(totalLeft,0));
  document.getElementById('bSumDays').textContent =dLeft+'d';
}

function onBudgetCatChange() {
  var cat=document.getElementById('budgetCatSelect').value;
  var sub=document.getElementById('budgetSubSelect');
  sub.innerHTML='<option value="">\u2014 Select Subcategory \u2014</option>';
  if (!cat || !CATEGORIES.Expense[cat]) return;
  CATEGORIES.Expense[cat].forEach(function(s){ var o=document.createElement('option'); o.value=s; o.textContent=s; sub.appendChild(o); });
}

function saveBudgetEntry() {
  var cat   =document.getElementById('budgetCatSelect').value;
  var sub   =document.getElementById('budgetSubSelect').value;
  var amount=parseFloat(document.getElementById('budgetAmount').value);
  if (!cat)               { showToast('Select a category','error');    return; }
  if (!sub)               { showToast('Select a subcategory','error'); return; }
  if (!amount||amount<=0) { showToast('Enter a valid amount','error'); return; }
  var existing=-1;
  for(var i=0;i<budgets.length;i++){ if(budgets[i].category===cat && budgets[i].subcategory===sub){ existing=i; break; } }
  if (existing!==-1) {
    budgets[existing].amount=amount;
    showToast('Updated: '+sub+' \u2192 '+fmtAmt(amount)+'/mo','success');
  } else {
    budgets.push({id:Date.now().toString(),category:cat,subcategory:sub,amount:amount});
    showToast('Budget set: '+sub+' \u2192 '+fmtAmt(amount)+'/mo','success');
  }
  saveBudgets(budgets);
  document.getElementById('budgetCatSelect').value='';
  document.getElementById('budgetSubSelect').innerHTML='<option value="">\u2014 Select Subcategory \u2014</option>';
  document.getElementById('budgetAmount').value='';
  renderBudgetPage();
  checkBudgetAlerts();
}

function editBudgetEntry(id) {
  var b=null; for(var i=0;i<budgets.length;i++){ if(budgets[i].id===id){b=budgets[i];break;} }
  if (!b) return;
  document.getElementById('budgetCatSelect').value=b.category;
  onBudgetCatChange();
  setTimeout(function(){
    document.getElementById('budgetSubSelect').value=b.subcategory;
    document.getElementById('budgetAmount').value=b.amount;
    document.getElementById('budgetAmount').scrollIntoView({behavior:'smooth',block:'center'});
    showToast('Edit the amount and save','');
  },80);
}

function deleteBudgetEntry(id) {
  showConfirm('Remove this budget?', function(){
    budgets=budgets.filter(function(b){ return b.id!==id; });
    saveBudgets(budgets); renderBudgetPage(); checkBudgetAlerts();
    showToast('Budget removed','success');
  });
}

function clearAllBudgets() {
  if (!budgets.length){ showToast('No budgets to clear',''); return; }
  showConfirm('Clear all '+budgets.length+' budget entries?', function(){
    budgets=[]; saveBudgets(budgets); renderBudgetPage(); checkBudgetAlerts();
    showToast('All budgets cleared','success');
  });
}

function checkBudgetAlerts() {
  var banner=document.getElementById('budgetAlertBanner');
  if (!banner) return;
  if (!budgets.length){ banner.style.display='none'; return; }
  var month=currentMonth(), spentMap=getSpentBySubcat(month), dLeft=daysLeftInMonth(), alerts=[];
  budgets.forEach(function(b){
    var key=b.category+'|'+b.subcategory;
    var spent=spentMap[key]||0, budgeted=parseFloat(b.amount)||0;
    if (!budgeted) return;
    var pct=spent/budgeted, left=budgeted-spent;
    if (spent>=budgeted)                       alerts.push({sub:b.subcategory,left:left,pct:pct,level:'over'});
    else if (pct>=0.85)                        alerts.push({sub:b.subcategory,left:left,pct:pct,level:'danger'});
    else if (pct>=0.70||(dLeft<=10&&pct>=0.50)) alerts.push({sub:b.subcategory,left:left,pct:pct,level:'warn'});
  });
  if (!alerts.length){ banner.style.display='none'; return; }
  var order={over:0,danger:1,warn:2};
  alerts.sort(function(a,b){ return order[a.level]-order[b.level]; });
  var top=alerts[0], isOver=top.level==='over', isDanger=top.level==='danger';
  var msg=isOver?'\uD83D\uDEA8 '+top.sub+' is OVER budget!'
    :(isDanger?'\uD83D\uDD34':'\uD83D\uDFE1')+' '+top.sub+': only '+fmtAmt(top.left)+' left'+(dLeft<=10?' \u00b7 '+dLeft+' days to go':'');
  if (alerts.length>1) msg+='  (+'+(alerts.length-1)+' more)';
  banner.className='budget-alert-banner'+(isDanger||isOver?'':' warn');
  banner.style.display='block';
  banner.textContent=msg;
  banner.onclick=function(){ showPage('budget'); };
}

// ── SERVICE WORKER ────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js', { scope: '/syndy-wallet/' })
      .catch(function(e){ console.log('SW:', e); });
  });
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  document.getElementById('dashDate').textContent =
    new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  document.getElementById('reportMonthPicker').value = currentMonth();
  showPage('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
