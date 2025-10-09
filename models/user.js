const { mongoose } = require('../utils/db/mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  uid: { type: String, required: true, unique: true },
  token: { type: String, required: true, index: true },
  tokenExpiresAt: { type: Date, required: true },
  tokenRefreshUntil: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  // 点赞过的 moment 的 id 列表
  likeMoments: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  // 点赞过的 comment 的 id 列表
  likeComments: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  // 发布过的 moment 的 id 列表（预留）
  moments: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  // 发表过的评论 id 列表（预留；当前未建立独立评论集合时可暂不使用）
  comments: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  // 当前草稿的 momentId（若有）
  draft: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { collection: 'users' });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;
