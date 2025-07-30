# Week 1 Challenge
The first week is all about getting familiar with [Cloudflare Workers](https://developers.cloudflare.com/workers/) and [Fiberplane Codegen](https://fiberplane.com/codegen). 

You will use Fiberplane Codegen to initital build an MCP server and then it is up to you if you like to keep changing your code using the Fiberplane Codegen Chat or import the code and work locally on it. 

## Requirements
- Access to Fiberplane Codegen (Join [Fiberplane's Discord Server](https://discord.gg/ChRgXresZK) and drop your Github handle in the `#vibesummer-chat` channel to get access.)
### For local development
- Node.js
- IDE of your choice
- Js Package Manager (npm, pnpm, yarn, bun, ...)
- A [Cloudflare Account](https://dash.cloudflare.com/login) for the deployment

## Challenge Task
Build an MCP server that does your job so you can enjoy your summer vacations :) . Jokes aside build an MCP server that helps you to be more productive. That can include tools to manage your calendar but also tools to set you with music in the right productive mood.

- MCP Server has to run on Cloudflare
- MCP Server should at least include 3 tools
- We should be able to connect to your MCP via URL, so it should be deployed on Cloudflare


## Getting Started
Use Fiberplane Codegen for the initial setup. Afterwards it is up to you if you like to finetune the MCP server in the Fiberplane Codegen Chat or import the code and work locally on it. 

### 1. Quick Start with Codegen Chat
Use Fiberplane Codegen throughout the whole building process. You can prompt the chat for code changes. 
If you have any API keys or other sensitive information, you can pass them as enviroment variables to the codegen platform using the key symbol in the right top menue bar. 

### 2. Local Development SetUp

If you prefer to work locally, you can import the code from the Fiberplane Codegen platform and work on it locally. 
- Make sure to install all depencies (e.g. ``pnpm install``)
- If you have any API Keys/ Secrets make sure to include them in a `.dev.vars` file.
- Make sure to generate and migrate the Database tables if the generated code includes a database (e.g. ``pnpm run db:setup`)
- You can start the MCP server locally with (e.g. ``pnpm dev``)
- Use the MCP Inspector to test your local MCP server (e.g.: ``npx @modelcontextprotocol/inspector``)
- Navigate to http://localhost:8080/fp to access Fiberplane's Hono API playground

**Deployment**
- Create a [Cloudflare Account](https://dash.cloudflare.com/login)
- Make sure to follow the instruction to [set up D1 for production](https://github.com/fiberplane/create-honc-app/blob/main/templates/d1/README.md#commands-for-deployment)
- ``pnpm run deploy``
- hand in any API Keys/ Secrets via ``wrangler secret put <SECRET_NAME>``


## Submission
- A link to your deployed MCP server
- A few words about your MCP server
- A link to your Fiberplane Codegen Project
- (Optional): a link to a github repo
- Use [this form](https://forms.gle/MyQs9nFZ6WEeRoNL6) to submit your challenge


## Questions?
Join Fiberplane's Discord server and the `#vibesummer-chat` channel to ask your questions or exchange ideas with fellow attendees
