---
name: skillspector-wasm-porting
description: Porting guide and methodology for upgrading SkillSpector Python releases to browser-executed WebAssembly/JS web applications. Use when porting a new SkillSpector release, updating scanner rules, configuring multi-skill discovery, setting up LiteLLM semantic plugins, running functional equivalence test suites, or packaging GitHub Pages hosting files under docs/.
---

# SkillSpector Browser Porting & Upgrade Methodology

This skill provides step-by-step instructions for porting a new version of the **SkillSpector** Python security scanner into a 100% browser-executed WebAssembly / JavaScript web application (**SkillSpectorWeb**).

---

## 🎯 Architectural Principles

1. **100% Client-Side Browser Execution**:
   - The static scanner must run entirely in the user's browser without requiring a backend server.
   - All GitHub repository content is fetched via public GitHub REST APIs (`api.github.com` and `raw.githubusercontent.com`).

2. **Strict Module Isolation & Plug-in Architecture**:
   - **Core Scanner Engine** (`docs/js/skillspector-engine.js`): Pure translated static analysis rules matching Python `nodes/analyzers/`. Must remain untouched by UI or LLM logic for easy upgrades.
   - **Isolated Repo Filter** (`docs/js/repo-filter.js`): Keeps custom non-skill file filtering (`README.md`, `CHANGELOG.md`, `.git/`, etc.) separated from translated scanner code.
   - **GitHub Fetcher** (`docs/js/github-fetcher.js`): Handles URL parsing, tree expansion, and batch downloading.
   - **LLM Semantic Analyzer Plugin** (`docs/js/llm-semantic-analyzer.js`): Isolated plugin module for optional secondary semantic AI analysis via LiteLLM Localhost Proxy (`http://localhost:4000`), LM Studio (`http://localhost:1234`), Ollama, Enterprise Gateways, or OpenRouter without exposing user credentials.

3. **Multi-Skill Repository Support**:
   - Must mirror `src/skillspector/multi_skill.py` to discover all nested skills across a repository (`resources/skills/*.md`, `skills/*.md`, `agents/*.md`).

4. **License & Version Parity**:
   - Retain exact version numbers (`vX.Y.Z`) matching the upstream Python SkillSpector release.
   - Preserve the unedited upstream `LICENSE` (Apache 2.0).

---

## 📋 Step-by-Step Porting Workflow

### Phase 1: Rule & AST Analysis Extraction
1. Inspect new analyzer rules in upstream `src/skillspector/nodes/analyzers/`:
   - `pattern_defaults.py` (Rule IDs: `P1`-`P8`, `E1`-`E5`, `PE1`-`PE3`, `SC1`-`SC7`, `EA1`-`EA4`, `OH1`-`OH3`, `MP1`-`MP3`, `TM1`-`TM4`, `RA1`-`RA2`, `TR1`-`TR3`, `MCP1`).
2. Translate new Python regexes and AST checks into JavaScript `RegExp` patterns inside `docs/js/skillspector-engine.js`.
3. Update category lists, rule descriptions, explanations, and remediation guides.

### Phase 2: GitHub Fetcher & Tree Expansion
1. Ensure `docs/js/github-fetcher.js` fetches recursive tree structures via `https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1`.
2. Do **NOT** cap fetching to small arbitrary file limits (use high threshold up to 250 files to support large multi-skill repositories).
3. Use parallel batch fetching (e.g. 10 files per batch) with live UI progress callbacks (`onProgress(current, total, filename)`).

### Phase 3: Multi-Skill Discovery Engine
1. Implement `discoverSkills(filesMap)` in `skillspector-engine.js`.
2. Parse Markdown frontmatter YAML (`--- name: ... description: ... ---`) for all `.md` files in the repository.
3. Render a multi-skill selector bar in `index.html` allowing users to filter findings by individual discovered skill or inspect the whole repository context.

### Phase 4: Isolated Repository File Filtering
1. Keep `docs/js/repo-filter.js` completely separate from the core scanner engine.
2. Provide UI checkboxes in `index.html`:
   - `Omit Standard Repo Docs (README, CHANGELOG, LICENSE)`
   - `Omit System Metadata (.git/, .github/, dotfiles)`
3. Log omitted files into the **Inspection Ledger** as `skipped` items with explicit reasons.

### Phase 5: Segregated LLM Semantic Analyzer Plugin
1. Implement optional LLM semantic analysis in `docs/js/llm-semantic-analyzer.js`.
2. Support Zero-Trust provider endpoints:
   - LiteLLM Localhost Proxy (`http://localhost:4000/v1/chat/completions`)
   - Enterprise LiteLLM Gateway (`https://litellm.company.com/v1`) with Virtual Keys (`sk-litellm-...`)
   - Localhost Ollama (`http://localhost:11434/v1`)
   - OpenRouter / Direct OpenAI APIs
3. Format prompts to request structured JSON output for `semanticRiskScore`, `intentAnalysis`, and `semanticVulnerabilities`.

### Phase 6: Automated Functional Equivalence Testing & Pre-Commit Hook
1. Maintain Node.js test harness `tests/test_equivalence.js` executing `SkillSpectorEngine` against test skill fixtures from `SkillSpector-X.Y.Z/tests/fixtures/`.
2. Maintain Python cross-engine comparison script `tests/compare_python_vs_wasm.py`.
3. Install Git pre-commit hook (`.githooks/pre-commit` -> `.git/hooks/pre-commit`) via `npm run prepare` to automatically block commits if functional equivalence tests fail.

### Phase 7: Search Engine (SEO) & Generative Engine (GEO) Optimization
1. Package `docs/llms.txt` and `docs/llms-full.txt` standard files detailing tool capabilities, privacy model, and rule catalogs for AI search engines (Perplexity, ChatGPT Search, Claude, Gemini).
2. Embed `WebApplication` and `FAQPage` JSON-LD schemas in `docs/index.html`.
3. Include an on-page FAQ section addressing common search queries.
4. Ensure `docs/sitemap.xml` and `docs/robots.txt` permit indexing of `llms.txt` files.

### Phase 8: GitHub Pages Packaging (`docs/`)
1. Ensure all static website assets live exclusively inside `SkillSpectorWeb/docs/`:
   - `docs/index.html`
   - `docs/css/styles.css`
   - `docs/js/*.js`
   - `docs/CNAME` (`skillspector.niyogilabs.com`)
   - `docs/sitemap.xml`
   - `docs/robots.txt`
   - `docs/llms.txt` & `docs/llms-full.txt`
   - `docs/.nojekyll`
   - `docs/LICENSE`
2. Ensure `server.py` serves the `docs/` directory by default.

---

## 🧪 Verification Checklist

- [ ] `npm test` runs `tests/test_equivalence.js` and passes 100%.
- [ ] Git pre-commit hook is active (`.git/hooks/pre-commit`) and executes `npm test` before commits.
- [ ] `python3 server.py 8080` launches and serves cleanly from `docs/`.
- [ ] Scanning a multi-skill repo (e.g., `Bhanunamikaze/Agentic-SEO-Skill`) discovers all nested skills.
- [ ] Light theme is set as default; Dark theme toggle works and persists in `localStorage`.
- [ ] SEO & LLM endpoints (`/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/llms-full.txt`, `/CNAME`) return `200 OK`.
- [ ] LiteLLM Semantic Analyzer plugin module (`docs/js/litellm-semantic-analyzer.js`) initializes without errors.
- [ ] SARIF 2.1.0, JSON, and Markdown export functions run cleanly.
- [ ] Unedited root `LICENSE` file is intact.
