// ============================================================
// SYNDY WALLET — app.js  v14
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

// ── V13 HARD RESET GUARD ─────────────────────────────────────
// This runs ONCE per device using a version stamp in localStorage.
// On first load of V13, it wipes ALL pre-June-2026 checkpoints and
// ALL transactions older than 2026-06-01 so old May data is gone.
// June-2026-onwards checkpoints and transactions are preserved.
// After running, stamps 'sw_v13_migrated' so it never runs again.
(function v13HardReset() {
  try {
    if (localStorage.getItem('sw_v13_migrated') === '1') return;

    // 1. Wipe all pre-June checkpoints
    const rawCp = localStorage.getItem('sw_checkpoints');
    if (rawCp) {
      const allCp = JSON.parse(rawCp);
      Object.keys(allCp).forEach(k => { if (k < '2026-06') delete allCp[k]; });
      if (!Object.keys(allCp).length) localStorage.removeItem('sw_checkpoints');
      else localStorage.setItem('sw_checkpoints', JSON.stringify(allCp));
    }

    // 2. Wipe all transactions before June 2026
    const rawTx = localStorage.getItem('sw_txns');
    if (rawTx) {
      const txns = JSON.parse(rawTx);
      const kept = txns.filter(t => t.date && t.date >= '2026-06-01');
      localStorage.setItem('sw_txns', JSON.stringify(kept));
    }

    // 3. Stamp — never run again on this device
    localStorage.setItem('sw_v13_migrated', '1');
  } catch(e) {}
})();

