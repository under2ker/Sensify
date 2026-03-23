/**
 * Скрипт для выдачи премиума пользователю по email.
 * Запуск: npx tsx scripts/grant-premium.ts your@email.com
 *
 * Установите tsx если нет: npm install -D tsx
 */

import { createPrismaClient } from "../src/lib/create-prisma-client";

const prisma = createPrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Использование: npx tsx scripts/grant-premium.ts your@email.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });

  if (!user) {
    console.error(`Пользователь с email ${email} не найден. Зарегистрируйтесь сначала.`);
    process.exit(1);
  }

  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: "yearly",
      premiumUntil: oneYearLater,
    },
    update: {
      plan: "yearly",
      premiumUntil: oneYearLater,
    },
  });

  console.log(`✓ Премиум выдан для ${email} до ${oneYearLater.toLocaleDateString("ru-RU")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
