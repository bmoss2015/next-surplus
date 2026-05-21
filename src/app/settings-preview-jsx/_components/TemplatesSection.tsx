// Settings clone · Phase B — TemplatesSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function TemplatesSection() {
  return (
    <section id="panel-templates" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Templates</a><i className="icon icon-chevron-right" />
                    <span id="tpl-crumb">Email</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Templates</h1>
                      <p className="section-desc">
                        Reusable email bodies, SMS messages, and research checklists with merge fields.
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm"><i className="icon icon-plus" /> <span id="tpl-add-label">Add Email Template</span></button>
                  </div>
      
                  <div className="tpl-tabs">
                    <button className="tpl-tab active" data-tpl="email">Email<span className="tpl-tab-count">12</span></button>
                    <button className="tpl-tab" data-tpl="sms">SMS<span className="tpl-tab-count">8</span></button>
                    <button className="tpl-tab" data-tpl="research">Research<span className="tpl-tab-count">5</span></button>
                  </div>
      
                  {/* EMAIL TAB */}
                  <div className="tpl-pane active" data-tpl-pane="email">
                    <div className="list">
                      <div className="list-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">Initial Outreach — Tax Sale</div>
                          <div className="text-[12px] text-2 mt-0.5 tabular">Subject: Surplus funds may be owed to you · <span className="chip" style={{ fontSize: "10.5px" }}>TX</span></div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                      <div className="list-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">Follow Up — Day 7</div>
                          <div className="text-[12px] text-2 mt-0.5 tabular">Subject: Quick follow up on your surplus · <span className="chip" style={{ fontSize: "10.5px" }}>All</span></div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                      <div className="list-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">Attorney Engagement</div>
                          <div className="text-[12px] text-2 mt-0.5 tabular">Subject: Retainer agreement attached · <span className="chip" style={{ fontSize: "10.5px" }}>All</span></div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
      
                  {/* SMS TAB */}
                  <div className="tpl-pane" data-tpl-pane="sms">
                    <div className="list">
                      <div className="list-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">First Touch</div>
                          <div className="text-[12px] text-2 mt-0.5">"Hi {"{{first_name}}"}, this is Bree from Moss Equity. We found surplus funds tied to your old property — can we send details?" · <span className="chip" style={{ fontSize: "10.5px" }}>All</span></div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                      <div className="list-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">Voicemail Follow Up</div>
                          <div className="text-[12px] text-2 mt-0.5">"{"{{first_name}}"}, left you a voicemail about the surplus. Reply STOP to opt out. — Bree, Moss Equity" · <span className="chip" style={{ fontSize: "10.5px" }}>All</span></div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
      
                  {/* RESEARCH TAB */}
                  <div className="tpl-pane" data-tpl-pane="research">
                    <div className="list">
                      <div className="list-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">Texas Tax Sale Research</div>
                          <div className="text-[12px] text-2 mt-0.5 tabular">
                            <span className="chip" style={{ fontSize: "10.5px" }}>TX</span>
                            <span className="chip" style={{ fontSize: "10.5px" }}>Tax</span>
                            · 7 steps
                          </div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                      <div className="list-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">Florida Mortgage Foreclosure</div>
                          <div className="text-[12px] text-2 mt-0.5 tabular">
                            <span className="chip" style={{ fontSize: "10.5px" }}>FL</span>
                            <span className="chip" style={{ fontSize: "10.5px" }}>Mortgage</span>
                            · 9 steps
                          </div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                      <div className="list-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">Generic Heir Search</div>
                          <div className="text-[12px] text-2 mt-0.5 tabular">
                            <span className="chip" style={{ fontSize: "10.5px" }}>All</span>
                            · 5 steps
                          </div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
    </section>
  );
}
