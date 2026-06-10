import express from 'express';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.js';
import { ObjectId } from 'mongodb';
import { createDirectory, deleteDirectory, getDirectoryById, renameDirectory } from '../controllers/directoryController.js';

const router = express.Router();

router.param('parentDirId', validateIdMiddleware);

router.param('id', validateIdMiddleware);


router.route('/{:parentDirId}').post(createDirectory)

router.route('/{:id}').get(getDirectoryById)

router.route('/:id').patch(renameDirectory).delete(deleteDirectory)


export default router;
