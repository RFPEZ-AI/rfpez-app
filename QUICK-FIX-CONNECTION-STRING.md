# Quick Fix: Get Your Direct Database Connection String

## 🎯 Simple 3-Step Process

### Step 1: Click "Connect" Button
1. Go to: https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc
2. Look for the **"Connect"** button at the top of the page
3. Click it to open the connection modal

### Step 2: Get Direct Connection (NOT Pooler)
In the connection modal:
- **UNCHECK** the box that says "Use connection pooling" (if it's checked)
- Look for a connection string starting with: `postgresql://postgres:`
- Copy that entire string

### Step 3: Update GitHub Secret
1. Go to: https://github.com/markesphere/rfpez-app/settings/secrets/actions/SUPABASE_DB_URL
2. Click "Update"
3. Paste the connection string you copied
4. Make sure to replace `[YOUR-PASSWORD]` with your actual database password
5. Click "Update secret"

---

## 🔧 Alternative: Build It Manually

If you can't find the connection string in the UI, you can build it manually:

### Find Your Database Host:
1. Go to: https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc/settings/database
2. Look for "Host" in the connection info
3. It should be: `db.jxlutaztoukwbbgtoulc.supabase.co`

### Find Your Database Password:
1. On the same settings page, look for "Database password"
2. You may need to reset it if you don't know it
3. Click "Reset database password" if needed

### Build the Connection String:
Format:
```
postgresql://postgres:YOUR_PASSWORD@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres
```

Replace `YOUR_PASSWORD` with your actual database password.

---

## ✅ What the Final String Should Look Like

```
postgresql://postgres:MySecretPassword123@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres
```

**Key things to verify:**
- ✅ Starts with `postgresql://postgres:` (NOT `postgres.projectref:`)
- ✅ Host is `db.jxlutaztoukwbbgtoulc.supabase.co` (NOT `pooler.supabase.com`)
- ✅ Port is `5432`
- ✅ Contains your actual password (not placeholder text)

---

## 🚨 Common Mistakes to Avoid

❌ **DON'T USE** the pooler connection string:
```
postgresql://postgres.jxlutaztoukwbbgtoulc:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

❌ **DON'T CHECK** "Use connection pooling" checkbox

❌ **DON'T FORGET** to replace `[YOUR-PASSWORD]` with actual password

---

## 🧪 Test Your Connection String Locally (Optional)

You can test if your connection string works using your local Supabase CLI:

```bash
supabase db push --db-url "postgresql://postgres:YOUR_PASSWORD@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres" --dry-run
```

If it connects successfully, you know the string is correct!

---

## 📞 Need Help?

If you're still having trouble finding the connection string:
1. Take a screenshot of your Supabase dashboard
2. Or describe what you see when you click the "Connect" button
3. I can help you locate the correct information
