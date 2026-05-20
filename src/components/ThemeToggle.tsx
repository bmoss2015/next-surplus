"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@tabler/icons-react";

// Light / dark theme toggle. Reads + writes localStorage and flips the
// data-theme attribute on <html>. A blocking inline script in layout.tsx
// applies the saved theme before React hydrates so reloads don't flash.

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  // Hydrate from the actual DOM attribute set by the inline script
  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  function flip() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={flip}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-ink"
    >
      {isDark ? <IconSun size={16} stroke={1.75} /> : <IconMoon size={16} stroke={1.75} />}
    </button>
  );
}
