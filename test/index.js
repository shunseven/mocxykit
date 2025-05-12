// 只访问已在define中定义的环境变量
console.log('NODE_ENV:', process.env.test1);
console.log('TEST_ENV:', process.env.TEST_ENV);
// 也可以访问完整的环境变量对象