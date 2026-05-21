// Settings clone · Phase B — EmailTemplatesSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function EmailTemplatesSection() {
  return (
    <section id="panel-email-templates" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Templates</a><i className="icon icon-chevron-right" />
                    <span>Email</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Email Templates</h1>
                      <p className="section-desc">
                        Reusable email bodies with merge fields. Available in the lead composer.
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm"><i className="icon icon-plus" /> Add Template</button>
                  </div>
      
                  <div className="list mt-6">
                    <div className="list-row">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium">Initial Outreach — Tax Sale</div>
                        <div className="text-[12px] text-2 mt-0.5 tabular">Subject: Surplus funds may be owed to you · TX</div>
                      </div>
                      <div className="overflow flex items-center gap-0.5 ml-2">
                        <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                        <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                      </div>
                    </div>
                    <div className="list-row">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium">Follow Up — Day 7</div>
                        <div className="text-[12px] text-2 mt-0.5 tabular">Subject: Quick follow up on your surplus · All states</div>
                      </div>
                      <div className="overflow flex items-center gap-0.5 ml-2">
                        <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                        <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                      </div>
                    </div>
                    <div className="list-row">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium">Attorney Engagement</div>
                        <div className="text-[12px] text-2 mt-0.5 tabular">Subject: Retainer agreement attached · All states</div>
                      </div>
                      <div className="overflow flex items-center gap-0.5 ml-2">
                        <div className="icon-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                        <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                      </div>
                    </div>
                  </div>
    </section>
  );
}
