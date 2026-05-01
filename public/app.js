const state = {
  token: localStorage.getItem("token") || "",
  user: null,
  projects: [],
  activeProjectId: null,
  activeProject: null,
};

const statusOptions = ["TODO", "IN_PROGRESS", "DONE"];

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminSignupForm = document.getElementById("adminSignupForm");
const showLoginBtn = document.getElementById("showLoginBtn");
const showSignupBtn = document.getElementById("showSignupBtn");
const showAdminEntryBtn = document.getElementById("showAdminEntryBtn");
const showAdminSignupBtn = document.getElementById("showAdminSignupBtn");
const showAdminLoginBtn = document.getElementById("showAdminLoginBtn");
const showUserAuthBtn = document.getElementById("showUserAuthBtn");
const showUserAuthFromAdminBtn = document.getElementById("showUserAuthFromAdminBtn");
const toast = document.getElementById("toast");
const currentUserEl = document.getElementById("currentUser");
const dashboardSummary = document.getElementById("dashboardSummary");
const overdueList = document.getElementById("overdueList");
const projectListEl = document.getElementById("projectList");
const activeProjectTitle = document.getElementById("activeProjectTitle");
const activeProjectMeta = document.getElementById("activeProjectMeta");
const memberList = document.getElementById("memberList");
const memberBlock = document.getElementById("memberBlock");
const addMemberForm = document.getElementById("addMemberForm");
const projectCreateCard = document.getElementById("projectCreateCard");
const assigneeSelect = document.getElementById("assigneeSelect");
const taskList = document.getElementById("taskList");

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.style.background = isError ? "#7d1f1f" : "#121826";
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2200);
}

function toIsoOrUndefined(localDateTime) {
  if (!localDateTime) {
    return undefined;
  }
  const date = new Date(localDateTime);
  if (Number.isNaN(date.valueOf())) {
    return undefined;
  }
  return date.toISOString();
}

function formatDate(value) {
  if (!value) {
    return "No due date";
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return "No due date";
  }
  return date.toLocaleString();
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch (_error) {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

function setAuth(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem("token", token);
}

function clearAuth() {
  state.token = "";
  state.user = null;
  state.projects = [];
  state.activeProjectId = null;
  state.activeProject = null;
  localStorage.removeItem("token");
}

function renderDashboard(data) {
  dashboardSummary.innerHTML = "";
  const entries = [
    ["Total", data.summary.total],
    ["Todo", data.summary.TODO],
    ["In Progress", data.summary.IN_PROGRESS],
    ["Done", data.summary.DONE],
    ["Overdue", data.summary.overdue],
  ];

  entries.forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "stat";

    const strong = document.createElement("strong");
    strong.textContent = String(value);
    const small = document.createElement("span");
    small.textContent = label;

    card.append(strong, small);
    dashboardSummary.appendChild(card);
  });

  overdueList.innerHTML = "";
  if (!data.overdueTasks.length) {
    const li = document.createElement("li");
    li.textContent = "No overdue tasks";
    overdueList.appendChild(li);
    return;
  }

  data.overdueTasks.forEach((task) => {
    const li = document.createElement("li");
    li.textContent = `${task.title} • ${task.project.name} • Due ${formatDate(task.dueDate)}`;
    overdueList.appendChild(li);
  });
}

function renderProjects() {
  projectListEl.innerHTML = "";

  if (!state.projects.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No projects yet.";
    projectListEl.appendChild(empty);
    return;
  }

  state.projects.forEach((project) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `project-item ${state.activeProjectId === project.id ? "active" : ""}`;

    const strong = document.createElement("strong");
    strong.textContent = project.name;
    const meta = document.createElement("div");
    meta.className = "muted";
    meta.textContent = `${project._count.tasks} tasks • ${project._count.memberships} members`;

    button.append(strong, meta);
    button.addEventListener("click", async () => {
      state.activeProjectId = project.id;
      await loadActiveProject();
      renderProjects();
    });

    projectListEl.appendChild(button);
  });
}

