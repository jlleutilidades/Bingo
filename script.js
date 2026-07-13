// ============================================================
// SELEÇÃO DE ELEMENTOS DOM
// ============================================================
const mainNumberTop = document.getElementById('mainNumberTop');
const bingoLetter = document.getElementById('bingoLetter');
const bingoNumber = document.getElementById('bingoNumber');
const numberRoulette = document.getElementById('numberRoulette');
const rouletteContainer = document.getElementById('rouletteContainer');
const drawButton = document.getElementById('drawButton');
const resetButton = document.getElementById('resetButton');
const fullscreenButton = document.getElementById('fullscreenButton');
const themeButton = document.getElementById('themeButton');
const createCardsButton = document.getElementById('createCardsButton');
const sorteadosLine = document.getElementById('sorteadosLine');
const restantesLine = document.getElementById('restantesLine');
const saveStatusEl = document.getElementById('saveStatus');
const confirmModal = document.getElementById('confirmModal');
const cardsModal = document.getElementById('cardsModal');
const confirmResetBtn = document.getElementById('confirmReset');
const cancelResetBtn = document.getElementById('cancelReset');
const generateCardsBtn = document.getElementById('generateCards');
const cancelCardsBtn = document.getElementById('cancelCards');
const cardsQuantityInput = document.getElementById('cardsQuantity');
const leftNumbers = document.getElementById('leftNumbers');
const rightNumbers = document.getElementById('rightNumbers');
const announcement = document.getElementById('announcement');

// ============================================================
// VARIÁVEIS DE ESTADO
// ============================================================
let numbers = Array.from({ length: 75 }, (_, i) => i + 1);
let drawn = [];
let isDarkMode = false;
let isAnimating = false;
let lastSaveTime = null;

// ============================================================
// CONSTANTES
// ============================================================
const STORAGE_KEYS = {
  DRAWN_NUMBERS: 'bingo_drawn_numbers',
  GAME_STATE: 'bingo_game_state',
  THEME: 'bingo_dark_mode',
  LAST_SAVE: 'bingo_last_save'
};

const rouletteSound = new Audio('sounds/SomRoleta.mp3');
rouletteSound.volume = 0.7;
rouletteSound.loop = false;

// ============================================================
// FUNÇÕES DE SALVAMENTO
// ============================================================
function saveGameState() {
  try {
    const gameState = {
      drawn: drawn,
      timestamp: new Date().toISOString(),
      lastNumber: drawn.length > 0 ? drawn[drawn.length - 1] : null
    };
    
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(gameState));
    localStorage.setItem(STORAGE_KEYS.DRAWN_NUMBERS, JSON.stringify(drawn));
    
    lastSaveTime = new Date();
    updateSaveStatus('success', 'Salvo');
    console.log('✅ Jogo salvo:', gameState);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar jogo:', error);
    updateSaveStatus('error', 'Erro');
    return false;
  }
}

function loadGameState() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
    const savedNumbers = localStorage.getItem(STORAGE_KEYS.DRAWN_NUMBERS);
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const savedLastSave = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
    
    if (savedTheme === 'true') {
      isDarkMode = true;
      document.body.classList.add('dark-mode');
      themeButton.textContent = '☀️ Tema';
    }
    
    if (savedLastSave) {
      lastSaveTime = new Date(savedLastSave);
    }
    
    if (savedState && savedNumbers) {
      const state = JSON.parse(savedState);
      drawn = JSON.parse(savedNumbers);
      
      if (drawn.length > 0) {
        updateSaveStatus('info', `${drawn.length} números`);
        updateInterfaceFromSavedState();
        updateCounters();
        
        if (state.lastNumber) {
          updateMainNumberDisplay(state.lastNumber);
        } else {
          resetMainNumberDisplay();
        }
        
        if (drawn.length === 75) {
          drawButton.disabled = true;
          announcement.textContent = 'Todos os números foram sorteados! Bingo!';
        }
        
        console.log('🔄 Jogo restaurado:', state);
        
        setTimeout(() => {
          updateSaveStatus('success', 'Salvo');
        }, 3000);
        
        return true;
      }
    }
    
    resetGame();
    updateSaveStatus('success', 'Salvo');
    return false;
  } catch (error) {
    console.error('❌ Erro ao carregar jogo:', error);
    updateSaveStatus('error', 'Erro');
    resetGame();
    return false;
  }
}

