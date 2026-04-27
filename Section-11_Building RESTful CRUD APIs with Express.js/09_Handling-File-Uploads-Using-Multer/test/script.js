

const form = document.querySelector('form');
const p = document.querySelector('p');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  formData.append('parentDirId', 'kjkdfnerriw')
  formData.append('name', 'khu')
  formData.append('age', '22')
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `http://localhost:4000/upload`, true);
  xhr.responseType = 'json'
  let totalProgress = 0;
  xhr.upload.addEventListener('progress', (event) => {
    totalProgress = (event.loaded / event.total) * 100;
    p.innerText = `Progress: ${totalProgress.toFixed(2)}%`;
  });
  xhr.addEventListener('load', () => {
    console.log(xhr.response);
  });
  xhr.send(formData);
});
