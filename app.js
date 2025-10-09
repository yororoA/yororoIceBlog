const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config({path: path.resolve(__dirname, './.env')});


const app = express();
const apisRouter = require('./apis');
const authMiddleware = require('./middlewares/auth');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// CORS 设置
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN);
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Token, uid');
	// 允许前端读取刷新后的令牌头
	res.header('Access-Control-Expose-Headers', 'X-Refreshed-Token');
	// 可选：携带凭据时需指定具体 Origin 且添加以下 header
	res.header('Access-Control-Allow-Credentials', 'true');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(204);
	}
	next();
});
app.use(express.static(path.join(__dirname, 'public')));

// 统一 API 路由
app.use(authMiddleware);
app.use('/api', apisRouter);


module.exports = app;