function updateInterfaceFromSavedState() {
  drawn.forEach(num => {
    const numElement = document.getElementById('num' + num);
    if (numElement) {
      numElement.classList.add('active');
    }
  });
  
  if (drawn.length > 0) {
    const lastNum = drawn[drawn.length - 1];
    const lastNumElement = document.getElementById('num' + lastNum);
    if (lastNumElement) {
      lastNumElement.classList.add('recent');
      setTimeout(() => {
        lastNumElement.classList.remove('recent');
      }, 3000);
    }
  }
}

function updateSaveStatus(type, message) {
  const colors = {
    success: 'var(--success)',
    error: 'var(--danger)',
    warning: 'var(--warning)',
    info: 'var(--primary)',
    saving: 'var(--warning)'
  };
  
  const messages = {
    success: 'Salvo',
    error: 'Erro',
    warning: 'Atenção',
    info: 'Info',
    saving: 'Salvando...'
  };
  
  const statusType = type || 'info';
  const statusMessage = message || messages[statusType] || 'Info';
  const color = colors[statusType] || colors.info;
  
  saveStatusEl.textContent = statusMessage;
  saveStatusEl.style.color = color;
  saveStatusEl.classList.add('saved');
  
  setTimeout(() => {
    saveStatusEl.classList.remove('saved');
  }, 2000);
  
  if (statusType === 'success') {
    localStorage.setItem(STORAGE_KEYS.LAST_SAVE, new Date().toISOString());
  }
}

function showSaveMessage(message, duration = 2000) {
  updateSaveStatus('saving', message);
  setTimeout(() => {
    updateSaveStatus('success', 'Salvo');
  }, duration);
}

let saveTimeout = null;

function autoSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  updateSaveStatus('saving', 'Salvando...');
  
  saveTimeout = setTimeout(() => {
    saveGameState();
  }, 500);
}

function setupBeforeUnload() {
  window.addEventListener('beforeunload', function (e) {
    saveGameState();
  });
}

// ============================================================
// FUNÇÕES DE EXIBIÇÃO
// ============================================================
function getBingoLetter(number) {
  if (number >= 1 && number <= 15) return 'B';
  if (number >= 16 && number <= 30) return 'I';
  if (number >= 31 && number <= 45) return 'N';
  if (number >= 46 && number <= 60) return 'G';
  if (number >= 61 && number <= 75) return 'O';
  return '';
}

function updateMainNumberDisplay(number) {
  const letter = getBingoLetter(number);
  bingoLetter.textContent = letter;
  bingoNumber.textContent = number;
}

function resetMainNumberDisplay() {
  bingoLetter.textContent = '--';
  bingoNumber.textContent = '--';
  bingoLetter.style.color = '';
}

// ============================================================
// INICIALIZAÇÃO DOS NÚMEROS
// ============================================================
function initializeNumbers() {
  leftNumbers.innerHTML = '';
  rightNumbers.innerHTML = '';
  
  createNumberRow(leftNumbers, 1, 5);
  createNumberRow(leftNumbers, 11, 15);
  createNumberRow(leftNumbers, 21, 25);
  createNumberRow(leftNumbers, 31, 35);
  createNumberRow(leftNumbers, 41, 45);
  createNumberRow(leftNumbers, 51, 55);
  createNumberRow(leftNumbers, 61, 65);
  createNumberRow(leftNumbers, 71, 75);
  
  createNumberRow(rightNumbers, 6, 10);
  createNumberRow(rightNumbers, 16, 20);
  createNumberRow(rightNumbers, 26, 30);
  createNumberRow(rightNumbers, 36, 40);
  createNumberRow(rightNumbers, 46, 50);
  createNumberRow(rightNumbers, 56, 60);
  createNumberRow(rightNumbers, 66, 70);
}

