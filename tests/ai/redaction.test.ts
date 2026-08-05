import { describe, expect, it } from "vitest";
import { redactObject, redactString, isSensitiveField } from "@/lib/ai/redaction";

describe("redaction", () => {
  it("redacts emails and phone numbers in strings", () => {
    const input = "Contact user@example.com or 555-123-4567";
    expect(redactString(input)).not.toContain("user@example.com");
    expect(redactString(input)).not.toContain("555-123-4567");
  });

  it("flags sensitive field names", () => {
    expect(isSensitiveField("piiDetail")).toBe(true);
    expect(isSensitiveField("title")).toBe(false);
  });

  it("redacts sensitive keys in objects", () => {
    const result = redactObject({
      title: "Invoice bot",
      ssn: "123-45-6789",
      contactEmail: "secret@corp.com",
    });
    expect(result.ssn).toBe("[REDACTED]");
    expect(result.contactEmail).toBe("[REDACTED]");
    expect(result.title).toBe("Invoice bot");
  });
});
