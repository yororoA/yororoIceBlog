const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Moment = require('../models/moment');
const { connectMongo } = require('../utils/db/mongoose');
const User = require('../models/user');

const router = express.Router();
const { broadcast } = require('../utils/sse/bus');

// 处理 Mongo 文档键禁用的字符（'.' 与 '$'）
const sanitizeKey = (s) => String(s).replace(/\./g, '\uFF0E').replace(/\$/g, '\uFF04');
const unsanitizeKey = (s) => String(s).replace(/\uFF0E/g, '.').replace(/\uFF04/g, '$');
function unsanitizeMapLike(obj) {
  if (!obj) return obj;
  // obj 可能是普通对象或 Map 的 POJO 表示
  const entries = Array.isArray(obj) ? obj : Object.entries(obj);
  const out = {};
  for (const [k, v] of entries) {
    out[unsanitizeKey(k)] = v;
  }
  return out;
}

// 存储目录
const UPLOAD_DIR = path.resolve(__dirname, '../public/uploads/moments');

// 确保目录存在
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 允许的文件类型（图片、视频）
const allowedMime = new Set([
  // images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
  // videos
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'
]);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    try {
      const uidFromHeader = req.headers && (req.headers['uid'] || req.headers['Uid'] || req.headers['UID']);
      const uid = uidFromHeader || 'nouid';
      const ts = Date.now();
      // 解析原始名与扩展，确保扩展置于末尾
      const parsed = path.parse(file.originalname);
      const safeBase = `${parsed.name}`.replace(/[^a-zA-Z0-9_.-]+/g, '_');
      const ext = parsed.ext || '';
      // 按要求：uid + origin名(无扩展) + 上传时间 + 扩展
      const newName = `${uid}__${safeBase}__${ts}${ext}`;
      // 在 req._renamedFiles 上记录
      if (!req._renamedFiles) req._renamedFiles = [];
      req._renamedFiles.push({ newName, originalname: file.originalname });
      cb(null, newName);
    } catch (e) {
      cb(e);
    }
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedMime.has(file.mimetype)) return cb(null, true);
    return cb(new Error('不支持的文件类型'));
  },
  limits: { fileSize: 50 * 1024 * 1024, files: 16 } // 单文件 50MB，总数 16
});

// POST /api/moments/post
router.post('/post', upload.any(), async (req, res) => {
  console.log(req.body);
  try {
    await connectMongo();

    const uidFromHeaderPost = req.headers && (req.headers['uid'] || req.headers['Uid'] || req.headers['UID']);
    const { title, content = '', published, acknowledge } = req.body;
    if (!title || !uidFromHeaderPost) {
      return res.status(400).json({ message: '缺少必要字段：title 或 uid' });
    }

    // published 兼容字符串
    const publishedBool = (typeof published === 'boolean') ? published : String(published).toLowerCase() === 'true';

    // 前端可选传 descriptions(JSON)，形如 { originFilename: "描述" }
    let descriptions = {};
    if (req.body.descriptions) {
      try { descriptions = JSON.parse(req.body.descriptions); } catch (e) { descriptions = {}; }
    }

    // filenames 对象：key 为重命名后的 filename，值为 originname 对应的描述
    const filenames = {};
    const filesDetail = {};
    (req._renamedFiles || []).forEach(({ newName, originalname }) => {
      const desc = descriptions[originalname] || '';
      const safeKey = sanitizeKey(newName);
      filenames[safeKey] = desc;
      filesDetail[safeKey] = { origin: originalname, desc };
    });

    // 如果 published=false，先删除同 uid 下已存在的草稿
    if (!publishedBool) {
      await Moment.deleteMany({ uid: uidFromHeaderPost, published: false });
    }

    // 写入或覆盖
    const doc = await Moment.create({
      title,
      content,
      uid: uidFromHeaderPost,
      published: !!publishedBool,
      acknowledge: (typeof acknowledge === 'boolean') ? acknowledge : String(acknowledge).toLowerCase() === 'true',
      filenames: Object.keys(filenames).length ? filenames : undefined,
      filesDetail: Object.keys(filesDetail).length ? filesDetail : undefined,
      // 确保创建时间为当前最新时间
      createdAt: new Date(),
    });

    // 如果已发布：
    // 1) 清理该用户所有草稿文档（published=false）
    // 2) 把已发布的 momentId 记录到用户 moments 列表中，并清空用户 draft 字段
    if (publishedBool) {
      await Moment.deleteMany({ uid: uidFromHeaderPost, published: false });
      await User.updateOne(
        { uid: uidFromHeaderPost },
        {
          $addToSet: { moments: doc._id },
          $set: { draft: null }
        }
      );
      // SSE: 推送新发布的 moment
      try {
        broadcast('moment', {
          type: 'moment.new',
          data: {
            _id: String(doc._id),
            title: doc.title,
            content: doc.content,
            uid: doc.uid,
            createdAt: doc.createdAt,
          }
        });
      } catch (_) {}
    } else {
      // 草稿：记录当前草稿的 _id 到用户文档
      await User.updateOne({ uid: uidFromHeaderPost }, { $set: { draft: doc._id } });
    }

    // 返回前还原 map 的键，避免前端使用受影响
    const obj = doc.toObject ? doc.toObject() : doc;
    if (obj.filenames) obj.filenames = unsanitizeMapLike(obj.filenames);
    if (obj.filesDetail) obj.filesDetail = unsanitizeMapLike(obj.filesDetail);

    return res.json({ message: 'ok', data: obj });
  } catch (err) {
    console.error('POST /moments/post error', err);
    return res.status(500).json({ message: '服务器错误' });
  }
});

