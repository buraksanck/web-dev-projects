const rows=document.getElementById("rows")
const updated=document.getElementById("updated")
const count=document.getElementById("count")
const loading=document.getElementById("loading")
const empty=document.getElementById("empty")
const baseSel=document.getElementById("baseSel")
const baseChip=document.getElementById("baseChip")
const intervalSel=document.getElementById("intervalSel")
const refreshBtn=document.getElementById("refreshBtn")
const search=document.getElementById("search")
'use strict';

const EXCHANGE_API_KEY = 'de37b20e00194150869d9861';

const state = {
  baseCode: 'USD',
  targetCode: 'TRY',
  amount: 1,
  supportedCodes: [],
  latestRates: null,
};

const els = {
  amountInput: document.getElementById('amountInput'),
  fromSelect: document.getElementById('fromSelect'),
  toSelect: document.getElementById('toSelect'),
  swapBtn: document.getElementById('swapBtn'),
  convertBtn: document.getElementById('convertBtn'),
  resultText: document.getElementById('resultText'),
  conversionLine: document.getElementById('conversionLine'),
  errorText: document.getElementById('errorText'),
  status: document.getElementById('status'),
  ratesGrid: document.getElementById('ratesGrid'),
  baseInfo: document.getElementById('baseInfo'),
  lastUpdated: document.getElementById('lastUpdated'),
  metaInfo: document.getElementById('metaInfo'),
  keyPreview: document.getElementById('keyPreview'),
  ratesTableBody: document.getElementById('ratesTableBody'),
  ratesShown: document.getElementById('ratesShown'),
  ratesTotal: document.getElementById('ratesTotal'),
  tableBaseCode: document.getElementById('tableBaseCode'),
};

function maskKey(key) {
  if (!key) return '';
  if (key.length <= 4) return '••' + key;
  const visible = key.slice(-4);
  return '••••••' + visible;
}

function formatNumber(n, maxFractionDigits = 4) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: maxFractionDigits }).format(n);
}

