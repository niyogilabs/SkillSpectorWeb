// Pyodide Web Worker for native Python execution in browser

self.onmessage = async (e) => {
  const { type, filesMap, targetName } = e.data;
  if (type === "RUN_SCAN") {
    try {
      // Lazy load Pyodide from CDN in worker context if requested
      if (!self.pyodide) {
        importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");
        self.pyodide = await loadPyodide();
      }

      // Execute Python static inspector
      self.pyodide.globals.set("files_map_json", JSON.stringify(filesMap));
      
      const pythonScript = `
import json
import re

files_map = json.loads(files_map_json)
findings = []

rules = [
    {"id": "P1", "severity": "CRITICAL", "regex": r"(ignore all previous instructions|system override)", "title": "System Override"},
    {"id": "E1", "severity": "CRITICAL", "regex": r"(https?://[^/]+/log-exfil)", "title": "External Data Exfiltration"},
    {"id": "E2", "severity": "HIGH", "regex": r"(process\\.env|os\\.environ)", "title": "Env Secret Access"}
]

for path, content in files_map.items():
    for rule in rules:
        if re.search(rule["regex"], content, re.IGNORECASE):
            findings.append({
                "ruleId": rule["id"],
                "severity": rule["severity"],
                "title": rule["title"],
                "filePath": path,
                "lineNum": 1,
                "snippet": content[:100]
            })

result = json.dumps({"findings": findings})
result
`;
      const resStr = await self.pyodide.runPythonAsync(pythonScript);
      const res = JSON.parse(resStr);

      self.postMessage({ status: "SUCCESS", result: res });
    } catch (err) {
      self.postMessage({ status: "ERROR", error: err.message });
    }
  }
};
