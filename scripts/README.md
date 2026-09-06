# scripts/

Monorepo utility, migration, and development testing scripts for Squibl.

## Contents

| File | Description | Status |
|---|---|---|
| `push_initial.js` | Modular git commit/push batching script used during initial codebase setup | ℹ️ Dev utility |
| `fix_theme.js` | Utility script for theme property standardizations across landing components | ℹ️ Dev utility |
| `test_auth_gate.js` | HTTP client test script for verifying authentication cookies and middleware route protection | 🧪 Test script |

## Usage

Scripts in this folder are **utility & migration tools**. Before running any script:

1. Check the status in the table above.
2. Ensure required environment variables (e.g. `.env.local` or Supabase keys) are populated.
3. Test against a staging/dev instance before running against production services.

## Adding New Scripts

- Name format: `<verb>_<purpose>.<ext>` (e.g., `backfill_avatars.py`)
- Include header documentation specifying purpose and prerequisites.
- Update the index table above.
