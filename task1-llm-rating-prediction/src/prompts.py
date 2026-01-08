"""Prompt templates for three rating prediction approaches."""

# 15 curated examples (3 per star rating) - from longest_15_formatted.txt
FEW_SHOT_EXAMPLES = '''
[1-star example]: "Let me start by saying after my experience I surly wish they had half or quarter stars and I am not often found with a lack of words but this is going to take some effort to stomach. Strolled into this establishment at about 1:30 am... Fast forward a few minutes, guy is in there, his friends are loud and his face is cut wide open from who knows what incident... employee is wiping his sweaty face by hand, receiving money..then is prepping pizza with topping BY BARE HAND... Freaking DISGUSTING." → 1 star

[1-star example]: "We were excited to check out this new restaurant! We were left extremely underwhelmed... The wait time to receive a cocktail was excruciatingly long... Queso dip: cold... Chicken tortilla soup: Thick tomato soup with dry dark meat chicken chunks... our drinks were empty, our plates tattering on the edge of the bar eagerly anticipating a bus boy... This is about the time that our appetizers, chips, soups, and entrees were all removed from the bartop." → 1 star

[1-star example]: "No. If you ask me about eating at Papaya Thai, that is what I will say. 0 stars for the single kinda scattered and scruffy staffperson. 0 stars for the cook who cannot prepare an offering from the menu as the menu describes it... The salad that appears has some of the traditional salad ingredients along with ingredients that have no business being in the salad... I stood and left." → 1 star

[2-star example]: "I went to Eddie's House last night with the BF and two friends for restaurant week and it was a terrible experience... Our waiter was terrible. TERRIBLE... We waited over 40 minutes to order... The soup was really weird, not bad, just different... We ate everything, so again, the food was good, the service was awful... NEVER AGAIN." → 2 stars

[2-star example]: "Fuck you all, we hope you die. That's the Trojan Battle Cry! Wow, I can not believe someone Yelp'ed PV... I hated this school... pieces of the ceiling falling on peoples heads before they condemned it... felt like I was in some prison or some high security mental facility... I hope they have made improvements since I graduated." → 2 stars

[2-star example]: "I don't get it!! My husband, daughter and I went to eat at Joe's because we saw a menu in the Hotel... The FONTINA BURGER was cooked very well done (I ordered it medium/well)... The ONION RINGS had such a crunchy exterior that it actually hurt our mouths... The BEET SALAD tasted like dirt... We left feeling ripped off." → 2 stars

[3-star example]: "I hate having to give out three star reviews. For me, 1-star isn't the worst possible rating, a 3 is. Because 3 stars means it invoked no reaction to you, neither joy or disgust... I ordered the Dinguan, which translates as chocolate pork... I couldn't taste the pork. All I tasted was the blood... Casa Filipina isn't good. But it's not bad. That's the problem." → 3 stars

[3-star example]: "Uh-oh. Where am I? The view from atop the mountain is superb... we got lost... We hiked and hiked and hiked... Having hiked about 15 miles already, our feet were heavy, like cinder blocks... Lucky for us, we stopped the right hiker friend at the right moment; otherwise, I may never have made it home to write this review." → 3 stars

[3-star example]: "The food at Beaver Choice Scandinavian Bistro is delicious; a little unusual, but easily understood... This could take a long, long time... We settled in to wait for our food... At about 1 PM my Swedish Meatballs were delivered... At 1:50 a different staff member came over... The fish has to be defrosted slowly because of the parasites... excellent food but the service terrible." → 3 stars

[4-star example]: "In our continuing quest to identify cool, locally owned places to eat and/or drink, Caroline and I auditioned Vintage 95 last night... The atmosphere at Vintage 95 is very close to my Ideal... The bruschetta was VERY nice and quite unusual... The burger was VERY tasty... BIG Kudos to Gavin for his kindness, attention to detail and outstanding customer service. We will DEFINITELY be back." → 4 stars

[4-star example]: "Okay, it almost seems a shame to burst the bubble of the positive reviews of this place, but I just have to... The buffet didn't have a particularly wide variety of stuff... Flavorwise, I found it boring and unspectacular... However, the waiter was real nice and very attentive... I'd eat here again, but only if I'm in the area and DYING for Indian food." → 4 stars

[4-star example]: "Reasons to Heart: Breakfast All Day, Self-Serve Coffee, Modern Hip Decor... My first experience I got ginger beer and a veggie sandwich... I was fucking IMPRESSED... The pancakes were delicate, almost crepe like... Now, eating yummers Blondie cookie and chocolate chip cookies... I think I will have to ride my bike here to justify the butter party celebration!" → 4 stars

[5-star example]: "Owned and operated by Eugenia Theodosopoulos... Essence's twice baked almond croissant arrives slightly smaller than average but with a shell that crackles to the tooth... the flavors and textures rivaled those at Dominique Ansel... my next two tastes were a pair of macarons that rivaled those both here and abroad... I've no doubt I'll be returning soon." → 5 stars

[5-star example]: "Wow. Wow Freakin' Wow. I have never, ever had such a perfect dining experience... FABULOUS, beautifully prepared food... the Lobster potstickers - better than sex... Brad Pitt could have walked up naked and I would not have looked up long enough to stop shoveling chocolate souffle into my face... THUMBS WAY UP!!!" → 5 stars

[5-star example]: "Pizzeria Bianco: Before and After. Cited as the best pizza in America... the three to four hour wait for a table is so daunting... All three pizzas were piping hot when they arrived, just crisp enough around the edges and loaded with the most amazing flavors your mouth has ever experienced... To Chris Bianco and the staff, you haven't skipped a beat!" → 5 stars
'''

