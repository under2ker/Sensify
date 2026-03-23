import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ValidationError, UserError } from "@/lib/errors";
import { handleApiError } from "@/lib/api-error-handler";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  logger.api("PARSE-PDF", reqId, "Запрос получен");

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      throw new ValidationError("Файл не передан");
    }

    logger.api("PARSE-PDF", reqId, `Файл: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError("Файл слишком большой (макс. 50 МБ)");
    }

    if (file.type !== "application/pdf") {
      throw new ValidationError("Файл должен быть в формате PDF");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);

    const text = String(data?.text ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 15000);

    if (text.length < 30) {
      throw new UserError("В PDF слишком мало текста для извлечения", { statusCode: 400 });
    }

    logger.success("PARSE-PDF", reqId, `Обработано: ${data.numpages} стр. · ${text.length} символов`);

    return NextResponse.json({
      text,
      pages: data.numpages,
      info: data.info,
    });
  } catch (e) {
    return handleApiError(e, "PARSE-PDF", reqId);
  }
}
