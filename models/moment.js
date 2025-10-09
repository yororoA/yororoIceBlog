const { mongoose } = require('../utils/db/mongoose');

const FilenameSchema = new mongoose.Schema({
  origin: { type: String, required: true }, // 原始文件名
  desc: { type: String, default: '' }, // 描述信息（来自对应字段）
}, { _id: false });

const MomentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  uid: { type: String, required: true, index: true },
  published: { type: Boolean, default: false, index: true },
  // acknowledge: 是否已确认（来自 POST 请求体）
  acknowledge: { type: Boolean, default: false },
  // filenames: { [newName]: description }
  filenames: { type: Map, of: String },
  // 可选地保留每个文件的原始名/描述
  filesDetail: { type: Map, of: FilenameSchema },
  // 评论数组（结构未限定，后续可演进成子文档），初始为空
  comments: { type: Array, default: [] },
  // 点赞数量，非负整数
  likes: { type: Number, default: 0, min: 0 },
}, { collection: 'moments', timestamps: true });

const Moment = mongoose.models.Moment || mongoose.model('Moment', MomentSchema);
module.exports = Moment;
