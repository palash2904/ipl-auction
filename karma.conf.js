module.exports = function (config) {
  config.set({
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    frameworks: ['jasmine'],
    reporters: ['progress', 'kjhtml'],
    customLaunchers: {
      ChromeHeadlessNoGpu: {
        base: 'ChromeHeadless',
        flags: ['--disable-gpu', '--disable-software-rasterizer', '--no-sandbox'],
      },
    },
  });
};
