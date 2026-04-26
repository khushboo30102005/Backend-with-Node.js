import express from 'express';
import { rm, writeFile } from 'fs/promises';
import filesData from '../fileDB.json' with { type: 'json' };
import dirsData from '../dirsDB.json' with { type: 'json' };
import { dir } from 'console';

const router = express.Router();

router.get('/{:id}', async (req, res) => {
  const id = req.params.id || dirsData[0].id;
  const directoryData = dirsData.find((directory) => directory.id === id);
  if (!directoryData)
    return res.status(404).json({ message: 'Directory Not Found!!' });
  const files = directoryData.files.map((fileId) =>
    filesData.find((file) => file.id === fileId),
  );
  const directories = directoryData.directories
    .map((dirId) => dirsData.find((dir) => dir.id === dirId))
    .map(({ id, name }) => ({ id, name }));
  return res.status(200).json({ ...directoryData, files, directories });
});

// Create a directory: CREATE
router.post('/{:parentDirId}', async (req, res, next) => {
  const parentDirId = req.params.parentDirId || dirsData[0].id;
  const parentDirData = dirsData.find((dir) => dir.id === parentDirId);
  if (!parentDirData)
    return res.status(404).json({ message: 'Invalid Parent Directory!!' });
  const dirname = req.headers.dirname || 'New Folder';
  const id = crypto.randomUUID();
  parentDirData.directories.push(id);

  dirsData.push({
    id,
    name: dirname,
    ParentDir: parentDirId,
    files: [],
    directories: [],
  });

  try {
    await writeFile('./dirsDB.json', JSON.stringify(dirsData));
    return res.status(200).json({ message: 'Directory Created Successfully' });
  } catch (err) {
    // next(err);
    res.json(err.message);
  }
});

router.patch('/:id', async (req, res, next) => {
  const { id } = req.params;
  const newDirName = req.body.newDirName;
  const dirData = dirsData.find((dir) => dir.id === id);
  if(!dirData) return res.status(404).json({message: "Directory Not Found!!"})
  dirData.name = newDirName;

  try {
    await writeFile('./dirsDB.json', JSON.stringify(dirsData));
    res.status(200).json({ message: 'Renamed Successfully' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  console.log(req.params);
  const { id } = req.params;
  try {
    const dirIndex = dirsData.findIndex((directory) => directory.id === id);
    const directoryData = dirsData[dirIndex];
    dirsData.splice(dirIndex, 1);
    for await (const fileId of directoryData.files) {
      const fileIndex = filesData.findIndex((file) => file.id === fileId);
      const fileData = filesData[fileIndex];
      await rm(`./public/${fileId}${fileData.extension}`);
      filesData.splice(fileIndex, 1);
    }
    for await (const dirId of directoryData.directories) {
      const dirIndex = dirsData.findIndex(({ id }) => id === dirId);
      dirsData.splice(dirIndex, 1);
    }
    const parentDirData = dirsData.find(
      (dirData) => dirData.id === directoryData.ParentDir,
    );
    parentDirData.directories = parentDirData.directories.filter(
      (dirId) => dirId !== id,
    );
    await writeFile('./fileDB.json', JSON.stringify(filesData));
    await writeFile('./dirsDB.json', JSON.stringify(dirsData));
    res.status(200).json({ message: 'Directory Deleted!' });
  } catch (err) {
    next(err);
  }
});
export default router;
