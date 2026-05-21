// Notification preferences — single source of truth for the keys, groups,
// labels, descriptions, and default state. Lives outside "use server" so it
// can be imported by client components (Next.js server-action files only
// allow function exports, which is why `NOTIFICATION_PREFS` blew up when it
// lived in _notification-actions.ts).

export const NOTIFICATION_PREFS = [
  { key: "mentions",                  group: "activity", label: "Mentions",                       desc: "When a teammate @mentions you in a note or comment.",                            defaultOn: true  },
  { key: "lead_assigned",             group: "activity", label: "Lead Assigned To Me",            desc: "When someone assigns a lead to you, or you take ownership.",                      defaultOn: true  },
  { key: "inbound_email_reply",       group: "activity", label: "Inbound Email Reply",            desc: "When a contact replies to a thread you own.",                                     defaultOn: true  },
  { key: "stage_changed_on_my_lead",  group: "activity", label: "Stage Changed On A Lead I Own",  desc: "When another teammate moves one of your leads to a new pipeline stage.",         defaultOn: true  },
  { key: "daily_tasks_due",           group: "digest",   label: "Daily Tasks Due",                desc: "A morning summary of every task due in the next twenty-four hours.",              defaultOn: false },
  { key: "weekly_pipeline_summary",   group: "digest",   label: "Weekly Pipeline Summary",        desc: "A Monday-morning report of the team's pipeline movement over the past week.",     defaultOn: false },
] as const;

export type NotificationPrefKey = (typeof NOTIFICATION_PREFS)[number]["key"];
