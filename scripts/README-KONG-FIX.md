How to apply the `kong.yml.fixed` declarative config to Supabase Kong (local)

Overview

Kong runs in DB-less (declarative) mode in the Supabase local stack, so Admin-API changes are not persistent. To change the runtime config you must provide a correct `kong.yml` to the Kong container at startup with correct ownership/permissions.

This repo includes a helper script to copy `temp/kong.yml.fixed` into the running Kong container and restart Kong.

Usage (Bash)

1. Start Supabase normally:

```bash
supabase start
```

2. Run the helper (from project root):

```bash
./scripts/supabase-kong-fix.sh
```

The script will copy `./temp/kong.yml.fixed` into the `supabase_kong_rfpez-app-local` container, chown it to `kong:root` and restart the container. After it finishes, check the Kong Admin API or run the smoke test.

Usage (PowerShell)

```powershell
.
scripts\supabase-kong-fix.ps1
```

Notes

- The script is intentionally conservative and will timeout if the container doesn't appear.
- If you want the script to target a different container name or path, pass them as arguments.
- If Kong continues to fail to start with the new config, inspect `docker logs -f supabase_kong_rfpez-app-local`.

Fallback

If applying the fixed file still fails due to Windows path/ownership issues, the long-term fix is to ensure the `kong.yml` is present inside the Supabase runtime image at build-time or modify the Supabase start sequence to copy the file as root into the container before Kong's entrypoint runs. I can help implement that if you'd like.
