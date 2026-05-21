// Settings clone · Phase B — MailSettingsSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function MailSettingsSection() {
  return (
    <section id="panel-mail-settings" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Mail</a><i className="icon icon-chevron-right" />
                    <span>Configuration</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Mail Configuration</h1>
                      <p className="section-desc">
                        Signer, signature, and default postal class applied to every outgoing letter.
                      </p>
                    </div>
                  </div>
      
                  {/* Signature preview hero — visual focal point */}
                  <div className="sig-hero">
                    <div className="sig-hero-paper">
                      <div className="sig-hero-image">
                        <span style={{ fontFamily: "'Brush Script MT', cursive", fontSize: "40px", color: "var(--ink)", transform: "rotate(-3deg)", display: "inline-block" }}>Bree Moss</span>
                      </div>
                      <div className="sig-hero-name">Bree Moss</div>
                      <div className="sig-hero-title">Managing Partner · Moss Equity</div>
                    </div>
                    <div className="sig-hero-actions">
                      <div className="sig-hero-eyebrow">Signature Preview</div>
                      <div className="sig-hero-caption">Inserted into the signature block of every outgoing letter, wherever your template's <code>{"{{signature}}"}</code> merge field appears.</div>
                      <div className="flex items-center gap-2 mt-3">
                        <button className="btn btn-outline btn-sm">Replace Image</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }}>Remove</button>
                      </div>
                    </div>
                  </div>
      
                  <div className="pref-section-h">Signer</div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Signer Name</div>
                      <div className="pref-row-desc">Available in every letter template as the <code>{"{{signer_name}}"}</code> merge field.</div>
                    </div>
                    <input className="input pref-row-input" defaultValue="Bree Moss" />
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Signer Title</div>
                      <div className="pref-row-desc">Available as the <code>{"{{signer_title}}"}</code> merge field. Leave blank to omit.</div>
                    </div>
                    <input className="input pref-row-input" defaultValue="Managing Partner" />
                  </div>
      
                  <div className="pref-section-h">Default Mail Class</div>
                  <div style={{ padding: "18px 0", borderBottom: "1px solid var(--hairline)" }}>
                    <div className="mail-class-grid">
                      <label className="mail-class-card">
                        <input type="radio" name="mail-class" defaultValue="standard" />
                        <div className="mail-class-label">Standard</div>
                        <div className="mail-class-desc">Cheapest · 3–10 days · basic tracking</div>
                      </label>
                      <label className="mail-class-card selected">
                        <input type="radio" name="mail-class" defaultValue="first_class" checked />
                        <div className="mail-class-label">First Class</div>
                        <div className="mail-class-desc">1–5 days · USPS tracking</div>
                      </label>
                      <label className="mail-class-card">
                        <input type="radio" name="mail-class" defaultValue="certified" />
                        <div className="mail-class-label">Certified</div>
                        <div className="mail-class-desc">Tracked · proof of receipt</div>
                      </label>
                    </div>
                  </div>
    </section>
  );
}
