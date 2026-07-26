const code = new URLSearchParams(location.search).get('code'); // extract authorization code from request
if (code) {
  window.opener.postMessage({ code });
  window.close();
}
