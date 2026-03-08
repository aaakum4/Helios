# Vercel Deployment Setup

## PostHog Environment Variables

When deploying to Vercel, you need to add these environment variables in your project settings:

### Steps:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_POSTHOG_API_KEY` | `phc_ptO1jI9NQAATEQHpvKiK52C1GRXkwu0iA5lQAFJSABq` | Production, Preview, Development |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` | Production, Preview, Development |

4. Click **Save**
5. Redeploy your project

### Quick Command

Or set them via Vercel CLI:

```bash
vercel env add VITE_POSTHOG_API_KEY
# Paste: phc_ptO1jI9NQAATEQHpvKiK52C1GRXkwu0iA5lQAFJSABq

vercel env add VITE_POSTHOG_HOST
# Paste: https://us.i.posthog.com
```

### Verify Setup

After deploying, open your browser console on the live site and look for:
```
[PostHog] Web bridge initialized {host: "...", distinctId: "..."}
[PostHog] app_launched {...}
```

If you see warnings like `[PostHog] VITE_POSTHOG_API_KEY not configured`, the environment variables aren't set correctly in Vercel.

## Important Notes

- **VITE_ prefix is required** - Vite only exposes env vars with this prefix to the browser
- These are safe to be public (PostHog project API keys are meant for client-side use)
- Make sure to select all environments (Production, Preview, Development) when adding the variables
