import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ToolDefinition, ToolEvent } from '../types';

const ajv = new Ajv();
addFormats(ajv);

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private listeners: ((event: ToolEvent) => void)[] = [];

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string) {
    this.tools.delete(name);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  addEventListener(listener: (event: ToolEvent) => void) {
    this.listeners.push(listener);
  }

  private emit(event: ToolEvent) {
    this.listeners.forEach(l => l(event));
  }

  async execute(name: string, input: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    this.emit({ type: 'tool_called', toolName: name, timestamp: new Date().toISOString(), data: input });

    // Validate input
    const validate = ajv.compile(tool.input_schema);
    if (!validate(input)) {
      const error = ajv.errorsText(validate.errors);
      this.emit({ type: 'tool_failed', toolName: name, timestamp: new Date().toISOString(), data: error });
      throw new Error(`Invalid input for tool ${name}: ${error}`);
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Tool ${name} timed out after ${tool.timeout_ms}ms`)), tool.timeout_ms)
      );

      const result = await Promise.race([
        tool.handler(input),
        timeoutPromise
      ]);

      this.emit({ type: 'tool_succeeded', toolName: name, timestamp: new Date().toISOString(), data: result });
      return result;
    } catch (err: any) {
      this.emit({ type: 'tool_failed', toolName: name, timestamp: new Date().toISOString(), data: err.message });
      throw err;
    }
  }
}

export const globalRegistry = new ToolRegistry();
