import mongoose from 'mongoose';
import File from '../models/fileModel.js';
import Share from '../models/shareModel.js';
import User from '../models/userModel.js';
import FileInsight from '../models/fileInsightModel.js';
import { aiConfig } from '../config/ai.js';
import { getFileAccess } from '../utils/fileAccess.js';
import { AiError, sendAiError } from '../ai/errors.js';
import { getProvider, assertConsent, providerHost } from '../ai/providers/index.js';
import { isSupportedExtension } from '../ai/extract.js';
import { enqueue, hasCapacity } from '../ai/queue.js';
import { runAnalysis } from '../ai/insightService.js';
import { normalize, dot } from '../ai/vector.js';

const toDto = (i) =>
  i
    ? {
        status: i.status,
        summary: i.summary,
        category: i.category,
        tags: i.tags,
        errorCode: i.errorCode,
        errorMessage: i.errorMessage,
        truncated: i.truncated,
        model: i.model,
        analyzedAt: i.analyzedAt,
      }
    : { status: 'none' };

// GET /ai/status — what the UI needs to show "AI offline" etc.
export const getAiStatus = async (req, res, next) => {
  if (!aiConfig.enabled) return res.json({ enabled: false });
  try {
    const provider = getProvider();
    const health = await provider.health();
    return res.json({
      enabled: true,
      provider: provider.name,
      model: provider.model,
      external: provider.external,
      providerHost: provider.external ? providerHost(provider) : null,
      reachable: health.reachable,
      modelReady: health.modelReady,
    });
  } catch (err) {
    if (err instanceof AiError) {
      return res.json({ enabled: true, reachable: false, code: err.code, error: err.message });
    }
    return next(err);
  }
};

// GET /ai/files/:id — owner, editor or viewer may read the insight.
export const getInsight = async (req, res, next) => {
  try {
    const access = await getFileAccess(req.params.id, req.user._id);
    if (!access) return res.status(404).json({ error: 'File not found!' });
    const insight = await FileInsight.findOne({ fileId: req.params.id }).lean();
    return res.json(toDto(insight));
  } catch (err) {
    return next(err);
  }
};

