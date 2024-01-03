const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const projectConfig = require('./project.config')
const { Glob } = require('glob')

const { buildPath } = projectConfig

const setMPA = () => {
  const entry = {}
  const htmlWebpackPlugins = []
  const g = new Glob('./src/pages/*/*.ts', {})
  for (const file of g) {
    const dirName = path.dirname(file, '.ts')
    const fileNames = dirName.split('\\')
    const fileName = fileNames[fileNames.length - 1]
    entry[fileName] = path.resolve(__dirname, `../${file}`)
    htmlWebpackPlugins.push(
      new HtmlWebpackPlugin({
        template: path.join(__dirname, `../src/pages/${fileName}/index.html`),
        filename: `${fileName}.html`,
        chunks: [fileName],
        minify: false
      })
    )
  }
  return {
    entry,
    htmlWebpackPlugins
  }
}

const { entry, htmlWebpackPlugins } = setMPA()

module.exports = (mode) => {
  const devMode = mode === 'development'
  return {
    entry: entry,
    output: {
      path: path.resolve(__dirname, buildPath),
      filename: devMode
        ? 'js/[name]/[name].js'
        : 'js/[name]/[name].[contenthash].js'
    },
    module: {
      rules: [
        {
          test: /\.ts$/, // 匹配以.ts结尾的文件
          exclude: /node_modules/, // 排除node_modules目录下的文件
          use: 'ts-loader' // 使用ts-loader处理TypeScript代码
        },
        {
          test: /\.js$/,
          exclude: [/node_modules/],
          loader: 'swc-loader'
        },
        {
          test: /\.html$/i,
          loader: 'html-loader'
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            'style-loader',
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                esModule: false
              }
            },
            {
              loader: 'css-loader',
              options: {
                url: false
              }
            },
            'postcss-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.svg|eot|ttf|woff|woff2$/,
          type: 'asset/inline'
        },

        {
          test: /\.(png|svg|jpg|jpeg|gif|mov|mp4|webmanifest|ico|xml)$/i,
          type: 'asset/resource',
          generator: {
            filename: (name) => {
              const path = name.filename.split('/').slice(1, -1).join('/')
              return `./${path}/[name][ext]`
            }
          }
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: devMode ? './css/style.css' : './css/style.[contenthash].css',
        chunkFilename: devMode ? '[id].css' : '[id].[contenthash].css'
      }),
      new CopyPlugin({
        patterns: [
          { from: './src/fonts', to: 'fonts' },
          {
            from: './public/static',
            to: 'static'
          }
        ]
      })
    ].concat(htmlWebpackPlugins)
  }
}
