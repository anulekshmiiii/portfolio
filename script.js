// GLOBAL STATE
let currentFilter = 'all';
let tasks = [];
let autoSaveTimer;

// TAB ORDER AND SWIPE SUPPORT
const tabOrder = ['dashboard', 'tasks', 'notes', 'habits', 'mood', 'letter', 'timer', 'garden', 'reflection'];
let touchStartX = 0;
let touchEndX = 0;

// ============= INITIALIZATION =============
window.onload = function() {
  loadTasks();
  loadDailyNote();
  renderHabits();
  populateNotesHistory();
  updateProgress();
  initDashboard();
  initMoodTracker();
  initTabSwipeSupport();
  initBloomTeddy();
  initCalendarIcon();
  checkUnlockedLetters();
};

// ============= TAB SWIPE AND SCROLL SUPPORT =============
function initTabSwipeSupport() {
  const container = document.querySelector('.container');
  
  // Touch swipe support for pages
  if (container) {
    container.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    container.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      handleTabSwipe();
    }, false);
  }
  
  // Keyboard arrow support
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
      navigateToAdjacentTab('left');
    } else if (e.key === 'ArrowRight') {
      navigateToAdjacentTab('right');
    }
  });
}

function handleTabSwipe() {
  const swipeThreshold = 50;
  const difference = touchStartX - touchEndX;
  
  if (Math.abs(difference) > swipeThreshold) {
    if (difference > 0) {
      navigateToAdjacentTab('right');
    } else {
      navigateToAdjacentTab('left');
    }
  }
}

function navigateToAdjacentTab(direction) {
  const currentActive = document.querySelector('.tab-btn.active');
  if (!currentActive) return;
  
  const currentTabName = currentActive.getAttribute('data-tab');
  const currentIndex = tabOrder.indexOf(currentTabName);
  
  let nextIndex;
  if (direction === 'right' && currentIndex < tabOrder.length - 1) {
    nextIndex = currentIndex + 1;
  } else if (direction === 'left' && currentIndex > 0) {
    nextIndex = currentIndex - 1;
  } else {
    return;
  }
  
  const nextTabName = tabOrder[nextIndex];
  showTab(nextTabName);
  
  // Use setTimeout to ensure DOM is updated before scrolling
  setTimeout(() => {
    scrollTabIntoView(nextTabName);
  }, 50);
}

function scrollTabIntoView(tabName) {
  const container = document.getElementById('tabsContainer');
  const tabButton = container.querySelector(`[data-tab="${tabName}"]`);
  
  if (!tabButton || !container) return;
  
  // Get container and button dimensions
  const containerWidth = container.clientWidth;
  const containerScrollWidth = container.scrollWidth;
  const buttonWidth = tabButton.offsetWidth;
  const buttonLeft = tabButton.offsetLeft;
  
  // Calculate position to center the tab in the 3rd position (center of view)
  // The center position is containerWidth / 2
  // We want the tab to be at that center position
  const centerPosition = containerWidth / 2;
  const scrollTarget = buttonLeft - centerPosition + (buttonWidth / 2);
  
  // Clamp scroll position to valid range
  const minScroll = 0;
  const maxScroll = containerScrollWidth - containerWidth;
  const finalScroll = Math.max(minScroll, Math.min(maxScroll, scrollTarget));
  
  // Smooth scroll to the calculated position
  container.scrollTo({
    left: finalScroll,
    behavior: 'smooth'
  });
}

// ============= DASHBOARD FUNCTIONS =============
function initDashboard() {
  updateGreeting();
  displayAffirmation();
  updateDashboardStats();
  displayDailyPrompt();
  displayDailyQuote();
}

function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Good morning, Sunshine ☀️';
  
  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon, Starlight 🌟';
  } else if (hour >= 17) {
    greeting = 'Good evening, Moonlight 🌙';
  }
  
  const greetingElement = document.getElementById('greetingText');
  if (greetingElement) {
    greetingElement.textContent = greeting;
  }
}

function updateDashboardStats() {
  const taskCount = tasks.filter(t => !t.completed).length;
  document.getElementById('taskCount').textContent = taskCount;
  
  let habits = JSON.parse(localStorage.getItem('allHabits')) || [];
  const today = new Date().toISOString().split('T')[0];
  let maxStreak = 0;
  
  habits.forEach(habit => {
    const streak = calculateStreak(habit.completedDates);
    if (streak > maxStreak) maxStreak = streak;
  });
  
  document.getElementById('streakCount').textContent = maxStreak;
}

const dailyPrompts = [
  'Today, what made you smile?',
  'What are you grateful for today?',
  'What small joy will you create?',
  'How will you be kind today?',
  'What challenge will you overcome?',
  'What made you feel proud?',
  'Who did you help today?'
];

