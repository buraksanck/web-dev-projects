const display = document.getElementById('display');
const memoryListEl = document.getElementById('memoryList');
const memoryCountEl = document.getElementById('memoryCount');

let displayExpression = '0';
let memory = loadMemory();

function updateDisplay() {
  display.textContent = displayExpression;
}

function saveMemory() {
  localStorage.setItem('calculator_memory', JSON.stringify(memory));
  renderMemory();
}

function loadMemory() {
  try {
    const raw = localStorage.getItem('calculator_memory');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function isOperator(ch) {
  return ['+', '-', '*', '/'].includes(ch);
}

function lastTokenIsOperator(expr) {
  if (!expr.length) return false;
  return isOperator(expr[expr.length - 1]);
}

function getLastNumberChunk(expr) {
  const parts = expr.split(/([+\-*/])/);
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] && !isOperator(parts[i])) return parts[i];
  }
  return '';
}

// === Memory UI ===
function renderMemory() {
  memoryListEl.innerHTML = '';
  memoryCountEl.textContent = `${memory.length} kayıt`;

  if (!memory.length) {
    memoryListEl.innerHTML = '<li class="text-sm text-gray-500">Kayıt yok.</li>';
    return;
  }

  memory.forEach((val, idx) => {
    const li = document.createElement('li');
    li.className =
      'bg-white rounded-lg border border-gray-200 px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50';
    li.title = 'Ekrana getir';

    const left = document.createElement('span');
    left.className = 'font-mono text-sm text-gray-700';
    left.textContent = val;

    li.addEventListener('click', () => {
      displayExpression = String(val);
      updateDisplay();
    });

    const del = document.createElement('button');
    del.className = 'text-gray-400 hover:text-red-500 text-sm';
    del.innerHTML = '🗑';
    del.title = 'Sil';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      memory.splice(idx, 1);
      saveMemory();
    });

    li.appendChild(left);
    li.appendChild(del);
    memoryListEl.appendChild(li);
  });
}

function clearAll() {
  displayExpression = '0';
  updateDisplay();
}

function deleteLast() {
  if (displayExpression.length > 1) {
    displayExpression = displayExpression.slice(0, -1);
  } else {
    displayExpression = '0';
  }
  updateDisplay();
}

function appendToDisplay(value) {
  if (isOperator(value)) {
    if (displayExpression === '0') return;

    if (lastTokenIsOperator(displayExpression)) {
      displayExpression = displayExpression.slice(0, -1) + value;
    } else {
      displayExpression += value;
    }
    updateDisplay();
    return;
  }

  if (value === '.') {
    const lastNum = getLastNumberChunk(displayExpression);
    if (!lastNum.includes('.')) {
      if (displayExpression === '0') {
        displayExpression = '0.';
      } else {
        displayExpression += '.';
      }
      updateDisplay();
    }
    return;
  }

  // Sayı ise
  if (displayExpression === '0') {
    displayExpression = value;
  } else {
    displayExpression += value;
  }
  updateDisplay();
}

function calculate() {
  try {
    let expr = displayExpression;
    while (expr.length && isOperator(expr[expr.length - 1])) {
      expr = expr.slice(0, -1);
    }
    if (!expr.length) expr = '0';

    const result = Function(`return (${expr})`)();
    const normalized =
      typeof result === 'number' && isFinite(result)
        ? (result % 1 !== 0 ? parseFloat(result.toFixed(8)) : result)
        : 0;

    displayExpression = String(normalized);
    updateDisplay();
  } catch {
    alert('Geçersiz ifade');
  }
}

function memoryStore() {
  const val = parseFloat(displayExpression);
  if (isNaN(val)) return;
  memory.unshift(Number(val % 1 !== 0 ? parseFloat(val.toFixed(8)) : val));
  saveMemory();
}

function memoryRecall() {
  if (!memory.length) return;
  displayExpression = String(memory[0]);
  updateDisplay();
}

function memoryAdd() {
  const val = parseFloat(displayExpression);
  if (isNaN(val)) return;

  if (!memory.length) {
    memory.unshift(val);
  } else {
    memory[0] = Number((memory[0] + val).toFixed(8));
  }
  saveMemory();
}

function memorySubtract() {
  const val = parseFloat(displayExpression);
  if (isNaN(val)) return;

  if (!memory.length) {
    memory.unshift(-val);
  } else {
    memory[0] = Number((memory[0] - val).toFixed(8));
  }
  saveMemory();
}

function memoryClear() {
  memory = [];
  saveMemory();
}

document.addEventListener('keydown', (e) => {
  const k = e.key;

  if ((k >= '0' && k <= '9') || k === '.') appendToDisplay(k);
  if (['+', '-', '*', '/'].includes(k)) appendToDisplay(k);

  if (k === 'Enter' || k === '=') {
    e.preventDefault();
    calculate();
  }
  if (k === 'Escape' || k.toLowerCase() === 'c') clearAll();
  if (k === 'Backspace') {
    e.preventDefault();
    deleteLast();
  }

  if (k.toLowerCase() === 'm') memoryStore();
  if (k.toLowerCase() === 'r') memoryRecall();
  if (k === ']') memoryAdd();
  if (k === '[') memorySubtract();
});

updateDisplay();
renderMemory();
