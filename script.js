/* ============================================================
   Momentum — Micro-Commitment App
   ============================================================ */

// ─── Task Database ──────────────────────────────────────────
const DEFAULT_TASKS = [
  // Productivity
  { text: "Clear 3 items from your desk", category: "productivity", energy: "low", time: ["morning", "afternoon"] },
  { text: "Reply to that message you've been avoiding", category: "productivity", energy: "medium", time: ["morning", "afternoon"] },
  { text: "Close 5 browser tabs you don't need", category: "productivity", energy: "low", time: ["morning", "afternoon", "night"] },
  { text: "Write down one thing you need to do tomorrow", category: "productivity", energy: "low", time: ["night"] },
  { text: "Organize one folder on your desktop", category: "productivity", energy: "low", time: ["afternoon", "night"] },
  { text: "Send that email you've been putting off", category: "productivity", energy: "medium", time: ["morning", "afternoon"] },
  { text: "Unsubscribe from one newsletter you don't read", category: "productivity", energy: "low", time: ["afternoon", "night"] },
  { text: "Set a timer and focus for just 5 minutes", category: "productivity", energy: "medium", time: ["morning", "afternoon"] },
  { text: "Review your calendar for the rest of the day", category: "productivity", energy: "low", time: ["morning"] },
  { text: "Delete 5 old screenshots or files", category: "productivity", energy: "low", time: ["afternoon", "night"] },
  { text: "Write one sentence of something you've been procrastinating", category: "productivity", energy: "medium", time: ["morning", "afternoon"] },
  { text: "Update one password you know is weak", category: "productivity", energy: "medium", time: ["night"] },
  { text: "Archive or delete 10 old emails", category: "productivity", energy: "low", time: ["afternoon"] },
  { text: "Write down your top priority for right now", category: "productivity", energy: "low", time: ["morning", "afternoon"] },
  { text: "Clear your notification badges", category: "productivity", energy: "low", time: ["morning", "afternoon", "night"] },

  // Health
  { text: "Drink a glass of water", category: "health", energy: "low", time: ["morning", "afternoon", "night"] },
  { text: "Stand up and stretch for 30 seconds", category: "health", energy: "low", time: ["morning", "afternoon", "night"] },
  { text: "Take 5 deep breaths", category: "health", energy: "low", time: ["morning", "afternoon", "night"] },
  { text: "Do 10 pushups or squats", category: "health", energy: "high", time: ["morning", "afternoon"] },
  { text: "Look away from your screen for 20 seconds", category: "health", energy: "low", time: ["morning", "afternoon", "night"] },
  { text: "Eat a piece of fruit", category: "health", energy: "low", time: ["morning", "afternoon"] },
  { text: "Roll your shoulders and neck slowly", category: "health", energy: "low", time: ["morning", "afternoon", "night"] },
  { text: "Walk to another room and back", category: "health", energy: "low", time: ["morning", "afternoon", "night"] },
  { text: "Splash cold water on your face", category: "health", energy: "low", time: ["morning"] },
  { text: "Do a 1-minute plank", category: "health", energy: "high", time: ["morning", "afternoon"] },
  { text: "Brush your teeth if you haven't today", category: "health", energy: "low", time: ["morning", "night"] },
  { text: "Step outside for 60 seconds of fresh air", category: "health", energy: "low", time: ["morning", "afternoon"] },
  { text: "Adjust your posture right now", category: "health", energy: "low", time: ["morning", "afternoon", "night"] },

  // Social
  { text: "Text someone you haven't talked to in a while", category: "social", energy: "medium", time: ["afternoon", "night"] },
  { text: "Compliment someone genuinely", category: "social", energy: "medium", time: ["morning", "afternoon"] },
  { text: "Reply to a message you've been leaving on read", category: "social", energy: "medium", time: ["afternoon", "night"] },
  { text: "Send a meme to a friend", category: "social", energy: "low", time: ["afternoon", "night"] },
  { text: "Thank someone who helped you recently", category: "social", energy: "medium", time: ["morning", "afternoon"] },
  { text: "Check in on a friend — just ask how they're doing", category: "social", energy: "medium", time: ["afternoon", "night"] },
  { text: "Share something interesting you learned today", category: "social", energy: "medium", time: ["afternoon", "night"] },

  // Maintenance
  { text: "Put one thing back where it belongs", category: "maintenance", energy: "low", time: ["morning", "afternoon", "night"] },
  { text: "Wipe down the surface closest to you", category: "maintenance", energy: "low", time: ["morning", "afternoon"] },
  { text: "Take out one piece of trash or recycling", category: "maintenance", energy: "low", time: ["morning", "afternoon"] },
  { text: "Charge your devices if they're low", category: "maintenance", energy: "low", time: ["night"] },
  { text: "Hang up or fold one piece of clothing", category: "maintenance", energy: "low", time: ["morning", "afternoon", "night"] },
  { text: "Make your bed if you haven't yet", category: "maintenance", energy: "low", time: ["morning"] },
  { text: "Wash one dish or cup", category: "maintenance", energy: "low", time: ["morning", "afternoon", "night"] },
  { text: "Empty or check your physical mailbox", category: "maintenance", energy: "low", time: ["afternoon"] },
  { text: "Replace something that's almost empty (soap, paper towels)", category: "maintenance", energy: "medium", time: ["afternoon"] },
  { text: "Water a plant if you have one", category: "maintenance", energy: "low", time: ["morning"] },
];

