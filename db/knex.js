var enviroment = process.env.NODE_ENV || 'development';
var config = require('../knexfile')[enviroment];
// console.log(config);
module.exports = require('knex')(config);