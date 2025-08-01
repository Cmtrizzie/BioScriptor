import fetch from 'node-fetch';
import { spawn } from 'child_process';
import path from 'path';

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

// Simple in-memory cache for recent searches (5 minute expiry)
const searchCache = new Map<string, { results: WebSearchResult[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Enhanced Python-based web search with caching
async function pythonWebSearch(query: string, maxResults: number = 5): Promise<WebSearchResult[]> {
  // Check cache first
  const cacheKey = `${query.toLowerCase().trim()}_${maxResults}`;
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('📋 Using cached search results');
    return cached.results;
  }

  return new Promise((resolve) => {
    console.log('🔍 Starting Python web search...');

    const searchScript = path.join(process.cwd(), 'server', 'services', 'scrapy-search.py');
    const pythonProcess = spawn('python3', [searchScript, query, maxResults.toString()], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 20000,
      env: { ...process.env, PYTHONPATH: process.cwd() }
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
      if (code === 0 && output.trim()) {
        try {
          const result = JSON.parse(output.trim());
          if (result.results && Array.isArray(result.results) && result.results.length > 0) {
            const searchResults = result.results.map(r => ({
              title: r.title || 'Untitled',
              url: r.url || '',
              snippet: r.snippet || r.title || 'No description available'
            }));
            
            // Cache the results
            searchCache.set(cacheKey, { results: searchResults, timestamp: Date.now() });
            
            console.log(`✅ Python search found ${result.results.length} results`);
            resolve(searchResults);
          } else {
            console.warn('Python search returned no results');
            resolve([]);
          }
        } catch (parseError) {
          console.warn('Failed to parse Python search output:', parseError.message);
          resolve([]);
        }
      } else {
        console.warn(`Python search failed with code ${code}`);
        if (errorOutput) {
          console.warn('Error output:', errorOutput);
        }
        resolve([]);
      }
    });

    pythonProcess.on('error', (error) => {
      console.warn('Python search process error:', error.message);
      resolve([]);
    });

    // Timeout handler
    const timeoutId = setTimeout(() => {
      pythonProcess.kill('SIGTERM');
      console.warn('Python search timed out');
      resolve([]);
    }, 18000);

    // Clear timeout if process ends normally
    pythonProcess.on('close', () => {
      clearTimeout(timeoutId);
    });
  });
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
  // Use only working public instances (local Docker not available on Replit)
  const searxngInstances = [
    'https://searx.be',
    'https://searx.work',
    'https://search.bus-hit.me',
    'https://searx.tiekoetter.com',
    'https://searx.space'
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
        timeout: instance.includes('localhost') || instance.includes('0.0.0.0') ? 5000 : 8000
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
    console.log(`🔍 Performing web search for: "${query}"`);

    // Try Python-based search first (most reliable)
    const pythonResults = await pythonWebSearch(query, maxResults);
    if (pythonResults.length > 0) {
      console.log(`✅ Python search successful: ${pythonResults.length} results`);
      return pythonResults;
    }

    // Fallback to DuckDuckGo direct search
    console.log('🔄 Python search failed, trying DuckDuckGo fallback...');
    const ddgResults = await duckduckgoSearch(query, maxResults);
    if (ddgResults.length > 0) {
      console.log(`✅ DuckDuckGo search successful: ${ddgResults.length} results`);
      return ddgResults;
    }

    // Fallback to SearXNG
    console.log('🔄 DuckDuckGo failed, trying SearXNG fallback...');
    const searxResults = await searxngSearch(query, maxResults);
    if (searxResults.length > 0) {
      console.log(`✅ SearXNG search successful: ${searxResults.length} results`);
      return searxResults;
    }

    // If all methods fail, return empty array
    console.log('⚠️ All search methods failed');
    return [];

  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}

export function formatSearchResults(results: WebSearchResult[]): string {
  if (results.length === 0) {
    return '';
  }

  const validResults = results
    .filter(result => result.title && result.snippet && result.title.trim() !== '' && result.snippet.trim() !== '')
    .slice(0, 5); // Use more results for better context

  if (validResults.length === 0) {
    return '';
  }

  const formattedResults = validResults
    .map((result, index) => {
      const title = result.title.length > 100 ? result.title.substring(0, 100) + '...' : result.title;
      const snippet = result.snippet.length > 400 ? result.snippet.substring(0, 400) + '...' : result.snippet;
      
      return `RESULT ${index + 1}:
TITLE: ${title}
CONTENT: ${snippet}
---`;
    })
    .join('\n\n');

  return formattedResults;
}

// Enhanced function to determine if a query should trigger web search - more selective and intelligent
function shouldPerformWebSearch(query: string): boolean {
  if (!query || typeof query !== 'string') {
    return false;
  }

  const queryLower = query.toLowerCase().trim();

  // Skip all basic conversational queries and greetings
  if (/^(hi|hello|hey|thanks|thank you|bye|goodbye|yes|no|ok|okay|sup|yo|howdy|greetings)$/i.test(queryLower)) {
    return false;
  }

  // Skip extended greetings and casual conversation
  if (/^(hi there|hello there|hey there|good morning|good afternoon|good evening|how are you|how's it going|what's up|how are you doing|how are you doing today|what's new|how's your day|nice to meet you|pleasure to meet you)$/i.test(queryLower)) {
    return false;
  }

  // Skip casual conversation with variations and typos - EXPANDED
  if (/(^|\s)(thy|ur|u|r)\s+(doing|going|been|feeling|up to)|ntin big|nothing much|not much|just chilling|just hanging|what about you|wbu|same here|cool|nice|awesome|great|good|fine|alright/i.test(queryLower)) {
    return false;
  }

  // Skip personal questions about the AI
  if (/^(what's your name|who are you|what are you|tell me about yourself|introduce yourself)$/i.test(queryLower)) {
    return false;
  }

  // Skip simple math or basic programming questions
  if (/^(what is \d+[\+\-\*\/]\d+|calculate \d+|simple math)$/i.test(queryLower)) {
    return false;
  }

  // Skip general bioinformatics questions (let AI handle these)
  if (/\b(dna|rna|protein|sequence|crispr|pcr|gene|genome|bioinformatics|analyze|design|optimize)\b/i.test(queryLower) && !/\b(latest|recent|current|news|2024|2025|breakthrough|discovery)\b/i.test(queryLower)) {
    return false;
  }

  // Skip general coding/programming questions (let AI handle these)
  if (/\b(code|function|script|programming|syntax|variable|array|loop|algorithm|debug|error|help me)\b/i.test(queryLower) && !/\b(latest|recent|current|news|2024|2025|release|update)\b/i.test(queryLower)) {
    return false;
  }

  // ALWAYS search for explicit search requests
  if (/\b(search|find|lookup|look up|google|web search|check|verify)\b/i.test(queryLower)) {
    return true;
  }

  // ALWAYS search for current/time-sensitive information
  if (/\b(latest|recent|current|today|now|this week|this month|2024|2025|news|trending|happening|update|headlines|breaking|live)\b/i.test(queryLower)) {
    return true;
  }

  // ALWAYS search for sports queries
  if (/\b(arsenal|man u|manchester united|chelsea|liverpool|tottenham|city|united|next match|fixture|premier league|football|soccer|match|game|won|winner|champion|season|league|table|score|result|transfer|player)\b/i.test(queryLower)) {
    return true;
  }

  // ALWAYS search for financial/market data
  if (/\b(price|cost|value|market|stock|crypto|bitcoin|ethereum|btc|eth|trading|exchange|usd|eur|inflation|economy)\b/i.test(queryLower)) {
    return true;
  }

  // ALWAYS search for weather and location queries
  if (/\b(weather|temperature|forecast|rain|snow|sunny|cloudy|climate)\b/i.test(queryLower)) {
    return true;
  }

  // ALWAYS search for people and biographical information
  if (/\b(who is|who are|biography|born|age|nationality|career|achievements)\b/i.test(queryLower)) {
    return true;
  }

  // ONLY search for specific factual questions starting with interrogative words that seem to need current info
  if (/^(what|where|when|why|how|which|who)(?:\s|')/i.test(queryLower)) {
    // But exclude general "how to" questions that are educational
    if (/^(how to|what is|explain|what are)/i.test(queryLower) && !/\b(latest|recent|current|today|now|2024|2025|news)\b/i.test(queryLower)) {
      return false;
    }
    return true;
  }

  // For everything else, be more conservative - only search if it contains time-sensitive keywords
  if (/\b(latest|current|recent|today|now|2024|2025|news|update|announcement|release|happening)\b/i.test(queryLower)) {
    return true;
  }

  return false;
}

// Web search service object with Scrapy integration
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
    if (!query || typeof query !== 'string') {
      return false;
    }
    const explicitKeywords = ['search', 'look up', 'find', 'google', 'web search'];
    const queryLower = query.toLowerCase();
    return explicitKeywords.some(keyword => queryLower.includes(keyword));
  },

  detectImplicitTriggers(query: string): boolean {
    return shouldPerformWebSearch(query);
  },

  extractSearchTerms(query: string): string {
    // Ensure query is a string
    if (!query || typeof query !== 'string') {
      return '';
    }

    // For crypto queries, use specific terms
    if (/(crypto|bitcoin|ethereum|price)/i.test(query)) {
      return 'cryptocurrency prices bitcoin ethereum latest market value';
    }

    // For sports queries, enhance with current season info
    if (/(arsenal|man u|manchester united|chelsea|liverpool|tottenham|premier league|next match|fixture)/i.test(query)) {
      return query + ' 2024 2025 season current fixtures schedule upcoming matches';
    }

    // For sports results queries
    if (/(who won|winner|champion|last season|premier league)/i.test(query)) {
      return query + ' 2023-24 2024-25 season winner champion final table Manchester City Arsenal latest results';
    }

    // For weather queries
    if (/(weather|temperature|forecast)/i.test(query)) {
      return query + ' current conditions today forecast';
    }

    // For news/current events
    if (/(news|latest|trending|current events)/i.test(query)) {
      return query + ' today latest breaking news current';
    }

    // For technology/company queries
    if (/(company|startup|tech|software|app|product)/i.test(query)) {
      return query + ' latest news updates current information';
    }

    // For research/scientific queries
    if (/(research|study|discovery|paper|findings)/i.test(query)) {
      return query + ' latest research current findings recent studies';
    }

    // For people/biographical queries
    if (/(who is|biography|age|career)/i.test(query)) {
      return query + ' biography current information latest news';
    }

    // For general factual queries, keep original terms but add currency indicators
    if (/^(what|where|when|why|how|which|who)(?:\s|')/i.test(query)) {
      const cleanQuery = query
        .replace(/^(what|how|when|where|why|who|can|could|should|would|please|help)\s+/i, '')
        .replace(/\b(is|are|was|were|the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return cleanQuery + ' current information latest';
    }

    // Default: clean up query and add currency indicators
    return query
      .replace(/^(what|how|when|where|why|who|can|could|should|would|please|help)\s+/i, '')
      .replace(/\b(is|are|was|were|the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim() + ' latest current';
  },

  formatResultsForAI(searchResponse: WebSearchResponse): string {
    return formatSearchResults(searchResponse.results);
  }
};