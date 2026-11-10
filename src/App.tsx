/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Activity, 
  Settings, 
  Play, 
  History, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronRight,
  Download,
  Lock,
  Unlock,
  Terminal,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { globalRegistry } from './framework/ToolRegistry';
import { globalPolicyEngine } from './framework/PolicyEngine';
import { globalAuditLogger } from './framework/AuditLogger';
import { defaultTools } from './tools';
import { ToolDefinition, RequestContext, AuditEntry, PolicyResult, Permission } from './types';
import { cn } from './lib/utils';

// Initialize tools
defaultTools.forEach(tool => globalRegistry.register(tool));

const TABS = [
  { id: 'explorer', label: 'Tool Explorer', icon: Search },
  { id: 'simulator', label: 'Policy Simulator', icon: Shield },
  { id: 'runner', label: 'Assistant Runner', icon: Play },
  { id: 'audit', label: 'Audit Log', icon: History },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('explorer');
  const [userMode, setUserMode] = useState<'safe' | 'standard'>('standard');
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [testInput, setTestInput] = useState<string>('{}');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [runnerRequest, setRunnerRequest] = useState({
    tool_name: 'timer_set',
    tool_args: { duration_seconds: 30, label: 'Coffee' },
    request_category: 'general' as RequestContext['category']
  });
  const [runnerTrace, setRunnerTrace] = useState<any[]>([]);

  useEffect(() => {
    setLogs(globalAuditLogger.getLogs());
  }, []);

  const tools = useMemo(() => globalRegistry.listTools(), []);

  const handleRunTool = async (tool: ToolDefinition, input: any, category: RequestContext['category']) => {
    const context: RequestContext = {
      category,
      userMode,
      timestamp: new Date().toISOString()
    };

    const policyResult = globalPolicyEngine.evaluate(tool, context);
    
    const auditEntry: AuditEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: context.timestamp,
      toolName: tool.name,
      input,
      policyResult,
      context
    };

    if (policyResult.decision === 'deny') {
      auditEntry.error = policyResult.reason;
      globalAuditLogger.log(auditEntry);
      setLogs([...globalAuditLogger.getLogs()]);
      return { success: false, ...policyResult };
    }

    if (policyResult.decision === 'require_confirmation') {
      const confirmed = window.confirm(policyResult.userPrompt || 'Confirm action?');
      if (!confirmed) {
        auditEntry.error = 'User cancelled confirmation';
        globalAuditLogger.log(auditEntry);
        setLogs([...globalAuditLogger.getLogs()]);
        return { success: false, decision: 'cancelled', reason: 'User denied confirmation' };
      }
    }

    try {
      const result = await globalRegistry.execute(tool.name, input);
      auditEntry.output = result;
      globalAuditLogger.log(auditEntry);
      setLogs([...globalAuditLogger.getLogs()]);
      return { success: true, result };
    } catch (error: any) {
      auditEntry.error = error.message;
      globalAuditLogger.log(auditEntry);
      setLogs([...globalAuditLogger.getLogs()]);
      return { success: false, error: error.message };
    }
  };

  const handleRunnerSubmit = async () => {
    const tool = globalRegistry.getTool(runnerRequest.tool_name);
    if (!tool) return;

    setRunnerTrace([]);
    const trace: any[] = [];
    
    trace.push({ step: 'Validation', status: 'pending', details: 'Checking tool registry and input schema...' });
    setRunnerTrace([...trace]);

    // Simulate delay for visual effect
    await new Promise(r => setTimeout(r, 500));

    const result = await handleRunTool(tool, runnerRequest.tool_args, runnerRequest.request_category);
    
    trace[0].status = 'success';
    trace.push({ 
      step: 'Policy Engine', 
      status: result.success || result.decision === 'require_confirmation' ? 'success' : 'error',
      details: result.reason || 'Allowed'
    });
    
    if (result.success) {
      trace.push({ step: 'Execution', status: 'success', details: JSON.stringify(result.result, null, 2) });
    } else {
      trace.push({ step: 'Execution', status: 'error', details: result.error || result.reason });
    }
    
    setRunnerTrace([...trace]);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#141414]/10 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#141414] rounded-xl flex items-center justify-center text-white">
              <Cpu size={24} />
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-tight">Tool & Skills Kit</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Framework v1.0.0</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white border border-[#141414]/10 rounded-full px-3 py-1.5 shadow-sm">
              <span className="text-xs font-medium opacity-60">Mode:</span>
              <button 
                onClick={() => setUserMode(userMode === 'safe' ? 'standard' : 'safe')}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all",
                  userMode === 'safe' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}
              >
                {userMode === 'safe' ? <Lock size={12} /> : <Unlock size={12} />}
                {userMode}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <nav className="col-span-3 space-y-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group",
                  activeTab === tab.id 
                    ? "bg-[#141414] text-white shadow-lg shadow-[#141414]/20" 
                    : "hover:bg-white hover:shadow-sm"
                )}
              >
                <tab.icon size={20} className={cn(activeTab === tab.id ? "text-white" : "text-[#141414]/40 group-hover:text-[#141414]")} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}

            <div className="mt-12 p-6 bg-[#5A5A40] rounded-3xl text-white relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="font-serif italic text-xl mb-2">Architecture</h3>
                <p className="text-sm opacity-80 leading-relaxed">
                  Modular registry with policy-first execution. Every call is validated, audited, and permission-checked.
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Shield size={120} />
              </div>
            </div>
          </nav>

          {/* Main Content Area */}
          <div className="col-span-9 bg-white rounded-[32px] shadow-xl shadow-black/5 border border-[#141414]/5 p-8 min-h-[600px]">
            <AnimatePresence mode="wait">
              {activeTab === 'explorer' && (
                <motion.div 
                  key="explorer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-serif italic">Tool Explorer</h2>
                      <p className="text-sm text-[#141414]/50">Discover and test available skills in the registry.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {tools.map(tool => (
                      <button
                        key={tool.name}
                        onClick={() => {
                          setSelectedTool(tool);
                          setTestInput(JSON.stringify(tool.input_schema.properties ? Object.keys(tool.input_schema.properties).reduce((acc, key) => ({ ...acc, [key]: tool.input_schema.properties[key].default || '' }), {}) : {}, null, 2));
                          setExecutionResult(null);
                        }}
                        className={cn(
                          "p-6 rounded-3xl border text-left transition-all",
                          selectedTool?.name === tool.name 
                            ? "bg-[#141414] border-[#141414] text-white" 
                            : "bg-white border-[#141414]/10 hover:border-[#141414]/30"
                        )}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold tracking-tight">{tool.name}</h3>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                            tool.risk_level === 'low' ? "bg-emerald-100 text-emerald-700" :
                            tool.risk_level === 'medium' ? "bg-amber-100 text-amber-700" :
                            "bg-rose-100 text-rose-700"
                          )}>
                            {tool.risk_level}
                          </span>
                        </div>
                        <p className={cn("text-xs line-clamp-2 leading-relaxed", selectedTool?.name === tool.name ? "opacity-70" : "opacity-50")}>
                          {tool.description}
                        </p>
                      </button>
                    ))}
                  </div>

                  {selectedTool && (
                    <div className="mt-8 p-8 bg-[#F5F5F0] rounded-3xl border border-[#141414]/5">
                      <div className="flex items-center gap-3 mb-6">
                        <Terminal size={20} className="text-[#141414]/40" />
                        <h3 className="font-bold">Test Execution: {selectedTool.name}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Input JSON</label>
                          <textarea 
                            value={testInput}
                            onChange={(e) => setTestInput(e.target.value)}
                            className="w-full h-40 bg-white border border-[#141414]/10 rounded-2xl p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                          />
                          <button 
                            onClick={async () => {
                              try {
                                const input = JSON.parse(testInput);
                                const res = await handleRunTool(selectedTool, input, 'general');
                                setExecutionResult(res);
                              } catch (e: any) {
                                setExecutionResult({ success: false, error: 'Invalid JSON input' });
                              }
                            }}
                            className="w-full bg-[#141414] text-white py-3 rounded-2xl font-bold hover:bg-[#2A2A2A] transition-colors"
                          >
                            Execute Tool
                          </button>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Result</label>
                          <div className="w-full h-40 bg-white border border-[#141414]/10 rounded-2xl p-4 overflow-auto">
                            {executionResult ? (
                              <pre className="text-xs font-mono">
                                {JSON.stringify(executionResult, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-xs text-[#141414]/30 italic">Awaiting execution...</p>
                            )}
                          </div>
                          {selectedTool.required_permissions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {selectedTool.required_permissions.map(p => (
                                <span key={p} className="text-[9px] bg-[#141414]/5 px-2 py-1 rounded-md font-bold uppercase opacity-60">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'simulator' && (
                <motion.div 
                  key="simulator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-serif italic">Policy Simulator</h2>
                    <p className="text-sm text-[#141414]/50">Test how the policy engine handles different scenarios.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-1 space-y-6">
                      <div className="bg-[#F5F5F0] p-6 rounded-3xl border border-[#141414]/5">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                          <Settings size={16} /> Context
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">User Mode</label>
                            <select 
                              value={userMode}
                              onChange={(e) => setUserMode(e.target.value as any)}
                              className="w-full bg-white border border-[#141414]/10 rounded-xl px-3 py-2 text-sm"
                            >
                              <option value="standard">Standard</option>
                              <option value="safe">Safe Mode</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">Request Category</label>
                            <select 
                              value={runnerRequest.request_category}
                              onChange={(e) => setRunnerRequest({ ...runnerRequest, request_category: e.target.value as any })}
                              className="w-full bg-white border border-[#141414]/10 rounded-xl px-3 py-2 text-sm"
                            >
                              <option value="general">General</option>
                              <option value="personal_data">Personal Data</option>
                              <option value="system_control">System Control</option>
                              <option value="risky_actions">Risky Actions</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#F5F5F0] p-6 rounded-3xl border border-[#141414]/5">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                          <Shield size={16} /> Permissions
                        </h3>
                        <div className="space-y-2">
                          {['mic', 'files', 'calendar', 'network', 'smart_home', 'system_control', 'personal_data'].map((p) => (
                            <div key={p} className="flex items-center justify-between">
                              <span className="text-xs font-medium uppercase tracking-wider opacity-70">{p.replace('_', ' ')}</span>
                              <button 
                                onClick={() => {
                                  if (globalPolicyEngine.isPermissionGranted(p as Permission)) {
                                    globalPolicyEngine.revokePermission(p as Permission);
                                  } else {
                                    globalPolicyEngine.grantPermission(p as Permission);
                                  }
                                  setActiveTab('simulator'); // Force re-render
                                }}
                                className={cn(
                                  "w-10 h-5 rounded-full relative transition-colors",
                                  globalPolicyEngine.isPermissionGranted(p as Permission) ? "bg-[#141414]" : "bg-[#141414]/10"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                  globalPolicyEngine.isPermissionGranted(p as Permission) ? "left-6" : "left-1"
                                )} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 space-y-4">
                      <label className="text-[10px] font-bold uppercase opacity-50 block">Policy Outcomes for All Tools</label>
                      <div className="space-y-3">
                        {tools.map(tool => {
                          const res = globalPolicyEngine.evaluate(tool, { 
                            category: runnerRequest.request_category, 
                            userMode, 
                            timestamp: '' 
                          });
                          return (
                            <div key={tool.name} className="flex items-center justify-between p-4 bg-white border border-[#141414]/10 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center",
                                  res.decision === 'allow' ? "bg-emerald-100 text-emerald-600" :
                                  res.decision === 'deny' ? "bg-rose-100 text-rose-600" :
                                  "bg-amber-100 text-amber-600"
                                )}>
                                  {res.decision === 'allow' ? <CheckCircle2 size={16} /> :
                                   res.decision === 'deny' ? <XCircle size={16} /> :
                                   <AlertTriangle size={16} />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{tool.name}</p>
                                  <p className="text-[10px] opacity-50">{res.reason}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={cn(
                                  "text-[10px] font-bold uppercase px-2 py-1 rounded-md",
                                  res.decision === 'allow' ? "text-emerald-600" :
                                  res.decision === 'deny' ? "text-rose-600" :
                                  "text-amber-600"
                                )}>
                                  {res.decision.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'runner' && (
                <motion.div 
                  key="runner"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-serif italic">Assistant Runner</h2>
                    <p className="text-sm text-[#141414]/50">Simulate a structured request flow through the framework.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="bg-[#F5F5F0] p-8 rounded-[32px] border border-[#141414]/5 space-y-6">
                        <h3 className="font-bold">Request Payload</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">Tool Name</label>
                            <select 
                              value={runnerRequest.tool_name}
                              onChange={(e) => setRunnerRequest({ ...runnerRequest, tool_name: e.target.value })}
                              className="w-full bg-white border border-[#141414]/10 rounded-xl px-3 py-2 text-sm"
                            >
                              {tools.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">Arguments (JSON)</label>
                            <textarea 
                              value={JSON.stringify(runnerRequest.tool_args, null, 2)}
                              onChange={(e) => {
                                try {
                                  setRunnerRequest({ ...runnerRequest, tool_args: JSON.parse(e.target.value) });
                                } catch {}
                              }}
                              className="w-full h-32 bg-white border border-[#141414]/10 rounded-xl p-3 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">Category</label>
                            <select 
                              value={runnerRequest.request_category}
                              onChange={(e) => setRunnerRequest({ ...runnerRequest, request_category: e.target.value as any })}
                              className="w-full bg-white border border-[#141414]/10 rounded-xl px-3 py-2 text-sm"
                            >
                              <option value="general">General</option>
                              <option value="personal_data">Personal Data</option>
                              <option value="system_control">System Control</option>
                              <option value="risky_actions">Risky Actions</option>
                            </select>
                          </div>
                        </div>
                        <button 
                          onClick={handleRunnerSubmit}
                          className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-all"
                        >
                          <Play size={18} /> Run Request
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="font-bold flex items-center gap-2">
                        <Activity size={18} /> Execution Trace
                      </h3>
                      <div className="space-y-4 relative">
                        {runnerTrace.length === 0 && (
                          <div className="p-12 border-2 border-dashed border-[#141414]/10 rounded-[32px] flex flex-col items-center justify-center text-center opacity-30">
                            <Activity size={48} className="mb-4" />
                            <p className="text-sm font-medium">No active execution trace</p>
                          </div>
                        )}
                        {runnerTrace.map((step, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.2 }}
                            className="flex gap-4"
                          >
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                step.status === 'success' ? "bg-emerald-500 text-white" :
                                step.status === 'error' ? "bg-rose-500 text-white" :
                                "bg-[#141414] text-white"
                              )}>
                                {idx + 1}
                              </div>
                              {idx < runnerTrace.length - 1 && <div className="w-0.5 h-full bg-[#141414]/10 my-1" />}
                            </div>
                            <div className="flex-1 pb-6">
                              <div className="bg-white border border-[#141414]/10 rounded-2xl p-4 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-bold text-sm">{step.step}</h4>
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                                    step.status === 'success' ? "bg-emerald-100 text-emerald-700" :
                                    step.status === 'error' ? "bg-rose-100 text-rose-700" :
                                    "bg-blue-100 text-blue-700"
                                  )}>
                                    {step.status}
                                  </span>
                                </div>
                                <pre className="text-[10px] font-mono opacity-60 overflow-auto max-h-40">
                                  {step.details}
                                </pre>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'audit' && (
                <motion.div 
                  key="audit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-serif italic">Audit Log</h2>
                      <p className="text-sm text-[#141414]/50">Immutable record of all tool interactions and policy decisions.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const blob = new Blob([globalAuditLogger.exportJson()], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'audit-log.json';
                        a.click();
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#141414] text-white rounded-xl text-sm font-bold hover:bg-[#2A2A2A] transition-all"
                    >
                      <Download size={16} /> Export JSON
                    </button>
                  </div>

                  <div className="space-y-4">
                    {logs.length === 0 ? (
                      <div className="p-20 text-center opacity-20">
                        <History size={64} className="mx-auto mb-4" />
                        <p className="font-serif italic text-xl">No logs recorded yet</p>
                      </div>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="bg-white border border-[#141414]/10 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <div className="px-6 py-4 bg-[#F5F5F0]/50 border-b border-[#141414]/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-mono opacity-40">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              <h4 className="font-bold text-sm">{log.toolName}</h4>
                              <span className={cn(
                                "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                                log.policyResult.decision === 'allow' ? "bg-emerald-100 text-emerald-700" :
                                log.policyResult.decision === 'deny' ? "bg-rose-100 text-rose-700" :
                                "bg-amber-100 text-amber-700"
                              )}>
                                {log.policyResult.decision}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] opacity-40 uppercase font-bold tracking-tighter">ID: {log.id}</span>
                            </div>
                          </div>
                          <div className="p-6 grid grid-cols-2 gap-6">
                            <div>
                              <label className="text-[9px] font-bold uppercase opacity-40 block mb-2">Input (Redacted)</label>
                              <pre className="text-[10px] font-mono bg-[#F5F5F0] p-3 rounded-xl overflow-auto max-h-32">
                                {JSON.stringify(log.input, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold uppercase opacity-40 block mb-2">Output / Error</label>
                              <pre className={cn(
                                "text-[10px] font-mono p-3 rounded-xl overflow-auto max-h-32",
                                log.error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                              )}>
                                {log.error ? log.error : JSON.stringify(log.output, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-[#141414]/5">
        <div className="flex justify-between items-center opacity-30">
          <p className="text-xs">© 2026 Tool & Skills Framework Kit • Built for AI Studio</p>
          <div className="flex gap-6">
            <span className="text-xs font-bold uppercase tracking-widest">Privacy First</span>
            <span className="text-xs font-bold uppercase tracking-widest">Policy Driven</span>
            <span className="text-xs font-bold uppercase tracking-widest">Modular</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
