const gridLetters = [
  "ITARDA".split(''),
  "UOHRIT".split(''),
  "GMIDAE".split(''),
  "RESIPW".split(''),
  "IPRTYS".split(''),
  "ITSRWA".split(''),
  "DONKOL".split(''),
  "EGANGE".split('')
];
const themeWords = ['IRIS','RIPTIDE', 'HOME', 'DIRTYPAWS', 'WORKSONG', 'ANGELA'];
const spangram = 'GUITARDATE';
const allSolutions = [...themeWords, spangram];
const wordToPath = {
  'IRIS':[[1,4],[1,3],[2,2],[3,2]],
  'RIPTIDE': [[3,0],[4,0],[4,1],[5,1],[5,0],[6,0],[7,0]],
  'HOME': [[1,2],[1,1],[2,1],[3,1]],
  'DIRTYPAWS': [[2,3],[3,3],[4,2],[4,3],[4,4],[3,4],[2,4],[3,5],[4,5]],
  'WORKSONG': [[5,4],[6,4],[5,3],[6,3],[5,2],[6,1],[6,2],[7,1]],
  'ANGELA': [[7,2],[7,3],[7,4],[7,5],[6,5],[5,5]],
  'GUITARDATE': [[2,0],[1,0],[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[1,5],[2,5]]
};

// Helper to get [row, col] from a touch/mouse event position relative to grid
function getCellFromEvent(e) {
  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.clientX !== undefined) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else return null;

  const wrapper = document.querySelector('.game-wrapper');
  const scale = wrapper.getBoundingClientRect().width / wrapper.offsetWidth;
  const rect = grid.getBoundingClientRect();
  const x = (clientX - rect.left) / scale;
  const y = (clientY - rect.top) / scale;
  const padding = 8;
  const cellSize = 54; // 40px (cell) + 16px (2 * 8px margin)
  const adjustedX = x - padding;
  const adjustedY = y - padding;
  const col = Math.floor(adjustedX / cellSize);
  const row = Math.floor(adjustedY / cellSize);

  if (row >= 0 && row < gridLetters.length && col >= 0 && col < 6) {
    return [row, col];
  }
  return null;
}

// Document-level handlers for touch drag
function handleDocumentTouchMove(e) {
  e.preventDefault();
  const pos = getCellFromEvent(e);
  if (pos) {
    const [r, c] = pos;
    handleMouseMove(r, c, e);
  }
}

function handleDocumentTouchEnd(e) {
  e.preventDefault();
  let endR = startR;
  let endC = startC;
  const pos = getCellFromEvent(e);
  if (pos) {
    [endR, endC] = pos;
  }
  handleMouseUp(endR, endC);
  document.removeEventListener('touchmove', handleDocumentTouchMove, { passive: false });
  document.removeEventListener('touchend', handleDocumentTouchEnd, { passive: false });
}

let found = new Set();
let currentPath = [];
let permanentEdges = [];
let mistakeCount = 0;
let spentHints = 0;
let words = new Set();
let mouseDown = false;
let hasMoved = false;
let startR, startC;
let currentHintWord = null;
let usedWords = new Set();

// --- MEMORY FUNCTIONS ---
function saveState() {
  const state = {
    found: Array.from(found),
    usedWords: Array.from(usedWords),
    mistakeCount,
    spentHints,
    currentHintWord // add this line
  };
  localStorage.setItem('strandsGameState', JSON.stringify(state));
}