function renderMembers() {
  memberList.innerHTML = "";
  assigneeSelect.innerHTML = '<option value="">Unassigned</option>';

  if (!state.activeProject) {
    memberBlock.classList.add("hidden");
    return;
  }

  memberBlock.classList.remove("hidden");

  state.activeProject.memberships.forEach((membership) => {
    const user = membership.user;

    const li = document.createElement("li");
    li.textContent = `${user.name} (${user.email}) • ${user.role}`;
    memberList.appendChild(li);

    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = `${user.name} (${user.role})`;
    assigneeSelect.appendChild(option);
  });

  if (state.user.role === "ADMIN") {
    addMemberForm.classList.remove("hidden");
  } else {
    addMemberForm.classList.add("hidden");
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = "";

  if (!tasks.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No tasks in this project yet.";
    taskList.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = "task-item";

    const top = document.createElement("div");
    top.className = "task-top";

    const titleBox = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = task.title;
    const assignee = document.createElement("div");
    assignee.className = "muted";
    assignee.textContent = `Assignee: ${task.assignee ? task.assignee.name : "Unassigned"}`;
    titleBox.append(title, assignee);

    const statusSelect = document.createElement("select");
    statusOptions.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status.replace("_", " ");
      if (task.status === status) {
        option.selected = true;
      }
      statusSelect.appendChild(option);
    });

    top.append(titleBox, statusSelect);

    const desc = document.createElement("p");
    desc.textContent = task.description || "No description";

    const meta = document.createElement("div");
    meta.className = "task-meta";
    const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
    meta.textContent = `Due: ${formatDate(task.dueDate)} • Created by: ${task.createdBy.name}${overdue ? " • OVERDUE" : ""}`;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const updateBtn = document.createElement("button");
    updateBtn.type = "button";
    updateBtn.textContent = "Update Status";
    updateBtn.addEventListener("click", async () => {
      try {
        await api(`/api/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: statusSelect.value }),
        });
        showToast("Task status updated");
        await loadDashboard();
        await loadActiveProject();
      } catch (error) {
        showToast(error.message, true);
      }
    });

    actions.append(updateBtn);

    card.append(top, desc, meta, actions);
    taskList.appendChild(card);
  });
}

async function loadProjects() {
  const data = await api("/api/projects");
  state.projects = data.projects;

  if (state.activeProjectId && !state.projects.some((project) => project.id === state.activeProjectId)) {
    state.activeProjectId = null;
  }

  if (!state.activeProjectId && state.projects.length) {
    state.activeProjectId = state.projects[0].id;
  }

  renderProjects();

  if (state.activeProjectId) {
    await loadActiveProject();
  } else {
    state.activeProject = null;
    activeProjectTitle.textContent = "Select a project";
    activeProjectMeta.textContent = "";
    renderMembers();
    renderTasks([]);
  }
}

async function loadActiveProject() {
  if (!state.activeProjectId) {
    return;
  }

  const data = await api(`/api/projects/${state.activeProjectId}`);
  state.activeProject = data.project;

  activeProjectTitle.textContent = state.activeProject.name;
  activeProjectMeta.textContent = `${state.activeProject.description || "No description"} • ${state.activeProject.memberships.length} members`;

  renderMembers();
  renderTasks(state.activeProject.tasks);
}

async function loadDashboard() {
  const data = await api("/api/dashboard");
  renderDashboard(data);
}

async function hydrateApp() {
  currentUserEl.textContent = `${state.user.name} (${state.user.email}) • ${state.user.role}`;

  if (state.user.role === "ADMIN") {
    projectCreateCard.classList.remove("hidden");
  } else {
    projectCreateCard.classList.add("hidden");
  }

  await loadDashboard();
  await loadProjects();
}

function showAuth() {
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  showSignupCard();
}

function showApp() {
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
}

function hideAllAuthCards() {
  signupForm.classList.add("hidden");
  loginForm.classList.add("hidden");
  adminLoginForm.classList.add("hidden");
  adminSignupForm.classList.add("hidden");
}

function showSignupCard() {
  hideAllAuthCards();
  signupForm.classList.remove("hidden");
}

function showLoginCard(prefillEmail = "") {
  hideAllAuthCards();
  loginForm.classList.remove("hidden");

  if (prefillEmail) {
    const emailInput = loginForm.elements.namedItem("email");
    if (emailInput) {
      emailInput.value = prefillEmail;
    }
  }
}

function showAdminLoginCard(prefillEmail = "") {
  hideAllAuthCards();
  adminLoginForm.classList.remove("hidden");

  if (prefillEmail) {
    const emailInput = adminLoginForm.elements.namedItem("email");
    if (emailInput) {
      emailInput.value = prefillEmail;
    }
  }
}

function showAdminSignupCard() {
  hideAllAuthCards();
  adminSignupForm.classList.remove("hidden");
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.target);

  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    setAuth(data.token, data.user);
    showApp();
    await hydrateApp();
    event.target.reset();
    showToast("Logged in");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleSignup(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const payload = {
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
  };

  try {
    await api("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    event.target.reset();
    showLoginCard(String(payload.email || ""));
    showToast("Account created. Login instead");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const form = new FormData(event.target);

  try {
    const data = await api("/api/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    setAuth(data.token, data.user);
    showApp();
    await hydrateApp();
    event.target.reset();
    showToast("Admin logged in");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleAdminSignup(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const payload = {
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
  };

  try {
    await api("/api/auth/admin/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    event.target.reset();
    showAdminLoginCard(String(payload.email || ""));
    showToast("Admin account created. Login as admin");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleCreateProject(event) {
  event.preventDefault();
  const form = new FormData(event.target);

  try {
    await api("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
      }),
    });

    showToast("Project created");
    event.target.reset();
    await loadProjects();
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleAddMember(event) {
  event.preventDefault();
  if (!state.activeProjectId) {
    showToast("Pick a project first", true);
    return;
  }

  const form = new FormData(event.target);

  try {
    await api(`/api/projects/${state.activeProjectId}/members`, {
      method: "POST",
      body: JSON.stringify({ email: form.get("email") }),
    });

    showToast("Member added");
    event.target.reset();
    await loadProjects();
    await loadActiveProject();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleCreateTask(event) {
  event.preventDefault();

  if (!state.activeProjectId) {
    if (!state.projects.length) {
      const message =
        state.user?.role === "ADMIN"
          ? "Create a project first, then add tasks"
          : "No project assigned yet. Ask an admin to add you to a project";
      showToast(message, true);
      return;
    }

    state.activeProjectId = state.projects[0].id;
    await loadActiveProject();
    renderProjects();
  }

  const form = new FormData(event.target);

  try {
    await api(`/api/projects/${state.activeProjectId}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description") || undefined,
        dueDate: toIsoOrUndefined(form.get("dueDate")),
        assigneeId: form.get("assigneeId") || undefined,
      }),
    });

    showToast("Task created");
    event.target.reset();
    await loadDashboard();
    await loadActiveProject();
    await loadProjects();
  } catch (error) {
    showToast(error.message, true);
  }
}

