# Library Recipe Photos Setup Guide

This guide will help you add photos to your 5 library recipes.

## Step 1: Create Storage Bucket in Supabase

1. Go to https://supabase.com/dashboard
2. Select your **recipe-killer-ai** project
3. Click **Storage** in the left sidebar
4. Click **New bucket**
5. Configure the bucket:
   - **Name**: `library-recipe-images`
   - **Public bucket**: ✅ **ENABLE THIS** (so images can be displayed publicly)
   - Click **Create bucket**

## Step 2: Upload Your 5 Recipe Photos

1. Click on the **library-recipe-images** bucket
2. Upload your photos (drag & drop or click Upload):
   - Name them clearly (e.g., `carbonara.jpg`, `thai-curry.jpg`, etc.)
   - Supported formats: JPG, PNG, WEBP
   - Recommended size: 800x600px or similar (will be displayed at 1.2:1 aspect ratio)

## Step 3: Get Public URLs for Each Photo

After uploading, for each photo:

1. Click on the photo name in the file list
2. Click **Copy URL** or **Get public URL**
3. Copy the full URL (format: `https://[project-id].supabase.co/storage/v1/object/public/library-recipe-images/your-photo.jpg`)

Save these URLs - you'll need them for the next step!

## Step 4: Add `image_url` Column to Database

Go to **SQL Editor** in Supabase and run this command:

```sql
-- Add image_url column to library_recipes table
ALTER TABLE library_recipes
ADD COLUMN image_url TEXT;
```

Click **Run** to execute.

## Step 5: Update Your 5 Recipes with Image URLs

Find your recipe IDs first:

```sql
-- View all library recipes to get their IDs
SELECT id, recipe_data->>'dishName' as dish_name, category
FROM library_recipes
ORDER BY popularity DESC;
```

Then update each recipe with its image URL:

```sql
-- Example: Update recipe 1 (replace with your actual ID and URL)
UPDATE library_recipes
SET image_url = 'https://[your-project-id].supabase.co/storage/v1/object/public/library-recipe-images/carbonara.jpg'
WHERE id = 'your-recipe-id-here';

-- Repeat for all 5 recipes with their respective image URLs
```

**Template for all 5 recipes:**

```sql
-- Recipe 1: Classic Carbonara (Italian)
UPDATE library_recipes
SET image_url = 'YOUR_IMAGE_URL_HERE'
WHERE id = 'RECIPE_ID_HERE';

-- Recipe 2: Thai Green Curry (Asian)
UPDATE library_recipes
SET image_url = 'YOUR_IMAGE_URL_HERE'
WHERE id = 'RECIPE_ID_HERE';

-- Recipe 3: Beef Bourguignon (American)
UPDATE library_recipes
SET image_url = 'YOUR_IMAGE_URL_HERE'
WHERE id = 'RECIPE_ID_HERE';

-- Recipe 4: Mediterranean Recipe
UPDATE library_recipes
SET image_url = 'YOUR_IMAGE_URL_HERE'
WHERE id = 'RECIPE_ID_HERE';

-- Recipe 5: Vegetarian/Dessert Recipe
UPDATE library_recipes
SET image_url = 'YOUR_IMAGE_URL_HERE'
WHERE id = 'RECIPE_ID_HERE';
```

## Step 6: Verify Images Are Working

1. Refresh your app
2. Navigate to the Library tab
3. You should see your uploaded photos instead of colored placeholders!

## Troubleshooting

### Images not showing?

1. **Check the bucket is public:**
   - Go to Storage → library-recipe-images
   - Click the settings icon (⚙️)
   - Ensure "Public bucket" is enabled

2. **Verify the image URL is correct:**
   ```sql
   SELECT id, recipe_data->>'dishName' as name, image_url
   FROM library_recipes;
   ```
   - URLs should start with `https://`
   - Try opening the URL in a browser - it should show the image

3. **Check image file formats:**
   - Supported: JPG, PNG, WEBP
   - Not supported: HEIC, RAW, etc.

### Need to update an image?

1. Upload the new image to the bucket
2. Update the database with the new URL:
   ```sql
   UPDATE library_recipes
   SET image_url = 'NEW_URL_HERE'
   WHERE id = 'RECIPE_ID_HERE';
   ```

## Notes

- Images fall back to colored placeholders if `image_url` is null or fails to load
- Each category has its own placeholder color (Italian=coral, Asian=orange, etc.)
- Images are displayed with a 1.2:1 aspect ratio
- Recommended image dimensions: 800x960px or similar proportions
