// GitHub Fetcher & Repository Inspector for Browser SkillSpector

class GitHubFetcher {
  constructor(token = null) {
    this.token = token;
  }

  setToken(token) {
    this.token = token;
  }

  getHeaders() {
    const headers = {
      "Accept": "application/vnd.github.v3+json"
    };
    if (this.token) {
      headers["Authorization"] = `token ${this.token}`;
    }
    return headers;
  }

  /**
   * Parse various GitHub input formats:
   * - https://github.com/owner/repo
   * - https://github.com/owner/repo/tree/main/skills/my-skill
   * - https://raw.githubusercontent.com/owner/repo/main/SKILL.md
   * - owner/repo
   */
  parseInput(inputStr) {
    let str = inputStr.trim();
    if (!str) throw new Error("Input string is empty.");

    // Raw GitHub URL
    if (str.includes("raw.githubusercontent.com")) {
      const match = str.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/);
      if (match) {
        return {
          type: "raw_file",
          owner: match[1],
          repo: match[2],
          branch: match[3],
          filePath: match[4],
          rawUrl: str
        };
      }
    }

    // Standard GitHub repo or tree URL
    if (str.startsWith("http://") || str.startsWith("https://")) {
      const url = new URL(str);
      if (url.hostname !== "github.com") {
        throw new Error(`Unsupported host: ${url.hostname}. Only github.com is supported.`);
      }
      const parts = url.pathname.replace(/^\//, '').split('/');
      if (parts.length < 2) {
        throw new Error("Invalid GitHub repository URL format.");
      }
      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/, '');

      if (parts.length >= 4 && parts[2] === "tree") {
        const branch = parts[3];
        const subPath = parts.slice(4).join('/');
        return {
          type: "repo_tree",
          owner,
          repo,
          branch,
          subPath: subPath || null
        };
      }

      if (parts.length >= 4 && parts[2] === "blob") {
        const branch = parts[3];
        const filePath = parts.slice(4).join('/');
        return {
          type: "raw_file",
          owner,
          repo,
          branch,
          filePath,
          rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
        };
      }

      return {
        type: "repo",
        owner,
        repo,
        branch: null,
        subPath: null
      };
    }

    // Short owner/repo format
    const parts = str.split('/');
    if (parts.length === 2) {
      return {
        type: "repo",
        owner: parts[0],
        repo: parts[1],
        branch: null,
        subPath: null
      };
    }

    throw new Error("Invalid GitHub URL or repository format. Example: https://github.com/owner/repo");
  }

  /**
   * Fetch repository content map (filename -> string content)
   * Support onProgress callback for live UI updates
   */
  async fetchSkill(inputStr, onProgress = null) {
    const parsed = this.parseInput(inputStr);

    if (parsed.type === "raw_file") {
      const resp = await fetch(parsed.rawUrl);
      if (!resp.ok) {
        throw new Error(`Failed to fetch raw file (${resp.status} ${resp.statusText})`);
      }
      const content = await resp.text();
      const filename = parsed.filePath.split('/').pop() || "SKILL.md";
      const files = {};
      files[filename] = content;
      return {
        targetName: `${parsed.owner}/${parsed.repo}/${parsed.filePath}`,
        files: files
      };
    }

    // Determine default branch if not specified
    let branch = parsed.branch;
    if (!branch) {
      if (onProgress) onProgress(0, 1, "Checking repository branch...");
      const repoInfoResp = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
        headers: this.getHeaders()
      });
      if (!repoInfoResp.ok) {
        if (repoInfoResp.status === 403) {
          throw new Error("GitHub API rate limit exceeded. Please add a Personal Access Token in Settings.");
        }
        throw new Error(`Repository not found or private (${repoInfoResp.status})`);
      }
      const repoInfo = await repoInfoResp.json();
      branch = repoInfo.default_branch || "main";
    }

    // Fetch recursive tree
    if (onProgress) onProgress(0, 1, `Fetching git tree for ${parsed.owner}/${parsed.repo} (${branch})...`);
    const treeResp = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`, {
      headers: this.getHeaders()
    });

    if (!treeResp.ok) {
      throw new Error(`Failed to fetch repository tree (${treeResp.status})`);
    }

    const treeData = await treeResp.json();
    const tree = treeData.tree || [];

    // Filter all relevant files across entire repository
    const fileEntries = tree.filter(item => {
      if (item.type !== "blob") return false;
      if (parsed.subPath && !item.path.startsWith(parsed.subPath)) return false;
      
      const lower = item.path.toLowerCase();
      // Skip binary image / video assets & lockfiles
      if (lower.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|mp4|zip|tar|gz|pdf|exe|dll|so|dylib)$/)) {
        return false;
      }
      if (lower.includes('.git/') || lower.includes('node_modules/') || lower.includes('__pycache__/')) {
        return false;
      }

      return (
        lower.endsWith('.md') ||
        lower.endsWith('.markdown') ||
        lower.endsWith('.json') ||
        lower.endsWith('.py') ||
        lower.endsWith('.sh') ||
        lower.endsWith('.bash') ||
        lower.endsWith('.zsh') ||
        lower.endsWith('.ps1') ||
        lower.endsWith('.js') ||
        lower.endsWith('.ts') ||
        lower.endsWith('.yaml') ||
        lower.endsWith('.yml') ||
        lower.endsWith('.toml') ||
        lower.endsWith('.txt') ||
        lower.includes('dockerfile') ||
        lower.includes('.cursorrules') ||
        lower.includes('.env.example')
      );
    });

    if (fileEntries.length === 0) {
      throw new Error("No agent skill or code files found in this repository scope.");
    }

    // High limit: up to 250 files to ensure 100% complete coverage for multi-skill repos
    const selectedFiles = fileEntries.slice(0, 250);
    const filesMap = {};
    let completedCount = 0;

    // Fetch files in batches of 10 for speed and stability
    const BATCH_SIZE = 10;
    for (let i = 0; i < selectedFiles.length; i += BATCH_SIZE) {
      const batch = selectedFiles.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (entry) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${entry.path}`;
          const res = await fetch(rawUrl);
          if (res.ok) {
            const text = await res.text();
            const displayPath = parsed.subPath ? entry.path.replace(parsed.subPath.replace(/\/$/, '') + '/', '') : entry.path;
            filesMap[displayPath] = text;
          }
        } catch (err) {
          console.warn(`Failed to fetch file ${entry.path}:`, err);
        } finally {
          completedCount++;
          if (onProgress) {
            onProgress(completedCount, selectedFiles.length, entry.path);
          }
        }
      }));
    }

    return {
      targetName: `${parsed.owner}/${parsed.repo}` + (parsed.subPath ? `/${parsed.subPath}` : ''),
      files: filesMap
    };
  }
}

window.GitHubFetcher = GitHubFetcher;
