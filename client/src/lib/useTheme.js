import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "light"
  );

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange(e) {
      const next = e.matches ? "dark" : "light";
      setTheme(next);
      document.documentElement.dataset.theme = next;
    }
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  return { theme, toggleTheme };
}
