# 🔐 Google OAuth Setup Guide for SASYAM

## ❌ Fix for Error 401: invalid_client

The error `Error 401: invalid_client` means the Google Client ID is missing or invalid. Follow these steps to set up proper Google OAuth.

## 📋 Step-by-Step Setup

### 1. **Create Google Cloud Project**
   - Go to: https://console.cloud.google.com/
   - Sign in with your Google account
   - Click **"Select a Project"** → **"NEW PROJECT"**
   - Enter name: `SASYAM`
   - Click **CREATE**
   - Wait for project to be created (2-3 minutes)

### 2. **Enable Google Identity Services API**
   - In Google Cloud Console, go to: **APIs & Services** → **Library**
   - Search for: `Google Identity Services`
   - Click on result
   - Click **ENABLE**

### 3. **Create OAuth 2.0 Credentials**
   - Go to: **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS**
   - Select **OAuth client ID**
   - Choose: **Web application**
   - Enter name: `SASYAM Yield Predictor`
   - Under **Authorized JavaScript origins**, add:
     ```
     http://localhost:8080
     http://localhost:3000
     ```
   - Click **CREATE**

### 4. **Copy Your Client ID**
   - In the Credentials popup, copy the **Client ID** (looks like: `123456789-abcdefghij...apps.googleusercontent.com`)
   - This is what you need!

### 5. **Use Client ID in SASYAM**

#### **Option A: Enter When Starting App**
1. Open application in browser: `http://localhost:8080`
2. A popup will ask: **"Enter your Google OAuth Client ID"**
3. Paste your Client ID
4. Click OK
5. The ID will be saved for future sessions

#### **Option B: Configure Manually**
1. Open `web/app.js` in text editor
2. Find line ~15:
   ```javascript
   const GOOGLE_CLIENT_ID = localStorage.getItem('googleClientId') || 
     prompt('Enter your Google OAuth Client ID...') || 
     null;
   ```
3. Replace `null` with your Client ID:
   ```javascript
   const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
   ```
4. Save file and refresh browser

## ✅ Verify Setup Works

1. Start app: `start.bat`
2. Open: `http://localhost:8080`
3. Click **"Continue with Google"**
4. You should see Google login screen
5. Sign in with your Google account
6. You should be redirected to create SASYAM profile

## 🆘 Troubleshooting

### **Still Getting Error 401?**
- ✅ Check Client ID is correct (copy-paste again)
- ✅ Ensure `http://localhost:8080` is in Authorized JavaScript origins
- ✅ Wait 2 minutes for Google to apply changes
- ✅ Clear browser cache: `Ctrl+Shift+Delete`
- ✅ Open in **incognito/private window**

### **"Google Sign-In library not loaded"?**
- ✅ Check internet connection (Google script must load from CDN)
- ✅ Check browser console: `F12` → `Console` tab
- ✅ Refresh page

### **Getting Different Error?**
- ⚠️ Check browser console: `F12` → `Console` tab
- 📝 Copy full error message
- 🔧 Share error in issue tracker

## 🔒 Security Notes

- ⚠️ **Never** share your Client ID with anyone (it's public anyway)
- ⚠️ **Never** commit your credentials to GitHub
- ✅ For production, use environment variables instead of hardcoding
- ✅ Consider using Google Sign-In with server-side validation

## 🚀 For Production Deployment

When deploying to production:

1. Add your production domain to Authorized JavaScript origins:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```

2. Update Client ID in environment:
   ```bash
   export GOOGLE_CLIENT_ID=your_production_client_id
   ```

3. Or use secrets file:
   ```toml
   # production.toml
   GOOGLE_CLIENT_ID = "your_production_client_id"
   ```

4. Load in app.js:
   ```javascript
   const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 
     fetch('/config/google-client-id').then(r => r.text());
   ```

## 📚 Useful Links

- Google Cloud Console: https://console.cloud.google.com/
- Google Identity Documentation: https://developers.google.com/identity/gsi/web
- OAuth 2.0 Guide: https://developers.google.com/identity/protocols/oauth2
- Support & Community: https://stackoverflow.com/questions/tagged/google-signin

## ✨ What Happens After OAuth?

1. ✅ User authenticates with Google
2. ✅ App receives JWT token with user info
3. ✅ User profile is created in SASYAM
4. ✅ Unique SASYAM ID is generated
5. ✅ User can access yield calculator
6. ✅ Profile is saved locally for future logins
7. ✅ User can logout and login again seamlessly

## 🎯 Next Steps (Optional)

- [ ] Set up backend profile storage (database)
- [ ] Implement profile photo upload
- [ ] Add farm location on Google Maps
- [ ] Sync profiles across devices
- [ ] Send weekly yield predictions via email
- [ ] Add social features (share results)

---

**Need help?** Check the OAUTH_PROFILE_UPDATE.md for more details about profile features!
