import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiGuard, extractApiKey } from "./api-auth.server";

describe("apiGuard", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("should return 401 if no API key is provided", async () => {
    const request = new Request("https://api.example.com/data");
    const result = await apiGuard(request);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(401);
    }
  });

  it("should validate local test keys (mk_test_) in development", async () => {
    process.env.NODE_ENV = "development";
    const request = new Request("https://api.example.com/data", {
      headers: { "X-Api-Key": "mk_test_123" }
    });
    const result = await apiGuard(request);
    expect("key" in result).toBe(true);
    if ("key" in result) {
      expect(result.key).toBe("mk_test_123");
      expect(result.rl.limit).toBe(60);
    }
  });

  it("should NOT validate local test keys (mk_test_) in production unless explicitly present in MANDAT_API_KEYS", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.MANDAT_API_KEYS;
    const request = new Request("https://api.example.com/data", {
      headers: { "X-Api-Key": "mk_test_123" }
    });
    const result = await apiGuard(request);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(401);
    }

    // Now put it in MANDAT_API_KEYS
    process.env.MANDAT_API_KEYS = "mk_test_123,other_key";
    const result2 = await apiGuard(request);
    expect("key" in result2).toBe(true);
    if ("key" in result2) {
      expect(result2.key).toBe("mk_test_123");
    }
  });

  it("should validate via Unkey if UNKEY_API_ID is set", async () => {
    process.env.UNKEY_API_ID = "api_123";
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          valid: true,
          ratelimit: { limit: 100, remaining: 99, reset: 123456789 }
        }
      })
    } as Response);

    const request = new Request("https://api.example.com/data", {
      headers: { "X-Api-Key": "unkey_abc" }
    });

    const result = await apiGuard(request);
    expect("key" in result).toBe(true);
    if ("key" in result) {
      expect(result.key).toBe("unkey_abc");
      expect(result.rl.limit).toBe(100);
      expect(result.rl.remaining).toBe(99);
    }

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.unkey.com/v2/keys.verifyKey",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ key: "unkey_abc", apiId: "api_123" })
      })
    );
  });

  it("should return 401 if Unkey validation fails", async () => {
    process.env.UNKEY_API_ID = "api_123";
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { valid: false }
      })
    } as Response);

    const request = new Request("https://api.example.com/data", {
      headers: { "X-Api-Key": "invalid_key" }
    });

    const result = await apiGuard(request);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(401);
    }
  });

  it("should fallback to local validation if UNKEY_API_ID is missing", async () => {
    delete process.env.UNKEY_API_ID;
    process.env.MANDAT_API_KEYS = "key_local_1,key_local_2";

    const request = new Request("https://api.example.com/data", {
      headers: { "X-Api-Key": "key_local_1" }
    });

    const result = await apiGuard(request);
    expect("key" in result).toBe(true);
    if ("key" in result) {
      expect(result.key).toBe("key_local_1");
    }
  });
});
