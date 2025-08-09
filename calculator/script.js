const display = document.getElementById('display');
const memoryListEl = document.getElementById('memoryList');
const memoryCountEl = document.getElementById('memoryCount');

let displayExpression = '0';
let currentValue = null;
let operator = null;
let waitingForOperand = false;
let currentInput = '0';
let previousInput = null;

let memory = loadMemory();

function updateDisplay() {
    display.textContent = displayExpression;
  }

function performCalculation(first, second, op) {
  switch (op) {
    case '+': return first + second;
    case '-': return first - second;
    case '*': return first * second;
    case '/':
      if (second === 0) { alert('Sıfıra bölme hatası!'); return first; }
      return first / second;
    default:  return second;
  }
}

function saveMemory() {
  localStorage.setItem('calculator_memory', JSON.stringify(memory));
  renderMemory();
}

function loadMemory() {
  try {
    const raw = localStorage.getItem('calculator_memory');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function renderMemory() {
  memoryListEl.innerHTML = '';
  memoryCountEl.textContent = `${memory.length} kayıt`;

  if (!memory.length) {
    memoryListEl.innerHTML = '<li class="text-sm text-gray-500">Kayıt yok.</li>';
    return;
  }

  memory.forEach((val, idx) => {
    const li = document.createElement('li');
    li.className = 'bg-white rounded-lg border border-gray-200 px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50';
    li.title = 'Ekrana getir';

    const left = document.createElement('span');
    left.className = 'font-mono text-sm text-gray-700';
    left.textContent = val;

    li.addEventListener('click', () => {
      currentInput = String(val);
      waitingForOperand = false;
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

function setOperator(nextOperator) {
    const inputValue = parseFloat(currentInput);
  
    if (operator && waitingForOperand) {
      operator = nextOperator;
      currentInput = currentInput.slice(0, -1) + nextOperator;
      updateDisplay();
      return;
    }
  
    if (previousInput === null) {
      previousInput = inputValue;
    } else if (operator) {
      const newValue = performCalculation(previousInput, inputValue, operator);
      previousInput = newValue;
      currentInput = String(newValue);
    }
  
    operator = nextOperator;
    currentInput = currentInput + nextOperator;
    updateDisplay();
    waitingForOperand = true;
  }

  function calculate() {
    try {
      const result = Function(`return ${displayExpression}`)();
      displayExpression = String(result % 1 !== 0 ? parseFloat(result.toFixed(8)) : result);
      operator = null;
      currentValue = null;
      waitingForOperand = false;
      updateDisplay();
    } catch {
      alert('Geçersiz ifade');
    }
  }

function clearAll() {
  currentInput = '0';
  operator = null;
  previousInput = null;
  waitingForOperand = false;
  updateDisplay();
}

function deleteLast() {
  if (waitingForOperand) return;
  if (currentInput.length > 1) currentInput = currentInput.slice(0, -1);
  else currentInput = '0';
  updateDisplay();
}

function appendToDisplay(value) {
    const ops = ['+', '-', '*', '/'];
  
    // Operatör
    if (ops.includes(value)) {
      if (operator && waitingForOperand) {
        displayExpression = displayExpression.slice(0, -1) + value;
        operator = value;
        updateDisplay();
        return;
      }
      currentValue = parseFloat(displayExpression);
      operator = value;
      displayExpression += value;
      waitingForOperand = false; // ikinci sayı yazılacak
      updateDisplay();
      return;
    }
  
    // Nokta
    if (value === '.') {
      const parts = displayExpression.split(/[+\-*/]/);
      const lastPart = parts[parts.length - 1];
      if (!lastPart.includes('.')) {
        displayExpression += '.';
        updateDisplay();
      }
      return;
    }
  
    // Sayı
    if (displayExpression === '0' && value !== '.') {
      displayExpression = value;
    } else {
      displayExpression += value;
    }
    updateDisplay();
  }

function memoryStore() {
  const val = parseFloat(currentInput);
  if (isNaN(val)) return;
  memory.unshift(Number((val % 1 !== 0 ? parseFloat(val.toFixed(8)) : val)));
  saveMemory();
}

function memoryRecall() {
  if (!memory.length) return;
  currentInput = String(memory[0]);
  waitingForOperand = false;
  updateDisplay();
}

function memoryAdd() {
  const val = parseFloat(currentInput);
  if (isNaN(val)) return;

  if (!memory.length) {
    memory.unshift(val);
  } else {
    memory[0] = Number((memory[0] + val).toFixed(8));
  }
  saveMemory();
}

function memorySubtract() {
  const val = parseFloat(currentInput);
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

  if (k === 'Enter' || k === '=') { e.preventDefault(); calculate(); }
  if (k === 'Escape' || k.toLowerCase() === 'c') clearAll();
  if (k === 'Backspace') { e.preventDefault(); deleteLast(); }

  if (k.toLowerCase() === 'm') memoryStore();
  if (k.toLowerCase() === 'r') memoryRecall();
  if (k === ']') memoryAdd();
  if (k === '[') memorySubtract();
});

updateDisplay();
renderMemory();
