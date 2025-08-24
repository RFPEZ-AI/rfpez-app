# Environment Variables Migration Guide

## Auth0 to Supabase Migration

### Variables to Remove
After the migration is complete, you can remove these Auth0 environment variables:

```bash
# Remove these from your .env files:
REACT_APP_AUTH0_DOMAIN=
REACT_APP_AUTH0_CLIENT_ID=
REACT_APP_AUTH0_AUDIENCE=
```

### Variables to Keep/Update
These Supabase variables should already be configured:

```bash
# Keep these (already configured):
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Supabase Authentication Setup

1. **Enable Email Authentication**
   - Go to Supabase Dashboard > Authentication > Settings
   - Enable "Email" provider
   - Configure email templates if needed

2. **Enable OAuth Providers (Optional)**
   - Go to Authentication > Providers
   - Enable Google OAuth:
     - Get credentials from Google Cloud Console
     - Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Enable GitHub OAuth:
     - Create OAuth app in GitHub
     - Add callback URL: `https://your-project.supabase.co/auth/v1/callback`

3. **Configure Site URL**
   - Set your production domain in Authentication > URL Configuration
   - Add redirect URLs for development and production

### Next Steps

1. Run the database migration script: `database/migration-supabase-auth.sql`
2. Test authentication with new Supabase auth system
3. Update any hardcoded Auth0 references in your code
4. Remove Auth0 environment variables once migration is complete

### Testing Checklist

- [ ] Email signup works
- [ ] Email login works
- [ ] User profile creation works
- [ ] Session persistence works
- [ ] Logout works
- [ ] OAuth providers work (if enabled)
- [ ] RLS policies work correctly
- [ ] User data migration successful