// ─── Identity Reinforcement Messages ────────────────────────
const REINFORCEMENTS = [
  "You're building momentum",
  "You're someone who follows through",
  "You act faster than yesterday",
  "Look at you go",
  "That's how it's done",
  "Small wins compound",
  "You didn't overthink that one",
  "Action over hesitation",
  "One more step forward",
  "You're choosing to move",
];

// ─── State ──────────────────────────────────────────────────
let state = {
  completed: 0,
  skipped: 0,
  streak: 0,
  currentTask: null,
  pressureEnabled: false,
  energyFilter: "any",
  userTasks: [],
  timerInterval: null,
  timerTimeout: null,
  lastShownIndex: -1,
};

// Try to load today's stats from localStorage
const TODAY_KEY = `momentum_${new Date().toISOString().slice(0, 10)}`;
const saved = localStorage.getItem(TODAY_KEY);
if (saved) {
  try {
    const parsed = JSON.parse(saved);
    state.completed = parsed.completed || 0;
    state.skipped = parsed.skipped || 0;
    state.streak = parsed.streak || 0;
  } catch (e) { /* ignore */ }
}

// Load user tasks
const savedUserTasks = localStorage.getItem("momentum_user_tasks");
if (savedUserTasks) {
  try {
    state.userTasks = JSON.parse(savedUserTasks);
  } catch (e) { /* ignore */ }
}

// Load settings
const savedSettings = localStorage.getItem("momentum_settings");
if (savedSettings) {
  try {
    const s = JSON.parse(savedSettings);
    state.pressureEnabled = s.pressureEnabled || false;
    state.energyFilter = s.energyFilter || "any";
  } catch (e) { /* ignore */ }
}

// ─── DOM References ─────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const taskText = $("task-text");
const categoryPill = $("task-category-pill");
const timerBarContainer = $("timer-bar-container");
const timerBar = $("timer-bar");
const reinforcementMsg = $("reinforcement-msg");
const streakCount = $("streak-count");
const momentumBadge = $("momentum-badge");
const statCompleted = $("stat-completed");
const statSkipped = $("stat-skipped");
const completeBtn = $("complete-btn");
const skipBtn = $("skip-btn");
const resetBtn = $("reset-btn");
const settingsBtn = $("settings-btn");
const addTaskBtn = $("add-task-btn");
const settingsPanel = $("settings-panel");
const addTaskPanel = $("add-task-panel");
const closeSettingsBtn = $("close-settings-btn");
const closeAddBtn = $("close-add-btn");
const pressureToggle = $("pressure-toggle");
const energySelect = $("energy-select");
const newTaskInput = $("new-task-input");
const newTaskCategory = $("new-task-category");
const newTaskEnergy = $("new-task-energy");
const saveTaskBtn = $("save-task-btn");

// ─── Helpers ────────────────────────────────────────────────
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "night";
}

function getAllTasks() {
  return [...DEFAULT_TASKS, ...state.userTasks];
}

function getFilteredTasks() {
  const tod = getTimeOfDay();
  const all = getAllTasks();
  return all.filter((t) => {
    const timeMatch = !t.time || t.time.includes(tod);
    const energyMatch = state.energyFilter === "any" || t.energy === state.energyFilter;
    return timeMatch && energyMatch;
  });
}

function pickTask() {
  let pool = getFilteredTasks();
  if (pool.length === 0) pool = getAllTasks(); // fallback
  if (pool.length === 0) return { text: "Add some tasks to get started!", category: "none" };

  // Avoid repeating the same task
  let idx;
  let tries = 0;
  do {
    idx = Math.floor(Math.random() * pool.length);
    tries++;
  } while (pool.length > 1 && idx === state.lastShownIndex && tries < 10);

  state.lastShownIndex = idx;
  return pool[idx];
}

function saveState() {
  localStorage.setItem(TODAY_KEY, JSON.stringify({
    completed: state.completed,
    skipped: state.skipped,
    streak: state.streak,
  }));
}

function saveUserTasks() {
  localStorage.setItem("momentum_user_tasks", JSON.stringify(state.userTasks));
}

function saveSettings() {
  localStorage.setItem("momentum_settings", JSON.stringify({
    pressureEnabled: state.pressureEnabled,
    energyFilter: state.energyFilter,
  }));
}

// ─── UI Updates ─────────────────────────────────────────────
function updateStats() {
  statCompleted.textContent = state.completed;
  statSkipped.textContent = state.skipped;
  streakCount.textContent = state.streak;

  if (state.streak >= 2) {
    momentumBadge.classList.add("visible");
  } else {
    momentumBadge.classList.remove("visible");
  }

  // Animate numbers
  statCompleted.classList.remove("pop");
  statSkipped.classList.remove("pop");
  void statCompleted.offsetWidth; // reflow
  statCompleted.classList.add("pop");
}

