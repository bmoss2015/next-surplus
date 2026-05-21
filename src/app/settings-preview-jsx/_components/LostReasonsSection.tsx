// Settings clone · Phase B — LostReasonsSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function LostReasonsSection() {
  return (
    <section id="panel-lost-reasons" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Leads</a><i className="icon icon-chevron-right" />
                    <span>Lost Reasons</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Lost Reasons</h1>
                      <p className="section-desc">
                        Options that appear in the Mark Lost dropdown on a lead.
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm"><i className="icon icon-plus" /> Add Reason</button>
                  </div>
      
                  <div className="list mt-6">
                    <div className="list-row">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium">Already Claimed</div>
                        <div className="text-[12px] text-2 mt-0.5">Default</div>
                      </div>
                    </div>
                    <div className="list-row">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium">Below Threshold</div>
                        <div className="text-[12px] text-2 mt-0.5">Default</div>
                      </div>
                    </div>
                    <div className="list-row">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium">No Contact After 5 Attempts</div>
                        <div className="text-[12px] text-2 mt-0.5">User Added</div>
                      </div>
                      <div className="overflow flex items-center gap-0.5 ml-2">
                        <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                      </div>
                    </div>
                    <div className="list-row">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium">Owner Deceased</div>
                        <div className="text-[12px] text-2 mt-0.5">Default</div>
                      </div>
                    </div>
                    <div className="list-row">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium">Statute Of Limitations</div>
                        <div className="text-[12px] text-2 mt-0.5">User Added</div>
                      </div>
                      <div className="overflow flex items-center gap-0.5 ml-2">
                        <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                      </div>
                    </div>
                  </div>
    </section>
  );
}