function createNumberRow(container, start, end) {
  const row = document.createElement('div');
  row.className = 'numbers-row';
  
  for (let i = start; i <= end; i++) {
    const el = document.createElement('div');
    el.className = 'num';
    el.id = 'num' + i;
    el.textContent = i;
    row.appendChild(el);
  }
  
  container.appendChild(row);
}

function updateCounters() {
  sorteadosLine.textContent = `Sorteados: ${drawn.length}/75`;
  restantesLine.textContent = `Restantes: ${75 - drawn.length}`;
}

// ============================================================
// ANIMAÇÃO DA ROLETA
// ============================================================
function startRouletteAnimation(finalNumber) {
  if (isAnimating) return;
  
  isAnimating = true;
  drawButton.disabled = true;
  
  mainNumberTop.style.display = 'none';
  numberRoulette.style.display = 'flex';
  
  rouletteContainer.innerHTML = '';
  
  try {
    rouletteSound.currentTime = 0;
    rouletteSound.play().catch(e => {
      console.log('Erro ao reproduzir som da roleta:', e);
      const fallbackSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-changing-tab-206.mp3');
      fallbackSound.volume = 0.7;
      fallbackSound.play();
    });
  } catch (e) {
    console.log('Erro no som da roleta:', e);
  }
  
  const numbersToShow = 20;
  let currentIndex = 0;
  const availableNumbers = numbers.filter(n => !drawn.includes(n) && n !== finalNumber);
  
  const interval = setInterval(() => {
    rouletteContainer.innerHTML = '';
    
    let randomNum;
    if (currentIndex < numbersToShow - 5) {
      randomNum = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    } else if (currentIndex < numbersToShow - 2) {
      const range = Math.min(10, availableNumbers.length);
      const startIndex = Math.max(0, availableNumbers.indexOf(finalNumber) - range);
      const endIndex = Math.min(availableNumbers.length - 1, availableNumbers.indexOf(finalNumber) + range);
      const nearbyNumbers = availableNumbers.slice(startIndex, endIndex + 1);
      randomNum = nearbyNumbers[Math.floor(Math.random() * nearbyNumbers.length)];
    } else {
      randomNum = finalNumber;
    }
    
    const numberElement = document.createElement('div');
    numberElement.className = 'roulette-number';
    numberElement.textContent = randomNum;
    numberElement.style.opacity = '1';
    numberElement.style.transform = 'translateY(0)';
    rouletteContainer.appendChild(numberElement);
    
    currentIndex++;
    
    if (currentIndex >= numbersToShow) {
      clearInterval(interval);
      
      try {
        rouletteSound.pause();
        rouletteSound.currentTime = 0;
      } catch (e) {
        console.log('Erro ao parar som da roleta:', e);
      }
      
      setTimeout(() => {
        finishRouletteAnimation(finalNumber);
      }, 1000);
    }
  }, 100);
}

function finishRouletteAnimation(finalNumber) {
  numberRoulette.style.display = 'none';
  mainNumberTop.style.display = 'flex';
  
  updateMainNumberDisplay(finalNumber);
  drawn.push(finalNumber);
  
  const numElement = document.getElementById('num' + finalNumber);
  numElement.classList.add('recent');
  numElement.classList.add('active');
  
  updateCounters();
  autoSave();
  
  mainNumberTop.classList.add('animate');
  setTimeout(() => {
    mainNumberTop.classList.remove('animate');
  }, 500);
  
  const letter = getBingoLetter(finalNumber);
  announcement.textContent = `Número sorteado: ${letter} ${finalNumber}`;
  
  setTimeout(() => {
    numElement.classList.remove('recent');
  }, 3000);
  
  if (drawn.length === 75) {
    drawButton.disabled = true;
    announcement.textContent = 'Todos os números foram sorteados! Bingo!';
    autoSave();
  }
  
  isAnimating = false;
  drawButton.disabled = false;
}

