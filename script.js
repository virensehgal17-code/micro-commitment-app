/* ============================================================
   Momentum — Micro-Commitment App v2
   Personalization, bridge tasks, themes, lightweight memory
   ============================================================ */

// ─── Fallback Task Database (only shown when no user tasks) ─
const FALLBACK_TASKS = [
  { text:"Clear 3 items from your desk", cat:"productivity", energy:"low", time:["morning","afternoon"] },
  { text:"Close 5 browser tabs you don't need", cat:"productivity", energy:"low", time:["morning","afternoon","night"] },
  { text:"Write down one thing you need to do tomorrow", cat:"productivity", energy:"low", time:["night"] },
  { text:"Organize one folder on your desktop", cat:"productivity", energy:"low", time:["afternoon","night"] },
  { text:"Delete 5 old screenshots or files", cat:"productivity", energy:"low", time:["afternoon","night"] },
  { text:"Clear your notification badges", cat:"productivity", energy:"low", time:["morning","afternoon","night"] },
  { text:"Archive or delete 10 old emails", cat:"productivity", energy:"low", time:["afternoon"] },
  { text:"Unsubscribe from one newsletter you don't read", cat:"productivity", energy:"low", time:["afternoon","night"] },
  { text:"Drink a glass of water", cat:"health", energy:"low", time:["morning","afternoon","night"] },
  { text:"Stand up and stretch for 30 seconds", cat:"health", energy:"low", time:["morning","afternoon","night"] },
  { text:"Take 5 deep breaths", cat:"health", energy:"low", time:["morning","afternoon","night"] },
  { text:"Look away from your screen for 20 seconds", cat:"health", energy:"low", time:["morning","afternoon","night"] },
  { text:"Adjust your posture right now", cat:"health", energy:"low", time:["morning","afternoon","night"] },
  { text:"Walk to another room and back", cat:"health", energy:"low", time:["morning","afternoon","night"] },
  { text:"Put one thing back where it belongs", cat:"maintenance", energy:"low", time:["morning","afternoon","night"] },
  { text:"Wipe down the surface closest to you", cat:"maintenance", energy:"low", time:["morning","afternoon"] },
  { text:"Hang up or fold one piece of clothing", cat:"maintenance", energy:"low", time:["morning","afternoon","night"] },
  { text:"Wash one dish or cup", cat:"maintenance", energy:"low", time:["morning","afternoon","night"] },
];

// ─── Bridge Task Templates ─────────────────────────────────
const BRIDGE_TEMPLATES = [
  t => `Open "${t}" — just look at it`,
  t => `Read the first line of "${t}"`,
  t => `Write one sentence for "${t}"`,
  t => `Spend 60 seconds on "${t}"`,
  t => `Set a 2-minute timer for "${t}"`,
  t => `Gather what you need for "${t}"`,
];

// ─── Task Framings ──────────────────────────────────────────
const FRAMINGS = {
  user:    ["This is yours — you added it","Quick win to build momentum","You've been meaning to do this","Just the first step","Let's knock this out"],
  bridge:  ["Easy way to get started","Reduce the friction — just begin","The hardest part is opening it","One tiny step forward","Start small, finish strong"],
  fallback:["Quick reset while you're here","Small action, big signal","Keep the momentum going","Stay in motion","A simple win"],
  skipped: ["You skipped this earlier — try again?","This one's still waiting for you","You've been putting this off"],
  memory:  ["You usually complete tasks like this","This type of task is your strength","You've done harder — this is easy"],
};

// ─── Reinforcement Messages ─────────────────────────────────
const REINFORCEMENTS = [
  "You're building momentum","You're someone who follows through","You act faster than yesterday",
  "Look at you go","That's how it's done","Small wins compound",
  "You didn't overthink that one","Action over hesitation","One more step forward","You're choosing to move",
];

// ─── State ──────────────────────────────────────────────────
let state = {
  completed: 0, skipped: 0, streak: 0,
  currentTask: null, currentTaskType: null,
  pressureEnabled: false, energyFilter: "any", theme: "dark",
  userTasks: [],          // [{text, cat, energy, tag, id}]
  skipHistory: [],        // task ids that were skipped today
  completedIds: [],       // task ids completed today
  timerInterval: null,
  lastShownId: null,
};