function showTask(task) {
  state.currentTask = task;

  // Exit animation
  taskText.classList.add("exit");

  setTimeout(() => {
    taskText.textContent = task.text;
    categoryPill.textContent = task.category;
    taskText.classList.remove("exit");
    taskText.classList.add("enter");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        taskText.classList.remove("enter");
      });
    });
  }, 300);

  // Start acceptance pressure timer if enabled
  clearTimer();
  if (state.pressureEnabled) {
    startPressureTimer();
  }
}

function loadNewTask() {
  const task = pickTask();
  showTask(task);
}

function showReinforcement() {
  // Show every 2-3 completions
  if (state.completed > 0 && (state.completed % 2 === 0 || state.streak >= 3)) {
    const msg = REINFORCEMENTS[Math.floor(Math.random() * REINFORCEMENTS.length)];
    reinforcementMsg.textContent = msg;
    reinforcementMsg.classList.remove("hidden");
    reinforcementMsg.classList.add("visible");
    setTimeout(() => {
      reinforcementMsg.classList.remove("visible");
    }, 2500);
  }
}

function spawnRipple(type, e) {
  const ripple = document.createElement("div");
  ripple.classList.add("ripple", type);
  const rect = e.currentTarget.getBoundingClientRect();
  ripple.style.left = `${rect.left + rect.width / 2 - 60}px`;
  ripple.style.top = `${rect.top + rect.height / 2 - 60}px`;
  document.body.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

// ─── Acceptance Pressure (Timer) ────────────────────────────
const PRESSURE_DURATION = 10; // seconds

function startPressureTimer() {
  timerBarContainer.classList.remove("hidden");
  let remaining = PRESSURE_DURATION;
  timerBar.style.transform = "scaleX(1)";

  state.timerInterval = setInterval(() => {
    remaining -= 0.1;
    const progress = Math.max(0, remaining / PRESSURE_DURATION);
    timerBar.style.transform = `scaleX(${progress})`;
    if (remaining <= 0) {
      clearTimer();
      // Auto-skip
      state.skipped++;
      state.streak = 0;
      updateStats();
      saveState();
      loadNewTask();
    }
  }, 100);
}

function clearTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  timerBarContainer.classList.add("hidden");
  timerBar.style.transform = "scaleX(1)";
}

// ─── Event Handlers ─────────────────────────────────────────
completeBtn.addEventListener("click", (e) => {
  clearTimer();
  state.completed++;
  state.streak++;
  updateStats();
  saveState();
  showReinforcement();
  spawnRipple("complete", e);
  loadNewTask();
});

skipBtn.addEventListener("click", (e) => {
  clearTimer();
  state.skipped++;
  state.streak = 0;
  updateStats();
  saveState();
  spawnRipple("skip", e);
  loadNewTask();
});

resetBtn.addEventListener("click", () => {
  clearTimer();
  state.completed = 0;
  state.skipped = 0;
  state.streak = 0;
  updateStats();
  saveState();
  reinforcementMsg.classList.remove("visible");
  loadNewTask();
});

// Settings panel
settingsBtn.addEventListener("click", () => {
  pressureToggle.checked = state.pressureEnabled;
  energySelect.value = state.energyFilter;
  settingsPanel.classList.remove("hidden");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
});

settingsPanel.querySelector(".panel-backdrop").addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
});

pressureToggle.addEventListener("change", () => {
  state.pressureEnabled = pressureToggle.checked;
  saveSettings();
  if (!state.pressureEnabled) clearTimer();
  else if (state.currentTask) startPressureTimer();
});

energySelect.addEventListener("change", () => {
  state.energyFilter = energySelect.value;
  saveSettings();
  loadNewTask();
});

// Add task panel
addTaskBtn.addEventListener("click", () => {
  newTaskInput.value = "";
  addTaskPanel.classList.remove("hidden");
  setTimeout(() => newTaskInput.focus(), 350);
});

closeAddBtn.addEventListener("click", () => {
  addTaskPanel.classList.add("hidden");
});

addTaskPanel.querySelector(".panel-backdrop").addEventListener("click", () => {
  addTaskPanel.classList.add("hidden");
});

saveTaskBtn.addEventListener("click", () => {
  const text = newTaskInput.value.trim();
  if (!text) {
    newTaskInput.focus();
    return;
  }
  state.userTasks.push({
    text,
    category: newTaskCategory.value,
    energy: newTaskEnergy.value,
    time: null, // show any time
  });
  saveUserTasks();
  addTaskPanel.classList.add("hidden");
  // Immediately show the new task
  showTask(state.userTasks[state.userTasks.length - 1]);
});

// ─── Init ───────────────────────────────────────────────────
updateStats();
loadNewTask();

// Pulse the "Done" button gently to draw attention
setTimeout(() => {
  completeBtn.classList.add("pulse");
  setTimeout(() => completeBtn.classList.remove("pulse"), 6000);
}, 1000);
