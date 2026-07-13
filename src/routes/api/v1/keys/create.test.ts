import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Route } from "./create";

describe("/api/v1/keys/create handler", () => {
  const originalEnv = process.env;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postHandler = (Route.options.server?.handlers as any)?.POST;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("should fail if POST body is invalid JSON", async () => {
    const request = new Request("https://api.example.com/api/v1/keys/create", {
      method: "POST",
      body: "invalid-json",
    });

    const res = await postHandler({ request });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("JSON invalide");
  });

  it("should fail if name or email are invalid", async () => {
    // Missing name
    const request1 = new Request("https://api.example.com/api/v1/keys/create", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    });
    const res1 = await postHandler({ request1 });
    expect(res1.status).toBe(400);

    // Invalid email
    const request2 = new Request("https://api.example.com/api/v1/keys/create", {
      method: "POST",
      body: JSON.stringify({ name: "Bob", email: "invalid-email" }),
    });
    const res2 = await postHandler({ request2 });
    expect(res2.status).toBe(400);
  });

  it("should fallback to local key generation if Unkey environment variables are missing", async () => {
    delete process.env.UNKEY_ROOT_KEY;
    delete process.env.UNKEY_API_ID;

    const request = new Request("https://api.example.com/api/v1/keys/create", {
      method: "POST",
      body: JSON.stringify({ name: "Bob", email: "bob@example.com" }),
    });

    const res = await postHandler({ request });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.key).toBeDefined();
    expect(data.key.startsWith("mk_test_")).toBe(true);
    expect(data.isFallback).toBe(true);
  });

  it("should return Unkey key if Unkey is configured and succeeds", async () => {
    process.env.UNKEY_ROOT_KEY = "root_key_123";
    process.env.UNKEY_API_ID = "api_id_123";

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        key: "mk_live_key_from_unkey",
        keyId: "key_id_unkey",
      }),
    } as Response);

    const request = new Request("https://api.example.com/api/v1/keys/create", {
      method: "POST",
      body: JSON.stringify({ name: "Bob", email: "bob@example.com" }),
    });

    const res = await postHandler({ request });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.key).toBe("mk_live_key_from_unkey");
    expect(data.keyId).toBe("key_id_unkey");
    expect(data.isFallback).toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.unkey.com/v2/keys.createKey",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer root_key_123",
        },
      })
    );
  });

  it("should fallback to local key generation if Unkey call fails (status not ok)", async () => {
    process.env.UNKEY_ROOT_KEY = "root_key_123";
    process.env.UNKEY_API_ID = "api_id_123";

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    } as Response);

    const request = new Request("https://api.example.com/api/v1/keys/create", {
      method: "POST",
      body: JSON.stringify({ name: "Bob", email: "bob@example.com" }),
    });

    const res = await postHandler({ request });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.key).toBeDefined();
    expect(data.key.startsWith("mk_test_")).toBe(true);
    expect(data.isFallback).toBe(true);
  });

  it("should fallback to local key generation if Unkey fetch throws", async () => {
    process.env.UNKEY_ROOT_KEY = "root_key_123";
    process.env.UNKEY_API_ID = "api_id_123";

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    const request = new Request("https://api.example.com/api/v1/keys/create", {
      method: "POST",
      body: JSON.stringify({ name: "Bob", email: "bob@example.com" }),
    });

    const res = await postHandler({ request });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.key).toBeDefined();
    expect(data.key.startsWith("mk_test_")).toBe(true);
    expect(data.isFallback).toBe(true);
  });
});