function displayDailyPrompt() {
  const day = new Date().getDate();
  const prompt = dailyPrompts[day % dailyPrompts.length];
  const promptElement = document.getElementById('dailyPrompt');
  if (promptElement) {
    promptElement.textContent = prompt;
  }
}

const dailyQuotes = [
  'You are stronger than you think.',
  'Every day is a fresh start.',
  'Your kindness matters.',
  'You deserve to be happy.',
  'Progress over perfection.',
  'You are doing great.',
  'Bloom at your own pace.',
  'Be gentle with yourself.'
];

const affirmations = [
  'You\'re doing better than you think 💕',
  'Small steps are still progress 🌱',
  'Today is soft and kind to you ✨',
  'You are enough, just as you are 💖',
  'Your efforts matter 🌸',
  'Be kind to yourself today 💗',
  'You\'ve got this 🌟',
  'Every moment is a fresh start 🍃'
];

function displayDailyQuote() {
  const day = new Date().getDate();
  const quote = dailyQuotes[day % dailyQuotes.length];
  const quoteElement = document.getElementById('dailyQuote');
  if (quoteElement) {
    quoteElement.textContent = quote;
  }
}

function displayAffirmation() {
  const day = new Date().getDate();
  const affirmation = affirmations[day % affirmations.length];
  const affirmationElement = document.getElementById('affirmationText');
  if (affirmationElement) {
    affirmationElement.textContent = affirmation;
  }
}

// ============= TAB NAVIGATION =============
function showTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));

  // Remove active class from all buttons
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  // Show selected tab
  const selectedTab = document.getElementById(tabName + 'Tab');
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  // Mark the corresponding button as active
  const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeButton) {
    activeButton.classList.add('active');
  }

  // Load fresh data for that tab
  if (tabName === 'notes') {
    loadTodayNote();
  } else if (tabName === 'habits') {
    renderHabits();
  } else if (tabName === 'dashboard') {
    initDashboard();
  } else if (tabName === 'mood') {
    loadTodayMood();
  } else if (tabName === 'letter') {
    renderLetters();
  } else if (tabName === 'garden') {
    initGarden();
  } else if (tabName === 'reflection') {
    renderReflections();
  } else if (tabName === 'timer') {
    updateTimerDisplay();
  }
  
  // Scroll the tab button to center position (3rd position in view)
  setTimeout(() => {
    scrollTabIntoView(tabName);
  }, 50);
}

// ============= TASKS FUNCTIONS =============
function addTask() {
  const input = document.getElementById('taskInput');
  const priority = document.getElementById('taskPriority').value;
  const date = document.getElementById('taskDate').value;
  const category = document.getElementById('taskCategory').value;
  const taskText = input.value.trim();

  if (taskText === '') return;

  const task = {
    id: Date.now(),
    text: taskText,
    completed: false,
    priority: priority,
    dueDate: date || new Date().toISOString().split('T')[0],
    category: category,
    createdDate: new Date().toISOString().split('T')[0]
  };

  tasks.push(task);
  updateStorage();
  renderTasks();
  updateProgress();

  input.value = '';
  document.getElementById('taskDate').value = '';

  // Play sound
  playCompleteSound();
}

function handleKey(event) {
  if (event.key === 'Enter') {
    addTask();
  }
}

function initCalendarIcon() {
  const calendarIcon = document.querySelector('.calendar-icon');
  const dateInput = document.getElementById('taskDate');
  
  if (calendarIcon && dateInput) {
    calendarIcon.addEventListener('click', () => {
      dateInput.click();
    });
  }
}

function deleteTask(taskId) {
  tasks = tasks.filter(t => t.id !== taskId);
  updateStorage();
  renderTasks();
  updateProgress();
}

function toggleComplete(checkbox) {
  const taskId = parseInt(checkbox.dataset.taskId);
  const task = tasks.find(t => t.id === taskId);

  if (task) {
    task.completed = checkbox.checked;
    updateStorage();
    renderTasks();
    updateProgress();

    if (checkbox.checked) {
      playCompleteSound();
      showCelebration();
      showReminder('Task completed! Great job! 💕');
    }
  }
}

function renderTasks() {
  const list = document.getElementById('taskList');
  const emptyMsg = document.getElementById('emptyMessage');
  list.innerHTML = '';

  let filteredTasks = tasks;

  if (currentFilter === 'active') {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(t => t.completed);
  }

  if (filteredTasks.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';

  filteredTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'new-task';

    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.dueDate < today && !task.completed;

    if (isOverdue) {
      li.classList.add('overdue');
    }

    const priorityColor = task.priority === 'low' ? 'low' : task.priority === 'medium' ? 'medium' : 'high';

    li.innerHTML = `
      <div class="task">
        <label style="display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer;">
          <input type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}" onchange="toggleComplete(this)">
          <span class="checkmark"></span>
          <div style="text-align: left; flex: 1;">
            <span class="task-text" style="${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(task.text)}</span>
            <div class="task-date">${formatDate(task.dueDate)} ${isOverdue ? '⚠️' : ''}</div>
            <div class="task-category ${task.category}">${task.category}</div>
          </div>
        </label>
        <span class="priority-dot ${priorityColor}"></span>
      </div>
      <button class="delete" onclick="deleteTask(${task.id})">Delete</button>
    `;

    list.appendChild(li);
  });

  updateTaskCounter();
}

