(function () {
  const STORAGE_KEY = "todo.tasks.v4";

  /** @type {{ id: string; title: string; completed: boolean; createdAt: number; dueAt: number|null; }[]} */
  let tasks = [];

  const form = document.getElementById("new-task-form");
  const input = document.getElementById("new-task-input");
  const dueInput = document.getElementById("new-task-due");
  const list = document.getElementById("task-list");
  const emptyState = document.getElementById("empty-state");
  
  const totalTasksEl = document.getElementById("total-tasks");
  const completedTasksEl = document.getElementById("completed-tasks");
  const pendingTasksEl = document.getElementById("pending-tasks");
  const overdueTasksEl = document.getElementById("overdue-tasks");
  const successRateEl = document.getElementById("success-rate");

  const weekPrevBtn = document.getElementById("week-prev");
  const weekNextBtn = document.getElementById("week-next");
  const weekLabel = document.getElementById("week-label");
  const weeklyCalendar = document.getElementById("weekly-calendar");

  const filterAllBtn = document.getElementById("filter-all");
  const filterPendingBtn = document.getElementById("filter-pending");
  const filterCompletedBtn = document.getElementById("filter-completed");
  const filterOverdueBtn = document.getElementById("filter-overdue");

  let currentWeekOffset = 0;
  let currentFilter = "all";

  function updateCurrentDate() {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const dateStr = now.toLocaleDateString('tr-TR', options);
    document.getElementById("current-date").textContent = dateStr;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        tasks = JSON.parse(raw);
      } else {

        const v3Raw = localStorage.getItem("todo.tasks.v3");
        const v2Raw = localStorage.getItem("todo.tasks.v2");
        const v1Raw = localStorage.getItem("todo.tasks.v1");
        if (v3Raw) {
          tasks = JSON.parse(v3Raw).map((t) => ({ ...t, dueAt: null }));
        } else if (v2Raw) {
          tasks = JSON.parse(v2Raw).map((t) => ({ id: t.id, title: t.title, completed: t.completed, createdAt: t.createdAt, dueAt: t.dueAt || null }));
        } else if (v1Raw) {
          tasks = JSON.parse(v1Raw).map((t) => ({ id: t.id, title: t.title, completed: t.completed, createdAt: t.createdAt, dueAt: null }));
        } else {
          tasks = [];
        }
        save();
      }
    } catch {
      tasks = [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function generateId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function parseDatetimeLocal(value) {
    if (!value) return null;
    const t = new Date(value);
    return Number.isNaN(t.getTime()) ? null : t.getTime();
  }

  function formatDateTime(ts) {
    if (ts == null) return "";
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
  }

  function setMinDateTime() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const mi = pad(now.getMinutes());
    const minDateTime = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    dueInput.setAttribute("min", minDateTime);
  }

  function isOverdue(task) {
    return !task.completed && task.dueAt != null && Date.now() > task.dueAt;
  }

  function getWeekStart(weekOffset = 0) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  function getWeekDays(weekOffset = 0) {
    const monday = getWeekStart(weekOffset);
    const days = [];
    const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push({
        date: day,
        name: dayNames[i],
        dayNumber: day.getDate(),
        isToday: isSameDay(day, new Date())
      });
    }
    return days;
  }

  function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  function getTasksForDay(date) {
    return tasks.filter(task => {
      if (!task.dueAt) return false;
      const taskDate = new Date(task.dueAt);
      return isSameDay(taskDate, date);
    });
  }

  function renderWeeklyCalendar() {
    const days = getWeekDays(currentWeekOffset);
    weeklyCalendar.innerHTML = "";
    const weekStart = getWeekStart(currentWeekOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    if (currentWeekOffset === 0) {
      weekLabel.textContent = "Bu hafta";
    } else if (currentWeekOffset === 1) {
      weekLabel.textContent = "Gelecek hafta";
    } else {
      const startStr = `${weekStart.getDate()}.${weekStart.getMonth() + 1}`;
      const endStr = `${weekEnd.getDate()}.${weekEnd.getMonth() + 1}`;
      weekLabel.textContent = `${startStr} - ${endStr}`;
    }

    days.forEach(day => {
      const dayEl = document.createElement("div");
      dayEl.className = "rounded-lg border border-gray-200 p-2 min-h-[80px] " + 
        (day.isToday ? "bg-purple-50 border-purple-300" : "bg-gray-50");

      const header = document.createElement("div");
      header.className = "text-center mb-2";
      header.innerHTML = `
        <div class="text-xs text-gray-600">${day.name}</div>
        <div class="text-sm font-semibold ${day.isToday ? 'text-purple-600' : 'text-gray-800'}">${day.dayNumber}</div>
      `;

      const tasksEl = document.createElement("div");
      tasksEl.className = "space-y-1";

      const dayTasks = getTasksForDay(day.date);
      dayTasks.forEach(task => {
        const taskEl = document.createElement("div");
        taskEl.className = "text-xs px-2 py-1 rounded truncate " + 
          (task.completed ? "bg-green-200 text-green-800 line-through" : 
           isOverdue(task) ? "bg-red-200 text-red-800" : "bg-blue-200 text-blue-800");
        taskEl.textContent = task.title;
        taskEl.title = task.title;
        tasksEl.appendChild(taskEl);
      });

      if (dayTasks.length === 0) {
        const emptyEl = document.createElement("div");
        emptyEl.className = "text-xs text-gray-400 text-center";
        emptyEl.textContent = "Görev yok";
        tasksEl.appendChild(emptyEl);
      }

      dayEl.appendChild(header);
      dayEl.appendChild(tasksEl);
      weeklyCalendar.appendChild(dayEl);
    });
  }

  function addTask(title, dueAt) {
    const trimmed = title.trim();
    if (!trimmed) return;
    tasks.unshift({ 
      id: generateId(), 
      title: trimmed, 
      completed: false, 
      createdAt: Date.now(),
      dueAt: dueAt || null
    });
    save();
    render();
  }

  function toggleTask(id) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    save();
    render();
  }

  function deleteTask(id) {
    const idx = tasks.findIndex((x) => x.id === id);
    if (idx === -1) return;
    tasks.splice(idx, 1);
    save();
    render();
  }

  function createTaskItem(task) {
    const li = document.createElement("li");
    const overdue = isOverdue(task);
    
    li.className = "rounded-lg border bg-white p-3 " + 
      (overdue ? "border-red-300 bg-red-50" : "border-gray-200");
    li.dataset.id = task.id;

    const mainRow = document.createElement("div");
    mainRow.className = "flex items-start justify-between";

    const leftSide = document.createElement("div");
    leftSide.className = "flex-1 space-y-1";

    const titleRow = document.createElement("div");
    titleRow.className = "flex items-center gap-2";

    const title = document.createElement("span");
    title.textContent = task.title;
    title.className = "text-sm text-gray-800" + (task.completed ? " line-through text-gray-400" : "");

    titleRow.appendChild(title);

    if (overdue) {
      const overdueWarning = document.createElement("span");
      overdueWarning.textContent = "⚠️ Süresi geçti";
      overdueWarning.className = "text-xs text-red-600 font-medium";
      titleRow.appendChild(overdueWarning);
    }

    const metaInfo = document.createElement("div");
    metaInfo.className = "text-xs text-gray-500";


    let metaText = `Başlangıç: ${formatDateTime(task.createdAt)}`;
    
    if (task.dueAt) {
      metaText += ` • Bitiş: ${formatDateTime(task.dueAt)}`;
    }
    
    metaInfo.textContent = metaText;

    leftSide.appendChild(titleRow);
    leftSide.appendChild(metaInfo);

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "flex items-center gap-2";

    const completeBtn = document.createElement("button");
    completeBtn.innerHTML = "✓";
    completeBtn.className = "flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-blue-700 " + 
      (task.completed ? "bg-green-600 hover:bg-green-700" : "bg-blue-600");

    const delBtn = document.createElement("button");
    delBtn.innerHTML = "🗑️";
    delBtn.className = "flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white hover:bg-purple-700";

    buttonGroup.appendChild(completeBtn);
    buttonGroup.appendChild(delBtn);

    mainRow.appendChild(leftSide);
    mainRow.appendChild(buttonGroup);
    li.appendChild(mainRow);

    completeBtn.addEventListener("click", () => toggleTask(task.id));
    delBtn.addEventListener("click", () => deleteTask(task.id));

    return li;
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    const overdue = tasks.filter(t => isOverdue(t)).length;
    

    let successScore = 0;
    if (total > 0) {
      for (const task of tasks) {
        if (task.completed) {

          const wasOverdueWhenCompleted = task.dueAt && task.dueAt < Date.now();
          successScore += wasOverdueWhenCompleted ? 0.7 : 1.0;
        }
      }
      const successRate = Math.round((successScore / total) * 100);
      successRateEl.textContent = `${successRate}%`;
    } else {
      successRateEl.textContent = "0%";
    }

    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;
    overdueTasksEl.textContent = overdue;
  }

  function setFilter(filter) {
    currentFilter = filter;
    
    const filterButtons = [filterAllBtn, filterPendingBtn, filterCompletedBtn, filterOverdueBtn];
    filterButtons.forEach(btn => {
      btn.classList.remove("bg-purple-600", "text-white");
      btn.classList.add("bg-gray-200", "text-gray-700");
    });
    
    let activeBtn;
    switch(filter) {
      case "all": activeBtn = filterAllBtn; break;
      case "pending": activeBtn = filterPendingBtn; break;
      case "completed": activeBtn = filterCompletedBtn; break;
      case "overdue": activeBtn = filterOverdueBtn; break;
    }
    
    if (activeBtn) {
      activeBtn.classList.remove("bg-gray-200", "text-gray-700");
      activeBtn.classList.add("bg-purple-600", "text-white");
    }
    
    renderTaskList();
  }

  function getFilteredTasks() {
    switch(currentFilter) {
      case "pending":
        return tasks.filter(t => !t.completed && !isOverdue(t));
      case "completed":
        return tasks.filter(t => t.completed);
      case "overdue":
        return tasks.filter(t => isOverdue(t));
      default:
        return tasks;
    }
  }

  function renderTaskList() {
    list.innerHTML = "";
    
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
      emptyState.classList.remove("hidden");
      let message = "Henüz görev yok. Yukarıdan ekleyin!";
      if (currentFilter === "pending") message = "Bekleyen görev yok.";
      else if (currentFilter === "completed") message = "Tamamlanan görev yok.";
      else if (currentFilter === "overdue") message = "Geciken görev yok.";
      emptyState.textContent = message;
    } else {
      emptyState.classList.add("hidden");
      
      const frag = document.createDocumentFragment();
      for (const task of filteredTasks) {
        frag.appendChild(createTaskItem(task));
      }
      list.appendChild(frag);
    }
  }

  function render() {
    renderTaskList();
    updateStats();
    renderWeeklyCalendar();
  }

  load();
  setMinDateTime();
  setFilter("all");
  updateCurrentDate();
  render();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const due = parseDatetimeLocal(dueInput.value);
    addTask(input.value, due);
    input.value = "";
    dueInput.value = "";
    setMinDateTime();
    input.focus();
  });

  filterAllBtn.addEventListener("click", () => setFilter("all"));
  filterPendingBtn.addEventListener("click", () => setFilter("pending"));
  filterCompletedBtn.addEventListener("click", () => setFilter("completed"));
  filterOverdueBtn.addEventListener("click", () => setFilter("overdue"));

  weekPrevBtn.addEventListener("click", () => {
    if (currentWeekOffset > 0) {
      currentWeekOffset--;
      renderWeeklyCalendar();
    }
  });

  weekNextBtn.addEventListener("click", () => {
    if (currentWeekOffset < 3) {
      currentWeekOffset++;
      renderWeeklyCalendar();
    }
  });

  setInterval(() => {
    setMinDateTime();
    updateCurrentDate();
    render();
  }, 60000);
})();
