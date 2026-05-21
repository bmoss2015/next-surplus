// Settings clone · Phase B — TeamSection.
//
// Mechanically converted from src/data/settings-mockup.html via
// scripts/convert-mockup-panels.js. Re-run the script to regenerate.
// Static visual JSX only — handlers and data wiring come in later phases.
/* eslint-disable react/no-unknown-property, react/jsx-no-comment-textnodes, jsx-a11y/anchor-is-valid */

export function TeamSection() {
  return (
    <section id="panel-team" className="panel active">
      <div className="breadcrumb">
                    <a>Settings</a><i className="icon icon-chevron-right" />
                    <a>Organization</a><i className="icon icon-chevron-right" />
                    <span>Team</span>
                  </div>
      
                  <div className="hero-dark">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="hero-eyebrow">Your Team</div>
                        <div className="hero-title">Moss Equity Partners</div>
                      </div>
                      <button className="btn btn-light">
                        <i className="icon icon-user-plus" /> Invite Member
                      </button>
                    </div>
                    <div className="hero-stats">
                      <div className="hero-stat">
                        <div className="num">4</div>
                        <div className="lab">Members</div>
                      </div>
                      <div className="hero-stat">
                        <div className="num">3</div>
                        <div className="lab">Active</div>
                      </div>
                      <div className="hero-stat">
                        <div className="num">1</div>
                        <div className="lab">Pending</div>
                      </div>
                      <div className="hero-stat">
                        <div className="num">1</div>
                        <div className="lab">Admin</div>
                      </div>
                    </div>
                  </div>
      
                  <div className="group-h">Members</div>
      
                  {/* group header used by "grouped" style only */}
                  <div className="role-group-h">Admins</div>
      
                  <div className="list members-list" data-role-style="ribbon" data-tab-scheme="ink">
                    <div className="list-row" data-role="admin">
                      <div className="avatar av-self av-fill">BM</div>
                      <div className="flex-1 min-w-0">
                        <div className="row-name text-[13.5px] font-medium">Bree Moss</div>
                        <div className="row-meta text-[12px] text-2 mt-0.5 tabular">
                          <span className="meta-default">info@mossyland.com · Joined Aug 2024</span>
                          <span className="meta-trailing">info@mossyland.com<span className="role-trailing admin"> · Admin</span> · Joined Aug 2024</span>
                          <span className="meta-permissions">Manages settings · invites teammates · deletes records</span>
                        </div>
                      </div>
                      <span className="role-pill pill pill-brand">Admin</span>
                      <span className="role-text admin">Admin</span>
                      <span className="role-wordmark admin">Admin</span>
                      <span className="role-tab">ADMIN</span>
                      <div className="overflow"><div className="icon-btn"><i className="icon icon-more-horizontal" /></div></div>
                    </div>
      
                    {/* group header used by "grouped" style only */}
                    <div className="role-group-h">Members</div>
      
                    <div className="list-row" data-role="member">
                      <div className="avatar av-1 av-fill">JT</div>
                      <div className="flex-1 min-w-0">
                        <div className="row-name text-[13.5px] font-medium">James Taylor</div>
                        <div className="row-meta text-[12px] text-2 mt-0.5 tabular">
                          <span className="meta-default">james@mossequitypartners.com · Joined Sep 2024</span>
                          <span className="meta-trailing">james@mossequitypartners.com<span className="role-trailing"> · Member</span> · Joined Sep 2024</span>
                          <span className="meta-permissions">Views & edits leads · tasks · contacts · documents · imports</span>
                        </div>
                      </div>
                      <span className="role-pill pill">Member</span>
                      <span className="role-text">Member</span>
                      <span className="role-wordmark">Member</span>
                      <span className="role-tab">MEMBER</span>
                      <div className="overflow"><div className="icon-btn"><i className="icon icon-more-horizontal" /></div></div>
                    </div>
      
                    <div className="list-row" data-role="member">
                      <div className="avatar av-2 av-fill">DR</div>
                      <div className="flex-1 min-w-0">
                        <div className="row-name text-[13.5px] font-medium">Diana Reyes</div>
                        <div className="row-meta text-[12px] text-2 mt-0.5 tabular">
                          <span className="meta-default">diana@mossequitypartners.com · Joined Jan 2025</span>
                          <span className="meta-trailing">diana@mossequitypartners.com<span className="role-trailing"> · Member</span> · Joined Jan 2025</span>
                          <span className="meta-permissions">Views & edits leads · tasks · contacts · documents · imports</span>
                        </div>
                      </div>
                      <span className="role-pill pill">Member</span>
                      <span className="role-text">Member</span>
                      <span className="role-wordmark">Member</span>
                      <span className="role-tab">MEMBER</span>
                      <div className="overflow"><div className="icon-btn"><i className="icon icon-more-horizontal" /></div></div>
                    </div>
      
                    <div className="list-row" data-role="pending">
                      <div className="avatar av-5 av-fill">AK</div>
                      <div className="flex-1 min-w-0">
                        <div className="row-name text-[13.5px] font-medium">Alex Kim</div>
                        <div className="row-meta text-[12px] text-2 mt-0.5 tabular">alex@mossequitypartners.com · Invited yesterday</div>
                      </div>
                      <span className="role-tab">PENDING</span>
                      <div className="overflow"><div className="icon-btn"><i className="icon icon-more-horizontal" /></div></div>
                    </div>
                  </div>
    </section>
  );
}