function filterTasks(filter) {
  currentFilter = filter;
  renderTasks();

  // Update button states
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function clearAll() {
  if (confirm('Delete all tasks?')) {
    tasks = [];
    updateStorage();
    renderTasks();
    updateProgress();
  }
}

function updateProgress() {
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById('progressFill').style.width = percentage + '%';
  document.getElementById('progressText').textContent = completed + '/' + total + ' tasks done';
}

function updateTaskCounter() {
  const counter = document.getElementById('taskCounter');
  if (tasks.length === 0) {
    counter.textContent = '';
  } else {
    const completed = tasks.filter(t => t.completed).length;
    counter.textContent = 'Total: ' + tasks.length + ' | Completed: ' + completed;
  }
}

function updateStorage() {
  localStorage.setItem('bloomBoardTasks', JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem('bloomBoardTasks');
  tasks = saved ? JSON.parse(saved) : [];
  renderTasks();
  updateProgress();
}

// ============= NOTES FUNCTIONS =============
function getTodayKey() {
  return 'note_' + new Date().toISOString().split('T')[0];
}

function loadDailyNote() {
  const textarea = document.getElementById('dailyNote');
  const saved = localStorage.getItem(getTodayKey());

  if (saved) {
    textarea.value = saved;
  } else {
    textarea.value = '';
  }

  document.getElementById('notesDate').textContent = new Date().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function loadTodayNote() {
  const today = new Date().toISOString().split("T")[0];
  
  document.getElementById("notesDate").textContent =
    new Date().toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

  let notes = JSON.parse(localStorage.getItem("notesHistory")) || {};
  document.getElementById("dailyNote").value = notes[today] || "";
  
  // Update the select dropdown to show today's option
  const select = document.getElementById("notesHistorySelect");
  select.value = "";
}

function autoSaveNote() {
  clearTimeout(autoSaveTimer);

  autoSaveTimer = setTimeout(function() {
    saveDailyNote();
  }, 1000);
}

function saveDailyNote() {
  const textarea = document.getElementById('dailyNote');
  const today = new Date().toISOString().split('T')[0];

  // Save to today's note
  localStorage.setItem(getTodayKey(), textarea.value);

  // Save to history
  let notes = JSON.parse(localStorage.getItem('notesHistory')) || {};
  notes[today] = textarea.value;
  localStorage.setItem('notesHistory', JSON.stringify(notes));

  document.getElementById('notesStatus').textContent = 'Saved ✓';

  populateNotesHistory();
}

function populateNotesHistory() {
  const select = document.getElementById('notesHistorySelect');
  let notes = JSON.parse(localStorage.getItem('notesHistory')) || {};

  const dates = Object.keys(notes).sort().reverse();

  // Keep the first default option
  while (select.options.length > 1) {
    select.remove(1);
  }

  // Add "Today" option
  const todayOption = document.createElement('option');
  todayOption.value = 'today';
  todayOption.textContent = 'Today';
  select.appendChild(todayOption);

  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = date;
    select.appendChild(option);
  });
  
  // Add event listener to handle selection
  select.addEventListener('change', handleNotesDropdown);
}

function handleNotesDropdown(event) {
  const selectedValue = event.target.value;
  
  if (selectedValue === '') {
    // Reset to default
    loadTodayNote();
  } else if (selectedValue === 'today') {
    // Load today's note
    loadTodayNote();
  } else {
    // Load selected date's note
    let notes = JSON.parse(localStorage.getItem('notesHistory')) || {};
    document.getElementById('dailyNote').value = notes[selectedValue] || '';
    document.getElementById('notesDate').textContent = selectedValue;
  }
}

// Event listener for notes
document.addEventListener('DOMContentLoaded', function() {
  const dailyNote = document.getElementById('dailyNote');
  if (dailyNote) {
    dailyNote.addEventListener('input', autoSaveNote);
  }

  const notesHistorySelect = document.getElementById('notesHistorySelect');
  if (notesHistorySelect) {
    notesHistorySelect.addEventListener('change', function() {
      const key = this.value;
      if (!key) return;

      let notes = JSON.parse(localStorage.getItem('notesHistory')) || {};
      document.getElementById('dailyNote').value = notes[key] || '';
      document.getElementById('notesStatus').textContent = 'Loaded from history 💗';
    });
  }
});

// ============= HABITS FUNCTIONS =============
function getTodayHabitsKey() {
  return 'habits_' + new Date().toISOString().split('T')[0];
}

function addHabit() {
  const input = document.getElementById('habitInput');
  const habitName = input.value.trim();

  if (habitName === '') return;

  let habits = JSON.parse(localStorage.getItem('allHabits')) || [];

  const habit = {
    id: Date.now(),
    name: habitName,
    createdDate: new Date().toISOString().split('T')[0],
    completedDates: []
  };

  habits.push(habit);
  localStorage.setItem('allHabits', JSON.stringify(habits));

  input.value = '';
  renderHabits();
}

function renderHabits() {
  const list = document.getElementById('habitList');
  const emptyMsg = document.getElementById('emptyHabits');
  list.innerHTML = '';

  let habits = JSON.parse(localStorage.getItem('allHabits')) || [];
  const today = new Date().toISOString().split('T')[0];

  if (habits.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';

  habits.forEach(habit => {
    const isCompletedToday = habit.completedDates.includes(today);
    const streak = calculateStreak(habit.completedDates);

    const li = document.createElement('li');
    li.className = isCompletedToday ? 'habit-done' : '';
    li.innerHTML = `
      <div class="habit-info">
        <span class="habit-name">${escapeHtml(habit.name)}</span>
        <span class="habit-streak">🔥 ${streak} day streak</span>
      </div>
      <div class="habit-actions">
        <button class="habit-check" onclick="toggleHabitComplete(${habit.id})">
          ${isCompletedToday ? '✓ Done' : 'Check In'}
        </button>
        <button class="habit-delete" onclick="deleteHabit(${habit.id})">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function toggleHabitComplete(habitId) {
  let habits = JSON.parse(localStorage.getItem('allHabits')) || [];
  const today = new Date().toISOString().split('T')[0];

  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;

  const index = habit.completedDates.indexOf(today);
  if (index > -1) {
    habit.completedDates.splice(index, 1);
  } else {
    habit.completedDates.push(today);
  }

  localStorage.setItem('allHabits', JSON.stringify(habits));
  renderHabits();
  showReminder('Habit checked! Keep it up! 🔥');
}

function deleteHabit(habitId) {
  let habits = JSON.parse(localStorage.getItem('allHabits')) || [];
  habits = habits.filter(h => h.id !== habitId);
  localStorage.setItem('allHabits', JSON.stringify(habits));
  renderHabits();
}

function calculateStreak(completedDates) {
  if (completedDates.length === 0) return 0;

  const sortedDates = completedDates.sort().reverse();
  const today = new Date();
  let streak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    const date = new Date(sortedDates[i]);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (date.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ============= UTILITY FUNCTIONS =============
function playCompleteSound() {
  const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
  audio.volume = 0.3;
  audio.play().catch(e => console.log('Audio play blocked:', e));
}

function showCelebration() {
  const overlay = document.getElementById('celebrationOverlay');
  overlay.style.display = 'block';

  setTimeout(() => {
    overlay.style.display = 'none';
  }, 3000);
}

function showReminder(message) {
  const popup = document.getElementById('reminderPopup');
  document.getElementById('reminderText').textContent = message;

  popup.classList.add('show');

  setTimeout(() => {
    popup.classList.remove('show');
  }, 2500);
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ============= MOOD TRACKER FUNCTIONS =============
const moodEmojis = ['😢', '😕', '😐', '🙂', '😄'];
const moodLabels = ['Sad', 'Unhappy', 'Neutral', 'Happy', 'Very Happy'];

function initMoodTracker() {
  const moodSlider = document.getElementById('moodSlider');
  if (moodSlider) {
    moodSlider.addEventListener('input', updateMoodEmoji);
    loadTodayMood();
  }
}

function updateMoodEmoji() {
  const slider = document.getElementById('moodSlider');
  const emojiElement = document.getElementById('moodEmoji');
  const value = parseInt(slider.value);
  
  if (emojiElement) {
    emojiElement.textContent = moodEmojis[value - 1];
  }
}

function saveMood() {
  const slider = document.getElementById('moodSlider');
  const value = parseInt(slider.value);
  const today = new Date().toISOString().split('T')[0];
  
  let moods = JSON.parse(localStorage.getItem('moodTracker')) || {};
  moods[today] = value;
  localStorage.setItem('moodTracker', JSON.stringify(moods));
  
  showReminder(`Mood saved: ${moodLabels[value - 1]} 💕`);
  
  // Apply mood glow to container
  const container = document.querySelector('.container');
  container.classList.remove('mood-glow-happy', 'mood-glow-calm', 'mood-glow-tired');
  
  if (value >= 4) {
    container.classList.add('mood-glow-happy');
  } else if (value === 3) {
    container.classList.add('mood-glow-calm');
  } else {
    container.classList.add('mood-glow-tired');
  }
  
  // Show celebration animation
  const emojiElement = document.getElementById('moodEmoji');
  if (emojiElement) {
    emojiElement.style.animation = 'none';
    setTimeout(() => {
      emojiElement.style.animation = 'pulse 2s ease-in-out infinite';
    }, 10);
  }
  
  renderMoodHistory();
}

function loadTodayMood() {
  const today = new Date().toISOString().split('T')[0];
  let moods = JSON.parse(localStorage.getItem('moodTracker')) || {};
  
  if (moods[today]) {
    const slider = document.getElementById('moodSlider');
    slider.value = moods[today];
    updateMoodEmoji();
  }
  
  renderMoodHistory();
}

function renderMoodHistory() {
  const historyContainer = document.getElementById('moodHistory');
  if (!historyContainer) return;
  
  historyContainer.innerHTML = '';
}

// ============= MOOD CHART FUNCTIONS =============
function toggleMoodChart() {
  const modal = document.getElementById('moodChartModal');
  modal.classList.toggle('active');
  
  if (modal.classList.contains('active')) {
    // Draw the currently active chart
    const activeTab = document.querySelector('.chart-tab-btn.active');
    if (activeTab) {
      const chartType = activeTab.textContent.toLowerCase();
      setTimeout(() => drawChart(chartType), 100);
    }
  }
}

function switchChartView(chartType) {
  // Update tab buttons
  document.querySelectorAll('.chart-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Update chart views
  document.querySelectorAll('.chart-view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(chartType + 'Chart').classList.add('active');
  
  // Draw the selected chart
  setTimeout(() => drawChart(chartType), 100);
}

function drawChart(type) {
  const moods = JSON.parse(localStorage.getItem('moodTracker')) || {};
  const canvasId = type + 'Canvas';
  const canvas = document.getElementById(canvasId);
  
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let data = [];
  let labels = [];
  
  if (type === 'weekly') {
    ({ data, labels } = getWeeklyData(moods));
  } else if (type === 'monthly') {
    ({ data, labels } = getMonthlyData(moods));
  } else if (type === 'yearly') {
    ({ data, labels } = getYearlyData(moods));
  }
  
  // Set canvas size
  canvas.width = canvas.offsetWidth;
  canvas.height = 300;
  
  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw chart
  drawBarChart(ctx, data, labels, canvas.width, canvas.height, type);
  
  // Update info text
  updateChartInfo(type, data);
}

function getWeeklyData(moods) {
  const data = [];
  const labels = [];
  const today = new Date();
  
  // Get last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    
    labels.push(dayName);
    data.push({
      value: moods[dateStr] || 0,
      emoji: moodEmojis[moods[dateStr] - 1] || '—'
    });
  }
  
  return { data, labels };
}

function getMonthlyData(moods) {
  const data = [];
  const labels = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get all days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (day % 5 === 0 || day === 1 || day === daysInMonth) {
      labels.push(day);
    } else {
      labels.push('');
    }
    
    data.push({
      value: moods[dateStr] || 0,
      emoji: moodEmojis[moods[dateStr] - 1] || '—'
    });
  }
  
  return { data, labels };
}

function getYearlyData(moods) {
  const data = [];
  const labels = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Get average mood for each month
  for (let month = 0; month < 12; month++) {
    let monthMoods = [];
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, month, day);
      const dateStr = date.toISOString().split('T')[0];
      if (moods[dateStr]) {
        monthMoods.push(moods[dateStr]);
      }
    }
    
    const avgMood = monthMoods.length > 0 ? 
      Math.round(monthMoods.reduce((a, b) => a + b, 0) / monthMoods.length) : 0;
    
    labels.push(months[month]);
    data.push({
      value: avgMood,
      emoji: moodEmojis[avgMood - 1] || '—',
      count: monthMoods.length
    });
  }
  
  return { data, labels };
}

function drawBarChart(ctx, data, labels, width, height, type) {
  const padding = type === 'yearly' ? 60 : 50;
  const bottomPadding = type === 'yearly' ? 60 : 40;
  const barWidth = (width - padding * 2) / data.length;
  const maxValue = 5;
  const chartHeight = height - padding - bottomPadding;
  
  const moodEmojis = ['😢', '😕', '😐', '🙂', '😄'];
  
  // Draw grid lines
  ctx.strokeStyle = 'rgba(240, 98, 146, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= maxValue; i++) {
    const y = height - bottomPadding - (i / maxValue) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    
    // Draw emoji on Y-axis
    if (i > 0 && i <= 5) {
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(moodEmojis[i - 1], padding / 2 - 5, y + 5);
    }
  }
  
  // Draw bars
  data.forEach((item, index) => {
    const x = padding + index * barWidth + barWidth / 2;
    const barHeight = (item.value / maxValue) * chartHeight;
    const y = height - bottomPadding - barHeight;
    
    // Draw bar with gradient
    const gradient = ctx.createLinearGradient(x - barWidth / 3, y, x - barWidth / 3, height - bottomPadding);
    gradient.addColorStop(0, '#f06292');
    gradient.addColorStop(1, '#ec407a');
    
    ctx.fillStyle = item.value > 0 ? gradient : 'rgba(240, 98, 146, 0.1)';
    ctx.fillRect(x - barWidth / 3, y, barWidth * 0.6, barHeight);
    
    // Draw label with different styles for yearly
    ctx.fillStyle = '#c2185b';
    
    if (type === 'yearly') {
      // Rotate text for yearly labels
      ctx.save();
      ctx.translate(x, height - bottomPadding + 10);
      ctx.rotate(Math.PI / 4); // 45 degrees
      ctx.font = 'bold 10px Poppins';
      ctx.textAlign = 'right';
      ctx.fillText(labels[index], 0, 0);
      ctx.restore();
    } else {
      ctx.font = 'bold 11px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], x, height - bottomPadding + 20);
    }
    
    // Draw emoji above bar
    if (item.value > 0) {
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.emoji, x, y - 10);
    }
  });
  
  // Draw axes
  ctx.strokeStyle = '#c2185b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - bottomPadding);
  ctx.lineTo(width - padding, height - bottomPadding);
  ctx.stroke();
}

function updateChartInfo(type, data) {
  const infoElement = document.getElementById(type + 'Info');
  if (!infoElement) return;
  
  const validValues = data.filter(d => d.value > 0);
  
  if (validValues.length === 0) {
    infoElement.textContent = 'No mood data yet. Start tracking your mood!';
    return;
  }
  
  const avgMood = Math.round(validValues.reduce((sum, d) => sum + d.value, 0) / validValues.length);
  const moodTexts = ['Struggling', 'Unhappy', 'Neutral', 'Happy', 'Very Happy'];
  
  infoElement.textContent = `Average mood: ${moodEmojis[avgMood - 1]} ${moodTexts[avgMood - 1]} • ${validValues.length} entries`;
}

// ============= THEME TOGGLE =============
function toggleTheme() {
  const body = document.body;
  const toggle = document.getElementById('themeToggle');
  body.classList.toggle('dark-mode');
  toggle.textContent = body.classList.contains('dark-mode') ? '🌙' : '☀️';
  localStorage.setItem('bloomTheme', body.classList.contains('dark-mode') ? 'dark' : 'light');
  
  // Control teddy's night mode
  if (body.classList.contains('dark-mode')) {
    enableTeddyNightMode();
  } else {
    disableTeddyNightMode();
  }
}

// Load theme on startup
document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('bloomTheme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('themeToggle').textContent = '🌙';
  }
});

// ============= MASCOT FUNCTIONS =============
function showMascotMessage(message) {
  const bubble = document.getElementById('mascotBubble');
  bubble.textContent = message;
  bubble.style.animation = 'none';
  setTimeout(() => {
    bubble.style.animation = 'bubbleFade 3s ease forwards';
  }, 10);
}

// Show encouraging messages
const encouragementMessages = [
  'Great work! 💕',
  'You\'ve got this! 🌟',
  'Keep going! 🌸',
  'You\'re amazing! ✨',
  'So proud of you! 💖'
];

// ============= FUTURE LETTER FUNCTIONS =============
function saveLetter() {
  const content = document.getElementById('letterContent').value;
  const unlockDate = document.getElementById('letterUnlockDate').value;
  
  if (!content.trim() || !unlockDate) {
    showReminder('Please write a letter and set an unlock date 💌');
    return;
  }
  
  let letters = JSON.parse(localStorage.getItem('futureLetters')) || [];
  const letter = {
    id: Date.now(),
    content: content,
    unlockDate: unlockDate,
    createdDate: new Date().toISOString().split('T')[0],
    opened: false
  };
  
  letters.push(letter);
  localStorage.setItem('futureLetters', JSON.stringify(letters));
  
  document.getElementById('letterContent').value = '';
  document.getElementById('letterUnlockDate').value = '';
  
  showReminder('Letter saved! A letter from past you 💗');
  showMascotMessage('Letter saved! 💌');
  renderLetters();
}

function renderLetters() {
  const container = document.getElementById('lettersList');
  let letters = JSON.parse(localStorage.getItem('futureLetters')) || [];
  
  container.innerHTML = '';
  
  letters.sort((a, b) => new Date(b.unlockDate) - new Date(a.unlockDate));
  
  if (letters.length > 0) {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'margin-bottom: 16px;';
    
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Previous Letters';
    toggleBtn.className = 'btn-view-letters';
    toggleBtn.style.cssText = `
      padding: 10px 16px;
      border-radius: 12px;
      background: #f06292;
      color: white;
      border: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      font-family: 'Poppins', sans-serif;
    `;
    
    const lettersListDiv = document.createElement('div');
    lettersListDiv.id = 'previousLettersDiv';
    lettersListDiv.style.cssText = 'display: none;';
    
    toggleBtn.addEventListener('click', () => {
      const isVisible = lettersListDiv.style.display !== 'none';
      lettersListDiv.style.display = isVisible ? 'none' : 'block';
      toggleBtn.textContent = isVisible ? 'Previous Letters' : 'Hide Letters';
    });
    
    letters.forEach(letter => {
      const today = new Date().toISOString().split('T')[0];
      const isUnlocked = letter.unlockDate <= today;
      
      const letterEl = document.createElement('div');
      letterEl.className = `letter-envelope ${isUnlocked ? '' : 'locked'}`;
      letterEl.innerHTML = `
        <div class="letter-date">${new Date(letter.unlockDate).toLocaleDateString()}</div>
        <div class="letter-preview">${isUnlocked ? letter.content.substring(0, 60) + '...' : 'Locked until ' + new Date(letter.unlockDate).toLocaleDateString()}</div>
      `;
      
      if (isUnlocked) {
        letterEl.style.cursor = 'pointer';
        letterEl.onclick = () => showLetterModal(letter.content);
      }
      
      lettersListDiv.appendChild(letterEl);
    });
    
    buttonContainer.appendChild(toggleBtn);
    container.appendChild(buttonContainer);
    container.appendChild(lettersListDiv);
  }
}

function showLetterModal(content) {
  const modal = document.createElement('div');
  modal.className = 'letter-modal-overlay';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 32px;
    border-radius: 20px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(240, 98, 146, 0.3);
    text-align: center;
  `;
  
  modalContent.innerHTML = `
    <h2 style="color: #d81b60; margin-bottom: 16px;">Letter from Your Past Self 💌</h2>
    <p style="white-space: pre-wrap; color: #6b5344; line-height: 1.6; margin-bottom: 24px;">${content}</p>
    <button class="close-letter-modal" style="padding: 10px 20px; background: #f06292; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">Close</button>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  const closeBtn = modalContent.querySelector('.close-letter-modal');
  closeBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

function checkUnlockedLetters() {
  let letters = JSON.parse(localStorage.getItem('futureLetters')) || [];
  const today = new Date().toISOString().split('T')[0];
  
  letters.forEach(letter => {
    const shownLetterIds = JSON.parse(localStorage.getItem('shownLetterIds')) || [];
    if (letter.unlockDate === today && !shownLetterIds.includes(letter.id)) {
      showLetterModal(letter.content);
      shownLetterIds.push(letter.id);
      localStorage.setItem('shownLetterIds', JSON.stringify(shownLetterIds));
    }
  });
}

// ============= FOCUS TIMER FUNCTIONS =============
let timerInterval = null;
let timerSeconds = 1500; // 25 minutes default
let isTimerRunning = false;

function setTimerDuration(minutes) {
  timerSeconds = minutes * 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  document.getElementById('timerDisplay').textContent = 
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;
  
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      isTimerRunning = false;
      completeTimer();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isTimerRunning) return;
  clearInterval(timerInterval);
  isTimerRunning = false;
}

function resetTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerSeconds = 1500;
  updateTimerDisplay();
}

function completeTimer() {
  showReminder('Great focus session! Take a break 🫖');
  showMascotMessage('Focus complete! 🌟');
  // Floating petals animation
  createFloatingElements();
}

function createFloatingElements() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const petal = document.createElement('div');
      petal.style.cssText = `
        position: fixed;
        left: ${Math.random() * 100}%;
        top: 0;
        font-size: 20px;
        pointer-events: none;
        z-index: 998;
        animation: float 3s ease-in forwards;
      `;
      petal.textContent = ['🌸', '🌷', '🌹', '🌺', '✨'][i];
      document.body.appendChild(petal);
      setTimeout(() => petal.remove(), 3000);
    }, i * 200);
  }
}

// ============= MEMORY GARDEN FUNCTIONS =============
function initGarden() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
  
  document.getElementById('gardenMonth').textContent = `${monthNames[month]} ${year}`;
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const container = document.getElementById('gardenFlowers');
  container.innerHTML = '';
  
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    const completedTasks = dayTasks.filter(t => t.completed);
    
    const flower = document.createElement('div');
    flower.className = 'flower';
    
    if (dayTasks.length > 0 && completedTasks.length > 0) {
      flower.classList.add('completed');
      flower.textContent = '🌸';
      flower.title = `${completedTasks.length}/${dayTasks.length} tasks done`;
    } else if (dayTasks.length > 0) {
      flower.classList.add('empty');
      flower.textContent = '🌱';
      flower.title = `${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''} pending`;
    } else {
      flower.classList.add('empty');
      flower.textContent = '•';
      flower.title = 'No tasks';
    }
    
    container.appendChild(flower);
  }
}

// ============= REFLECTION FUNCTIONS =============
function saveReflection() {
  const well = document.getElementById('reflectionWell').value;
  const felt = document.getElementById('reflectionFelt').value;
  const grateful = document.getElementById('reflectionGrateful').value;
  
  if (!well.trim() && !felt.trim() && !grateful.trim()) {
    showReminder('Share at least one reflection 🌙');
    return;
  }
  
  let reflections = JSON.parse(localStorage.getItem('reflections')) || [];
  const today = new Date().toISOString().split('T')[0];
  
  reflections.push({
    date: today,
    well: well,
    felt: felt,
    grateful: grateful
  });
  
  localStorage.setItem('reflections', JSON.stringify(reflections));
  
  document.getElementById('reflectionWell').value = '';
  document.getElementById('reflectionFelt').value = '';
  document.getElementById('reflectionGrateful').value = '';
  
  showReminder('Reflection saved. You did well today 💫');
  showMascotMessage('Rest well! 🌙');
  renderReflections();
}

function renderReflections() {
  const container = document.getElementById('reflectionsList');
  let reflections = JSON.parse(localStorage.getItem('reflections')) || [];
  
  container.innerHTML = '';
  reflections.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).forEach(reflection => {
    const entry = document.createElement('div');
    entry.className = 'reflection-entry';
    entry.innerHTML = `
      <div class="reflection-entry-date">${new Date(reflection.date).toLocaleDateString()}</div>
      <div class="reflection-entry-text">
        ${reflection.well ? `<strong>Well:</strong> ${reflection.well}<br>` : ''}
        ${reflection.felt ? `<strong>Felt:</strong> ${reflection.felt}<br>` : ''}
        ${reflection.grateful ? `<strong>Grateful:</strong> ${reflection.grateful}` : ''}
      </div>
    `;
    container.appendChild(entry);
  });
}

function toggleReflectionHistory() {
  const container = document.getElementById('reflectionsList');
  const btn = event.target;
  
  if (container.style.display === 'none') {
    container.style.display = 'block';
    renderReflections();
    btn.textContent = 'Hide History';
  } else {
    container.style.display = 'none';
    btn.textContent = 'View History';
  }
}

// Initialize features on tab switch
window.addEventListener('load', function() {
  initGarden();
  renderLetters();
  renderReflections();
  initBloomTeddy();
});

// ============= BLOOM TEDDY MASCOT =============
// ============= BLOOM TEDDY MASCOT =============
function initBloomTeddy() {
  const teddy = document.getElementById('bloomTeddy');
  if (!teddy) return;
  
  teddy.addEventListener('click', (e) => {
    e.stopPropagation();
    showTeddyMessage('You\'re doing amazing! 💕');
  });
}

function showTeddyMessage(message) {
  const bubble = document.getElementById('teddyBubble');
  if (!bubble) return;
  
  bubble.textContent = message;
  bubble.style.opacity = '1';
  bubble.style.animation = 'bubbleFadeIn 0.4s ease-out forwards';
  
  setTimeout(() => {
    bubble.style.opacity = '0';
    bubble.textContent = '';
  }, 3000);
}

function setTeddyState(state) {
  const teddy = document.getElementById('bloomTeddy');
  if (!teddy) return;
  
  teddy.classList.remove('happy', 'streak', 'reflection', 'focused');
  
  if (state) {
    teddy.classList.add(state);
  }
}

function triggerTeddyReaction(action, message = null) {
  const teddy = document.getElementById('bloomTeddy');
  if (!teddy) return;
  
  switch(action) {
    case 'happy':
      setTeddyState('happy');
      if (message) showTeddyMessage(message);
      setTimeout(() => setTeddyState(null), 600);
      break;
      
    case 'streak':
      setTeddyState('streak');
      if (message) showTeddyMessage(message);
      setTimeout(() => setTeddyState(null), 800);
      break;
      
    case 'reflection':
      setTeddyState('reflection');
      if (message) showTeddyMessage(message);
      setTimeout(() => setTeddyState(null), 1000);
      break;
      
    case 'focused':
      setTeddyState('focused');
      if (message) showTeddyMessage(message);
      break;
  }
}

function triggerTeddyMood() {
  const slider = document.getElementById('moodSlider');
  if (slider) {
    const value = parseInt(slider.value);
    if (value >= 4) {
      triggerTeddyReaction('happy', 'You\'re glowing! 💫');
    }
  }
}

function triggerTeddyStreak() {
  triggerTeddyReaction('streak', 'Keep going! 🔥');
}

function triggerTeddyReflection() {
  triggerTeddyReaction('reflection', 'Beautiful thoughts 🌸');
}
