// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	site: 'https://randybias.github.io',
	base: '/tentacular-docs',
	integrations: [
		react(),
		starlight({
			title: 'Tentacular',
			favicon: '/favicon.png',
			components: {
				ThemeSelect: './src/components/EmptyThemeSelect.astro',
			},
			logo: {
				src: './src/assets/logo.png',
				alt: 'Tentacular',
			},
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/randybias/tentacular' }],
			editLink: {
				baseUrl: 'https://github.com/randybias/tentacular-docs/edit/main/',
			},
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Concepts',
					items: [
						{ label: 'Overview', slug: 'concepts/overview' },
						{ label: 'Architecture', slug: 'concepts/architecture' },
						{ label: 'Security', slug: 'concepts/security' },
						{ label: 'Exoskeleton', slug: 'concepts/exoskeleton' },
						{ label: 'Agent Skill', slug: 'concepts/agent-skill' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Quickstart', slug: 'guides/quickstart' },
						{ label: 'Your First Tentacle', slug: 'guides/first-tentacle' },
						{ label: 'Cluster Configuration', slug: 'guides/cluster-configuration' },
						{ label: 'MCP Server Setup', slug: 'guides/mcp-server-setup' },
						{ label: 'Multi-Tenancy & Access Control', slug: 'guides/authorization' },
						{ label: 'Exoskeleton Setup', slug: 'guides/exoskeleton-setup' },
						{ label: 'Scaffold Usage', slug: 'guides/catalog-usage' },
						{ label: 'Getting Started from a Scaffold', slug: 'guides/getting-started-from-scaffold' },
						{ label: 'Creating Custom Scaffolds', slug: 'guides/creating-custom-scaffolds' },
						{ label: 'Workspace Layout', slug: 'guides/workspace-layout' },
						{ label: 'Local Development', slug: 'guides/local-development' },
						{ label: 'Secrets', slug: 'guides/secrets' },
						{ label: 'Testing', slug: 'guides/testing' },
						{ label: 'gVisor Setup', slug: 'guides/gvisor-setup' },
						{ label: 'NATS + SPIFFE Setup', slug: 'guides/nats-spiffe-setup' },
						{ label: 'The Kraken Slack Bot', slug: 'guides/thekraken-slack-bot' },
					],
				},
				{
					label: 'Cookbook',
					items: [
						{ label: 'Deploy a Tentacle', slug: 'cookbook/deploy-tentacle' },
						{ label: 'Debug a Tentacle', slug: 'cookbook/debug-workflow' },
						{ label: 'Exoskeleton Provisioning', slug: 'cookbook/exoskeleton-provisioning' },
						{ label: 'Update a Tentacle', slug: 'cookbook/update-tentacle' },
						{ label: 'Cluster Setup', slug: 'cookbook/cluster-setup' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'CLI', slug: 'reference/cli' },
						{ label: 'Workflow Spec', slug: 'reference/workflow-spec' },
						{ label: 'Node Contract', slug: 'reference/node-contract' },
						{ label: 'MCP Tools', slug: 'reference/mcp-tools' },
						{ label: 'Glossary', slug: 'reference/glossary' },
						{
							label: 'Scaffold Quickstarts',
							autogenerate: { directory: 'reference/catalog' },
						},
					],
				},
				{
					label: 'ADRs',
					autogenerate: { directory: 'adr' },
				},
			],
		}),
	],
});
