// Settings clone · Phase B — CompanyProfileSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function CompanyProfileSection() {
  return (
    <section id="panel-company" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Workspace</a><i className="icon icon-chevron-right" />
                    <span>Company Profile</span>
                  </div>
      
                  {/* Hero with logo upload */}
                  <div className="clean-hero">
                    <div className="clean-hero-avatar" style={{ fontSize: "14px", letterSpacing: "0.04em" }}>ME</div>
                    <div className="flex-1 min-w-0">
                      <div className="clean-hero-title">Moss Equity Partners LLC</div>
                      <div className="clean-hero-meta">Workspace · Dallas, TX</div>
                    </div>
                    <button className="btn btn-ghost btn-sm clean-hero-upload">Upload Logo</button>
                  </div>
      
                  <div className="pref-section-h">Identity</div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Legal Name</div>
                      <div className="pref-row-desc">Your registered entity. Appears on contracts and official mail.</div>
                    </div>
                    <input className="input pref-row-input" defaultValue="Moss Equity Partners LLC" />
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Display Name</div>
                      <div className="pref-row-desc">The brand name shown on letters and emails.</div>
                    </div>
                    <input className="input pref-row-input" defaultValue="Moss Equity" />
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Tax ID (EIN)</div>
                      <div className="pref-row-desc">Used on 1099s and tax documents issued from the portal.</div>
                    </div>
                    <input className="input pref-row-input" placeholder="00-0000000" />
                  </div>
      
                  <div className="pref-section-h">Contact</div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Email</div>
                    </div>
                    <input className="input pref-row-input" type="email" defaultValue="info@mossyland.com" />
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Phone</div>
                    </div>
                    <input className="input pref-row-input" type="tel" defaultValue="(214) 555-0190" />
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Website</div>
                    </div>
                    <input className="input pref-row-input" type="url" defaultValue="https://mossequitypartners.com" />
                  </div>
      
                  <div className="pref-section-h">Mailing Address</div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Address Line 1</div>
                    </div>
                    <input className="input pref-row-input" defaultValue="1234 Pine Street" />
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Address Line 2</div>
                    </div>
                    <input className="input pref-row-input" placeholder="Suite, floor, or unit (optional)" />
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">City, State, Postal Code</div>
                    </div>
                    <div className="flex items-center gap-2 pref-row-input" style={{ width: "320px" }}>
                      <input className="input" defaultValue="Dallas" style={{ flex: "1", minWidth: "0" }} />
                      <input className="input" defaultValue="TX" maxLength={2} style={{ width: "60px" }} />
                      <input className="input" defaultValue="75201" style={{ width: "90px" }} />
                    </div>
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Country</div>
                    </div>
                    <input className="input pref-row-input" defaultValue="United States" />
                  </div>
    </section>
  );
}
