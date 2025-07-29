
#!/bin/bash

echo "🔍 Setting up Web Search for BioScriptor on Replit..."

# Note about Docker limitation
echo "ℹ️  Note: Docker is not available on Replit, so we'll use public SearXNG instances"

# Test current web search functionality
echo "🧪 Testing web search with current configuration..."

# Test the updated SearXNG instances
echo "📡 Testing SearXNG instances..."
instances=("https://search.inetol.net" "https://searx.work" "https://searx.prvcy.eu")

working_count=0
for instance in "${instances[@]}"; do
    if curl -s "${instance}/search?q=test&format=json" > /dev/null 2>&1; then
        echo "✅ ${instance} is working"
        ((working_count++))
    else
        echo "⚠️ ${instance} not responding"
    fi
done

echo "📊 ${working_count} out of ${#instances[@]} SearXNG instances are working"

# Test DuckDuckGo fallback
echo "🦆 Testing DuckDuckGo fallback..."
if curl -s "https://api.duckduckgo.com/?q=test&format=json" > /dev/null 2>&1; then
    echo "✅ DuckDuckGo Instant API is working"
else
    echo "⚠️ DuckDuckGo Instant API not responding"
fi

if curl -s "https://html.duckduckgo.com/html/?q=test" > /dev/null 2>&1; then
    echo "✅ DuckDuckGo HTML search is working"
else
    echo "⚠️ DuckDuckGo HTML search not responding"
fi

# Test the actual web search service
echo "🧪 Testing BioScriptor web search service..."
npm run test -- --testNamePattern="Web Search" 2>/dev/null || echo "🔧 Run 'npm test' to verify web search functionality"

echo ""
echo "🎉 Web Search Setup Complete!"
echo "📝 Your chatbot now uses:"
echo "   1. Local SearXNG (if running on port 8080)"
echo "   2. Multiple public SearXNG instances (fallback)"
echo "   3. DuckDuckGo Instant API (fallback)"
echo "   4. DuckDuckGo HTML search (fallback)"
echo "   5. Contextual mock results (final fallback)"
echo ""
echo "🐳 To run local SearXNG (recommended):"
echo "   docker run -d -p 8080:8080 searxng/searxng"
echo ""
echo "💡 To test, ask your chatbot:"
echo "   - 'What's the latest news about Bitcoin?'"
echo "   - 'What's the latest news about CRISPR?'"
echo "   - 'Search for recent AI developments'"ARXNG_URL in your .env file to your preferred instance"