// ── JUNE 2026 DATA RESTORE ─────────────────────────────────────
// Restores all 154 June 2026 transactions lost in the file/virus
// incident on 30 June 2026. Runs ONCE per device — safe to redeploy.
// After injection, stamps sw_june_restored=1 and never runs again.
(function restoreJuneData() {
  try {
    if (localStorage.getItem('sw_june_restored') === '1') return;
    const raw = localStorage.getItem('sw_txns');
    const existing = raw ? JSON.parse(raw) : [];
    const hasJune = existing.some(t => t.date && t.date.startsWith('2026-06'));
    if (hasJune) {
      localStorage.setItem('sw_june_restored', '1');
      return;
    }
    const juneTxns = [{"id": "0cedac94-e8bd-4e6f-9adb-6f4dfef6519f", "date": "2026-06-01", "type": "Expense", "amount": 238.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "BF-Milk", "notes": ""}, {"id": "d2215597-eba4-417a-b2d0-17e103174654", "date": "2026-06-01", "type": "Expense", "amount": 155.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Thums Up", "notes": ""}, {"id": "a11ecc6d-0c17-453d-a2d6-890175e0c6ea", "date": "2026-06-01", "type": "Expense", "amount": 140.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Coconut Water", "notes": ""}, {"id": "7e2d4bb5-8f6e-4137-8bde-e3f24cf89927", "date": "2026-06-01", "type": "Expense", "amount": 113.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "BF-Eggs", "notes": ""}, {"id": "5440618c-2e39-4e0e-ba91-db2ad0e14e79", "date": "2026-06-01", "type": "Expense", "amount": 114.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Sugar & Others", "notes": ""}, {"id": "9d6a4ea7-ba62-46f3-aa61-eac4f891833d", "date": "2026-06-01", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Shrikhand", "notes": ""}, {"id": "5073c7ed-39da-4dce-9469-74ecb28a5f46", "date": "2026-06-01", "type": "Expense", "amount": 13.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Delivery charges", "notes": ""}, {"id": "b5caaf3d-55ff-4960-81dc-4c92a4214505", "date": "2026-06-01", "type": "Expense", "amount": 62.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Amul Masti", "notes": ""}, {"id": "a0249aa7-8a38-4289-9bd1-1eff3905d1d0", "date": "2026-06-01", "type": "Expense", "amount": 284.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "BF-Coffee", "notes": ""}, {"id": "9c8d526c-082e-4fe7-b514-8904b848ccf3", "date": "2026-06-03", "type": "Expense", "amount": 120.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Health", "subcategory": "Medicines", "notes": "Dentist"}, {"id": "6a44a45f-2f61-4bce-96e3-24ecbd320da6", "date": "2026-06-01", "type": "Expense", "amount": 27.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Amul Masti", "notes": ""}, {"id": "8aa085a1-dedc-4fdf-be42-97c9f84f642c", "date": "2026-06-01", "type": "Expense", "amount": 399.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Lifestyle", "subcategory": "AI-Astra", "notes": "Astra"}, {"id": "81b651ed-de1f-42c9-9d13-508ab9d28e3d", "date": "2026-06-01", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "10e5d9fd-083f-4c23-acb4-bdd25420dd13", "date": "2026-06-02", "type": "Income", "amount": 5001.0, "fromAccount": "", "toAccount": "ICICI Savings", "category": "Income", "subcategory": "Professional Fees", "notes": "Sarika"}, {"id": "28c76e7c-4eb7-4761-bdc6-981a3254ce2a", "date": "2026-06-02", "type": "Transfer", "amount": 4500.0, "fromAccount": "ICICI Savings", "toAccount": "Kotak Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "ee852e5a-c159-4088-aaa0-555a2eac9fb5", "date": "2026-06-02", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "b73d1a0a-1e66-4091-97cd-e7726bfc09de", "date": "2026-06-03", "type": "Income", "amount": 0.01, "fromAccount": "", "toAccount": "ICICI Savings", "category": "Income", "subcategory": "Sav Int-ICICI", "notes": ""}, {"id": "5d686d36-1ab7-4a53-a37c-0baf2784e118", "date": "2026-06-02", "type": "Transfer", "amount": 4500.0, "fromAccount": "Kotak Savings", "toAccount": "Kotak LAS OD", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "1e3eebe0-f1e1-4ff8-8214-dbf4983f0b70", "date": "2026-06-01", "type": "Expense", "amount": 598.0, "fromAccount": "Kotak LAS OD", "toAccount": "", "category": "Misc", "subcategory": "Online Charges", "notes": ""}, {"id": "81f2941e-6bf1-48de-a19e-2bebf3d3f9ad", "date": "2026-06-03", "type": "Transfer", "amount": 1000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "507399f0-7dea-4478-be7e-45ab571063ca", "date": "2026-06-04", "type": "Expense", "amount": 57.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Misc", "subcategory": "Tobacco", "notes": ""}, {"id": "119c182f-e3fb-45c9-99c9-055807bcaefd", "date": "2026-06-04", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "7ff8bbf1-2fea-49bd-a766-26f2fb75ef8e", "date": "2026-06-04", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "bdb8963c-a8a1-4cd6-9703-7735fed0101e", "date": "2026-06-05", "type": "Transfer", "amount": 1000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "bb2037cc-d577-4186-9bc1-57e904ee7683", "date": "2026-06-05", "type": "Expense", "amount": 140.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Amul Masti", "notes": ""}, {"id": "2e9c649e-82cc-462b-b995-417c4964e088", "date": "2026-06-05", "type": "Expense", "amount": 117.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Thums Up", "notes": ""}, {"id": "952467f2-c6b5-473a-bb2e-080ffa195895", "date": "2026-06-05", "type": "Expense", "amount": 140.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Coconut Water", "notes": ""}, {"id": "49ed2bbe-3c30-41a0-acfc-3c1e67ac697d", "date": "2026-06-05", "type": "Expense", "amount": 48.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Salt & Pepper etc", "notes": "Halad"}, {"id": "bad9a358-d0db-41c5-91fa-5fda5a8d648a", "date": "2026-06-05", "type": "Expense", "amount": 13.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Delivery charges", "notes": ""}, {"id": "d31813dc-a735-4f17-bcc9-217a91bcfd3a", "date": "2026-06-05", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "4c946e7f-7d76-42bd-84fd-dc62dc0bda8b", "date": "2026-06-05", "type": "Expense", "amount": 108.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Utilities", "subcategory": "Ironing", "notes": ""}, {"id": "07a6eb90-c936-4ea1-b870-95a0162d7159", "date": "2026-06-05", "type": "Expense", "amount": 25000.0, "fromAccount": "Kotak LAS OD", "toAccount": "", "category": "Housing", "subcategory": "Rent-Landlord", "notes": "June"}, {"id": "fc23588e-06cc-4890-9d75-3597fdbf983f", "date": "2026-06-06", "type": "Expense", "amount": 3630.9, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Housing", "subcategory": "Rent Mojo", "notes": ""}, {"id": "ff9992f2-654f-4a58-a427-e2e3cd207d8d", "date": "2026-06-06", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "dac14319-e515-4640-9643-d8c3f5f71e6f", "date": "2026-06-06", "type": "Transfer", "amount": 4200.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "5bd894a9-544b-4a34-8d5f-8b2f0c68fbd0", "date": "2026-06-05", "type": "Income", "amount": 57000.0, "fromAccount": "", "toAccount": "Kotak Savings", "category": "Income", "subcategory": "Rent-Prathana", "notes": "June"}, {"id": "9300bbdb-cc00-4938-8454-0c9bd3fcd834", "date": "2026-06-06", "type": "Transfer", "amount": 57000.0, "fromAccount": "Kotak Savings", "toAccount": "Kotak LAS OD", "category": "Internal", "subcategory": "", "notes": "Od repay"}, {"id": "e2dd32f5-1f38-4867-aaa4-391ff6a71005", "date": "2026-06-06", "type": "Expense", "amount": 199.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Lifestyle", "subcategory": "Netflix", "notes": ""}, {"id": "da683ba1-0bf0-450c-b35b-fe75a5f6aa67", "date": "2026-06-06", "type": "Expense", "amount": 532.18, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Utilities", "subcategory": "Postpaid Vi", "notes": ""}, {"id": "16e030e4-53ad-47d6-abf9-53b547530391", "date": "2026-06-07", "type": "Transfer", "amount": 1500.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "9b476978-f0c5-45a3-8fee-4b9971b457cb", "date": "2026-06-07", "type": "Expense", "amount": 1000.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Utilities", "subcategory": "Ironing", "notes": "AC service"}, {"id": "3c6ebd8e-08ea-4135-aaf6-52c68e0c7195", "date": "2026-06-07", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "a60bdabf-62dc-4ac6-a9b9-00912e9adb26", "date": "2026-06-08", "type": "Transfer", "amount": 1000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "f0bc460a-c546-4143-a6f5-44b213896acf", "date": "2026-06-08", "type": "Expense", "amount": 122.0, "fromAccount": "Cash", "toAccount": "", "category": "Misc", "subcategory": "Transport-Auto", "notes": ""}, {"id": "a47dd899-8346-4f19-9021-c1e9618bd43e", "date": "2026-06-08", "type": "Expense", "amount": 30.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Snacks-Outside", "notes": "Sugar cane"}, {"id": "656b03f2-9cf5-4042-badd-9ac161b5a81a", "date": "2026-06-08", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "a174732b-397b-4513-9fd8-bb608ea1c8e8", "date": "2026-06-08", "type": "Transfer", "amount": 2000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "d38f3458-b183-41c1-ac84-b2d929ca01f9", "date": "2026-06-08", "type": "Expense", "amount": 2000.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Lifestyle", "subcategory": "AI-Astra", "notes": "8gb ram"}, {"id": "a9867169-8433-4add-99ae-70a650e6781d", "date": "2026-06-08", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Misc", "subcategory": "Transport-Auto", "notes": ""}, {"id": "e7a60e44-88fd-49ff-abb3-5ad83755c348", "date": "2026-06-09", "type": "Expense", "amount": 120.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Thums Up", "notes": ""}, {"id": "94731915-8c61-461b-b702-f77be7dd2aa6", "date": "2026-06-09", "type": "Expense", "amount": 140.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Amul Masti", "notes": ""}, {"id": "2f684eca-d69e-42af-adcc-0626963e35c7", "date": "2026-06-09", "type": "Expense", "amount": 140.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Coconut Water", "notes": ""}, {"id": "22ae8dce-c8a3-410a-b42a-f55e49d7c555", "date": "2026-06-09", "type": "Expense", "amount": 40.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Thums Up", "notes": ""}, {"id": "5f6f3fb4-f5a3-4558-9e76-4fac3f9a27c1", "date": "2026-06-09", "type": "Expense", "amount": 115.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "BF-Eggs", "notes": ""}, {"id": "15794bd6-3951-43c9-95c0-711b2d66ee14", "date": "2026-06-09", "type": "Expense", "amount": 15.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Delivery charges", "notes": ""}, {"id": "2afdedf4-9b0e-4cf5-a48c-d24a56db8c36", "date": "2026-06-11", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "5fadf593-9bf4-47f0-9f4a-ce6e502e57c8", "date": "2026-06-12", "type": "Expense", "amount": 3500.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Utilities", "subcategory": "Internet", "notes": ""}, {"id": "108375ee-c586-4508-8f41-71a8c5dfe871", "date": "2026-06-11", "type": "Expense", "amount": 57.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Misc", "subcategory": "Tobacco", "notes": ""}, {"id": "570f90d2-6dd1-4d56-b943-26815608ae00", "date": "2026-06-11", "type": "Expense", "amount": 150.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Personal", "subcategory": "Haircutting", "notes": ""}, {"id": "f0f4bcfe-8404-4e40-8d0f-42e8d7bf55f0", "date": "2026-06-12", "type": "Expense", "amount": 135.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "974f41c7-7380-4003-a0ac-c189be508cf7", "date": "2026-06-12", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "15846d3e-8be7-4ef9-a3fc-be36bd2e69ea", "date": "2026-06-12", "type": "Expense", "amount": 289.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "BF-Milk", "notes": "17"}, {"id": "78569e02-b42b-4d09-9a96-74903e22192f", "date": "2026-06-12", "type": "Expense", "amount": 111.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Thums Up", "notes": "3 750"}, {"id": "4af1b9a1-0988-42e7-84ea-1fe873f1f2bf", "date": "2026-06-12", "type": "Expense", "amount": 146.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Coconut Water", "notes": ""}, {"id": "9cc109c7-3b3f-4809-a57e-43f3ff504356", "date": "2026-06-12", "type": "Expense", "amount": 11.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Delivery charges", "notes": ""}, {"id": "1c255377-1d16-4f7a-8c88-02405a3d307a", "date": "2026-06-12", "type": "Transfer", "amount": 500.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "aa1d17fb-3fb0-4f2f-8deb-35461a5f9ded", "date": "2026-06-11", "type": "Transfer", "amount": 4000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "49e96c60-6be7-4b00-b0cd-37980e7b24a8", "date": "2026-06-13", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "34f97730-3b84-411e-a15e-0e7a5293b04c", "date": "2026-06-14", "type": "Expense", "amount": 1640.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Utilities", "subcategory": "Electricity", "notes": ""}, {"id": "1312ac9e-0657-4c9e-80a5-6d401eb1038d", "date": "2026-06-14", "type": "Transfer", "amount": 2000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "effa3303-f8d3-496b-972a-54401ce0f0ca", "date": "2026-06-14", "type": "Expense", "amount": 330.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Nonveg-Chicken", "notes": ""}, {"id": "9f328572-e89c-433d-88aa-3ef4b7a1ae9b", "date": "2026-06-15", "type": "Expense", "amount": 2050.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Housing", "subcategory": "Rent-Landlord", "notes": ""}, {"id": "eadd5ab7-ba8e-4eac-af7f-1b83443a4933", "date": "2026-06-15", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "e8818c0c-4e2d-4f1f-874a-912e61ceed05", "date": "2026-06-15", "type": "Expense", "amount": 140.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Coconut Water", "notes": ""}, {"id": "e485919c-8f24-4d60-aa30-d9971593988b", "date": "2026-06-15", "type": "Expense", "amount": 140.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Amul Masti", "notes": ""}, {"id": "1a397040-0d01-4a55-9ee4-f57fa7b5e54e", "date": "2026-06-15", "type": "Expense", "amount": 155.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Thums Up", "notes": ""}, {"id": "89c66fa3-6c69-45cf-9f2e-92907af85313", "date": "2026-06-16", "type": "Expense", "amount": 75.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Misc", "subcategory": "Tobacco", "notes": ""}, {"id": "028b3131-779a-4208-894b-88110b2b88c6", "date": "2026-06-16", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "29c85b7c-9945-43c0-81fd-581385bbebc3", "date": "2026-06-16", "type": "Expense", "amount": 135.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Dinner-Tiffin", "notes": ""}, {"id": "7e6327ec-8b2c-4c68-bacb-021ffaa077a0", "date": "2026-06-17", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "d52d6ebf-4125-41c4-9716-e897ebf83666", "date": "2026-06-16", "type": "Income", "amount": 3000.0, "fromAccount": "", "toAccount": "ICICI Savings", "category": "Income", "subcategory": "Professional Fees", "notes": ""}, {"id": "7a7a7783-2f2a-480e-ab06-27297fbaee99", "date": "2026-06-15", "type": "Transfer", "amount": 2500.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "21257958-ab8c-44d5-b2e4-a694a983abbf", "date": "2026-06-15", "type": "Expense", "amount": 13.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Delivery charges", "notes": ""}, {"id": "c0aa90e7-e58b-4127-83f8-76043d2221c2", "date": "2026-06-17", "type": "Expense", "amount": 135.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Dinner-Tiffin", "notes": ""}, {"id": "23a30155-2f35-487e-af09-864ea84a21e8", "date": "2026-06-17", "type": "Expense", "amount": 500.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Misc", "subcategory": "Online Charges", "notes": ""}, {"id": "4daedf30-8645-4c3a-8023-f5e78fdcd23b", "date": "2026-06-18", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "9a0e69dd-1440-4e4b-a802-6d1958fa9fa4", "date": "2026-06-18", "type": "Expense", "amount": 615.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "BF-Muselli", "notes": ""}, {"id": "1c823b87-4b1c-484d-967e-edbd41838367", "date": "2026-06-18", "type": "Expense", "amount": 190.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Personal", "subcategory": "Rituals", "notes": "Laxmi"}, {"id": "0227db4a-e502-427d-b710-843f9eb5ce63", "date": "2026-06-19", "type": "Expense", "amount": 56.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Misc", "subcategory": "Tobacco", "notes": ""}, {"id": "d00f05b5-60dd-4858-a31f-ae23789ad473", "date": "2026-06-19", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "c8b5f139-72d8-4b11-857d-dba338a6e08d", "date": "2026-06-19", "type": "Expense", "amount": 135.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Dinner-Tiffin", "notes": ""}, {"id": "ba0adf36-c33c-42db-8669-d33c33fa51e0", "date": "2026-06-19", "type": "Expense", "amount": 140.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Coconut Water", "notes": ""}, {"id": "2a2a8559-a088-4ccd-8b6a-80e5e101b863", "date": "2026-06-19", "type": "Expense", "amount": 155.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Thums Up", "notes": ""}, {"id": "113a6c3d-d81e-4f3c-8796-0cbe6bf2964c", "date": "2026-06-19", "type": "Expense", "amount": 40.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Thums Up", "notes": ""}, {"id": "8778b81c-4753-407c-a56f-c5f717348526", "date": "2026-06-19", "type": "Expense", "amount": 75.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Amul Masti", "notes": ""}, {"id": "e6567b36-606d-464f-921f-9f334c3eec94", "date": "2026-06-19", "type": "Expense", "amount": 57.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Sugar & Others", "notes": ""}, {"id": "64f77f44-2f6a-40cb-865f-43d4b9507bf3", "date": "2026-06-19", "type": "Expense", "amount": 13.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Delivery charges", "notes": ""}, {"id": "8e3c7624-1111-4882-94c1-3a74889a7d2e", "date": "2026-06-20", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "1ff447e0-74bb-4400-b1a9-0662f22e8a6a", "date": "2026-06-20", "type": "Expense", "amount": 135.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "c41a0385-9ec4-4d93-991a-648301dfb7b2", "date": "2026-06-21", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "866648bc-5a1d-485f-a5ce-452317f81366", "date": "2026-06-21", "type": "Expense", "amount": 135.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Dinner-Tiffin", "notes": ""}, {"id": "fe8831ed-ab38-404f-baca-6cb278429ea0", "date": "2026-06-21", "type": "Transfer", "amount": 1000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "691a8f3a-1de1-4787-8805-056816753bca", "date": "2026-06-22", "type": "Transfer", "amount": 1000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "fdce37e7-ab16-4176-b9f3-4fec0667bdc1", "date": "2026-06-22", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "ab18a1e4-27d4-4dc0-8f77-3e8af8ad17b2", "date": "2026-06-22", "type": "Expense", "amount": 135.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Dinner-Tiffin", "notes": ""}, {"id": "7430892f-85a3-481e-b59f-d539b933f2c3", "date": "2026-06-22", "type": "Expense", "amount": 140.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Coconut Water", "notes": ""}, {"id": "630531f9-c9e8-4b1e-ba36-c004f0aab149", "date": "2026-06-22", "type": "Expense", "amount": 140.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Amul Masti", "notes": ""}, {"id": "fa17e13d-11c7-4a23-b171-ee3a822d3fa3", "date": "2026-06-22", "type": "Expense", "amount": 155.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Thums Up", "notes": ""}, {"id": "a7672862-e6dc-4c27-a311-496015d431d4", "date": "2026-06-22", "type": "Expense", "amount": 100.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Amul Masti", "notes": ""}, {"id": "fc61dbcd-8047-4e1b-8d8e-feb0e43d151f", "date": "2026-06-22", "type": "Expense", "amount": 13.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Delivery charges", "notes": ""}, {"id": "7367510f-13e2-488d-a6f0-87f74e274aaf", "date": "2026-06-23", "type": "Expense", "amount": 700.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Health", "subcategory": "Doctor", "notes": ""}, {"id": "b9544fb6-2bdf-4b58-b930-b97b169ebdd0", "date": "2026-06-23", "type": "Expense", "amount": 65.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Misc", "subcategory": "Tobacco", "notes": ""}, {"id": "b0d5b6d5-3d71-40c7-a32a-1cd4135bf281", "date": "2026-06-23", "type": "Expense", "amount": 135.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Dinner-Tiffin", "notes": ""}, {"id": "138a7b10-beea-4539-bc9f-78a4c6f4cd69", "date": "2026-06-23", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "1b062307-1974-446d-a51a-2562afefa4d9", "date": "2026-06-24", "type": "Expense", "amount": 5164.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Health", "subcategory": "Medicines", "notes": ""}, {"id": "d9e44429-5b0e-4cdf-ac04-819d8a87bb7e", "date": "2026-06-24", "type": "Expense", "amount": 117.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Health", "subcategory": "Medicines", "notes": ""}, {"id": "c7a6fe97-e348-470f-9cae-ea30397aae61", "date": "2026-06-24", "type": "Expense", "amount": 135.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Dinner-Tiffin", "notes": ""}, {"id": "ee18528d-7176-43f1-8b35-19a77ca74f19", "date": "2026-06-24", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "87fa7bd0-cde6-4d40-9035-311688c8d5ce", "date": "2026-06-24", "type": "Transfer", "amount": 6000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "6433dc82-58d6-4726-9b8e-1d1a40d678e9", "date": "2026-06-24", "type": "Transfer", "amount": 1000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "86931410-a9b0-4acb-bb6c-39150d495aa3", "date": "2026-06-27", "type": "Transfer", "amount": 3000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "201faecf-ef3f-43cb-b80f-eef6ca55944b", "date": "2026-06-29", "type": "Transfer", "amount": 1000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "80e0be5e-4645-4f50-8473-d1b2f47c7ef2", "date": "2026-06-25", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "25374de2-ca09-40ab-8e1f-1481f46b4145", "date": "2026-06-27", "type": "Expense", "amount": 135.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Dinner-Tiffin", "notes": ""}, {"id": "9315213a-4ddf-4279-954d-a8b873a757f0", "date": "2026-06-26", "type": "Expense", "amount": 135.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Dinner-Tiffin", "notes": ""}, {"id": "c716ea01-ef08-4807-a213-860ed30ecbaa", "date": "2026-06-26", "type": "Expense", "amount": 476.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "BF-Milk", "notes": ""}, {"id": "7f9305fc-465d-468a-9f03-4c4161f6e8bf", "date": "2026-06-26", "type": "Expense", "amount": 117.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Thums Up", "notes": ""}, {"id": "40155a2b-af36-4711-85b5-095042d5dc2a", "date": "2026-06-26", "type": "Expense", "amount": 140.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Coconut Water", "notes": ""}, {"id": "120349cf-0d83-4060-9086-47e7f4901200", "date": "2026-06-26", "type": "Expense", "amount": 165.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Shrikhand", "notes": ""}, {"id": "73424e5b-71c9-420b-920c-6eb20da5030c", "date": "2026-06-26", "type": "Expense", "amount": 165.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Fruits-Apple-Banana", "notes": ""}, {"id": "f9f25309-e0e9-4293-b8fd-93444d15f5b7", "date": "2026-06-26", "type": "Expense", "amount": 13.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Delivery charges", "notes": ""}, {"id": "542a68f7-8666-493d-82f1-dd31aea0ff9c", "date": "2026-06-30", "type": "Expense", "amount": 361.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Fruits-Others", "notes": ""}, {"id": "0c9a2b14-57eb-466b-803a-2b1387ba5f4c", "date": "2026-06-27", "type": "Expense", "amount": 2600.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Misc", "subcategory": "Others", "notes": ""}, {"id": "fa2def03-3e72-4f82-b91b-b7a8034be870", "date": "2026-06-28", "type": "Expense", "amount": 135.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Dinner-Tiffin", "notes": ""}, {"id": "c02245d1-7c75-4ae6-81b3-7c46f8725cb9", "date": "2026-06-28", "type": "Expense", "amount": 57.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Misc", "subcategory": "Tobacco", "notes": ""}, {"id": "41938cbf-b54c-410b-b56e-56e78bece8a0", "date": "2026-06-28", "type": "Expense", "amount": 58.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Health", "subcategory": "Medicines", "notes": ""}, {"id": "ab4edc53-d7eb-42a7-b63d-d406cde443a7", "date": "2026-06-30", "type": "Expense", "amount": 110.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Misc", "subcategory": "Others", "notes": "Knife"}, {"id": "44b84e03-d743-48f4-a72a-a5c71c7a5e7f", "date": "2026-06-29", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "4305496c-3d6a-465d-81ad-c7bc66969c03", "date": "2026-06-29", "type": "Expense", "amount": 155.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Thums Up", "notes": ""}, {"id": "bb1ee305-e586-4b40-8012-d0f86938ec86", "date": "2026-06-29", "type": "Expense", "amount": 140.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Amul Masti", "notes": ""}, {"id": "2df52973-40fb-415c-9f7a-ed65b2c40104", "date": "2026-06-29", "type": "Expense", "amount": 57.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Sugar & Others", "notes": ""}, {"id": "b0ed17aa-3376-47e6-9ac1-eae0a1bea057", "date": "2026-06-29", "type": "Expense", "amount": 125.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Shrikhand", "notes": ""}, {"id": "61ff2000-fde7-40ff-afee-bbb6884af44f", "date": "2026-06-29", "type": "Expense", "amount": 13.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Delivery charges", "notes": ""}, {"id": "614491ae-a06c-43d3-89ea-fb2229285504", "date": "2026-06-29", "type": "Transfer", "amount": 1000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "34bb801a-6267-4f35-b949-1d1eef709bff", "date": "2026-06-29", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "49b05ce7-ce1c-4c18-8aee-734ffb5aebe9", "date": "2026-06-30", "type": "Expense", "amount": 300.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Misc", "subcategory": "Others", "notes": "Xerox"}, {"id": "307ba3b8-6c9a-4209-99db-86600b31bb72", "date": "2026-06-30", "type": "Transfer", "amount": 1000.0, "fromAccount": "Kotak LAS OD", "toAccount": "ICICI Savings", "category": "Internal", "subcategory": "", "notes": ""}, {"id": "4ba252da-2ae9-4e05-8212-3fb66533b50b", "date": "2026-06-30", "type": "Expense", "amount": 214.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Housing", "subcategory": "Phenol-Harpic", "notes": ""}, {"id": "d0837169-659d-4fb1-8d02-9532b16e4a72", "date": "2026-06-30", "type": "Expense", "amount": 160.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Housing", "subcategory": "Washing Powder", "notes": ""}, {"id": "68c01481-db0d-42d2-965a-c0b9e30d3a8a", "date": "2026-06-30", "type": "Expense", "amount": 13.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Grocery", "subcategory": "Delivery charges", "notes": ""}, {"id": "ad50c7b1-4455-4aea-92a3-d98060026461", "date": "2026-06-30", "type": "Expense", "amount": 99.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Housing", "subcategory": "Snabbit", "notes": ""}, {"id": "7cb34ebd-a416-457a-a248-9f0eecafeef1", "date": "2026-06-30", "type": "Expense", "amount": 130.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Lunch-Tiffin", "notes": ""}, {"id": "bcd61a1b-35d1-4518-b057-c5486c3e637b", "date": "2026-06-29", "type": "Expense", "amount": 260.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Dinner-Tiffin", "notes": ""}, {"id": "16c02045-a128-4090-ab7c-53705911208c", "date": "2026-06-30", "type": "Expense", "amount": 109.0, "fromAccount": "ICICI Savings", "toAccount": "", "category": "Food", "subcategory": "Dinner-Tiffin", "notes": ""}];
    const merged = [...juneTxns, ...existing.filter(t => !t.date || !t.date.startsWith('2026-06'))];
    localStorage.setItem('sw_txns', JSON.stringify(merged));
    localStorage.setItem('sw_june_restored', '1');
    console.log('[SYNDY RESTORE] June 2026 restored: 154 transactions injected.');
  } catch(e) { console.error('[SYNDY RESTORE] Failed:', e); }
})();

// ── CHECKPOINT KEY MIGRATION ──────────────────────────────────
// The June 2026 month-close was accidentally saved under '2026-05'.
// This migrates it to '2026-06' (one-time, safe to re-deploy).
(function fixCheckpointKey() {
  try {
    if (localStorage.getItem('sw_cp_key_fixed') === '1') return;
    const raw = localStorage.getItem('sw_checkpoints');
    if (!raw) { localStorage.setItem('sw_cp_key_fixed', '1'); return; }
    const all = JSON.parse(raw);
    if (all['2026-05'] && !all['2026-06']) {
      all['2026-06'] = { ...all['2026-05'], closedOn: all['2026-05'].closedOn || '2026-07-01' };
      delete all['2026-05'];
      localStorage.setItem('sw_checkpoints', JSON.stringify(all));
      console.log('[SYNDY] Checkpoint key fixed: 2026-05 → 2026-06');
    }
    localStorage.setItem('sw_cp_key_fixed', '1');
  } catch(e) {}
})();


// ── BUDGET RESTORE v2 ─────────────────────────────────────────
// Force re-inject June + July budgets (exact amounts from XLS).
// Uses new flag sw_budgets_v14b to re-run even if v14 already ran.
(function restoreBudgetsV2() {
  try {
    if (localStorage.getItem('sw_budgets_v14b') === '1') return;
    const raw = localStorage.getItem('sw_budgets');
    const existing = raw ? JSON.parse(raw) : {};
    const restored = {"2026-06": [{"id": "0b0ab13dbb304531", "category": "Food", "subcategory": "BF-Eggs", "amount": 500}, {"id": "4a1fe104e9c24c39", "category": "Food", "subcategory": "BF-Milk", "amount": 510}, {"id": "ed16dc6d4db74535", "category": "Food", "subcategory": "BF-Muselli", "amount": 700}, {"id": "f5eff2608b2f40e9", "category": "Food", "subcategory": "Dinner-Tiffin", "amount": 4050}, {"id": "fcbacb2ed9ad4b75", "category": "Food", "subcategory": "Lunch-Tiffin", "amount": 3900}, {"id": "bb2ad0c656db4ade", "category": "Food", "subcategory": "Nonveg-Chicken", "amount": 1000}, {"id": "a8771d6d0d3b482b", "category": "Grocery", "subcategory": "Amul Masti", "amount": 420}, {"id": "2385e8870b5c466a", "category": "Grocery", "subcategory": "Coconut Water", "amount": 420}, {"id": "929bb1acf4bc4fab", "category": "Grocery", "subcategory": "Delivery charges", "amount": 130}, {"id": "e7772f8701e94035", "category": "Grocery", "subcategory": "Fruits-Apple-Banana", "amount": 800}, {"id": "9d6568cc771a4fe1", "category": "Grocery", "subcategory": "Fruits-Others", "amount": 800}, {"id": "f1c938f549e941ac", "category": "Grocery", "subcategory": "Shrikhand", "amount": 500}, {"id": "6cb31ce9db4f4e1b", "category": "Grocery", "subcategory": "Sugar & Others", "amount": 120}, {"id": "5607f6605e304e90", "category": "Grocery", "subcategory": "Thums Up", "amount": 600}, {"id": "c9f8c0751e1d4f84", "category": "Housing", "subcategory": "Rent-Landlord", "amount": 25000}, {"id": "f2154ca7c53d47a8", "category": "Housing", "subcategory": "Rent Mojo", "amount": 3630}, {"id": "aad99807202b4b36", "category": "Utilities", "subcategory": "Electricity", "amount": 1300}, {"id": "5d4ec698dd734c01", "category": "Utilities", "subcategory": "Ironing", "amount": 200}, {"id": "ea6be9081b784ea7", "category": "Lifestyle", "subcategory": "AI-Astra", "amount": 400}, {"id": "ccb0d44162a242bf", "category": "Lifestyle", "subcategory": "Netflix", "amount": 200}, {"id": "fa120c2fafd246ad", "category": "Misc", "subcategory": "Tobacco", "amount": 330}, {"id": "2715836c4bd54b8d", "category": "Personal", "subcategory": "Haircutting", "amount": 150}], "2026-07": [{"id": "2f9195c669d44a09", "category": "Food", "subcategory": "BF-Eggs", "amount": 500}, {"id": "e3f47ef40ec64b97", "category": "Food", "subcategory": "BF-Milk", "amount": 510}, {"id": "b781fd8c4fd1482c", "category": "Food", "subcategory": "BF-Muselli", "amount": 700}, {"id": "93880bd09f0b4526", "category": "Food", "subcategory": "Dinner-Tiffin", "amount": 4050}, {"id": "e0465b0a49024c7e", "category": "Food", "subcategory": "Lunch-Tiffin", "amount": 3900}, {"id": "57421fda191847f6", "category": "Food", "subcategory": "Nonveg-Chicken", "amount": 1000}, {"id": "ee70fd57bc654567", "category": "Grocery", "subcategory": "Amul Masti", "amount": 420}, {"id": "07a7a9ae6b7f4a30", "category": "Grocery", "subcategory": "Coconut Water", "amount": 420}, {"id": "51548e37e91c4c80", "category": "Grocery", "subcategory": "Delivery charges", "amount": 130}, {"id": "903c6304edc9421d", "category": "Grocery", "subcategory": "Fruits-Apple-Banana", "amount": 800}, {"id": "d6f158a2853d4f09", "category": "Grocery", "subcategory": "Fruits-Others", "amount": 800}, {"id": "a4177492ccbc4657", "category": "Grocery", "subcategory": "Shrikhand", "amount": 500}, {"id": "a10a032349da4d00", "category": "Grocery", "subcategory": "Sugar & Others", "amount": 120}, {"id": "136eb1833af34ae5", "category": "Grocery", "subcategory": "Thums Up", "amount": 600}, {"id": "4e547af1187a4a89", "category": "Housing", "subcategory": "Rent-Landlord", "amount": 25000}, {"id": "2ad3f4d637d84496", "category": "Housing", "subcategory": "Rent Mojo", "amount": 3630}, {"id": "ed55c4f742f34c3e", "category": "Utilities", "subcategory": "Electricity", "amount": 1300}, {"id": "06b5d9f813ef47c6", "category": "Utilities", "subcategory": "Ironing", "amount": 200}, {"id": "f10e812410b44e92", "category": "Lifestyle", "subcategory": "AI-Astra", "amount": 400}, {"id": "e01898d74f7a4376", "category": "Lifestyle", "subcategory": "Netflix", "amount": 200}, {"id": "edeb892e60ad4e34", "category": "Misc", "subcategory": "Tobacco", "amount": 330}, {"id": "66bd35c37b57456d", "category": "Personal", "subcategory": "Haircutting", "amount": 150}]};
    // Inject both months — overwrite if empty, preserve if already has items
    Object.keys(restored).forEach(m => {
      if (!existing[m] || existing[m].length === 0) {
        existing[m] = restored[m];
      }
    });
    localStorage.setItem('sw_budgets', JSON.stringify(existing));
    localStorage.setItem('sw_budgets_v14b', '1');
    console.log('[SYNDY] Budgets v2 restored: June + July 2026 (22 items each, ₹45,660 total)');
  } catch(e) { console.error('[SYNDY] Budget restore v2 failed:', e); }
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

// ── STORAGE v14 — DUAL LAYER + AUTO BACKUP ───────────────────
// Layer 1: localStorage (primary, instant)
// Layer 2: IndexedDB via mirror (secondary, survives localStorage clear)
// Layer 3: GitHub Gist (optional cloud, user-configured)
// Auto-backup: every saveTxns() call mirrors to IndexedDB
// Manual backup: "Backup Now" button exports full JSON snapshot

// ── IndexedDB Mirror ──────────────────────────────────────────
const IDB_NAME = 'syndy_backup_v1';
const IDB_STORE = 'snapshots';

function idbOpen() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE, { keyPath: 'key' });
    req.onsuccess = e => res(e.target.result);
    req.onerror   = () => rej(req.error);
  });
}

