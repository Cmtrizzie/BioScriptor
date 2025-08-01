#!/usr/bin/env python3

import sys
import json
import requests
from bs4 import BeautifulSoup
import time
import random
from urllib.parse import quote_plus
import re

def clean_text(text):
    """Clean and normalize text content"""
    if not text:
        return ""
    # Remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', text.strip())
    # Remove special characters that might break JSON
    text = re.sub(r'[^\w\s\-.,!?;:()\[\]"]', ' ', text)
    return text[:500]  # Limit length

def search_duckduckgo(query, max_results=5):
    """Search using DuckDuckGo HTML interface"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        # Use DuckDuckGo HTML search
        search_url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"

        response = requests.get(search_url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        results = []

        # Find search result containers
        result_divs = soup.find_all('div', class_='result')

        for div in result_divs[:max_results]:
            try:
                # Extract title and link
                title_link = div.find('a', class_='result__a')
                if not title_link:
                    continue

                title = clean_text(title_link.get_text())
                url = title_link.get('href', '')

                # Extract snippet
                snippet_elem = div.find('a', class_='result__snippet')
                snippet = clean_text(snippet_elem.get_text()) if snippet_elem else title

                if title and url and not url.startswith('javascript:'):
                    results.append({
                        'title': title,
                        'url': url,
                        'snippet': snippet or title
                    })

            except Exception as e:
                continue

        return results

    except Exception as e:
        print(f"DuckDuckGo search failed: {e}", file=sys.stderr)
        return []

def search_bing(query, max_results=5):
    """Search using Bing (without API key)"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        search_url = f"https://www.bing.com/search?q={quote_plus(query)}"
        response = requests.get(search_url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        results = []

        # Find Bing result containers
        result_divs = soup.find_all('li', class_='b_algo')

        for div in result_divs[:max_results]:
            try:
                title_elem = div.find('h2')
                if not title_elem:
                    continue

                link_elem = title_elem.find('a')
                if not link_elem:
                    continue

                title = clean_text(link_elem.get_text())
                url = link_elem.get('href', '')

                # Extract snippet
                snippet_elem = div.find('p') or div.find('div', class_='b_caption')
                snippet = clean_text(snippet_elem.get_text()) if snippet_elem else title

                if title and url:
                    results.append({
                        'title': title,
                        'url': url,
                        'snippet': snippet
                    })

            except Exception as e:
                continue

        return results

    except Exception as e:
        print(f"Bing search failed: {e}", file=sys.stderr)
        return []

def search_web_multi_engine(query, max_results=5):
    """Search using multiple engines with fallback"""
    all_results = []

    # Try DuckDuckGo first
    ddg_results = search_duckduckgo(query, max_results)
    if ddg_results:
        all_results.extend(ddg_results)

    # If we need more results, try Bing
    if len(all_results) < max_results:
        time.sleep(1)  # Rate limiting
        bing_results = search_bing(query, max_results - len(all_results))
        all_results.extend(bing_results)

    # Remove duplicates based on URL
    seen_urls = set()
    unique_results = []

    for result in all_results:
        if result['url'] not in seen_urls:
            seen_urls.add(result['url'])
            unique_results.append(result)

        if len(unique_results) >= max_results:
            break

    return unique_results

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No search query provided", "results": []}))
        sys.exit(1)

    query = sys.argv[1]
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 5

    try:
        results = search_web_multi_engine(query, max_results)

        output = {
            "results": results,
            "query": query,
            "total": len(results),
            "source": "Multi-Engine Search"
        }

        print(json.dumps(output, ensure_ascii=False, indent=None))

    except Exception as e:
        error_output = {
            "error": str(e),
            "query": query,
            "results": [],
            "source": "Multi-Engine Search"
        }
        print(json.dumps(error_output))
        sys.exit(1)

if __name__ == "__main__":
    main()