# Understanding Google's OpenID Connect

Login With Google Button Sends an HTTPS GET authentication request to Google with the appropriate URI parameters. The base URI is https://accounts.google.com/o/oauth2/v2/auth.

For a basic request, specify the following parameters:

1. response_type=code
2. client_id=YOUR_CLIENT_ID
3. scope=openid%20email%20profile
4. redirect_uri=YOUR_REDIRECT_URI
5. grant_type=authorization_code

After clicking this button, the user is redirected to the Google sign-in page.. After successful login, Google will redirect us back to the specified redirect_uri with an authorization code.

A successful response to this request contains the following fields in a JSON array:

```json
{
  "access_token": "ACCESS_TOKEN",
  "expires_in": 3599,
  "id_token": "ID_TOKEN",
  "scope": "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
  "token_type": "Bearer"
}
```

split the id_token into three parts using the period (.) as a delimiter. The first part is the header, the second part is the payload, and the third part is the signature. The payload contains user information in a JSON format.

The payload typically contains the following fields:

```json
{
  "iss": "https://accounts.google.com",
  "sub": "USER_ID",
  "azp": "YOUR_CLIENT_ID",
  "aud": "YOUR_CLIENT_ID",
  "iat": 1516239022,
  "exp": 1516242622,
  "email": "USER_EMAIL",
  "email_verified": true,
  "name": "USER_NAME",
  "picture": "USER_PROFILE_PICTURE_URL",
  "given_name": "USER_GIVEN_NAME",
  "family_name": "USER_FAMILY_NAME",
  "at_hash": "ACCESS_TOKEN_HASH"
}
```
