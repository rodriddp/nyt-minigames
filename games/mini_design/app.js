// app.js
(() => {
  // === SOLUTION GRID ===
  // 10x10 grid, no black squares
  const solution = Array.from({ length: 14 }, () =>
    Array.from({ length: 14 }, () => "")
  );

  // === WORDS (placeholders) ===
  let words = [];

  // across words (10 tiles each)
  for (let r = 0; r < 14; r++) {
    words.push({
      number: r + 1,
      dir: "across",
      cells: Array.from({ length: 14 }, (_, c) => [r, c]),
      clue: `Placeholder clue ${r + 1}-across`,
    });
  }

  // down words (10 tiles each)
  for (let c = 0; c < 14; c++) {
    words.push({
      number: c + 1,
      dir: "down",
      cells: Array.from({ length: 14 }, (_, r) => [r, c]),
      clue: `Placeholder clue ${c + 1}-down`,
    });
  }

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

  const CELL_SIZE = 48;

  // --- Build grid ---
  function createGrid() {
    for (let r = 0; r < 14; r++) {
      cells[r] = [];
      for (let c = 0; c < 14; c++) {
        const cell = document.createElement("input");
        cell.type = "text";
        cell.maxLength = 1;
        cell.classList.add("cell");

        cell.addEventListener("click", () => handleCellClick(r, c));
        cell.addEventListener("focus", () => handleCellFocus(r, c));
        cell.addEventListener("input", (e) => handleCellInput(e, r, c));
        cell.addEventListener("keydown", (e) => handleCellKeyDown(e, r, c));

        // disable selection/copy/context
        cell.addEventListener("select", (e) => e.preventDefault());
        cell.addEventListener("copy", (e) => e.preventDefault());
        cell.addEventListener("contextmenu", (e) => e.preventDefault());
        cell.addEventListener("dragstart", (e) => e.preventDefault());

        gridEl.appendChild(cell);
        cells[r][c] = cell;

        cell.style.width = `${CELL_SIZE}px`;
        cell.style.height = `${CELL_SIZE}px`;
        cell.style.border = "1px solid #606060";
        if (c === 0) cell.style.borderLeft = "2px solid black";
        if (r === 0) cell.style.borderTop = "2px solid black";
        if (c === 9) cell.style.borderRight = "2px solid black";
        if (r === 9) cell.style.borderBottom = "2px solid black";
      }
    }

    // Overlay numbers
    const gridRect = gridEl.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    const offsetX = gridRect.left - bodyRect.left;
    const offsetY = gridRect.top - bodyRect.top;

    words.forEach(w => {
      const [r, c] = w.cells[0];
      const num = document.createElement("div");
      num.classList.add("number");
      num.textContent = w.number;
      num.style.left = `${offsetX + c * CELL_SIZE + 2}px`;
      num.style.top  = `${offsetY + r * CELL_SIZE + 2}px`;
      numberOverlay.appendChild(num);
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
      handleBlackToggle(r, c); // ← add this line
    } else {
      e.target.classList.remove("error");
    }
    saveProgress();
  }
  function handleBlackToggle(r, c) {
    const cell = cells[r][c];
    if (cell.value === "#") {
      // turn black
      cell.classList.add("black");
      cell.value = "";
      cell.readOnly = true;
      cell.dataset.locked = "true";
    } else if (cell.classList.contains("black") && cell.value === "") {
      // revert to normal input
      cell.classList.remove("black");
      cell.readOnly = false;
      delete cell.dataset.locked;
      cell.focus();
    }
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
    if (selCell.tagName === "INPUT") selCell.focus();

    clueEl.textContent = `${words[wordIndex].clue}`;
  }

  function clearHighlights() {
    for (let rr = 0; rr < solution.length; rr++) {
      for (let cc = 0; cc < solution[0].length; cc++) {
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
    for (let r = 0; r < solution.length; r++) {
      for (let c = 0; c < solution[0].length; c++) {
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
