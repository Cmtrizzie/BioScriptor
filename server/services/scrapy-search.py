
#!/usr/bin/env python3
import scrapy
import json
import sys
import re
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from twisted.internet import reactor
import threading
import time
from urllib.parse import quote_plus

class WebSearchSpider(scrapy.Spider):
    name = 'web_search'
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 1,
        'RANDOMIZE_DOWNLOAD_DELAY': True,
        'CONCURRENT_REQUESTS': 1,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
        'COOKIES_ENABLED': False,
        'TELNETCONSOLE_ENABLED': False,
        'LOG_LEVEL': 'ERROR'
    }

    def __init__(self, query='', max_results=5, *args, **kwargs):
        super(WebSearchSpider, self).__init__(*args, **kwargs)
        self.query = query
        self.max_results = int(max_results)
        self.results = []
        self.search_engines = [
            self.search_duckduckgo,
            self.search_startpage,
            self.search_searx
        ]

    def start_requests(self):
        """Start requests for multiple search engines"""
        yield from self.search_duckduckgo()

    def search_duckduckgo(self):
        """Search using DuckDuckGo HTML"""
        search_url = f"https://html.duckduckgo.com/html/?q={quote_plus(self.query)}&s=0&dc=0&o=json&api=/d.js"
        yield scrapy.Request(
            url=search_url,
            callback=self.parse_duckduckgo,
            headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        )

    def parse_duckduckgo(self, response):
        """Parse DuckDuckGo search results"""
        results = response.css('div.result')
        
        for result in results[:self.max_results]:
            title_element = result.css('a.result__a::text').get()
            url_element = result.css('a.result__a::attr(href)').get()
            snippet_element = result.css('a.result__snippet::text').get()
            
            if title_element and url_element:
                # Clean up the data
                title = re.sub(r'\s+', ' ', title_element.strip())
                url = url_element.strip()
                snippet = re.sub(r'\s+', ' ', (snippet_element or title).strip())
                
                # Skip internal DuckDuckGo links
                if 'duckduckgo.com' not in url and title:
                    self.results.append({
                        'title': title[:100],
                        'url': url,
                        'snippet': snippet[:200],
                        'source': 'DuckDuckGo'
                    })
        
        # If we don't have enough results, try Startpage
        if len(self.results) < self.max_results:
            yield from self.search_startpage()

    def search_startpage(self):
        """Fallback to Startpage search"""
        search_url = f"https://www.startpage.com/sp/search?query={quote_plus(self.query)}&cat=web&pl=opensearch"
        yield scrapy.Request(
            url=search_url,
            callback=self.parse_startpage,
            headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        )

    def parse_startpage(self, response):
        """Parse Startpage search results"""
        results = response.css('div.w-gl__result')
        
        for result in results[:self.max_results - len(self.results)]:
            title_element = result.css('h3.w-gl__result-title a::text').get()
            url_element = result.css('h3.w-gl__result-title a::attr(href)').get()
            snippet_element = result.css('p.w-gl__description::text').get()
            
            if title_element and url_element:
                title = re.sub(r'\s+', ' ', title_element.strip())
                url = url_element.strip()
                snippet = re.sub(r'\s+', ' ', (snippet_element or title).strip())
                
                if title:
                    self.results.append({
                        'title': title[:100],
                        'url': url,
                        'snippet': snippet[:200],
                        'source': 'Startpage'
                    })

    def search_searx(self):
        """Fallback to public SearX instance"""
        search_url = f"https://searx.be/search?q={quote_plus(self.query)}&format=json"
        yield scrapy.Request(
            url=search_url,
            callback=self.parse_searx,
            headers={'Accept': 'application/json'}
        )

    def parse_searx(self, response):
        """Parse SearX JSON results"""
        try:
            data = json.loads(response.text)
            if 'results' in data:
                for result in data['results'][:self.max_results - len(self.results)]:
                    if result.get('title') and result.get('url'):
                        self.results.append({
                            'title': result['title'][:100],
                            'url': result['url'],
                            'snippet': result.get('content', result['title'])[:200],
                            'source': 'SearX'
                        })
        except (json.JSONDecodeError, KeyError):
            pass

def run_scrapy_search(query, max_results=5):
    """Run Scrapy search and return results"""
    results = []
    
    def collect_results(spider):
        results.extend(spider.results)
    
    # Configure Scrapy settings
    settings = get_project_settings()
    settings.setdict({
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 0.5,
        'RANDOMIZE_DOWNLOAD_DELAY': True,
        'CONCURRENT_REQUESTS': 1,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
        'COOKIES_ENABLED': False,
        'TELNETCONSOLE_ENABLED': False,
        'LOG_LEVEL': 'ERROR',
        'TWISTED_REACTOR': 'twisted.internet.asyncioreactor.AsyncioSelectorReactor'
    })
    
    # Create and configure the crawler process
    process = CrawlerProcess(settings)
    
    # Create spider instance
    spider = WebSearchSpider(query=query, max_results=max_results)
    
    # Add spider finished callback
    def spider_closed(spider):
        collect_results(spider)
    
    # Connect the spider_closed signal
    from scrapy import signals
    from scrapy.crawler import Crawler
    
    crawler = Crawler(WebSearchSpider, settings)
    crawler.signals.connect(spider_closed, signal=signals.spider_closed)
    
    # Run the crawler
    try:
        process.crawl(crawler, query=query, max_results=max_results)
        process.start(stop_after_crawl=True)
    except Exception as e:
        print(f"Scrapy error: {e}", file=sys.stderr)
        # Fallback results
        return [{
            'title': f'Search for: {query}',
            'url': f'https://duckduckgo.com/?q={quote_plus(query)}',
            'snippet': f'Scrapy search temporarily unavailable. Manual search recommended for: {query}',
            'source': 'Fallback'
        }]
    
    return results

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No search query provided"}))
        sys.exit(1)
    
    query = sys.argv[1]
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    try:
        results = run_scrapy_search(query, max_results)
        output = {
            "results": results,
            "query": query,
            "total": len(results),
            "source": "Scrapy"
        }
        print(json.dumps(output, indent=2))
    except Exception as e:
        error_output = {
            "error": str(e),
            "query": query,
            "results": [],
            "source": "Scrapy"
        }
        print(json.dumps(error_output))
        sys.exit(1)

if __name__ == "__main__":
    main()
