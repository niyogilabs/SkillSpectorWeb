// SkillSpector Client-Side Security Analyzer Engine (Ported from SkillSpector 2.5.1)

class SkillSpectorEngine {
  constructor() {
    this.categories = {
      PROMPT_INJECTION: "Prompt Injection",
      DATA_EXFILTRATION: "Data Exfiltration",
      PRIVILEGE_ESCALATION: "Privilege Escalation",
      SUPPLY_CHAIN: "Supply Chain",
      EXCESSIVE_AGENCY: "Excessive Agency",
      OUTPUT_HANDLING: "Output Handling",
      SYSTEM_PROMPT_LEAKAGE: "System Prompt Leakage",
      MEMORY_POISONING: "Memory Poisoning",
      TOOL_MISUSE: "Tool Misuse",
      ROGUE_AGENT: "Rogue Agent",
      TRIGGER_ABUSE: "Trigger Abuse",
      MCP_TOOL_POISONING: "MCP Tool Poisoning",
      MCP_LEAST_PRIVILEGE: "MCP Least Privilege",
      ANTI_REFUSAL: "Anti-Refusal",
      SSRF: "Server-Side Request Forgery"
    };

    this.rules = [
      // Prompt Injection
      {
        id: "P1",
        category: this.categories.PROMPT_INJECTION,
        severity: "CRITICAL",
        title: "System Prompt Override / Ignore Safety Instructions",
        regex: /(ignore\s+(all\s+)?(previous|prior)\s+(instructions?|directives?|guidelines?)|override\s+(safety|security|system)|bypass\s+(safety|security|restrictions?|constraints?)|disregard\s+(all\s+)?(previous|safety|security)|system\s+override|unrestricted\s+dev\s+mode)/i,
        explanation: "Attempts to override system instructions or bypass agent safety constraints.",
        remediation: "Remove prompt injection directives and enforce system instruction boundaries."
      },
      {
        id: "P2",
        category: this.categories.PROMPT_INJECTION,
        severity: "HIGH",
        title: "Hidden Comments / Invisible Directives",
        regex: /(<!--[\s\S]*?(SYSTEM|INSTRUCTION|OVERRIDE|IGNORE)[\s\S]*?-->)/i,
        explanation: "Hidden instructions detected inside HTML comments or invisible text blocks.",
        remediation: "Sanitize prompt files to exclude hidden HTML comments or encoded directives."
      },
      {
        id: "P6",
        category: this.categories.SYSTEM_PROMPT_LEAKAGE,
        severity: "HIGH",
        title: "System Prompt Leakage Pattern",
        regex: /(print\s+system\s+prompt|reveal\s+(your|the)\s+system\s+instructions|output\s+all\s+initial\s+prompts)/i,
        explanation: "Directly requests or instructs agent to expose system prompts or hidden rules.",
        remediation: "Guard system prompts against leakage requests using defensive prompt framing."
      },
      // Data Exfiltration
      {
        id: "E1",
        category: this.categories.DATA_EXFILTRATION,
        severity: "CRITICAL",
        title: "External Data Exfiltration URL",
        regex: /(https?:\/\/(?!github\.com|raw\.githubusercontent\.com|api\.github\.com|pypi\.org|npmjs\.com)[a-zA-Z0-9.-]+\/(log-exfil|exfil|telemetry|upload|collect|env))/i,
        explanation: "Data exfiltration pattern pointing to an external data collector or webhook.",
        remediation: "Audit and restrict external network endpoints called by the skill."
      },
      {
        id: "E2",
        category: this.categories.DATA_EXFILTRATION,
        severity: "HIGH",
        title: "Environment Variable / API Key Access",
        regex: /(process\.env(\.[a-zA-Z0-9_]+|\[)|os\.environ(\.get|\.items|\[)?|os\.getenv)/i,
        explanation: "Skill directly accesses sensitive credential or API key environment variables.",
        remediation: "Do not expose raw environment secrets to skills; use managed secret brokers."
      },
      {
        id: "E3",
        category: this.categories.DATA_EXFILTRATION,
        severity: "HIGH",
        title: "Sensitive Credential File Reading",
        regex: /(\.ssh\/id_rsa|\.aws\/credentials|\.kube\/config|\.env)/i,
        explanation: "Skill accesses sensitive user credential files on the host filesystem.",
        remediation: "Block skills from referencing or opening SSH keys, cloud tokens, or local credentials."
      },
      // Privilege Escalation
      {
        id: "PE1",
        category: this.categories.PRIVILEGE_ESCALATION,
        severity: "CRITICAL",
        title: "Elevated Sudo / Root Command Execution",
        regex: /(sudo\s+git|sudo\s+bash|sudo\s+rm|chmod\s+777|chown\s+root)/i,
        explanation: "Skill invokes commands requiring superuser or root privileges.",
        remediation: "Remove sudo privileges from agent skills; execute commands in isolated containers."
      },
      // Supply Chain
      {
        id: "SC2",
        category: this.categories.SUPPLY_CHAIN,
        severity: "CRITICAL",
        title: "Pipe-to-Shell Remote Execution",
        regex: /(curl\s+-[sSL]*\s+https?:\/\/[^\s|]+\s*\|\s*(bash|sh|python|zsh)|wget\s+-[sSL]*\s+-[^\s|]+\s*\|\s*(bash|sh))/i,
        explanation: "Downloads and immediately pipes unverified remote scripts to a shell.",
        remediation: "Pin dependency downloads, download to temporary files, and perform checksum verification."
      },
      {
        id: "SC3",
        category: this.categories.SUPPLY_CHAIN,
        severity: "HIGH",
        title: "Obfuscated Executable Payload (Base64 / Hex)",
        regex: /(base64\s+-d\s*\|\s*(bash|sh|python)|eval\(Buffer\.from\(|exec\(base64_decode\()/i,
        explanation: "Obfuscated binary or base64 strings decoded and directly executed.",
        remediation: "De-obfuscate code and reject scripts containing hidden encoded payloads."
      },
      // Excessive Agency
      {
        id: "EA1",
        category: this.categories.EXCESSIVE_AGENCY,
        severity: "HIGH",
        title: "Unrestricted Autonomous Actions Without HITL",
        regex: /(without\s+asking\s+for\s+(user\s+)?approval|unrestricted\s+file\s+modification|automatically\s+(deletes|deleting)|force\s+push)/i,
        explanation: "Grants agent autonomous high-impact execution without Human-In-The-Loop approval.",
        remediation: "Require explicit human confirmation for file deletions, deployments, or destructive actions."
      },
      {
        id: "EA2",
        category: this.categories.EXCESSIVE_AGENCY,
        severity: "MEDIUM",
        title: "Recursive Directory Deletion",
        regex: /(rmSync\(.*recursive:\s*true|rm\s+-rf\s+["']?\/|\.rmtree\()/i,
        explanation: "Skill performs recursive force deletion of local directory trees.",
        remediation: "Limit file system deletion scopes and request confirmation before deleting files."
      },
      // Tool Misuse
      {
        id: "TM1",
        category: this.categories.TOOL_MISUSE,
        severity: "CRITICAL",
        title: "Dangerous Shell Execution (shell=True / Arbitrary Cmd)",
        regex: /(subprocess\.(check_output|Popen|run)\(.*shell\s*=\s*True|child_process\.exec\()/i,
        explanation: "Passes unsanitized strings to system shell, creating command injection vulnerabilities.",
        remediation: "Use array-based command execution (shell=False) and validate input parameters."
      },
      {
        id: "TM4",
        category: this.categories.TOOL_MISUSE,
        severity: "CRITICAL",
        title: "Privileged Container / Node Root Vector",
        regex: /(privileged:\s*true|hostPath:|hostNetwork:\s*true)/i,
        explanation: "Deploys privileged container configurations capable of host node takeover.",
        remediation: "Enforce Pod Security Standards (restricted profile) and disable host mounts."
      },
      // Trigger Abuse
      {
        id: "TR1",
        category: this.categories.TRIGGER_ABUSE,
        severity: "MEDIUM",
        title: "Overly Broad / Vague Trigger Pattern",
        regex: /(Triggers\s+on:\s*\*|trigger:\s*"\*"|when\s+you\s+need\s+help\s+with\s+anything|help\s+me|do\s+this|can\s+you\s+assist)/i,
        explanation: "Skill uses overly vague or wildcard triggers, causing it to shadow all other agent skills.",
        remediation: "Specify explicit, scoped trigger keywords for the skill."
      }
    ];
  }

  /**
   * Discover discrete skills across multi-skill repositories
   */
  discoverSkills(filesMap) {
    const discoveredSkills = [];
    
    // Check root SKILL.md
    for (const [filePath, content] of Object.entries(filesMap)) {
      const lower = filePath.toLowerCase();
      if (lower.endsWith('.md') && (lower.includes('skill') || lower.includes('agent'))) {
        const metadata = this._extractFrontmatter(content, filePath);
        discoveredSkills.push({
          filePath,
          name: metadata.name || filePath.split('/').pop().replace(/\.md$/, ''),
          description: metadata.description || 'Agent Skill Document',
          isRoot: filePath.toLowerCase() === 'skill.md' || filePath.toLowerCase() === 'readme.md'
        });
      }
    }

    return discoveredSkills;
  }

  _extractFrontmatter(content, filePath) {
    let name = null;
    let description = null;

    if (content.startsWith("---")) {
      const endMatch = content.indexOf("---", 3);
      if (endMatch !== -1) {
        const frontmatter = content.substring(3, endMatch);
        const nameMatch = frontmatter.match(/name:\s*(.+)/i);
        if (nameMatch) name = nameMatch[1].trim().replace(/^['"]|['"]$/g, '');
        const descMatch = frontmatter.match(/description:\s*(.+)/i);
        if (descMatch) description = descMatch[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }

    if (!name) {
      const h1Match = content.match(/^#\s+(.+)/m);
      if (h1Match) name = h1Match[1].trim();
    }

    return { name, description };
  }

  /**
   * Run security inspection over target files object { path: content }
   */
  async inspect(targetName, filesMap) {
    const findings = [];
    const ledger = [];
    let totalLinesScanned = 0;
    let totalFilesScanned = 0;

    const discoveredSkills = this.discoverSkills(filesMap);

    for (const [filePath, content] of Object.entries(filesMap)) {
      totalFilesScanned++;
      const lines = content.split('\n');
      totalLinesScanned += lines.length;

      // Match rules
      for (const rule of this.rules) {
        let match;
        const flags = rule.regex.flags.includes('g') ? rule.regex.flags : rule.regex.flags + 'g';
        const regexClone = new RegExp(rule.regex.source, flags);

        while ((match = regexClone.exec(content)) !== null) {
          const matchIndex = match.index;
          const lineNum = content.substring(0, matchIndex).split('\n').length;
          const lineText = lines[lineNum - 1] || match[0];

          findings.push({
            ruleId: rule.id,
            category: rule.category,
            severity: rule.severity,
            title: rule.title,
            explanation: rule.explanation,
            remediation: rule.remediation,
            filePath: filePath,
            lineNum: lineNum,
            snippet: lineText.trim()
          });
        }
      }

      ledger.push({
        work_id: `inspect_${filePath}`,
        path: filePath,
        outcome: "completed",
        lines: lines.length,
        findings_count: findings.filter(f => f.filePath === filePath).length
      });
    }

    // Check MCP server tools if present
    for (const [filePath, content] of Object.entries(filesMap)) {
      if (filePath.endsWith('.json') && content.includes('mcpServers')) {
        try {
          const parsed = JSON.parse(content);
          if (parsed.mcpServers) {
            for (const [serverName, serverCfg] of Object.entries(parsed.mcpServers)) {
              if (serverCfg.tools) {
                for (const tool of serverCfg.tools) {
                  if (tool.description && /arbitrary|bash|root|system command/i.test(tool.description)) {
                    findings.push({
                      ruleId: "MCP1",
                      category: this.categories.MCP_TOOL_POISONING,
                      severity: "CRITICAL",
                      title: `MCP Server Tool Poisoning (${serverName}/${tool.name})`,
                      explanation: `MCP tool '${tool.name}' exposes unrestricted host command execution capability.`,
                      remediation: "Restrict tool scope and sanitize input parameters.",
                      filePath: filePath,
                      lineNum: 1,
                      snippet: JSON.stringify(tool)
                    });
                  }
                }
              }
            }
          }
        } catch (e) {
          // invalid JSON
        }
      }
    }

    // Calculate score & verdict
    const counts = {
      CRITICAL: findings.filter(f => f.severity === "CRITICAL").length,
      HIGH: findings.filter(f => f.severity === "HIGH").length,
      MEDIUM: findings.filter(f => f.severity === "MEDIUM").length,
      LOW: findings.filter(f => f.severity === "LOW").length,
      INFO: findings.filter(f => f.severity === "INFO").length
    };

    let penalty = (counts.CRITICAL * 30) + (counts.HIGH * 15) + (counts.MEDIUM * 7) + (counts.LOW * 2);
    let riskScore = Math.max(0, Math.min(100, 100 - penalty));

    let verdict = "PASS";
    if (counts.CRITICAL > 0 || riskScore < 60) {
      verdict = "FAIL";
    } else if (counts.HIGH > 0 || counts.MEDIUM > 0 || riskScore < 85) {
      verdict = "WARN";
    }

    return {
      targetName,
      scanTime: new Date().toISOString(),
      filesCount: totalFilesScanned,
      linesCount: totalLinesScanned,
      discoveredSkills,
      riskScore,
      verdict,
      counts,
      findings,
      ledger,
      filesMap
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillSpectorEngine;
}
if (typeof window !== 'undefined') {
  window.SkillSpectorEngine = SkillSpectorEngine;
}
