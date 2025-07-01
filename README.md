# Docusaurus llms.txt (and llms-full.txt) Generator
This Docusaurus plugin automatically generates two text files containing all the markdown content from your Docusaurus site:

- **`llms.txt`** - A condensed version with essential content
- **`llms-full.txt`** - A complete version with all markdown content

## What it does

The plugin scans your entire Docusaurus site directory and:

1. **Finds all markdown files** (`.md` and `.mdx`) recursively
2. **Excludes specified patterns** (defaults to `CLAUDE.md` and `node_modules`)
3. **Combines all content** into two output files
4. **Preserves file paths** for context

## Use cases

- **AI Training**: Feed your documentation to LLMs for context-aware assistance
- **Content Analysis**: Analyze your entire documentation corpus
- **Search Indexing**: Create searchable text files
- **Backup**: Generate text backups of all your documentation

## Configuration

The plugin is highly configurable with options for:
- Custom output file names
- Exclusion patterns
- Debug logging
- Content filtering

Perfect for teams who want to leverage their documentation with AI tools or need comprehensive text exports of their Docusaurus content.
