// Settings clone · Phase B.3 — Profile panel (real JSX, static).
//
// Lifts the mockup's <section id="panel-profile">…</section> markup verbatim
// into JSX. defaultValue stands in for the mockup's `value=` attributes —
// the inputs are uncontrolled here, intentionally. The onInput=markDirty
// handler is omitted (no save pill yet). Phase B.X+ will wire this to
// useSavePill + updateMyProfile.

export function ProfileSection() {
  return (
    <section id="panel-profile" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Account</a>
        <i className="icon icon-chevron-right" />
        <span className="text-ink-2">Profile</span>
      </div>

      <div className="clean-hero">
        <div className="clean-hero-avatar">BM</div>
        <div className="flex-1 min-w-0">
          <div className="clean-hero-title">Bree Moss</div>
          <div className="clean-hero-meta">info@mossyland.com · Admin</div>
        </div>
        <button className="btn btn-ghost btn-sm clean-hero-upload">
          Upload Photo
        </button>
      </div>

      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">First Name</div>
        </div>
        <input
          className="input pref-row-input"
          defaultValue="Bree"
        />
      </div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Last Name</div>
        </div>
        <input
          className="input pref-row-input"
          defaultValue="Moss"
        />
      </div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Email</div>
          <div className="pref-row-desc">
            Used for sign-in and mention notifications.
          </div>
        </div>
        <input
          className="input pref-row-input"
          type="email"
          defaultValue="info@mossyland.com"
        />
      </div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Time Zone</div>
          <div className="pref-row-desc">
            Used for due-date display and daily digest delivery time.
          </div>
        </div>
        <select className="input pref-row-input" defaultValue="central">
          <option value="central">(GMT-06:00) Central Time — Chicago</option>
          <option value="eastern">(GMT-05:00) Eastern Time — New York</option>
          <option value="mountain">(GMT-07:00) Mountain Time — Denver</option>
          <option value="pacific">(GMT-08:00) Pacific Time — Los Angeles</option>
        </select>
      </div>
    </section>
  );
}