async function idbSet(key, value) {
  try {
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put({ key, value, ts: Date.now() });
      tx.oncomplete = () => res(true);
      tx.onerror    = () => rej(tx.error);
    });
  } catch(e) { console.warn('[SYNDY] IDB write failed:', e); }
}

async function idbGet(key) {
  try {
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
      req.onsuccess = () => res(req.result?.value ?? null);
      req.onerror   = () => rej(req.error);
    });
  } catch(e) { return null; }
}

// ── Primary load/save with IDB mirror ────────────────────────
function loadTxns() {
  try { return JSON.parse(localStorage.getItem('sw_txns') || '[]'); }
  catch { return []; }
}

function saveTxns(d) {
  const json = JSON.stringify(d);
  localStorage.setItem('sw_txns', json);
  // Mirror to IndexedDB silently
  idbSet('sw_txns', json).catch(() => {});
  // Update last-saved timestamp
  localStorage.setItem('sw_last_backup_auto', Date.now().toString());
}

function loadReminders()  { try { return JSON.parse(localStorage.getItem('sw_reminders') || '[]'); } catch { return []; } }
function saveReminders(d) {
  localStorage.setItem('sw_reminders', JSON.stringify(d));
  idbSet('sw_reminders', JSON.stringify(d)).catch(() => {});
}
function loadBudgets()    { try { return JSON.parse(localStorage.getItem('sw_budgets') || '{}'); } catch { return {}; } }
function saveBudgets(d)   {
  localStorage.setItem('sw_budgets', JSON.stringify(d));
  idbSet('sw_budgets', JSON.stringify(d)).catch(() => {});
}

