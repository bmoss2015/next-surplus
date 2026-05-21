// Settings clone · Phase B — PipelineSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function PipelineSection() {
  return (
    <section id="panel-pipeline" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Leads</a><i className="icon icon-chevron-right" />
                    <span>Pipeline &amp; Lost Reasons</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Pipeline &amp; Lost Reasons</h1>
                      <p className="section-desc">
                        How leads move through your pipeline and the reasons they can be marked Lost.
                      </p>
                    </div>
                  </div>
      
                  {/* Card 1: Needs Action threshold (modern card pattern, not row) */}
                  <div className="settings-card">
                    <div className="settings-card-head">
                      <div>
                        <div className="settings-card-eyebrow">Auto-Flag</div>
                        <div className="settings-card-title">Needs Action Threshold</div>
                        <div className="settings-card-desc">
                          Leads with no note, task, or stage change in this many days are automatically flagged Needs Action on the Daily Work board. Leave blank to disable.
                        </div>
                      </div>
                      <div className="settings-card-control">
                        <div className="field" style={{ width: "180px" }}>
                          <input className="input tabular has-suffix text-right" defaultValue="14" />
                          <span className="suffix">days</span>
                        </div>
                      </div>
                    </div>
                  </div>
      
                  {/* Card 2: Lost Reasons list */}
                  <div className="settings-card">
                    <div className="settings-card-head">
                      <div>
                        <div className="settings-card-eyebrow">Lost Reasons</div>
                        <div className="settings-card-title">Mark Lost Dropdown</div>
                        <div className="settings-card-desc">Options that appear when marking a lead Lost.</div>
                      </div>
                      <button className="btn btn-primary btn-sm"><i className="icon icon-plus" /> Add Reason</button>
                    </div>
                    <div className="list" style={{ border: "0", borderRadius: "0" }}>
                      <div className="list-row reason-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">Already Claimed</div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                      <div className="list-row reason-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">Below Threshold</div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                      <div className="list-row reason-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">No Contact After 5 Attempts</div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                      <div className="list-row reason-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">Owner Deceased</div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                      <div className="list-row reason-row">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium">Statute Of Limitations</div>
                        </div>
                        <div className="overflow flex items-center gap-0.5 ml-2">
                          <div className="icon-btn" title="Delete"><i className="icon icon-trash" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
    </section>
  );
}
