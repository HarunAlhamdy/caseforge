const SENSITIVE_FIELD_PATTERNS = [
  /ssn/i,
  /social.?security/i,
  /password/i,
  /secret/i,
  /api.?key/i,
  /token/i,
  /pii/i,
  /phi/i,
  /cui/i,
  /tax.?id/i,
  /account.?number/i,
  /credit.?card/i,
  /email/i,
  /phone/i,
  /address/i,
  /dob/i,
  /date.?of.?birth/i,
];

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_REGEX = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

export function redactString(value: string): string {
  return value
    .replace(EMAIL_REGEX, "[REDACTED_EMAIL]")
    .replace(SSN_REGEX, "[REDACTED_SSN]")
    .replace(PHONE_REGEX, "[REDACTED_PHONE]");
}

export function isSensitiveField(key: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(key));
}

export function redactObject<T extends Record<string, unknown>>(
  obj: T,
  depth = 0,
): Record<string, unknown> {
  if (depth > 5) return { _truncated: true };

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value == null) {
      result[key] = value;
      continue;
    }

    if (isSensitiveField(key)) {
      result[key] = "[REDACTED]";
      continue;
    }

    if (typeof value === "string") {
      result[key] = redactString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? redactObject(item as Record<string, unknown>, depth + 1)
          : typeof item === "string"
            ? redactString(item)
            : item,
      );
    } else if (typeof value === "object") {
      result[key] = redactObject(value as Record<string, unknown>, depth + 1);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function redactForLlm(data: Record<string, unknown>): string {
  return JSON.stringify(redactObject(data), null, 2);
}
