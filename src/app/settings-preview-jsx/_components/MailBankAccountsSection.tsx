// Settings clone · Phase B — MailBankAccountsSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function MailBankAccountsSection() {
  return (
    <section id="panel-mail-bank" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Mail</a><i className="icon icon-chevron-right" />
                    <span>Bank Accounts</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Bank Accounts</h1>
                      <p className="section-desc">
                        Verified accounts available to draw outgoing checks from. Routing and account numbers are stored only by Lob.
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm"><i className="icon icon-plus" /> Add Bank Account</button>
                  </div>
      
                  <div className="bank-grid">
                    <div className="bank-card">
                      <div className="bank-card-head">
                        <div>
                          <div className="bank-card-bank">Chase Business Checking</div>
                          <div className="bank-card-holder">Moss Equity Partners LLC</div>
                        </div>
                        <span className="role-tab" style={{ display: "inline-flex", background: "var(--brand)", color: "#fff", minWidth: "0" }}>VERIFIED</span>
                      </div>
                      <div className="bank-card-row"><span className="l">Account</span><span className="v">**** 4827</span></div>
                      <div className="bank-card-row"><span className="l">Routing</span><span className="v">**** 0021</span></div>
                      <div className="bank-card-row"><span className="l">Verified</span><span className="v">Mar 14, 2026</span></div>
                      <div className="bank-card-foot">
                        <span className="text-[11px] text-3">Default for outgoing checks</span>
                        <button className="icon-btn" title="Remove"><i className="icon icon-trash" /></button>
                      </div>
                    </div>
      
                    <div className="bank-card">
                      <div className="bank-card-head">
                        <div>
                          <div className="bank-card-bank">Bank Of America Reserve</div>
                          <div className="bank-card-holder">Moss Equity Partners LLC</div>
                        </div>
                        <span className="role-tab" style={{ display: "inline-flex", background: "transparent", color: "var(--brand)", border: "1px solid var(--brand)", minWidth: "0" }}>VERIFY</span>
                      </div>
                      <div className="bank-card-row"><span className="l">Account</span><span className="v">**** 9165</span></div>
                      <div className="bank-card-row"><span className="l">Routing</span><span className="v">**** 7491</span></div>
                      <div className="bank-card-row"><span className="l">Added</span><span className="v">May 18, 2026</span></div>
                      <div className="bank-card-foot">
                        <button className="btn btn-outline btn-sm">Enter Test Deposits</button>
                        <button className="icon-btn" title="Remove"><i className="icon icon-trash" /></button>
                      </div>
                    </div>
                  </div>
    </section>
  );
}
