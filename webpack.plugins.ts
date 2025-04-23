import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path'
const assets = ['assets'];

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
  new CopyWebpackPlugin(
    {
      patterns: assets.map((asset) => ({
        from: path.resolve(__dirname, 'src', asset),
        to: path.resolve(__dirname, '.webpack/renderer', asset)
      }))
    }
  ),
  new CopyWebpackPlugin(
    {
      patterns: assets.map((asset) => ({
        from: path.resolve(__dirname, asset),
        to: path.resolve(__dirname, '.webpack/main', asset)
      }))
    }
  )
];
