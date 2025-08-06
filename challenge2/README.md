# Week 2 challenge
The second week is all about Workflows and AI agents with [n8n](https://n8n.io/) and [Cloudflare Workers](https://developers.cloudflare.com/workers/). 

You can use your MCP server from [Fiberplane Codegen](https://fiberplane.com/codegen) from the first week to integrate with n8n and build workflows and AI agents. 
You can also start from scratch with a new Fiberplane Codegen project.

## Requirements
- Access to Fiberplane Codegen (Join [Fiberplane's Discord Server](https://discord.gg/ChRgXresZK) and drop your Github handle in the `#vibesummer-chat` channel to get access.)
- Access to n8n
  - You can join the [n8n's Cloud](https://app.n8n.cloud/) two weeks for free
  - You can also use [n8n self-hosted](https://docs.n8n.io/hosting/)

## Challenge Task
Connect your Cloudflare Worker/ MCP server to a n8n workflow or AI agent or both :) . Let n8n access your Worker's DB and create a workflow around your data or use Your MCP Server to trigger n8n workflows.

Easy way: 
- Use [n8n's webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) and trigger the webhook from your MCP server.
- Modify your Cloudflare Worker on Fiberplane Codegen to include a `/api/...` endpoint that you can connect via [n8n's http request node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/).

Harder way at own risk:
- Use [n8n's MCP client tool](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/) to connect to your MCP server. It is hard because n8n MCP client requieres SSE and your MCP client currently uses streamable http. Most likely you won't be able to use Fiberplane Codegen Chat for this and you need to import the code and work locally on it.


## Getting Started
n8n provides some templates to get you started quickly.
- How to build and [n8n AI agents](https://docs.n8n.io/advanced-ai/intro-tutorial/)
- How to build a [n8n Workflow](https://docs.n8n.io/try-it-out/tutorial-first-workflow/)

If you need to get started with Fiberplane Codegen and Cloudflare Workers have a look at [week 1 challenge](../challenge1/README.md) and the instructions to either use Codegen Chat or import the code and work locally on it.

## Submission
- A workflow or AI agent build with n8n
- Your MCP or backend API running on Cloudflare should connect to n8n
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