// POST /ai/files/:id/analyze — owner only: sharing a file never lets someone
// else push your document through an AI model.
export const analyzeFile = async (req, res, next) => {
  const { id } = req.params;
  try {
    const access = await getFileAccess(id, req.user._id);
    if (!access) return res.status(404).json({ error: 'File not found!' });
    if (access.role !== 'owner') {
      return res.status(403).json({ error: 'Only the file owner can run AI analysis.' });
    }
    if (!isSupportedExtension(access.file.extension)) {
      return res.status(422).json({
        error: 'This file type is not supported for AI analysis yet.',
        code: 'UNSUPPORTED_FORMAT',
      });
    }
    if (access.file.size > aiConfig.maxFileBytes) {
      return res.status(422).json({
        error: 'This file is too large for AI analysis.',
        code: 'FILE_TOO_LARGE',
      });
    }

    const provider = getProvider();
    assertConsent(provider, req.body?.confirmExternal);

    const existing = await FileInsight.findOne({ fileId: id }).select('status').lean();
    if (existing && ['queued', 'processing'].includes(existing.status)) {
      return res.status(202).json({ status: existing.status });
    }

    const health = await provider.health();
    if (!health.reachable) {
      throw new AiError('AI_OFFLINE', 'The AI service is offline or unreachable.', 503);
    }
    if (!health.modelReady) {
      throw new AiError('AI_MODEL_MISSING', 'The configured AI models are not installed on the AI server.', 503);
    }
    if (!hasCapacity()) {
      return res.status(429).json({ error: 'The AI queue is full. Please try again shortly.' });
    }

    const insight = await FileInsight.findOneAndUpdate(
      { fileId: id },
      {
        fileId: id,
        userId: access.file.userId,
        status: 'queued',
        errorCode: null,
        errorMessage: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    enqueue(() => runAnalysis(id));
    return res.status(202).json(toDto(insight));
  } catch (err) {
    return sendAiError(res, err, next);
  }
};

// DELETE /ai/files/:id — owner clears the stored AI data for a file.
export const clearInsight = async (req, res, next) => {
  try {
    const access = await getFileAccess(req.params.id, req.user._id);
    if (!access) return res.status(404).json({ error: 'File not found!' });
    if (access.role !== 'owner') {
      return res.status(403).json({ error: 'Only the file owner can clear AI data.' });
    }
    await FileInsight.deleteOne({ fileId: req.params.id });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
};

// POST /ai/insights/batch { fileIds } — category/tags for list chips.
// Only the caller's own files are ever returned.
export const getInsightsBatch = async (req, res, next) => {
  const raw = Array.isArray(req.body?.fileIds) ? req.body.fileIds : [];
  const ids = raw.filter((x) => mongoose.isValidObjectId(x)).slice(0, 100);
  if (ids.length === 0) return res.json([]);
  try {
    const rows = await FileInsight.find({
      fileId: { $in: ids },
      userId: req.user._id,
      status: 'done',
    })
      .select('fileId category tags')
      .lean();
    return res.json(rows.map((r) => ({ fileId: r.fileId, category: r.category, tags: r.tags })));
  } catch (err) {
    return next(err);
  }
};

// POST /ai/search { query } — semantic search over files the user may access:
// their own plus those shared with them, never trashed ones.
export const searchFiles = async (req, res, next) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  if (query.length < 3 || query.length > 300) {
    return res.status(400).json({ error: 'Enter between 3 and 300 characters.' });
  }

  try {
    const provider = getProvider();
    assertConsent(provider, req.body?.confirmExternal);

    const me = req.user._id;
    const shares = await Share.find({ sharedWithUserId: me })
      .select('resourceId permission ownerId')
      .lean();
    const shareByFile = new Map(shares.map((s) => [String(s.resourceId), s]));

    const insights = await FileInsight.find({
      status: 'done',
      $or: [{ userId: me }, { fileId: { $in: [...shareByFile.keys()] } }],
    })
      .select('+embedding')
      .limit(2000)
      .lean();

    const analyzedCount = insights.length;
    if (analyzedCount === 0) {
      return res.json({ results: [], analyzedCount: 0, staleCount: 0 });
    }

    const usable = insights.filter((i) => i.embedModel === provider.embedModel);
    const staleCount = analyzedCount - usable.length;

    const files = await File.find({
      _id: { $in: usable.map((i) => i.fileId) },
      isTrashed: { $ne: true },
    })
      .select('name extension size updatedAt userId')
      .lean();
    const fileById = new Map(files.map((f) => [String(f._id), f]));

    const queryVec = normalize(await provider.embed(query));
    const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 3);

    const scored = [];
    for (const i of usable) {
      const file = fileById.get(String(i.fileId));
      if (!file) continue;
      let score = dot(queryVec, i.embedding);
      const haystack = `${file.name} ${i.tags.join(' ')}`.toLowerCase();
      score += Math.min(0.15, tokens.filter((t) => haystack.includes(t)).length * 0.05);
      if (score >= aiConfig.searchMinScore) scored.push({ i, file, score });
    }
    scored.sort((a, b) => b.score - a.score);
    // Relative cutoff: embeddings of unrelated texts cluster together, so only
    // keep results close to the best match instead of everything above the floor.
    const best = scored[0]?.score ?? 0;
    const top = scored.filter((r) => r.score >= best - 0.12).slice(0, 20);

    const ownerIds = [
      ...new Set(
        top.filter((t) => String(t.file.userId) !== String(me)).map((t) => String(t.file.userId)),
      ),
    ];
    const owners = ownerIds.length
      ? await User.find({ _id: { $in: ownerIds } }).select('name').lean()
      : [];
    const ownerName = new Map(owners.map((o) => [String(o._id), o.name]));

    return res.json({
      analyzedCount,
      staleCount,
      results: top.map(({ i, file, score }) => {
        const isOwner = String(file.userId) === String(me);
        return {
          id: file._id,
          name: file.name,
          extension: file.extension,
          size: file.size,
          updatedAt: file.updatedAt,
          category: i.category,
          tags: i.tags,
          summary: i.summary,
          score: Math.round(Math.min(score, 1) * 100) / 100,
          permission: isOwner ? 'owner' : shareByFile.get(String(file._id))?.permission,
          sharedBy: isOwner ? null : { name: ownerName.get(String(file.userId)) || 'Someone' },
        };
      }),
    });
  } catch (err) {
    return sendAiError(res, err, next);
  }
};
