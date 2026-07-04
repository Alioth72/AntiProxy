let pollTimeout = null;
let isRunning = false;
let isAfkEnabled = false;
let isFirstPoll = true;
let warningMode = false; // Tracks if you already missed one

// --- TIMING SETTINGS ---
const INITIAL_MIN_MS = 10000;   
const INITIAL_MAX_MS = 20000;  

const REGULAR_MIN_MS = 270000; // ~4.5 mins
const REGULAR_MAX_MS = 330000; // ~5.5 mins

// Warning Retry Time (10 to 20 seconds)
const WARNING_MIN_MS = 10000;
const WARNING_MAX_MS = 20000;

console.log("Math AFK Monitor (Warning Mode) Loaded");

// --- 1. Init & Listeners ---
chrome.storage.local.get(['afkEnabled'], (res) => {
  isAfkEnabled = res.afkEnabled || false;
});

chrome.runtime.onMessage.addListener((req) => {
  if (req.action === "TOGGLE_AFK") {
    isAfkEnabled = req.enabled;
    console.log("AFK Mode Toggled:", isAfkEnabled);
    
    if (isAfkEnabled && isRunning) {
        clearTimeout(pollTimeout); 
        isFirstPoll = true; 
        warningMode = false; // Reset strikes
        scheduleNextPoll();
    }
  }
});

// --- 2. Meeting Detection ---
function checkForMeeting() {
  if (isRunning) return;
  const videos = document.querySelectorAll('video');
  const path = window.location.pathname;

  if (videos.length > 0 && path.length > 1) {
    console.log("Meeting Detected.");
    startSystems();
  }
}

const observer = new MutationObserver(checkForMeeting);
observer.observe(document.body, { childList: true, subtree: true });
checkForMeeting(); 

function startSystems() {
  isRunning = true;
  updateLog("Math Monitor Active");
  if (isAfkEnabled) scheduleNextPoll();
}

// --- 3. Scheduling Logic ---
function scheduleNextPoll() {
  if (!isAfkEnabled || !isRunning) return;

  let delay;

  if (warningMode) {
    // STRIKE 1 CASE: Schedule very soon (10-20s)
    delay = Math.floor(Math.random() * (WARNING_MAX_MS - WARNING_MIN_MS + 1) + WARNING_MIN_MS);
    console.log(`⚠️ WARNING MODE: Next check in ${(delay/1000).toFixed(1)} seconds`);
  } 
  else if (isFirstPoll) {
    // Just joined
    delay = Math.floor(Math.random() * (INITIAL_MAX_MS - INITIAL_MIN_MS + 1) + INITIAL_MIN_MS);
    console.log(`Initial Check in ${(delay/1000).toFixed(1)} seconds`);
    isFirstPoll = false;
  } 
  else {
    // Regular Loop
    delay = Math.floor(Math.random() * (REGULAR_MAX_MS - REGULAR_MIN_MS + 1) + REGULAR_MIN_MS);
    console.log(`Next Regular Check in ${(delay/60000).toFixed(1)} minutes`);
  }

  pollTimeout = setTimeout(() => {
    triggerMathPoll();
  }, delay);
}

