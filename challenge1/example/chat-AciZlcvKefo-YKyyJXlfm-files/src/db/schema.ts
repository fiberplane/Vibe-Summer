import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const todos = sqliteTable("todos", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["pending", "in-progress", "completed"] }).notNull().default("pending"),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  dueDate: text("due_date"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, t => [
  index("todos_status_idx").on(t.status),
  index("todos_priority_idx").on(t.priority),
  index("todos_due_date_idx").on(t.dueDate),
]);

export const categories = sqliteTable("categories", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, t => [
  index("categories_name_idx").on(t.name),
]);

export const todoCategories = sqliteTable("todo_categories", {
  todoId: integer("todo_id").notNull().references(() => todos.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, t => [
  primaryKey({ columns: [t.todoId, t.categoryId] }),
]);

export const userPoints = sqliteTable("user_points", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  totalPoints: integer("total_points").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const todosRelations = relations(todos, ({ many }) => ({
  todoCategories: many(todoCategories),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  todoCategories: many(todoCategories),
}));

export const todoCategoriesRelations = relations(todoCategories, ({ one }) => ({
  todo: one(todos, {
    fields: [todoCategories.todoId],
    references: [todos.id],
  }),
  category: one(categories, {
    fields: [todoCategories.categoryId],
    references: [categories.id],
  }),
}));