import {
    CUSTOMER_RESPONSE_SYSTEM_PROMPT,
    ADMIN_SUMMARY_SYSTEM_PROMPT,
    ADMIN_ACTIONS_SYSTEM_PROMPT
} from './prompts';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface LLMResponse {
    content: string;
    error?: string;
}

async function callLLM(prompt: string, systemPrompt: string): Promise<LLMResponse> {
    try {
        const response = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
                "X-Title": "Fynd AI Feedback System"
            },
            body: JSON.stringify({
                model: "z-ai/glm-4.5-air:free",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        return { content: data.choices[0]?.message?.content || "" };
    } catch (error) {
        console.error("LLM call failed:", error);
        return { content: "", error: String(error) };
    }
}

// Generate user-facing response with support escalation for negative reviews
export async function generateUserResponse(rating: number, reviewText: string, customerName?: string): Promise<string> {
    // Build context-aware prompt with rating and review details
    const ratingContext = rating <= 2 ? 'negative (INCLUDE SUPPORT CONTACT INFO)' :
        rating === 3 ? 'neutral' : 'positive';

    const prompt = `Customer Rating: ${rating} stars (${ratingContext})
Customer Name: ${customerName || 'Valued Customer'}
Review Text: "${reviewText}"

Generate an appropriate response based on the guidelines in your system prompt.`;

    const response = await callLLM(prompt, CUSTOMER_RESPONSE_SYSTEM_PROMPT);

    if (response.error || !response.content) {
        // Enhanced fallback responses
        if (rating >= 4) {
            return "Thank you so much for your wonderful feedback! 🌟 We're thrilled to hear about your positive experience. Your kind words motivate our team to keep delivering excellence. Happy shopping! 🛍️";
        }
        if (rating === 3) {
            return "Thank you for taking the time to share your feedback. We truly value your input and are always working to improve. If there's anything specific we can help with, please don't hesitate to reach out!";
        }
        // Negative review fallback with support info
        return `We're truly sorry to hear about your experience, and we understand your frustration. 💔 This is not the standard we hold ourselves to.

Please let us connect you with our support team:
📞 Call: 1800-XXX-XXXX (24/7)
📧 Email: support@fynd.com
💬 WhatsApp: +91-XXXXXXXXXX

We're committed to making this right for you. 🙏`;
    }

    return response.content;
}

// Generate admin summary with structured insights
export async function generateAdminSummary(rating: number, reviewText: string): Promise<string> {
    const urgencyLevel = rating <= 2 ? 'HIGH' : rating === 3 ? 'MEDIUM' : 'LOW';
    const sentiment = rating <= 2 ? 'Negative' : rating === 3 ? 'Neutral' : 'Positive';

    const prompt = `Analyze this customer review:

Rating: ${rating} stars
Sentiment: ${sentiment}
Urgency Level: ${urgencyLevel}
Review Text: "${reviewText}"

Provide a structured analysis following the format in your system prompt.`;

    const response = await callLLM(prompt, ADMIN_SUMMARY_SYSTEM_PROMPT);

    if (response.error || !response.content) {
        // Enhanced fallback with more detail
        const category = rating <= 2 ? 'Issue requires attention' :
            rating === 3 ? 'Mixed feedback - follow up recommended' :
                'Positive experience - potential brand advocate';
        return `[${sentiment}] ${urgencyLevel} Priority: ${category}. Review rating: ${rating}/5 stars.`;
    }

    return response.content;
}

// Generate recommended actions with prioritization
export async function generateRecommendedActions(rating: number, reviewText: string): Promise<string[]> {
    const actionContext = rating <= 2 ? 'URGENT - Customer recovery needed' :
        rating === 3 ? 'Follow-up recommended' :
            'Positive reinforcement opportunity';

    const prompt = `Customer Review Analysis:

Rating: ${rating} stars
Context: ${actionContext}
Review: "${reviewText}"

Based on this review, recommend 2-4 specific, actionable next steps.
Return your response as a JSON array of strings with emoji prefixes as specified in your system prompt.`;

    const response = await callLLM(prompt, ADMIN_ACTIONS_SYSTEM_PROMPT);

    if (response.error || !response.content) {
        // Enhanced fallback actions with emojis
        if (rating >= 4) {
            return [
                "🌟 Recognition: Share this positive feedback with the team",
                "💡 Strategy: Consider enrolling customer in loyalty program",
                "📢 Amplification: Request permission to use as testimonial"
            ];
        }
        if (rating === 3) {
            return [
                "📞 Outreach: Follow up with customer for more details",
                "🔍 Investigation: Review mentioned areas for improvement opportunities",
                "📊 Process: Document feedback for product team review"
            ];
        }
        return [
            "📞 Priority: Contact customer within 24 hours to apologize and resolve",
            "🔍 Investigation: Investigate reported issues immediately",
            "🎁 Recovery: Prepare compensation offer for customer",
            "⚡ Escalation: Alert management if issue is systemic"
        ];
    }

    try {
        // Try to parse JSON from response
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const actions = JSON.parse(jsonMatch[0]);
            // Ensure we have valid array of strings
            if (Array.isArray(actions) && actions.every(a => typeof a === 'string')) {
                return actions.slice(0, 4); // Max 4 actions
            }
        }
    } catch {
        // Fallback if JSON parsing fails
    }

    // Split by newlines or bullets if not valid JSON
    return response.content
        .split(/[\n•\-\d+\.]/)
        .map(s => s.trim())
        .filter(s => s.length > 10) // Filter out short fragments
        .slice(0, 4);
}
