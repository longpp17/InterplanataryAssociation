import path from 'path';
import webpack from 'webpack';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export default {
    entry: './src/NormalAgent.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
        fallback: {
            "stream": path.resolve(__dirname, 'node_modules/stream-browserify'),
            "buffer": path.resolve(__dirname, 'node_modules/buffer'),
            "createLibp2p": path.resolve(__dirname, 'node_modules/libp2p'),
            "bootstrap": path.resolve(__dirname, 'node_modules/@libp2p/bootstrap')
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
    mode: 'development',
};
