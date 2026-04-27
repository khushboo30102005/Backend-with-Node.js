import express from 'express';
import cors from 'cors';
const app = express();
const port = 4000;
app.use(cors());

// import multer
import multer from 'multer';
import path from 'node:path';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    const id = crypto.randomUUID();
    const extension = path.extname(file.originalname);
    file.id = id;
    cb(null, `${id}${extension}`);
  },
});

const upload = multer({ storage: storage });

app.post(
  '/upload',
  upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'bg', maxCount: 5 },
  ]),
  (req, res) => {
    console.log(req.files);
    console.log({body: req.body});
    res.json({files: req.files , body: req.body})
  },
);

app.listen(port, () => {
  console.log('Server Started>>>>');
  console.log(`http://localhost:${port}`);
});
