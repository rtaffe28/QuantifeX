# Structured Logging

**Bucket:** Foundation & quality

## Goal
Configure Django logging to emit structured (JSON) records with request and user context, and replace ad-hoc `print` / silent `pass` patterns with proper logger calls.

## Why
- Today there's no visibility into what fails. Silent excepts make debugging by guesswork.
- A JSON formatter is the minimum needed to grep production logs by `user_id`, `request_id`, or `endpoint`.
- Pairs with [[error-handling-cleanup]] — that plan moves errors into structured responses; this one moves them into structured logs.

## Scope
**In:** JSON-formatter via `python-json-logger` (or similar); `RequestIDMiddleware` that attaches a UUID per request and into the logger context; convention for module-level loggers; documentation of log levels.

**Out:** Shipping logs anywhere (Loki, Datadog) — this is the local foundation that makes shipping easy later.

## Approach
1. Add `python-json-logger` to requirements.
2. Configure `LOGGING` in settings: JSON formatter on the root, INFO default, DEBUG for `quantifex.*`.
3. Add `RequestIDMiddleware` (generate or read `X-Request-ID`); thread-local stash so the formatter can pull it.
4. Replace `print(...)` and `except: pass` instances with `logger.warning(..., extra={...})`.
5. Document the log conventions in `backend/README.md` (when to use info/warning/error, what to include in `extra`).

## Key files
- `backend/backend/settings.py`, `backend/core/middleware.py` (new), every view with silent excepts.

## Acceptance
- `python manage.py runserver` emits JSON log lines.
- A request ID is present on every request log line.
- Repo grep shows zero `print(` and zero `except: pass` in app code.
