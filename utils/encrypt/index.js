const bcrypt = require('bcrypt');

const saltRounds = 10; // 可根据安全与性能平衡调整

async function hashPassword(plain) {
  if (!plain || typeof plain !== 'string') throw new Error('invalid password');
  return await bcrypt.hash(plain, saltRounds);
}

async function comparePassword(plain, hashed) {
  if (!plain || !hashed) return false;
  return await bcrypt.compare(plain, hashed);
}

module.exports = { hashPassword, comparePassword, saltRounds };
