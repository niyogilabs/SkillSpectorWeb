// Export utilities for SARIF 2.1.0, JSON, and Markdown

class ExportUtils {
  static toSARIF(report) {
    const sarif = {
      $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
      version: "2.1.0",
      runs: [
        {
          tool: {
            driver: {
              name: "SkillSpector Web",
              version: "2.5.1",
              informationUri: "https://github.com/skillspector",
              rules: report.findings.map(f => ({
                id: f.ruleId,
                name: f.title,
                shortDescription: { text: f.title },
                fullDescription: { text: f.explanation },
                defaultConfiguration: {
                  level: f.severity === "CRITICAL" || f.severity === "HIGH" ? "error" : f.severity === "MEDIUM" ? "warning" : "note"
                }
              }))
            }
          },
          results: report.findings.map(f => ({
            ruleId: f.ruleId,
            level: f.severity === "CRITICAL" || f.severity === "HIGH" ? "error" : f.severity === "MEDIUM" ? "warning" : "note",
            message: { text: `${f.title}: ${f.explanation}` },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: f.filePath },
                  region: { startLine: f.lineNum }
                }
              }
            ]
          }))
        }
      ]
    };
    return JSON.stringify(sarif, null, 2);
  }

  static toJSON(report) {
    return JSON.stringify(report, null, 2);
  }

  static toMarkdown(report) {
    let md = `# SkillSpector Security Scan Report\n\n`;
    md += `**Target:** \`${report.targetName}\`  \n`;
    md += `**Scan Time:** ${report.scanTime}  \n`;
    md += `**Verdict:** **${report.verdict}** (Risk Score: ${report.riskScore}/100)  \n\n`;

    md += `### Summary Counts\n`;
    md += `- **Critical:** ${report.counts.CRITICAL}\n`;
    md += `- **High:** ${report.counts.HIGH}\n`;
    md += `- **Medium:** ${report.counts.MEDIUM}\n`;
    md += `- **Low:** ${report.counts.LOW}\n`;
    md += `- **Info:** ${report.counts.INFO}\n\n`;

    md += `### Detailed Findings\n\n`;
    if (report.findings.length === 0) {
      md += `*No security findings detected. Skill passed inspection.*  \n`;
    } else {
      report.findings.forEach((f, idx) => {
        md += `#### ${idx + 1}. [${f.severity}] ${f.title} (\`${f.ruleId}\`)\n`;
        md += `- **File:** \`${f.filePath}:${f.lineNum}\`  \n`;
        md += `- **Category:** ${f.category}  \n`;
        md += `- **Explanation:** ${f.explanation}  \n`;
        md += `- **Remediation:** ${f.remediation}  \n`;
        md += `\`\`\`\n${f.snippet}\n\`\`\`\n\n`;
      });
    }

    return md;
  }
}

window.ExportUtils = ExportUtils;
