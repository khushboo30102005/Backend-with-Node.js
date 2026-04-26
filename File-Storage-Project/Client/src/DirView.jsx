import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

function DirView() {
  const BASE_URL = 'http://localhost:4000';
  const [DirectoryItems, setDirectoryItems] = useState([]);
  const [directoriesList, setDirectoriesList] = useState([]);
  const [filesList, setFilesList] = useState([]);
  const [progress, setProgress] = useState(0);
  const [newFilename, setNewFilename] = useState('');
  const [newDirectoryName, setNewDirectoryName] = useState('');
  const { dirId } = useParams();
  // console.log(dirId)

  async function getDirectoryItems() {
    const response = await fetch(`${BASE_URL}/directory/${dirId || ''}`);
    const data = await response.json();
    // setDirectoryItems(data);
    setDirectoriesList(data.directories);
    setFilesList(data.files);
  }
  useEffect(() => {
    getDirectoryItems();
  }, [dirId]);

  async function uploadFile(e) {
    const file = e.target.files[0];
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/file/${dirId || ''}`, true);
    xhr.setRequestHeader('filename', file.name);
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

  async function handleFileDelete(fileId) {
    const response = await fetch(`${BASE_URL}/file/${fileId}`, {
      method: 'DELETE',
    });
    const data = await response.text();
    console.log(data);
    getDirectoryItems();
  }

  async function handleDirDelete(id) {
    const response = await fetch(`${BASE_URL}/directory/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    console.log(data);
    getDirectoryItems();
  }
  function renameFile(oldFilename) {
    console.log(oldFilename);
    setNewFilename(oldFilename);
  }

  async function saveFile(id) {
    const response = await fetch(`${BASE_URL}/file/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ newFilename: `${newFilename}` }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.text();
    console.log(data);
    setNewFilename('');
    getDirectoryItems();
  }

  async function saveDir(id) {
    const response = await fetch(`${BASE_URL}/directory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ newDirName: `${newFilename}` }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.text();
    console.log(data);
    setNewFilename('');
    getDirectoryItems();
  }

  async function createDirectory() {
    console.log(`${BASE_URL}/directory/${dirId || ''}`);
    const response = await fetch(`${BASE_URL}/directory/${dirId || ''}`, {
      method: 'POST',
      headers: {
        dirname: newDirectoryName,
      },
    });
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
        {directoriesList.map(({ name, id }) => (
          <p key={id}>
            {name}
            {<Link to={`/directory/${id}`}>Open</Link>}

            <button
              onClick={() => {
                handleDirDelete(id);
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
                saveDir(id);
              }}
            >
              Save
            </button>
          </p>
        ))}
        {filesList.map(({ name, id }) => (
          <p key={id}>
            {name}
            {<a href={`${BASE_URL}/file/${id}`}>Open</a>}

            {<a href={`${BASE_URL}/file/${id}?action=download`}>Download</a>}
            <button
              onClick={() => {
                handleFileDelete(id);
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
                saveFile(id);
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