// ============================================================
// FUNÇÕES PRINCIPAIS
// ============================================================
function drawNumber() {
  if (isAnimating) return;
  
  const remaining = numbers.filter(n => !drawn.includes(n));
  if (remaining.length === 0) {
    alert('Todos os números já foram sorteados!');
    return;
  }
  
  const n = remaining[Math.floor(Math.random() * remaining.length)];
  startRouletteAnimation(n);
}

function resetGame() {
  drawn = [];
  resetMainNumberDisplay();
  mainNumberTop.style.display = 'flex';
  numberRoulette.style.display = 'none';
  
  document.querySelectorAll('.num').forEach(e => {
    e.classList.remove('active');
    e.classList.remove('recent');
  });
  
  updateCounters();
  drawButton.disabled = false;
  announcement.textContent = 'Jogo resetado. Pronto para começar!';
  isAnimating = false;
  
  autoSave();
  
  try {
    rouletteSound.pause();
    rouletteSound.currentTime = 0;
  } catch (e) {
    console.log('Erro ao parar som:', e);
  }
}

// ============================================================
// CONTROLES DE INTERFACE
// ============================================================
function toggleTheme() {
  isDarkMode = !isDarkMode;
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    themeButton.textContent = '☀️ Tema';
  } else {
    document.body.classList.remove('dark-mode');
    themeButton.textContent = '🌓 Tema';
  }
  
  localStorage.setItem(STORAGE_KEYS.THEME, isDarkMode);
  autoSave();
}

