const applyTheme = (theme) => {
  if (theme === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
};
const toggleTheme = () => {
  const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem('theme', newTheme);
  applyTheme(newTheme);
};
applyTheme(localStorage.getItem('theme') || 'light');
