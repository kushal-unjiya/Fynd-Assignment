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
    // Analyze text content first to determine actual sentiment
    const textLower = reviewText.toLowerCase();
    const negativeWords = ['not good', 'not great', 'bad', 'terrible', 'worst', 'poor', 'disappointing', 'waste', 'horrible', 'awful', 'hate', 'never again'];
    const hasNegative = negativeWords.some(word => textLower.includes(word));
    
    // If text is clearly negative, treat as negative regardless of star rating
    const isNegativeFeedback = hasNegative || rating <= 2;
    const ratingContext = isNegativeFeedback ? 'negative/critical (INCLUDE SUPPORT CONTACT INFO)' :
        rating === 3 ? 'neutral' : 'positive';

    const prompt = `⚠️ IMPORTANT: Analyze the REVIEW TEXT CONTENT, not just the star rating!

Customer Rating: ${rating} stars
Review Text: "${reviewText}"
Actual Sentiment Based on Text: ${ratingContext}
Customer Name: ${customerName || 'Valued Customer'}

⚠️ IF THE REVIEW TEXT CONTAINS CRITICISM, COMPLAINTS, OR NEGATIVE WORDS → Respond as if it's a NEGATIVE review (apologize, show empathy, provide support)
⚠️ IF THE REVIEW TEXT CONTAINS PRAISE AND POSITIVE WORDS → Respond as if it's a POSITIVE review (thank them enthusiastically)

Examples:
- "Not a good website" with 4 stars → This is NEGATIVE feedback, respond with empathy and acknowledge the criticism
- "Amazing service" with 1 star → This is POSITIVE feedback, thank them warmly

Generate an appropriate response based on the REVIEW TEXT CONTENT and the guidelines in your system prompt.`;

    const response = await callLLM(prompt, CUSTOMER_RESPONSE_SYSTEM_PROMPT);

    if (response.error || !response.content) {
        // Analyze text content for fallback (don't just rely on rating)
        const textLower = reviewText.toLowerCase();
        const negativeWords = ['not good', 'not great', 'bad', 'terrible', 'worst', 'poor', 'disappointing', 'waste', 'horrible', 'awful', 'hate'];
        const positiveWords = ['good', 'great', 'amazing', 'best', 'excellent', 'love', 'wonderful', 'fantastic', 'perfect'];
        
        const hasNegative = negativeWords.some(word => textLower.includes(word));
        const hasPositive = positiveWords.some(word => textLower.includes(word));
        
        // Determine actual sentiment from text
        if (hasNegative || rating <= 2) {
            return `Thank you for sharing your feedback with us. We understand your concerns and truly appreciate you bringing this to our attention. 🙏 We're committed to improving and would love to help make things right.

Please connect with our support team:
📞 Call: 1800-1234567890 (24/7)
📧 Email: support@fynd.com
💬 WhatsApp: +91-1234567890

We value your input and look forward to serving you better. 💙`;
        }
        
        if (hasPositive || rating >= 4) {
            return "Thank you so much for your wonderful feedback! 🌟 We're thrilled to hear about your positive experience. Your kind words motivate our team to keep delivering excellence. Happy shopping! 🛍️";
        }
        
        // Neutral
        return "Thank you for taking the time to share your feedback. We truly value your input and are always working to improve. If there's anything specific we can help with, please don't hesitate to reach out!";
    }

    return response.content;
}

