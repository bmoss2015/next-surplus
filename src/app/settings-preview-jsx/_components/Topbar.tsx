// Settings clone · Phase B.3 — top bar.
//
// Lifts the mockup's <div class="topbar">…</div> markup verbatim into JSX.
// Static for now: the top nav links are non-functional placeholders matching
// the mockup, and the search box is a non-interactive visual. Phase B.X+
// will wire these to the real portal navigation.

export function Topbar() {
  return (
    <div className="topbar sticky top-0 z-30 flex items-center justify-between px-8 h-14">
      <div className="flex items-center gap-8">
        <span className="brand-mark">Moss Equity</span>
        <nav className="nav-top flex items-center gap-0.5">
          <a>Leads</a>
          <a>Tasks</a>
          <a>Inbox</a>
          <a>Mail</a>
          <a>Reports</a>
          <a className="active">Settings</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="topbar-search">
          <i className="icon icon-search" />
          <span>Search settings</span>
          <span className="flex items-center gap-1 ml-auto">
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </span>
        </div>
        <div className="avatar av-self">BM</div>
      </div>
    </div>
  );
}
