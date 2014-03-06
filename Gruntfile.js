var dbClearDown = require('./tasks/db_clear_down'),
    dbSeed = require('./tasks/db_seed');

module.exports = function(grunt) {
  grunt.registerTask('db-clear', dbClearDown.task);
  grunt.registerTask('db-seed', dbClearDown.task, dbSeed.task);
};