// GET /api/moments/get
router.get('/get', async (req, res) => {
  try {
    await connectMongo();

    // 优先取 query，其次 body
    const isEditingRaw = req.query.isEditing ?? req.body?.isEditing;
    const uidRaw = req.headers && (req.headers['uid'] || req.headers['Uid'] || req.headers['UID']);
    const isEdit = String(isEditingRaw).toLowerCase() === 'true';

    if (isEdit) {
      if (!uidRaw) return res.status(400).json({ message: '缺少 uid' });
      const draft = await Moment.findOne({ uid: uidRaw, published: false }).sort({ updatedAt: -1 }).lean();
      if (!draft) return res.json({ message: 'ok', data: null });
      // if (draft.filenames) draft.filenames = unsanitizeMapLike(draft.filenames);
      // if (draft.filesDetail) draft.filesDetail = unsanitizeMapLike(draft.filesDetail);
      return res.json({ message: 'ok', data: draft });
    }

    const list = await Moment.find({ published: true }).sort({ updatedAt: -1 }).lean();

    // 批量查出 uid 对应的 username
    const uidSet = Array.from(new Set(list.map(it => it.uid).filter(Boolean)));
    const users = uidSet.length
      ? await User.find({ uid: { $in: uidSet } }, { uid: 1, username: 1, _id: 0 }).lean()
      : [];
    const nameMap = users.reduce((acc, u) => { acc[u.uid] = u.username; return acc; }, {});

    const dataWithId = list.map((doc) => {
      const d = { ...doc, documentId: String(doc._id) };
      d.username = nameMap[doc.uid] || null;
      if (d.filenames) d.filenames = unsanitizeMapLike(d.filenames);
      if (d.filesDetail) d.filesDetail = unsanitizeMapLike(d.filesDetail);
      return d;
    });
    return res.json({ message: 'ok', data: dataWithId });
  } catch (err) {
    console.error('GET /moments/get error', err);
    return res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

// 评论相关 API
const Comment = require('../models/comment');

// POST /api/moments/comment/post
// 请求体: { momentId, comment }
// 请求头: uid
router.post('/comment/post', async (req, res) => {
  try {
    await connectMongo();
    const uid = req.headers && (req.headers['uid'] || req.headers['Uid'] || req.headers['UID']);
    const { momentId, comment, belong } = req.body || {};
    if (!uid || !momentId || !comment) {
      return res.status(400).json({ message: '缺少必要字段' });
    }
    // 查用户 username
    const userDoc = await User.findOne({ uid }, { username: 1 }).lean();
    if (!userDoc) return res.status(404).json({ message: '用户不存在' });
    // 创建评论
    const createPayload = { content: comment, uid, username: userDoc.username, momentId };
    if (typeof belong === 'string' && belong.length) createPayload.belong = belong;
    const newComment = await Comment.create(createPayload);
    // 更新 moment 的 comments 数组
    await Moment.updateOne({ _id: momentId }, { $addToSet: { comments: newComment._id } });
    // 更新 user 的 comments 数组
    await User.updateOne({ uid }, { $addToSet: { comments: newComment._id } });
    // SSE: 推送新评论
    try {
      broadcast('comment', {
        type: 'comment.new',
          data: {
            _id: String(newComment._id),
            momentId: String(momentId),
            uid,
            username: userDoc.username,
            content: comment,
            createdAt: newComment.createdAt,
            belong: newComment.belong || null,
          }
      });
    } catch (_) {}
    return res.json({ message: 'ok', data: newComment });
  } catch (err) {
    console.error('POST /moments/comment/post error', err);
    return res.status(500).json({ message: '服务器错误' });
  }
});

// POST /api/moments/comment/get
// 请求体: { commentIds: [id1, id2, ...] }
router.post('/comment/get', async (req, res) => {
  try {
    await connectMongo();
    const { commentIds } = req.body || {};
    if (!Array.isArray(commentIds) || !commentIds.length) {
      return res.status(400).json({ message: '缺少 commentIds 数组' });
    }
    const comments = await Comment.find({ _id: { $in: commentIds } }).lean();
    return res.json({ message: 'ok', data: comments });
  } catch (err) {
    console.error('POST /moments/comment/get error', err);
    return res.status(500).json({ message: '服务器错误' });
  }
});

// POST /api/moments/comment/like
// 请求体: { commentId, like }
// 请求头: uid
router.post('/comment/like', async (req, res) => {
  try {
    await connectMongo();
    const uid = req.headers && (req.headers['uid'] || req.headers['Uid'] || req.headers['UID']);
    const { commentId, like } = req.body || {};
    if (!uid || !commentId || typeof like === 'undefined') {
      return res.status(400).json({ message: '缺少必要字段' });
    }
    const likeBool = (typeof like === 'boolean') ? like : String(like).toLowerCase() === 'true';
    // 查找评论
    const commentDoc = await Comment.findById(commentId);
    if (!commentDoc) return res.status(404).json({ message: '评论不存在' });
    // 查找用户
    const user = await User.findOne({ uid }, { likeComments: 1 }).lean();
    if (!user) return res.status(404).json({ message: '用户不存在' });
    const hasLiked = Array.isArray(user.likeComments) && user.likeComments.some(id => String(id) === String(commentId));
    let inc = 0;
    if (likeBool) {
      if (!hasLiked) {
        await User.updateOne({ uid }, { $addToSet: { likeComments: commentId } });
        inc = 1;
      }
    } else {
      if (hasLiked) {
        await User.updateOne({ uid }, { $pull: { likeComments: commentId } });
        inc = -1;
      }
    }
    if (inc !== 0) {
      if (inc > 0) {
        await Comment.updateOne({ _id: commentId }, { $inc: { likes: 1 } });
      } else {
        await Comment.updateOne({ _id: commentId, likes: { $gt: 0 } }, { $inc: { likes: -1 } });
      }
    }
    const updated = await Comment.findById(commentId).lean();
    const newHasLiked = likeBool ? true : (inc === -1 ? false : hasLiked);
    // SSE: 推送评论点赞更新
    try {
      broadcast('comment-like', { type: 'comment.like', data: { commentId, likes: updated ? updated.likes : null , uid} });
    } catch (_) {}
    return res.json({ message: 'ok', data: { commentId, likes: updated ? updated.likes : null, hasLiked: newHasLiked } });
  } catch (err) {
    console.error('POST /moments/comment/like error', err);
    return res.status(500).json({ message: '服务器错误' });
  }
});

// GET /api/moments/comments/liked
// 从请求头 uid 读取用户，返回其 likeMoments（仅返回该字段，转为字符串数组）
router.get('/comments/liked', async (req, res) => {
  try {
    await connectMongo();

    const uid = req.headers && (req.headers['uid'] || req.headers['Uid'] || req.headers['UID']);
    if (!uid) return res.status(400).json({ message: '缺少 uid' });

    const user = await User.findOne({ uid }, { likeComments: 1, _id: 0 }).lean();
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const liked = Array.isArray(user.likeComments) ? user.likeComments.map(id => String(id)) : [];
    return res.json({ message: 'ok', data: liked });
  } catch (err) {
    console.error('GET /moments/comments/liked error', err);
    return res.status(500).json({ message: '服务器错误' });
  }
});

// Body: { momentId: string, like: boolean | 'true' | 'false' }
// 逻辑：
//  - like=true：若用户未点赞，则给 moment.likes +1，且将 momentId 加入用户 likeMoments
//  - like=false：若用户已点赞，则给 moment.likes -1（不低于 0），且将 momentId 从用户 likeMoments 移除
router.post('/like', async (req, res) => {
  try {
    await connectMongo();

    const uid = req.headers && (req.headers['uid'] || req.headers['Uid'] || req.headers['UID']);
    if (!uid) return res.status(401).json({ message: '未认证' });

    const { momentId, like } = req.body || {};
    if (!momentId) return res.status(400).json({ message: '缺少 momentId' });

    const likeBool = (typeof like === 'boolean') ? like : String(like).toLowerCase() === 'true';

    // 校验 moment 是否存在
    const momentDoc = await Moment.findById(momentId).lean();
    if (!momentDoc) return res.status(404).json({ message: 'moment 不存在' });

    // 读取用户的 likeMoments，判断是否已点赞
    const user = await User.findOne({ uid }, { likeMoments: 1 }).lean();
    if (!user) return res.status(404).json({ message: '用户不存在' });
    const hasLiked = Array.isArray(user.likeMoments) && user.likeMoments.some(id => String(id) === String(momentId));

    let inc = 0;
    if (likeBool) {
      if (!hasLiked) {
        await User.updateOne({ uid }, { $addToSet: { likeMoments: momentId } });
        inc = 1;
      }
    } else {
      if (hasLiked) {
        await User.updateOne({ uid }, { $pull: { likeMoments: momentId } });
        inc = -1;
      }
    }

    if (inc !== 0) {
      if (inc > 0) {
        await Moment.updateOne({ _id: momentId }, { $inc: { likes: 1 } });
      } else {
        // 防止出现负数
        await Moment.updateOne({ _id: momentId, likes: { $gt: 0 } }, { $inc: { likes: -1 } });
      }
    }

    const updated = await Moment.findById(momentId).lean();
    const newHasLiked = likeBool ? true : (inc === -1 ? false : hasLiked);
    // SSE: 推送 moment 点赞更新
    try {
      broadcast('moment-like', { type: 'moment.like', data: { momentId, likes: updated ? updated.likes : null ,uid} });
    } catch (_) {}
    return res.json({ message: 'ok', data: { momentId, likes: updated ? updated.likes : null, hasLiked: newHasLiked } });
  } catch (err) {
    console.error('POST /moments/like error', err);
    return res.status(500).json({ message: '服务器错误' });
  }
});

// 获取已上传文件内容
// POST /api/moments/files
// Body: { from: string, filenames: string[] }
// 功能：从 public/uploads/<from>/ 读取指定重命名后的文件名，返回 { filename, mime, base64 }
router.post('/files', async (req, res) => {
  try {
    const { from, filenames } = req.body || {};
    if (!from || !Array.isArray(filenames)) {
      return res.status(400).json({ message: '缺少必要字段：from 或 filenames(数组)' });
    }

    // 校验 from 仅为安全子目录名
    if (!/^[a-zA-Z0-9_-]+$/.test(from)) {
      return res.status(400).json({ message: '非法的目录名' });
    }

    const baseUploads = path.resolve(__dirname, '../public/uploads');
    const subDir = path.resolve(baseUploads, from);
    if (!subDir.startsWith(baseUploads)) {
      return res.status(400).json({ message: '非法路径' });
    }

    const extMime = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp', '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'video/ogg', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo', '.mkv': 'video/x-matroska'
    };

    const results = [];
    const notFound = [];

    for (const name of filenames) {
      // 仅取基础名，防止路径穿越
      const safeName = path.basename(String(name));
      const filePath = path.join(subDir, safeName);
      try {
        const buf = await fs.promises.readFile(filePath);
        const ext = path.extname(safeName).toLowerCase();
        const mime = extMime[ext] || 'application/octet-stream';
        results.push({ filename: safeName, mime, base64: buf.toString('base64') });
      } catch (e) {
        notFound.push(safeName);
      }
    }

    return res.json({ message: 'ok', data: results, notFound });
  } catch (err) {
    console.error('POST /moments/files error', err);
    return res.status(500).json({ message: '服务器错误' });
  }
});

// GET /api/moments/liked
// 从请求头 uid 读取用户，返回其 likeMoments（仅返回该字段，转为字符串数组）
router.get('/liked', async (req, res) => {
  try {
    await connectMongo();

    const uid = req.headers && (req.headers['uid'] || req.headers['Uid'] || req.headers['UID']);
    if (!uid) return res.status(400).json({ message: '缺少 uid' });

    const user = await User.findOne({ uid }, { likeMoments: 1, _id: 0 }).lean();
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const liked = Array.isArray(user.likeMoments) ? user.likeMoments.map(id => String(id)) : [];
    return res.json({ message: 'ok', data: liked });
  } catch (err) {
    console.error('GET /moments/liked error', err);
    return res.status(500).json({ message: '服务器错误' });
  }
});
