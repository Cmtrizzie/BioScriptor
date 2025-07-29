import fetch from 'node-fetch';

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  query: string;
  totalResults: number;
  searchTime: number;
}

interface SearXNGResult {
  title: string;
  url: string;
  content: string;
  engine: string;
  score: number;
}

interface SearXNGResponse {
  query: string;
  number_of_results: number;
  results: SearXNGResult[];
  answers: any[];
  corrections: any[];
  infoboxes: any[];
  suggestions: string[];
  unresponsive_engines: string[];
}

// SearXNG search implementation
async function searxngSearch(query: string, maxResults: number = 5): Promise<WebSearchResult[]> {
  try {
    // Use public SearXNG instance or configure your own
    const searxngUrl = process.env.SEARXNG_URL || 'https://searx.be';
    const searchUrl = `${searxngUrl}/search`;

    console.log('🔍 Performing web search with SearXNG...');

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      engines: 'google,bing,duckduckgo',
      categories: 'general',
      language: 'en',
      time_range: '',
      safesearch: '1'
    });

    const response = await fetch(`${searchUrl}?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'BioScriptor/1.0 (Scientific Research Assistant)',
        'Accept': 'application/json',
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`SearXNG API error: ${response.status} ${response.statusText}`);
    }

    const data: SearXNGResponse = await response.json();

    const results = data.results
      ?.filter(result => result.title && result.content && result.url)
      ?.slice(0, maxResults)
      ?.map(result => ({
        title: result.title,
        url: result.url,
        snippet: result.content.length > 200 ? result.content.substring(0, 200) + '...' : result.content
      })) || [];

    console.log(`✅ SearXNG found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('SearXNG search failed:', error.message);
    return [];
  }
}

export async function performWebSearch(query: string, maxResults: number = 5): Promise<WebSearchResult[]> {
  try {
    return await searxngSearch(query, maxResults);
  } catch (error) {
    console.error('Web search failed:', error);
    return [];
  }
}

export function formatSearchResults(results: WebSearchResult[]): string {
  if (results.length === 0) {
    return 'No web search results found. The search functionality may be temporarily unavailable.';
  }

  const formattedResults = results
    .filter(result => result.title && result.snippet) // Filter out empty results
    .slice(0, 5) // Limit to 5 results
    .map((result, index) => {
      const title = result.title.length > 100 ? result.title.substring(0, 100) + '...' : result.title;
      const snippet = result.snippet.length > 200 ? result.snippet.substring(0, 200) + '...' : result.snippet;

      return `${index + 1}. **${title}**\n   ${snippet}${result.url ? `\n   🔗 ${result.url}` : ''}`;
    })
    .join('\n\n');

  return `## 🌐 Web Search Results\n\n${formattedResults}`;
}

// Helper function to determine if a query might benefit from web search
export function shouldPerformWebSearch(query: string): boolean {
  const webSearchKeywords = [
    'latest', 'recent', 'news', 'current', 'today', 'this year', '2024', '2025',
    'what is', 'how to', 'tutorial', 'guide', 'example', 'documentation',
    'research', 'study', 'paper', 'publication', 'article',
    'protein', 'gene', 'sequence', 'genome', 'bioinformatics', 'molecular',
    'database', 'tool', 'software', 'algorithm', 'method',
    'covid', 'sars', 'virus', 'bacteria', 'disease', 'medicine'
  ];

  const queryLower = query.toLowerCase();
  return webSearchKeywords.some(keyword => queryLower.includes(keyword));
}

// Web search service object
export const webSearchService = {
  async search(query: string, options: { maxResults?: number; bioinformatics?: boolean } = {}): Promise<WebSearchResponse> {
    const startTime = Date.now();
    const results = await performWebSearch(query, options.maxResults || 5);

    return {
      results,
      query,
      totalResults: results.length,
      searchTime: Date.now() - startTime
    };
  },

  detectExplicitSearch(query: string): boolean {
    const explicitKeywords = ['search', 'look up', 'find', 'google', 'web search'];
    const queryLower = query.toLowerCase();
    return explicitKeywords.some(keyword => queryLower.includes(keyword));
  },

  detectImplicitTriggers(query: string): boolean {
    return shouldPerformWebSearch(query);
  },

  extractSearchTerms(query: string): string {
    // Remove common question words and extract key terms
    return query
      .replace(/^(what|how|when|where|why|who|can|could|should|would|please|help)\s+/i, '')
      .replace(/\b(is|are|was|were|the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  formatResultsForAI(searchResponse: WebSearchResponse): string {
    return formatSearchResults(searchResponse.results);
  }
};