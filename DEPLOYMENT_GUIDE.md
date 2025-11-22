# OpenAI Backend Migration - Deployment Guide

## 🎯 Overview

This guide will help you deploy the secure backend Edge Function to Supabase and complete the migration of OpenAI API calls from the client to the server.

---

## ✅ What's Been Done

1. **Created Supabase Edge Function** (`supabase/functions/analyze-recipe/index.ts`)
   - Handles recipe analysis securely on the server
   - Supports both image and text input
   - Applies dietary preferences
   - Full authentication and validation

2. **Created Backend API Service** (`src/services/backend-api.ts`)
   - Client-side wrapper for calling the Edge Function
   - Handles image conversion to base64
   - Error handling

3. **Updated Client Code** (`app/upload.tsx`)
   - Replaced direct OpenAI calls with backend API calls
   - No OpenAI API key exposed in client

4. **Removed API Key from Config** (`app.config.js`)
   - OpenAI key no longer embedded in app bundle

---

## 🚀 Deployment Steps

### Step 1: Add OpenAI API Key to Supabase Secrets

1. **Go to Supabase Dashboard**:
   - Navigate to: https://supabase.com/dashboard/project/ewljyjuzhdvlkxqumgrv/settings/vault

2. **Add Secret**:
   - Click "New secret"
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (currently in your `.env` file)
   - Click "Add secret"

3. **Verify Secret**:
   - Ensure the secret appears in the list
   - It will be available to all Edge Functions

---

### Step 2: Deploy Edge Function to Supabase

#### Option A: Deploy via Supabase Dashboard (Easiest)

1. **Navigate to Edge Functions**:
   - Go to: https://supabase.com/dashboard/project/ewljyjuzhdvlkxqumgrv/functions

2. **Create New Function**:
   - Click "Create a new function"
   - Name: `analyze-recipe`
   - Copy the contents of `supabase/functions/analyze-recipe/index.ts`
   - Paste into the editor
   - Click "Deploy function"

#### Option B: Deploy via Supabase CLI (Recommended for updates)

1. **Login to Supabase CLI**:
   ```bash
   # Get your access token from: https://supabase.com/dashboard/account/tokens
   npx supabase login --token YOUR_ACCESS_TOKEN
   ```

2. **Link your project**:
   ```bash
   npx supabase link --project-ref ewljyjuzhdvlkxqumgrv
   ```

3. **Deploy the function**:
   ```bash
   npx supabase functions deploy analyze-recipe
   ```

4. **Verify deployment**:
   ```bash
   npx supabase functions list
   ```

---

### Step 3: Test the Edge Function

1. **Test via Dashboard**:
   - Go to: https://supabase.com/dashboard/project/ewljyjuzhdvlkxqumgrv/functions
   - Select `analyze-recipe`
   - Click "Invoke function"
   - Use this test payload:
     ```json
     {
       "recipeText": "Scrambled eggs: 2 eggs, 1 tbsp butter, salt and pepper. Beat eggs, melt butter in pan, cook eggs while stirring until set.",
       "preferences": {
         "allergies": [],
         "dislikes": [],
         "diet_type": "None"
       }
     }
     ```
   - Click "Send request"
   - Should return recipe analysis with 5 versions

2. **Check for errors**:
   - If error: Check that `OPENAI_API_KEY` secret is set
   - View logs in the Functions dashboard

---

### Step 4: Test in the Mobile App

1. **Rebuild the app** (to pick up code changes):
   ```bash
   # Stop current dev server (if running)
   # Restart with:
   npx expo start --clear
   ```

2. **Test recipe analysis**:
   - Open the app
   - Go to "Analyse Recipe"
   - Upload a photo or paste text
   - Tap "Analyse Recipe"
   - Should work identically to before, but now secure!

3. **Check logs**:
   - Client should log: "Starting recipe analysis via backend..."
   - Check Supabase Edge Function logs for any errors

---

### Step 5: Regenerate OpenAI API Key (Security)

**⚠️ CRITICAL**: Your current OpenAI API key was exposed in your git repository and app bundles. Anyone who downloaded your app can extract it.

1. **Go to OpenAI Dashboard**:
   - Navigate to: https://platform.openai.com/api-keys

2. **Revoke old key**:
   - Find your current key (starts with `sk-proj-tELl...`)
   - Click "Revoke" or "Delete"
   - Confirm revocation

3. **Create new key**:
   - Click "Create new secret key"
   - Name it: "Recipe Killer AI - Supabase Backend"
   - Copy the new key

4. **Update Supabase secret**:
   - Go back to: https://supabase.com/dashboard/project/ewljyjuzhdvlkxqumgrv/settings/vault
   - Edit `OPENAI_API_KEY`
   - Paste the new key
   - Save

5. **Remove old key from `.env`**:
   - Open `.env` file
   - Delete or comment out the old `OPENAI_API_KEY` line
   - **Do NOT commit `.env` to git**

---

### Step 6: Update Documentation

1. **Add Supabase URL to `.env`** (if not already there):
   ```
   SUPABASE_URL=https://ewljyjuzhdvlkxqumgrv.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **Verify `.gitignore`** includes `.env`:
   ```
   .env
   .env.local
   ```

---

## 🔍 Troubleshooting

### Error: "OpenAI API key not configured"
- **Solution**: Ensure `OPENAI_API_KEY` is added to Supabase secrets (Step 1)

### Error: "Unauthorized"
- **Solution**: Check that user is logged in. The Edge Function requires authentication.

### Error: "Failed to analyze recipe"
- **Solution**:
  1. Check Supabase Edge Function logs for details
  2. Verify OpenAI API key is valid
  3. Ensure OpenAI API has available credits

### Edge Function not found
- **Solution**: Redeploy the function (Step 2)

### CORS errors
- **Solution**: Edge Function includes CORS headers. If still seeing errors, check Supabase CORS settings.

---

## 📊 Verification Checklist

- [ ] OpenAI API key added to Supabase secrets
- [ ] Edge Function deployed successfully
- [ ] Edge Function test returns valid recipe analysis
- [ ] Mobile app can analyze recipes
- [ ] No OpenAI API key in client code
- [ ] Old OpenAI API key revoked
- [ ] New OpenAI API key stored only in Supabase
- [ ] `.env` file not committed to git

---

## 🎉 Benefits of This Migration

1. **Security**: API key never exposed to client
2. **Cost Control**: Centralized monitoring and rate limiting
3. **Flexibility**: Easy to update prompts without app release
4. **Audit Trail**: All API calls logged in Supabase
5. **Scalability**: Edge functions auto-scale

---

## 📝 Next Steps (Optional Enhancements)

1. **Add rate limiting** in Edge Function (beyond client-side limits)
2. **Add cost tracking** and alerts in Supabase
3. **Add caching** for repeated recipe queries
4. **Add admin dashboard** to view API usage
5. **Add A/B testing** for different prompts

---

## 🆘 Need Help?

- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **OpenAI Docs**: https://platform.openai.com/docs
- **Edge Function Logs**: https://supabase.com/dashboard/project/ewljyjuzhdvlkxqumgrv/functions

---

## ⏱️ Estimated Time

- Step 1 (Add secret): 2 minutes
- Step 2 (Deploy function): 3 minutes
- Step 3 (Test function): 2 minutes
- Step 4 (Test app): 5 minutes
- Step 5 (Regenerate key): 3 minutes
- **Total: ~15 minutes**

Good luck with the deployment! 🚀
