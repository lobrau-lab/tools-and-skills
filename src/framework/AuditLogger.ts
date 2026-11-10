import { AuditEntry } from '../types';

export class AuditLogger {
  private logs: AuditEntry[] = [];

  log(entry: AuditEntry) {
    // Redact sensitive fields based on a simple rule for demo
    const redactedInput = { ...entry.input };
    if (redactedInput.password) redactedInput.password = '********';
    if (redactedInput.content && entry.toolName === 'notes_create') redactedInput.content = redactedInput.content.substring(0, 10) + '... (redacted)';

    this.logs.unshift({
      ...entry,
      input: redactedInput
    });
  }

  getLogs(): AuditEntry[] {
    return this.logs;
  }

  exportJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const globalAuditLogger = new AuditLogger();
