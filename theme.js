function toggleTheme() {
  const body = document.body;

  body.classList.toggle("dark");

  const isDark = body.classList.contains("dark");

  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
}

loadTheme();

function toggleSidebar() {
  document.body.classList.toggle("sidebar-collapsed");
}