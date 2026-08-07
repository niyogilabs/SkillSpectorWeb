// RepoFilter - Custom repository file filtering module for SkillSpector Web
// Kept in a separate file from translated engine code to maintain modularity.

class RepoFilter {
  static STANDARD_DOC_PATTERNS = [
    /^readme(\.[a-z0-9]+)?$/i,
    /^changelog(\.[a-z0-9]+)?$/i,
    /^contributing(\.[a-z0-9]+)?$/i,
    /^code_of_conduct(\.[a-z0-9]+)?$/i,
    /^license(\.[a-z0-9]+)?$/i,
    /^security(\.[a-z0-9]+)?$/i,
    /^support(\.[a-z0-9]+)?$/i,
    /^citation(\.[a-z0-9]+)?$/i,
    /^improvements(\.[a-z0-9]+)?$/i
  ];

  static SYSTEM_DIR_PATTERNS = [
    /\.git\//i,
    /\.github\//i,
    /node_modules\//i,
    /__pycache__\//i,
    /\.venv\//i,
    /venv\//i,
    /\.pytest_cache\//i
  ];

  /**
   * Check if a file path is a standard non-skill repository document file
   */
  static isStandardRepoDoc(filePath) {
    const filename = filePath.split('/').pop();
    return this.STANDARD_DOC_PATTERNS.some(pattern => pattern.test(filename));
  }

  /**
   * Check if a file path is a system metadata file or directory
   */
  static isSystemFile(filePath) {
    const filename = filePath.split('/').pop();
    if (filename.startsWith('.') && !filename.startsWith('.claude')) {
      return true;
    }
    return this.SYSTEM_DIR_PATTERNS.some(pattern => pattern.test(filePath));
  }

  /**
   * Filter files object according to configuration options
   */
  static filterFiles(filesMap, options = { omitDocs: true, omitSystem: true }) {
    const filteredMap = {};
    const excludedList = [];

    for (const [path, content] of Object.entries(filesMap)) {
      if (options.omitSystem && this.isSystemFile(path)) {
        excludedList.push({ path, reason: "System Metadata (.git / hidden)" });
        continue;
      }
      if (options.omitDocs && this.isStandardRepoDoc(path)) {
        excludedList.push({ path, reason: "Standard Repo Doc (README / CHANGELOG / LICENSE)" });
        continue;
      }
      filteredMap[path] = content;
    }

    return {
      filteredMap,
      excludedList
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RepoFilter;
}
if (typeof window !== 'undefined') {
  window.RepoFilter = RepoFilter;
}