function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  if (savedTheme === 'true') {
    isDarkMode = true;
    document.body.classList.add('dark-mode');
    themeButton.textContent = '☀️ Tema';
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Erro ao tentar entrar em modo tela cheia: ${err.message}`);
    });
    document.body.classList.add('fullscreen');
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      document.body.classList.remove('fullscreen');
    }
  }
}

function showResetConfirmation() {
  confirmModal.classList.add('show');
}

function closeResetConfirmation() {
  confirmModal.classList.remove('show');
}

function showCardsModal() {
  cardsModal.classList.add('show');
}

function closeCardsModal() {
  cardsModal.classList.remove('show');
}

// ============================================================
// GERAÇÃO DE CARTELAS
// ============================================================
function generateBingoCard() {
  const card = [];
  const ranges = [
    { min: 1, max: 15 },
    { min: 16, max: 30 },
    { min: 31, max: 45 },
    { min: 46, max: 60 },
    { min: 61, max: 75 }
  ];
  
  for (let i = 0; i < 5; i++) {
    const column = [];
    const usedNumbers = new Set();
    
    for (let j = 0; j < 5; j++) {
      if (i === 2 && j === 2) {
        column.push('FREE');
      } else {
        let num;
        do {
          num = Math.floor(Math.random() * (ranges[i].max - ranges[i].min + 1)) + ranges[i].min;
        } while (usedNumbers.has(num));
        usedNumbers.add(num);
        column.push(num);
      }
    }
    card.push(column);
  }
  
  return card;
}

async function generatePDF() {
  const quantity = parseInt(cardsQuantityInput.value) || 4;
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const cardsPerPage = 4;
  const totalPages = Math.ceil(quantity / cardsPerPage);
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const cardWidth = 90;
  const cardHeight = 115;
  const cellSize = 16;
  
  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage();
    }
    
    const startCard = page * cardsPerPage;
    const endCard = Math.min(startCard + cardsPerPage, quantity);
    
    for (let i = startCard; i < endCard; i++) {
      const card = generateBingoCard();
      const position = i % cardsPerPage;
      const row = Math.floor(position / 2);
      const col = position % 2;
      
      const x = margin + col * (cardWidth + 10);
      const y = margin + row * (cardHeight + 15);
      
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0);
      pdf.text(`Cartela ${i + 1}`, x + cardWidth/2, y - 3, { align: 'center' });
      
      pdf.setFontSize(13);
      pdf.setFont(undefined, 'bold');
      const headerY = y + 8;
      pdf.text('B', x + cellSize/2, headerY);
      pdf.text('I', x + cellSize * 1.5, headerY);
      pdf.text('N', x + cellSize * 2.5, headerY);
      pdf.text('G', x + cellSize * 3.5, headerY);
      pdf.text('O', x + cellSize * 4.5, headerY);
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const numX = x + (c * cellSize);
          const numY = y + 15 + (r * cellSize);
          
          pdf.setDrawColor(0);
          pdf.setLineWidth(0.2);
          pdf.rect(numX, numY, cellSize, cellSize);
          
          if (card[c][r] === 'FREE') {
            pdf.setTextColor(100);
            pdf.setFontSize(10);
            pdf.text('FREE', numX + cellSize/2, numY + cellSize/2 + 2, { align: 'center' });
            pdf.setTextColor(0);
            pdf.setFontSize(12);
          } else {
            pdf.text(card[c][r].toString(), numX + cellSize/2, numY + cellSize/2 + 2, { align: 'center' });
          }
        }
      }
    }
    
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(100);
    pdf.text(`Página ${page + 1} de ${totalPages} - Sistema de Bingo`, 
             pageWidth/2, pageHeight - 5, { align: 'center' });
  }
  
  pdf.save(`cartelas_bingo_${quantity}.pdf`);
  closeCardsModal();
}

// ============================================================
// EVENTOS E INICIALIZAÇÃO
// ============================================================
drawButton.onclick = drawNumber;
resetButton.onclick = showResetConfirmation;
fullscreenButton.onclick = toggleFullscreen;
themeButton.onclick = toggleTheme;
createCardsButton.onclick = showCardsModal;

confirmResetBtn.onclick = () => {
  resetGame();
  closeResetConfirmation();
};

cancelResetBtn.onclick = closeResetConfirmation;
generateCardsBtn.onclick = generatePDF;
cancelCardsBtn.onclick = closeCardsModal;

confirmModal.onclick = (e) => {
  if (e.target === confirmModal) {
    closeResetConfirmation();
  }
};

cardsModal.onclick = (e) => {
  if (e.target === cardsModal) {
    closeCardsModal();
  }
};

initializeNumbers();
updateCounters();
loadTheme();
loadGameState();
setupBeforeUnload();

setTimeout(() => {
  updateSaveStatus('success', 'Salvo');
}, 100);

// ===== ATALHOS DE TECLADO =====
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    drawNumber();
  } else if (e.key === 'r' || e.key === 'R') {
    if (e.ctrlKey) {
      showResetConfirmation();
    }
  } else if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen();
  } else if (e.key === 't' || e.key === 'T') {
    if (e.ctrlKey) {
      toggleTheme();
    }
  } else if (e.key === 'c' || e.key === 'C') {
    if (e.ctrlKey) {
      showCardsModal();
    }
  } else if (e.key === 'Escape') {
    closeResetConfirmation();
    closeCardsModal();
  } else if (e.key === 's' || e.key === 'S') {
    if (e.ctrlKey) {
      e.preventDefault();
      saveGameState();
      showSaveMessage('Salvando...');
    }
  }
});

// ===== SALVAMENTO AUTOMÁTICO =====
setInterval(() => {
  if (drawn.length > 0) {
    autoSave();
  }
}, 30000);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && drawn.length > 0) {
    saveGameState();
  }
});

// ===== FUNÇÃO DE AJUSTE PARA RODAPÉ =====
function adjustLayoutForFooter() {
  const footer = document.querySelector('footer');
  const container = document.querySelector('.container');
  const isMobile = window.innerWidth <= 768;
  
  if (footer && container) {
    if (isMobile) {
      container.style.paddingBottom = '20px';
    } else {
      const footerHeight = footer.offsetHeight;
      document.body.style.paddingBottom = footerHeight + 'px';
    }
  }
}

function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

window.addEventListener('load', adjustLayoutForFooter);
window.addEventListener('resize', debounce(adjustLayoutForFooter, 250));

// ===== TELA CHEIA COM AJUSTE =====
const originalToggleFullscreen = toggleFullscreen;
toggleFullscreen = function() {
  originalToggleFullscreen();
  setTimeout(adjustLayoutForFooter, 100);
};
fullscreenButton.onclick = toggleFullscreen;