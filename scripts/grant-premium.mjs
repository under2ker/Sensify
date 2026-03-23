#!/usr/bin/env node
/**
 * Скрипт для выдачи премиума пользователю по email.
 * Использование: node scripts/grant-premium.mjs your@email.com
 * Или: npm run grant-premium -- your@email.com
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createPrismaClient } from "./lib/create-prisma.mjs";

// Загрузка .env
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[match[1].trim()] = value;
    }
  }
}

const prisma = createPrismaClient();

async function grantPremium(email) {
  const emailNorm = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: emailNorm },
    include: { subscription: true },
  });

  if (!user) {
    console.error(`Пользователь с email ${emailNorm} не найден.`);
    process.exit(1);
  }

  const premiumUntil = new Date();
  premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: "premium",
      premiumUntil,
    },
    update: {
      plan: "premium",
      premiumUntil,
    },
  });

  console.log(`Премиум выдан пользователю ${user.email} до ${premiumUntil.toLocaleDateString("ru-RU")}`);
}

const email = process.argv[2];
if (!email) {
  console.error("Укажите email: node scripts/grant-premium.mjs your@email.com");
  process.exit(1);
}

grantPremium(email)
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
