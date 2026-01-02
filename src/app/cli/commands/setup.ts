/**
 * Setup command - Generate configuration files
 */

import chalk from 'chalk';
import {existsSync} from 'fs';
import {join} from 'path';
import {
	createDefaultConfig,
	getClaudeDesktopConfigPath,
	generateClaudeDesktopConfig,
	loadConfig,
	getDefaultDbPath
} from '../../../config/index.js';

const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.magenta('👁️  Argus')} ${chalk.dim('v1.0.0')}                                         ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.dim('See, replay, test every MCP tool call')}                     ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

export async function handleSetupCommand(options: {
	claude?: boolean;
	init?: boolean;
	output?: string;
}): Promise<void> {
	console.log(banner);

	if (options.init) {
		const configPath = createDefaultConfig(options.output);
		console.log(chalk.green('✓ Created config file:'), configPath);
		console.log(chalk.dim('\nEdit this file to configure your MCP servers.\n'));
		return;
	}

	if (options.claude) {
		console.log(chalk.bold('📋 Claude Desktop Configuration\n'));

		const config = await loadConfig();
		const inspectorPath = process.cwd();
		const dbPath = config.database || getDefaultDbPath();

		// If servers are configured, generate wrapped config
		if (config.servers && Object.keys(config.servers).length > 0) {
			const claudeConfig = generateClaudeDesktopConfig(
				config.servers,
				inspectorPath,
				dbPath
			);

			console.log(chalk.dim('Add this to your claude_desktop_config.json:\n'));
			console.log(chalk.cyan(JSON.stringify(claudeConfig, null, 2)));
		} else {
			// Show example
			console.log(chalk.dim('Add this to your claude_desktop_config.json:\n'));

			const exampleConfig = {
				mcpServers: {
					'your-server': {
						command: 'npx',
						args: [
							'tsx',
							join(inspectorPath, 'src/cli.ts'),
							'wrap',
							'--db',
							dbPath,
							'--',
							'npx',
							'-y',
							'@modelcontextprotocol/server-filesystem',
							'/tmp'
						]
					}
				}
			};

			console.log(chalk.cyan(JSON.stringify(exampleConfig, null, 2)));
		}

		const configPath = getClaudeDesktopConfigPath();
		console.log(chalk.dim(`\nClaude config location: ${configPath}`));

		// Check if file exists
		if (existsSync(configPath)) {
			console.log(chalk.green('✓ Config file exists'));
		} else {
			console.log(
				chalk.yellow('⚠️  Config file not found - Claude Desktop may not be installed')
			);
		}

		console.log(chalk.dim('\nThen run the dashboard separately:'));
		console.log(chalk.cyan('  npx tsx src/cli.ts dashboard\n'));
		return;
	}

	// Show help
	console.log(chalk.bold('Available setup options:\n'));
		console.log(chalk.cyan('  --init'), chalk.dim('   Create default argus.config.json'));
	console.log(chalk.cyan('  --claude'), chalk.dim(' Generate Claude Desktop config snippet'));
	console.log();
}

