#!/usr/bin/env node
/**
 * Production-запуск с минимальным баннером
 */

const c = { reset: "\x1b[0m", bright: "\x1b[1m", dim: "\x1b[2m", green: "\x1b[32m", cyan: "\x1b[36m" };
const pad = (s, n = 2) => String(s).padStart(n, "0");
const time = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

console.log(`\n  ${c.cyan}${c.bright}Sensify${c.reset} ${c.dim}— production · ${time()}${c.reset}\n`);

const { spawn } = await import("child_process");
const proc = spawn("npx", ["next", "start"], { stdio: "inherit", shell: true });
proc.on("close", (code) => code !== 0 && code != null && process.exit(code));
