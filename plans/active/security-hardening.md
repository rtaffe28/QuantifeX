# Security Hardening

**Bucket:** Foundation & quality

## Goal
Remove insecure defaults from Django settings so the app can't accidentally boot in an unsafe state when an env var is missing.

## Why
Two specific gaps spotted in `backend/settings.py`:
- `SECRET_KEY` falls back to a hardcoded default if env is missing — silent insecurity.
- `ALLOWED_HOSTS` defaults to `'*'` if env is missing — host header attacks open.

These won't bite in local dev but will be the first thing flagged the moment this leaves a laptop.

## Scope
**In:** Required-env-var enforcement, `DEBUG=False` defaults, CSRF/CORS audit, JWT cookie/storage review.

**Out:** Secrets manager integration, full pentest, dependency CVE sweep (separate plan if needed).

## Approach
1. `SECRET_KEY`: read from env, raise `ImproperlyConfigured` if missing — no fallback.
2. `ALLOWED_HOSTS`: parse from env, default to `['localhost', '127.0.0.1']` for dev only; fail in prod if unset.
3. `DEBUG`: default `False`, env-overridable to `True` for dev.
4. Add `.env.example` with all required keys documented.
5. Audit CORS settings, CSRF trusted origins, JWT lifetimes (currently 30m/1d — sane).
6. Confirm no committed secrets via `git log -p settings.py`.

## Key files
- `backend/backend/settings.py`, `backend/.env.example`, `README.md`

## Acceptance
- App refuses to boot in non-DEBUG mode without `SECRET_KEY` and `ALLOWED_HOSTS` set.
- `.env.example` lists every required var with comments.
- README setup section references `.env.example`.
