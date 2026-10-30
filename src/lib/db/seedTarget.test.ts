import { describe, expect, it } from "vitest";
import { getSeedDatabasePath } from "@/lib/db/seedTarget";

describe("seed database target", () => {
  it("defaults to the isolated development database", () => {
    expect(getSeedDatabasePath()).toMatch(/data\/vita\.dev\.db$/);
  });

  it("rejects the production database path", () => {
    expect(() => getSeedDatabasePath("data/vita.db")).toThrow(/production database/i);
  });

  it("allows an explicit isolated end-to-end database", () => {
    expect(getSeedDatabasePath("data/vita.e2e.db")).toMatch(/data\/vita\.e2e\.db$/);
  });
});
