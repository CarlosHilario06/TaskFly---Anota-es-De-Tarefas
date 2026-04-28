// Pede permissão para enviar notificações no navegador
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

// Estado atual da tela
let currentFilter = "all";
let currentProject = "all";
let editingTaskId = null;

// Busca tarefas salvas
function getTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

// Salva tarefas
function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Busca projetos salvos
function getProjects() {
  return JSON.parse(localStorage.getItem("projects")) || [];
}

// Salva projetos
function saveProjects(projects) {
  localStorage.setItem("projects", JSON.stringify(projects));
}

// Recolhe/expande sidebar
function toggleSidebar() {
  document.body.classList.toggle("sidebar-collapsed");
}

// Abre formulário de projeto
function showProjectForm() {
  document.getElementById("projectForm").classList.add("show");
  document.getElementById("projectNameInput").focus();
}

// Salva novo projeto
function saveNewProject() {
  const input = document.getElementById("projectNameInput");
  const projectName = input.value.trim();

  if (!projectName) return;

  const projects = getProjects();

  projects.push({
    id: Date.now(),
    name: projectName,
    deleting: false
  });

  saveProjects(projects);

  input.value = "";
  document.getElementById("projectForm").classList.remove("show");

  renderProjects();
  updateProjectSelect();
}

// Marca projeto para exclusão
function deleteProject(projectName) {
  const projects = getProjects().map(project => {
    if (project.name === projectName) {
      return { ...project, deleting: true };
    }

    return project;
  });

  saveProjects(projects);
  renderProjects();
}

// Confirma exclusão do projeto
function confirmDeleteProject(projectName) {
  const projects = getProjects().filter(project => project.name !== projectName);
  saveProjects(projects);

  const tasks = getTasks().filter(task => task.project !== projectName);
  saveTasks(tasks);

  if (currentProject === projectName) {
    currentProject = "all";
    document.getElementById("pageTitle").textContent = "Todas as tarefas";
  }

  renderProjects();
  renderTasks();
  updateProjectSelect();
}

// Renderiza projetos na sidebar
function renderProjects() {
  const container = document.getElementById("projectsList");
  const projects = getProjects();
  const tasks = getTasks();

  container.innerHTML = "";

  projects.forEach(project => {
    const button = document.createElement("button");
    button.classList.add("project-item");

    if (currentProject === project.name) {
      button.classList.add("active");
    }

    const count = tasks.filter(task => task.project === project.name).length;

    button.innerHTML = `
      <span># ${project.name}</span>

      <div class="project-actions">
        ${
          project.deleting
            ? `<button class="confirm-delete" onclick="event.stopPropagation(); confirmDeleteProject('${project.name}')">Confirmar</button>`
            : `<small>${count}</small>`
        }

        <button class="delete-project" onclick="event.stopPropagation(); deleteProject('${project.name}')">✖</button>
      </div>
    `;

    button.onclick = function () {
      currentProject = project.name;
      currentFilter = "all";
      document.getElementById("pageTitle").textContent = project.name;
      renderProjects();
      renderTasks();
    };

    container.appendChild(button);
  });
}

// Atualiza o select de projetos no modal
function updateProjectSelect() {
  const select = document.getElementById("modalTaskProject");
  const projects = getProjects();

  if (!select) return;

  select.innerHTML = `<option value="all">Sem projeto</option>`;

  projects.forEach(project => {
    const option = document.createElement("option");
    option.value = project.name;
    option.textContent = project.name;
    select.appendChild(option);
  });

  select.value = currentProject;
}

// Abre modal para criar tarefa
function openTaskModal() {
  editingTaskId = null;

  updateProjectSelect();

  document.getElementById("modalTaskTitle").value = "";
  document.getElementById("modalTaskDescription").value = "";
  document.getElementById("modalTaskPriority").value = "baixa";
  document.getElementById("modalTaskProject").value = currentProject;
  document.getElementById("modalTaskDate").value = "";
  document.getElementById("modalTaskTime").value = "";

  document.getElementById("taskModal").classList.add("show");
  document.getElementById("modalTaskTitle").focus();
}

// Fecha modal
function closeTaskModal() {
  document.getElementById("taskModal").classList.remove("show");
  editingTaskId = null;
}

// Abre modal preenchido para editar tarefa
function editTask(id) {
  const tasks = getTasks();
  const task = tasks.find(task => task.id === id);

  if (!task) return;

  editingTaskId = id;

  updateProjectSelect();

  document.getElementById("modalTaskTitle").value = task.title;
  document.getElementById("modalTaskDescription").value = task.description || "";
  document.getElementById("modalTaskPriority").value = task.priority;
  document.getElementById("modalTaskProject").value = task.project || "all";
  document.getElementById("modalTaskDate").value = task.date || "";
  document.getElementById("modalTaskTime").value = task.time || "";

  document.getElementById("taskModal").classList.add("show");
}

