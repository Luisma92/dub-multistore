import { RESERVED_SLUGS } from "@dub/utils";
import { describe, expect, it } from "vitest";

describe("RESERVED_SLUGS", () => {
  it('should include "p" in RESERVED_SLUGS', () => {
    expect(RESERVED_SLUGS).toContain("p");
  });
});
