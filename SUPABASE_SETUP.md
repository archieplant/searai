# Supabase Edge Function Setup Guide

This guide explains how to securely configure your Supabase Edge Functions with the necessary API keys.

## Adding Edge Function Secrets

Edge Function secrets are environment variables that are securely stored in Supabase and accessible only to your Edge Functions. They are NOT exposed to the client application.

### Required Secret: OPENAI_API_KEY

The `analyze-recipe` Edge Function requires an OpenAI API key to process recipe images and text.

#### Option 1: Using Supabase Dashboard (Recommended)

1. **Get your OpenAI API Key**
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key or use an existing one
   - Copy the key (starts with `sk-proj-...`)

2. **Add to Supabase Secrets**
   - Open your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project: `ewljyjuzhdvlkxqumgrv`
   - Navigate to **Project Settings** → **Edge Functions**
   - Scroll to **Secrets** section
   - Click **Add new secret**
   - Name: `OPENAI_API_KEY`
   - Value: Paste your OpenAI API key
   - Click **Save**

3. **Deploy your Edge Function**
   ```bash
   npx supabase functions deploy analyze-recipe
   ```

#### Option 2: Using Supabase CLI

1. **Set the secret locally**
   ```bash
   npx supabase secrets set OPENAI_API_KEY=your-actual-openai-api-key
   ```

2. **Deploy the function**
   ```bash
   npx supabase functions deploy analyze-recipe
   ```

### Verifying the Secret is Set

To verify that your secret is properly configured:

1. **List all secrets**
   ```bash
   npx supabase secrets list
   ```

2. **Test the Edge Function**
   - Try analyzing a recipe in the app
   - Check the Supabase Logs in the dashboard for any errors
   - Navigate to **Functions** → **analyze-recipe** → **Logs**

## Security Notes

### ✅ Safe for .env (Client-Side)
- `SUPABASE_URL` - Public URL for your Supabase project
- `SUPABASE_ANON_KEY` - Anon/public key (protected by Row Level Security)
- `REVENUECAT_API_KEY` - Public SDK key (NOT the secret API key)

### ❌ NEVER Add to .env (Server-Only)
- `OPENAI_API_KEY` - Must be in Supabase Edge Function secrets
- RevenueCat Secret API Key - Only use the public SDK key in .env

## Local Development

For local Edge Function development, you can create a `.env` file in the `supabase/functions/` directory:

```bash
# supabase/functions/.env
OPENAI_API_KEY=your-openai-api-key-here
```

**IMPORTANT:** This file should be in `.gitignore` and is ONLY for local testing of Edge Functions.

## Troubleshooting

### Error: "OpenAI API key not configured"
- Verify the secret is set: `npx supabase secrets list`
- Check the secret name is exactly `OPENAI_API_KEY`
- Redeploy the function: `npx supabase functions deploy analyze-recipe`

### Error: "Unauthorized" or authentication errors
- Check that you're passing the Authorization header from the client
- Verify RLS policies are configured correctly
- Check Supabase logs for detailed error messages

### Rate Limiting
The Edge Function has built-in rate limiting:
- Maximum 5 requests per minute per user
- This protects your OpenAI API costs

## Next Steps

After configuring your Edge Function secrets:

1. ✅ Deploy the Edge Function to production
2. ✅ Test recipe analysis in the app
3. ✅ Monitor usage in Supabase Dashboard → Functions → Logs
4. ✅ Set up billing alerts for OpenAI API usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)
