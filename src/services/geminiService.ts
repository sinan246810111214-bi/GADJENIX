export async function getAssistantResponse(messages: any[]) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.text || "";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Sorry, I'm having trouble connecting. WhatsApp support contact cheyyoo!";
  }
}

export async function getSearchSuggestions(q: string) {
  try {
    const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`);
    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
}

export async function analyzeSearchIntent(query: string) {
  try {
    const response = await fetch('/api/search/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AI Intent Analysis Error:", error);
    return { correctedQuery: query, category: null };
  }
}

export async function generateProductFeatures(name: string, category: string) {
  try {
    const response = await fetch('/api/admin/generate-features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category }),
    });
    const data = await response.json();
    return data.features || "";
  } catch (error) {
    console.error("AI Feature Gen Error:", error);
    return "Failed to generate features.";
  }
}