function registerEvents() {
  loginForm.addEventListener("submit", handleLogin);
  signupForm.addEventListener("submit", handleSignup);
  adminLoginForm.addEventListener("submit", handleAdminLogin);
  adminSignupForm.addEventListener("submit", handleAdminSignup);
  document.getElementById("projectForm").addEventListener("submit", handleCreateProject);
  addMemberForm.addEventListener("submit", handleAddMember);
  document.getElementById("taskForm").addEventListener("submit", handleCreateTask);
  showLoginBtn.addEventListener("click", () => showLoginCard());
  showSignupBtn.addEventListener("click", () => showSignupCard());
  showAdminEntryBtn.addEventListener("click", () => showAdminLoginCard());
  showAdminSignupBtn.addEventListener("click", () => showAdminSignupCard());
  showAdminLoginBtn.addEventListener("click", () => showAdminLoginCard());
  showUserAuthBtn.addEventListener("click", () => showLoginCard());
  showUserAuthFromAdminBtn.addEventListener("click", () => showLoginCard());

  document.getElementById("refreshTasks").addEventListener("click", async () => {
    try {
      await loadActiveProject();
      await loadDashboard();
      showToast("Refreshed");
    } catch (error) {
      showToast(error.message, true);
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearAuth();
    showAuth();
    showToast("Logged out");
  });
}

async function boot() {
  registerEvents();

  if (!state.token) {
    showAuth();
    return;
  }

  try {
    const data = await api("/api/auth/me");
    state.user = data.user;
    showApp();
    await hydrateApp();
  } catch (_error) {
    clearAuth();
    showAuth();
  }
}

boot();

