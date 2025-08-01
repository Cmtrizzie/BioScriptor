
#!/usr/bin/env python3
import sys
import json
import requests
from bs4 import BeautifulSoup
import time
import re

def search_web_simple(query, max_results=5):
    """Simple web search using requests + BeautifulSoup (lighter alternative to Scrapy)"""
    results = []
    
    try:
        # Use DuckDuckGo as primary search
        search_url = f"https://html.duckduckgo.com/html/?q={query}&s=0"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'DNT': '1',
            'Connection': 'keep-alive'
        }
        
        response = requests.get(search_url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract search results with improved selectors
        result_divs = soup.find_all('div', class_='result')
        
        for div in result_divs[:max_results]:
            # Extract title and URL
            title_link = div.find('a', class_='result__a')
            snippet_link = div.find('a', class_='result__snippet')
            
            if title_link:
                title = title_link.get_text().strip()
                url = title_link.get('href', '')
                snippet = snippet_link.get_text().strip() if snippet_link else title
                
                # Clean up and validate
                title = re.sub(r'\s+', ' ', title)
                snippet = re.sub(r'\s+', ' ', snippet)
                
                if title and url and 'duckduckgo.com' not in url:
                    results.append({
                        'title': title[:100],
                        'url': url,
                        'snippet': snippet[:200],
                        'source': 'DuckDuckGo-Simple'
                    })
        
        # If no results, try alternative approach
        if not results:
            # Fallback with different selector approach
            links = soup.find_all('a', href=True)
            for link in links[:max_results]:
                href = link.get('href', '')
                text = link.get_text().strip()
                
                if (href.startswith('http') and 
                    'duckduckgo.com' not in href and 
                    len(text) > 10):
                    results.append({
                        'title': text[:100],
                        'url': href,
                        'snippet': text[:200],
                        'source': 'DuckDuckGo-Fallback'
                    })
                    if len(results) >= max_results:
                        break
                
    except Exception as e:
        print(f"Error in simple search: {e}", file=sys.stderr)
        # Provide mock results for development
        results = [
            {
                'title': f'Search result for: {query}',
                'url': f'https://duckduckgo.com/?q={query.replace(" ", "+")}',
                'snippet': f'ScrapedDuck search temporarily unavailable. Query: {query}',
                'source': 'ScrapedDuck-Mock'
            }
        ]
    
    return results

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Simple web search tool (ScrapedDuck)')
    parser.add_argument('--query', required=True, help='Search query')
    parser.add_argument('--num-results', type=int, default=5, help='Number of results')
    parser.add_argument('--output-format', default='json', help='Output format')
    
    try:
        args = parser.parse_args()
        query = args.query
        max_results = args.num_results
    except:
        # Fallback to old argument parsing for backward compatibility
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No search query provided"}))
            sys.exit(1)
        
        query = sys.argv[1]
        max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    try:
        results = search_web_simple(query, max_results)
        output = {
            "results": results,
            "query": query,
            "total": len(results),
            "source": "ScrapedDuck"
        }
        print(json.dumps(output, indent=2))
    except Exception as e:
        error_output = {
            "error": str(e),
            "query": query,
            "results": [],
            "source": "ScrapedDuck"
        }
        print(json.dumps(error_output))
        sys.exit(1)

if __name__ == "__main__":
    main()
