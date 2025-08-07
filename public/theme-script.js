// This script runs before React hydration to prevent FOUC
(function() {
  try {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    // Fallback to light theme if localStorage is not available
    document.documentElement.classList.remove('dark');
  }
})();
