
export type RiskLevel = 'low' | 'medium' | 'high';

export type Permission = 
  | 'mic' 
  | 'files' 
  | 'calendar' 
  | 'network' 
  | 'smart_home' 
  | 'system_control'
  | 'personal_data';

export type PolicyDecision = 'allow' | 'deny' | 'require_confirmation' | 'require_elevation';

export interface ToolDefinition {
  name: string;
  description: string;
  version: string;
  input_schema: any;
  output_schema: any;
  required_permissions: Permission[];
  risk_level: RiskLevel;
  timeout_ms: number;
  handler: (input: any) => Promise<any>;
}

export interface RequestContext {
  category: 'system_control' | 'personal_data' | 'purchases' | 'risky_actions' | 'general';
  userMode: 'safe' | 'standard';
  timestamp: string;
}

export interface PolicyResult {
  decision: PolicyDecision;
  reason: string;
  userPrompt?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  toolName: string;
  input: any;
  output?: any;
  error?: string;
  policyResult: PolicyResult;
  context: RequestContext;
}

export interface ToolEvent {
  type: 'tool_called' | 'tool_succeeded' | 'tool_failed';
  toolName: string;
  timestamp: string;
  data?: any;
}