// ── IDB Recovery — restore from IndexedDB if localStorage is empty ──
async function recoverFromIDB() {
  const hasTxns = localStorage.getItem('sw_txns');
  if (hasTxns && JSON.parse(hasTxns).length > 0) return; // localStorage is fine
  const idbTxns = await idbGet('sw_txns');
  if (idbTxns && idbTxns.length > 2) { // '[]' is 2 chars
    localStorage.setItem('sw_txns', idbTxns);
    const idbBudgets = await idbGet('sw_budgets');
    if (idbBudgets) localStorage.setItem('sw_budgets', idbBudgets);
    const idbReminders = await idbGet('sw_reminders');
    if (idbReminders) localStorage.setItem('sw_reminders', idbReminders);
    showToast('⚠ Data recovered from backup store. Please verify balances.', 'warn');
    txns = loadTxns();
    renderDashboard();
  }
}

// ── Full Backup Snapshot (manual button) ─────────────────────
function createBackupSnapshot() {
  const snapshot = {
    version: 'v14',
    exportedAt: new Date().toISOString(),
    exportedBy: 'Syndy Wallet Manual Backup',
    sw_txns: loadTxns(),
    sw_budgets: loadBudgets(),
    sw_reminders: loadReminders(),
    sw_checkpoints: loadCheckpoints()
  };
  return snapshot;
}

