
#!/bin/bash

echo "🕷️ Setting up Scrapy Web Search for BioScriptor..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install scrapy scrapy-user-agents requests beautifulsoup4 lxml

# Test Scrapy installation
echo "🧪 Testing Scrapy installation..."
python3 -c "import scrapy; print('✅ Scrapy installed successfully')" || echo "❌ Scrapy installation failed"

# Test the Scrapy search script
echo "🔍 Testing Scrapy search functionality..."
python3 server/services/scrapy-search.py "bioinformatics tools" 3

# Test integration with Node.js
echo "🧪 Testing Node.js integration..."
node test-scrapy-search.js

# Test ScrapedDuck fallback
echo "🦆 Testing ScrapedDuck fallback..."
python3 ScrapedDuck/main.py --query "protein folding" --num-results 3

echo ""
echo "🎉 Scrapy Web Search Setup Complete!"
echo "📝 Your chatbot now uses:"
echo "   1. Scrapy (Primary) - Direct web scraping, no API required"
echo "   2. SearXNG (Fallback) - Multiple public instances"
echo "   3. DuckDuckGo (Fallback) - Instant API + HTML scraping"
echo "   4. ScrapedDuck (Alternative) - Simple requests-based scraping"
echo ""
echo "💡 To test, ask your chatbot:"
echo "   - 'Search for latest CRISPR research'"
echo "   - 'Find recent bioinformatics tools'"
echo "   - 'Look up protein folding news'"
echo ""
echo "🔧 Scrapy benefits:"
echo "   - No API keys required"
echo "   - Multiple search engines supported"
echo "   - Robust error handling and fallbacks"
echo "   - Configurable delays and user agents"
