function showGreetingFromHash() {
  const name = decodeURIComponent(location.hash.slice(1));
  document.getElementById("output").innerHTML = `Hello, ${name}!`;  // name must be : DOMPurify.sanitize(name) to prevent XSS.
}

window.addEventListener("hashchange", showGreetingFromHash);
window.addEventListener("DOMContentLoaded", showGreetingFromHash);
