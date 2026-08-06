// Baseline Suppressor Generator for .skillspector-baseline.yaml

class BaselineGenerator {
  static generateBaseline(report) {
    let yaml = `# SkillSpector Baseline Configuration File\n`;
    yaml += `# Generated automatically by SkillSpector Browser Web on ${new Date().toISOString()}\n`;
    yaml += `version: "1.0"\n`;
    yaml += `suppressions:\n`;

    if (report.findings.length === 0) {
      yaml += `  # No active findings to suppress.\n`;
      return yaml;
    }

    report.findings.forEach(f => {
      yaml += `  - rule_id: "${f.ruleId}"\n`;
      yaml += `    file: "${f.filePath}"\n`;
      yaml += `    line: ${f.lineNum}\n`;
      yaml += `    reason: "Acknowledged baseline exception for ${f.title}"\n`;
    });

    return yaml;
  }
}

window.BaselineGenerator = BaselineGenerator;
