import { useEffect, useState } from 'react';

function App() {
  async function getDirectoryItems() {
    const response = await fetch('http://192.168.31.13/');
    const data = await response.json();
    setDirectoryItems(data);
  }
  const [DirectoryItems, setDirectoryItems] = useState([]);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    getDirectoryItems();
  }, []);

  async function handleChange(e) {
    const file = e.target.files[0];
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://192.168.31.13/', true);
    xhr.setRequestHeader('filename', file.name);
    let totalProgress = 0;
    xhr.upload.addEventListener('progress', (event) => {
      totalProgress = (event.loaded / event.total) * 100;
      setProgress(totalProgress.toFixed(2) + '%');
      // if (totalProgress === 100) getDirectoryItems();
    });
    xhr.addEventListener('load', () => {
      console.log(xhr.response);
      getDirectoryItems();
    });
    xhr.send(file);
  }

  async function handleDelete(filename) {
    const response = await fetch('http://192.168.31.13/', {
      method: 'DELETE',
      body: filename,
    });
    const data = await response.text();
    console.log(data);
    // getDirectoryItems();
  }
  return (
    <>
      <h1>My Files</h1>
      <div>
        <input type="file" onChange={handleChange} />
        <div>{progress}</div>
        {DirectoryItems.map((item, idx) => (
          <p key={idx}>
            {item} <a href={`http://192.168.31.13/${item}?action=open`}>Open</a>{' '}
            <a href={`http://192.168.31.13/${item}?action=download`}>
              Download
            </a>
            <button
              onClick={() => {
                handleDelete(item);
              }}
            >
              Delete
            </button>
            <button>Rename</button>
          </p>
        ))}
      </div>
    </>
  );
}

export default App;
