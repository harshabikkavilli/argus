#!/usr/bin/env node
/**
 * CLI Entry Point
 * Main command-line interface for Argus
 */

import chalk from 'chalk';
import {program} from 'commander';
import {handleDashboardCommand} from './commands/dashboard.js';
import {handleDiagnoseCommand} from './commands/diagnose.js';
import {handleSetupCommand} from './commands/setup.js';
import {handleStatsCommand} from './commands/stats.js';
import {handleWrapCommand} from './commands/wrap.js';

const VERSION = '1.0.0';

const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.magenta('👁️  Argus')} ${chalk.dim(
	'v' + VERSION
)}                                          ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.dim(
	'See, replay, test every MCP tool call'
)}                    ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

program
	.name('argus')
	.description('Debug, replay, and understand every MCP tool call')
	.version(VERSION);

// Dashboard command
program
	.command('dashboard')
	.description('Start the standalone web dashboard (without proxy)')
	.option('-p, --port <port>', 'Dashboard port', '3000')
	.option('-d, --db <path>', 'Database file path')
	.option('-c, --config <path>', 'Config file path')
	.action(handleDashboardCommand);

// Wrap command
program
	.command('wrap')
	.description('Wrap an MCP server to record all tool calls')
	.argument('<command>', 'The MCP server command to wrap')
	.argument('[args...]', 'Arguments for the MCP server command')
	.option('-d, --db <path>', 'Database file path')
	.option('-a, --api <url>', 'API server URL for SSE notifications')
	.option(
		'-t, --idle-timeout <seconds>',
		'Idle timeout before starting new run',
		'60'
	)
	.option('--redact <keys>', 'Additional keys to redact (comma-separated)')
	.option('--no-redact', 'Disable redaction entirely')
	.action(handleWrapCommand);

// Setup command
program
	.command('setup')
	.description('Generate configuration files')
	.option('--claude', 'Generate Claude Desktop config snippet')
	.option('--init', 'Create default argus.config.json')
	.option('-o, --output <path>', 'Output path for config file')
	.action(handleSetupCommand);

// Diagnose command
program
	.command('diagnose')
	.description('Diagnose Claude Desktop configuration')
	.action(handleDiagnoseCommand);

// Stats command
program
	.command('stats')
	.description('Show recording statistics')
	.option('-r, --run <id>', 'Filter by run ID')
	.action(handleStatsCommand);

// Parse arguments
program.parse();
