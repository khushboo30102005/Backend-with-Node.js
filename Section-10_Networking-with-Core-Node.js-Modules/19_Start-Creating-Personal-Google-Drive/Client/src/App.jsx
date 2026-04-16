import { useEffect, useState } from 'react';

function App() {
  const URL = 'http://[2409:40d4:10ca:2c1c:2aec:6714:3fc3:ff88]/';
  async function getDirectoryItems() {
    const response = await fetch(URL);
    const data = await response.json();
    setDirectoryItems(data);
  }
  const [DirectoryItems, setDirectoryItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [newFilename, setNewFilename] = useState('');
  useEffect(() => {
    getDirectoryItems();
  }, []);

  async function uploadFile(e) {
    const file = e.target.files[0];
    const xhr = new XMLHttpRequest();
    xhr.open('POST', URL, true);
    xhr.setRequestHeader('filename', file.name);
    let totalProgress = 0;
    xhr.upload.addEventListener('progress', (event) => {
      totalProgress = (event.loaded / event.total) * 100;
      setProgress(totalProgress.toFixed(2) + '%');
      // if (totalProgress === 100) getDirectoryItems();
    });
    xhr.addEventListener('load', () => {
      console.log(xhr.response);
      setProgress('Upload complete');
      getDirectoryItems();
    });
    xhr.send(file);
  }

  async function handleDelete(filename) {
    const response = await fetch(URL, {
      method: 'DELETE',
      body: filename,
    });
    const data = await response.text();
    console.log(data);
    getDirectoryItems();
  }
  function renameFile(oldFilename) {
    setNewFilename(oldFilename);
  }

  async function saveFile(oldFilename) {
    const response = await fetch(URL, {
      method: 'PATCH',
      body: JSON.stringify({ oldFilename, newFilename }),
    });
    const data = await response.text();
    console.log(data);
    setNewFilename('');
    getDirectoryItems();
  }
  return (
    <>
      <h1>My Files</h1>
      <div>
        <input type="file" onChange={uploadFile} />
        <input
          type="text"
          onChange={(e) => setNewFilename(e.target.value)}
          placeholder="New filename"
          value={newFilename}
        />
        <div>{progress}</div>
        {DirectoryItems.map((item, idx) => (
          <p key={idx}>
            {item} <a href={`${URL}${item}?action=open`}>Open</a>{' '}
            <a href={`${URL}${item}?action=download`}>
              Download
            </a>
            <button
              onClick={() => {
                handleDelete(item);
              }}
            >
              Delete
            </button>
            <button
              onClick={() => {
                renameFile(item);
              }}
            >
              Rename
            </button>
            <button
              onClick={() => {
                saveFile(item);
              }}
            >
              Save
            </button>
          </p>
        ))}
      </div>
    </>
  );
}

export default App;