// ─── Persistence ────────────────────────────────────────────
const TODAY_KEY = `momentum_${new Date().toISOString().slice(0,10)}`;
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(TODAY_KEY) || "{}");
    state.completed = s.completed || 0;
    state.skipped = s.skipped || 0;
    state.streak = s.streak || 0;
    state.skipHistory = s.skipHistory || [];
    state.completedIds = s.completedIds || [];
  } catch(e){}
  try { state.userTasks = JSON.parse(localStorage.getItem("momentum_user_tasks") || "[]"); } catch(e){}
  try {
    const s = JSON.parse(localStorage.getItem("momentum_settings") || "{}");
    state.pressureEnabled = s.pressureEnabled || false;
    state.energyFilter = s.energyFilter || "any";
    state.theme = s.theme || "dark";
  } catch(e){}
}
function saveDay() {
  localStorage.setItem(TODAY_KEY, JSON.stringify({
    completed: state.completed, skipped: state.skipped, streak: state.streak,
    skipHistory: state.skipHistory, completedIds: state.completedIds,
  }));
}
function saveUserTasks() { localStorage.setItem("momentum_user_tasks", JSON.stringify(state.userTasks)); }
function saveSettings() {
  localStorage.setItem("momentum_settings", JSON.stringify({
    pressureEnabled: state.pressureEnabled, energyFilter: state.energyFilter, theme: state.theme,
  }));
}

// ─── DOM ────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const taskText = $("task-text");
const taskFraming = $("task-framing");
const typePill = $("task-type-pill");
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
const settingsPanel = $("settings-panel");
const addTaskPanel = $("add-task-panel");
const managePanel = $("manage-panel");
const pressureToggle = $("pressure-toggle");
const energySelect = $("energy-select");
const newTaskInput = $("new-task-input");
const newTaskCategory = $("new-task-category");
const newTaskEffort = $("new-task-effort");
const newTaskTag = $("new-task-tag");
const userTaskList = $("user-task-list");
const noTasksMsg = $("no-tasks-msg");
const userTaskCountEl = $("user-task-count");

// ─── Helpers ────────────────────────────────────────────────
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "night";
}

function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function energyMatch(task) {
  return state.energyFilter === "any" || task.energy === state.energyFilter;
}

function timeMatch(task) {
  const tod = getTimeOfDay();
  return !task.time || task.time.length === 0 || task.time.includes(tod);
}

// ─── Task Selection Engine ──────────────────────────────────
// Priority: user tasks > bridge tasks > skipped-retry > fallback
function pickTask() {
  // 1. Try user tasks (70% chance if available)
  const userPool = state.userTasks.filter(t => energyMatch(t) && !state.completedIds.includes(t.id));
  if (userPool.length > 0 && Math.random() < 0.7) {
    // Check for previously skipped user tasks (30% to retry)
    const skippedUser = userPool.filter(t => state.skipHistory.includes(t.id));
    if (skippedUser.length > 0 && Math.random() < 0.3) {
      const t = skippedUser[Math.floor(Math.random() * skippedUser.length)];
      return { ...t, _type: "user", _framing: randomFrom(FRAMINGS.skipped) };
    }
    const t = randomFrom(userPool);
    return { ...t, _type: "user", _framing: randomFrom(FRAMINGS.user) };
  }

  // 2. Try bridge tasks (generated from user tasks, 20%)
  if (state.userTasks.length > 0 && Math.random() < 0.5) {
    const source = randomFrom(state.userTasks);
    const template = randomFrom(BRIDGE_TEMPLATES);
    return {
      text: template(source.text), cat: source.cat, energy: "low",
      id: "bridge_" + source.id, _type: "bridge", _framing: randomFrom(FRAMINGS.bridge),
    };
  }

  // 3. Fallback tasks
  const fallPool = FALLBACK_TASKS.filter(t => timeMatch(t) && energyMatch(t));
  const pool = fallPool.length > 0 ? fallPool : FALLBACK_TASKS;
  const t = randomFrom(pool);

  // Lightweight memory: if user completes a lot, show encouragement
  let framing = randomFrom(FRAMINGS.fallback);
  if (state.completed >= 3 && Math.random() < 0.3) {
    framing = randomFrom(FRAMINGS.memory);
  }

  return { ...t, id: "fb_" + pool.indexOf(t), _type: "fallback", _framing: framing };
}

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── UI Updates ─────────────────────────────────────────────
function updateStats() {
  statCompleted.textContent = state.completed;
  statSkipped.textContent = state.skipped;
  streakCount.textContent = state.streak;
  momentumBadge.classList.toggle("visible", state.streak >= 2);
  statCompleted.classList.remove("pop");
  void statCompleted.offsetWidth;
  statCompleted.classList.add("pop");
}

