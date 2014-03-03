var dbClearDown = require('./tasks/db_clear_down');

module.exports = function(grunt) {
  grunt.registerTask('default', dbClearDown.task);
};