async function apiGet(path) {
  const url = `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  const data = await res.json();
  if (data.result && data.result !== 'success') {
    throw new Error(data['error-type'] || 'API error');
  }
  return data;
}

async function loadSupportedCodes() {
  els.status.textContent = 'Para birimleri yükleniyor…';
  const data = await apiGet('/codes');
  state.supportedCodes = data.supported_codes || [];
  populateSelects();
  els.status.textContent = 'Kurlar alınıyor…';
}

function populateSelects() {
  const fragFrom = document.createDocumentFragment();
  const fragTo = document.createDocumentFragment();
  const makeOption = (code, name) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = `${code} — ${name}`;
    return opt;
  };
  state.supportedCodes.forEach(([code, name]) => {
    fragFrom.appendChild(makeOption(code, name));
    fragTo.appendChild(makeOption(code, name));
  });
  els.fromSelect.innerHTML = '';
  els.toSelect.innerHTML = '';
  els.fromSelect.appendChild(fragFrom);
  els.toSelect.appendChild(fragTo);
  els.fromSelect.value = state.baseCode;
  els.toSelect.value = state.targetCode;
}

async function loadLatest(baseCode) {
  const data = await apiGet(`/latest/${baseCode}`);
  state.latestRates = data;
  state.baseCode = data.base_code;
  updateMeta(data);
  renderQuickRates();
  renderRatesTable();
}

function updateMeta(data) {
  els.baseInfo.textContent = `Baz: ${data.base_code}`;
  if (data.time_last_update_unix) {
    const dt = new Date(data.time_last_update_unix * 1000);
    els.lastUpdated.textContent = `Son güncelleme: ${dt.toLocaleString('tr-TR')}`;
    els.metaInfo.textContent = `Son güncelleme: ${dt.toLocaleTimeString('tr-TR')}`;
  }
}

function renderQuickRates() {
  const preferred = ['USD','EUR','TRY','GBP','JPY','CHF','CNY','RUB'];
  const grid = els.ratesGrid;
  grid.innerHTML = '';
  if (!state.latestRates || !state.latestRates.conversion_rates) return;
  preferred.forEach(code => {
    const rate = state.latestRates.conversion_rates[code];
    if (!rate) return;
    const row = document.createElement('div');
    row.className = 'rate-card';
    row.innerHTML = `
      <div style="display:grid; gap:4px;">
        <div style="font-weight:700;">1 ${state.baseCode} → ${code}</div>
        <div class="small">${state.baseCode}/${code}</div>
      </div>
      <div style="font-weight:700;">${formatNumber(rate, 6)}</div>
    `;
    grid.appendChild(row);
  });
}

function renderRatesTable() {
  const tbody = els.ratesTableBody;
  if (!tbody || !state.latestRates || !state.latestRates.conversion_rates) return;
  const entries = Object.entries(state.latestRates.conversion_rates);
  els.ratesTotal.textContent = String(entries.length);
  els.tableBaseCode.textContent = state.baseCode;
  const capped = entries
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, 60);
  els.ratesShown.textContent = String(capped.length);
  tbody.innerHTML = capped
    .map(([code, rate]) => `<tr>
      <td style="padding:10px 8px; border-bottom:1px solid var(--border);">${code}</td>
      <td style="padding:10px 8px; border-bottom:1px solid var(--border);">${formatNumber(rate, 6)}</td>
    </tr>`)
    .join('');
}

function convertAmount() {
  const amount = Number(els.amountInput.value);
  const from = els.fromSelect.value;
  const to = els.toSelect.value;
  if (!Number.isFinite(amount) || amount < 0) {
    showError('Lütfen geçerli bir miktar girin.');
    return;
  }
  state.amount = amount;
  state.baseCode = from;
  state.targetCode = to;
  performConversion(from, to, amount).catch(err => showError(err.message));
}

async function performConversion(from, to, amount) {
  try {
    clearError();
    els.status.textContent = 'Dönüştürülüyor…';
    let rate;
    if (state.latestRates && state.latestRates.base_code === from) {
      rate = state.latestRates.conversion_rates[to];
    }
    if (!rate) {
      const data = await apiGet(`/pair/${from}/${to}`);
      rate = data.conversion_rate;
      updateMeta(data);
    }
    const result = amount * rate;
    els.resultText.textContent = `${formatNumber(result, 6)} ${to}`;
    els.conversionLine.textContent = `${formatNumber(amount)} ${from} = ${formatNumber(result, 6)} ${to}  (1 ${from} → ${formatNumber(rate, 6)} ${to})`;
  } finally {
    els.status.textContent = '';
  }
}

function swapCurrencies() {
  const a = els.fromSelect.value;
  const b = els.toSelect.value;
  els.fromSelect.value = b;
  els.toSelect.value = a;
  convertAmount();
}

function clearError() {
  els.errorText.style.display = 'none';
  els.errorText.textContent = '';
}

function showError(msg) {
  els.errorText.style.display = 'block';
  els.errorText.textContent = msg;
}

function attachEvents() {
  els.convertBtn.addEventListener('click', convertAmount);
  els.swapBtn.addEventListener('click', swapCurrencies);
  els.amountInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') convertAmount();
  });
  els.fromSelect.addEventListener('change', () => {
    state.baseCode = els.fromSelect.value;
    loadLatest(state.baseCode).catch(err => showError(err.message));
  });
}

async function init() {
  try {
    els.keyPreview.textContent = maskKey(EXCHANGE_API_KEY);
    await loadSupportedCodes();
    await loadLatest(state.baseCode);
    performConversion(state.baseCode, state.targetCode, state.amount).catch(() => {});
  } catch (err) {
    showError(err.message || 'Beklenmeyen bir hata oluştu.');
  } finally {
    attachEvents();
    els.status.textContent = '';
  }
}

document.addEventListener('DOMContentLoaded', init);
