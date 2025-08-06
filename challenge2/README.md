# Week 2 challenge
The second week is all about Workflows and AI agents with [N8N](https://n8n.io/) and [Cloudflare Workers](https://developers.cloudflare.com/workers/). 

You can use your MCP server from [Fiberplane Codegen](https://fiberplane.com/codegen) from the first week to integrate with N8N and build workflows and AI agents. 
You can also start from scratch with a new Fiberplane Codegen project.

## Requirements
- Access to Fiberplane Codegen (Join [Fiberplane's Discord Server](https://discord.gg/ChRgXresZK) and drop your Github handle in the `#vibesummer-chat` channel to get access.)
- Access to N8N
  - You can join the [N8N's Cloud](https://app.n8n.cloud/) two weeks for free
  - You can also use [N8N self-hosted](https://docs.n8n.io/hosting/)

## Challenge Task
Connect your Cloudflare Worker/ MCP server to a N8N workflow or AI agent or both :) . Let N8N access your Worker's DB and create a workflow around your data or use Your MCP Server to trigger N8N workflows.

Easy way: 
- Use [N8N's webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) and trigger the webhook from your MCP server.
- Modify your Cloudflare Worker on Fiberplane Codegen to include a `/api/...` endpoint that you can connect via [N8N's http request node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/).

Harder way at own risk:
- Use [N8N's MCP client tool](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/) to connect to your MCP server. It is hard because N8N MCP client requieres SSE and your MCP client currently uses streamable http. Most likely you won't be able to use Fiberplane Codegen Chat for this and you need to import the code and work locally on it.


## Getting Started
N8N provides some templates to get you started quickly.
- How to build and [N8N AI agents](https://docs.n8n.io/advanced-ai/intro-tutorial/)
- How to build a [N8N Workflow](https://docs.n8n.io/try-it-out/tutorial-first-workflow/)

If you need to get started with Fiberplane Codegen and Cloudflare Workers have a look at [week 1 challenge](../challenge1/README.md) and the instructions to either use Codegen Chat or import the code and work locally on it.

## Submission
- A workflow or AI agent build with N8N
- Your MCP or backend API running on Cloudflare should connect to N8N
  - Webhooks
  - Http requests
  - (MCP client node)
- A short video max. 2 min walking through your workflow and code
- A link to your deployed MCP server/ backend API
- A few words about your N8N workflow
- A link to your Fiberplane Codegen Project
- (Optional): a link to a github repo
- Use [this form](https://forms.gle/qJja1E5ubwmWnvA1A) to submit your challenge


## Questions?
Join Fiberplane's Discord server and the `#vibesummer-chat` channel to ask your questions or exchange ideas with fellow attendees
