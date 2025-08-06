import { createFiberplane, createOpenAPISpec } from "@fiberplane/hono";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { eq, and, desc, asc, lte, sql } from "drizzle-orm";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "@hono/mcp";
import { z } from "zod";
import * as schema from "./db/schema";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// OpenStreetMap Overpass API interface
interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    name?: string;
    amenity?: string;
    shop?: string;
    "addr:street"?: string;
    "addr:housenumber"?: string;
    "addr:city"?: string;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// Create MCP server with todo tools
function createMcpServer(env: Bindings) {
  const server = new McpServer({
    name: "todo-mcp-server",
    version: "1.0.0",
    description: "MCP server for todo management with gamification",
  });

  const db = drizzle(env.DB);

  // Helper function to get or create user points record
  async function getUserPoints() {
    let [userPoints] = await db.select().from(schema.userPoints).limit(1);
    
    if (!userPoints) {
      [userPoints] = await db.insert(schema.userPoints).values({
        totalPoints: 0,
      }).returning();
    }
    
    return userPoints;
  }

  // Helper function to award points for completed todos
  async function awardPoints(priority: string) {
    const pointValues = { low: 1, medium: 3, high: 5 };
    const points = pointValues[priority as keyof typeof pointValues] || 0;
    
    if (points > 0) {
      const userPoints = await getUserPoints();
      await db.update(schema.userPoints)
        .set({ 
          totalPoints: userPoints.totalPoints + points,
          updatedAt: sql`(CURRENT_TIMESTAMP)`
        })
        .where(eq(schema.userPoints.id, userPoints.id));
    }
  }

  // Create todo tool
  server.tool(
    "create_todo",
    {
      title: z.string().min(1).describe("Title of the todo item"),
      description: z.string().optional().describe("Optional description of the todo"),
      priority: z.enum(["low", "medium", "high"]).default("medium").describe("Priority level"),
      due_date: z.string().optional().describe("Due date in ISO 8601 format"),
      category_names: z.array(z.string()).optional().describe("Array of category names to assign"),
    },
    async ({ title, description, priority, due_date, category_names }) => {
      try {
        // Validate due date format if provided
        if (due_date) {
          const date = new Date(due_date);
          if (isNaN(date.getTime())) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Invalid due_date format. Please use ISO 8601 format (e.g., 2024-01-15T10:00:00Z)",
                },
              ],
              isError: true,
            };
          }
        }

        // Create the todo
        const [newTodo] = await db
          .insert(schema.todos)
          .values({
            title,
            description: description || null,
            priority,
            dueDate: due_date || null,
          })
          .returning();

        // Handle category assignments if provided
        if (category_names && category_names.length > 0) {
          for (const categoryName of category_names) {
            // Find or create category
            let [category] = await db
              .select()
              .from(schema.categories)
              .where(eq(schema.categories.name, categoryName))
              .limit(1);

            if (!category) {
              [category] = await db
                .insert(schema.categories)
                .values({ name: categoryName })
                .returning();
            }

            // Assign category to todo
            await db
              .insert(schema.todoCategories)
              .values({
                todoId: newTodo.id,
                categoryId: category.id,
              });
          }
        }

        return {
          content: [
            {
              type: "text",
              text: `Todo created successfully: ${JSON.stringify(newTodo, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating todo: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get todos tool
  server.tool(
    "get_todos",
    {
      status: z.enum(["pending", "in-progress", "completed"]).optional().describe("Filter by status"),
      priority: z.enum(["low", "medium", "high"]).optional().describe("Filter by priority"),
      category_name: z.string().optional().describe("Filter by category name"),
      due_before: z.string().optional().describe("Filter todos due before this date (ISO 8601)"),
      limit: z.number().min(1).max(100).default(50).describe("Maximum number of todos to return"),
    },
    async ({ status, priority, category_name, due_before, limit }) => {
      try {
        // Build conditions array
        const conditions = [];
        
        if (status) {
          conditions.push(eq(schema.todos.status, status));
        }
        
        if (priority) {
          conditions.push(eq(schema.todos.priority, priority));
        }
        
        if (due_before) {
          const date = new Date(due_before);
          if (isNaN(date.getTime())) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Invalid due_before format. Please use ISO 8601 format",
                },
              ],
              isError: true,
            };
          }
          conditions.push(lte(schema.todos.dueDate, due_before));
        }

        // Build and execute query
        let todos;
        if (conditions.length > 0) {
          todos = await db.select().from(schema.todos)
            .where(conditions.length === 1 ? conditions[0] : and(...conditions))
            .orderBy(desc(schema.todos.createdAt))
            .limit(limit);
        } else {
          todos = await db.select().from(schema.todos)
            .orderBy(desc(schema.todos.createdAt))
            .limit(limit);
        }

        // Filter by category if specified
        let filteredTodos = todos;
        if (category_name) {
          const todoIds: number[] = [];
          for (const todo of todos) {
            const categoryAssignments = await db
              .select()
              .from(schema.todoCategories)
              .innerJoin(schema.categories, eq(schema.todoCategories.categoryId, schema.categories.id))
              .where(
                and(
                  eq(schema.todoCategories.todoId, todo.id),
                  eq(schema.categories.name, category_name)
                )
              );
            
            if (categoryAssignments.length > 0) {
              todoIds.push(todo.id);
            }
          }
          filteredTodos = todos.filter(todo => todoIds.includes(todo.id));
        }

        return {
          content: [
            {
              type: "text",
              text: `Found ${filteredTodos.length} todos:\n${JSON.stringify(filteredTodos, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving todos: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Update todo tool
  server.tool(
    "update_todo",
    {
      id: z.number().min(1).describe("ID of the todo to update"),
      title: z.string().min(1).optional().describe("New title"),
      description: z.string().optional().describe("New description"),
      status: z.enum(["pending", "in-progress", "completed"]).optional().describe("New status"),
      priority: z.enum(["low", "medium", "high"]).optional().describe("New priority"),
      due_date: z.string().optional().describe("New due date in ISO 8601 format"),
    },
    async ({ id, title, description, status, priority, due_date }) => {
      try {
        // Check if todo exists and get current data
        const [existingTodo] = await db
          .select()
          .from(schema.todos)
          .where(eq(schema.todos.id, id))
          .limit(1);

        if (!existingTodo) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Todo with ID ${id} not found`,
              },
            ],
            isError: true,
          };
        }

        // Validate due date if provided
        if (due_date) {
          const date = new Date(due_date);
          if (isNaN(date.getTime())) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Invalid due_date format. Please use ISO 8601 format",
                },
              ],
              isError: true,
            };
          }
        }

        // Build update object
        const updateData: any = {
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        };

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (due_date !== undefined) updateData.dueDate = due_date;

        // Update the todo
        const [updatedTodo] = await db
          .update(schema.todos)
          .set(updateData)
          .where(eq(schema.todos.id, id))
          .returning();

        // Award points if status changed to completed
        if (status === "completed" && existingTodo.status !== "completed") {
          await awardPoints(updatedTodo.priority);
        }

        return {
          content: [
            {
              type: "text",
              text: `Todo updated successfully: ${JSON.stringify(updatedTodo, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating todo: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Delete todo tool
  server.tool(
    "delete_todo",
    {
      id: z.number().min(1).describe("ID of the todo to delete"),
    },
    async ({ id }) => {
      try {
        // Check if todo exists
        const [existingTodo] = await db
          .select()
          .from(schema.todos)
          .where(eq(schema.todos.id, id))
          .limit(1);

        if (!existingTodo) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Todo with ID ${id} not found`,
              },
            ],
            isError: true,
          };
        }

        // Delete the todo (cascade will handle category assignments)
        await db.delete(schema.todos).where(eq(schema.todos.id, id));

        return {
          content: [
            {
              type: "text",
              text: `Todo with ID ${id} deleted successfully`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting todo: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Create category tool
  server.tool(
    "create_category",
    {
      name: z.string().min(1).describe("Name of the category"),
      color: z.string().optional().describe("Hex color code for the category"),
    },
    async ({ name, color }) => {
      try {
        // Check if category already exists
        const [existingCategory] = await db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.name, name))
          .limit(1);

        if (existingCategory) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Category '${name}' already exists`,
              },
            ],
            isError: true,
          };
        }

        // Validate color format if provided
        if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Color must be a valid hex color code (e.g., #FF5733)",
              },
            ],
            isError: true,
          };
        }

        const [newCategory] = await db
          .insert(schema.categories)
          .values({
            name,
            color: color || null,
          })
          .returning();

        return {
          content: [
            {
              type: "text",
              text: `Category created successfully: ${JSON.stringify(newCategory, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating category: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get categories tool
  server.tool(
    "get_categories",
    {},
    async () => {
      try {
        const categories = await db
          .select()
          .from(schema.categories)
          .orderBy(asc(schema.categories.name));

        return {
          content: [
            {
              type: "text",
              text: `Found ${categories.length} categories:\n${JSON.stringify(categories, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving categories: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Assign category tool
  server.tool(
    "assign_category",
    {
      todo_id: z.number().min(1).describe("ID of the todo"),
      category_name: z.string().min(1).describe("Name of the category to assign"),
    },
    async ({ todo_id, category_name }) => {
      try {
        // Check if todo exists
        const [todo] = await db
          .select()
          .from(schema.todos)
          .where(eq(schema.todos.id, todo_id))
          .limit(1);

        if (!todo) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Todo with ID ${todo_id} not found`,
              },
            ],
            isError: true,
          };
        }

        // Find or create category
        let [category] = await db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.name, category_name))
          .limit(1);

        if (!category) {
          [category] = await db
            .insert(schema.categories)
            .values({ name: category_name })
            .returning();
        }

        // Check if assignment already exists
        const [existingAssignment] = await db
          .select()
          .from(schema.todoCategories)
          .where(
            and(
              eq(schema.todoCategories.todoId, todo_id),
              eq(schema.todoCategories.categoryId, category.id)
            )
          )
          .limit(1);

        if (existingAssignment) {
          return {
            content: [
              {
                type: "text",
                text: `Category '${category_name}' is already assigned to todo ${todo_id}`,
              },
            ],
          };
        }

        // Create assignment
        await db
          .insert(schema.todoCategories)
          .values({
            todoId: todo_id,
            categoryId: category.id,
          });

        return {
          content: [
            {
              type: "text",
              text: `Category '${category_name}' assigned to todo ${todo_id} successfully`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error assigning category: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Remove category tool
  server.tool(
    "remove_category",
    {
      todo_id: z.number().min(1).describe("ID of the todo"),
      category_name: z.string().min(1).describe("Name of the category to remove"),
    },
    async ({ todo_id, category_name }) => {
      try {
        // Find category
        const [category] = await db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.name, category_name))
          .limit(1);

        if (!category) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Category '${category_name}' not found`,
              },
            ],
            isError: true,
          };
        }

        // Remove assignment
        await db
          .delete(schema.todoCategories)
          .where(
            and(
              eq(schema.todoCategories.todoId, todo_id),
              eq(schema.todoCategories.categoryId, category.id)
            )
          );

        return {
          content: [
            {
              type: "text",
              text: `Category '${category_name}' removed from todo ${todo_id} successfully`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error removing category: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get points tool
  server.tool(
    "get_points",
    {},
    async () => {
      try {
        const userPoints = await getUserPoints();
        
        return {
          content: [
            {
              type: "text",
              text: `Current total points: ${userPoints.totalPoints}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving points: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Ice cream finder tool (unlocked at 10 points)
  server.tool(
    "ice_cream_finder",
    {
      address: z.string().min(1).describe("Address to search for ice cream shops near"),
    },
    async ({ address }) => {
      try {
        // Check if user has enough points
        const userPoints = await getUserPoints();
        
        if (userPoints.totalPoints < 10) {
          return {
            content: [
              {
                type: "text",
                text: `Ice cream finder is locked! You need 10 points to unlock this feature. Current points: ${userPoints.totalPoints}`,
              },
            ],
            isError: true,
          };
        }

        // First, geocode the address using Nominatim
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        
        const geocodeResponse = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': 'TODO-MCP-Server/1.0.0'
          }
        });
        
        if (!geocodeResponse.ok) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Failed to geocode address",
              },
            ],
            isError: true,
          };
        }

        const geocodeData = await geocodeResponse.json() as Array<{
          lat: string;
          lon: string;
          display_name: string;
        }>;
        
        if (geocodeData.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Address not found",
              },
            ],
            isError: true,
          };
        }

        const { lat, lon } = geocodeData[0];

        // Search for ice cream shops using Overpass API
        const overpassQuery = `
          [out:json][timeout:25];
          (
            node["amenity"="ice_cream"](around:2000,${lat},${lon});
            node["shop"="ice_cream"](around:2000,${lat},${lon});
          );
          out geom;
        `;

        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        const overpassResponse = await fetch(overpassUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `data=${encodeURIComponent(overpassQuery)}`,
        });

        if (!overpassResponse.ok) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Failed to search for ice cream shops",
              },
            ],
            isError: true,
          };
        }

        const overpassData = await overpassResponse.json() as OverpassResponse;
        
        const iceCreamShops = overpassData.elements
          .filter(element => element.tags?.name)
          .map(element => ({
            name: element.tags?.name || 'Unknown',
            address: [
              element.tags?.["addr:housenumber"],
              element.tags?.["addr:street"],
              element.tags?.["addr:city"]
            ].filter(Boolean).join(' ') || 'Address not available',
            coordinates: element.lat && element.lon ? `${element.lat}, ${element.lon}` : 'Coordinates not available'
          }))
          .slice(0, 10); // Limit to 10 results

        if (iceCreamShops.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No ice cream shops found near "${address}". Try a different location!`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Found ${iceCreamShops.length} ice cream shops near "${address}":\n\n${iceCreamShops.map((shop, index) => 
                `${index + 1}. ${shop.name}\n   Address: ${shop.address}\n   Coordinates: ${shop.coordinates}`
              ).join('\n\n')}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error finding ice cream shops: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

app.get("/", (c) => {
  return c.text("TODO MCP Server is running!");
});

app.get("/health", async (c) => {
  try {
    const db = drizzle(c.env.DB);
    // Simple health check query
    await db.select().from(schema.todos).limit(1);
    
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  } catch (error) {
    return c.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// REST API endpoint to get all todos (no auth required)
app.get("/api/todos", async (c) => {
  try {
    const db = drizzle(c.env.DB);
    
    // Get all todos with their categories
    const todos = await db.select().from(schema.todos)
      .orderBy(desc(schema.todos.createdAt));

    // For each todo, get its categories
    const todosWithCategories = await Promise.all(
      todos.map(async (todo) => {
        const categories = await db
          .select({
            id: schema.categories.id,
            name: schema.categories.name,
            color: schema.categories.color
          })
          .from(schema.categories)
          .innerJoin(schema.todoCategories, eq(schema.categories.id, schema.todoCategories.categoryId))
          .where(eq(schema.todoCategories.todoId, todo.id));

        return {
          ...todo,
          categories: categories
        };
      })
    );

    return c.json({
      success: true,
      data: todosWithCategories,
      count: todosWithCategories.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// MCP protocol endpoint that also broadcasts events
app.all("/mcp", async (c) => {
  const mcpServer = createMcpServer(c.env);
  const transport = new StreamableHTTPTransport();
  
  await mcpServer.connect(transport);
  return transport.handleRequest(c);
});

// Endpoint to manually trigger events (for testing)
app.get("/openapi.json", c => {
  return c.json(createOpenAPISpec(app, {
    info: {
      title: "TODO MCP Server",
      version: "1.0.0",
      description: "A gamified TODO management system with MCP integration",
    },
  }))
});

app.use("/fp/*", createFiberplane({
  app,
  openapi: { url: "/openapi.json" }
}));

export default app;