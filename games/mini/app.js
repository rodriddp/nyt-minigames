// app.js
(() => {
  // === SOLUTION GRID ===
  const solution = [
    ["#", "#", "V", "O", "I"],
    ["#", "C", "A", "T", "S"],
    ["#", "A", "L", "T", "O"],
    ["B", "L", "U", "E", "#"],
    ["T", "I", "E", "R", "#"],
    ["C", "#", "#", "#", "#"]
  ];

  // === WORDS ===
  let words = [
    {number:1, dir:"across", cells:[[0,2],[0,3],[0,4]], clue:"Favourite Stockholm transportation"},
    {number:1, dir:"down",   cells:[[0,2],[1,2],[2,2],[3,2],[4,2]], clue:"Worth of a shiny thing"},
    {number:2, dir:"down",   cells:[[0,3],[1,3],[2,3],[3,3],[4,3]], clue:"Us when we sleep together (sing.)"},
    {number:3, dir:"down",   cells:[[0,4],[1,4],[2,4]], clue:"Three-letter code for uniformity worldwide"},
    {number:4, dir:"across", cells:[[1,1],[1,2],[1,3],[1,4]], clue:"Our cartoon alter egos"},
    {number:4, dir:"down",   cells:[[1,1],[2,1],[3,1],[4,1]], clue:"Potential destination in USA after a few Swedish winters"},
    {number:5, dir:"across", cells:[[2,1],[2,2],[2,3],[2,4]], clue:"'Said' to stop Mexicans"},
    {number:6, dir:"across", cells:[[3,0],[3,1],[3,2],[3,3]], clue:"Me (Rodri) in 4-across"},
    {number:6, dir:"down",   cells:[[3,0],[4,0],[5,0]], clue:"Controversial currency (abbr.)"},
    {number:7, dir:"across", cells:[[4,0],[4,1],[4,2],[4,3]], clue:"Part of a wedding cake, one above another"}
  ];
  // Sort by number, then across before down
  words = words.sort((a, b) => a.number - b.number || (a.dir === "across" ? -1 : 1));

  // --- DOM refs ---
  const gridEl = document.getElementById("grid");
  const clueEl = document.getElementById("clue");
  const dropdown = document.getElementById("dropdown");
  const numberOverlay = document.getElementById("number-overlay");

  // --- State ---
  const cells = [];
  let selectedWordIndex = null;
  let selectedCellIndex = null;
  let currentR = -1;
  let currentC = -1;

  // --- Build grid and overlay numbers ---
  function createGrid() {
    for (let r = 0; r < 6; r++) {
      cells[r] = [];
      for (let c = 0; c < 5; c++) {
        let cell;
        if (solution[r][c] === "#") {
          cell = document.createElement("div");
          cell.classList.add("cell", "black");
        } else {
          cell = document.createElement("input");
          cell.type = "text";
          cell.maxLength = 1;
          cell.classList.add("cell");

          cell.addEventListener("click", () => handleCellClick(r, c));
          cell.addEventListener("focus", () => handleCellFocus(r, c));
          cell.addEventListener("input", (e) => handleCellInput(e, r, c));
          cell.addEventListener("keydown", (e) => handleCellKeyDown(e, r, c));

          // Disable selection/copy/context on inputs
          cell.addEventListener("select", (e) => e.preventDefault());
          cell.addEventListener("copy", (e) => e.preventDefault());
          cell.addEventListener("contextmenu", (e) => e.preventDefault());
          cell.addEventListener("dragstart", (e) => e.preventDefault());
        }

        // add to grid
        gridEl.appendChild(cell);
        cells[r][c] = cell;

        // draw grid borders like a crossword
        cell.style.border = '1px solid #606060';
        if (c === 0) cell.style.borderLeft = '2px solid black';
        if (r === 0) cell.style.borderTop = '2px solid black';
        if (c === 4) cell.style.borderRight = '2px solid black';
        if (r === 5) cell.style.borderBottom = '2px solid black';
      }
    }

    // Add numbers to overlay (positioned relative to body)
    const gridRect = gridEl.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    const offsetX = gridRect.left - bodyRect.left;
    const offsetY = gridRect.top - bodyRect.top;

    words.forEach(w => {
      const [r, c] = w.cells[0];
      if (solution[r][c] !== "#") {
        const num = document.createElement("div");
        num.classList.add("number");
        num.textContent = w.number;
        num.style.left = `${offsetX + c * 60 + 2}px`;
        num.style.top  = `${offsetY + r * 60 + 2}px`;
        numberOverlay.appendChild(num);
      }
    });
  }

  // --- Handlers ---
  function handleAfterInput(r, c) {
    cells[r][c].classList.remove("error");
    if (selectedWordIndex !== null) {
      const word = words[selectedWordIndex];
      const [cr, cc] = word.cells[selectedCellIndex];
      if (cr === r && cc === c) {
        if (selectedCellIndex < word.cells.length - 1) {
          const nextIdx = selectedCellIndex + 1;
          const [nr, nc] = word.cells[nextIdx];
          selectWord(selectedWordIndex, nextIdx);
        } else {
          const nextWordIdx = (selectedWordIndex + 1) % words.length;
          selectWord(nextWordIdx, 0);
        }
      }
    }
  }

  function handleCellClick(r, c) {
    const isCurrent = currentR === r && currentC === c && selectedWordIndex !== null;
    if (isCurrent) {
      // toggle across/down if both exist
      const acrossIdx = words.findIndex(w => w.dir === "across" && w.cells.some(([wr, wc]) => wr === r && wc === c));
      const downIdx   = words.findIndex(w => w.dir === "down"   && w.cells.some(([wr, wc]) => wr === r && wc === c));
      if (acrossIdx !== -1 && downIdx !== -1) {
        const targetIdx = selectedWordIndex === acrossIdx ? downIdx : acrossIdx;
        const cellIdx   = words[targetIdx].cells.findIndex(([wr, wc]) => wr === r && wc === c);
        selectWord(targetIdx, cellIdx);
        return;
      }
    }
    selectCellDefault(r, c);
  }

  function handleCellFocus(r, c) {
    if (currentR !== r || currentC !== c) selectCellDefault(r, c);
  }

  function handleCellInput(e, r, c) {
    const cell = cells[r][c];

    if (cell.classList.contains("correct")) {
      cell.value = solution[r][c];
      return;
    }

    let val = e.data ? e.data.toUpperCase() : e.target.value.toUpperCase();
    e.target.value = val.slice(-1);

    if (e.target.value.length === 1) {
      handleAfterInput(r, c);
    } else {
      e.target.classList.remove("error");
    }
    saveProgress();
  }

  function handleCellKeyDown(e, r, c) {
    const cell = cells[r][c];

    if (e.key === "Backspace") {
      if (cell.dataset.locked === "true" || cell.readOnly) {
        if (cell.classList.contains("error")) cell.classList.remove("error");
        e.preventDefault();
        return;
      }

      if (cell.value !== "") {
        cell.value = "";
        cell.classList.remove("error");
        e.preventDefault();
      } else if (selectedWordIndex !== null && selectedCellIndex > 0) {
        const prevIdx = selectedCellIndex - 1;
        const [pr, pc] = words[selectedWordIndex].cells[prevIdx];
        const prevCell = cells[pr][pc];
        if (prevCell.dataset.locked === "true" || prevCell.readOnly) {
          e.preventDefault();
        } else {
          selectWord(selectedWordIndex, prevIdx);
          prevCell.value = "";
          prevCell.classList.remove("error");
          e.preventDefault();
        }
      }
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      if (cell.dataset.locked === "true" || cell.readOnly) {
        e.preventDefault();
        return;
      }
      cell.value = e.key.toUpperCase();
      e.preventDefault();
      handleAfterInput(r, c);
    }
  }

  // --- Selection helpers ---
  function selectCellDefault(r, c) {
    const acrossIdx = words.findIndex(w => w.dir === "across" && w.cells.some(([wr, wc]) => wr === r && wc === c));
    const downIdx   = words.findIndex(w => w.dir === "down"   && w.cells.some(([wr, wc]) => wr === r && wc === c));

    let chosenIdx = -1;
    if (acrossIdx !== -1) chosenIdx = acrossIdx;
    else if (downIdx !== -1) chosenIdx = downIdx;
    if (chosenIdx === -1) return;

    const cellIdx = words[chosenIdx].cells.findIndex(([wr, wc]) => wr === r && wc === c);
    selectWord(chosenIdx, cellIdx);
  }

  function selectWord(wordIndex, cellIndex = 0) {
    clearHighlights();
    selectedWordIndex = wordIndex;
    selectedCellIndex = cellIndex;

    const wordCells = words[wordIndex].cells;
    wordCells.forEach(([rr, cc]) => {
      const cell = cells[rr][cc];
      if (solution[rr][cc] !== "#") cell.classList.add("highlight");
    });

    const [sr, sc] = wordCells[cellIndex];
    currentR = sr;
    currentC = sc;
    const selCell = cells[sr][sc];
    selCell.classList.add("selected");
    // fix autofocus
    if (selCell.tagName === "INPUT") {
      // 1. remember where we are
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
  
      // 2. focus the cell
      selCell.focus();
  
      // 3. slam the scroll back (next tick so browser can’t override us)
      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY);
      });
    }

    clueEl.textContent = `${words[wordIndex].clue}`;
  }

  function clearHighlights() {
    for (let rr = 0; rr < 6; rr++) {
      for (let cc = 0; cc < 5; cc++) {
        if (solution[rr][cc] !== "#") {
          cells[rr][cc].classList.remove("highlight", "selected");
        }
      }
    }
  }

  // --- Clue navigation (exposed on window) ---
  function nextWord() {
    if (selectedWordIndex === null) selectWord(0, 0);
    else {
      const nextIdx = (selectedWordIndex + 1) % words.length;
      selectWord(nextIdx, 0);
    }
  }
  function previousWord() {
    if (selectedWordIndex === null) selectWord(words.length - 1, 0);
    else {
      const prevIdx = (selectedWordIndex - 1 + words.length) % words.length;
      selectWord(prevIdx, 0);
    }
  }

  // --- Check helpers (exposed on window) ---
  function checkPuzzle() {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 5; c++) {
        if (solution[r][c] === "#") continue;
        const cell = cells[r][c];
        cell.classList.remove("correct", "error");
        const val = cell.value;
        if (val === solution[r][c]) {
          cell.classList.add("correct");
          cell.readOnly = true;
          cell.dataset.locked = "true";
          saveProgress();
        } else if (val !== "") {
          cell.classList.add("error");
        }
      }
    }
    dropdown.style.display = "none";
  }

  function checkWord() {
    if (selectedWordIndex === null) return;
    const wcells = words[selectedWordIndex].cells;
    wcells.forEach(([r, c]) => {
      const cell = cells[r][c];
      cell.classList.remove("correct", "error");
      const val = cell.value;
      if (val === solution[r][c]) {
        cell.classList.add("correct");
        cell.readOnly = true;
        cell.dataset.locked = "true";
        saveProgress();
      } else if (val !== "") {
        cell.classList.add("error");
      }
    });
    dropdown.style.display = "none";
  }

  function checkLetter() {
    if (selectedWordIndex === null || selectedCellIndex === null) return;
    const [r, c] = words[selectedWordIndex].cells[selectedCellIndex];
    const cell = cells[r][c];
    cell.classList.remove("correct", "error");
    const val = cell.value;
    if (val === solution[r][c]) {
      cell.classList.add("correct");
      cell.readOnly = true;
      cell.dataset.locked = "true";
      saveProgress();
    } else if (val !== "") {
      cell.classList.add("error");
    }
    dropdown.style.display = "none";
  }

  // --- Settings gear toggle ---
  document.querySelector(".gear").addEventListener("click", () => {
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  });

  // --- SAVE / LOAD / CLEAR PROGRESS ---
  function saveProgress() {
    const progress = cells.map(row =>
      row.map(cell => {
        if (cell.tagName === "INPUT") {
          return {
            value: cell.value,
            locked: cell.dataset.locked === "true",
            error: cell.classList.contains("error")
          };
        }
        return null;
      })
    );
    localStorage.setItem("crosswordProgress", JSON.stringify(progress));
  }

  function loadProgress() {
    const saved = JSON.parse(localStorage.getItem("crosswordProgress") || "[]");
    for (let r = 0; r < saved.length; r++) {
      for (let c = 0; c < saved[r].length; c++) {
        const data = saved[r][c];
        const cell = cells[r]?.[c];
        if (cell && cell.tagName === "INPUT" && data) {
          cell.value = data.value || "";
          if (data.locked) {
            cell.classList.add("correct");
            cell.readOnly = true;
            cell.dataset.locked = "true";
          }
          if (data.error) {
            cell.classList.add("error");
          }
        }
      }
    }
  }

  function clearProgress() {
    localStorage.removeItem("crosswordProgress");
    for (let r = 0; r < cells.length; r++) {
      for (let c = 0; c < cells[r].length; c++) {
        const cell = cells[r][c];
        if (cell.tagName === "INPUT") {
          cell.value = "";
          cell.classList.remove("correct", "error");
          cell.readOnly = false;
          delete cell.dataset.locked;
        }
      }
    }
  }

  function newGame() {
    dropdown.style.display = "none";
    clearProgress(); // resets UI and storage
  }

  // Expose functions used by inline onclicks
  window.checkPuzzle   = checkPuzzle;
  window.checkWord     = checkWord;
  window.checkLetter   = checkLetter;
  window.newGame       = newGame;
  window.nextWord      = nextWord;
  window.previousWord  = previousWord;

  // --- Init ---
  createGrid();
  loadProgress();
  window.addEventListener("beforeunload", saveProgress);
})();

// Block zoom in the keyboard (double touch and pinch)
document.documentElement.style.touchAction = 'pan-x pan-y';
document.addEventListener('gesturestart', e => e.preventDefault());
