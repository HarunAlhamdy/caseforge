import { describe, expect, it } from "vitest";
import { determineControls } from "@/lib/scoring/control-inheritance";

describe("control-inheritance", () => {
  it("triggers PII-in-LLM controls", () => {
    const controls = determineControls(
      [
        {
          id: "1",
          dataClassification: "PII",
          entersLlmContext: "YES_IN_PROMPT",
        },
      ],
      { aiPattern: "RAG" },
      {},
    );
    expect(controls.some((c) => c.controlCode === "CTRL-PII-LLM-001")).toBe(true);
  });

  it("triggers SSN/Tax ID controls", () => {
    const controls = determineControls(
      [{ id: "1", piiType: "SSN", dataClassification: "PII" }],
      {},
      {},
    );
    expect(controls.some((c) => c.controlCode === "CTRL-FIN-001")).toBe(true);
  });

  it("triggers PHI controls", () => {
    const controls = determineControls(
      [{ id: "1", dataClassification: "PHI" }],
      {},
      {},
    );
    expect(controls.some((c) => c.controlCode === "CTRL-PHI-001")).toBe(true);
  });

  it("triggers CUI controls", () => {
    const controls = determineControls(
      [{ id: "1", dataClassification: "CUI" }],
      {},
      {},
    );
    expect(controls.some((c) => c.controlCode === "CTRL-CUI-001")).toBe(true);
  });

  it("triggers cross-border controls", () => {
    const controls = determineControls(
      [{ id: "1", crossBorderTransfer: true }],
      {},
      {},
    );
    expect(controls.some((c) => c.controlCode === "CTRL-XBORDER-001")).toBe(
      true,
    );
  });

  it("triggers erasure controls", () => {
    const controls = determineControls(
      [{ id: "1", rightToErasure: true }],
      {},
      {},
    );
    expect(controls.some((c) => c.controlCode === "CTRL-ERASE-001")).toBe(true);
  });

  it("triggers financial write controls", () => {
    const controls = determineControls(
      [],
      {
        agentWriteActions: [{ system: "Financial ERP", action: "post payment" }],
      },
      {},
    );
    expect(controls.some((c) => c.controlCode === "CTRL-SOX-001")).toBe(true);
  });

  it("triggers HR write controls", () => {
    const controls = determineControls(
      [],
      { agentWriteActions: [{ system: "HR System", action: "update record" }] },
      {},
    );
    expect(controls.some((c) => c.controlCode === "CTRL-HR-001")).toBe(true);
  });

  it("triggers DPIA for 6+ PII fields", () => {
    const elements = Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      dataClassification: "PII",
    }));
    const controls = determineControls(elements, {}, {});
    expect(controls.some((c) => c.controlCode === "CTRL-DPIA-001")).toBe(true);
  });

  it("triggers biometric controls", () => {
    const controls = determineControls(
      [{ id: "1", piiType: "BIOMETRIC" }],
      {},
      {},
    );
    expect(controls.some((c) => c.controlCode === "CTRL-BIO-001")).toBe(true);
  });
});