function loadState() {
  const stateJSON = localStorage.getItem('strandsGameState');
  if (!stateJSON) return;
  try {
    const state = JSON.parse(stateJSON);
    found = new Set(state.found || []);
    usedWords = new Set(state.usedWords || []);
    mistakeCount = state.mistakeCount || 0;
    spentHints = state.spentHints || 0;

    // Restore UI for found words
    found.forEach(word => {
      const path = wordToPath[word];
      if (path) {
        const className = word === spangram ? 'found-yellow' : 'found-blue';
        path.forEach(([r, c]) => getCell(r, c).classList.add(className));
        for (let i = 1; i < path.length; i++) {
          const [r1, c1] = path[i-1];
          const [r2, c2] = path[i];
          const color = className === 'found-blue' ? "#B8DEEC" : "#F1D046";
          permanentEdges.push([r1, c1, r2, c2, color]);
        }
      }
    });

    // Restore current hint highlight
    if (state.currentHintWord) {
      currentHintWord = state.currentHintWord;
      const path = wordToPath[currentHintWord];
      if (path) {
        path.forEach(([r, c]) => getCell(r, c).classList.add('hint-highlight'));
      }
    }

    foundCountDiv.textContent = `${found.size} of ${themeWords.length + 1} theme words found.`;
    updateHintButton();
    drawEdges();
  } catch(e) {
    console.error("Failed to load game state", e);
  }
}

async function loadDictionary() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt');
    const text = await res.text();
    words = new Set(text.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length >= 4));
  } catch (e) {
    console.error('Failed to load dictionary. Using fallback.');
    words = new Set(['amen', 'real', 'word', 'test', 'laser', 'angel']);
  }
  allSolutions.forEach(w => words.add(w.toLowerCase()));
}
loadDictionary();

const grid = document.querySelector('.grid');
const edgesSvg = document.querySelector('svg.edges');
const currentWordDiv = document.querySelector('.current-word');
const foundCountDiv = document.querySelector('.found-count');
const hintButton = document.querySelector('.hint-button');
hintButton.addEventListener('click', handleHint);

function updateHintButton() {
  const earned = Math.floor(mistakeCount / 3);
  const hintsAvailable = earned - spentHints;
  const currentProgress = mistakeCount % 3;
  let filledFraction = currentProgress / 3;
  if (hintsAvailable > 0) {
    filledFraction = 1;
    hintButton.classList.add('inverted');
  } else {
    hintButton.classList.remove('inverted');
  }
  hintButton.style.background = `linear-gradient(to right, lightgray ${filledFraction * 100}%, white ${filledFraction * 100}%)`;
}

function clearHints() {
  document.querySelectorAll('.hint-highlight').forEach(el => el.classList.remove('hint-highlight'));
}

function handleHint() {
  const hintsAvailable = Math.floor(mistakeCount / 3) - spentHints;
  if (hintsAvailable <= 0) return;
  spentHints += 1;
  updateHintButton();
  saveState();
  if (currentHintWord) return;
  const unsolved = themeWords.filter(w => !found.has(w));
  if (unsolved.length === 0) return;
  currentHintWord = unsolved[Math.floor(Math.random() * unsolved.length)];
  saveState();
  const path = wordToPath[currentHintWord];
  path.forEach(([r, c]) => getCell(r, c).classList.add('hint-highlight'));
}

