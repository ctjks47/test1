'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    eslint: {
      options: {
        configFile: '_.eslintrc'
      },
      src: [
        '**/*.js',
        '!node_modules/**/*.*',
        '!**/routes/help.js'
      ]
    },
    watch: {
      js: {
        files: [
          '**/*.js',
          '!node_modules/**/*.*',
          '!**/routes/help.js'
        ],
        tasks: ['eslint']
      }
    },
    jsinspect: {
      src: [
        '**/*.js',
        '!**/node_modules/**'
      ]
    }
  });

  grunt.loadNpmTasks('gruntify-eslint');
  grunt.loadNpmTasks('grunt-jsinspect');

  // local only
  if(process.env.NODE_ENV !== 'heroku') {
    grunt.loadNpmTasks('grunt-contrib-watch');
  }

  grunt.registerTask('default', ['watch']);
  grunt.registerTask('test', ['eslint']);
  grunt.registerTask('heroku', ['test']);

};