function downloadBackup() {
  const snapshot = createBackupSnapshot();
  const json = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const ts   = todayStr();
  a.href     = url;
  a.download = `syndy-backup-${ts}.json`;
  a.click();
  URL.revokeObjectURL(url);
  localStorage.setItem('sw_last_backup_manual', Date.now().toString());
  showToast('✅ Backup downloaded: syndy-backup-' + ts + '.json', 'success');
}

// ── Restore from JSON backup file ────────────────────────────
function restoreFromFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const snap = JSON.parse(e.target.result);
      if (!snap.sw_txns) { showToast('❌ Invalid backup file', 'error'); return; }
      showConfirm(
        `Restore ${snap.sw_txns.length} transactions from backup dated ${snap.exportedAt?.slice(0,10)}? This will OVERWRITE current data.`,
        () => {
          localStorage.setItem('sw_txns', JSON.stringify(snap.sw_txns));
          if (snap.sw_budgets)     localStorage.setItem('sw_budgets', JSON.stringify(snap.sw_budgets));
          if (snap.sw_reminders)   localStorage.setItem('sw_reminders', JSON.stringify(snap.sw_reminders));
          if (snap.sw_checkpoints) localStorage.setItem('sw_checkpoints', JSON.stringify(snap.sw_checkpoints));
          txns = loadTxns();
          renderDashboard();
          showToast(`✅ Restored ${snap.sw_txns.length} transactions`, 'success');
        }
      );
    } catch { showToast('❌ Could not read backup file', 'error'); }
  };
  reader.readAsText(file);
}

