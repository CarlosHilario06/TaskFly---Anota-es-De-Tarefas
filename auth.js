// Proteção de rota: impede acessar o dashboard sem login
if (window.location.pathname.includes("dashboard.html")) {
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "login.html";
  }
}

// Mostra mensagens dentro da tela, sem alert()
function showMessage(message, type = "error") {
  let messageBox = document.getElementById("messageBox");

  if (!messageBox) {
    messageBox = document.createElement("div");
    messageBox.id = "messageBox";
    messageBox.className = "message-box";
    document.body.appendChild(messageBox);
  }

  messageBox.textContent = message;
  messageBox.className = `message-box ${type} show`;

  setTimeout(() => {
    messageBox.classList.remove("show");
  }, 2500);
}

// Logout do usuário
function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "login.html";
}

// Cadastro de usuário
function register() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !email || !password) {
    showMessage("Preencha todos os campos.");
    return;
  }

  const user = {
    name,
    email,
    password
  };

  localStorage.setItem("user", JSON.stringify(user));

  showMessage("Cadastro realizado com sucesso!", "success");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 900);
}

// Login de usuário
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const savedUser = JSON.parse(localStorage.getItem("user"));

  if (!email || !password) {
    showMessage("Preencha todos os campos.");
    return;
  }

  if (!savedUser) {
    showMessage("Nenhum usuário cadastrado.");
    return;
  }

  if (email === savedUser.email && password === savedUser.password) {
    localStorage.setItem("loggedIn", "true");

    showMessage("Login realizado com sucesso!", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 700);
  } else {
    showMessage("Email ou senha inválidos.");
  }
}

// Carrega dados do usuário no dashboard
function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return;

  const userName = document.getElementById("userName");
  const userAvatar = document.getElementById("userAvatar");

  if (userName) {
    userName.textContent = user.name;
  }

  if (userAvatar) {
    userAvatar.textContent = user.name.charAt(0).toUpperCase();
  }
}

loadUserInfo();