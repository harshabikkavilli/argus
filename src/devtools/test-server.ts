// Simple test MCP server with example tools for testing MCP Inspector
import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
	{
		name: 'test-mcp-server',
		version: '1.0.0'
	},
	{
		capabilities: {
			tools: {}
		}
	}
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: 'calculate',
				description: 'Perform basic math operations',
				inputSchema: {
					type: 'object' as const,
					properties: {
						operation: {
							type: 'string',
							enum: ['add', 'subtract', 'multiply', 'divide'],
							description: 'Math operation to perform'
						},
						a: {
							type: 'number',
							description: 'First number'
						},
						b: {
							type: 'number',
							description: 'Second number'
						}
					},
					required: ['operation', 'a', 'b']
				}
			},
			{
				name: 'get_weather',
				description: 'Get weather for a city (mock data)',
				inputSchema: {
					type: 'object' as const,
					properties: {
						city: {
							type: 'string',
							description: 'City name'
						}
					},
					required: ['city']
				}
			},
			{
				name: 'slow_operation',
				description: 'Simulates a slow operation for testing latency tracking',
				inputSchema: {
					type: 'object' as const,
					properties: {
						delay_ms: {
							type: 'number',
							description: 'How long to delay in milliseconds'
						}
					},
					required: ['delay_ms']
				}
			},
			{
				name: 'random_failure',
				description:
					'Randomly fails ~50% of the time - useful for testing error tracking',
				inputSchema: {
					type: 'object' as const,
					properties: {
						message: {
							type: 'string',
							description: 'Optional message to include'
						}
					}
				}
			},
			{
				name: 'always_fail',
				description:
					'Always throws an error - useful for testing error handling',
				inputSchema: {
					type: 'object' as const,
					properties: {
						error_type: {
							type: 'string',
							enum: ['validation', 'timeout', 'permission', 'not_found'],
							description: 'Type of error to simulate'
						}
					},
					required: ['error_type']
				}
			},
			{
				name: 'echo',
				description:
					'Echoes back the input - useful for testing params recording',
				inputSchema: {
					type: 'object' as const,
					properties: {
						data: {
							type: 'object',
							description: 'Any JSON data to echo back'
						}
					},
					required: ['data']
				}
			}
		]
	};
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const {name, arguments: args} = request.params;

	switch (name) {
		case 'calculate': {
			const {operation, a, b} = args as {
				operation: string;
				a: number;
				b: number;
			};
			let result: number;

			switch (operation) {
				case 'add':
					result = a + b;
					break;
				case 'subtract':
					result = a - b;
					break;
				case 'multiply':
					result = a * b;
					break;
				case 'divide':
					if (b === 0) {
						throw new Error('Division by zero');
					}
					result = a / b;
					break;
				default:
					throw new Error(`Unknown operation: ${operation}`);
			}

			return {
				content: [
					{
						type: 'text',
						text: `Result: ${a} ${operation} ${b} = ${result}`
					}
				]
			};
		}

		case 'get_weather': {
			const {city} = args as {city: string};

			// Mock weather data
			const conditions = [
				'sunny',
				'cloudy',
				'rainy',
				'partly cloudy',
				'stormy'
			];
			const weather = {
				city,
				temperature: Math.floor(Math.random() * 30) + 10,
				condition: conditions[Math.floor(Math.random() * conditions.length)],
				humidity: Math.floor(Math.random() * 40) + 40,
				wind_mph: Math.floor(Math.random() * 20) + 5
			};

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(weather, null, 2)
					}
				]
			};
		}

		case 'slow_operation': {
			const {delay_ms} = args as {delay_ms: number};
			const clampedDelay = Math.min(Math.max(delay_ms, 0), 30000); // Cap at 30s
			await new Promise((resolve) => setTimeout(resolve, clampedDelay));

			return {
				content: [
					{
						type: 'text',
						text: `Completed after ${clampedDelay}ms delay`
					}
				]
			};
		}

		case 'random_failure': {
			const {message} = (args as {message?: string}) || {};

			if (Math.random() < 0.5) {
				throw new Error(
					`Random failure occurred${message ? `: ${message}` : ''}`
				);
			}

			return {
				content: [
					{
						type: 'text',
						text: `Success! ${message || 'The coin flip was in your favor.'}`
					}
				]
			};
		}

		case 'always_fail': {
			const {error_type} = args as {error_type: string};

			const errors: Record<string, string> = {
				validation: "Invalid input: required field 'foo' is missing",
				timeout: 'Operation timed out after 30000ms',
				permission:
					'Permission denied: insufficient privileges for this operation',
				not_found: 'Resource not found: the requested item does not exist'
			};

			throw new Error(
				errors[error_type] || `Unknown error type: ${error_type}`
			);
		}

		case 'echo': {
			const {data} = args as {data: unknown};

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify({echoed: data, timestamp: Date.now()}, null, 2)
					}
				]
			};
		}

		default:
			throw new Error(`Unknown tool: ${name}`);
	}
});

// Start server
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error(
		'Test MCP server started with tools: calculate, get_weather, slow_operation, random_failure, always_fail, echo'
	);
}

main().catch(console.error);
