// Settings clone · Phase B — BillingSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function BillingSection() {
  return (
    <section id="panel-billing" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Workspace</a><i className="icon icon-chevron-right" />
                    <span>Billing</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Billing</h1>
                      <p className="section-desc">
                        Your plan, add-ons, payment method, and invoice history.
                      </p>
                    </div>
                  </div>
      
                  {/* Plan hero — one clear card, no competing stat tiles */}
                  <div className="plan-hero">
                    <div className="plan-hero-left">
                      <div className="plan-hero-eyebrow">Current Plan</div>
                      <div className="plan-hero-name">Team</div>
                      <div className="plan-hero-line">Unlimited leads · 10 seats · all features included</div>
                    </div>
                    <div className="plan-hero-right">
                      <div className="plan-hero-price">$197<span className="plan-hero-price-suffix">/mo</span></div>
                      <div className="plan-hero-next">Next charge Jun 12, 2026</div>
                      <button className="btn btn-outline btn-sm mt-2">Change Plan</button>
                    </div>
                  </div>
      
                  <div className="pref-section-h">Add-Ons · Usage This Month</div>
      
                  {/* Phone Validation usage meter — real functionality from BillingSection.tsx + BackfillButton */}
                  <div className="addon-meter">
                    <div className="addon-meter-head">
                      <div className="flex-1 min-w-0">
                        <div className="addon-meter-title">Phone Validation</div>
                        <div className="addon-meter-desc">Pre-screens imported and manually added numbers via Veriphone so dead lines stop reaching the call queue.</div>
                      </div>
                      <div className="addon-meter-counts">
                        <div className="addon-meter-num"><span className="tabular">247</span> / <span className="tabular">1,000</span></div>
                        <div className="addon-meter-lab">25% Used</div>
                      </div>
                    </div>
                    <div className="addon-meter-bar">
                      <div className="addon-meter-bar-fill" style={{ width: "25%" }}></div>
                    </div>
                    <div className="addon-meter-foot">Resets June 1, 2026 · Free tier (1,000 / month)</div>
                    <div className="addon-meter-action">
                      <button className="btn btn-outline btn-sm">Run Backfill</button>
                      <span className="addon-meter-action-hint">Validates every untested phone on non-lost leads in the background.</span>
                    </div>
                  </div>
      
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Skip Tracing Credits</div>
                      <div className="pref-row-desc">Pull current address, phone, and relatives on any lead.</div>
                    </div>
                    <span className="addon-pending">Coming Soon</span>
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Bulk Mail Discount</div>
                      <div className="pref-row-desc">Drops Click2Mail rates on letters and certified mail at high volume.</div>
                    </div>
                    <span className="addon-pending">Coming Soon</span>
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Priority Support</div>
                      <div className="pref-row-desc">Direct Slack channel with our team. Same-day response on weekdays.</div>
                    </div>
                    <span className="addon-pending">Coming Soon</span>
                  </div>
      
                  <div className="pref-section-h">Payment Method</div>
                  <div className="pref-row">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="card-brand">VISA</div>
                      <div>
                        <div className="pref-row-title">Visa ending in 4242</div>
                        <div className="pref-row-desc">Expires 09 / 2027 · Bree Moss</div>
                      </div>
                    </div>
                    <button className="btn btn-outline btn-sm">Update Card</button>
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Send Invoices To</div>
                      <div className="pref-row-desc">Receipts and renewal notices go here.</div>
                    </div>
                    <input className="input pref-row-input" type="email" defaultValue="info@mossyland.com" />
                  </div>
      
                  <div className="pref-section-h">Invoice History</div>
                  <table className="inv-table">
                    <thead>
                      <tr><th>Period</th><th>Invoice</th><th>Status</th><th className="num">Amount</th><th></th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>May 2026</td>
                        <td className="mono">INV-2026-05</td>
                        <td><span className="cov-status hot"><span className="dot"></span>Paid May 12</span></td>
                        <td className="num">$197.00</td>
                        <td className="action"><button className="icon-btn" title="Download PDF"><i className="icon icon-download" /></button></td>
                      </tr>
                      <tr>
                        <td>April 2026</td>
                        <td className="mono">INV-2026-04</td>
                        <td><span className="cov-status hot"><span className="dot"></span>Paid Apr 12</span></td>
                        <td className="num">$197.00</td>
                        <td className="action"><button className="icon-btn" title="Download PDF"><i className="icon icon-download" /></button></td>
                      </tr>
                      <tr>
                        <td>March 2026</td>
                        <td className="mono">INV-2026-03</td>
                        <td><span className="cov-status hot"><span className="dot"></span>Paid Mar 12</span></td>
                        <td className="num">$197.00</td>
                        <td className="action"><button className="icon-btn" title="Download PDF"><i className="icon icon-download" /></button></td>
                      </tr>
                    </tbody>
                  </table>
    </section>
  );
}
