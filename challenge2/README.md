# Week 2 challenge
The second week is all about Workflows and AI agents with [n8n](https://n8n.io/) and [Cloudflare Workers](https://developers.cloudflare.com/workers/). 

You can use your MCP server from week 1's [Fiberplane Codegen](https://fiberplane.com/codegen) to integrate with n8n and build workflows and AI agents. 
You can also start from scratch with a new Fiberplane Codegen project.

## Requirements
- Access to Fiberplane Codegen (Join [Fiberplane's Discord Server](https://discord.gg/ChRgXresZK) and drop your Github handle in the `#vibesummer-chat` channel to get access.)
- Access to n8n
  - You can join [n8n Cloud](https://app.n8n.cloud/) for two weeks for free
  - You can also use [n8n self-hosted](https://docs.n8n.io/hosting/)

## Challenge Task
Connect your Cloudflare Worker or MCP server to an n8n workflow, AI agent, or both :). You can either:
- Let n8n access your Worker's database to create workflows with your data
- Use your MCP Server to trigger n8n workflows

Three different ways to connect to n8n:
- Use [n8n's webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) to receive triggers from your MCP server
- Create an `/api/...` endpoint in your Cloudflare Worker that can be called by [n8n's HTTP request node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- Use [n8n's MCP client tool](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/) to connect directly to your MCP server

## Getting Started
n8n provides templates to help you get started:
- [Build AI agents with n8n](https://docs.n8n.io/advanced-ai/intro-tutorial/)
- [Create your first n8n workflow](https://docs.n8n.io/try-it-out/tutorial-first-workflow/)

If you're new to Fiberplane Codegen and Cloudflare Workers, check out the [week 1 challenge](../challenge1/README.md) for instructions on using Codegen Chat or working with the code locally.

Make sure to watch [the recording](https://www.youtube.com/watch?v=i67VbnxSX2I&t=2s) of the live stream where Max provides a Demo of the n8n AI agent and the workflow.

## Submission
Submit your challenge using [this form](https://forms.gle/qJja1E5ubwmWnvA1A) with the following:
- A workflow or AI agent built with n8n
- Your MCP or backend API running on Cloudflare, connected to n8n via:
  - Webhooks
  - HTTP requests
  - (MCP client node)
- A short video (max 2 min) walking through your workflow and code
- A link to your deployed MCP server/backend API
- A few words about your n8n workflow
- A link to your Fiberplane Codegen Project
- (Optional) A link to your GitHub repo

### Deadlines
- Deadline for the challenge prize, Wednesday, August 21st, 2025, 11:59 PM (PT)
- You can submit challenges after the deadline to unlock items for the final swag bag until the end of Vibe Summer (August 28th, 2025, 11:59 PM (PT))


## Questions?
Join Fiberplane's Discord server and the `#vibesummer-chat` channel to ask your questions or exchange ideas with fellow attendees
