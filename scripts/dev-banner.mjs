#!/usr/bin/env node
/**
 * Профессиональный стартер dev-сервера с информативным баннером
 */

const c = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
};

const pad = (s, n = 2) => String(s).padStart(n, "0");

function timeStr() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const banner = `
${c.cyan}╔══════════════════════════════════════════════════════════════╗${c.reset}
${c.cyan}║${c.reset}  ${c.bright}Sensify${c.reset}  —  ${c.dim}Извлекай смысл из любого контента${c.reset}  ${c.cyan}║${c.reset}
${c.cyan}╚══════════════════════════════════════════════════════════════╝${c.reset}
`;

const tips = [
  "URL, PDF, YouTube, текст → структурированные знания",
  "Groq Cloud или Ollama — настройки в браузере",
  "Экспорт в Obsidian, Notion, Markdown",
];

function printBanner() {
  process.stdout.write(banner);
  console.log(`  ${c.dim}Запуск dev-сервера в ${timeStr()}${c.reset}\n`);

  console.log(`  ${c.bright}Возможности:${c.reset}`);
  tips.forEach((t, i) => {
    console.log(`  ${c.green}•${c.reset} ${c.dim}${t}${c.reset}`);
  });

  console.log(`  ${c.yellow}→${c.reset} ${c.cyan}http://localhost:3000${c.reset}\n`);
  console.log(`  ${c.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}\n`);
}

printBanner();

// Запуск Next.js dev
const { spawn } = await import("child_process");
const proc = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, SENSIFY_DEV: "1" },
});

proc.on("close", (code) => {
  if (code !== 0 && code !== null) {
    process.exit(code);
  }
});
