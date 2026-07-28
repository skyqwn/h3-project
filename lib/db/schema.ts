import {
  pgTable,
  uuid,
  text,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

// 관리자 계정. role: "owner"(계정 관리 가능) | "editor"(글만 작성).
// username = 로그인 아이디(이메일 형식 강제 없음).
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("editor"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 블로그 글. 기존 mdx 프론트매터와 1:1 대응. body는 마크다운.
export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  coverImage: text("cover_image").notNull(),
  category: text("category").notNull(), // "news" | "article" | "update"
  tags: text("tags").array().notNull().default([]),
  body: text("body").notNull(),
  author: text("author").notNull().default("H3"),
  draft: boolean("draft").notNull().default(true),
  publishedAt: date("published_at").notNull(),
  source: text("source"),
  sourceUrl: text("source_url"),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
