
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
  private scrapeDuckApiKey: string;
  private baseUrl = 'https://api.scrapeduck.com/v1/search';

  constructor() {
    this.scrapeDuckApiKey = process.env.SCRAPEDUCK_API_KEY || '';
    if (!this.scrapeDuckApiKey) {
      console.warn('ScrapeDuck API key not found. Web search will be disabled.');
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

  // Perform web search using ScrapeDuck
  public async search(query: string, options: {
    maxResults?: number;
    bioinformatics?: boolean;
  } = {}): Promise<WebSearchResponse> {
    const startTime = Date.now();
    
    if (!this.scrapeDuckApiKey) {
      return {
        results: [],
        query,
        searchTime: Date.now() - startTime
      };
    }

    try {
      const searchQuery = this.buildSearchQuery(query, options.bioinformatics);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.scrapeDuckApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          num_results: options.maxResults || 5,
          search_type: 'web',
          include_answer: true,
          include_raw_content: false,
          max_chars_per_result: 300
        })
      });

      if (!response.ok) {
        throw new Error(`ScrapeDuck API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      const results: SearchResult[] = (data.results || []).map((result: any) => ({
        title: result.title || 'Untitled',
        url: result.url || '',
        snippet: result.description || result.snippet || '',
        date: result.date || undefined
      }));

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
      return "No web search results found.";
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
