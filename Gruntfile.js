// usage:
// install node!!!
// npm install -g grunt-cli
// npm install
// grunt

module.exports = function (grunt) {
	var DOC_DIR = 'doc';
	var BUILD_DIR = 'build'

	grunt.initConfig({
		jshint: {
			dev: {
				options: {
					jshintrc: '.jshintrc'
				},
				src: [
					'src/*.js'
				]
			}
		},
		watch: {
			// sources: {
			// 	files: [
			// 		'src/**/*.js',
			// 		'test/**/*.js'
			// 	],
			// 	//tasks: ['jshint'],
			// 	options: {
			// 		interrupt: true,
			// 		livereload: 35729
			// 	}
			// }
			options: {
				interrupt: true,
				livereload: 35729
			},
			scripts: {
				files: [
					'src/**/*.js',
					'test/**/*.js'
				],
				tasks: ['systemjs:build']
			}
		},
		jsdoc: {
			dist: {
				src: ['src/*.js'],
				dest: DOC_DIR
			}
		},
		clean: {
			doc: [DOC_DIR],
			build: [BUILD_DIR],
			test: ['test/specs.js']
		},
		jasmine: {
			testAll: {
				//src: '',
				options: {
					//polyfills: ['src/libs/polyfills.js'],
					vendor: [
						'node_modules/systemjs/dist/system.js'
					],
					//helpers: [''],
					keepRunner: false,
					outfile: 'test/specs.html',
					specs: ['test/specs.js']
				}
			}
		},
		systemjs: {
			build: {
				options: {
					source: 'src/index.js',
					output: BUILD_DIR + '/index.js',
					minify: false,
					sourceMaps: true
				}
			},
			buildmin: {
				options: {
					source: 'src/index.js',
					output: BUILD_DIR + '/index.min.js',
					minify: true,
					sourceMaps: true
				}
			},
			test: {
				options: {
					//config: 'test/systemjs.config.js',
					source: 'test/spec.js',
					output: 'test/specs.js',
					minify: false
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadTasks('custom_modules/grunt-systemjs-builder/tasks');


	grunt.registerTask('live', ['watch']);
	grunt.registerTask('code', ['jshint:dev']);
	grunt.registerTask('doc', ['clean:doc', 'jsdoc']);
	grunt.registerTask('test', ['systemjs:test', 'jasmine', 'clean:test']);
	grunt.registerTask('build', ['clean:build', 'systemjs:build', 'systemjs:buildmin']);
};