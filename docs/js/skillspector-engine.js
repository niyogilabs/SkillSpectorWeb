// SkillSpector Client-Side Security Analyzer Engine (Ported from SkillSpector 2.12.0)

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
      YARA_MATCH: "YARA Match",
      MCP_LEAST_PRIVILEGE: "MCP Least Privilege",
      MCP_TOOL_POISONING: "MCP Tool Poisoning",
      AGENT_SNOOPING: "Agent Snooping",
      ANTI_REFUSAL: "Anti-Refusal",
      SERVER_SIDE_REQUEST_FORGERY: "Server-Side Request Forgery",
      DESERIALIZATION: "Insecure Deserialization",
      BUNDLED_EXECUTION_SURFACE: "Bundled Execution Surface",
      BEHAVIORAL_AST: "Behavioral AST Execution"
    };

    this.rules = [
      // --- Prompt Injection & Leakage ---
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
        id: "P3",
        category: this.categories.PROMPT_INJECTION,
        severity: "HIGH",
        title: "External Transmission Instructions",
        regex: /(transmit|send|exfiltrate|upload)\s+((all\s+)?(conversation|user|prompt|context)\s+(data|history|logs)|credentials|keys)/i,
        explanation: "Directs agent to transmit conversation context or user data to external services.",
        remediation: "Remove instructions directing external data transmission."
      },
      {
        id: "P4",
        category: this.categories.PROMPT_INJECTION,
        severity: "MEDIUM",
        title: "Subtle Steering / Bias Injection",
        regex: /(steer|manipulate|bias|influence)\s+(agent|model|response|output)\s+(towards|behavior)/i,
        explanation: "Subtle instructions detected that may alter agent decision-making or introduce hidden biases.",
        remediation: "Review content for implicit steering or bias."
      },
      {
        id: "P5",
        category: this.categories.PROMPT_INJECTION,
        severity: "CRITICAL",
        title: "Harmful Content Instructions",
        regex: /(instructions?\s+for\s+(making|building|creating)\s+(explosives|weapons|malware)|harmful\s+content)/i,
        explanation: "Content may contain harmful instructions that could cause physical or digital harm.",
        remediation: "Remove all harmful content instructions."
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
      {
        id: "P7",
        category: this.categories.SYSTEM_PROMPT_LEAKAGE,
        severity: "MEDIUM",
        title: "Indirect System Prompt Extraction",
        regex: /(summarize|translate|rephrase)\s+(your|the)\s+(system|initial)\s+(prompt|instructions)/i,
        explanation: "Indirect extraction of system instructions through summarization or rephrasing.",
        remediation: "Add explicit anti-extraction clauses in system instructions."
      },
      {
        id: "P8",
        category: this.categories.SYSTEM_PROMPT_LEAKAGE,
        severity: "HIGH",
        title: "Tool-Based System Prompt Exfiltration",
        regex: /(write|send|log)\s+(system\s+prompt|initial\s+instructions)\s+to\s+(file|network|url|log)/i,
        explanation: "Exfiltrates system prompts via tool calls (file writes, network requests, logging).",
        remediation: "Prevent system prompts from being written to files or sent via network tools."
      },

      // --- Data Exfiltration ---
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
      {
        id: "E4",
        category: this.categories.DATA_EXFILTRATION,
        severity: "HIGH",
        title: "Conversation Context Leakage",
        regex: /(send|leak|transmit)\s+(conversation|session|prompt|context)\s+(history|data|logs)\s+to/i,
        explanation: "Code or instructions that leak agent conversation context to external services.",
        remediation: "Remove any code or instructions that send prompt/response data externally."
      },
      {
        id: "E5",
        category: this.categories.DATA_EXFILTRATION,
        severity: "HIGH",
        title: "Cloud Storage Exfiltration",
        regex: /(s3:\/\/[a-z0-9.-]+|storage\.googleapis\.com\/[a-z0-9.-]+|blob\.core\.windows\.net\/[a-z0-9.-]+)/i,
        explanation: "Data is uploaded to cloud storage buckets (S3 / GCS / Azure Blob).",
        remediation: "Verify destination buckets are trusted; never upload credentials to external buckets."
      },

      // --- Privilege Escalation ---
      {
        id: "PE1",
        category: this.categories.PRIVILEGE_ESCALATION,
        severity: "CRITICAL",
        title: "Elevated Sudo / Root Command Execution",
        regex: /(sudo\s+git|sudo\s+bash|sudo\s+rm|chmod\s+777|chown\s+root)/i,
        explanation: "Skill invokes commands requiring superuser or root privileges.",
        remediation: "Remove sudo privileges from agent skills; execute commands in isolated containers."
      },
      {
        id: "PE2",
        category: this.categories.PRIVILEGE_ESCALATION,
        severity: "HIGH",
        title: "Sudo/Root Privilege Requests",
        regex: /(requires?\s+root\s+privileges|must\s+be\s+run\s+as\s+root)/i,
        explanation: "Skill explicitly requests root privileges or superuser authorization.",
        remediation: "Re-architect skill to run with unprivileged user access."
      },
      {
        id: "PE3",
        category: this.categories.PRIVILEGE_ESCALATION,
        severity: "MEDIUM",
        title: "Credential File Access Vector",
        regex: /(cat|read|open)\s+[^|&;\n]*(\.ssh\/|\.aws\/credentials|\.env|\bkeyring\b)|\b(keyring|keychain|gnome-keyring)\b/i,
        explanation: "Code accesses host credential files, SSH keys, or OS keyrings.",
        remediation: "Never load .env, SSH keys, or keyring secrets in production skill code paths."
      },

      // --- Supply Chain ---
      {
        id: "SC1",
        category: this.categories.SUPPLY_CHAIN,
        severity: "MEDIUM",
        title: "Unpinned Dependencies",
        regex: /(pip\s+install\s+[a-zA-Z0-9_-]+(?!\s*==)|npm\s+install\s+[a-zA-Z0-9_-]+(?!\s*@))/i,
        explanation: "Dependencies lack version pinning, allowing potential malicious package updates.",
        remediation: "Pin all dependency versions strictly using exact version specifiers."
      },
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
      {
        id: "SC7",
        category: this.categories.SUPPLY_CHAIN,
        severity: "HIGH",
        title: "Untrusted Container Image / Content Trust Disabled",
        regex: /(DOCKER_CONTENT_TRUST=0|--disable-content-trust|--insecure-registry)/i,
        explanation: "Pulls container images with signature or registry verification disabled.",
        remediation: "Keep Docker Content Trust enabled and pull only signed images from trusted registries."
      },
      {
        id: "SC8",
        category: this.categories.SUPPLY_CHAIN,
        severity: "HIGH",
        title: "Shipped Python Bytecode (.pyc / __pycache__)",
        regex: /(__pycache__|\.pyc|\.pyo)/i,
        explanation: "Ships compiled Python bytecode files which can hide malicious code from static source review.",
        remediation: "Remove __pycache__/ and .pyc/.pyo files before packaging."
      },

      // --- Excessive Agency ---
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
      {
        id: "EA3",
        category: this.categories.EXCESSIVE_AGENCY,
        severity: "MEDIUM",
        title: "Scope Creep Beyond Stated Purpose",
        regex: /(access\s+unrelated|modify\s+system\s+files\s+outside)/i,
        explanation: "Skill actions extend beyond its documented capabilities.",
        remediation: "Restrict skill tools to only those required for stated purpose."
      },
      {
        id: "EA4",
        category: this.categories.EXCESSIVE_AGENCY,
        severity: "MEDIUM",
        title: "Unbounded Resource Consumption",
        regex: /(while\s*\(\s*true\s*\)|for\s*\(;;\)|unlimited\s+requests)/i,
        explanation: "Allows potential unbounded resource loops or API call floods.",
        remediation: "Set rate limits, timeouts, and explicit iteration bounds."
      },
      {
        id: "EA5",
        category: this.categories.EXCESSIVE_AGENCY,
        severity: "HIGH",
        title: "External Model / Provider Override",
        regex: /(override\s+model|switch\s+provider\s+to|use\s+external\s+model)/i,
        explanation: "Selects external model/provider that may use undisclosed billing or external endpoints.",
        remediation: "Require explicit operator approval before invoking external models."
      },

      // --- Output Handling ---
      {
        id: "OH1",
        category: this.categories.OUTPUT_HANDLING,
        severity: "HIGH",
        title: "Unvalidated Output Injection",
        regex: /(eval\(output\)|exec\(response\)|innerHTML\s*=)/i,
        explanation: "Model output is used in execution or web contexts without sanitization.",
        remediation: "Sanitize and validate all model output before downstream execution."
      },
      {
        id: "OH2",
        category: this.categories.OUTPUT_HANDLING,
        severity: "MEDIUM",
        title: "Cross-Context Output Flow",
        regex: /(pass\s+output\s+directly\s+to|pipe\s+response\s+to)/i,
        explanation: "Output from one security context flows into another without boundary enforcement.",
        remediation: "Enforce strict context boundaries and sanitize data between security domains."
      },
      {
        id: "OH3",
        category: this.categories.OUTPUT_HANDLING,
        severity: "LOW",
        title: "Unbounded Output Generation",
        regex: /(max_tokens:\s*0|no\s+output\s+limit)/i,
        explanation: "Output generation size is not capped.",
        remediation: "Set explicit max_tokens or truncation limits."
      },

      // --- Memory Poisoning ---
      {
        id: "MP1",
        category: this.categories.MEMORY_POISONING,
        severity: "HIGH",
        title: "Persistent Context Injection",
        regex: /(persist\s+in\s+memory|store\s+permanently\s+in\s+context|remember\s+for\s+future\s+sessions)/i,
        explanation: "Injects content designed to persist in agent memory across sessions.",
        remediation: "Validate and isolate content stored in agent long-term memory."
      },
      {
        id: "MP2",
        category: this.categories.MEMORY_POISONING,
        severity: "MEDIUM",
        title: "Context Window Stuffing",
        regex: /(fill\s+context|repeat\s+string\s+10000|pad\s+prompt)/i,
        explanation: "Fills context window with filler content to displace safety constraints.",
        remediation: "Reject padding or stuffing attempts; enforce system prompt priority."
      },

      // --- Tool Misuse ---
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
        id: "TM3",
        category: this.categories.TOOL_MISUSE,
        severity: "HIGH",
        title: "Unsafe Default Settings (Disabled SSL/TLS)",
        regex: /(verify\s*=\s*False|ssl_verify\s*=\s*False|insecure\s*=\s*True)/i,
        explanation: "Disables TLS verification or uses insecure default configurations.",
        remediation: "Enable TLS verification and use safe default parameters."
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

      // --- Rogue Agent ---
      {
        id: "RA1",
        category: this.categories.ROGUE_AGENT,
        severity: "CRITICAL",
        title: "Self-Modification at Runtime",
        regex: /(modify\s+self|update\s+own\s+code|overwrite\s+SKILL\.md)/i,
        explanation: "Skill modifies its own code or SKILL.md manifest at runtime.",
        remediation: "Treat skill code and manifest files as read-only at runtime."
      },
      {
        id: "RA2",
        category: this.categories.ROGUE_AGENT,
        severity: "HIGH",
        title: "Unauthorized Session Persistence",
        regex: /(crontab\s+-e|systemctl\s+enable|add\s+to\s+\.bashrc|startup\s+script)/i,
        explanation: "Establishes unauthorized persistence across sessions via cron jobs or startup scripts.",
        remediation: "Remove background persistence mechanisms."
      },

      // --- Trigger Abuse ---
      {
        id: "TR1",
        category: this.categories.TRIGGER_ABUSE,
        severity: "MEDIUM",
        title: "Overly Broad / Vague Trigger Pattern",
        regex: /(Triggers\s+on:\s*\*|trigger:\s*"\*"|when\s+you\s+need\s+help\s+with\s+anything|help\s+me|do\s+this|can\s+you\s+assist)/i,
        explanation: "Skill uses overly vague or wildcard triggers, causing it to shadow all other agent skills.",
        remediation: "Specify explicit, scoped trigger keywords for the skill."
      },

      // --- Agent Snooping (AS1-AS3) ---
      {
        id: "AS1",
        category: this.categories.AGENT_SNOOPING,
        severity: "HIGH",
        title: "Agent Config Directory Access",
        regex: /(open\s*\(\s*['"]?\.(claude|codex|gemini|continue)\/|(?:cat|less|head|tail|grep|find)\s+[^|&;\n]*~?\/\.(claude|codex|gemini)\/|~\/\.(claude|codex|gemini|continue)\/(config|settings?|credentials?))/i,
        explanation: "Skill reads from agent configuration directories (.claude/, .codex/, .gemini/) containing tokens or secrets.",
        remediation: "Do not read agent configuration directories; pass parameters explicitly."
      },
      {
        id: "AS2",
        category: this.categories.AGENT_SNOOPING,
        severity: "HIGH",
        title: "MCP Config File Access (mcp.json)",
        regex: /(open\s*\(\s*['"][^'"]*mcp(_config)?\.json['"]|(?:cat|less|head|grep)\s+[^|&;\n]*mcp(_config)?\.json|\.(claude|codex|gemini)\/mcp(_config)?\.json)/i,
        explanation: "Skill reads MCP server configuration files to discover tokens, endpoints, or tools.",
        remediation: "Remove references to mcp.json files; MCP configs are managed by runtime."
      },
      {
        id: "AS3",
        category: this.categories.AGENT_SNOOPING,
        severity: "MEDIUM",
        title: "Skill Enumeration / Peer Snooping",
        regex: /(os\.listdir|os\.scandir|glob\.glob|Path\.iterdir)\s*\([^)]*\.(claude|codex|gemini)\/skills?|(ls|find|dir)\s+[^|&;\n]*\.(claude|codex|gemini)\/skills?|skills\/([A-Z][A-Za-z0-9_-]+)\/SKILL\.md/i,
        explanation: "Skill enumerates or reads SKILL.md manifests of peer installed skills.",
        remediation: "Skills must operate in isolation; remove peer skill directory scanning."
      },

      // --- Anti-Refusal Statements (AR1-AR3) ---
      {
        id: "AR1",
        category: this.categories.ANTI_REFUSAL,
        severity: "HIGH",
        title: "Refusal Suppression Statement",
        regex: /(never\s+(ever\s+)?(refuse|decline)|you\s+(must|will|should|can)\s*(not|never)\s+(refuse|decline|say\s+no)|always\s+(comply|obey|answer|respond)|no\s+request\s+is\s+(off[- ]limits|forbidden))/i,
        explanation: "Instructs the agent to never refuse requests, removing core refusal safety controls.",
        remediation: "Remove refusal suppression phrases; allow model safety compliance."
      },
      {
        id: "AR2",
        category: this.categories.ANTI_REFUSAL,
        severity: "HIGH",
        title: "Disclaimer / Caveat Suppression",
        regex: /((do\s+not|don'?t|never|no)\s+(include|add|give|provide|use|append)?\s*(any\s+)?(warnings?|disclaimers?|caveats?)|without\s+(any\s+)?(warnings?|disclaimers?|caveats?|moralizing)|(skip|omit|leave\s+out|drop)\s+(the\s+)?(disclaimer|warning|ethics|safety))/i,
        explanation: "Instructs the agent to omit warnings, disclaimers, or ethical commentary.",
        remediation: "Remove disclaimer suppression instructions."
      },
      {
        id: "AR3",
        category: this.categories.ANTI_REFUSAL,
        severity: "HIGH",
        title: "Safety Policy Nullification (Jailbreak)",
        regex: /(you\s+have\s+no\s+(restrictions?|limitations?|filters?|rules?|guidelines?)|(ignore|disregard|forget|bypass|override)\s+(your\s+)?(content\s+)?(policy|policies|guidelines?|safety|restrictions?)|not\s+bound\s+by\s+(any\s+)?(rules?|policy|guidelines?)|do\s+anything\s+now|(developer|debug|god|sudo|jailbreak)\s+mode\s+(enabled|on|activated))/i,
        explanation: "Attempts to nullify safety policies or restrictions ('you have no restrictions', 'ignore guidelines').",
        remediation: "Remove jailbreak framing and policy bypass directives."
      },

      // --- Server-Side Request Forgery (SSRF1-SSRF3) ---
      {
        id: "SSRF1",
        category: this.categories.SERVER_SIDE_REQUEST_FORGERY,
        severity: "CRITICAL",
        title: "Cloud Metadata Endpoint Access",
        regex: /(169\.254\.169\.254|metadata\.google\.internal|169\.254\.169\.254\/latest\/meta-data)/i,
        explanation: "Code accesses cloud instance metadata endpoints (169.254.169.254) to steal temporary IAM credentials.",
        remediation: "Block requests to 169.254.169.254 and instance metadata endpoints."
      },
      {
        id: "SSRF2",
        category: this.categories.SERVER_SIDE_REQUEST_FORGERY,
        severity: "HIGH",
        title: "Internal Loopback / Private Network Request",
        regex: /(https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+))/i,
        explanation: "Issues HTTP requests to loopback or private network IP ranges.",
        remediation: "Validate request target hosts against allowlists."
      },
      {
        id: "SSRF3",
        category: this.categories.SERVER_SIDE_REQUEST_FORGERY,
        severity: "HIGH",
        title: "Dynamic Untrusted Request Target",
        regex: /(requests\.(get|post|put|delete)\(\s*(url|target|endpoint|host))/i,
        explanation: "Builds HTTP request target URLs from dynamic or untrusted parameters.",
        remediation: "Sanitize and validate target domain against strict allowlists."
      },

      // --- Insecure Deserialization (DS1-DS4) ---
      {
        id: "DS1",
        category: this.categories.DESERIALIZATION,
        severity: "CRITICAL",
        title: "Insecure PHP unserialize()",
        regex: /\bunserialize\s*\(/i,
        explanation: "PHP unserialize() on untrusted input enables object injection and POP-chain execution.",
        remediation: "Use json_decode() or specify allowed_classes: false."
      },
      {
        id: "DS2",
        category: this.categories.DESERIALIZATION,
        severity: "CRITICAL",
        title: "Insecure Ruby Marshal.load()",
        regex: /Marshal\.(load|restore)/i,
        explanation: "Ruby Marshal.load reconstructs arbitrary objects from binary blobs leading to RCE.",
        remediation: "Use JSON.parse for data exchange instead of Marshal."
      },
      {
        id: "DS3",
        category: this.categories.DESERIALIZATION,
        severity: "HIGH",
        title: "Unsafe Ruby YAML.load()",
        regex: /(YAML|Psych|Oj)\.load\s*\(/i,
        explanation: "Ruby YAML.load / Psych.load instantiates arbitrary objects. Use safe_load.",
        remediation: "Use YAML.safe_load or Psych.safe_load."
      },
      {
        id: "DS4",
        category: this.categories.DESERIALIZATION,
        severity: "CRITICAL",
        title: "Insecure JavaScript Deserialization",
        regex: /(node-serialize|funcster|serialize-to-js).*unserialize/i,
        explanation: "Deserializes functions in Node process executing arbitrary code.",
        remediation: "Use JSON.parse for JavaScript data deserialization."
      },

      // --- Bundled Execution Surface (BH1-BH3) ---
      {
        id: "BH1",
        category: this.categories.BUNDLED_EXECUTION_SURFACE,
        severity: "MEDIUM",
        title: "Bundled Lifecycle Hook Execution",
        regex: /(on_install|on_enable|post_install|pre_execution)\s*:/i,
        explanation: "Bundled lifecycle hooks run automatically when configured events occur.",
        remediation: "Review handler capabilities before executing hooks."
      },

      // --- Behavioral AST & Code Execution (AST1-AST10) ---
      {
        id: "AST1",
        category: this.categories.BEHAVIORAL_AST,
        severity: "CRITICAL",
        title: "Direct Dynamic exec() Execution",
        regex: /\bexec\s*\(/i,
        explanation: "Direct exec() call enables arbitrary code execution.",
        remediation: "Replace exec() with structured parsing or sandboxed execution."
      },
      {
        id: "AST2",
        category: this.categories.BEHAVIORAL_AST,
        severity: "CRITICAL",
        title: "Direct Dynamic eval() Execution",
        regex: /\beval\s*\(/i,
        explanation: "Direct eval() call evaluates arbitrary expressions.",
        remediation: "Use ast.literal_eval() or JSON.parse instead of eval()."
      },
      {
        id: "AST3",
        category: this.categories.BEHAVIORAL_AST,
        severity: "HIGH",
        title: "Dynamic Module Import (__import__)",
        regex: /__import__\s*\(/i,
        explanation: "Dynamic __import__() can load arbitrary modules at runtime.",
        remediation: "Use standard import statements."
      },
      {
        id: "AST7",
        category: this.categories.BEHAVIORAL_AST,
        severity: "HIGH",
        title: "Reflective Execution Sink (getattr)",
        regex: /getattr\s*\(\s*(os|subprocess|builtins)\s*,\s*['"](system|exec|eval|Popen)['"]\)/i,
        explanation: "Reflective access to execution sink via getattr() to evade detection.",
        remediation: "Invoke functions directly without reflective lookups."
      },
      {
        id: "AST10",
        category: this.categories.BEHAVIORAL_AST,
        severity: "CRITICAL",
        title: "Insecure Python Deserializer (pickle / marshal)",
        regex: /(pickle|marshal|dill|jsonpickle|joblib)\.(load|loads)/i,
        explanation: "Untrusted data passed to pickle/marshal/dill enables arbitrary code execution.",
        remediation: "Use JSON or safe formats instead of pickle/dill."
      },

      // --- MCP Least Privilege & Tool Poisoning ---
      {
        id: "LP2",
        category: this.categories.MCP_LEAST_PRIVILEGE,
        severity: "HIGH",
        title: "Wildcard Permission Declaration",
        regex: /("permissions"\s*:\s*\[\s*"\*"\s*\]|allowed-tools:\s*\*)/i,
        explanation: "Grants blanket permissions without least-privilege boundaries.",
        remediation: "Replace wildcard permissions with explicit allowlists."
      },
      {
        id: "TP2",
        category: this.categories.MCP_TOOL_POISONING,
        severity: "HIGH",
        title: "Unicode Deception / Homoglyph Attack",
        regex: /[\u202E\u200B-\u200D\uFEFF]/i,
        explanation: "Invisible formatting or RTL override unicode characters detected.",
        remediation: "Remove non-printable unicode formatting characters."
      }
    ];
  }

  /**
   * Discover discrete skills across multi-skill repositories
   */
  discoverSkills(filesMap) {
    const discoveredSkills = [];
    
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
    
    // Determine target skill name for self-reference checks
    let targetSkillName = targetName || "";
    for (const skill of discoveredSkills) {
      if (skill.name) {
        targetSkillName = skill.name;
        break;
      }
    }

    for (const [filePath, content] of Object.entries(filesMap)) {
      totalFilesScanned++;
      const lines = content.split('\n');
      totalLinesScanned += lines.length;

      // P9 Whitespace padding check
      if (/\n{15,}/.test(content) || / {80,}/.test(content)) {
        const match = content.match(/\n{15,}/) || content.match(/ {80,}/);
        const matchIndex = match ? match.index : 0;
        const lineNum = content.substring(0, matchIndex).split('\n').length;
        findings.push({
          ruleId: "P9",
          category: this.categories.PROMPT_INJECTION,
          severity: "MEDIUM",
          title: "Whitespace Padding Concealment",
          explanation: "Large whitespace padding was detected (blank lines or long space runs) that can push injected instructions out of view.",
          remediation: "Remove large whitespace padding blocks.",
          filePath: filePath,
          lineNum: lineNum,
          snippet: "Large whitespace padding block detected"
        });
      }

      // Match rules
      for (const rule of this.rules) {
        let match;
        const flags = rule.regex.flags.includes('g') ? rule.regex.flags : rule.regex.flags + 'g';
        const regexClone = new RegExp(rule.regex.source, flags);

        while ((match = regexClone.exec(content)) !== null) {
          const matchIndex = match.index;
          const lineNum = content.substring(0, matchIndex).split('\n').length;
          const lineText = lines[lineNum - 1] || match[0];

          // AS3 Contextual Exemption Check:
          if (rule.id === "AS3") {
            const skillNameGroup = match[2] || match[0];
            // 1. Skip self-reference match if it names the current skill
            if (targetSkillName && skillNameGroup.toLowerCase().includes(targetSkillName.toLowerCase())) {
              continue;
            }
            // 2. Skip if enclosed in backticks or markdown code spans in documentation files
            const isBacktickLiteral = /`[^`]*skills\/[^`]*`/.test(lineText);
            if (isBacktickLiteral) {
              continue;
            }
          }

          // PE3 Bare Keyring Exemption Check:
          if (rule.id === "PE3") {
            const isBareKeyringWord = /\b(keyring|keychain|gnome-keyring)\b/i.test(match[0]);
            if (isBareKeyringWord && !/(cat|read|open|access|extract|copy|get|steal|save|store|keyring\.)/i.test(lineText)) {
              // If line in prose docs is a descriptive noun without action verb ("documents the keyring access policy"), skip it
              if (filePath.endsWith('.md') && /documents?\s+the\s+keyring/i.test(lineText)) {
                continue;
              }
            }
          }

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

    // Deduplicate exact findings
    const uniqueFindings = [];
    const seenKeys = new Set();
    for (const f of findings) {
      const key = `${f.ruleId}:${f.filePath}:${f.lineNum}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueFindings.push(f);
      }
    }

    // Calculate score & verdict
    const counts = {
      CRITICAL: uniqueFindings.filter(f => f.severity === "CRITICAL").length,
      HIGH: uniqueFindings.filter(f => f.severity === "HIGH").length,
      MEDIUM: uniqueFindings.filter(f => f.severity === "MEDIUM").length,
      LOW: uniqueFindings.filter(f => f.severity === "LOW").length,
      INFO: uniqueFindings.filter(f => f.severity === "INFO").length
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
      findings: uniqueFindings,
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
