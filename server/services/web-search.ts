import fetch from 'node-fetch';

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface ScrapeDuckResponse {
  results: Array<{
    title: string;
    url: string;
    description: string;
  }>;
}

// Fallback search using DuckDuckGo instant answers
async function fallbackSearch(query: string): Promise<WebSearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const results: WebSearchResult[] = [];

    // Add abstract if available
    if (data.Abstract && data.AbstractText) {
      results.push({
        title: data.Abstract,
        url: data.AbstractURL || 'https://duckduckgo.com',
        snippet: data.AbstractText.substring(0, 200) + '...'
      });
    }

    // Add related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || 'Related Topic',
            url: topic.FirstURL,
            snippet: topic.Text.substring(0, 200) + '...'
          });
        }
      });
    }

    return results;
  } catch (error) {
    console.error('Fallback search error:', error);
    return [];
  }
}

export async function performWebSearch(query: string, maxResults: number = 5): Promise<WebSearchResult[]> {
  const apiKey = process.env.SCRAPEDUCK_API_KEY;

  // Try ScrapeDuck first if API key is available
  if (apiKey) {
    try {
      console.log('🔍 Performing web search with ScrapeDuck...');
      const response = await fetch('https://api.scrapeduck.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          max_results: maxResults,
          country: 'US',
          language: 'en'
        }),
        timeout: 10000 // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`ScrapeDuck API error: ${response.status} ${response.statusText}`);
      }

      const data: ScrapeDuckResponse = await response.json();

      const results = data.results?.map(result => ({
        title: result.title || 'No title',
        url: result.url || '',
        snippet: result.description || 'No description available'
      })) || [];

      console.log(`✅ ScrapeDuck found ${results.length} results`);
      return results;
    } catch (error) {
      console.error('ScrapeDuck search failed:', error.message);
      console.log('🔄 Falling back to alternative search...');
    }
  } else {
    console.log('⚠️ ScrapeDuck API key not found, using fallback search');
  }

  // Fallback to DuckDuckGo instant answers
  try {
    const fallbackResults = await fallbackSearch(query);
    console.log(`✅ Fallback search found ${fallbackResults.length} results`);
    return fallbackResults;
  } catch (error) {
    console.error('All search methods failed:', error);
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