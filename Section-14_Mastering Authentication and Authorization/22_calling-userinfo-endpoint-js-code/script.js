const accessToken = 'your access_token'; // Replace with the actual access token obtained from the authentication process

const response = await fetch(
  `https://openidconnect.googleapis.com/v1/userinfo?access_token=${accessToken}`,
  // {
  //   headers: {
  //     Authorization: `Bearer ${accessToken}`,
  //   },
  // }
);

const userData = await response.json();

console.log(userData);
