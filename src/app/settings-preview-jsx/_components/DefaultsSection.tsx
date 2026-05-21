// Settings clone · Phase B — DefaultsSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function DefaultsSection() {
  return (
    <section id="panel-defaults" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Leads</a><i className="icon icon-chevron-right" />
                    <span>Defaults</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Defaults</h1>
                      <p className="section-desc">
                        Starting values applied to every new lead. Each lead can override these individually.
                      </p>
                    </div>
                  </div>
      
                  {/* Live example as a colorful brand-gradient hero — same energy as Billing */}
                  <div className="calc-hero">
                    <div className="calc-hero-eyebrow">Live Example · $50,000 Surplus</div>
                    <div className="calc-hero-flow">
                      <div className="calc-hero-step">
                        <div className="calc-hero-step-label">Estimated Surplus</div>
                        <div className="calc-hero-step-val">$50,000</div>
                      </div>
                      <div className="calc-hero-arrow">→</div>
                      <div className="calc-hero-step">
                        <div className="calc-hero-step-label">Recovery Fee (<span id="c-fee">33</span>%)</div>
                        <div className="calc-hero-step-val">$<span id="c-fee-amt">16,500</span></div>
                      </div>
                      <div className="calc-hero-arrow">−</div>
                      <div className="calc-hero-step">
                        <div className="calc-hero-step-label">Attorney Fee</div>
                        <div className="calc-hero-step-val">$<span id="c-att">1,500</span></div>
                      </div>
                      <div className="calc-hero-arrow">=</div>
                      <div className="calc-hero-step calc-hero-step-total">
                        <div className="calc-hero-step-label">Estimated Net</div>
                        <div className="calc-hero-step-val">$<span id="c-net">15,000</span></div>
                      </div>
                    </div>
                  </div>
      
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Default Recovery Fee</div>
                      <div className="pref-row-desc">Percentage of the estimated surplus you charge as the recovery fee on a new lead.</div>
                    </div>
                    <div className="field" style={{ width: "160px" }}>
                      <input className="input tabular has-suffix text-right" defaultValue="33" id="d-fee" />
                      <span className="suffix">%</span>
                    </div>
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Default Attorney Fee</div>
                      <div className="pref-row-desc">Subtracted from the recovery fee when computing Estimated Net.</div>
                    </div>
                    <div className="field" style={{ width: "160px" }}>
                      <span className="prefix">$</span>
                      <input className="input tabular has-prefix text-right" defaultValue="1,500" id="d-att" />
                    </div>
                  </div>
                  <div className="pref-row">
                    <div className="flex-1 min-w-0">
                      <div className="pref-row-title">Minimum Surplus Threshold</div>
                      <div className="pref-row-desc">Leads with an estimated surplus under this amount are tagged Below Minimum. Soft warning only — you can still pursue them.</div>
                    </div>
                    <div className="field" style={{ width: "160px" }}>
                      <span className="prefix">$</span>
                      <input className="input tabular has-prefix text-right" defaultValue="10,000" />
                    </div>
                  </div>
    </section>
  );
}
