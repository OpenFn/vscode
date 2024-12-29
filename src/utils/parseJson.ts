type JsonResult<T extends Record<string, any>> =
  | { success: true; result: T }
  | { success: false };

export default function parseJson<T extends Record<string, any>>(
  jsonLike: Buffer | string
): JsonResult<T> {
  const raw = Buffer.isBuffer(jsonLike) ? jsonLike.toString() : jsonLike;
  try {
    const result = JSON.parse(raw) as T;
    return { success: true, result };
  } catch (e) {
    return { success: false };
  }
}
