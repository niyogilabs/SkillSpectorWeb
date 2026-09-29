# 🛡️ SkillSpector Web

**Browser Port of SkillSpector Maintained for User Convenience**

SkillSpector Web is a client-side browser port of SkillSpector maintained for user convenience. It enables visitors to input a GitHub repository or `SKILL.md` URL and perform security inspection directly in their browser without requiring local CLI tool installations.

- **Derived Version**: SkillSpector `v2.12.0`
- **Hosting URL**: `https://skillspector.niyogilabs.com`

---

## 🌐 GitHub Pages Deployment via `/docs` Folder

All static hosting files are located in the `docs/` directory.

### To host on GitHub Pages:
1. Push the repository to GitHub.
2. Go to your repository on GitHub -> **Settings** -> **Pages**.
3. Under **Build and deployment** -> **Source**: Select **Deploy from a branch**.
4. Under **Branch**: Select `main` (or `master`) and change the folder from `/ (root)` to `/docs`.
5. Click **Save**.
6. Under **Custom domain**: Ensure `skillspector.niyogilabs.com` is entered (configured via `docs/CNAME`).

---

## 📁 Directory Structure (`docs/`)

```
SkillSpectorWeb/
├── docs/                        # Static website files for GitHub Pages (/docs)
│   ├── index.html               # Main HTML app with SEO & theme switcher
│   ├── css/
│   │   └── styles.css           # Light theme (default) & dark mode CSS
│   ├── js/
│   │   ├── app.js               # Main UI controller & theme toggle
│   │   ├── github-fetcher.js    # Client-side GitHub REST API fetcher
│   │   ├── repo-filter.js       # Isolated system & doc filter module
│   │   ├── skillspector-engine.js# Core scanner engine
│   │   ├── export-utils.js      # SARIF, JSON, Markdown export
│   │   ├── baseline-generator.js# .skillspector-baseline.yaml generator
│   │   └── samples.js           # Demo skill samples
│   ├── CNAME                    # skillspector.niyogilabs.com
│   ├── sitemap.xml              # SEO sitemap
│   ├── robots.txt               # SEO crawler directives
│   └── .nojekyll                # Disables Jekyll processing on GitHub Pages
├── LICENSE                      # Official unedited root LICENSE
├── server.py                    # Local HTTP preview server (serves docs/)
├── README.md                    # Project documentation
└── package.json                 # Project metadata & npm dev scripts
```

---

## 🚀 Quick Start (Running Locally)

To preview SkillSpector Web locally from the `docs/` directory:

```bash
cd SkillSpectorWeb
python3 server.py 8090
```

Then open `http://localhost:8090` in your web browser.
