// LOGIN USING GSI (GOOGLE IDENTITY SERVICES) 

// For HTML
/* function googleLoginCallback(response){
  console.log(response)
} */

// For JS
const clientID =
  'YOUR_CLIENT_ID.apps.googleusercontent.com';

window.onload = function () {
  google.accounts.id.initialize({
    client_id: clientID,
    callback: async (response) => {
      console.log(response)
      if (response.credential) {
        await loginUserWithIdToken(response.credential);
      } else {
        console.error('Failed to obtain ID token.');
      }
    },
  });
  google.accounts.id.prompt();

  google.accounts.id.renderButton(document.getElementById('google-login'), {
    theme: 'filled_blue',
    shape: 'pill',
  });
};

async function loginUserWithIdToken(idToken) {
  const baseURL = 'http://localhost:4000';
  const response = await fetch(`${baseURL}/auth/google`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });
  if (response.status === 200) {
    location.href = '/';
  }
}
