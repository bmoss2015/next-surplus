// Settings clone · Phase B — NotificationsSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function NotificationsSection() {
  return (
    <section id="panel-notifications" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Account</a><i className="icon icon-chevron-right" />
                    <span>Notifications</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Notifications</h1>
                      <p className="section-desc">
                        Choose which events email you. We never email you about your own actions.
                      </p>
                    </div>
                  </div>
      
                  <div className="pref-section-h">Activity</div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Mentions</div>
                      <div className="pref-row-desc">When a teammate @mentions you in a note or comment.</div>
                    </div>
                    <div className="toggle on"></div>
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Lead Assigned To Me</div>
                      <div className="pref-row-desc">When someone assigns a lead to you, or you take ownership.</div>
                    </div>
                    <div className="toggle on"></div>
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Inbound Email Reply</div>
                      <div className="pref-row-desc">When a contact replies to a thread you own.</div>
                    </div>
                    <div className="toggle on"></div>
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Stage Changed On A Lead I Own</div>
                      <div className="pref-row-desc">When another teammate moves one of your leads to a new pipeline stage.</div>
                    </div>
                    <div className="toggle on"></div>
                  </div>
      
                  <div className="pref-section-h">Digests</div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Daily Tasks Due</div>
                      <div className="pref-row-desc">A morning summary of every task due in the next twenty-four hours.</div>
                    </div>
                    <div className="toggle"></div>
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Weekly Pipeline Summary</div>
                      <div className="pref-row-desc">A Monday-morning report of the team's pipeline movement over the past week.</div>
                    </div>
                    <div className="toggle"></div>
                  </div>
    </section>
  );
}
