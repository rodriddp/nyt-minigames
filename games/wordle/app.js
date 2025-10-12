import { SOLUTION, MAX_ROWS, WORD_LENGTH, WORDLIST_URL } from './config.js';

let board = Array.from({length: MAX_ROWS},()=>Array(WORD_LENGTH).fill(''));
let currentRow = 0;
let currentCol = 0;
let gameOver = false;
let VALID_WORDS = new Set();

const boardEl = document.getElementById('board');
const keyboardEl = document.getElementById('keyboard');
const statusEl = document.getElementById('status');

async function loadValidWords() {
  try {
    const resp = await fetch(WORDLIST_URL);
    const text = await resp.text();
    VALID_WORDS = new Set(
      text.split('\n').map(w=>w.trim().toLowerCase()).filter(w=>w.length===WORD_LENGTH)
    );
  } catch(e){
    console.error(e);
    setStatus('Dictionary unavailable — any 5-letter word allowed');
  }
}

function createBoard(){
  boardEl.innerHTML = '';
  for (let r=0;r<MAX_ROWS;r++){
    const rowEl=document.createElement('div');
    rowEl.className='row';
    rowEl.dataset.row=r;
    for (let c=0;c<WORD_LENGTH;c++){
      const tile=document.createElement('div');
      tile.className='tile';
      tile.dataset.row=r;
      tile.dataset.col=c;
      rowEl.appendChild(tile);
    }
    boardEl.appendChild(rowEl);
  }
}

const rowsArr=[
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['enter','z','x','c','v','b','n','m','back']
];
function createKeyboard(){
  keyboardEl.innerHTML='';
  rowsArr.forEach(r=>{
    const rEl=document.createElement('div'); rEl.className='krow';
    r.forEach(k=>{
      const keyEl=document.createElement('button'); keyEl.className='key'; keyEl.type='button';
      if(k==='enter'||k==='back') keyEl.classList.add('big');
      keyEl.dataset.key=k; keyEl.textContent = k==='back'?'⌫':k==='enter'?'Enter':k;
      keyEl.addEventListener('click',()=>onKey(k));
      rEl.appendChild(keyEl);
    });
    keyboardEl.appendChild(rEl);
  });
}

function refreshBoard() {
  for (let r=0;r<MAX_ROWS;r++){
    for (let c=0;c<WORD_LENGTH;c++){
      const tile = boardEl.querySelector(`.tile[data-row="${r}"][data-col="${c}"]`);
      const ch = board[r][c]||'';
      tile.textContent = ch.toUpperCase();
      if(ch) tile.classList.add('filled'); else tile.classList.remove('filled');
      if(r>=currentRow) tile.classList.remove('green','yellow','gray');
    }
  }
}

function onKey(key){
  if(gameOver) return;
  if(key==='enter'){ submitGuess(); return; }
  if(key==='back'){ handleBackspace(); return; }
  if(/^[a-z]$/.test(key)){ handleLetter(key); }
}

function handleLetter(letter){
  if(currentCol>=WORD_LENGTH) return;
  board[currentRow][currentCol]=letter;
  currentCol++;
  refreshBoard();
  saveGameStateWordle();
}

function handleBackspace(){
  if(currentCol<=0) return;
  currentCol--;
  board[currentRow][currentCol]='';
  refreshBoard();
  saveGameStateWordle();
}

function submitGuess(){
  if(currentCol!==WORD_LENGTH){ setStatus("Not enough letters"); return; }
  const guess = board[currentRow].join('').toLowerCase();
  if(VALID_WORDS.size>0 && !VALID_WORDS.has(guess)){ setStatus("Not a valid word"); return; }
  evaluateGuess(guess);
}

function evaluateGuess(guess){
  const solution=SOLUTION.toLowerCase();
  const letters=solution.split(''); const result=Array(WORD_LENGTH).fill(null);
  const count={}; letters.forEach(ch=>count[ch]=(count[ch]||0)+1);

  // Greens
  for(let i=0;i<WORD_LENGTH;i++){
    if(guess[i]===solution[i]){ result[i]='green'; count[guess[i]]--; }
  }
  // Yellows / Grays
  for(let i=0;i<WORD_LENGTH;i++){
    if(result[i]) continue;
    const ch=guess[i];
    if(count[ch]>0){ result[i]='yellow'; count[ch]--; }
    else { result[i]='gray'; }
  }

  // Animate flips and color
  for(let i=0;i<WORD_LENGTH;i++){
    const tile=boardEl.querySelector(`.tile[data-row="${currentRow}"][data-col="${i}"]`);
    tile.classList.remove('green','yellow','gray');
    setTimeout(()=>{
      tile.classList.add('flip');
      setTimeout(()=>{ tile.classList.add(result[i]); },300);
      setTimeout(()=>{ tile.classList.remove('flip'); },600);
    }, i*400);
  }

  const lastTileDelay=(WORD_LENGTH-1)*400+600;

  setTimeout(()=>{
    for(let i=0;i<WORD_LENGTH;i++) updateKeyColor(guess[i], result[i]);
    saveGameStateWordle(); // Save after coloring
  }, lastTileDelay);

  if(guess===solution){
    setTimeout(()=>{
      setStatus("Fabulous!", true, true);
      gameOver=true;
    }, lastTileDelay);
  } else {
    currentRow++; currentCol=0;
    if(currentRow>=MAX_ROWS){
      setTimeout(()=>{
        setStatus(`Game over — solution was "${solution.toUpperCase()}"`);
        gameOver=true; saveGameStateWordle();
      }, lastTileDelay);
    } else {
      setTimeout(()=>{ setStatus(''); }, lastTileDelay);
    }
  }
}

