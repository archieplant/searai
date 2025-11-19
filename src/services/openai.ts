import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

// Get API key from Expo Constants (loaded from app.config.js)
const apiKey = Constants.expoConfig?.extra?.openaiApiKey;

if (!apiKey) {
  throw new Error(
    'OpenAI API key not found. Please ensure OPENAI_API_KEY is set in your .env file and app.config.js is properly configured.'
  );
}

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: apiKey,
});

export interface RecipeVersion {
  name: string;
  time: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
}

export interface RecipeAnalysis {
  dishName: string;
  versions: {
    [key: string]: RecipeVersion;
  };
}

export interface UserPreferences {
  allergies: string[];
  dislikes: string[];
  dietType: string;
}

/**
 * Analyses a recipe image using OpenAI's GPT-4 Vision API and generates 5 versions
 * based on effort and complexity (not strict time constraints)
 *
 * @param imageUri - The local URI of the image to analyse
 * @param preferences - User dietary preferences (allergies, dislikes, diet type)
 * @returns Promise<RecipeAnalysis> - Structured recipe data with 5 versions
 * @throws Error if the API call fails or image processing fails
 */
export async function analyseRecipeFromImage(
  imageUri: string,
  preferences?: UserPreferences
): Promise<RecipeAnalysis> {
  try {
    // Read the image file and convert to base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Create the data URL for the API
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

    // Build dietary restrictions text
    let dietaryRestrictionsText = '';
    if (preferences && (preferences.allergies.length > 0 || preferences.dislikes.length > 0 || preferences.dietType !== 'None')) {
      dietaryRestrictionsText = '\n\nCRITICAL DIETARY RESTRICTIONS:\n';

      if (preferences.allergies.length > 0) {
        dietaryRestrictionsText += `- User is ALLERGIC to: ${preferences.allergies.join(', ')}. NEVER include these ingredients in ANY version. This is a safety requirement.\n`;
      }

      if (preferences.dislikes.length > 0) {
        dietaryRestrictionsText += `- User dislikes: ${preferences.dislikes.join(', ')}. Avoid these when possible, substitute with alternatives if needed.\n`;
      }

      if (preferences.dietType !== 'None') {
        dietaryRestrictionsText += `- User diet type: ${preferences.dietType}. Respect this strictly (e.g., no meat for vegetarians, no animal products for vegans, no gluten for gluten-free).\n`;
      }

      dietaryRestrictionsText += '\nIf a recipe cannot be made without allergens, state this clearly in the dish name and suggest alternatives.\n';
    }

    // Call OpenAI's GPT-4 Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyse this food photo and identify the dish. Generate 5 different versions of the recipe based on EFFORT and INGREDIENTS (not strict time constraints).${dietaryRestrictionsText}

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
- Use metric measurements only (grams, ml, litres, °C)`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 3000,
    });

    // Extract the AI's response
    const aiResponse = response.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response received from OpenAI');
    }

    // Parse JSON response
    try {
      // Remove any markdown code blocks if present
      let cleanedResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Remove trailing commas before closing braces/brackets (common JSON syntax error)
      cleanedResponse = cleanedResponse
        .replace(/,(\s*[}\]])/g, '$1');

      const parsedResponse: RecipeAnalysis = JSON.parse(cleanedResponse);

      // Validate the structure
      if (!parsedResponse.dishName || !parsedResponse.versions) {
        throw new Error('Invalid response structure from OpenAI');
      }

      return parsedResponse;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.error('Raw response:', aiResponse);
      throw new Error('Failed to parse recipe data. Please try again.');
    }
  } catch (error) {
    console.error('Error analysing recipe image:', error);

    if (error instanceof Error) {
      throw new Error(`Failed to analyse recipe: ${error.message}`);
    }

    throw new Error('Failed to analyse recipe: Unknown error');
  }
}

/**
 * Analyses recipe text using OpenAI's GPT-4o API and generates 5 versions
 * based on effort and complexity (not strict time constraints)
 *
 * @param recipeText - The recipe text to analyse (can be from a website, book, etc.)
 * @param preferences - User dietary preferences (allergies, dislikes, diet type)
 * @returns Promise<RecipeAnalysis> - Structured recipe data with 5 versions
 * @throws Error if the API call fails or text processing fails
 */
export async function analyseRecipeFromText(
  recipeText: string,
  preferences?: UserPreferences
): Promise<RecipeAnalysis> {
  try {
    if (!recipeText.trim()) {
      throw new Error('Recipe text cannot be empty');
    }

    // Build dietary restrictions text
    let dietaryRestrictionsText = '';
    if (preferences && (preferences.allergies.length > 0 || preferences.dislikes.length > 0 || preferences.dietType !== 'None')) {
      dietaryRestrictionsText = '\n\nCRITICAL DIETARY RESTRICTIONS:\n';

      if (preferences.allergies.length > 0) {
        dietaryRestrictionsText += `- User is ALLERGIC to: ${preferences.allergies.join(', ')}. NEVER include these ingredients in ANY version. This is a safety requirement.\n`;
      }

      if (preferences.dislikes.length > 0) {
        dietaryRestrictionsText += `- User dislikes: ${preferences.dislikes.join(', ')}. Avoid these when possible, substitute with alternatives if needed.\n`;
      }

      if (preferences.dietType !== 'None') {
        dietaryRestrictionsText += `- User diet type: ${preferences.dietType}. Respect this strictly (e.g., no meat for vegetarians, no animal products for vegans, no gluten for gluten-free).\n`;
      }

      dietaryRestrictionsText += '\nIf a recipe cannot be made without allergens, state this clearly in the dish name and suggest alternatives.\n';
    }

    // Call OpenAI's GPT-4o API (text-only, no vision)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Analyse this recipe text and identify the dish. Generate 5 different versions of the recipe based on EFFORT and INGREDIENTS (not strict time constraints).${dietaryRestrictionsText}

Recipe text:
"""
${recipeText}
"""

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
- Use metric measurements only (grams, ml, litres, °C)`,
        },
      ],
      max_tokens: 3000,
    });

    // Extract the AI's response
    const aiResponse = response.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response received from OpenAI');
    }

    // Parse JSON response
    try {
      // Remove any markdown code blocks if present
      let cleanedResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Remove trailing commas before closing braces/brackets (common JSON syntax error)
      cleanedResponse = cleanedResponse
        .replace(/,(\s*[}\]])/g, '$1');

      const parsedResponse: RecipeAnalysis = JSON.parse(cleanedResponse);

      // Validate the structure
      if (!parsedResponse.dishName || !parsedResponse.versions) {
        throw new Error('Invalid response structure from OpenAI');
      }

      return parsedResponse;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.error('Raw response:', aiResponse);
      throw new Error('Failed to parse recipe data. Please try again.');
    }
  } catch (error) {
    console.error('Error analysing recipe text:', error);

    if (error instanceof Error) {
      throw new Error(`Failed to analyse recipe: ${error.message}`);
    }

    throw new Error('Failed to analyse recipe: Unknown error');
  }
}

/**
 * Unified function to analyze a recipe from either text or image
 *
 * @param recipeText - The recipe text to analyze (optional if imageUri provided)
 * @param imageUri - The local URI of the image to analyze (optional if recipeText provided)
 * @param preferences - User dietary preferences (allergies, dislikes, diet type)
 * @returns Promise<RecipeAnalysis> - Structured recipe data with 5 versions
 * @throws Error if neither text nor image provided, or if analysis fails
 */
export async function analyzeRecipe(
  recipeText?: string,
  imageUri?: string,
  preferences?: UserPreferences
): Promise<RecipeAnalysis> {
  // If image is provided, use image analysis (prioritize image over text)
  if (imageUri) {
    return analyseRecipeFromImage(imageUri, preferences);
  }

  // If text is provided, use text analysis
  if (recipeText && recipeText.trim()) {
    return analyseRecipeFromText(recipeText, preferences);
  }

  // If neither is provided, throw error
  throw new Error('Either recipe text or image URI must be provided');
}
