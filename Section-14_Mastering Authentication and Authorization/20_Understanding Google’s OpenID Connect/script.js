const picture = document.querySelector('#image');
const username = document.querySelector('#name');
const email = document.querySelector('#email');
const logout = document.querySelector('#logout');
const baseURL = 'http://localhost:4000';

const response = await fetch(`${baseURL}/profile`, {
  credentials: 'include',
});
if (response.status === 401) {
  location.href = './login';
}
const result = await response.json();
console.log(result);
if (result) {
  console.log(result.user);
  picture.src = result.user.picture;
  username.innerText = result.user.name;
  email.textContent = result.user.email;
}

logout.addEventListener('click', async () => {
  const response = await fetch(`${baseURL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (response.status === 204) {
    location.href = './login';
  }
});
