const idToken = new URLSearchParams(location.hash.substring(1)).get('id_token');
if (idToken) {
  console.log(idToken);
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
    window.opener.postMessage({ message: 'success' });
    window.close();
  }
} else {
  window.opener.postMessage({ message: 'failure' });
  window.close();
}
 