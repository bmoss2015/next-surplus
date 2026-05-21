// Settings clone · Phase B — AttorneysSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function AttorneysSection() {
  return (
    <section id="panel-attorneys" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Leads</a><i className="icon icon-chevron-right" />
                    <span>Attorneys</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Attorneys</h1>
                      <p className="section-desc">
                        Attorneys you assign to leads filing claims. Their default cost feeds into Est. Net To You.
                      </p>
                    </div>
                    <button className="btn btn-primary">
                      <i className="icon icon-plus" /> Add Attorney
                    </button>
                  </div>
      
                  <div className="stats-strip">
                    <div className="stat-cell">
                      <div className="label">Attorneys</div>
                      <div className="value" id="stat-attorneys">6</div>
                    </div>
                    <div className="stat-cell">
                      <div className="label">States Covered</div>
                      <div className="value value-em" id="stat-covered">50</div>
                    </div>
                    <div className="stat-cell">
                      <div className="label">Average Attorney Fee</div>
                      <div className="value" id="stat-avgfee">$1,600</div>
                    </div>
                    <div className="stat-cell">
                      <div className="label">States Not Covered</div>
                      <div className="value" id="stat-notcovered">0</div>
                    </div>
                  </div>
      
                  {/* Search / filter toolbar */}
                  <div className="flex items-center gap-2 mt-6 mb-4">
                    <label className="topbar-search attorney-search-wrap" style={{ height: "34px", flex: "1", maxWidth: "320px", minWidth: "0" }}>
                      <i className="icon icon-search" />
                      <input
                        type="search"
                        id="attorney-search"
                        placeholder="Search by name, email, phone, fee, or state"
                        className="attorney-search-input"
                        autoComplete="off"
                      />
                    </label>
                    <button className="btn btn-outline btn-sm">
                      <i className="icon icon-filter" /> State
                    </button>
                    <button className="btn btn-outline btn-sm">
                      <i className="icon icon-arrow-up-down" /> Sort
                    </button>
                  </div>
                  <div id="attorney-empty" className="attorney-empty" style={{ display: "none" }}>
                    No attorneys match <span id="attorney-empty-q"></span>
                  </div>
      
                  {/* ATTORNEYS LIST — single, scannable directory; click any row (or pencil) to edit */}
                  <div className="list attorney-list">
                    <div className="list-row attorney-row" data-search="jane daniels esq jane@danielslaw.com 901 555 0142 1500 1,500 tennessee kentucky mississippi tn ky ms">
                      <div className="avatar av-self">JD</div>
                      <div className="flex-1 min-w-0">
                        <div className="row-name text-[13.5px] font-medium">Jane Daniels, Esq.</div>
                        <div className="row-meta text-[12px] text-2 mt-0.5 tabular">jane@danielslaw.com · (901) 555-0142 · <span style={{ color: "var(--ink-2)", fontWeight: "500" }}>$1,500</span> per claim</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="chip">TN</span><span className="chip">KY</span><span className="chip">MS</span>
                      </div>
                      <div className="overflow flex items-center gap-0.5 ml-2">
                        <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                      </div>
                    </div>
      
                    <div className="list-row attorney-row" data-search="raymond patel p.c. pc ray@patel-pc.com 843 555 0177 1750 1,750 south carolina north carolina georgia tennessee sc nc ga tn">
                      <div className="avatar av-self">RP</div>
                      <div className="flex-1 min-w-0">
                        <div className="row-name text-[13.5px] font-medium">Raymond Patel, P.C.</div>
                        <div className="row-meta text-[12px] text-2 mt-0.5 tabular">ray@patel-pc.com · (843) 555-0177 · <span style={{ color: "var(--ink-2)", fontWeight: "500" }}>$1,750</span> per claim</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="chip">SC</span><span className="chip">NC</span><span className="chip">GA</span><span className="chip">TN</span>
                      </div>
                      <div className="overflow flex items-center gap-0.5 ml-2">
                        <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                      </div>
                    </div>
      
                    <div className="list-row attorney-row" data-search="sara kim esq sara@kimlegal.co 512 555 0198 1200 1,200 texas oklahoma tx ok">
                      <div className="avatar av-self">SK</div>
                      <div className="flex-1 min-w-0">
                        <div className="row-name text-[13.5px] font-medium">Sara Kim, Esq.</div>
                        <div className="row-meta text-[12px] text-2 mt-0.5 tabular">sara@kimlegal.co · (512) 555-0198 · <span style={{ color: "var(--ink-2)", fontWeight: "500" }}>$1,200</span> per claim</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="chip">TX</span><span className="chip">OK</span>
                      </div>
                      <div className="overflow flex items-center gap-0.5 ml-2">
                        <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                      </div>
                    </div>
      
                    <div className="list-row attorney-row" data-search="marcus nguyen esq marcus@ngn-legal.com 305 555 0163 1400 1,400 florida alabama fl al">
                      <div className="avatar av-self">MN</div>
                      <div className="flex-1 min-w-0">
                        <div className="row-name text-[13.5px] font-medium">Marcus Nguyen, Esq.</div>
                        <div className="row-meta text-[12px] text-2 mt-0.5 tabular">marcus@ngn-legal.com · (305) 555-0163 · <span style={{ color: "var(--ink-2)", fontWeight: "500" }}>$1,400</span> per claim</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="chip">FL</span><span className="chip">AL</span>
                      </div>
                      <div className="overflow flex items-center gap-0.5 ml-2">
                        <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                      </div>
                    </div>
      
                    {/* Example: attorney with many states — first 4 shown + "+N more" overflow chip */}
                    <div className="list-row attorney-row" data-search="maria lopez esq maria@lopezfirm.com 213 555 0119 1650 1,650 california nevada arizona oregon washington idaho utah colorado new mexico wyoming montana hawaii ca nv az or wa id ut co nm wy mt hi">
                      <div className="avatar av-self">ML</div>
                      <div className="flex-1 min-w-0">
                        <div className="row-name text-[13.5px] font-medium">Maria Lopez, Esq.</div>
                        <div className="row-meta text-[12px] text-2 mt-0.5 tabular">maria@lopezfirm.com · (213) 555-0119 · <span style={{ color: "var(--ink-2)", fontWeight: "500" }}>$1,650</span> per claim</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="chip">CA</span><span className="chip">NV</span><span className="chip">AZ</span><span className="chip">OR</span>
                        <span className="chip chip-more">+8 More</span>
                      </div>
                      <div className="overflow flex items-center gap-0.5 ml-2">
                        <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                      </div>
                    </div>
      
                    {/* Example: attorney with national coverage — single dark "All 50 States" chip */}
                    <div className="list-row attorney-row" data-search="david reyes esq david@reyes-national.com 646 555 0124 2100 2,100 all 50 states national united states">
                      <div className="avatar av-self">DR</div>
                      <div className="flex-1 min-w-0">
                        <div className="row-name text-[13.5px] font-medium">David Reyes, Esq.</div>
                        <div className="row-meta text-[12px] text-2 mt-0.5 tabular">david@reyes-national.com · (646) 555-0124 · <span style={{ color: "var(--ink-2)", fontWeight: "500" }}>$2,100</span> per claim</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="chip chip-all">All 50 States</span>
                      </div>
                      <div className="overflow flex items-center gap-0.5 ml-2">
                        <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                      </div>
                    </div>
                  </div>
    </section>
  );
}
