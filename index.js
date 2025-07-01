const path = require('path');
const fs = require('fs').promises;

module.exports = function pluginLlmsGenerator(context, options) {
  // Configuration for the plugin
  // outputFileName: The name of the file to write the LLM content to
  // outputFileNameFull: The name of the file to write the full LLM content to
  // excludePatterns: A list of patterns to exclude from the LLM content
  // debug: Whether to log debug information
  const {
    outputFileName = 'llms.txt',
    outputFileNameFull = 'llms-full.txt',
    excludePatterns = ['**/CLAUDE.md', '**/node_modules/**'],
    debug = false
  } = options || {};

  const log = (...args) => {
    if (debug) {
      console.log('[docusaurus-plugin-llms-txt]', ...args);
    }
  };

  return {
    name: 'docusaurus-plugin-llms-txt',

    async loadContent() {
      const { siteDir } = context;
      const allMdContent = [];
      
      log('Loading content from:', siteDir);
      
      // Recursive function to get all markdown files
      const getMdFiles = async (dir) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // Skip excluded patterns
          const relativePath = path.relative(siteDir, fullPath);
          const shouldExclude = excludePatterns.some(pattern => {
            // Simple pattern matching (could be enhanced with glob library)
            if (pattern.includes('**')) {
              const parts = pattern.split('**');
              return parts.every(part => relativePath.includes(part.replace(/\*/g, '')));
            }
            return relativePath.includes(pattern.replace(/\*/g, ''));
          });
          
          if (shouldExclude) {
            log('Skipping excluded path:', relativePath);
            continue;
          }
          
          if (entry.isDirectory()) {
            await getMdFiles(fullPath);
          } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
            log('Reading file:', relativePath);
            const content = await fs.readFile(fullPath, 'utf8');
            allMdContent.push({
              path: relativePath,
              content
            });
          }
        }
      };
      
      await getMdFiles(siteDir);
      log(`Loaded ${allMdContent.length} markdown files`);
      
      return { allMdContent };
    },

    async postBuild({ content, routes, outDir }) {
      log('Running postBuild hook');
      const { allMdContent } = content;
      
      // Write concatenated markdown content
      const concatenatedPath = path.join(outDir, outputFileNameFull);
      const concatenatedContent = allMdContent
        .map(({ path: filePath, content }) => `<!-- Source: ${filePath} -->\n\n${content}`)
        .join('\n\n---\n\n');
      
      await fs.writeFile(concatenatedPath, concatenatedContent);
      log(`Written ${outputFileNameFull} (${concatenatedContent.length} bytes)`);
      
      // Find docs plugin routes
      log('Looking for docs plugin routes...');
      const docsRoutes = [];
      
      const findDocsRoutes = (routeList) => {
        for (const route of routeList) {
          if (route.plugin?.name?.includes('docusaurus-plugin-content-docs')) {
            log(`Found docs plugin: ${route.plugin.name}`);
            docsRoutes.push(route);
          }
          if (route.routes) {
            findDocsRoutes(route.routes);
          }
        }
      };
      
      findDocsRoutes(routes);
      
      // Extract documentation structure
      const docEntries = [];
      
      for (const docsRoute of docsRoutes) {
        if (!docsRoute.routes) continue;
        
        // Look for routes with documentation
        const processRoutes = (routes, basePath = '') => {
          for (const route of routes) {
            if (route.path === '/' && route.props?.version?.docs) {
              // Found version docs
              const versionDocs = route.props.version.docs;
              log(`Found ${Object.keys(versionDocs).length} docs in version`);
              
              for (const [docPath, doc] of Object.entries(versionDocs)) {
                if (doc.title) {
                  docEntries.push({
                    path: docPath,
                    title: doc.title,
                    description: doc.description || '',
                    id: doc.id || doc.unversionedId || ''
                  });
                }
              }
            }
            
            // Check nested routes
            if (route.routes) {
              processRoutes(route.routes, route.path);
            }
          }
        };
        
        processRoutes(docsRoute.routes);
      }
      
      log(`Found ${docEntries.length} documentation entries`);
      
      // Build llms.txt content
      let llmsTxtContent = `# ${context.siteConfig.title}`;
      if (context.siteConfig.tagline) {
        llmsTxtContent += `\n\n${context.siteConfig.tagline}`;
      }
      
      if (docEntries.length > 0) {
        llmsTxtContent += '\n\n## Documentation\n\n';
        
        // Sort entries by path for consistent output
        docEntries.sort((a, b) => a.path.localeCompare(b.path));
        
        for (const entry of docEntries) {
          llmsTxtContent += `- [${entry.title}](${entry.path})`;
          if (entry.description) {
            llmsTxtContent += `: ${entry.description}`;
          }
          llmsTxtContent += '\n';
        }
      }
      
      // Add metadata
      llmsTxtContent += `\n\n## Metadata\n\n`;
      llmsTxtContent += `- Generated: ${new Date().toISOString()}\n`;
      llmsTxtContent += `- Base URL: ${context.siteConfig.url}${context.siteConfig.baseUrl}\n`;
      llmsTxtContent += `- Total Documents: ${docEntries.length}\n`;
      
      // Write llms.txt file
      const llmsTxtPath = path.join(outDir, outputFileName);
      await fs.writeFile(llmsTxtPath, llmsTxtContent);
      log(`Written ${outputFileName} (${llmsTxtContent.length} bytes)`);
      
      console.log(`✅ Generated LLM files: ${outputFileName} and ${outputFileNameFull}`);
    }
  };
};