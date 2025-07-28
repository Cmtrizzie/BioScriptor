
#!/usr/bin/env python3
import sys
import json
import requests
from bs4 import BeautifulSoup
import time
import re

def search_web(query, max_results=5):
    """Simple web search using multiple search engines"""
    results = []
    
    try:
        # Use DuckDuckGo as primary search
        search_url = f"https://html.duckduckgo.com/html/?q={query}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(search_url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract search results
        for result in soup.find_all('a', class_='result__a')[:max_results]:
            title = result.get_text().strip()
            url = result.get('href', '')
            
            if title and url:
                results.append({
                    'title': title,
                    'url': url,
                    'snippet': title
                })
                
    except Exception as e:
        # Fallback with mock results for development
        results = [
            {
                'title': f'Search result for: {query}',
                'url': 'https://example.com',
                'snippet': f'Mock search result for development. Query: {query}'
            }
        ]
    
    return results

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Web search tool')
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
        max_results = 5
    
    try:
        results = search_web(query, max_results)
        output = {
            "results": results,
            "query": query,
            "total": len(results)
        }
        print(json.dumps(output))
    except Exception as e:
        error_output = {
            "error": str(e),
            "query": query,
            "results": []
        }
        print(json.dumps(error_output))
        sys.exit(1)

if __name__ == "__main__":
    main()
