// Settings clone · Phase B — EmailAccountsSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function EmailAccountsSection() {
  return (
    <section id="panel-email-accounts" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Account</a><i className="icon icon-chevron-right" />
                    <span>Email Accounts</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Email Accounts</h1>
                      <p className="section-desc">
                        Connect Gmail so the portal can read and send email from this inbox.
                      </p>
                    </div>
                  </div>
      
                  {/* Connected account header — minimal, white, hairline divider */}
                  <div className="inbox-head">
                    <div className="inbox-avatar">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="5" width="18" height="14" rx="2"/>
                        <path d="m3 7 9 6 9-6"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="inbox-email">info@mossyland.com</div>
                      <div className="inbox-status">
                        <span className="inbox-status-pulse"></span>
                        Active · synced 2 minutes ago
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm inbox-disconnect">Disconnect</button>
                  </div>
      
                  {/* Settings list — one row per setting, hairline dividers, no nested cards */}
                  <div className="inbox-prefs">
                    <div className="inbox-pref">
                      <div>
                        <div className="inbox-pref-title">Sync read status to Gmail</div>
                        <div className="inbox-pref-desc">When you mark an email read here, also clear the unread label in Gmail.</div>
                      </div>
                      <div className="toggle on"></div>
                    </div>
                    <div className="inbox-pref">
                      <div>
                        <div className="inbox-pref-title">Send from this address</div>
                        <div className="inbox-pref-desc">Use this inbox as the default sender when composing email from a lead.</div>
                      </div>
                      <div className="toggle on"></div>
                    </div>
                    <div className="inbox-pref">
                      <div>
                        <div className="inbox-pref-title">Auto-archive sent mail</div>
                        <div className="inbox-pref-desc">Strip the inbox label from emails sent through the portal.</div>
                      </div>
                      <div className="toggle"></div>
                    </div>
                    <div className="inbox-pref">
                      <div>
                        <div className="inbox-pref-title">Daily digest</div>
                        <div className="inbox-pref-desc">Get a 9 a.m. summary of new threads and unread mail.</div>
                      </div>
                      <div className="toggle"></div>
                    </div>
                  </div>
      
                  <button className="inbox-add">+ Connect another inbox</button>
    </section>
  );
}
