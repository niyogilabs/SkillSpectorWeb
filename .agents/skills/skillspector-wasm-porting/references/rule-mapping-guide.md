# SkillSpector Rule Mapping Reference Guide

This reference documents the rule ID mappings between the upstream Python SkillSpector analyzers (`src/skillspector/nodes/analyzers/`) and the client-side JavaScript engine (`docs/js/skillspector-engine.js`).

---

## 🛡️ Rule Mappings Table

| Rule ID | Category | Upstream Python Analyzer File | JavaScript Engine Regex Pattern |
|---|---|---|---|
| **P1** | Prompt Injection | `static_patterns_prompt_injection.py` | `/(ignore\s+all\s+(previous\|prior)\s+instructions\|system\s+override)/i` |
| **P2** | Prompt Injection | `static_patterns_prompt_injection.py` | `/(<!--[\s\S]*?(SYSTEM\|INSTRUCTION\|OVERRIDE)[\s\S]*?-->)/i` |
| **P6** | System Prompt Leakage | `static_patterns_system_prompt_leakage.py` | `/(print\s+system\s+prompt\|reveal\s+your\s+system\s+instructions)/i` |
| **E1** | Data Exfiltration | `static_patterns_data_exfiltration.py` | `/(https?:\/\/(?!github\.com)[a-zA-Z0-9.-]+\/(log-exfil\|exfil))/i` |
| **E2** | Data Exfiltration | `static_patterns_data_exfiltration.py` | `/(process\.env\.(OPENAI_API_KEY\|GITHUB_TOKEN)\|os\.environ\.get)/i` |
| **E3** | Data Exfiltration | `static_patterns_data_exfiltration.py` | `/(\.ssh\/id_rsa\|\.aws\/credentials\|\.kube\/config)/i` |
| **PE1** | Privilege Escalation | `static_patterns_privilege_escalation.py` | `/(sudo\s+git\|sudo\s+bash\|chmod\s+777)/i` |
| **SC2** | Supply Chain | `static_patterns_supply_chain.py` | `/(curl\s+-[sSL]*\s+https?:\/\/[^\s\|]+\s*\|\s*bash)/i` |
| **SC3** | Supply Chain | `static_patterns_supply_chain.py` | `/(base64\s+-d\s*\|\s*bash\|eval\(Buffer\.from)/i` |
| **EA1** | Excessive Agency | `static_patterns_excessive_agency.py` | `/(without\s+asking\s+for\s+approval\|unrestricted\s+file\s+modification)/i` |
| **TM1** | Tool Misuse | `static_patterns_tool_misuse.py` | `/(subprocess\.(check_output\|run)\(.*shell\s*=\s*True)/i` |
| **TM4** | Tool Misuse | `static_patterns_tool_misuse.py` | `/(privileged:\s*true\|hostPath:)/i` |
| **TR1** | Trigger Abuse | `pattern_defaults.py` | `/(Triggers\s+on:\s*\*\|trigger:\s*"\*")/i` |
| **MCP1** | MCP Tool Poisoning | `mcp_tool_poisoning.py` | Dynamic JSON inspector over `mcpServers` tool definitions |