// Cria ou edita tarefa pelo modal
function addTaskFromModal() {
  const title = document.getElementById("modalTaskTitle").value.trim();
  const description = document.getElementById("modalTaskDescription").value.trim();
  const priority = document.getElementById("modalTaskPriority").value;
  const project = document.getElementById("modalTaskProject").value;
  const date = document.getElementById("modalTaskDate").value;
  const time = document.getElementById("modalTaskTime").value;

  if (!title) {
    alert("Digite o nome da tarefa");
    return;
  }

  let tasks = getTasks();

  if (editingTaskId) {
    tasks = tasks.map(task => {
      if (task.id === editingTaskId) {
        return {
          ...task,
          title,
          description,
          priority,
          project,
          date,
          time,
          notified: false
        };
      }

      return task;
    });
  } else {
    tasks.push({
      id: Date.now(),
      title,
      description,
      priority,
      project,
      date,
      time,
      completed: false,
      notified: false
    });
  }

  saveTasks(tasks);

  closeTaskModal();
  renderProjects();
  renderTasks();
  checkReminders();
}

// Renderiza tarefas na tela
function renderTasks() {
  const container = document.getElementById("taskList");
  const allTasks = getTasks();

  const searchInput = document.getElementById("searchInput");
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

  const tasks = allTasks.filter(task => {
    const matchesProject =
      currentProject === "all" || task.project === currentProject;

    const matchesFilter =
      currentFilter === "completed" ? task.completed :
      currentFilter === "pending" ? !task.completed :
      true;

    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm) ||
      (task.description || "").toLowerCase().includes(searchTerm);

    return matchesProject && matchesFilter && matchesSearch;
  });

  container.innerHTML = "";

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✨</div>
        <h3>Nenhuma tarefa por aqui</h3>
        <p>Crie uma nova tarefa para começar a organizar seu dia.</p>
        <button onclick="openTaskModal()">Adicionar tarefa</button>
      </div>
    `;

    return;
  }

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.setAttribute("data-id", task.id);
    div.classList.add("task-card");

    if (task.completed) {
      div.classList.add("completed-card");
    }

    div.onclick = function () {
      editTask(task.id);
    };

    div.style.borderLeft = `
      5px solid ${
        task.priority === "alta" ? "red" :
        task.priority === "media" ? "orange" :
        "green"
      }
    `;

    div.innerHTML = `
      <div class="task-left">
        <button class="check-btn ${task.completed ? "checked" : ""}" onclick="event.stopPropagation(); toggleTask(${task.id})">
          ${task.completed ? "✓" : "&nbsp;"}
        </button>

        <div class="task-info">
          <h3 class="${task.completed ? "completed" : ""}">
            ${task.title}
          </h3>

          <p>
            ${task.description ? task.description + " • " : ""}
            ${task.date || "Sem data"} ${task.time || ""}
            • prioridade ${task.priority}
          </p>
        </div>
      </div>

      <button class="delete-btn" onclick="event.stopPropagation(); deleteTask(${task.id})">
        🗑
      </button>
    `;

    container.appendChild(div);
  });
}

// Marca/desmarca tarefa como concluída
function toggleTask(id) {
  const tasks = getTasks();

  const updated = tasks.map(task => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }

    return task;
  });

  saveTasks(updated);
  renderTasks();
}

// Deleta tarefa com animação
function deleteTask(id) {
  const card = document.querySelector(`[data-id='${id}']`);

  if (card) {
    card.classList.add("removing");

    setTimeout(() => {
      const tasks = getTasks();
      const filtered = tasks.filter(task => task.id !== id);

      saveTasks(filtered);
      renderProjects();
      renderTasks();
    }, 200);
  }
}

// Filtra tarefas
function setFilter(filter) {
  currentFilter = filter;

  if (filter === "all") {
    document.getElementById("pageTitle").textContent =
      currentProject === "all" ? "Todas as tarefas" : currentProject;
  }

  if (filter === "pending") {
    document.getElementById("pageTitle").textContent = "Pendentes";
  }

  if (filter === "completed") {
    document.getElementById("pageTitle").textContent = "Concluídas";
  }

  renderTasks();
}

// Verifica lembretes
function checkReminders() {
  const tasks = getTasks();
  const now = new Date();

  tasks.forEach(task => {
    if (!task.date || !task.time || task.completed || task.notified) return;

    const taskDateTime = new Date(`${task.date}T${task.time}`);
    const diff = (taskDateTime - now) / 1000 / 60;

    if (diff <= 5 && diff > 0) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⏰ Tarefa chegando!", {
          body: `${task.title} às ${task.time}`
        });
      } else {
        alert(`⏰ ${task.title} às ${task.time}`);
      }

      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
      audio.play();

      task.notified = true;
    }
  });

  saveTasks(tasks);
}

// Inicializa app
renderProjects();
renderTasks();
updateProjectSelect();
checkReminders();
setInterval(checkReminders, 10000);