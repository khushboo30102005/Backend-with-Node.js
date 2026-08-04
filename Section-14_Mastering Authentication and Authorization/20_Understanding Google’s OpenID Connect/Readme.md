# Understanding Google's OpenID Connect

Login With Google Button Sends an HTTPS GET authentication request to Google with the appropriate URI parameters. The base URI is https://accounts.google.com/o/oauth2/v2/auth.

For a basic request, specify the following parameters:

1. response_type=code
2. client_id=YOUR_CLIENT_ID
3. scope=openid%20email%20profile
4. redirect_uri=YOUR_REDIRECT_URI

```js
GET https://accounts.google.com/o/oauth2/v2/auth
    ?response_type=code
    &client_id=YOUR_CLIENT_ID
    &scope=openid%20email%20profile
    &redirect_uri=YOUR_REDIRECT_URI
```

After clicking this button, the user is redirected to the Google sign-in page.. After successful login, Google will redirect us back to the specified redirect_uri with an authorization code.

```js
GET /auth/google/callback?code=AUTHORIZATION_CODE
```

### Exchanging the Authorization Code for Tokens

The authorization code does not contain user information. Instead, your backend exchanges it for tokens by sending an HTTPS POST request to Google's token endpoint.

```js
POST https://oauth2.googleapis.com/token
```

- Request body:

```js
client_id = YOUR_CLIENT_ID;
client_secret = YOUR_CLIENT_SECRET;
code = AUTHORIZATION_CODE;
redirect_uri = YOUR_REDIRECT_URI;
grant_type = authorization_code;
```

- If the request is successful, Google responds with a JSON object similar to the following:

```json
{
  "access_token": "ACCESS_TOKEN",
  "expires_in": 3599,
  "id_token": "ID_TOKEN",
  "scope": "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
  "token_type": "Bearer"
}
```

- The access_token is used to access Google APIs, while the id_token contains information about the authenticated user.

### Understanding the ID Token

- The id_token is a JSON Web Token (JWT).

- It consists of three Base64URL-encoded parts separated by periods (.):
```js
HEADER.PAYLOAD.SIGNATURE
```

- Header – Contains metadata about the token, such as the signing algorithm.
- Payload – Contains claims (information) about the authenticated user.
- Signature – Allows verification that the token was issued by Google and has not been modified.

The payload typically contains claims similar to the following:
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

**Note**: Although the payload is Base64URL-encoded and can be decoded, your backend should not trust its contents without verifying the token's signature. Libraries such as google-auth-library perform this verification and validate claims such as the issuer (iss), audience (aud), and expiration time (exp).