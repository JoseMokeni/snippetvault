import { describe, test, expect, beforeAll, beforeEach } from "bun:test";
import { clearTestData, getTestDb } from "../setup";
import { createTestApp } from "../app-factory";
import { createTestUser, createTestSnippet, createTestTag } from "../helpers";
import { schema } from "../helpers";
import { eq } from "drizzle-orm";
import type { Hono } from "hono";

describe("Users API", () => {
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

  describe("GET /users/me", () => {
    test("should return current user profile", async () => {
      const res = await app.request("/users/me", {
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.id).toBe(testUser.id);
      expect(data.user.name).toBe(testUser.name);
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.username).toBe(testUser.username);
    });

    test("should return 401 without auth", async () => {
      const res = await app.request("/users/me");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /users/username", () => {
    test("should update username", async () => {
      const res = await app.request("/users/username", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: "new_username" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.username).toBe("new_username");
    });

    test("should reject invalid username format", async () => {
      const res = await app.request("/users/username", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: "INVALID-Username!" }),
      });

      expect(res.status).toBe(400);
    });

    test("should reject username too short", async () => {
      const res = await app.request("/users/username", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: "ab" }),
      });

      expect(res.status).toBe(400);
    });

    test("should reject duplicate username", async () => {
      const db = getTestDb();
      const otherUser = await createTestUser(db, {
        email: "other@example.com",
        username: "taken_username",
      });

      const res = await app.request("/users/username", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: otherUser.username }),
      });

      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe("Username is already taken");
    });

    test("should allow keeping same username", async () => {
      const res = await app.request("/users/username", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUser.sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: testUser.username }),
      });

      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /users/me", () => {
    test("should delete current user account", async () => {
      const res = await app.request("/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe("Account deleted successfully");

      // Verify user is actually deleted
      const db = getTestDb();
      const deletedUser = await db.query.users.findFirst({
        where: eq(schema.users.id, testUser.id),
      });
      expect(deletedUser).toBeUndefined();
    });

    test("should delete user sessions (cascade)", async () => {
      const db = getTestDb();

      // Verify session exists before deletion
      const sessionBefore = await db.query.sessions.findFirst({
        where: eq(schema.sessions.id, testUser.sessionId),
      });
      expect(sessionBefore).toBeDefined();

      await app.request("/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      });

      // Verify session is deleted
      const sessionAfter = await db.query.sessions.findFirst({
        where: eq(schema.sessions.id, testUser.sessionId),
      });
      expect(sessionAfter).toBeUndefined();
    });

    test("should delete user snippets and related data (cascade)", async () => {
      const db = getTestDb();

      // Create a snippet with files and variables
      const snippet = await createTestSnippet(db, testUser.id, {
        title: "Test Snippet",
        files: [
          {
            filename: "index.ts",
            content: 'console.log("hello")',
            language: "typescript",
          },
        ],
        variables: [{ name: "VAR1", defaultValue: "value1" }],
      });

      // Verify snippet exists
      const snippetBefore = await db.query.snippets.findFirst({
        where: eq(schema.snippets.id, snippet.id),
        with: { files: true, variables: true },
      });
      expect(snippetBefore).toBeDefined();
      expect(snippetBefore?.files.length).toBe(1);
      expect(snippetBefore?.variables.length).toBe(1);

      await app.request("/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      });

      // Verify snippet and related data are deleted
      const snippetAfter = await db.query.snippets.findFirst({
        where: eq(schema.snippets.id, snippet.id),
      });
      expect(snippetAfter).toBeUndefined();
    });

    test("should delete user tags (cascade)", async () => {
      const db = getTestDb();

      const tag = await createTestTag(db, testUser.id, { name: "test-tag" });

      // Verify tag exists
      const tagBefore = await db.query.tags.findFirst({
        where: eq(schema.tags.id, tag.id),
      });
      expect(tagBefore).toBeDefined();

      await app.request("/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      });

      // Verify tag is deleted
      const tagAfter = await db.query.tags.findFirst({
        where: eq(schema.tags.id, tag.id),
      });
      expect(tagAfter).toBeUndefined();
    });

    test("should delete user stars (cascade)", async () => {
      const db = getTestDb();

      // Create another user with a public snippet
      const otherUser = await createTestUser(db, {
        email: "other@example.com",
      });
      const publicSnippet = await createTestSnippet(db, otherUser.id, {
        title: "Public Snippet",
        isPublic: true,
      });

      // Star the snippet
      await db.insert(schema.stars).values({
        userId: testUser.id,
        snippetId: publicSnippet.id,
      });

      // Verify star exists
      const starBefore = await db.query.stars.findFirst({
        where: eq(schema.stars.userId, testUser.id),
      });
      expect(starBefore).toBeDefined();

      await app.request("/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUser.sessionToken}` },
      });

      // Verify star is deleted
      const starAfter = await db.query.stars.findFirst({
        where: eq(schema.stars.userId, testUser.id),
      });
      expect(starAfter).toBeUndefined();

      // But the other user's snippet should still exist
      const snippetStillExists = await db.query.snippets.findFirst({
        where: eq(schema.snippets.id, publicSnippet.id),
      });
      expect(snippetStillExists).toBeDefined();
    });

    test("should return 401 without auth", async () => {
      const res = await app.request("/users/me", {
        method: "DELETE",
      });
      expect(res.status).toBe(401);
    });
  });
});
