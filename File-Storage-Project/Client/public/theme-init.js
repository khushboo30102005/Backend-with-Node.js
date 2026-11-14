// Applies the saved theme before first paint, so the page never flashes the
// wrong colours. Loaded as a classic blocking <script src> from index.html
// (it used to be inline, which forced 'unsafe-inline' into the CSP; M9).
try {
  // Stored value is 'light' | 'dark' | (absent = follow system).
  var p = localStorage.getItem('theme');
  var t =
    p === 'light' || p === 'dark'
      ? p
      : matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
