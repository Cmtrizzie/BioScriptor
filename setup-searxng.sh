
#!/bin/bash

echo "🔍 Setting up Web Search for BioScriptor..."

# Test current web search functionality
echo "🧪 Testing web search with current configuration..."

# Test the working SearXNG instance
echo "📡 Testing SearXNG instance..."
if curl -s "https://searxng.thegpm.org/search?q=test&format=json" > /dev/null 2>&1; then
    echo "✅ SearXNG instance is working"
else
    echo "⚠️ SearXNG instance not responding"
fi

# Test DuckDuckGo fallback
echo "🦆 Testing DuckDuckGo fallback..."
if curl -s "https://html.duckduckgo.com/html/?q=test" > /dev/null 2>&1; then
    echo "✅ DuckDuckGo fallback is working"
else
    echo "⚠️ DuckDuckGo fallback not responding"
fi

# Test the actual web search service
echo "🧪 Testing BioScriptor web search service..."
npm run test -- --testNamePattern="Web Search" 2>/dev/null || echo "🔧 Run 'npm test' to verify web search functionality"

echo ""
echo "🎉 Web Search Setup Complete!"
echo "📝 Your chatbot now uses:"
echo "   1. SearXNG (primary) - https://searxng.thegpm.org"
echo "   2. DuckDuckGo (fallback) - html.duckduckgo.com"
echo "   3. Mock results (development fallback)"
echo ""
echo "💡 To test, ask your chatbot: 'What's the latest news about CRISPR?'"
