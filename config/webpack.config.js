const path = require('path')

const OUTPUT_PATH = path.join(__dirname, '../static/dist')
const APP_ENTRY_PATH = path.join(__dirname, '../static/app/index.tsx')

module.exports = {
  entry: APP_ENTRY_PATH,
  target: 'web',
  output: {
    path: OUTPUT_PATH,
    filename: '[name].bundle.js'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx']
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: 'awesome-typescript-loader',
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(svg|png|jpg|jpeg|gif)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: OUTPUT_PATH
        }
      }
    ]
  }
}
