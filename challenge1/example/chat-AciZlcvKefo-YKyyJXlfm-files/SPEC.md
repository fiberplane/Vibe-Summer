# TODO MCP Server Specification

This document outlines the design and step-by-step implementation plan for a TODO MCP server that provides comprehensive task management capabilities through the Model Context Protocol.

The MCP server will support basic CRUD operations for todos, category-based organization, due date management, priority levels, and status tracking. It will enable AI assistants to help users manage their tasks effectively through structured tool calls.

The system will be built using Cloudflare Workers with Hono as the API framework, Cloudflare D1 for data persistence, and the MCP SDK for protocol implementation.

## 1. Technology Stack

- **Edge Runtime:** Cloudflare Workers
- **API Framework:** Hono.js (TypeScript-based API framework)
- **Database:** Cloudflare D1 (serverless SQLite)
- **ORM:** Drizzle ORM for type-safe database operations
- **MCP Integration:** @modelcontextprotocol/sdk and @hono/mcp
- **External APIs:** OpenStreetMap Overpass API for ice cream shop location data

## 2. Database Schema Design

The database will consist of four main entities: todos, categories, a junction table for todo-category relationships, and a points tracking system.

### 2.1. todos Table

- id (INTEGER, Primary Key, Auto Increment)
- title (TEXT, NOT NULL)
- description (TEXT)
- status (TEXT, NOT NULL, CHECK: 'pending', 'in-progress', 'completed')
- priority (TEXT, NOT NULL, CHECK: 'low', 'medium', 'high')
- due_date (TEXT, ISO 8601 format)
- created_at (TEXT, NOT NULL, ISO 8601 format)
- updated_at (TEXT, NOT NULL, ISO 8601 format)

### 2.2. categories Table

- id (INTEGER, Primary Key, Auto Increment)
- name (TEXT, NOT NULL, UNIQUE)
- color (TEXT, hex color code)
- created_at (TEXT, NOT NULL, ISO 8601 format)

### 2.3. todo_categories Table

- todo_id (INTEGER, Foreign Key to todos.id)
- category_id (INTEGER, Foreign Key to categories.id)
- PRIMARY KEY (todo_id, category_id)

### 2.4. user_points Table

- id (INTEGER, Primary Key, Auto Increment)
- total_points (INTEGER, NOT NULL, DEFAULT 0)
- created_at (TEXT, NOT NULL, ISO 8601 format)
- updated_at (TEXT, NOT NULL, ISO 8601 format)

## 3. Points & Rewards System

The TODO MCP server includes a gamified points system to encourage task completion:

**Points System:**
- **Low Priority**: 1 point per completed task
- **Medium Priority**: 3 points per completed task  
- **High Priority**: 5 points per completed task
- Points are awarded only when a task status changes to "completed"
- Points are stored persistently and accumulate over time

**Rewards System:**
- **Ice Cream Finder Tool**: Unlocked at 10 points
- When unlocked, users can search for ice cream shops near any address
- Integration with OpenStreetMap Overpass API for location data
- Returns shop names, addresses, and coordinates

## 4. MCP Server Tools

The MCP server will expose the following tools for AI assistants to interact with the TODO system:

### 4.1. Todo Management Tools

- **create_todo**
  - Description: Create a new todo item
  - Parameters:
    ```json
    {
      "title": "string (required)",
      "description": "string (optional)",
      "priority": "low|medium|high (default: medium)",
      "due_date": "ISO 8601 date string (optional)",
      "category_names": "array of strings (optional)"
    }
    ```

- **get_todos**
  - Description: Retrieve todos with optional filtering
  - Parameters:
    ```json
    {
      "status": "pending|in-progress|completed (optional)",
      "priority": "low|medium|high (optional)",
      "category_name": "string (optional)",
      "due_before": "ISO 8601 date string (optional)",
      "limit": "number (optional, default: 50)"
    }
    ```

- **update_todo**
  - Description: Update an existing todo
  - Parameters:
    ```json
    {
      "id": "number (required)",
      "title": "string (optional)",
      "description": "string (optional)",
      "status": "pending|in-progress|completed (optional)",
      "priority": "low|medium|high (optional)",
      "due_date": "ISO 8601 date string (optional)"
    }
    ```

- **delete_todo**
  - Description: Delete a todo by ID
  - Parameters:
    ```json
    {
      "id": "number (required)"
    }
    ```

### 4.2. Category Management Tools

- **create_category**
  - Description: Create a new category
  - Parameters:
    ```json
    {
      "name": "string (required)",
      "color": "hex color string (optional)"
    }
    ```

- **get_categories**
  - Description: Retrieve all categories
  - Parameters: None

- **assign_category**
  - Description: Assign a category to a todo
  - Parameters:
    ```json
    {
      "todo_id": "number (required)",
      "category_name": "string (required)"
    }
    ```

- **remove_category**
  - Description: Remove a category from a todo
  - Parameters:
    ```json
    {
      "todo_id": "number (required)",
      "category_name": "string (required)"
    }
    ```

### 4.3. Points & Rewards Tools

- **get_points**
  - Description: Get current total points
  - Parameters: None

- **ice_cream_finder**
  - Description: Find ice cream shops near an address (unlocked at 10 points)
  - Parameters:
    ```json
    {
      "address": "string (required)"
    }
    ```

## 5. API Endpoints

The server will expose standard HTTP endpoints alongside the MCP interface for potential web client integration:

### 5.1. MCP Endpoint

- **POST /mcp**
  - Description: Main MCP protocol endpoint for JSON-RPC communication
  - Handles all MCP tool calls and protocol messages

### 5.2. Health Check

- **GET /health**
  - Description: Health check endpoint
  - Returns server status and database connectivity

## 6. Implementation Details

### 6.1. MCP Server Configuration

The MCP server should be configured with:
- Server name: "todo-mcp-server"
- Version: "1.0.0"
- Proper error handling for database operations
- Input validation for all tool parameters
- Consistent response formatting

### 6.2. Database Operations

- Use Drizzle ORM for all database interactions
- Implement proper transaction handling for multi-table operations
- Add database indexes on frequently queried columns (status, due_date, priority)
- Handle foreign key constraints properly for category assignments

### 6.3. Data Validation

- Validate todo status values against allowed enum
- Validate priority levels against allowed enum
- Validate ISO 8601 date formats for due dates
- Sanitize and validate category names
- Implement proper error messages for validation failures

### 6.4. Points System Implementation

- Points are awarded automatically when a todo status changes to "completed"
- Point values: Low=1, Medium=3, High=5
- Points are stored in the user_points table and persist across sessions
- The ice_cream_finder tool checks point threshold (10 points) before execution
- OpenStreetMap integration uses Overpass API queries for ice cream shop data

## 7. Additional Notes

- The MCP server should handle concurrent requests safely
- Implement proper logging for debugging and monitoring
- Consider adding bulk operations for efficiency (bulk create, bulk update)
- The server should gracefully handle database connection issues
- All timestamps should be stored in UTC and converted as needed

## 8. Further Reading

Take inspiration from the project template here: https://github.com/fiberplane/create-honc-app/tree/main/templates/d1

For MCP server implementation patterns, refer to the MCP SDK documentation and @hono/mcp integration examples.