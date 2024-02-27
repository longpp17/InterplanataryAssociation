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
            "http": path.resolve("stream-http"),
            "https": path.resolve("https-browserify"),
            "os": path.resolve("os-browserify/browser"),
            "path": path.resolve("path-browserify"),
            "stream": path.resolve(__dirname, 'node_modules/stream-browserify'),
            "buffer": path.resolve(__dirname, 'node_modules/buffer'),
            "createLibp2p": path.resolve(__dirname, 'node_modules/libp2p'),
            "bootstrap": path.resolve(__dirname, 'node_modules/@libp2p/bootstrap'),
            "noise": path.resolve(__dirname, 'node_modules/@chainsafe/libp2p-noise'),
            "yamux": path.resolve(__dirname, 'node_modules/@chainsafe/libp2p-yamux'),
            "circuitRelayServer": path.resolve(__dirname, 'node_modules/@libp2p/circuit-relay-v2'),
            "identify": path.resolve(__dirname, 'node_modules/@libp2p/identify'),
            "tcp": path.resolve(__dirname, 'node_modules/@libp2p/tcp'),
            "uPnPNAT": path.resolve(__dirname, 'node_modules/@libp2p/upnp-nat'),
            "autoNAT": path.resolve(__dirname, 'node_modules/@libp2p/autonat'),
            "webRTC": path.resolve(__dirname, 'node_modules/@libp2p/webrtc'),

        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
    mode: 'development',
};
