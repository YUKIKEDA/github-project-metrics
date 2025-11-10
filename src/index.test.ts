import { describe, expect, it, vi } from "vitest";
import { main } from "./index.js";

describe("main", () => {
  it("コンソールに初期化メッセージを出力する", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    main();

    expect(consoleSpy).toHaveBeenCalledWith("GitHub Project Metrics initialized.");
    consoleSpy.mockRestore();
  });
});