// --- 4. Math UI & Logic ---
function triggerMathPoll() {
  if (!isAfkEnabled) return;

  const num1 = Math.floor(Math.random() * 9) + 1;
  const num2 = Math.floor(Math.random() * 9) + 1;
  const correctAnswer = num1 + num2;

  // Visuals: Red for normal, Dark Red/Black for Final Warning
  const bgColor = warningMode ? "#000000" : "#d32f2f";
  const titleText = warningMode ? "FINAL WARNING" : "AFK CHECK";

  const modal = document.createElement('div');
  modal.id = 'afk-modal';
  modal.style.cssText = `
    position: fixed; top: 15%; left: 50%; transform: translateX(-50%);
    z-index: 99999; background: ${bgColor}; color: white; padding: 25px;
    border-radius: 12px; font-family: 'Google Sans', sans-serif; text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.9); border: 4px solid white;
    min-width: 320px;
  `;
  
  modal.innerHTML = `
    <h2 style="margin:0 0 15px 0; font-size: 24px; color: yellow;">${titleText}</h2>
    <div style="font-size: 28px; font-weight: bold; margin-bottom: 15px;">
      ${num1} + ${num2} = ?
    </div>
    
    <input type="number" id="afk-input" autofocus autocomplete="off" style="
      font-size: 24px; padding: 8px; width: 100px; text-align: center; 
      border-radius: 5px; border: none; margin-bottom: 15px;
    ">
    
    <div style="font-size: 14px; margin-bottom:5px;">Solve to stay in meeting:</div>
    <div id="afk-timer" style="font-size: 35px; font-weight: bold; color: #fff;">10</div>
    
    <button id="afk-btn" style="
      margin-top: 10px; padding: 10px 30px; font-size: 16px; border: none; 
      background: white; color: ${bgColor}; cursor: pointer; border-radius: 5px;
      font-weight: bold; box-shadow: 0 4px 0 rgba(0,0,0,0.2);
    ">SUBMIT</button>
  `;

  document.body.appendChild(modal);

  const inputField = document.getElementById('afk-input');
  inputField.focus();

  let timeLeft = 10;
  const timerElem = document.getElementById('afk-timer');
  
  const countdownInterval = setInterval(() => {
    timeLeft--;
    timerElem.innerText = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      destroyModal();
      handleTimeout(); // Logic split here
    }
  }, 1000);

  const checkAnswer = () => {
    const userAnswer = parseInt(inputField.value);
    
    if (userAnswer === correctAnswer) {
      clearInterval(countdownInterval);
      destroyModal();
      
      // SUCCESS: Reset warning mode
      if (warningMode) {
          updateLog("✅ Final warning passed.");
          warningMode = false;
      } else {
          updateLog("✅ Math solved correctly.");
      }
      
      scheduleNextPoll(); 
    } else {
      inputField.style.border = "3px solid yellow";
      inputField.value = "";
      inputField.placeholder = "?";
      inputField.focus();
    }
  };

  document.getElementById('afk-btn').onclick = checkAnswer;
  inputField.addEventListener("keypress", (event) => {
    if (event.key === "Enter") checkAnswer();
  });

  function destroyModal() {
    if(document.body.contains(modal)) document.body.removeChild(modal);
  }
}

// --- 5. TIMEOUT HANDLING ---
function handleTimeout() {
    if (!warningMode) {
        // --- STRIKE 1: FLASH WARNING ---
        warningMode = true; // Set strike flag
        updateLog("⚠️ Missed check. Warning active!");
        flashWarningOverlay();
        scheduleNextPoll(); // Will schedule in 10-20s because warningMode is true
    } else {
        // --- STRIKE 2: KICK ---
        leaveMeeting();
    }
}

function flashWarningOverlay() {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(255, 0, 0, 0.8); z-index: 999999;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        color: white; font-family: sans-serif; pointer-events: none;
    `;
    
    flash.innerHTML = `
        <h1 style="font-size: 50px; text-shadow: 2px 2px 0 #000;">⚠️ WARNING ⚠️</h1>
        <h2 style="font-size: 30px;">INACTIVITY DETECTED</h2>
        <p style="font-size: 20px;">Retrying in 10 seconds...</p>
    `;
    
    document.body.appendChild(flash);
    
    // Remove warning flash after 3 seconds
    setTimeout(() => {
        if(document.body.contains(flash)) document.body.removeChild(flash);
    }, 3000);
}

function leaveMeeting() {
  console.log("AFK TIMEOUT - LEAVING MEETING!");
  updateLog("❌ Failed Final Check. Leaving...");

  const leaveBtn = document.querySelector('button[aria-label="Leave call"]') 
                || document.querySelector('button[aria-label="End call"]');

  if (leaveBtn) {
    leaveBtn.click();
  } else {
    window.location.href = "https://google.com"; 
  }
}

function updateLog(msg) {
  chrome.storage.local.set({ lastLog: msg });
}