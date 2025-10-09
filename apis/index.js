const express = require('express');
const router = express.Router();

// 子路由
router.use('/verification', require('./verification'));
router.use('/register', require('./register'));
router.use('/login', require('./login'));
router.use('/moments', require('./moments'));

module.exports = router;
