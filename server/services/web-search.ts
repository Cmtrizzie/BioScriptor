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

// DuckDuckGo Instant Answer API and HTML fallback
async function duckduckgoSearch(query: string, maxResults: number = 5): Promise<WebSearchResult[]> {
  try {
    console.log('🦆 Trying DuckDuckGo Instant Answer API...');
    
    // First try the Instant Answer API
    const instantUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    const instantResponse = await fetch(instantUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BioScriptor/1.0)',
      },
      timeout: 8000
    });

    if (instantResponse.ok) {
      const instantData = await instantResponse.json();
      
      // Check for abstract or definition
      if (instantData.Abstract && instantData.AbstractText) {
        return [{
          title: instantData.Heading || `Information about: ${query}`,
          url: instantData.AbstractURL || 'https://duckduckgo.com',
          snippet: instantData.AbstractText.substring(0, 200)
        }];
      }
      
      // Check for related topics
      if (instantData.RelatedTopics && instantData.RelatedTopics.length > 0) {
        const results = instantData.RelatedTopics
          .slice(0, maxResults)
          .filter(topic => topic.Text && topic.FirstURL)
          .map(topic => ({
            title: topic.Text.split(' - ')[0] || 'Related Information',
            url: topic.FirstURL,
            snippet: topic.Text.substring(0, 200)
          }));
        
        if (results.length > 0) {
          console.log(`✅ DuckDuckGo Instant API found ${results.length} results`);
          return results;
        }
      }
    }
    
    console.log('🔄 DuckDuckGo Instant API had no results, trying HTML search...');
    
    // Fallback to HTML scraping
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000
    });

    if (!response.ok) {
      console.warn('DuckDuckGo HTML failed:', response.status);
      return [];
    }

    const html = await response.text();
    
    // Improved regex patterns for better extraction
    const results: WebSearchResult[] = [];
    const resultPattern = /<div class="result__body">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    
    let match;
    let count = 0;
    
    while ((match = resultPattern.exec(html)) && count < maxResults) {
      const url = match[1];
      const title = match[2].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      const snippet = match[3].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      
      if (url && title && !url.includes('duckduckgo.com') && title.length > 0) {
        results.push({
          title: title.substring(0, 100),
          url: url,
          snippet: snippet.substring(0, 200) || title
        });
        count++;
      }
    }
    
    console.log(`✅ DuckDuckGo HTML found ${results.length} results`);
    return results;
    
  } catch (error) {
    console.warn('DuckDuckGo search failed:', error.message);
    return [];
  }
}

// SearXNG search implementation with multiple instances
async function searxngSearch(query: string, maxResults: number = 5): Promise<WebSearchResult[]> {
  // Updated working SearXNG instances (January 2025) - more reliable public instances
  const searxngInstances = [
    'https://search.inetol.net',
    'https://searx.work',
    'https://searx.prvcy.eu',
    'https://searx.be',
    'https://searxng.thegpm.org'
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
    // Try SearXNG first
    const searxResults = await searxngSearch(query, maxResults);
    if (searxResults.length > 0) {
      return searxResults;
    }
    
    // Fallback to DuckDuckGo if SearXNG fails
    console.log('🔄 SearXNG failed, trying DuckDuckGo fallback...');
    const ddgResults = await duckduckgoSearch(query, maxResults);
    if (ddgResults.length > 0) {
      return ddgResults;
    }
    
    // If both fail, return mock results for development
    console.log('⚠️ All search methods failed, using mock results');
    return [{
      title: `Search Results for: ${query}`,
      url: 'https://example.com/search-unavailable',
      snippet: 'Web search is temporarily unavailable. The query was processed but external search services are not accessible.'
    }];
    
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