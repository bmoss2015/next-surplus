"use client";

type Check = { ok: boolean; label: string };

export function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function passwordMeetsRequirements(password: string): boolean {
  return Object.values(passwordChecks(password)).every(Boolean);
}

export function PasswordRequirements({ password }: { password: string }) {
  const c = passwordChecks(password);
  const items: Check[] = [
    { ok: c.length, label: "8 characters" },
    { ok: c.upper, label: "Uppercase" },
    { ok: c.digit, label: "Number" },
    { ok: c.special, label: "Special" },
  ];
  return (
    <div className="mt-1 grid grid-cols-4 gap-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div
            className={`h-[3px] rounded-full ${
              item.ok ? "bg-[#13644e]" : "bg-[#e5e7eb]"
            }`}
          />
          <span
            className={`text-[10px] ${
              item.ok ? "text-[#04261c]" : "text-[#9ca3af]"
            }`}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
