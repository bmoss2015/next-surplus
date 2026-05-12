import { redirect } from "next/navigation";

// Fix P: Kanban is now the default Leads view, served at /leads. This old
// path just forwards there so existing links keep working.
export default function KanbanRedirect() {
  redirect("/leads");
}
