import { describe, test, expect, beforeAll, beforeEach } from "bun:test";
import { clearTestData, getTestDb } from "../setup";
import { createTestApp } from "../app-factory";
import { createTestUser, createTestSnippet } from "../helpers";
import type { Hono } from "hono";

describe("Public API", () => {
  let app: Hono;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    const db = getTestDb();
    app = createTestApp(db);
  });

  beforeEach(async () => {
    await clearTestData();
    const db = getTestDb();
    testUser = await createTestUser(db);
  });

  describe("GET /public/explore", () => {
    test("should return empty list when no public snippets", async () => {
      const res = await app.request("/public/explore");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.snippets).toEqual([]);
      expect(data.total).toBe(0);
    });

    test("should return only public snippets", async () => {
      const db = getTestDb();
      await createTestSnippet(db, testUser.id, {
        title: "Public Snippet",
        isPublic: true,
      });
      await createTestSnippet(db, testUser.id, {
        title: "Private Snippet",
        isPublic: false,
      });

      const res = await app.request("/public/explore");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.snippets).toHaveLength(1);
      expect(data.snippets[0].title).toBe("Public Snippet");
    });

    test("should filter by language", async () => {
      const db = getTestDb();
      await createTestSnippet(db, testUser.id, {
        title: "TS Snippet",
        language: "typescript",
        isPublic: true,
      });
      await createTestSnippet(db, testUser.id, {
        title: "Python Snippet",
        language: "python",
        isPublic: true,
      });

      const res = await app.request("/public/explore?language=typescript");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.snippets).toHaveLength(1);
      expect(data.snippets[0].title).toBe("TS Snippet");
    });

    test("should search by title", async () => {
      const db = getTestDb();
      await createTestSnippet(db, testUser.id, {
        title: "React Hook Example",
        isPublic: true,
      });
      await createTestSnippet(db, testUser.id, {
        title: "Docker Setup",
        isPublic: true,
      });

      const res = await app.request("/public/explore?search=React");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.snippets).toHaveLength(1);
      expect(data.snippets[0].title).toBe("React Hook Example");
    });

    test("should include user info with snippets", async () => {
      const db = getTestDb();
      await createTestSnippet(db, testUser.id, {
        title: "Test Snippet",
        isPublic: true,
      });

      const res = await app.request("/public/explore");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.snippets[0].user).toBeDefined();
      expect(data.snippets[0].user.username).toBe(testUser.username);
    });

    test("should return available languages", async () => {
      const db = getTestDb();
      await createTestSnippet(db, testUser.id, {
        language: "typescript",
        isPublic: true,
      });
      await createTestSnippet(db, testUser.id, {
        language: "python",
        isPublic: true,
      });

      const res = await app.request("/public/explore");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.languages).toContain("typescript");
      expect(data.languages).toContain("python");
    });
  });

  describe("GET /public/users/:username", () => {
    test("should return user profile with public snippets", async () => {
      const db = getTestDb();
      await createTestSnippet(db, testUser.id, {
        title: "Public",
        isPublic: true,
      });
      await createTestSnippet(db, testUser.id, {
        title: "Private",
        isPublic: false,
      });

      const res = await app.request(`/public/users/${testUser.username}`);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.username).toBe(testUser.username);
      expect(data.snippets).toHaveLength(1);
      expect(data.snippets[0].title).toBe("Public");
    });

    test("should return stats", async () => {
      const res = await app.request(`/public/users/${testUser.username}`);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.stats).toBeDefined();
      expect(data.stats.publicSnippets).toBe(0);
      expect(data.stats.totalStars).toBe(0);
      expect(data.stats.totalForks).toBe(0);
    });

    test("should return 404 for non-existent user", async () => {
      const res = await app.request("/public/users/nonexistent_user");

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("User not found");
    });
  });

  describe("GET /public/users/search", () => {
    test("should search users by username", async () => {
      const res = await app.request(
        `/public/users/search?q=${testUser.username.slice(0, 4)}`
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.users.length).toBeGreaterThanOrEqual(1);
      expect(
        data.users.some(
          (u: { username: string }) => u.username === testUser.username
        )
      ).toBe(true);
    });

    test("should search users by name", async () => {
      const res = await app.request("/public/users/search?q=Test");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.users.length).toBeGreaterThanOrEqual(1);
    });

    test("should return public snippet count", async () => {
      const db = getTestDb();
      await createTestSnippet(db, testUser.id, { isPublic: true });
      await createTestSnippet(db, testUser.id, { isPublic: true });
      await createTestSnippet(db, testUser.id, { isPublic: false });

      const res = await app.request(
        `/public/users/search?q=${testUser.username.slice(0, 4)}`
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      const user = data.users.find(
        (u: { username: string }) => u.username === testUser.username
      );
      expect(user.publicSnippets).toBe(2);
    });

    test("should return 400 with empty query", async () => {
      const res = await app.request("/public/users/search?q=");

      expect(res.status).toBe(400);
    });
  });
});
