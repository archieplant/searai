# SearAI Legal Documentation

This directory contains the legal documentation for SearAI:
- Privacy Policy (v1.0.0)
- Terms of Service (v1.0.0)
- Content Policy (v1.0.0)

## Deployment Instructions

### Option 1: Deploy to Vercel (Recommended)

Vercel is the easiest way to host these static HTML files with your custom domain.

#### Prerequisites
- GitHub account (to import this repository)
- Vercel account (free tier is sufficient) - Sign up at [vercel.com](https://vercel.com)
- Your domain: `searai.app` or `tcapdevs.com`

#### Step 1: Prepare for Deployment

1. Ensure this `legal-docs` directory is committed to your GitHub repository
2. Sign up for Vercel at [vercel.com](https://vercel.com) using your GitHub account

#### Step 2: Import Project to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository: `recipe-killer-ai`
4. Click "Import"

#### Step 3: Configure Project

In the project configuration:

1. **Root Directory:** Set to `legal-docs` (important!)
2. **Framework Preset:** Select "Other" or leave as default
3. **Build Command:** Leave empty (static files)
4. **Output Directory:** Leave as default (`.`)
5. Click "Deploy"

#### Step 4: Configure Custom Domain

After deployment:

1. Go to your project dashboard on Vercel
2. Navigate to "Settings" → "Domains"
3. Add your domain:
   - Option A: `searai.app` (root domain)
   - Option B: `legal.searai.app` (subdomain - recommended)
   - Option C: `tcapdevs.com` or subdomain

4. Vercel will provide DNS instructions:
   - For subdomain: Add CNAME record pointing to `cname.vercel-dns.com`
   - For root domain: Add A record to Vercel's IP or use their nameservers

5. Update DNS settings in your domain registrar (where you bought searai.app/tcapdevs.com)

6. Wait for DNS propagation (can take up to 48 hours, usually 1-2 hours)

#### Step 5: Update App Configuration

Once your domain is active, update the legal URLs in your app:

Edit `/Users/archieplant/recipe-killer-ai/src/constants/legal.ts`:

```typescript
// If using subdomain legal.searai.app
const LEGAL_BASE_URL = 'https://legal.searai.app';

// OR if using root domain
const LEGAL_BASE_URL = 'https://searai.app';

export const LEGAL_URLS = {
  PRIVACY_POLICY: `${LEGAL_BASE_URL}/privacy-policy.html`,
  TERMS_OF_SERVICE: `${LEGAL_BASE_URL}/terms-of-service.html`,
  CONTENT_POLICY: `${LEGAL_BASE_URL}/content-policy.html`,
};
```

### Option 2: Deploy to Cloudflare Pages

1. Sign up at [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your GitHub repository
3. Set build directory to `legal-docs`
4. Deploy and configure custom domain in Cloudflare settings

### Option 3: GitHub Pages with Custom Domain

1. Create a new repository: `archieplant/legal-docs`
2. Push these files to the repository
3. Enable GitHub Pages in repository settings
4. Configure custom domain in repository settings
5. Add CNAME DNS record from your domain to `archieplant.github.io`

## Verifying Deployment

Once deployed, test all URLs:
- https://your-domain.com/privacy-policy.html
- https://your-domain.com/terms-of-service.html
- https://your-domain.com/content-policy.html
- https://your-domain.com/ (landing page)

## Updating Legal Documents

To update legal documents:

1. Edit the HTML files in this directory
2. Update version numbers and "Last Updated" dates
3. Update `LEGAL_VERSIONS` in `src/constants/legal.ts`
4. Commit and push to GitHub
5. Vercel will automatically redeploy (if configured for auto-deploy)

## Recommended Domain Setup

**Best option:** Use a subdomain for legal documents
- `legal.searai.app` → Legal documentation
- `searai.app` → Marketing/main website (future)
- `api.searai.app` → API endpoints (if needed)

This keeps legal docs separate from your main site and makes organization cleaner.

## SSL/HTTPS

Vercel automatically provides free SSL certificates via Let's Encrypt. Your legal pages will be served over HTTPS with no additional configuration needed.

## Support

If you encounter issues deploying:
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Vercel Support: Available through their dashboard
- DNS Help: Contact your domain registrar

## Files Included

- `index.html` - Landing page with links to all legal documents
- `privacy-policy.html` - Privacy Policy (v1.0.0)
- `terms-of-service.html` - Terms of Service (v1.0.0)
- `content-policy.html` - Content Policy (v1.0.0)
- `README.md` - This file

## Next Steps After Deployment

1. ✅ Deploy to Vercel
2. ✅ Configure custom domain
3. ✅ Update `legal.ts` with new URLs
4. ✅ Test all links in the app
5. ✅ Update App Store privacy policy URL in `app.config.js` (iOS)
6. ✅ Commit and push all changes
