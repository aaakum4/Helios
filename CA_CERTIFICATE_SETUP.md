# PostHog TLS Configuration

If you're behind a corporate proxy or firewall that intercepts HTTPS connections, you'll see errors like:

```
Error: self signed certificate in certificate chain
code: 'SELF_SIGNED_CERT_IN_CHAIN'
```

## Quick Solution (Development Only - SAFE)

The simplest approach for development is already configured:

1. In your `.env` file, set:
   ```env
   HELIOS_DEV_MODE=true
   ```

2. Restart the app:
   ```bash
   npm start
   ```

**Why this is safe:**
- ✅ Only works in **unpackaged development builds** (when you run `npm start`)
- ✅ Automatically **disabled in production** builds (when you package the app)
- ✅ Users who download your app are **never affected**
- ✅ Protected by `app.isPackaged` check in the code

This setting allows your local development environment to work with corporate proxies while keeping production builds fully secure.

---

## Alternative: Trust Corporate CA Certificate

For a more secure development setup, configure Node.js to trust your organization's CA certificate:

### Step 1: Obtain Your Corporate CA Certificate

**Option A: Export from Browser (easiest)**

1. In Chrome/Edge:
   - Visit any HTTPS site (e.g., https://google.com)
   - Click the lock icon in address bar → "Connection is secure" → "Certificate is valid"
   - Click the certificate window → "Details" tab
   - Select the **root certificate** (topmost in the chain)
   - Export as PEM format → Save as `corporate-ca.pem`

2. In Firefox:
   - Settings → Privacy & Security → Certificates → View Certificates
   - Authorities tab → Find your organization's root CA
   - Export → Save as `corporate-ca.pem`

**Option B: Ask Your IT Department**

Contact your IT/security team and request:
- "Root CA certificate in PEM format for HTTPS inspection"

**Option C: Extract from System (macOS)**

```bash
# List all certificates
security find-certificate -a -p /Library/Keychains/System.keychain > all-certs.pem

# Or export a specific certificate by name:
security find-certificate -c "YourCompanyName Root CA" -p > corporate-ca.pem
```

### Step 2: Configure Node.js to Trust the Certificate

Add this line to your `.env` file:

```env
NODE_EXTRA_CA_CERTS=/absolute/path/to/corporate-ca.pem
```

**Example:**
```env
NODE_EXTRA_CA_CERTS=/Users/yourname/Documents/certificates/corporate-ca.pem
```

### Step 3: Verify Setup

1. Restart your app:
   ```bash
   npm start
   ```

2. PostHog events should now be captured without TLS errors

3. Check the Electron console - you should see no certificate errors

### Troubleshooting

**Error persists after adding NODE_EXTRA_CA_CERTS?**

1. Verify the file path is absolute (not relative)
2. Check the file exists: `ls -la /path/to/corporate-ca.pem`
3. Ensure the file is in PEM format (should start with `-----BEGIN CERTIFICATE-----`)
4. Try restarting your terminal/IDE to reload environment variables

**Multiple certificates needed?**

Create a bundle file containing all certificates:

```bash
cat root-ca.pem intermediate-ca.pem > ca-bundle.pem
```

Then set:
```env
NODE_EXTRA_CA_CERTS=/path/to/ca-bundle.pem
```

**For npm/package installation issues:**

```bash
# Temporary fix for npm install
npm config set cafile /path/to/corporate-ca.pem

# Or set globally
export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca.pem
npm install
```

## Security Note

✅ **Secure**: Using `NODE_EXTRA_CA_CERTS` to trust your organization's legitimate CA certificate  
❌ **Insecure**: Setting `NODE_TLS_REJECT_UNAUTHORIZED=0` (disables all certificate validation)

The previous temporary fix has been removed. Please configure the proper CA certificate.