function showTask(task) {
  state.currentTask = task;
  state.currentTaskType = task._type;

  // Exit animation
  taskText.classList.add("exit");
  taskFraming.classList.add("exit");

  setTimeout(() => {
    taskText.textContent = task.text;
    typePill.textContent = task._type === "user" ? "Your task" : task._type === "bridge" ? "Starting step" : "Quick action";
    typePill.setAttribute("data-type", task._type);
    categoryPill.textContent = task.cat || "";
    taskFraming.textContent = task._framing || "";

    taskText.classList.remove("exit");
    taskText.classList.add("enter");
    taskFraming.classList.remove("exit");
    taskFraming.classList.add("enter");

    requestAnimationFrame(() => requestAnimationFrame(() => {
      taskText.classList.remove("enter");
      taskFraming.classList.remove("enter");
    }));
  }, 300);

  clearTimer();
  if (state.pressureEnabled) startPressureTimer();
}

function loadNewTask() {
  const task = pickTask();
  // Avoid showing identical task text
  if (state.lastShownId && task.id === state.lastShownId) {
    const retry = pickTask();
    showTask(retry);
    state.lastShownId = retry.id;
  } else {
    showTask(task);
    state.lastShownId = task.id;
  }
}

function showReinforcement() {
  if (state.completed > 0 && (state.completed % 2 === 0 || state.streak >= 3)) {
    const msg = randomFrom(REINFORCEMENTS);
    reinforcementMsg.textContent = msg;
    reinforcementMsg.classList.remove("hidden");
    reinforcementMsg.classList.add("visible");
    setTimeout(() => reinforcementMsg.classList.remove("visible"), 2500);
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

// ─── Acceptance Pressure ────────────────────────────────────
const PRESSURE_DURATION = 10;
function startPressureTimer() {
  timerBarContainer.classList.remove("hidden");
  let remaining = PRESSURE_DURATION;
  timerBar.style.transform = "scaleX(1)";
  state.timerInterval = setInterval(() => {
    remaining -= 0.1;
    timerBar.style.transform = `scaleX(${Math.max(0, remaining / PRESSURE_DURATION)})`;
    if (remaining <= 0) {
      clearTimer();
      state.skipped++;
      state.streak = 0;
      if (state.currentTask?.id) state.skipHistory.push(state.currentTask.id);
      updateStats(); saveDay(); loadNewTask();
    }
  }, 100);
}
function clearTimer() {
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
  timerBarContainer.classList.add("hidden");
  timerBar.style.transform = "scaleX(1)";
}

// ─── Theme ──────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  state.theme = theme;
  saveSettings();
  document.querySelectorAll(".theme-swatch").forEach(s => {
    s.classList.toggle("active", s.dataset.theme === theme);
  });
}

// ─── Manage Tasks Panel ─────────────────────────────────────
function renderUserTaskList() {
  userTaskList.innerHTML = "";
  if (state.userTasks.length === 0) {
    noTasksMsg.style.display = "block";
  } else {
    noTasksMsg.style.display = "none";
    state.userTasks.forEach((t, i) => {
      const item = document.createElement("div");
      item.className = "user-task-item";
      item.innerHTML = `
        <div style="flex:1">
          <div class="user-task-item-text">${t.text}</div>
          <div class="user-task-item-cat">${t.cat} · ${t.energy}</div>
        </div>
        <button class="delete-task-btn" data-idx="${i}" aria-label="Delete">×</button>
      `;
      userTaskList.appendChild(item);
    });
  }
  userTaskCountEl.textContent = `${state.userTasks.length} personal task${state.userTasks.length !== 1 ? "s" : ""} saved`;
}

// ─── Event Handlers ─────────────────────────────────────────
completeBtn.addEventListener("click", e => {
  clearTimer();
  state.completed++;
  state.streak++;
  if (state.currentTask?.id) state.completedIds.push(state.currentTask.id);
  updateStats(); saveDay();
  showReinforcement();
  spawnRipple("complete", e);
  loadNewTask();
});

skipBtn.addEventListener("click", e => {
  clearTimer();
  state.skipped++;
  state.streak = 0;
  if (state.currentTask?.id) state.skipHistory.push(state.currentTask.id);
  updateStats(); saveDay();
  spawnRipple("skip", e);
  loadNewTask();
});

resetBtn.addEventListener("click", () => {
  clearTimer();
  state.completed = 0; state.skipped = 0; state.streak = 0;
  state.skipHistory = []; state.completedIds = [];
  updateStats(); saveDay();
  reinforcementMsg.classList.remove("visible");
  loadNewTask();
});

// Panel open/close helpers
function openPanel(panel) { panel.classList.remove("hidden"); }
function closePanel(panel) { panel.classList.add("hidden"); }

$("settings-btn").addEventListener("click", () => {
  pressureToggle.checked = state.pressureEnabled;
  energySelect.value = state.energyFilter;
  renderUserTaskList();
  openPanel(settingsPanel);
});
$("close-settings-btn").addEventListener("click", () => closePanel(settingsPanel));
settingsPanel.querySelector(".panel-backdrop").addEventListener("click", () => closePanel(settingsPanel));

pressureToggle.addEventListener("change", () => {
  state.pressureEnabled = pressureToggle.checked;
  saveSettings();
  if (!state.pressureEnabled) clearTimer();
  else if (state.currentTask) startPressureTimer();
});

energySelect.addEventListener("change", () => {
  state.energyFilter = energySelect.value;
  saveSettings(); loadNewTask();
});

// Theme swatches
document.querySelectorAll(".theme-swatch").forEach(btn => {
  btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
});

// Add task panel
$("add-task-btn").addEventListener("click", () => {
  newTaskInput.value = "";
  openPanel(addTaskPanel);
  setTimeout(() => newTaskInput.focus(), 350);
});
$("close-add-btn").addEventListener("click", () => closePanel(addTaskPanel));
addTaskPanel.querySelector(".panel-backdrop").addEventListener("click", () => closePanel(addTaskPanel));

$("save-task-btn").addEventListener("click", () => {
  const text = newTaskInput.value.trim();
  if (!text) { newTaskInput.focus(); return; }
  const task = {
    text, cat: newTaskCategory.value, energy: newTaskEffort.value,
    tag: newTaskTag.value || null, time: null, id: makeId(),
  };
  state.userTasks.push(task);
  saveUserTasks();
  closePanel(addTaskPanel);
  showTask({ ...task, _type: "user", _framing: "You just added this — let's do it now" });
});

// Manage tasks panel
$("manage-tasks-btn").addEventListener("click", () => {
  closePanel(settingsPanel);
  renderUserTaskList();
  setTimeout(() => openPanel(managePanel), 350);
});
$("close-manage-btn").addEventListener("click", () => closePanel(managePanel));
managePanel.querySelector(".panel-backdrop").addEventListener("click", () => closePanel(managePanel));

userTaskList.addEventListener("click", e => {
  const btn = e.target.closest(".delete-task-btn");
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx);
  state.userTasks.splice(idx, 1);
  saveUserTasks();
  renderUserTaskList();
});

// ─── Init ───────────────────────────────────────────────────
loadState();
applyTheme(state.theme);
updateStats();
loadNewTask();

setTimeout(() => {
  completeBtn.classList.add("pulse");
  setTimeout(() => completeBtn.classList.remove("pulse"), 6000);
}, 1000);
