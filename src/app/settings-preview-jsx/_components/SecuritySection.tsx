// Settings clone · Phase B — SecuritySection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function SecuritySection() {
  return (
    <section id="panel-password" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Account</a><i className="icon icon-chevron-right" />
                    <span>Security</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Security</h1>
                      <p className="section-desc">
                        Update your password and turn on two-factor authentication.
                      </p>
                    </div>
                  </div>
      
                  <div className="pref-section-h">Password</div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Current Password</div>
                    </div>
                    <input className="input pref-row-input" type="password" id="pw-current" placeholder="••••••••" />
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">New Password</div>
                      <div className="pref-row-desc">At least 8 characters. Mix letters, numbers, and symbols.</div>
                    </div>
                    <input className="input pref-row-input" type="password" id="pw-new" minLength={8} placeholder="At least 8 characters" />
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Confirm New Password</div>
                    </div>
                    <input className="input pref-row-input" type="password" id="pw-confirm" minLength={8} placeholder="Re-enter new password" />
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Show Passwords</div>
                    </div>
                    <div className="toggle"></div>
                  </div>
      
                  <div className="pref-section-h">Two-Factor Authentication</div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Authenticator App</div>
                      <div className="pref-row-desc">Use 1Password, Authy, or Google Authenticator to generate a six-digit code each time you sign in.</div>
                    </div>
                    <button className="btn btn-outline btn-sm">Set Up</button>
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Recovery Codes</div>
                      <div className="pref-row-desc">One-time codes to sign in if you lose your authenticator. Available after you turn on 2FA.</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" disabled style={{ opacity: "0.5" }}>Generate Codes</button>
                  </div>
    </section>
  );
}