function updateKeyColor(letter,color){
  letter=letter.toLowerCase();
  const keyEl=keyboardEl.querySelector(`button[data-key="${letter}"]`);
  if(!keyEl) return;
  keyEl.classList.remove('green','yellow','dark');
  if(color==='green') keyEl.classList.add('green');
  else if(color==='yellow') keyEl.classList.add('yellow');
  else if(color==='gray') keyEl.classList.add('dark');
}

function setStatus(text, blackBox=false, persist=false){
  statusEl.textContent = text;

  if (blackBox){
    statusEl.style.background = "#000";
    statusEl.style.color = "#fff";
    statusEl.style.padding = "6px 12px";
    statusEl.style.borderRadius = "6px";
  } else {
    statusEl.style.background = "transparent";
    statusEl.style.color = "#374151";
    statusEl.style.padding = "0";
  }

  clearTimeout(statusEl._timer);
  if (!persist && text) {
    statusEl._timer = setTimeout(() => {
      if (statusEl.textContent === text) statusEl.textContent = '';
    }, 1600);
  }
}

// Physical keyboard
window.addEventListener('keydown',(e)=>{
  if(gameOver) return;
  if(e.key==='Enter'){ onKey('enter'); e.preventDefault(); }
  else if(e.key==='Backspace'){ onKey('back'); e.preventDefault(); }
  else{
    const k=e.key.toLowerCase();
    if(/^[a-z]$/.test(k)) onKey(k);
  }
});

// --- SAVE / LOAD ---
function saveGameStateWordle() {
  const state = {
    board,
    tileColors: Array.from(boardEl.querySelectorAll('.tile')).map(tile=>{
      if(tile.classList.contains('green')) return 'green';
      if(tile.classList.contains('yellow')) return 'yellow';
      if(tile.classList.contains('gray')) return 'gray';
      return '';
    }),
    currentRow,
    currentCol,
    gameOver,
    keyboardColors: Array.from(keyboardEl.querySelectorAll('.key')).map(k=>{
      const key=k.dataset.key; let color='';
      if(k.classList.contains('green')) color='green';
      else if(k.classList.contains('yellow')) color='yellow';
      else if(k.classList.contains('dark')) color='gray';
      return {key,color};
    })
  };
  localStorage.setItem('miniWordleState',JSON.stringify(state));
}

function loadGameStateWordle(){
  const saved=localStorage.getItem('miniWordleState');
  if(!saved) return false;
  try{
    const state=JSON.parse(saved); if(!state.board) return false;
    board=state.board; currentRow=state.currentRow??0; currentCol=state.currentCol??0; gameOver=state.gameOver??false;

    const tiles=boardEl.querySelectorAll('.tile');
    tiles.forEach((tile,idx)=>{
      const r=Number(tile.dataset.row), c=Number(tile.dataset.col);
      tile.textContent=board[r][c]?board[r][c].toUpperCase():'';
      tile.className='tile';
      if(board[r][c]) tile.classList.add('filled');
      if(state.tileColors && state.tileColors[idx]){
        const color=state.tileColors[idx];
        if(color) tile.classList.add(color);
      }
    });

    if(state.keyboardColors){
      state.keyboardColors.forEach(kc=>{
        const keyEl=keyboardEl.querySelector(`button[data-key="${kc.key}"]`);
        if(!keyEl) return;
        keyEl.classList.remove('green','yellow','dark');
        if(kc.color==='green') keyEl.classList.add('green');
        else if(kc.color==='yellow') keyEl.classList.add('yellow');
        else if(kc.color==='gray') keyEl.classList.add('dark');
      });
    }
    return true;
  } catch(e){ console.error(e); return false; }
}

// --- INIT ---
await loadValidWords();
createBoard();
createKeyboard();
loadGameStateWordle();
refreshBoard();

// New Game
document.getElementById('newGameBtn').addEventListener('click', () => {
  localStorage.removeItem('miniWordleState');
  board = Array.from({length: MAX_ROWS},()=>Array(WORD_LENGTH).fill(''));
  currentRow = 0; currentCol = 0; gameOver = false;

  boardEl.querySelectorAll('.tile').forEach(tile => { tile.textContent = ''; tile.className = 'tile'; });
  keyboardEl.querySelectorAll('.key').forEach(key => { key.classList.remove('green','yellow','dark'); });

  setStatus('');
  refreshBoard();
});
