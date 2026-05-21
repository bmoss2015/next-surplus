// Settings clone · Phase B — ContactRolesSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function ContactRolesSection() {
  return (
    <section id="panel-contact-roles" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Leads</a><i className="icon icon-chevron-right" />
                    <span>Contact Roles</span>
                  </div>
                  <div className="page-head">
                    <div>
                      <h1 className="section-h1">Contact Roles</h1>
                      <p className="section-desc">
                        Custom labels for the extra people you track on a lead — anyone who isn't the owner or attorney. Use these for parties like servicers, process servers, title researchers, or anyone else specific to your workflow.
                      </p>
                    </div>
                  </div>
      
                  <div className="role-chip-grid">
                    <span className="role-chip">Mortgage Servicer<span className="role-chip-x" title="Delete">×</span></span>
                    <span className="role-chip">Process Server<span className="role-chip-x" title="Delete">×</span></span>
                    <span className="role-chip">Tax Sale Buyer<span className="role-chip-x" title="Delete">×</span></span>
                    <span className="role-chip">Title Researcher<span className="role-chip-x" title="Delete">×</span></span>
                    <span className="role-chip">Skip Tracer<span className="role-chip-x" title="Delete">×</span></span>
                    <span className="role-chip">County Auditor<span className="role-chip-x" title="Delete">×</span></span>
                    <button className="role-chip role-chip-add">+ Add Role</button>
                  </div>
    </section>
  );
}
