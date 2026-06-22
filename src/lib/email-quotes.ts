// Strip the quoted prior message from a reply body so the conversation thread
// only shows what the sender actually typed. Handles the two most common
// patterns customers' email clients produce: the "On <date>, <name> wrote:"
// header that Gmail / Apple Mail prepend, and the "> " quote prefix that
// Outlook / Thunderbird / mutt use.
export function stripQuotedReply(body: string): string {
  let text = body.replace(/\r\n/g, "\n");

  const onWroteMatch = text.match(/^On .+ wrote:\s*$/m);
  if (onWroteMatch && onWroteMatch.index !== undefined) {
    text = text.slice(0, onWroteMatch.index);
  }

  const lines = text.split("\n");
  const trimmed: string[] = [];
  for (const line of lines) {
    const trimmedLine = line.trimStart();
    if (trimmedLine.startsWith(">")) continue;
    trimmed.push(line);
  }

  while (trimmed.length > 0 && trimmed[trimmed.length - 1].trim() === "") {
    trimmed.pop();
  }

  return trimmed.join("\n").trim();
}
