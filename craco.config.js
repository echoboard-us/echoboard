module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore source map warnings for node_modules
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /Module Warning \(from \.\/node_modules\/source-map-loader/,
      ];
      return webpackConfig;
    },
  },
}; 