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

// SearXNG search implementation with multiple instances
async function searxngSearch(query: string, maxResults: number = 5): Promise<WebSearchResult[]> {
  // Multiple SearXNG instances for fallback
  const searxngInstances = [
    process.env.SEARXNG_URL || 'https://searx.space',
    'https://searx.fmac.xyz',
    'https://search.sapti.me',
    'https://searx.tiekoetter.com',
    'https://searx.be'
  ];

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

  // Try each instance until one works
  for (const instance of searxngInstances) {
    try {
      const searchUrl = `${instance}/search`;
      
      const response = await fetch(`${searchUrl}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BioScriptor/1.0)',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 8000 // 8 second timeout per instance
      });

      if (!response.ok) {
        console.warn(`SearXNG instance ${instance} failed: ${response.status}`);
        continue;
      }

      const data: SearXNGResponse = await response.json();

      if (!data.results || data.results.length === 0) {
        console.warn(`SearXNG instance ${instance} returned no results`);
        continue;
      }

      const results = data.results
        ?.filter(result => result.title && result.content && result.url)
        ?.slice(0, maxResults)
        ?.map(result => ({
          title: result.title,
          url: result.url,
          snippet: result.content.length > 200 ? result.content.substring(0, 200) + '...' : result.content
        })) || [];

      if (results.length > 0) {
        console.log(`✅ SearXNG (${instance}) found ${results.length} results`);
        return results;
      }
    } catch (error) {
      console.warn(`SearXNG instance ${instance} failed:`, error.message);
      continue;
    }
  }

  console.error('All SearXNG instances failed');
  return [];
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