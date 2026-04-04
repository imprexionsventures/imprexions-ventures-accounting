# Deployment Guide - Imprexions Ventures Accounting App

## Build for Production

First, create an optimized production build:

```powershell
npm run build
```

This creates a `dist` folder with optimized static files ready to deploy.

## FREE Hosting Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the creator of Next.js and has built-in support for Vite/React apps.

1. **Sign up**: Go to [vercel.com](https://vercel.com) and sign up (free)
2. **Connect GitHub**:
   - Push your `accounting-app` folder to GitHub
   - Vercel will automatically detect it as a Vite project
3. **Deploy**: Click "Deploy" - it will automatically build and deploy

**Your app will be live at**: `https://your-app-name.vercel.app`

### Option 2: Netlify

1. **Sign up**: Go to [netlify.com](https://netlify.com) and sign up (free)
2. **Deploy**:
   - Drag and drop the `dist` folder into Netlify, OR
   - Connect your GitHub repo for automatic deployments
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

**Your app will be live at**: `https://your-app-name.netlify.app`

### Option 3: GitHub Pages

1. **Create GitHub repo**: Upload to GitHub
2. **Update vite.config.js**:
   ```javascript
   export default defineConfig({
     base: '/accounting-app/', // Replace with your repo name
     plugins: [react()],
   })
   ```
3. **Add deploy script** to package.json:
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```
4. **Install gh-pages**:
   ```powershell
   npm install --save-dev gh-pages
   ```
5. **Deploy**:
   ```powershell
   npm run build
   npm run deploy
   ```

## PAID Options (If you need more control)

- **AWS Amplify**: aws.amazon.com/amplify
- **Azure Static Web Apps**: azure.microsoft.com/services/app-service/static
- **Heroku**: heroku.com (though they're moving away from free tier)
- **DigitalOcean**: digitalocean.com
- **Linode**: linode.com

## Data Persistence

All user data is stored in the browser's localStorage. This means:
- ✅ Data persists between sessions
- ✅ Works offline
- ❌ Data is NOT synced across different devices/browsers

For cloud sync, consider adding a backend (Firebase, Supabase, etc.)

## Mobile Access

Once deployed:
1. Share the live URL with users
2. Users can access on desktop or mobile
3. App is fully responsive and touch-friendly
4. Users can add to home screen (PWA-like)

## Custom Domain

If you want a custom domain (e.g., accounting.yourcompany.com):

- **Vercel**: Add domain in project settings
- **Netlify**: Add domain in Domain settings
- **GitHub Pages**: Update `CNAME` file in repo

## Troubleshooting

**App not working after deploy?**
- Check browser console for errors (F12 → Console)
- Clear browser cache and hard refresh (Ctrl+Shift+R)
- Ensure all API calls use relative paths

**Data not persisting?**
- Data only persists in the same browser/device
- Try incognito mode to test
- Check if localStorage is enabled

**Performance issues?**
- The `dist` folder has already been optimized
- Consider adding CDN (Cloudflare) for faster global access

## Updating the App

After deployment:
1. Make changes locally
2. Test with `npm run dev`
3. Run `npm run build`
4. Deploy (process depends on your platform):
   - **Vercel/Netlify**: Git push will auto-deploy
   - **GitHub Pages**: Run `npm run deploy`
   - **Manual**: re-upload `dist` folder

## Security Notes

- App data is stored locally in browser (safe for private use)
- No data is sent to external servers
- For production with multiple users, consider:
  - Adding user authentication
  - Cloud backend for data sync
  - Encrypted data transmission
