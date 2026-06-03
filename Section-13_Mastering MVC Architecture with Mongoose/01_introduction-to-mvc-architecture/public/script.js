const deleteBtn = document.querySelectorAll('.delete-btn');

deleteBtn.forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    console.log('clicked', id);
    const response = await fetch(`http://localhost:4000/todos/${id}`, {
      method: 'DELETE',
    });
    await response.json();
    window.location.reload();
  });
});
