# Gmail Add-on Script Updates

## Summary

Updated the Gmail add-on scripts to use email-based authentication instead of API keys.

## Changes Made

### 1. Authentication System (`Code.gs`)

- **Removed API key dependency**: Eliminated `API_KEY` constant and all references
- **Updated AuthManager class**:
  - Replaced `getToken()` with `isAuthenticated()` for email-based validation
  - Removed `refreshToken()` - replaced with `refreshAuthentication()`
  - Updated `getAuthHeaders()` to use email-based signature generation
  - Updated `createSignature()` to use `userEmail + timestamp + payload + SECRET_KEY`
- **Added validation function**: `validateAuthentication()` to check authentication before API calls

### 2. API Call Updates

- **Updated all API functions** to use new authentication headers:
  - `processPredefinedPrompt()`
  - `classifyEmail()`
  - `submitFeedback()`
  - `processFollowUpQuestion()`
  - `processSuggestedAction()`
  - `generateComposeEmailResponse()`
  - `fetchUserStats()`
  - `fetchFocusModeData()`
- **Removed direct API key usage**: Eliminated `Authorization: 'Bearer ' + API_KEY` and `X-API-Key: API_KEY` headers

### 3. New Authentication Flow

1. **Request headers**: `X-Gmail-User-Email`, `X-Gmail-Addon-ID`, `X-Request-Timestamp`, `X-Request-Signature`
2. **Signature generation**: HMAC-SHA256 using `userEmail + timestamp + payload + SECRET_KEY`
3. **Backend validation**: Email-based validation with subscription check

## Configuration Requirements

### Environment Variables

- `GMAIL_ADDON_ID`: Add-on identifier (default: 'triagemail-addon')
- `GMAIL_ADDON_SECRET`: Secret key for signature generation
- `NEXT_PUBLIC_APP_URL`: Application URL

### Script Properties

- `SECRET_KEY`: Should be stored in script properties for security

## Security Features

- ✅ Email-based authentication
- ✅ HMAC signature verification
- ✅ Timestamp-based replay attack prevention
- ✅ Subscription validation
- ✅ Rate limiting (100 requests/hour)
- ✅ No API key management required

## Testing

- Build completed successfully with no errors
- All authentication logic updated to use new email-based system
- Removed 15+ API key references throughout the codebase

## Migration Notes

- **No breaking changes** to Gmail add-on functionality
- **Improved security** with email-based authentication
- **Simplified deployment** - no API key management required
- **Better user experience** - direct email validation
