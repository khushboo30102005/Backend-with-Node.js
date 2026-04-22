import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

function DirView() {
  const BASE_URL = 'http://localhost:4000';
  const [DirectoryItems, setDirectoryItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [newFilename, setNewFilename] = useState('');
  const [newDirectoryName, setNewDirectoryName] = useState('');
  const { '*': dirPath } = useParams();

  async function getDirectoryItems() {
    const response = await fetch(`${BASE_URL}/directory/${dirPath}`);
    const data = await response.json();
    setDirectoryItems(data);
  }
  useEffect(() => {
    getDirectoryItems();
  }, [dirPath]);

  async function uploadFile(e) {
    const file = e.target.files[0];
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/files/${dirPath}/${file.name}`, true);
    let totalProgress = 0;
    xhr.upload.addEventListener('progress', (event) => {
      totalProgress = (event.loaded / event.total) * 100;
      setProgress(totalProgress.toFixed(2) + '%');
    });
    xhr.addEventListener('load', () => {
      console.log(xhr.response);
      setProgress('Upload complete');
      getDirectoryItems();
    });
    xhr.send(file);
  }

  async function handleDelete(filename) {
    const response = await fetch(`${BASE_URL}/files/${dirPath}/${filename}`, {
      method: 'DELETE',
    });
    const data = await response.text();
    console.log(data);
    getDirectoryItems();
  }
  function renameFile(oldFilename) {
    setNewFilename(oldFilename);
  }

  async function saveFile(oldFilename) {
    const response = await fetch(
      `${BASE_URL}/files/${dirPath}/${oldFilename}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ newFilename: `${dirPath}/${newFilename}` }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const data = await response.text();
    console.log(data);
    setNewFilename('');
    getDirectoryItems();
  }

  async function createDirectory() {
    const response = await fetch(
      `${BASE_URL}/directory/${dirPath ? `/${dirPath}` : ''}/${newDirectoryName}`,
      {
        method: 'POST',
      },
    );
    console.log(`${BASE_URL}/directory${dirPath ? `/${dirPath}` : ''}/${newDirectoryName}`)
    const data = await response.text();
    console.log(data);
    setNewDirectoryName('');
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
        <br />
        <input
          onChange={(e) => setNewDirectoryName(e.target.value)}
          type="text"
          placeholder="New Directory Name"
          value={newDirectoryName}
        />
        <button onClick={createDirectory}>Create Directory</button>
        {DirectoryItems.map(({ name, isDirectory }, idx) => (
          <p key={idx}>
            {name}
            {isDirectory && <Link to={`./${name}`}>Open</Link>}
            {!isDirectory && (
              <a href={`${BASE_URL}/files${dirPath ? `/${dirPath}` : ''}/${name}?action=open`}>
                Open
              </a>
            )}

            {!isDirectory && (
              <a href={`${BASE_URL}/files/${dirPath}/${name}?action=download`}>
                Download
              </a>
            )}
            <button
              onClick={() => {
                handleDelete(name);
              }}
            >
              Delete
            </button>
            <button
              onClick={() => {
                renameFile(name);
              }}
            >
              Rename
            </button>
            <button
              onClick={() => {
                saveFile(name);
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

export default DirView;
