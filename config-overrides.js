
module.exports = (webpackConfig, env) => {
  
  webpackConfig.module.rules.push({
    test: /\.glsl$/,
    type: 'asset/source',
  });
  return webpackConfig;
};