// Generate admin summary with structured insights
export async function generateAdminSummary(rating: number, reviewText: string): Promise<string> {
    // Analyze text sentiment
    const textLower = reviewText.toLowerCase();
    const negativeWords = ['not good', 'not great', 'bad', 'terrible', 'worst', 'poor', 'disappointing', 'waste', 'horrible', 'awful', 'hate', 'never'];
    const positiveWords = ['good', 'great', 'amazing', 'best', 'excellent', 'love', 'wonderful', 'fantastic', 'perfect', 'glad', 'happy'];
    
    const hasNegative = negativeWords.some(word => textLower.includes(word));
    const hasPositive = positiveWords.some(word => textLower.includes(word));
    
    // Detect conflicts
    const isLowRating = rating <= 2;
    const isHighRating = rating >= 4;
    const hasConflict = (isLowRating && hasPositive && !hasNegative) || (isHighRating && hasNegative && !hasPositive);
    
    const conflictWarning = hasConflict ? 
        `\n\n⚠️ CONFLICT DETECTED: Rating is ${rating} stars but text sentiment is ${isLowRating ? 'POSITIVE' : 'NEGATIVE'}. Use LOW confidence and flag for manual review!` : '';

    const prompt = `⚠️ CRITICAL INSTRUCTIONS ⚠️

You MUST analyze the REVIEW TEXT FIRST, NOT the star rating!

Review Text: "${reviewText}"
Star Rating: ${rating}/5 stars${conflictWarning}

ANALYSIS RULES:
1. READ the review text carefully
2. IDENTIFY sentiment words:
   - Negative: "not good", "bad", "terrible", "worst", "poor", "disappointing", "waste", "horrible", "awful", "hate"
   - Positive: "good", "great", "amazing", "best", "excellent", "love", "wonderful", "fantastic", "perfect", "glad", "happy"
   - Neutral: "okay", "fine", "average", "decent", "acceptable"
3. Determine text sentiment independent of rating
4. CHECK FOR CONFLICTS:
   - Low rating (1-2) + Positive text = CONFLICT (confidence: LOW)
   - High rating (4-5) + Negative text = CONFLICT (confidence: LOW)
   - Matching rating + text = No conflict (confidence: HIGH)

⚠️ CONFLICT HANDLING:
- IF CONFLICT EXISTS: Set confidence to "low" and add "MANUAL REVIEW RECOMMENDED" to Key Issue(s)
- Explain the contradiction clearly
- Suggest possible reasons (rating error, misunderstanding, sarcasm, missing context)

Examples:
1. "Wonderful experience, very glad" + 1 star → Positive (LOW confidence - likely rating error)
2. "Not a good website" + 4 stars → Negative (LOW confidence - contradictory)
3. "Amazing service!" + 5 stars → Positive (HIGH confidence - no conflict)
4. "Terrible experience" + 1 star → Negative (HIGH confidence - no conflict)

Now analyze this review.

⚠️ CRITICAL REMINDER: Output PLAIN TEXT ONLY! 
DO NOT use asterisks or any markdown formatting!
Write exactly: Sentiment: (without asterisks)
Your output will display as-is in the UI!`;

    const response = await callLLM(prompt, ADMIN_SUMMARY_SYSTEM_PROMPT);

    if (response.error || !response.content) {
        // Fallback analysis - detect conflicts and sentiment
        let actualSentiment = 'Neutral';
        let confidence = 'medium';
        let conflictNote = '';
        
        if (hasNegative && !hasPositive) {
            actualSentiment = 'Negative';
        } else if (hasPositive && !hasNegative) {
            actualSentiment = 'Positive';
        } else if (hasNegative && hasPositive) {
            actualSentiment = 'Neutral';
        }
        
        // Check for conflicts
        if (hasConflict) {
            confidence = 'low';
            if (isLowRating && hasPositive) {
                conflictNote = ' Customer gave very low rating but text is positive - likely rating error or misunderstanding. MANUAL REVIEW RECOMMENDED.';
            } else if (isHighRating && hasNegative) {
                conflictNote = ' Customer gave high rating but text is negative/critical. Contradictory feedback requires clarification. MANUAL REVIEW RECOMMENDED.';
            }
        } else {
            confidence = 'high';
        }
        
        const urgency = (actualSentiment === 'Negative' || hasConflict) ? 'Medium' : rating === 3 ? 'Medium' : 'Low';
        const category = 'Product Quality';
        
        return `Sentiment: ${actualSentiment} (${confidence} confidence${hasConflict ? ' - rating conflicts with text' : ''})

Key Issue(s): Customer provided ${rating}-star rating.${conflictNote}${!conflictNote ? ' Review text requires manual review for detailed analysis.' : ''}

Category: ${category}

Urgency: ${urgency}

Customer Expectation: ${hasConflict ? 'Requires follow-up to clarify actual satisfaction level and correct any rating errors.' : actualSentiment === 'Negative' ? 'Immediate attention and resolution of concerns.' : rating === 3 ? 'Acknowledgment and follow-up to understand specific feedback.' : 'Recognition and continued quality service.'}`;
    }

    // Remove ALL markdown formatting from response
    let cleanedContent = response.content;
    
    // Remove ** bold markers
    cleanedContent = cleanedContent.replace(/\*\*/g, '');
    
    // Remove * italic markers (but keep bullet points if any)
    cleanedContent = cleanedContent.replace(/\*([^\*\n]+)\*/g, '$1');
    
    // Remove __ underline markers
    cleanedContent = cleanedContent.replace(/__/g, '');
    
    // Remove markdown headings (###, ##, #)
    cleanedContent = cleanedContent.replace(/^#{1,6}\s+/gm, '');
    
    return cleanedContent.trim();
}

// Generate recommended actions with prioritization
export async function generateRecommendedActions(rating: number, reviewText: string): Promise<string[]> {
    // Detect conflict between rating and text
    const textLower = reviewText.toLowerCase();
    const negativeWords = ['not good', 'not great', 'bad', 'terrible', 'worst', 'poor', 'disappointing', 'waste', 'horrible', 'awful', 'hate'];
    const positiveWords = ['good', 'great', 'amazing', 'best', 'excellent', 'love', 'wonderful', 'fantastic', 'perfect', 'glad', 'happy'];
    
    const hasNegative = negativeWords.some(word => textLower.includes(word));
    const hasPositive = positiveWords.some(word => textLower.includes(word));
    const isLowRating = rating <= 2;
    const isHighRating = rating >= 4;
    const hasConflict = (isLowRating && hasPositive && !hasNegative) || (isHighRating && hasNegative && !hasPositive);
    
    let actionContext = '';
    if (hasConflict) {
        if (isLowRating && hasPositive) {
            actionContext = '⚠️ CONFLICT ALERT - Low rating (1-2 stars) but positive text. Likely rating error - contact customer to clarify';
        } else {
            actionContext = '⚠️ CONFLICT ALERT - High rating but negative text. Customer may be unhappy - follow up immediately';
        }
    } else {
        actionContext = rating <= 2 ? 'URGENT - Customer recovery needed' :
            rating === 3 ? 'Follow-up recommended' :
                'Positive reinforcement opportunity';
    }

    const prompt = `Customer Review Analysis:

Rating: ${rating} stars
Text Sentiment: ${hasPositive ? 'Positive' : hasNegative ? 'Negative' : 'Neutral'}
${hasConflict ? '⚠️ CONFLICT DETECTED: Rating and text sentiment do NOT match!' : ''}
Context: ${actionContext}
Review: "${reviewText}"

${hasConflict ? `
SPECIAL INSTRUCTIONS FOR CONFLICTS:
- First action MUST be to contact customer to clarify/correct rating
- Determine if rating was entered incorrectly
- Ask for additional context
- Prioritize understanding true satisfaction level
` : ''}

Based on this review, recommend 2-4 specific, actionable next steps.
Return your response as a JSON array of strings with emoji prefixes as specified in your system prompt.`;

    const response = await callLLM(prompt, ADMIN_ACTIONS_SYSTEM_PROMPT);

    if (response.error || !response.content) {
        // Enhanced fallback actions with conflict detection
        if (hasConflict) {
            if (isLowRating && hasPositive) {
                return [
                    "⚠️ Priority: Contact customer immediately - positive feedback with 1-2 star rating suggests rating error",
                    "📞 Clarification: Ask customer to confirm if rating was entered correctly",
                    "🔄 Correction: Offer to help update rating if it was a mistake",
                    "🙏 Appreciation: Thank them for the positive feedback regardless"
                ];
            } else {
                return [
                    "⚠️ Urgent: Reach out to customer - high rating but negative feedback indicates hidden issues",
                    "🔍 Investigation: Understand why they gave high rating despite complaints",
                    "📞 Follow-up: Clarify concerns and offer resolution",
                    "📊 Analysis: Document this contradictory feedback for team review"
                ];
            }
        }
        
        // Standard actions when no conflict
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
