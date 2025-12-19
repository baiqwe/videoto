# Worker Cookies for YouTube Bot Bypass

This file contains browser cookies needed to bypass YouTube's bot detection.

## How to Update

1. Install browser extension: [Get cookies.txt](https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid)
2. Visit youtube.com while logged in
3. Click extension and export cookies
4. Save as `worker/cookies.txt`
5. Commit and push to trigger Docker rebuild

## Security Note

⚠️ **DO NOT share this file publicly**
- Contains your YouTube session
- Can be used to access your account
- Only commit to private repositories
- Rotate cookies if exposed

## Alternative: Environment Variable (Future)

For better security, consider using Zeabur's secret file mounting instead of committing cookies to Git.
