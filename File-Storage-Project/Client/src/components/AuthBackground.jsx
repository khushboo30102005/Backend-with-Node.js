// Decorative, theme-aware backdrop for Login, Register and the Users dashboard.
// Pure CSS (see ".app-bg" in index.css): soft drifting colour orbs, a faint
// masked grid and a vignette. It is fixed behind the page, ignores pointer
// events, and is hidden from assistive tech.
function AuthBackground({ children }) {
  return (
    <div className="relative isolate flow-root min-h-dvh">
      <div className="app-bg" aria-hidden="true">
        <span className="app-bg-orb app-bg-orb-a" />
        <span className="app-bg-orb app-bg-orb-b" />
        <span className="app-bg-orb app-bg-orb-c" />
        <span className="app-bg-grid" />
        <span className="app-bg-vignette" />
      </div>
      {children}
    </div>
  );
}

export default AuthBackground;