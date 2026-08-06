// Main UI Controller for SkillSpector Web Application

document.addEventListener("DOMContentLoaded", () => {
  const engine = new window.SkillSpectorEngine();
  const fetcher = new window.GitHubFetcher();

  // Elements
  const urlInput = document.getElementById("urlInput");
  const codeTextarea = document.getElementById("codeTextarea");
  const scanBtn = document.getElementById("scanBtn");
  const searchBox = document.getElementById("searchBox");
  const codeBox = document.getElementById("codeBox");
  const loadingBox = document.getElementById("loadingBox");
  const loadingText = document.getElementById("loadingText");
  const loadingSubtext = document.getElementById("loadingSubtext");
  const resultsSection = document.getElementById("resultsSection");
  const samplePills = document.querySelectorAll(".sample-pill");
  const modeBtns = document.querySelectorAll(".mode-btn");

  // Checkboxes
  const chkOmitDocs = document.getElementById("chkOmitDocs");
  const chkOmitSystem = document.getElementById("chkOmitSystem");

  // Theme Toggle Elements
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");
  const themeText = document.getElementById("themeText");

  // Results Elements
  const targetTitle = document.getElementById("targetTitle");
  const targetSub = document.getElementById("targetSub");
  const statFiles = document.getElementById("statFiles");
  const statLines = document.getElementById("statLines");
  const statTime = document.getElementById("statTime");
  const gaugeNumber = document.getElementById("gaugeNumber");
  const gaugeFill = document.getElementById("gaugeFill");
  const verdictBadge = document.getElementById("verdictBadge");

  // Multi-skill Elements
  const discoveredSkillsCard = document.getElementById("discoveredSkillsCard");
  const discoveredCount = document.getElementById("discoveredCount");
  const discoveredSkillsList = document.getElementById("discoveredSkillsList");

  // Sev Counts
  const countCritical = document.getElementById("countCritical");
  const countHigh = document.getElementById("countHigh");
  const countMedium = document.getElementById("countMedium");
  const countLow = document.getElementById("countLow");
  const countInfo = document.getElementById("countInfo");

  // Container Lists
  const findingsList = document.getElementById("findingsList");
  const categoriesList = document.getElementById("categoriesList");
  const fileTreeSidebar = document.getElementById("fileTreeSidebar");
  const viewerFilename = document.getElementById("viewerFilename");
  const codeLinesWrapper = document.getElementById("codeLinesWrapper");
  const ledgerTableBody = document.getElementById("ledgerTableBody");

  // Tab Buttons
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  // Export Buttons
  const exportSarifBtn = document.getElementById("exportSarifBtn");
  const exportJsonBtn = document.getElementById("exportJsonBtn");
  const exportMdBtn = document.getElementById("exportMdBtn");
  const exportBaselineBtn = document.getElementById("exportBaselineBtn");

  // Settings Modal
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const githubTokenInput = document.getElementById("githubTokenInput");

  let currentReport = null;
  let activeMode = "url";

  // --- Theme Management (Light Default) ---
  const savedTheme = localStorage.getItem("skillspector_theme") || "light";
  applyTheme(savedTheme);

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      themeIcon.textContent = "🌙";
      themeText.textContent = "Dark";
    } else {
      document.documentElement.removeAttribute("data-theme");
      themeIcon.textContent = "☀️";
      themeText.textContent = "Light";
    }
  }

  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("skillspector_theme", newTheme);
    applyTheme(newTheme);
  });

  // Load saved token
  const savedToken = localStorage.getItem("skillspector_gh_token");
  if (savedToken) {
    githubTokenInput.value = savedToken;
    fetcher.setToken(savedToken);
  }

  // Switch input modes
  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeMode = btn.dataset.mode;
      if (activeMode === "url") {
        searchBox.style.display = "flex";
        codeBox.style.display = "none";
      } else {
        searchBox.style.display = "none";
        codeBox.style.display = "block";
      }
    });
  });

  // Sample pill click
  samplePills.forEach(pill => {
    pill.addEventListener("click", () => {
      const sampleKey = pill.dataset.sample;
      const sample = window.SKILLSPECTOR_SAMPLES[sampleKey];
      if (sample) {
        runInspection(sample.name, sample.files);
      }
    });
  });

  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  // Scan Button Handler
  scanBtn.addEventListener("click", async () => {
    if (activeMode === "url") {
      const url = urlInput.value.trim();
      if (!url) {
        alert("Please enter a GitHub repository URL or select a sample skill.");
        return;
      }
      showLoading(true, "Discovering GitHub Repository...", "Parsing tree structure...");
      try {
        const fetched = await fetcher.fetchSkill(url, (current, total, currentFile) => {
          showLoading(true, `Fetching Skill Files (${current} / ${total})...`, currentFile);
        });

        // Apply RepoFilter options if selected in UI
        const omitDocs = chkOmitDocs.checked;
        const omitSystem = chkOmitSystem.checked;

        const { filteredMap, excludedList } = window.RepoFilter.filterFiles(fetched.files, { omitDocs, omitSystem });

        showLoading(true, "Running Security Scanner...", "Evaluating security patterns...");
        await runInspection(fetched.targetName, filteredMap, excludedList);
      } catch (err) {
        alert(`Error fetching GitHub skill: ${err.message}`);
      } finally {
        showLoading(false);
      }
    } else {
      const code = codeTextarea.value.trim();
      if (!code) {
        alert("Please paste code or skill text to scan.");
        return;
      }
      showLoading(true, "Scanning Pasted Code...", "Executing static security engine");
      await runInspection("Pasted Skill Code", { "SKILL.md": code });
      showLoading(false);
    }
  });

  function showLoading(active, mainText = "Fetching & Analyzing...", subText = "Executing browser engine...") {
    if (active) {
      loadingText.textContent = mainText;
      loadingSubtext.textContent = subText;
      loadingBox.classList.add("active");
      resultsSection.classList.remove("active");
    } else {
      loadingBox.classList.remove("active");
    }
  }

  /**
   * Run inspection & render UI
   */
  async function runInspection(targetName, filesMap, excludedList = []) {
    const report = await engine.inspect(targetName, filesMap);

    // Append excluded files to inspection ledger for full audit tracking
    if (excludedList && excludedList.length > 0) {
      excludedList.forEach(ex => {
        report.ledger.push({
          work_id: `omit_${ex.path}`,
          path: ex.path,
          outcome: "skipped",
          lines: 0,
          findings_count: 0,
          reason: ex.reason
        });
      });
    }

    currentReport = report;
    renderResults(report);
    showLoading(false);
    resultsSection.classList.add("active");
    resultsSection.scrollIntoView({ behavior: "smooth" });
  }

  function renderResults(report) {
    targetTitle.textContent = report.targetName;
    targetSub.textContent = `Scanned ${report.filesCount} file(s), ${report.linesCount} line(s)`;
    statFiles.textContent = report.filesCount;
    statLines.textContent = report.linesCount;
    statTime.textContent = new Date().toLocaleTimeString();

    // Gauge Score
    gaugeNumber.textContent = report.riskScore;
    const offset = 440 - (440 * report.riskScore / 100);
    gaugeFill.style.strokeDashoffset = offset;

    let scoreColor = "#059669";
    if (report.riskScore < 60) scoreColor = "#dc2626";
    else if (report.riskScore < 85) scoreColor = "#d97706";
    gaugeFill.style.stroke = scoreColor;
    gaugeNumber.style.color = scoreColor;

    // Verdict Badge
    verdictBadge.className = `verdict-badge ${report.verdict.toLowerCase()}`;
    verdictBadge.textContent = report.verdict;

    // Discovered Skills (Multi-skill UI)
    if (report.discoveredSkills && report.discoveredSkills.length > 0) {
      discoveredSkillsCard.style.display = "block";
      discoveredCount.textContent = report.discoveredSkills.length;
      discoveredSkillsList.innerHTML = "";

      // All Repository Badge
      const allPill = document.createElement("button");
      allPill.className = "sample-pill active";
      allPill.innerHTML = `🌟 All Repository Scope (${report.filesCount} files)`;
      allPill.addEventListener("click", () => {
        document.querySelectorAll("#discoveredSkillsList .sample-pill").forEach(p => p.classList.remove("active"));
        allPill.classList.add("active");
        renderFindings(report.findings);
        renderFileInspector(report.filesMap, report.findings);
      });
      discoveredSkillsList.appendChild(allPill);

      // Individual Skill Badges
      report.discoveredSkills.forEach(sk => {
        const pill = document.createElement("button");
        pill.className = "sample-pill";
        pill.innerHTML = `🎯 ${sk.name} <span style="opacity: 0.6; font-size: 0.75rem;">(${sk.filePath})</span>`;
        pill.addEventListener("click", () => {
          document.querySelectorAll("#discoveredSkillsList .sample-pill").forEach(p => p.classList.remove("active"));
          pill.classList.add("active");

          // Filter findings for this skill file or its directory
          const skillDir = sk.filePath.includes('/') ? sk.filePath.substring(0, sk.filePath.lastIndexOf('/')) : '';
          const filteredFindings = report.findings.filter(f => f.filePath === sk.filePath || (skillDir && f.filePath.startsWith(skillDir)));
          renderFindings(filteredFindings);
        });
        discoveredSkillsList.appendChild(pill);
      });
    } else {
      discoveredSkillsCard.style.display = "none";
    }

    // Counts
    countCritical.textContent = report.counts.CRITICAL;
    countHigh.textContent = report.counts.HIGH;
    countMedium.textContent = report.counts.MEDIUM;
    countLow.textContent = report.counts.LOW;
    countInfo.textContent = report.counts.INFO;

    document.getElementById("findingsTabBadge").textContent = report.findings.length;

    // Render Categories Breakdown
    renderCategories(report);

    // Render Findings List
    renderFindings(report.findings);

    // Render File Inspector
    renderFileInspector(report.filesMap, report.findings);

    // Render Ledger
    renderLedger(report.ledger);
  }

  function renderCategories(report) {
    categoriesList.innerHTML = "";
    const categoryCounts = {};
    report.findings.forEach(f => {
      categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
    });

    if (Object.keys(categoryCounts).length === 0) {
      categoriesList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem;">No security vulnerabilities detected across categories.</div>`;
      return;
    }

    for (const [catName, cnt] of Object.entries(categoryCounts)) {
      const pct = Math.min(100, cnt * 25);
      const item = document.createElement("div");
      item.className = "category-item";
      item.innerHTML = `
        <div class="cat-info">
          <span class="cat-name">${catName}</span>
          <span class="tab-badge">${cnt} finding(s)</span>
        </div>
        <div class="cat-bar-wrapper">
          <div class="cat-bar" style="width: ${pct}%"></div>
        </div>
      `;
      categoriesList.appendChild(item);
    }
  }

  function renderFindings(findings) {
    findingsList.innerHTML = "";
    if (findings.length === 0) {
      findingsList.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 2rem; text-align: center;">
          <div style="color: var(--verdict-pass); font-weight: 700; font-size: 1.2rem; margin-bottom: 0.5rem;">✓ No Security Vulnerabilities Found</div>
          <div style="color: var(--text-secondary); font-size: 0.9rem;">This scope passed all client-side static security analysis patterns cleanly.</div>
        </div>
      `;
      return;
    }

    findings.forEach(f => {
      const card = document.createElement("div");
      card.className = `finding-card ${f.severity.toLowerCase()}`;
      card.innerHTML = `
        <div class="finding-header">
          <div class="finding-title-group">
            <div class="finding-title">
              <span class="rule-id-tag">${f.ruleId}</span>
              ${f.title}
            </div>
            <div class="finding-loc">
              <span>📄 ${f.filePath}</span>
              <span>• Line ${f.lineNum}</span>
            </div>
          </div>
          <span class="sev-badge ${f.severity.toLowerCase()}">${f.severity}</span>
        </div>
        <div class="finding-body">${f.explanation}</div>
        <div class="code-snippet-box">Line ${f.lineNum}: ${escapeHtml(f.snippet)}</div>
        <div class="remediation-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <div><strong>Remediation:</strong> ${f.remediation}</div>
        </div>
      `;
      findingsList.appendChild(card);
    });
  }

  function renderFileInspector(filesMap, findings) {
    fileTreeSidebar.innerHTML = `<div class="tree-title">Skill Files (${Object.keys(filesMap).length})</div>`;
    codeLinesWrapper.innerHTML = "";
    const filePaths = Object.keys(filesMap);

    if (filePaths.length === 0) return;

    filePaths.forEach((path, idx) => {
      const fileFindingsCount = findings.filter(f => f.filePath === path).length;
      const fileBtn = document.createElement("div");
      fileBtn.className = `tree-file-item ${idx === 0 ? "active" : ""}`;
      fileBtn.innerHTML = `
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📄 ${path}</span>
        ${fileFindingsCount > 0 ? `<span class="tree-file-badge">${fileFindingsCount}</span>` : ""}
      `;

      fileBtn.addEventListener("click", () => {
        document.querySelectorAll(".tree-file-item").forEach(b => b.classList.remove("active"));
        fileBtn.classList.add("active");
        showCodeFile(path, filesMap[path], findings);
      });

      fileTreeSidebar.appendChild(fileBtn);
    });

    // Show first file
    showCodeFile(filePaths[0], filesMap[filePaths[0]], findings);
  }

  function showCodeFile(path, content, findings) {
    viewerFilename.textContent = `File: ${path}`;
    codeLinesWrapper.innerHTML = "";
    const fileFindings = findings.filter(f => f.filePath === path);
    const findingLineNums = new Set(fileFindings.map(f => f.lineNum));

    const lines = content.split('\n');
    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const lineDiv = document.createElement("div");
      const hasFinding = findingLineNums.has(lineNum);
      lineDiv.className = `code-line ${hasFinding ? "has-finding" : ""}`;
      lineDiv.innerHTML = `
        <span class="line-num">${lineNum}</span>
        <span class="line-content">${escapeHtml(lineText)}</span>
      `;
      codeLinesWrapper.appendChild(lineDiv);
    });
  }

  function renderLedger(ledger) {
    ledgerTableBody.innerHTML = "";
    ledger.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><code style="color: var(--accent-cyan);">${item.work_id}</code></td>
        <td>${item.path}</td>
        <td><span class="ledger-outcome ${item.outcome}">${item.outcome}</span></td>
        <td>${item.lines}</td>
        <td>${item.findings_count} ${item.reason ? `<span style="font-size: 0.75rem; color: var(--text-muted);">(${item.reason})</span>` : ''}</td>
      `;
      ledgerTableBody.appendChild(tr);
    });
  }

  // Helper
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function downloadFile(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  // Export handlers
  exportSarifBtn.addEventListener("click", () => {
    if (!currentReport) return;
    downloadFile(`skillspector_${currentReport.targetName.replace(/[\/\\:]/g, '_')}_sarif.json`, window.ExportUtils.toSARIF(currentReport));
  });

  exportJsonBtn.addEventListener("click", () => {
    if (!currentReport) return;
    downloadFile(`skillspector_${currentReport.targetName.replace(/[\/\\:]/g, '_')}_report.json`, window.ExportUtils.toJSON(currentReport));
  });

  exportMdBtn.addEventListener("click", () => {
    if (!currentReport) return;
    downloadFile(`skillspector_${currentReport.targetName.replace(/[\/\\:]/g, '_')}_report.md`, window.ExportUtils.toMarkdown(currentReport));
  });

  exportBaselineBtn.addEventListener("click", () => {
    if (!currentReport) return;
    downloadFile(`.skillspector-baseline.yaml`, window.BaselineGenerator.generateBaseline(currentReport));
  });

  // Modal Settings
  settingsBtn.addEventListener("click", () => settingsModal.classList.add("active"));
  closeModalBtn.addEventListener("click", () => settingsModal.classList.remove("active"));
  saveSettingsBtn.addEventListener("click", () => {
    const token = githubTokenInput.value.trim();
    if (token) {
      localStorage.setItem("skillspector_gh_token", token);
      fetcher.setToken(token);
    } else {
      localStorage.removeItem("skillspector_gh_token");
      fetcher.setToken(null);
    }
    settingsModal.classList.remove("active");
    alert("Settings saved successfully.");
  });
});
