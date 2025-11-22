// Supabase Edge Function: analyze-recipe
// Securely analyzes recipe images or text using OpenAI API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserPreferences {
  allergies: string[];
  dislikes: string[];
  diet_type: string;
}

interface RecipeVersion {
  name: string;
  time: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
}

interface RecipeAnalysis {
  dishName: string;
  versions: {
    [key: string]: RecipeVersion;
  };
}

interface RequestBody {
  imageBase64?: string;
  recipeText?: string;
  preferences?: UserPreferences;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: RequestBody = await req.json()
    const { imageBase64, recipeText, preferences } = body

    // Validate input
    if (!imageBase64 && !recipeText) {
      return new Response(
        JSON.stringify({ error: 'Either imageBase64 or recipeText must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build dietary restrictions text
    let dietaryRestrictionsText = ''
    if (preferences && (preferences.allergies?.length > 0 || preferences.dislikes?.length > 0 || preferences.diet_type !== 'None')) {
      dietaryRestrictionsText = '\\n\\nCRITICAL DIETARY RESTRICTIONS:\\n'

      if (preferences.allergies?.length > 0) {
        dietaryRestrictionsText += `- User is ALLERGIC to: ${preferences.allergies.join(', ')}. NEVER include these ingredients in ANY version. This is a safety requirement.\\n`
      }

      if (preferences.dislikes?.length > 0) {
        dietaryRestrictionsText += `- User dislikes: ${preferences.dislikes.join(', ')}. Avoid these when possible, substitute with alternatives if needed.\\n`
      }

      if (preferences.diet_type && preferences.diet_type !== 'None') {
        dietaryRestrictionsText += `- User diet type: ${preferences.diet_type}. Respect this strictly (e.g., no meat for vegetarians, no animal products for vegans, no gluten for gluten-free).\\n`
      }

      dietaryRestrictionsText += '\\nIf a recipe cannot be made without allergens, state this clearly in the dish name and suggest alternatives.\\n'
    }

    // Build the prompt (full prompt from openai.ts)
    const promptText = `Analyse this ${imageBase64 ? 'food photo' : 'recipe text'} and identify the dish. Generate 5 different versions of the recipe based on EFFORT and INGREDIENTS (not strict time constraints).${dietaryRestrictionsText}

IMPORTANT: Return ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):

{
  "dishName": "Name of the dish",
  "versions": {
    "0": {
      "name": "Recipe Killer",
      "time": "realistic time based on actual cooking (e.g., 5 mins for eggs, 20-30 mins for pasta)",
      "servings": "realistic servings based on photo/dish type",
      "ingredients": ["400g tin chopped tomatoes", "2 tbsp tomato passata", "250g dried pasta", "1 onion", "2 cloves garlic", "salt and pepper", "olive oil"],
      "instructions": ["step 1", "step 2", ...]
    },
    "1": {
      "name": "Simple",
      "time": "realistic time based on actual cooking",
      "servings": "realistic servings based on photo/dish type",
      "ingredients": ["400g tinned tomatoes", "200g dried pasta", "1 onion", "2 cloves garlic", "dried herbs"],
      "instructions": [...]
    },
    "2": {
      "name": "Average",
      "time": "realistic time based on actual cooking",
      "servings": "realistic servings based on photo/dish type",
      "ingredients": ["500g fresh tomatoes", "300g pasta", "1 large onion", "3 cloves garlic", "fresh basil"],
      "instructions": [...]
    },
    "3": {
      "name": "Complex",
      "time": "realistic time based on actual cooking",
      "servings": "realistic servings based on photo/dish type",
      "ingredients": ["800g mixed tomatoes", "400g fresh pasta", "100ml double cream", "fresh herbs"],
      "instructions": [...]
    },
    "4": {
      "name": "Very Complex",
      "time": "realistic time based on actual cooking",
      "servings": "realistic servings based on photo/dish type",
      "ingredients": ["1kg heritage tomatoes", "500g 00 flour for pasta", "4 large eggs", "various aromatics"],
      "instructions": [...]
    }
  }
}

CRITICAL REQUIREMENTS:

1. SERVINGS - Determine realistically based on the dish shown in the photo:
   - Analyse the portion size visible in the image
   - Consider what's typical for this type of dish (e.g., paella → 4-6 people, egg on toast → 1 person, family lasagne → 4-6 people)
   - Don't base servings on complexity level - a simple dish can still feed many people

2. INGREDIENTS - MUST include specific quantities and units (British English):
   - Use metric measurements ONLY (grams, ml, litres, °C)
   - Include precise amounts: "200g spaghetti", "2 tablespoons olive oil", "1 large onion", "400g tin chopped tomatoes"
   - NEVER use vague terms like "some", "a bit", "handful" - always specify exact measurements
   - For ready-made items, include package sizes: "500g jar pasta sauce", "250g pack butter"
   - Use British ingredient names: aubergine (not eggplant), courgette (not zucchini), coriander (not cilantro), spring onion (not scallion), rocket (not arugula)

3. COMPLEXITY RULES (British English ONLY) - Focus on TECHNIQUE SIMPLIFICATION, not time or ingredient limits:

   - Recipe Killer (0): ULTRA-SIMPLIFIED HOME COOKING. The fastest homemade version possible.
     * Use the fewest steps and simplest techniques
     * Acceptable shortcuts: tinned tomatoes, passata, stock cubes, pre-grated cheese, dried herbs
     * AVOID: Jar sauces, ready meals, "heat and serve" products
     * Example: Quick spag bol with tinned tomatoes, passata, onion, garlic (NOT jar sauce)
     * Ingredient count: Flexible based on dish (eggs on toast = 2-3, spag bol = 7-8)
     * No detailed chopping instructions needed

   - Simple (1): BASIC HOME COOKING. Straightforward techniques, minimal fuss.
     * Simple cooking methods without detailed explanations
     * Tinned/frozen ingredients acceptable where sensible
     * Basic knife skills assumed (no need to explain how to chop an onion)
     * Ingredient count: Flexible based on dish needs

   - Average (2): STANDARD HOME COOKING. Balanced approach for weeknight meals.
     * Mix of fresh and convenience ingredients
     * Standard home cooking techniques
     * Ingredient count: Flexible based on dish needs

   - Complex (3): ADVANCED HOME COOKING. More involved techniques, mostly from scratch.
     * Advanced techniques WITH brief explanations (e.g., "Sauté the onions means cook them gently in fat until soft")
     * Explain any jargon or technique names that average home cooks might not know
     * Ingredient count: Flexible based on dish needs

   - Very Complex (4): RESTAURANT-LEVEL HOME COOKING. Everything from scratch, all traditional methods.
     * Professional techniques with DETAILED explanations
     * Explain ALL jargon (e.g., "Brunoise means a very fine 2-3mm dice", "Make a roux by cooking equal parts flour and butter")
     * Scientific reasoning and pro tips
     * Ingredient count: Flexible based on dish needs

4. INSTRUCTIONS - Detail level MUST match complexity. NUMBER OF STEPS IS FLEXIBLE - base on what the recipe needs:

   - Recipe Killer (0): Minimal steps, ultra-simple. Focus on speed and ease. Example: "Chop the onion and garlic", "Fry in olive oil for 3-4 minutes until soft", "Add tinned tomatoes and passata, season with salt and pepper", "Simmer for 10 minutes while pasta cooks", "Drain pasta and mix with sauce"

   - Simple (1): Basic steps without detailed explanations. Assume basic knife skills. Example: "Dice the onion", "Fry in oil for 5 minutes until soft", "Add tinned tomatoes and simmer for 15 minutes", "Season to taste"

   - Average (2): Standard home cooking instructions with some technique guidance. Example: "Finely dice the onion and garlic", "Heat olive oil in a large pan over medium heat, add onion and cook for 5-7 minutes until softened and translucent", "Add garlic and cook for another minute until fragrant, being careful not to burn"

   - Complex (3): Detailed steps with technique explanations - EXPLAIN JARGON. Example: "Finely dice the onion into 5mm pieces for even cooking", "Sauté the onion (which means cook gently in fat until soft) in 2 tablespoons olive oil over medium heat for 8-10 minutes, stirring occasionally, until deeply softened and just starting to caramelise at the edges", "Add the minced garlic and cook for 1-2 minutes until fragrant but not browned - garlic burns quickly so keep stirring"

   - Very Complex (4): Highly detailed professional techniques - EXPLAIN ALL JARGON AND TECHNIQUES. Example: "Cut the onions into a fine brunoise - this is a very precise 2-3mm dice using a sharp chef's knife. This cut ensures uniform cooking and creates the silky texture that defines a proper sauce", "Make a roux by cooking equal parts flour and butter together, stirring constantly for 2-3 minutes until it smells nutty", "Heat 3 tablespoons extra virgin olive oil in a heavy-bottomed pan over medium-low heat (around 140-150°C - the oil should shimmer but not smoke). This gentle temperature allows the onions to release their natural sugars slowly", "Sweat the onions (cook covered over low heat without colour) for 12-15 minutes, stirring every 2-3 minutes, until completely soft and translucent with no raw bite"

TIME: Calculate realistic time based on actual cooking needs (5 mins for scrambled eggs, 30 mins for a quick pasta, 2 hours for a slow-cooked stew). Don't force recipes into time brackets.

CRITICAL: Use BRITISH ENGLISH spelling and terminology throughout:
- "Colour" not "color", "flavour" not "flavor", "honour" not "honor"
- "Organised" not "organized", "characterised" not "characterized"
- "Centre" not "center", "metre" not "meter", "litre" not "liter"
- Use British cooking terms: "grill" (not broil), "aubergine" (not eggplant), "courgette" (not zucchini), "coriander" (not cilantro)
- Use "shop-bought" or "ready-made" instead of "store-bought"
- Use "tinned" instead of "canned"
- Use metric measurements only (grams, ml, litres, °C)`

    // Build messages for OpenAI
    const messages: any[] = [
      {
        role: 'user',
        content: imageBase64
          ? [
              { type: 'text', text: promptText },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
              }
            ]
          : promptText
      }
    ]

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 3000,
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response received from OpenAI')
    }

    // Parse and clean JSON response
    let cleanedResponse = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas

    const parsedResponse: RecipeAnalysis = JSON.parse(cleanedResponse)

    // Validate structure
    if (!parsedResponse.dishName || !parsedResponse.versions) {
      throw new Error('Invalid response structure from OpenAI')
    }

    // Return successful response
    return new Response(
      JSON.stringify(parsedResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
