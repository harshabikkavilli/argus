#!/usr/bin/env node
/**
 * Test client for making MCP tool calls
 *
 * Usage:
 *   # Call a tool on the test server (run demo first in another terminal)
 *   npx tsx src/testClient.ts calculate '{"operation": "add", "a": 5, "b": 3}'
 *
 *   # Or connect to any MCP server
 *   npx tsx src/testClient.ts --server "npx tsx src/testServer.ts" get_weather '{"city": "Tokyo"}'
 */

import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import chalk from 'chalk';

async function main() {
	const args = process.argv.slice(2);

	// Parse --server option
	let serverCommand = 'npx';
	let serverArgs = ['tsx', 'src/testServer.ts'];

	if (args[0] === '--server' && args[1]) {
		const fullCommand = args[1].split(' ');
		serverCommand = fullCommand[0];
		serverArgs = fullCommand.slice(1);
		args.splice(0, 2); // Remove --server and its value
	}

	// Check for --proxy flag to go through the inspector
	let useProxy = false;
	if (args[0] === '--proxy') {
		useProxy = true;
		args.shift();
	}

	if (args.length === 0) {
		console.log(
			chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║  MCP Test Client - Make tool calls from the command line     ║
╚══════════════════════════════════════════════════════════════╝
`)
		);
		console.log(chalk.bold('Usage:\n'));
		console.log(
			chalk.dim('  # List available tools:'),
			'\n  npx tsx src/testClient.ts\n'
		);
		console.log(
			chalk.dim('  # Call a tool:'),
			"\n  npx tsx src/testClient.ts <tool-name> '<json-params>'\n"
		);
		console.log(
			chalk.dim('  # Go through proxy (to record in inspector):'),
			"\n  npx tsx src/testClient.ts --proxy <tool-name> '<json-params>'\n"
		);
		console.log(chalk.bold('Examples:\n'));
		console.log(
			chalk.green(
				'  npx tsx src/testClient.ts calculate \'{"operation": "add", "a": 5, "b": 3}\''
			)
		);
		console.log(
			chalk.green(
				'  npx tsx src/testClient.ts get_weather \'{"city": "Tokyo"}\''
			)
		);
		console.log(
			chalk.green(
				'  npx tsx src/testClient.ts slow_operation \'{"delay_ms": 1000}\''
			)
		);
		console.log(
			chalk.green(
				'  npx tsx src/testClient.ts always_fail \'{"error_type": "timeout"}\''
			)
		);
		console.log();

		// Still connect and list tools
		args.push('--list');
	}

	// Modify command if using proxy
	if (useProxy) {
		// Proxy mode removed - use 'wrap' command instead
		console.error(
			chalk.yellow('⚠️  Proxy mode is no longer supported in testClient.')
		);
		console.error(chalk.dim('Use the wrap command instead:'));
		console.error(
			chalk.cyan(
				`  mcp-inspector wrap ${serverCommand} ${serverArgs.join(' ')}`
			)
		);
		process.exit(1);
	}

	console.log(
		chalk.dim(`Connecting to: ${serverCommand} ${serverArgs.join(' ')}\n`)
	);

	// Create transport and client
	const transport = new StdioClientTransport({
		command: serverCommand,
		args: serverArgs
	});

	const client = new Client(
		{
			name: 'mcp-test-client',
			version: '1.0.0'
		},
		{
			capabilities: {}
		}
	);

	try {
		await client.connect(transport);
		console.log(chalk.green('✓ Connected to MCP server\n'));

		// List tools
		const {tools} = await client.listTools();

		if (args[0] === '--list' || args.length === 0) {
			console.log(chalk.bold('Available tools:\n'));
			for (const tool of tools) {
				console.log(chalk.cyan(`  ${tool.name}`));
				console.log(chalk.dim(`    ${tool.description}`));
				if (tool.inputSchema?.properties) {
					const props = Object.keys(tool.inputSchema.properties as object);
					console.log(chalk.dim(`    params: ${props.join(', ')}`));
				}
				console.log();
			}
			await client.close();
			return;
		}

		// Parse tool name and arguments
		const toolName = args[0];
		const toolArgs = args[1] ? JSON.parse(args[1]) : {};

		// Verify tool exists
		const tool = tools.find((t) => t.name === toolName);
		if (!tool) {
			console.error(
				chalk.red(`✗ Unknown tool: ${toolName}`),
				chalk.dim(`\nAvailable: ${tools.map((t) => t.name).join(', ')}`)
			);
			await client.close();
			process.exit(1);
		}

		console.log(chalk.yellow('→ Calling:'), chalk.cyan(toolName));
		console.log(chalk.yellow('→ Params:'), JSON.stringify(toolArgs, null, 2));
		console.log();

		const startTime = Date.now();

		try {
			const result = await client.callTool({
				name: toolName,
				arguments: toolArgs
			});

			const latency = Date.now() - startTime;

			console.log(chalk.green(`✓ Success`), chalk.dim(`(${latency}ms)`));
			console.log(chalk.bold('\nResult:'));

			if (result.content) {
				for (const item of result.content as Array<{
					type: string;
					text?: string;
				}>) {
					if (item.type === 'text' && item.text) {
						console.log(chalk.white(item.text));
					} else {
						console.log(JSON.stringify(item, null, 2));
					}
				}
			} else {
				console.log(JSON.stringify(result, null, 2));
			}
		} catch (error: unknown) {
			const latency = Date.now() - startTime;
			const errorMsg = error instanceof Error ? error.message : String(error);

			console.log(chalk.red(`✗ Error`), chalk.dim(`(${latency}ms)`));
			console.log(chalk.red(errorMsg));
		}

		await client.close();
	} catch (error: unknown) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.error(chalk.red('Failed to connect:'), errorMsg);
		process.exit(1);
	}
}

main();
