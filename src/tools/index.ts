import { ToolDefinition } from '../types';

// Mock Data
const MOCK_CALENDAR = [
  { id: '1', title: 'Team Sync', start: '2026-02-24T14:00:00Z', end: '2026-02-24T15:00:00Z' },
  { id: '2', title: 'Lunch with Sarah', start: '2026-02-25T12:00:00Z', end: '2026-02-25T13:00:00Z' },
];

const MOCK_NOTES: { content: string; tags: string[] }[] = [
  { content: 'Buy milk and eggs', tags: ['shopping', 'todo'] },
  { content: 'Project Alpha deadline is Friday', tags: ['work', 'urgent'] },
];

const SMART_HOME_STATE: Record<string, any> = {
  'living_room_light': { status: 'off', brightness: 0 },
  'thermostat': { temperature: 72, mode: 'cool' },
};

export const defaultTools: ToolDefinition[] = [
  {
    name: 'timer_set',
    description: 'Set a timer for a specific duration',
    version: '1.0.0',
    risk_level: 'low',
    required_permissions: [],
    timeout_ms: 2000,
    input_schema: {
      type: 'object',
      properties: {
        duration_seconds: { type: 'integer', minimum: 1 },
        label: { type: 'string' }
      },
      required: ['duration_seconds']
    },
    output_schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        message: { type: 'string' }
      }
    },
    handler: async (input) => {
      return { status: 'success', message: `Timer set for ${input.duration_seconds} seconds: ${input.label || 'No label'}` };
    }
  },
  {
    name: 'notes_create',
    description: 'Create a new note',
    version: '1.0.0',
    risk_level: 'medium',
    required_permissions: ['personal_data'],
    timeout_ms: 2000,
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['content']
    },
    output_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' }
      }
    },
    handler: async (input) => {
      MOCK_NOTES.push(input);
      return { id: Math.random().toString(36).substr(2, 9), status: 'created' };
    }
  },
  {
    name: 'search_web',
    description: 'Search the web for information',
    version: '1.0.0',
    risk_level: 'low',
    required_permissions: ['network'],
    timeout_ms: 5000,
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        safe_search: { type: 'boolean', default: true }
      },
      required: ['query']
    },
    output_schema: {
      type: 'object',
      properties: {
        results: { type: 'array', items: { type: 'object' } }
      }
    },
    handler: async (input) => {
      return {
        results: [
          { title: `Result for ${input.query}`, url: 'https://example.com/1' },
          { title: `Another result for ${input.query}`, url: 'https://example.com/2' }
        ]
      };
    }
  },
  {
    name: 'calendar_list',
    description: 'List calendar events for a date range',
    version: '1.0.0',
    risk_level: 'medium',
    required_permissions: ['calendar'],
    timeout_ms: 3000,
    input_schema: {
      type: 'object',
      properties: {
        range_start: { type: 'string', format: 'date-time' },
        range_end: { type: 'string', format: 'date-time' }
      },
      required: ['range_start', 'range_end']
    },
    output_schema: {
      type: 'array',
      items: { type: 'object' }
    },
    handler: async () => {
      return MOCK_CALENDAR;
    }
  },
  {
    name: 'smart_home_command',
    description: 'Send a command to a smart home device',
    version: '1.0.0',
    risk_level: 'high',
    required_permissions: ['smart_home'],
    timeout_ms: 5000,
    input_schema: {
      type: 'object',
      properties: {
        device: { type: 'string' },
        action: { type: 'string' },
        value: { type: 'any' }
      },
      required: ['device', 'action']
    },
    output_schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        newState: { type: 'object' }
      }
    },
    handler: async (input) => {
      if (!SMART_HOME_STATE[input.device]) {
        SMART_HOME_STATE[input.device] = {};
      }
      SMART_HOME_STATE[input.device][input.action] = input.value;
      return { success: true, newState: SMART_HOME_STATE[input.device] };
    }
  },
  {
    name: 'app_launch',
    description: 'Launch a local application',
    version: '1.0.0',
    risk_level: 'high',
    required_permissions: ['system_control'],
    timeout_ms: 2000,
    input_schema: {
      type: 'object',
      properties: {
        app_name: { type: 'string' }
      },
      required: ['app_name']
    },
    output_schema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        status: { type: 'string' }
      }
    },
    handler: async (input) => {
      return { command: `open -a "${input.app_name}"`, status: 'simulated' };
    }
  }
];