# System prompt for role-playing (Step 1 base)
SYSTEM_PROMPT_ROLE = """You are an expert Yelp review analyst with over 10 years of experience understanding customer sentiment, restaurant experiences, and service quality. Your expertise lies in accurately predicting star ratings based on the tone, specific complaints, praises, and overall sentiment expressed in reviews.

Your task is to analyze a Yelp review and predict the star rating (1-5 stars) that the customer would give based on their experience described in the review.

You must respond ONLY with valid JSON in this exact format:
{"predicted_stars": N, "explanation": "brief explanation of your prediction"}

Where N is an integer from 1 to 5."""


def get_step1_prompt(review: str) -> tuple[str, str]:
    """
    Step 1: Zero-Shot with Role-Playing
    Returns (system_prompt, user_prompt)
    """
    system = SYSTEM_PROMPT_ROLE
    user = f"""Analyze this Yelp review and predict the star rating (1-5):

Review: "{review}"

Respond with JSON only: {{"predicted_stars": N, "explanation": "..."}}"""
    
    return system, user


def get_step2_prompt(review: str) -> tuple[str, str]:
    """
    Step 2: Few-Shot = Step 1 + 15 Examples
    Returns (system_prompt, user_prompt)
    """
    system = f"""{SYSTEM_PROMPT_ROLE}

Here are examples of Yelp reviews and their actual star ratings to help calibrate your predictions:
{FEW_SHOT_EXAMPLES}"""

    user = f"""Now analyze this new review and predict its star rating (1-5):

Review: "{review}"

Respond with JSON only: {{"predicted_stars": N, "explanation": "..."}}"""
    
    return system, user


def get_step3_prompt(review: str) -> tuple[str, str]:
    """
    Step 3: CoT + Few-Shot = Step 1 + Step 2 + Chain of Thought
    Returns (system_prompt, user_prompt)
    """
    system = f"""{SYSTEM_PROMPT_ROLE}

Here are examples of Yelp reviews and their actual star ratings:
{FEW_SHOT_EXAMPLES}

CHAIN OF THOUGHT REASONING PROCESS:
Before making your prediction, analyze the review step-by-step:
1. OVERALL SENTIMENT: Is the review predominantly positive, negative, or mixed?
2. SPECIFIC POSITIVES: List any praised aspects (food quality, service, ambiance, value, etc.)
3. SPECIFIC NEGATIVES: List any complaints or issues mentioned
4. SEVERITY ASSESSMENT: How severe are the complaints? How strong is the praise?
5. RATING CRITERIA:
   - 5★: Exceptional experience, highly recommends, no significant complaints
   - 4★: Positive overall with minor issues or room for improvement
   - 3★: Mixed experience, neither great nor terrible, average
   - 2★: More negative than positive, significant issues but some redeeming qualities
   - 1★: Terrible experience, strong complaints, would not return"""

    user = f"""Analyze this review step-by-step and predict the star rating (1-5):

Review: "{review}"

Respond with JSON only: {{"predicted_stars": N, "reasoning": "your step-by-step analysis", "explanation": "final brief explanation"}}"""
    
    return system, user
