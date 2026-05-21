// Settings clone · Phase C.3 — Contact Roles wired to real data (display).
//
// Reads the org's custom contact-role labels (fetchOrgCustomRoles) and
// renders them as the mockup's role-chip grid. The remove (×) and add chip
// are visual-only — the underlying lead_parties rows are touched from
// inside lead detail, not here. Phase D will add a delete action keyed by
// label.

export function ContactRolesSection({
  initial,
}: {
  initial: string[];
}) {
  return (
    <section id="panel-contact-roles" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Leads</a>
        <i className="icon icon-chevron-right" />
        <span>Contact Roles</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Contact Roles</h1>
          <p className="section-desc">
            Custom labels for the extra people you track on a lead — anyone
            who isn&apos;t the owner or attorney. Use these for parties like
            servicers, process servers, title researchers, or anyone else
            specific to your workflow.
          </p>
        </div>
      </div>

      <div className="role-chip-grid">
        {initial.length === 0 ? (
          <span style={{ color: "var(--text-3)", fontSize: 13 }}>
            No custom roles yet. Add one from any lead&apos;s Contacts panel.
          </span>
        ) : (
          initial.map((label) => (
            <span key={label} className="role-chip">
              {label}
              <span
                className="role-chip-x"
                title="Remove (coming in Phase D)"
                style={{ pointerEvents: "none", opacity: 0.5 }}
              >
                ×
              </span>
            </span>
          ))
        )}
        <button
          type="button"
          className="role-chip role-chip-add"
          title="Add roles from inside a lead's Contacts panel"
          disabled
        >
          + Add Role
        </button>
      </div>
    </section>
  );
}
