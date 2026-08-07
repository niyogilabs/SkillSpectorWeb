// Main UI Controller for SkillSpector Web Application

document.addEventListener("DOMContentLoaded", () => {
  const engine = new window.SkillSpectorEngine();
  const fetcher = new window.GitHubFetcher();
  const litellmAnalyzer = new window.LiteLLMSemanticAnalyzer();

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

  // Settings Modal & LiteLLM Inputs
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const githubTokenInput = document.getElementById("githubTokenInput");

  const litellmEndpointInput = document.getElementById("litellmEndpointInput");
  const litellmKeyInput = document.getElementById("litellmKeyInput");
  const litellmModelInput = document.getElementById("litellmModelInput");

  const btnPresetPatternA = document.getElementById("btnPresetPatternA");
  const btnPresetPatternC = document.getElementById("btnPresetPatternC");
  const btnPresetOllama = document.getElementById("btnPresetOllama");
  const btnPresetOpenRouter = document.getElementById("btnPresetOpenRouter");

  // Trial Semantic UI Elements
  const runTrialSemanticBtn = document.getElementById("runTrialSemanticBtn");
  const semanticResultsBox = document.getElementById("semanticResultsBox");
  const semanticLoading = document.getElementById("semanticLoading");
  const semanticOutput = document.getElementById("semanticOutput");

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

  // Load saved settings
  const savedToken = localStorage.getItem("skillspector_gh_token");
  if (savedToken) {
    githubTokenInput.value = savedToken;
    fetcher.setToken(savedToken);
  }

  litellmEndpointInput.value = localStorage.getItem("skillspector_litellm_endpoint") || "http://localhost:4000/v1/chat/completions";
  litellmKeyInput.value = localStorage.getItem("skillspector_litellm_key") || "";
  litellmModelInput.value = localStorage.getItem("skillspector_litellm_model") || "gpt-4o-mini";

  // Preset Buttons
  if (btnPresetPatternA) {
    btnPresetPatternA.addEventListener("click", () => {
      litellmEndpointInput.value = "http://localhost:4000/v1/chat/completions";
      litellmKeyInput.value = "";
      litellmModelInput.value = "gpt-4o-mini";
    });
  }

  if (btnPresetPatternC) {
    btnPresetPatternC.addEventListener("click", () => {
      litellmEndpointInput.value = "https://litellm.yourcompany.com/v1/chat/completions";
      litellmKeyInput.value = "sk-litellm-enterprise-key";
      litellmModelInput.value = "gpt-4o-mini";
    });
  }

  if (btnPresetOllama) {
    btnPresetOllama.addEventListener("click", () => {
      litellmEndpointInput.value = "http://localhost:11434/v1/chat/completions";
      litellmKeyInput.value = "";
      litellmModelInput.value = "llama3";
    });
  }

  const btnPresetLMStudio = document.getElementById("btnPresetLMStudio");
  if (btnPresetLMStudio) {
    btnPresetLMStudio.addEventListener("click", () => {
      litellmEndpointInput.value = "http://localhost:1234/v1/chat/completions";
      litellmKeyInput.value = "";
      litellmModelInput.value = "local-model";
    });
  }

  if (btnPresetOpenRouter) {
    btnPresetOpenRouter.addEventListener("click", () => {
      litellmEndpointInput.value = "https://openrouter.ai/api/v1/chat/completions";
      litellmKeyInput.value = "";
      litellmModelInput.value = "openai/gpt-4o-mini";
    });
  }

  // Handle engine dropdown selection & dynamic help text
  const engineSelect = document.getElementById("engineSelect");
  const engineHelpText = document.getElementById("engineHelpText");

  const helpMessages = {
    "no-llm": '<strong>⚡ No-LLM Mode:</strong> Performs 100% browser-executed static WASM pattern matching. <em>No semantic LLM analysis will be performed.</em> Select LM Studio, Ollama, or LiteLLM to enable secondary semantic AI auditing.',
    "litellm": '<strong>🤖 LiteLLM Proxy Selected:</strong> Performs static WASM analysis first, then automatically queries your LiteLLM Proxy endpoint (configured in Settings) for secondary semantic AI auditing.',
    "ollama": '<strong>🦙 Ollama Local Selected:</strong> Performs static WASM analysis first, then automatically queries your local Ollama server (http://localhost:11434) for secondary semantic AI auditing.',
    "lmstudio": '<strong>💻 LM Studio Selected:</strong> Performs static WASM analysis first, then automatically queries your local LM Studio server (http://localhost:1234) for secondary semantic AI auditing.',
    "openrouter": '<strong>🌐 OpenRouter / Direct API Selected:</strong> Performs static WASM analysis first, then automatically queries OpenRouter for secondary semantic AI auditing.'
  };

  if (engineSelect) {
    engineSelect.addEventListener("change", () => {
      const mode = engineSelect.value;
      if (engineHelpText && helpMessages[mode]) {
        engineHelpText.innerHTML = helpMessages[mode];
      }
      if (mode === "litellm") {
        litellmEndpointInput.value = "http://localhost:4000/v1/chat/completions";
        litellmModelInput.value = "gpt-4o-mini";
      } else if (mode === "ollama") {
        litellmEndpointInput.value = "http://localhost:11434/v1/chat/completions";
        litellmModelInput.value = "llama3";
      } else if (mode === "lmstudio") {
        litellmEndpointInput.value = "http://localhost:1234/v1/chat/completions";
        litellmModelInput.value = "local-model";
      } else if (mode === "openrouter") {
        litellmEndpointInput.value = "https://openrouter.ai/api/v1/chat/completions";
        litellmModelInput.value = "openai/gpt-4o-mini";
      }
    });
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
        runInspection(sample.name, sample.files, [], {
          repoName: sample.repoName || sample.name,
          repoUrl: sample.repoUrl,
          badgeText: sample.badgeText || "🎯 Quick Demo Benchmark Sample"
        });
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

        let constructUrl = url;
        if (!constructUrl.startsWith("http")) {
          constructUrl = `https://github.com/${url.replace(/^\/+/, '')}`;
        }

        showLoading(true, "Running Security Scanner...", "Evaluating security patterns...");
        await runInspection(fetched.targetName, filteredMap, excludedList, {
          repoName: fetched.targetName,
          repoUrl: constructUrl,
          badgeText: "📁 Inspected Target Repository"
        });
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
      await runInspection("Pasted Skill Code", { "SKILL.md": code }, [], {
        repoName: "Pasted Skill Code",
        repoUrl: "https://github.com/NVIDIA/skillspector",
        badgeText: "📝 Pasted Code Snippet Audit"
      });
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
  async function runInspection(targetName, filesMap, excludedList = [], metaMeta = {}) {
    const report = await engine.inspect(targetName, filesMap);

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
    currentFilesMap = filesMap;
    renderResults(report, metaMeta);
    showLoading(false);
    resultsSection.classList.add("active");
    resultsSection.scrollIntoView({ behavior: "smooth" });

    if (engineSelect && engineSelect.value !== "no-llm") {
      triggerSemanticAnalysis();
    }
  }

  function renderResults(report, metaMeta = {}) {
    // Populate Prominent Report Heading Banner
    const reportScopeBadge = document.getElementById("reportScopeBadge");
    const reportHeadingTitle = document.getElementById("reportHeadingTitle");
    const reportRepoLink = document.getElementById("reportRepoLink");
    const reportRepoLinkText = document.getElementById("reportRepoLinkText");

    if (reportScopeBadge) reportScopeBadge.textContent = metaMeta.badgeText || "📁 Inspected Target Repository";
    if (reportHeadingTitle) reportHeadingTitle.textContent = metaMeta.repoName || report.targetName;
    
    if (reportRepoLink) {
      const targetUrl = metaMeta.repoUrl || (report.targetName.includes('/') ? `https://github.com/${report.targetName}` : "https://github.com/NVIDIA/skillspector");
      reportRepoLink.href = targetUrl;
    }
    if (reportRepoLinkText) {
      reportRepoLinkText.textContent = metaMeta.repoUrl ? "View Source on GitHub ↗" : "View Repository on GitHub ↗";
    }

    targetTitle.textContent = report.targetName;
    targetSub.textContent = `Scanned ${report.filesCount} file(s), ${report.linesCount} line(s)`;
    statFiles.textContent = report.filesCount;
    statLines.textContent = report.linesCount;
    statTime.textContent = new Date().toLocaleTimeString();

    // Reset semantic UI box
    const semanticCardContainer = document.getElementById("semanticCardContainer");
    if (semanticCardContainer) semanticCardContainer.style.display = "none";
    if (semanticResultsBox) semanticResultsBox.style.display = "block";
    if (semanticOutput) semanticOutput.innerHTML = "";

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

      report.discoveredSkills.forEach(sk => {
        const pill = document.createElement("button");
        pill.className = "sample-pill";
        pill.innerHTML = `🎯 ${sk.name} <span style="opacity: 0.6; font-size: 0.75rem;">(${sk.filePath})</span>`;
        pill.addEventListener("click", () => {
          document.querySelectorAll("#discoveredSkillsList .sample-pill").forEach(p => p.classList.remove("active"));
          pill.classList.add("active");

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

    renderCategories(report);
    renderFindings(report.findings);
    renderFileInspector(report.filesMap, report.findings);
    renderLedger(report.ledger);
  }

  // Trigger Semantic LLM Analysis
  async function triggerSemanticAnalysis() {
    if (!currentReport || !currentReport.filesMap) return;

    const semanticCardContainer = document.getElementById("semanticCardContainer");
    if (semanticCardContainer) semanticCardContainer.style.display = "block";
    semanticResultsBox.style.display = "block";
    semanticLoading.style.display = "block";
    semanticLoading.innerHTML = `
      <div style="margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: var(--accent-cyan);" id="semProgTitle">⏳ Initializing LLM Semantic Audit...</strong>
        <span style="font-size: 0.8rem; color: var(--text-muted);" id="semProgPct">0%</span>
      </div>
      <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: var(--radius-full); overflow: hidden; margin-bottom: 0.75rem;">
        <div id="semProgBar" style="width: 5%; height: 100%; background: var(--accent-cyan); transition: width 0.3s ease;"></div>
      </div>
    `;
    semanticOutput.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem;">
        <div style="font-weight: 700; font-size: 0.95rem; color: var(--accent-cyan); margin-bottom: 0.75rem;">
          📋 Per-Skill LLM Security Reviews (Auditing Skills in Progress...):
        </div>
        <div id="semanticSkillCardsList"></div>
      </div>
    `;

    const config = {
      endpoint: litellmEndpointInput.value.trim(),
      apiKey: litellmKeyInput.value.trim(),
      model: litellmModelInput.value.trim(),
      onProgress: (current, total, skillName, filePath, providerName) => {
        const pct = Math.round((current / total) * 100);
        const semProgTitle = document.getElementById("semProgTitle");
        const semProgPct = document.getElementById("semProgPct");
        const semProgBar = document.getElementById("semProgBar");

        if (semProgTitle) semProgTitle.textContent = `⏳ LLM Auditing Skill ${current} of ${total}: "${skillName}" (${providerName})`;
        if (semProgPct) semProgPct.textContent = `${pct}%`;
        if (semProgBar) semProgBar.style.width = `${pct}%`;
      },
      onSkillDone: (review, current, total) => {
        const container = document.getElementById("semanticSkillCardsList");
        if (container) {
          const card = document.createElement("div");
          card.style.cssText = "background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.85rem; margin-top: 0.6rem;";
          card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
              <strong style="color: var(--text-primary); font-size: 0.9rem;">🎯 Skill #${current} of ${total}: ${escapeHtml(review.skillName)} <span style="font-size: 0.75rem; color: var(--text-muted);">(${escapeHtml(review.filePath)})</span></strong>
              <span class="verdict-badge ${(review.verdict || 'PASS').toLowerCase()}" style="font-size: 0.75rem; padding: 0.2rem 0.6rem;">${review.verdict || 'PASS'}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
              <strong>Intent & Security Assessment:</strong> ${escapeHtml(review.intentAnalysis || 'Code matches stated prompt capabilities.')}
            </div>
            ${review.vulnerabilities && review.vulnerabilities.length > 0 ? `
              <div style="font-weight: 600; font-size: 0.8rem; color: var(--severity-high); margin-top: 0.4rem;">Identified Semantic Vulnerabilities:</div>
              ${review.vulnerabilities.map(v => `
                <div style="font-size: 0.8rem; background: rgba(220, 38, 38, 0.08); border-left: 3px solid var(--severity-high); padding: 0.4rem 0.6rem; margin-top: 0.3rem;">
                  ⚠️ ${escapeHtml(typeof v === 'object' ? v.title || v.explanation || JSON.stringify(v) : String(v))}
                </div>
              `).join('')}
            ` : `<div style="font-size: 0.8rem; color: var(--verdict-pass); margin-top: 0.2rem;">✓ No semantic intent anomalies detected for this skill.</div>`}
          `;
          container.appendChild(card);
        }
      }
    };

    try {
      const response = await litellmAnalyzer.analyzeSemantics({
        targetName: currentReport.targetName,
        staticFindings: currentReport.findings,
        filesMap: currentReport.filesMap,
        discoveredSkills: currentReport.discoveredSkills || [],
        config: config
      });

      semanticLoading.style.display = "none";

      if (response.success) {
        const res = response;
        const container = document.getElementById("semanticSkillCardsList");
        const cardsInnerHtml = container ? container.innerHTML : "";

        semanticOutput.innerHTML = `
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
              <span style="font-weight: 700; color: var(--accent-cyan); font-size: 1rem;">
                🤖 ${res.provider} Semantic Audit Report (${res.model})
              </span>
              <span class="verdict-badge ${(res.verdict || 'PASS').toLowerCase()}">
                Overall Risk Score: ${res.semanticRiskScore} / 100
              </span>
            </div>

            <div style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 1rem; background: var(--bg-tertiary); padding: 0.75rem; border-radius: var(--radius-sm);">
              <strong>Repository Security Summary:</strong> ${escapeHtml(res.overallSummary || 'Semantic audit completed across all discovered agent skills.')}
            </div>

            <div style="font-weight: 700; font-size: 0.95rem; color: var(--accent-cyan); margin-top: 1rem; margin-bottom: 0.5rem;">
              📋 Per-Skill LLM Security Reviews (${res.skillReviews.length} Discovered Skill(s) Audited):
            </div>

            <div id="semanticSkillCardsList">${cardsInnerHtml}</div>

            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1rem; text-align: right;">
              Queried via: <code>${res.endpoint}</code>
            </div>
          </div>
        `;
      } else {
        semanticOutput.innerHTML = `
          <div style="background: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: var(--radius-md); padding: 1rem; color: var(--severity-critical); font-size: 0.85rem;">
            <strong>⚠️ LLM Query Failed:</strong> ${response.error}
          </div>
        `;
      }
    } catch (err) {
      semanticLoading.style.display = "none";
      semanticOutput.innerHTML = `
        <div style="background: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: var(--radius-md); padding: 1rem; color: var(--severity-critical); font-size: 0.85rem;">
          <strong>⚠️ LLM Connection Error:</strong> ${err.message}
        </div>
      `;
    }
  }

  runTrialSemanticBtn.addEventListener("click", () => triggerSemanticAnalysis());

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

  // Test LLM Connection Handler
  const testLlmBtn = document.getElementById("testLlmBtn");
  const testLlmStatus = document.getElementById("testLlmStatus");

  if (testLlmBtn) {
    testLlmBtn.addEventListener("click", async () => {
      testLlmStatus.style.display = "block";
      testLlmStatus.style.color = "var(--accent-cyan)";
      testLlmStatus.innerHTML = "⏳ Testing LLM Endpoint Connection...";

      const config = {
        endpoint: litellmEndpointInput.value.trim(),
        apiKey: litellmKeyInput.value.trim(),
        model: litellmModelInput.value.trim()
      };

      try {
        const res = await litellmAnalyzer.testConnection(config);
        testLlmStatus.style.color = "var(--verdict-pass)";
        testLlmStatus.innerHTML = `✅ Successfully connected to LLM server at <code>${res.url}</code>!`;
      } catch (err) {
        testLlmStatus.style.color = "var(--severity-critical)";
        testLlmStatus.innerHTML = `⚠️ Connection Failed: ${err.message}<br><span style="color: var(--text-secondary); font-size: 0.8rem;">Check that your local LLM server (LM Studio / Ollama) is running and CORS is enabled.</span>`;
      }
    });
  }

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

    const litellmEndpoint = litellmEndpointInput.value.trim();
    const litellmKey = litellmKeyInput.value.trim();
    const litellmModel = litellmModelInput.value.trim();

    if (litellmEndpoint) localStorage.setItem("skillspector_litellm_endpoint", litellmEndpoint);
    if (litellmKey) localStorage.setItem("skillspector_litellm_key", litellmKey); else localStorage.removeItem("skillspector_litellm_key");
    if (litellmModel) localStorage.setItem("skillspector_litellm_model", litellmModel);

    settingsModal.classList.remove("active");
    alert("Settings saved successfully.");
  });
});