function backupStatusText() {
  const auto   = localStorage.getItem('sw_last_backup_auto');
  const manual = localStorage.getItem('sw_last_backup_manual');
  const fmt = ts => {
    if (!ts) return 'Never';
    const d = new Date(parseInt(ts));
    return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
  };
  return { auto: fmt(auto), manual: fmt(manual) };
}

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

  // Determine which month to close — use last month with transactions (IST-safe)
  function prevMonthStr() {
    const t = todayStr(); // YYYY-MM-DD in IST
    const [y, m] = t.slice(0,7).split('-').map(Number);
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    return py + '-' + String(pm).padStart(2, '0');
  }
  // Find most recent month that has transactions
  function lastTxnMonth() {
    if (!txns || !txns.length) return prevMonthStr();
    const months = txns.map(t => t.date ? t.date.slice(0,7) : '').filter(Boolean);
    return months.length ? months.sort().pop() : prevMonthStr();
  }
  const suggestedMonth = lastTxnMonth();

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

  // ── BACKUP PANEL ──
  const bPanel = document.getElementById('backupPanel');
  if (bPanel) {
    const bStatus = backupStatusText();
    const txnCount = txns.length;
    const autoColor = bStatus.auto === 'Never' ? 'var(--expense)' : 'var(--accent)';
    const manualColor = bStatus.manual === 'Never' ? '#f59e0b' : '#60a5fa';
    bPanel.innerHTML = `
      <div style="font-size:11px;letter-spacing:1.5px;color:var(--text3);text-transform:uppercase;margin-bottom:12px">☁ Data Backup</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:rgba(0,212,170,0.05);border:1px solid rgba(0,212,170,0.15);border-radius:10px;padding:10px;text-align:center">
          <div style="font-size:9px;color:var(--text3);letter-spacing:1px;margin-bottom:4px">AUTO BACKUP</div>
          <div style="font-size:10px;font-weight:600;color:${autoColor}">${bStatus.auto}</div>
          <div style="font-size:9px;color:var(--text3);margin-top:3px">IndexedDB mirror</div>
        </div>
        <div style="background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.15);border-radius:10px;padding:10px;text-align:center">
          <div style="font-size:9px;color:var(--text3);letter-spacing:1px;margin-bottom:4px">LAST MANUAL</div>
          <div style="font-size:10px;font-weight:600;color:${manualColor}">${bStatus.manual}</div>
          <div style="font-size:9px;color:var(--text3);margin-top:3px">${txnCount} transactions</div>
        </div>
      </div>
      <button onclick="downloadBackup()" style="width:100%;padding:13px;background:linear-gradient(135deg,rgba(0,212,170,0.18),rgba(0,212,170,0.08));border:1px solid rgba(0,212,170,0.45);border-radius:10px;color:var(--accent);font-size:13px;font-weight:700;letter-spacing:0.5px;cursor:pointer;margin-bottom:8px">
        ☁ Backup Now — Download JSON
      </button>
      <label style="width:100%;display:block;cursor:pointer">
        <div style="width:100%;padding:11px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:var(--text2);font-size:12px;font-weight:600;text-align:center;letter-spacing:0.5px">
          📂 Restore from Backup File
        </div>
        <input type="file" accept=".json" style="display:none" onchange="restoreFromFile(this.files[0])">
      </label>
      <div style="font-size:10px;color:var(--text3);margin-top:8px;line-height:1.6;text-align:center">
        Auto-backup runs on every transaction save.<br>
        Download manual backup before month-end closure.
      </div>`;
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
        <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:6px">
          <button onclick="editTxn('${t.id}')" style="background:rgba(0,212,170,0.1);border:1px solid rgba(0,212,170,0.3);border-radius:6px;cursor:pointer;color:var(--accent);font-size:11px;padding:3px 8px;font-weight:600">✏ Edit</button>
          <button onclick="deleteTxn('${t.id}')" style="background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:6px;cursor:pointer;color:var(--expense);font-size:11px;padding:3px 8px;font-weight:600">🗑 Del</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function editTxn(id) {
  const t = txns.find(x => x.id === id);
  if (!t) return;

  // Remove original first so re-save = update
  txns = txns.filter(x => x.id !== id);
  saveTxns(txns);

  // Switch to Add tab using correct function
  showPage('add');

  setTimeout(() => {
    // Set transaction type using the button-based selectType()
    selectType(t.type);

    setTimeout(() => {
      // Common fields
      document.getElementById('txnAmount').value = t.amount;
      document.getElementById('txnDate').value   = t.date;
      document.getElementById('txnNotes').value  = t.notes || '';

      if (t.type === 'Expense') {
        const catEl = document.getElementById('txnCategory');
        const accEl = document.getElementById('txnFrom');
        if (catEl) { catEl.value = t.category || ''; onCategoryChange(); }
        if (accEl) accEl.value = t.fromAccount || '';
        setTimeout(() => {
          const subEl = document.getElementById('txnSubcategory');
          if (subEl) subEl.value = t.subcategory || '';
        }, 60);

      } else if (t.type === 'Income') {
        const catEl = document.getElementById('txnCategory');
        const accEl = document.getElementById('txnToIncome');
        if (catEl) { catEl.value = t.category || ''; onCategoryChange(); }
        if (accEl) accEl.value = t.toAccount || '';
        setTimeout(() => {
          const subEl = document.getElementById('txnSubcategory');
          if (subEl) subEl.value = t.subcategory || '';
        }, 60);

      } else if (t.type === 'Transfer') {
        const fromEl = document.getElementById('txnFrom');
        const toEl   = document.getElementById('txnTo');
        if (fromEl) fromEl.value = t.fromAccount || '';
        if (toEl)   toEl.value   = t.toAccount   || '';
      }

      renderDashboard();
      showToast('Edit the entry and tap Save', 'info');
    }, 100);
  }, 120);
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

// ── EDIT BUDGET ITEM ──────────────────────────────────────────
function editBudgetItem(month, id) {
  const all   = loadBudgets();
  const items = all[month] || [];
  const item  = items.find(i => i.id === id);
  if (!item) return;
  // Pre-fill the Add form with existing values for editing
  const catEl = document.getElementById('budgetCat');
  const subEl = document.getElementById('budgetSub');
  const amtEl = document.getElementById('budgetAmt');
  catEl.value = item.category;
  onBudgetCatChange();
  // Wait for subcategory options to populate then set value
  setTimeout(() => {
    subEl.value = item.subcategory;
    amtEl.value = item.amount;
    // Remove old item so Add becomes an update
    all[month] = items.filter(i => i.id !== id);
    saveBudgets(all);
    renderBudget();
    // Scroll to top of budget tab so user sees the form
    document.getElementById('budgetAmt').scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Edit the values above and tap Add', 'info');
  }, 50);
}

function renderBudget() {
  const picker = document.getElementById('budgetMonthPicker');
  if (!picker.value) picker.value = currentMonth();
  const month = picker.value;

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
    // Hide summary if no items
    const sumEl = document.getElementById('budgetSummaryBar');
    if (sumEl) sumEl.style.display='none';
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

  // ── TOTALS ──
  let totalBudget = 0, totalSpent = 0;
  items.forEach(item => {
    const key = item.category+'||'+item.subcategory;
    totalBudget += item.amount;
    totalSpent  += (spendMap[key]||0);
  });
  const totalLeft   = totalBudget - totalSpent;
  const totalPct    = totalBudget > 0 ? Math.min((totalSpent/totalBudget)*100, 100) : 0;
  const summaryOver = totalSpent > totalBudget;
  const summaryWarn = !summaryOver && totalPct >= 75;
  const sumBarCol   = summaryOver?'#f87171':summaryWarn?'#f59e0b':'var(--accent)';
  const sumLeftCol  = summaryOver?'var(--expense)':summaryWarn?'#f59e0b':'var(--income)';

  // ── SUMMARY BAR ──
  let sumEl = document.getElementById('budgetSummaryBar');
  if (!sumEl) {
    sumEl = document.createElement('div');
    sumEl.id = 'budgetSummaryBar';
    container.parentNode.insertBefore(sumEl, container);
  }
  sumEl.style.display = 'block';
  sumEl.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:14px">
      <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Monthly Summary</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;text-align:center">
        <div>
          <div style="font-size:10px;color:var(--text3);margin-bottom:3px">TOTAL BUDGET</div>
          <div style="font-family:var(--mono);font-size:15px;font-weight:700;color:var(--text)">${fmtAmt(totalBudget)}</div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--text3);margin-bottom:3px">SPENT</div>
          <div style="font-family:var(--mono);font-size:15px;font-weight:700;color:var(--expense)">${fmtAmt(totalSpent)}</div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--text3);margin-bottom:3px">${summaryOver?'OVER':'BALANCE'}</div>
          <div style="font-family:var(--mono);font-size:15px;font-weight:700;color:${sumLeftCol}">${summaryOver?'-':''}${fmtAmt(Math.abs(totalLeft))}</div>
        </div>
      </div>
      <div style="height:8px;background:var(--bg3);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${totalPct.toFixed(1)}%;background:${sumBarCol};border-radius:4px;transition:width 0.5s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px">
        <span style="font-size:10px;color:var(--text3)">${totalPct.toFixed(0)}% used</span>
        <span style="font-size:10px;color:var(--text3)">${daysLeft > 0 ? daysLeft+'d left in month' : 'Month complete'}</span>
      </div>
    </div>`;

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
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--text3)">${pct.toFixed(0)}% used${daysLeft>0?' · '+daysLeft+'d left':''}</span>
            <button onclick="editBudgetItem('${month}','${item.id}')" style="background:rgba(0,212,170,0.1);border:1px solid rgba(0,212,170,0.3);border-radius:6px;cursor:pointer;color:var(--accent);font-size:12px;padding:3px 8px;font-weight:600">✏ Edit</button>
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
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/syndy-wallet/service-worker.js').catch(()=>{});
  const istDate = istNow();
  document.getElementById('dashDate').textContent = istDate.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  document.getElementById('reportMonthPicker').value = currentMonth();
  const bp = document.getElementById('budgetMonthPicker');
  if (bp && !bp.value) bp.value = currentMonth();
  showPage('dashboard');
  // Run IDB recovery check in background (won't interrupt normal load)
  recoverFromIDB().catch(() => {});
}

document.addEventListener('DOMContentLoaded', init);
