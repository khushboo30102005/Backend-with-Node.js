const formPost = document.getElementById('postForm');

formPost.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = document.getElementById('content').value;
  if (!content.trim()) return;
  await fetch('/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  document.getElementById('content').value = '';
  loadPosts();
});

async function loadPosts() {
  const response = await fetch('/posts');
  const posts = await response.json();
  const postsDiv = document.getElementById('posts');
  postsDiv.innerHTML = posts
    .map(
      (p) => `
        <div class="bg-white p-4 mb-2 rounded shadow">
          <p>${p.content}</p>
          <small class="text-gray-500">${new Date(p.createdAt).toLocaleString()}</small>
        </div>`,
    )
    .join('');
}

loadPosts();

// Large blue "Wait!"
console.log(
  '%cWait!',
  `
    font-size: 72px;
    font-weight: 900;
    color: #5865F2;
    text-shadow:
      -2px -2px 0 black,
       2px -2px 0 black,
      -2px  2px 0 black,
       2px  2px 0 black;
  `,
);

// White warning text
console.log(
  "%cIf someone told you to copy/paste something here, there's an 11/10 chance you're being scammed.",
  'font-size: 28px; color: white; font-family: monospace;',
);

// Red danger text
console.log(
  '%cPasting anything here could give attackers access to your account.',
  'font-size: 32px; font-weight: bold; color: red; font-family: monospace;',
);
