# Auth Form Polish

**Bucket:** Finish partial features

## Goal
Clean up the login/register flows: remove stub `console.log` and `alert` calls, surface real validation errors from the backend, and confirm token handling is sane.

## Why
- LoginForm and RegisterForm have `console.log` in submit handlers — easy to ship by accident, and they imply the work was paused mid-stream.
- `StockAutocomplete` has an `alert(...)` stub that should be a proper toast or inline message.
- First impression of the app is the auth screen; rough edges here read as "this isn't done."

## Scope
**In:** Strip stubs, wire backend validation errors into form fields, password rules visible to user, token refresh behavior verified, "remember me" if trivial.

**Out:** Social login / SSO. Password reset email (separate plan if needed).

## Approach
1. Search for `console.log` and `alert(` under `src/components/auth/` and `StockAutocomplete`; replace each with the correct UX (toast, field error, or removal).
2. On 400 from register/login, map `{field: [msg]}` from DRF into per-field errors using react-hook-form (or whatever's in use).
3. Confirm `RegisterForm` validates password rules client-side and matches backend rules — surface the rules near the input.
4. Verify JWT refresh on 401 actually swaps tokens; add an interceptor if missing.
5. Manual test: login, register, intentionally wrong password, expired token.

## Key files
- `frontend/quantifex_fe/src/components/auth/LoginForm.tsx`
- `frontend/quantifex_fe/src/components/auth/RegisterForm.tsx`
- `frontend/quantifex_fe/src/components/StockAutocomplete.tsx`
- `frontend/quantifex_fe/src/api/client.ts` (or equivalent — JWT interceptor)

## Acceptance
- No `console.log` or `alert(` in shipped auth code.
- Backend validation errors render under their fields.
- Token refresh works after a deliberately expired access token.
