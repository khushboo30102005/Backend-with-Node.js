const button = document.querySelector('button');

const client_id ='YOUR_CLIENT_ID.apps.googleusercontent.com';
const client_secret = 'YOUR_CLIENT_SECRET';
const redirectUri = 'your_redirect_uri'; 
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=id_token&nonce=123khushboo&scope=openid%20email%20profile&client_id=${client_id}&redirect_uri=${redirectUri}`;

button.addEventListener('click', async () => {
  window.open(authUrl, 'new Window', 'width=520,height=620');
});
/* button.addEventListener('click', async () => {
  window.open(
    'http://localhost:4000/auth/google',
    'authWindow',
    'width=520,height=620',
  );
}); */

window.addEventListener('message', async ({ data }) => {
  if (data.message === 'success') {
    location.href = '/';
  } else {
    console.log('first');
    const message = document.createElement('h1');
    message.innerText = 'Something went wrong.';
    document.body.appendChild(message);
    setTimeout(() => {
      message.remove();
    }, 2000);
  }
});
