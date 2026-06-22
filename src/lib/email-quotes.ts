// Strip the quoted prior message from a reply body so the conversation thread
// only shows what the sender actually typed. Handles three patterns email
// clients produce when quoting a previous message:
//   1. Gmail / Apple Mail: `On <date>, <Name> <email@x> wrote:` (often wraps
//      across two or three lines when the sender block is long).
//   2. Outlook English: `From: <sender>\nSent: <date>\nTo: ...\nSubject: ...`
//   3. `> ` quote prefix lines used by Outlook plain text, Thunderbird, mutt.
export function stripQuotedReply(body: string): string {
  const text = body.replace(/\r\n/g, "\n");

  const lines = text.split("\n");

  // 1. Find an "On ..." line that leads (within a few lines) to "wrote:" and
  //    cut from there. Gmail commonly produces:
  //      On Mon, Jun 22, 2026 at 11:09 AM Next Surplus <noreply@nextsurplus.com>
  //      wrote:
  //    so the "wrote:" can be 1-3 lines below the "On".
  let cutIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*On\s/.test(lines[i])) continue;
    const lookahead = Math.min(i + 5, lines.length);
    for (let j = i; j < lookahead; j++) {
      if (/wrote:\s*$/.test(lines[j])) {
        cutIndex = i;
        break;
      }
    }
    if (cutIndex >= 0) break;
  }

  // 2. Outlook-style headers (`From:` line typically followed by `Sent:` /
  //    `To:` / `Subject:`). Same heuristic: find a `From:` at start of line
  //    that's followed by `Sent:` or `Date:` within the next few lines.
  if (cutIndex < 0) {
    for (let i = 0; i < lines.length; i++) {
      if (!/^\s*From:\s/.test(lines[i])) continue;
      const lookahead = Math.min(i + 4, lines.length);
      for (let j = i + 1; j < lookahead; j++) {
        if (/^\s*(Sent|Date|To|Subject):\s/.test(lines[j])) {
          cutIndex = i;
          break;
        }
      }
      if (cutIndex >= 0) break;
    }
  }

  let kept = cutIndex >= 0 ? lines.slice(0, cutIndex) : lines;

  // 3. Strip every `> ` (or `>`) prefixed line. Catches Outlook-plain,
  //    Thunderbird, mutt, etc.
  kept = kept.filter((line) => !line.trimStart().startsWith(">"));

  // Trim trailing empty lines left over from the cut.
  while (kept.length > 0 && kept[kept.length - 1].trim() === "") {
    kept.pop();
  }

  return kept.join("\n").trim();
}
