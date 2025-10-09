const { mongoose } = require('../utils/db/mongoose');

const CommentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  uid: { type: String, required: true, index: true },
  username: { type: String, required: true },
  momentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0, min: 0 },
}, { collection: 'comments' });

const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
module.exports = Comment;
