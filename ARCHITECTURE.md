# Tool And Skills Framework Kit - Architecture

## Core Components

### 1. Tool Registry (`src/framework/ToolRegistry.ts`)
The central authority for all available skills.
- **Registration**: Tools are registered with a name and a full definition including JSON schemas for inputs and outputs.
- **Validation**: Uses `ajv` to ensure incoming requests match the tool's expected schema before execution.
- **Execution**: Handles timeouts and standardized error reporting. Emits events for lifecycle tracking.

### 2. Policy Engine (`src/framework/PolicyEngine.ts`)
The security layer that evaluates every request before it reaches a tool.
- **Permission Check**: Verifies if the tool's required permissions are currently granted.
- **Risk Assessment**: Considers the tool's `risk_level` (low, medium, high).
- **Context Awareness**: Factors in the `userMode` (Safe vs Standard) and the `requestCategory` (e.g., Personal Data, System Control).
- **Decisions**: Returns `allow`, `deny`, or `require_confirmation`.

### 3. Audit Logger (`src/framework/AuditLogger.ts`)
An immutable record of all framework activity.
- **Redaction**: Automatically redacts sensitive fields (like note content or passwords) based on tool-specific rules.
- **Traceability**: Captures the full context of the request, the policy decision, and the final execution result.

## Execution Flow

1. **Request**: A structured JSON request is received (Tool Name + Arguments).
2. **Lookup**: The Registry finds the tool definition.
3. **Policy Evaluation**: The Policy Engine checks permissions and risk.
4. **Interactive Step**: If `require_confirmation` is returned, the UI prompts the user.
5. **Validation**: The Registry validates the arguments against the Tool's Input Schema.
6. **Execution**: The Tool's handler is invoked with a timeout.
7. **Logging**: The Audit Logger records the entire transaction.
8. **Response**: The result is returned to the caller.

## Security Model
- **Default Deny**: Tools requiring permissions that aren't granted are denied by default.
- **Safe Mode**: High-risk tools are automatically blocked when Safe Mode is active.
- **Redaction**: Logs are sanitized to prevent leaking personal data.
