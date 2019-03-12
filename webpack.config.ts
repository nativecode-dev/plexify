import path from 'path'
import { Configuration } from 'webpack'

const config: Configuration = {
  mode: 'production',
  devtool: 'inline-source-map',
  entry: './src/plexify.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'plexify.js',
  },
  resolve: {
    alias: {
      hiredis: path.join(__dirname, 'aliases/hiredis.js'),
    },
    extensions: ['.ts', '.js'],
  },
  target: 'node',
}

export default config
