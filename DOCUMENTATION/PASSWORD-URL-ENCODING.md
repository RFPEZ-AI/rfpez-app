# URL Encoding Special Characters in Database Passwords

## 🚨 The Problem

If your database password contains special characters like `@`, `#`, `:`, `/`, `?`, `&`, etc., they will break the connection string because these characters have special meaning in URLs.

## ✅ The Solution: URL Encoding

You need to **URL-encode** (also called percent-encoding) your password.

### Common Special Characters and Their Encoded Values:

| Character | URL Encoded | Example Password | Encoded Password |
|-----------|-------------|------------------|------------------|
| `@` | `%40` | `pass@word` | `pass%40word` |
| `#` | `%23` | `pass#word` | `pass%23word` |
| `$` | `%24` | `pass$word` | `pass%24word` |
| `%` | `%25` | `pass%word` | `pass%25word` |
| `&` | `%26` | `pass&word` | `pass%26word` |
| `+` | `%2B` | `pass+word` | `pass%2Bword` |
| `:` | `%3A` | `pass:word` | `pass%3Aword` |
| `/` | `%2F` | `pass/word` | `pass%2Fword` |
| `?` | `%3F` | `pass?word` | `pass%3Fword` |
| `=` | `%3D` | `pass=word` | `pass%3Dword` |
| Space | `%20` | `pass word` | `pass%20word` |

## 🔧 How to URL Encode Your Password

### Option 1: Online Tool (Easiest)
1. Go to: https://www.urlencoder.org/
2. Paste your password
3. Click "Encode"
4. Copy the encoded result

### Option 2: JavaScript (Node.js)
```javascript
// In Node.js or browser console
const password = "myP@ssw0rd!";
const encodedPassword = encodeURIComponent(password);
console.log(encodedPassword);
// Output: myP%40ssw0rd!
```

### Option 3: Python
```python
from urllib.parse import quote
password = "myP@ssw0rd!"
encoded_password = quote(password, safe='')
print(encoded_password)
# Output: myP%40ssw0rd%21
```

### Option 4: Command Line (bash)
```bash
# Using jq (if installed)
echo -n "myP@ssw0rd!" | jq -sRr @uri

# Using Python one-liner
python3 -c "import urllib.parse; print(urllib.parse.quote(input()))"
# Then type your password and press Enter
```

## 📝 Example with Encoded Password

### Original Password: `myP@ss#123`

### Step 1: Encode Special Characters
- `@` → `%40`
- `#` → `%23`
- Encoded: `myP%40ss%23123`

### Step 2: Build Connection String
```
postgresql://postgres:myP%40ss%23123@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres
```

### Step 3: Update GitHub Secret
Put this **entire encoded string** in your `SUPABASE_DB_URL` secret.

## 🧪 Quick Test Script

You can test encoding with this Node.js script:

```javascript
// test-encode-password.js
const password = process.argv[2] || "your-password-here";
const encoded = encodeURIComponent(password);

console.log("Original password:", password);
console.log("Encoded password:", encoded);
console.log("\nFull connection string:");
console.log(`postgresql://postgres:${encoded}@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres`);
```

Run it:
```bash
node test-encode-password.js "myP@ss#123"
```

## ⚠️ Important Notes

1. **Only encode the PASSWORD part**, not the entire connection string
2. **Don't encode twice** - if you're pasting into GitHub Secrets, paste the already-encoded version
3. **Test locally first** with the encoded password before updating GitHub Secrets

## ✅ Correct Format Examples

```bash
# Password without special characters (no encoding needed)
postgresql://postgres:simplepassword@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres

# Password with @ symbol
postgresql://postgres:user%40pass@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres

# Password with multiple special characters: P@ss#Word$123
postgresql://postgres:P%40ss%23Word%24123@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres
```

## 🚨 Common Mistakes

❌ **Wrong**: Using unencoded password with `@`
```
postgresql://postgres:pass@word@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres
```
This breaks because it looks like: `user:pass` at host `word@db...` (wrong!)

✅ **Correct**: Using encoded password
```
postgresql://postgres:pass%40word@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres
```

❌ **Wrong**: Encoding the entire URL
```
postgresql%3A%2F%2Fpostgres%3Apass%40word%40db.jxlutaztoukwbbgtoulc...
```

✅ **Correct**: Only encoding the password portion
```
postgresql://postgres:pass%40word@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres
```

## 🔒 Security Note

When you update the GitHub Secret with the encoded password:
- GitHub will mask it automatically
- The encoding doesn't make it less secure
- It just makes it parseable as a URL component
