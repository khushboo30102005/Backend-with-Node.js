const client_id = 'YOUR CLIENT_ID';
const client_secret = 'YOUR CLIENT_SECRET';
const redirect_uri = 'YOUR REDIRECT_URI';
const authURI = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${client_id}&scope=openid email profile&redirect_uri=${redirect_uri}`;

const button = document.querySelector('button');
button.addEventListener('click', () => {
  window.open(authURI, 'authWindow', 'width=420,height=520');
  console.log('running localhost:5500');
});

window.addEventListener('message', ({ data }) => {
  console.log(data);
  fetchIDToken(data.code);
});

async function fetchIDToken(code) {
  const payLoad = `code=${code}&client_id=${client_id}&client_secret=${client_secret}&redirect_uri=${redirect_uri}&grant_type=authorization_code`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payLoad,
  });
  const data = await response.json();
  if (data.error) {
    console.log('Error Occurred');
    console.log(data);
    return;
  }
  const userToken = data.id_token.split('.')[1];
  const userData = JSON.parse(atob(userToken));
  console.log(userData);
}