function isAdjacent(p1, p2) {
  const dr = Math.abs(p1[0] - p2[0]);
  const dc = Math.abs(p1[1] - p2[1]);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

function showMessage(message, duration = 3000) {
  currentWordDiv.classList.add('error');
  currentWordDiv.textContent = message;
  setTimeout(() => {
    currentWordDiv.classList.remove('error');
    if (currentPath.length > 0) {
      currentWordDiv.textContent = currentPath.map(([rr, cc]) => gridLetters[rr][cc]).join('').toUpperCase();
    } else {
      currentWordDiv.textContent = '';
      clearPath();
    }
  }, duration);
}

function clearPath() {
  document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
  currentPath = [];
  currentWordDiv.textContent = '';
  drawEdges();
}

function submit() {
  if (currentPath.length < 4) {
    clearPath();
    return;
  }
  const word = currentPath.map(([r, c]) => gridLetters[r][c]).join('').toUpperCase();
  const lower = word.toLowerCase();
  console.log(`Submitting word: ${word}, lowercase: ${lower}, usedWords:`, Array.from(usedWords));
  if (usedWords.has(lower)) {
    console.log(`Word ${lower} already in usedWords, showing message`);
    showMessage("Word already found...");
    clearPath(); // Clear path when word is already used
    return;
  }
  if (!words.has(lower)) {
    console.log(`Invalid word: ${lower}, not adding to usedWords`);
    showMessage("Not a word...");
    clearPath();
    return;
  }
  usedWords.add(lower);

  if (allSolutions.includes(word)) {
    console.log(`Found solution word: ${word}`);
    const isSpangram = word === spangram;
    const className = isSpangram ? 'found-yellow' : 'found-blue';
    currentPath.forEach(([r, c]) => getCell(r, c).classList.add(className));
    found.add(word);
    foundCountDiv.textContent = `${found.size} of ${themeWords.length + 1} theme words found.`;
    if (word === currentHintWord) {
      clearHints();
      currentHintWord = null;
    }
    for (let i = 1; i < currentPath.length; i++) {
      const [r1, c1] = currentPath[i - 1];
      const [r2, c2] = currentPath[i];
      let color = className === 'found-blue' ? "#B8DEEC" : "#F1D046";
      permanentEdges.push([r1, c1, r2, c2, color]);
    }
    // Display the word or "SPANGRAM!" with appropriate styling
    currentWordDiv.textContent = isSpangram ? 'SPANGRAM!' : word;
    currentWordDiv.classList.remove('error', 'success-theme', 'success-spangram');
    currentWordDiv.classList.add(isSpangram ? 'success-spangram' : 'success-theme');
    drawEdges();
    // Ensure the message stays visible for 3 seconds
    setTimeout(() => {
      currentWordDiv.textContent = '';
      currentWordDiv.classList.remove('success-theme', 'success-spangram');
      clearPath();
    }, 3000);
  } else {
    console.log(`Valid but non-solution word: ${lower}, mistakeCount: ${mistakeCount + 1}`);
    mistakeCount += 1;
    updateHintButton();
    showMessage("Not a theme word...");
    clearPath();
  }
  saveState();
}

function handleMouseDown(r, c) {
  mouseDown = true;
  hasMoved = false;
  startR = r;
  startC = c;
  if (currentHintWord && !found.has(currentHintWord)) {
    return;
  }
  clearHints();
  currentHintWord = null;
}

function handleMouseMove(r, c, event) {
  if (!mouseDown) return;
  if (event.type === 'mousemove' && event.buttons !== 1) return;
  if (!hasMoved) {
    hasMoved = true;
    currentPath = [[startR, startC]];
    getCell(startR, startC).classList.add('selected');
    const word = currentPath.map(([rr, cc]) => gridLetters[rr][cc]).join('').toUpperCase();
    currentWordDiv.textContent = word;
    drawEdges();
  }
  const pos = [r, c];
  const last = currentPath[currentPath.length - 1];
  if (isAdjacent(last, pos)) {
    const indexInPath = currentPath.findIndex(p => p[0] === r && p[1] === c);
    if (indexInPath === -1) {
      currentPath.push(pos);
      getCell(r, c).classList.add('selected');
    } else if (indexInPath < currentPath.length - 1) {
      for (let i = currentPath.length - 1; i > indexInPath; i--) {
        const [rr, cc] = currentPath[i];
        getCell(rr, cc).classList.remove('selected');
      }
      currentPath = currentPath.slice(0, indexInPath + 1);
    }
    const word = currentPath.map(([rr, cc]) => gridLetters[rr][cc]).join('').toUpperCase();
    currentWordDiv.textContent = word;
    drawEdges();
  }
}

function handleMouseUp(r, c) {
  if (mouseDown) {
    mouseDown = false;
    if (hasMoved) {
      submit();
    } else {
      const pos = [r, c];
      if (currentPath.length === 0) {
        currentPath = [pos];
        getCell(r, c).classList.add('selected');
      } else {
        const last = currentPath[currentPath.length - 1];
        if (last[0] === r && last[1] === c) {
          submit();
        } else if (isAdjacent(last, pos) && !currentPath.some(p => p[0] === r && p[1] === c)) {
          currentPath.push(pos);
          getCell(r, c).classList.add('selected');
        } else {
          clearPath();
          currentPath = [pos];
          getCell(r, c).classList.add('selected');
        }
      }
      drawEdges();
      const word = currentPath.map(([rr, cc]) => gridLetters[rr][cc]).join('').toUpperCase();
      currentWordDiv.textContent = word;
    }
  }
}

function getCell(r, c) {
  const rows = grid.querySelectorAll('.row');
  return rows[r].children[c];
}

function drawEdges() {
  edgesSvg.innerHTML = "";
  for (const [r1, c1, r2, c2, color] of permanentEdges) {
    drawLine(r1, c1, r2, c2, color);
  }
  for (let i = 1; i < currentPath.length; i++) {
    const [r1, c1] = currentPath[i - 1];
    const [r2, c2] = currentPath[i];
    const cell1 = getCell(r1, c1);
    let color = "#DBD8C7";
    if (cell1.classList.contains('found-yellow')) color = "#F1D046";
    else if (cell1.classList.contains('found-blue')) color = "#B8DEEC";
    drawLine(r1, c1, r2, c2, color);
  }
}

function drawLine(r1, c1, r2, c2, color) {
  const wrapper = document.querySelector('.game-wrapper');
  const scale = wrapper.getBoundingClientRect().width / wrapper.offsetWidth;
  const cell1 = getCell(r1, c1);
  const cell2 = getCell(r2, c2);
  const rect1 = cell1.getBoundingClientRect();
  const rect2 = cell2.getBoundingClientRect();
  const gridRect = grid.getBoundingClientRect();
  const x1 = (rect1.left - gridRect.left + rect1.width / 2) / scale;
  const y1 = (rect1.top - gridRect.top + rect1.height / 2) / scale;
  const x2 = (rect2.left - gridRect.left + rect2.width / 2) / scale;
  const y2 = (rect2.top - gridRect.top + rect2.height / 2) / scale;
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", "12");
  line.setAttribute("stroke-linecap", "round");
  edgesSvg.appendChild(line);
}

/* build grid */
gridLetters.forEach((rowLetters, r) => {
  const row = document.createElement('div');
  row.classList.add('row');
  rowLetters.forEach((letter, c) => {
    const letDiv = document.createElement('div');
    letDiv.classList.add('letter');
    letDiv.textContent = letter;
    const eventArea = document.createElement('span');
    eventArea.classList.add('letter-event-area');
    eventArea.addEventListener('mousedown', () => handleMouseDown(r, c));
    eventArea.addEventListener('mousemove', (event) => handleMouseMove(r, c, event));
    eventArea.addEventListener('mouseup', () => handleMouseUp(r, c));
    eventArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const pos = getCellFromEvent(e);
      if (pos) {
        const [tr, tc] = pos;
        handleMouseDown(tr, tc);
        document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
        document.addEventListener('touchend', handleDocumentTouchEnd, { passive: false });
      }
    }, { passive: false });
    letDiv.appendChild(eventArea);
    row.appendChild(letDiv);
  });
  grid.appendChild(row);
});
// --- LOAD SAVED STATE ---
loadState();

window.addEventListener('resize', () => {
  edgesSvg.setAttribute("width", grid.offsetWidth);
  edgesSvg.setAttribute("height", grid.offsetHeight);
  if (currentPath.length > 1 || permanentEdges.length > 0) drawEdges();
});

window.addEventListener('mouseup', () => {
  if (mouseDown && hasMoved) {
    mouseDown = false;
    hasMoved = false;
    submit();
  } else if (mouseDown) {
    mouseDown = false;
    hasMoved = false;
  }
});

document.addEventListener('touchcancel', handleDocumentTouchEnd, { passive: false });

updateHintButton();
const newGameBtn = document.getElementById('newGameBtn');
newGameBtn.addEventListener('click', () => {
  localStorage.removeItem('strandsGameState'); // clear saved state
  location.reload(); // reload page fresh
});
