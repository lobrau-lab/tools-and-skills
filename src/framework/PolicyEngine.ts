import { Permission, PolicyResult, RequestContext, ToolDefinition, RiskLevel } from '../types';

export class PolicyEngine {
  private grantedPermissions: Set<Permission> = new Set();

  constructor(initialPermissions: Permission[] = []) {
    initialPermissions.forEach(p => this.grantedPermissions.add(p));
  }

  grantPermission(permission: Permission) {
    this.grantedPermissions.add(permission);
  }

  revokePermission(permission: Permission) {
    this.grantedPermissions.delete(permission);
  }

  isPermissionGranted(permission: Permission): boolean {
    return this.grantedPermissions.has(permission);
  }

  evaluate(tool: ToolDefinition, context: RequestContext): PolicyResult {
    // 1. Check for missing permissions
    const missingPermissions = tool.required_permissions.filter(p => !this.grantedPermissions.has(p));
    
    if (missingPermissions.length > 0) {
      return {
        decision: 'deny',
        reason: `Missing required permissions: ${missingPermissions.join(', ')}`
      };
    }

    // 2. High risk tools in safe mode
    if (context.userMode === 'safe' && tool.risk_level === 'high') {
      return {
        decision: 'deny',
        reason: 'High risk tools are disabled in Safe Mode.'
      };
    }

    // 3. Risky categories require confirmation
    if (context.category === 'risky_actions' || context.category === 'system_control' || tool.risk_level === 'high') {
      return {
        decision: 'require_confirmation',
        reason: `This action is categorized as ${context.category} and involves a ${tool.risk_level} risk tool.`,
        userPrompt: `Are you sure you want to run ${tool.name}? This tool has ${tool.risk_level} risk and requires ${tool.required_permissions.join(', ') || 'no'} permissions.`
      };
    }

    // 4. Personal data category
    if (context.category === 'personal_data' && tool.risk_level === 'medium') {
      return {
        decision: 'require_confirmation',
        reason: 'Accessing personal data with a medium risk tool.',
        userPrompt: `Allow ${tool.name} to access your personal data?`
      };
    }

    // 5. Default allow for low risk
    return {
      decision: 'allow',
      reason: 'Tool meets all safety criteria for automatic execution.'
    };
  }
}

export const globalPolicyEngine = new PolicyEngine([
  'mic', 'files', 'calendar', 'network', 'smart_home' // Default some permissions for demo
]);
