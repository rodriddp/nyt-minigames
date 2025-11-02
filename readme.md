# 🧩 NYT Mini Games — Personalized Edition

A **customizable recreation** of The New York Times’ most iconic mini games — built entirely in **HTML, CSS, and JavaScript**.  
This project lets you **create and personalize** your own daily game collection, featuring **Wordle**, **Connections**, **Strands**, and **The Mini** — all playable directly in your browser.

---

## 🌐 Overview

The website serves as a **hub** that mimics the visual and interactive style of the NYT Games homepage.  
From the main screen, you can select and play any of the available games, each one reimagined for **personal or shared experiences** — perfect for customizing challenges or commemorating shared adventures.

Each game is **session-aware**, meaning your progress is automatically saved in your browser via **local storage**.  
You can close and reopen the page, and your game state will still be there.

---

## 🎮 Available Games

### 🟩 Wordle
A personalized version of the classic **Wordle**, where players try to guess a secret word within a limited number of attempts.  
You can define your own word lists or secret word, making it ideal for private word challenges or themed puzzles.

**📸 Screenshot Placeholder:**  
![Wordle Screenshot](docs/wordle.png)

---

### 🟪 Connections
Recreate NYT’s **Connections** puzzle with your own categories and word groups.  
Each game consists of **four groups of four words**, which players must correctly associate.  

Features include:
- Shuffling tiles and deselecting words  
- Animated group reveals and "One away..." hints  
- **Session-based saving** — you can leave mid-game and return later  
- Fully editable `CATEGORIES` array in `app.js` for your own word sets  

**📸 Screenshot Placeholder:**  
![Connections Screenshot](docs/connections.png)

---

### 🧵 Strands
A creative twist on **Strands**, where you can design custom word-finding puzzles.  
Players must uncover hidden words to reveal a **central theme** or **storyline**, often tied to your shared adventures.

**📸 Screenshot Placeholder:**  
![Strands Screenshot](docs/strands.png)

---

### 🧠 The Mini
A miniature crossword — short, fast, and fun.  
Perfect for quick challenges or daily rituals.  

> *(Ignore the `mini_design` folder; it contains early styling experiments.)*

**📸 Screenshot Placeholder:**  
![The Mini Screenshot](docs/mini.png)

---

## 💾 Session Memory

Each game uses **browser local storage** to save progress automatically.  
Your selections, solved groups, and remaining lives persist between sessions — just reopen the same page to continue where you left off.

If you want to reset your progress, simply click **"New Game"** in the interface.

---

## 🎥 Demo

Add a GIF or short video demonstrating gameplay for each mini game here.  
For example:

**📸 Demo Placeholder:**  
![Gameplay Demo](docs/demo.gif)

---

## 🧰 Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript  
- **State Management:** Browser `localStorage`  
- **Design:** Inspired by NYT Games — customized for personal themes and memories    

---

## 🪄 Customization Guide

Each game’s logic lives inside its own folder within `/games/`.  
To personalize:

1. Open the relevant folder (e.g., `games/connections/`).
2. Edit `app.js` to change words, categories, or colors.
3. Adjust visual styles in `styles.css` if desired.
4. Refresh your browser to play your custom version.

If you want to **add a new mini game**, create a new folder in `/games/` with:
- `index.html`
- `app.js`
- `styles.css`

Then register it in your homepage file (`index.html`) so it appears on the menu.

---

## 🧱 Folder Structure

```
nyt-minigames/
├── index.html
├── styles.css
├── script.js
├── games/
│   ├── connections/
│   │   ├── index.html
│   │   ├── app.js
│   │   └── styles.css
│   ├── wordle/
│   ├── strands/
│   ├── mini/
│   └── ...
├── docs/                 # For screenshots and GIFs (add here)
└── README.md
```

---

## 🚀 Future Ideas

- Add scoring and time tracking  
- Include dark/light theme toggle  
- Support for multiplayer challenges  
- Automatic daily refresh of puzzles  

---

## 📨 Contact

**GitHub:** [@rodriddp](https://github.com/rodriddp)  
**Project deployment:** [NYT Mini Games](https://rodriddp.github.io/nyt-minigames/)

---
