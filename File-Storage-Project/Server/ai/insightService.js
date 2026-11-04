import mongoose from 'mongoose';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import s3, { BUCKET_NAME } from '../config/b2.js';
import { aiConfig } from '../config/ai.js';
import File from '../models/fileModel.js';
import FileInsight from '../models/fileInsightModel.js';
import { AiError } from './errors.js';
import { getProvider } from './providers/index.js';
import { extractText, isSupportedExtension } from './extract.js';
import { analyzeText, buildEmbeddingInput } from './analyzer.js';
import { normalize } from './vector.js';

async function readObject(key) {
  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
  if (obj.ContentLength && obj.ContentLength > aiConfig.maxFileBytes) {
    throw new AiError('FILE_TOO_LARGE', 'This file is too large for AI analysis.', 422);
  }
  return Buffer.from(await obj.Body.transformToByteArray());
}

// Worker body. Runs inside the queue, never inside a request.
export async function runAnalysis(fileId) {
  const claimed = await FileInsight.findOneAndUpdate(
    { fileId, status: 'queued' },
    { status: 'processing', errorCode: null, errorMessage: null },
  );
  if (!claimed) return;

  try {
    const file = await File.findById(fileId).lean();
    if (!file || file.isTrashed) {
      throw new AiError('FILE_UNAVAILABLE', 'The file is no longer available.', 404);
    }
    if (!isSupportedExtension(file.extension)) {
      throw new AiError('UNSUPPORTED_FORMAT', 'This file type is not supported for AI analysis yet.', 422);
    }
    if (file.size > aiConfig.maxFileBytes) {
      throw new AiError('FILE_TOO_LARGE', 'This file is too large for AI analysis.', 422);
    }

    const provider = getProvider();
    const buffer = await readObject(`${file._id}${file.extension}`);
    const text = await extractText(buffer, file.extension);
    const result = await analyzeText(provider, { text, filename: file.name });
    const vector = normalize(
      await provider.embed(buildEmbeddingInput({ filename: file.name, text, ...result })),
    );

    await FileInsight.updateOne(
      { fileId },
      {
        status: 'done',
        summary: result.summary,
        category: result.category,
        tags: result.tags,
        embedding: vector,
        provider: provider.name,
        model: provider.model,
        embedModel: provider.embedModel,
        truncated: result.truncated,
        charCount: result.charCount,
        analyzedAt: new Date(),
        errorCode: null,
        errorMessage: null,
      },
    );
  } catch (err) {
    const known = err instanceof AiError;
    const code = known ? err.code : 'ANALYSIS_FAILED';
    if (!known) console.log('AI analysis failed:', err?.message);
    await FileInsight.updateOne(
      { fileId },
      {
        status: ['UNSUPPORTED_FORMAT', 'NO_TEXT'].includes(code) ? 'unsupported' : 'failed',
        errorCode: code,
        errorMessage: known ? err.message : 'Analysis failed unexpectedly.',
      },
    );
  }
}

// Called once after Mongo connects: a restart kills the in-memory queue, so
// anything left mid-flight can never finish.
export async function recoverStaleJobs() {
  await FileInsight.updateMany(
    { status: { $in: ['queued', 'processing'] } },
    {
      status: 'failed',
      errorCode: 'INTERRUPTED',
      errorMessage: 'Analysis was interrupted by a server restart. Please try again.',
    },
  );
}

export function scheduleRecovery() {
  const run = () => recoverStaleJobs().catch((e) => console.log('AI recovery failed:', e.message));
  if (mongoose.connection.readyState === 1) run();
  else mongoose.connection.once('connected', run);
}

// Call from every permanent-delete path so no AI data outlives its file.
export async function deleteInsightsForFiles(fileIds) {
  if (!fileIds || fileIds.length === 0) return;
  await FileInsight.deleteMany({ fileId: { $in: fileIds } });
}

export async function deleteInsightsForUser(userId) {
  await FileInsight.deleteMany({ userId });
}
