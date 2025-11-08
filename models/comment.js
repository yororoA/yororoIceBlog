const { mongoose } = require('../utils/db/mongoose');

const CommentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  uid: { type: String, required: true, index: true },
  username: { type: String, required: true },
  momentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  // 可选：该评论归属的额外字符串信息（例如回复对象 id、来源等）
  belong: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0, min: 0 },
}, { collection: 'comments' });

const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
module.exports = Comment;
