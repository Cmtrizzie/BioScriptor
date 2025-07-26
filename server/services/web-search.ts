
import { spawn } from 'child_process';
import * as path from 'path';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

export interface WebSearchResponse {
  results: SearchResult[];
  query: string;
  searchTime: number;
}

export class WebSearchService {
  private scrapeDuckPath: string;
  private isAvailable: boolean = false;

  constructor() {
    this.scrapeDuckPath = path.join(process.cwd(), 'ScrapedDuck');
    this.checkScrapeDuckAvailability();
  }

  private async checkScrapeDuckAvailability(): Promise<void> {
    try {
      // Check if ScrapedDuck directory exists
      const fs = await import('fs').then(m => m.promises);
      await fs.access(this.scrapeDuckPath);
      this.isAvailable = true;
      console.log('✅ ScrapeDuck found and available for web search');
    } catch (error) {
      this.isAvailable = false;
      console.warn('⚠️ ScrapeDuck not found. Run "git clone https://github.com/bigfoott/ScrapedDuck.git" to enable web search');
    }
  }

  // Detect if user wants to search the web explicitly
  public detectExplicitSearch(query: string): boolean {
    const explicitTriggers = [
      /search\s+(the\s+)?web\s+for/i,
      /look\s+up/i,
      /find\s+(information|articles|studies|papers)\s+(about|on)/i,
      /google\s+(for|search)/i,
      /browse\s+(for|the\s+web)/i,
      /web\s+search/i,
      /online\s+search/i
    ];

    return explicitTriggers.some(pattern => pattern.test(query));
  }

  // Detect implicit triggers for background search
  public detectImplicitTriggers(query: string): boolean {
    const implicitTriggers = [
      /latest/i,
      /recent/i,
      /new/i,
      /current/i,
      /updated/i,
      /2024/i,
      /2023/i,
      /this\s+year/i,
      /nowadays/i,
      /modern/i,
      /state[-\s]of[-\s]the[-\s]art/i,
      /cutting[-\s]edge/i,
      /breakthrough/i,
      /novel/i,
      /emerging/i
    ];

    return implicitTriggers.some(pattern => pattern.test(query));
  }

  // Extract search terms from user query
  public extractSearchTerms(query: string): string {
    // Remove explicit search commands
    let cleanQuery = query
      .replace(/search\s+(the\s+)?web\s+for\s*/i, '')
      .replace(/look\s+up\s*/i, '')
      .replace(/find\s+(information|articles|studies|papers)\s+(about|on)\s*/i, '')
      .replace(/google\s+(for|search)\s*/i, '')
      .replace(/browse\s+(for|the\s+web)\s*/i, '')
      .replace(/web\s+search\s*/i, '')
      .replace(/online\s+search\s*/i, '');

    // Remove quotes and clean up
    cleanQuery = cleanQuery.replace(/["""]/g, '').trim();

    return cleanQuery || query;
  }

  // Perform web search using local ScrapeDuck
  public async search(query: string, options: {
    maxResults?: number;
    bioinformatics?: boolean;
  } = {}): Promise<WebSearchResponse> {
    const startTime = Date.now();
    
    if (!this.isAvailable) {
      return {
        results: [],
        query,
        searchTime: Date.now() - startTime
      };
    }

    try {
      const searchQuery = this.buildSearchQuery(query, options.bioinformatics);
      const results = await this.runScrapeDuck(searchQuery, options.maxResults || 5);
      
      return {
        results,
        query: searchQuery,
        searchTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Web search error:', error);
      return {
        results: [],
        query,
        searchTime: Date.now() - startTime
      };
    }
  }

  // Run ScrapeDuck locally
  private async runScrapeDuck(query: string, maxResults: number): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        path.join(this.scrapeDuckPath, 'main.py'),
        '--query', query,
        '--num-results', maxResults.toString(),
        '--output-format', 'json'
      ], {
        cwd: this.scrapeDuckPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('ScrapeDuck error:', errorOutput);
          reject(new Error(`ScrapeDuck exited with code ${code}: ${errorOutput}`));
          return;
        }

        try {
          // Parse the JSON output from ScrapeDuck
          const lines = output.trim().split('\n');
          const jsonLine = lines.find(line => line.startsWith('{') || line.startsWith('['));
          
          if (!jsonLine) {
            console.warn('No JSON output from ScrapeDuck');
            resolve([]);
            return;
          }

          const data = JSON.parse(jsonLine);
          const results: SearchResult[] = (Array.isArray(data) ? data : data.results || []).map((result: any) => ({
            title: result.title || 'Untitled',
            url: result.url || result.link || '',
            snippet: result.description || result.snippet || result.content || '',
            date: result.date || result.published_date || undefined
          }));

          resolve(results);
        } catch (parseError) {
          console.error('Failed to parse ScrapeDuck output:', parseError);
          console.log('Raw output:', output);
          resolve([]);
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start ScrapeDuck:', error);
        reject(error);
      });
    });
  }

  // Build optimized search query for bioinformatics
  private buildSearchQuery(query: string, bioinformatics = true): string {
    let searchQuery = query;

    if (bioinformatics) {
      // Add bioinformatics context if not already present
      const bioTerms = [
        'bioinformatics', 'genomics', 'proteomics', 'dna', 'rna', 'protein',
        'crispr', 'pcr', 'sequencing', 'gene', 'genome', 'molecular biology'
      ];
      
      const hasBioTerms = bioTerms.some(term => 
        query.toLowerCase().includes(term)
      );

      if (!hasBioTerms) {
        searchQuery = `${query} bioinformatics molecular biology`;
      }
    }

    // Add recent focus for time-sensitive queries
    if (this.detectImplicitTriggers(query)) {
      searchQuery += ' 2024 2023 recent';
    }

    return searchQuery;
  }

  // Format search results for AI context
  public formatResultsForAI(searchResponse: WebSearchResponse): string {
    if (searchResponse.results.length === 0) {
      return "No web search results found. To enable web search, clone ScrapeDuck: git clone https://github.com/bigfoott/ScrapedDuck.git";
    }

    let formatted = `## Web Search Results for "${searchResponse.query}"\n\n`;
    
    searchResponse.results.forEach((result, index) => {
      formatted += `### ${index + 1}. ${result.title}\n`;
      formatted += `**URL:** ${result.url}\n`;
      if (result.date) {
        formatted += `**Date:** ${result.date}\n`;
      }
      formatted += `**Summary:** ${result.snippet}\n\n`;
    });

    formatted += `*Search completed in ${searchResponse.searchTime}ms*\n\n`;
    
    return formatted;
  }
}

export const webSearchService = new WebSearchService();
