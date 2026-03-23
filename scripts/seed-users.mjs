#!/usr/bin/env node
/**
 * Создаёт 5 тестовых пользователей с случайными данными.
 * Использование: node scripts/seed-users.mjs
 * Или: npm run seed-users
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import bcrypt from "bcryptjs";

import { createPrismaClient } from "./lib/create-prisma.mjs";

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

const NAMES = [
  "Алексей Петров",
  "Мария Иванова",
  "Дмитрий Сидоров",
  "Елена Козлова",
  "Сергей Новиков",
];

const DOMAINS = ["gmail.com", "yandex.ru", "mail.ru", "outlook.com", "example.com"];

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function randomItem(arr) {
  return arr[randomInt(arr.length)];
}

function generateEmail(name) {
  const namePart = name
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[а-яё]/g, (c) => {
      const tr = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
      return tr[c] || c;
    });
  return `${namePart}${randomInt(999)}@${randomItem(DOMAINS)}`;
}

async function seed() {
  const password = "password123";
  const passwordHash = await bcrypt.hash(password, 12);
  let created = 0;
  for (const name of NAMES) {
    const email = generateEmail(name);
    try {
      await prisma.user.create({
        data: { email, passwordHash, name },
      });
      console.log(`Создан: ${email} (${name}) пароль: ${password}`);
      created++;
    } catch (e) {
      if (e.code === "P2002") {
        console.log(`Пропущен (уже есть): ${email}`);
      } else {
        throw e;
      }
    }
  }
  console.log(`\nСоздано пользователей: ${created}`);
}

seed()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
