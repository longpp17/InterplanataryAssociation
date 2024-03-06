import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { circuitRelayServer } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import { webSockets } from '@libp2p/websockets';
import { createLibp2p } from 'libp2p';
import { tcp } from "@libp2p/tcp";
import { uPnPNAT } from '@libp2p/upnp-nat';
import { kadDHT } from "@libp2p/kad-dht";
import { createEd25519PeerId, createFromProtobuf, exportToProtobuf } from "@libp2p/peer-id-factory";
import { webRTCDirect } from "@libp2p/webrtc";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import * as fs from 'fs';
const configPath = './config.json';
const loadOrCreateConfig = async (path) => {
    if (fs.existsSync(path)) {
        console.log('Loading config from', path);
        return JSON.parse(fs.readFileSync(path, 'utf-8'));
    }
    else {
        console.log('Creating config at', path);
        const peerId = await createEd25519PeerId();
        const peerIdBuf = exportToProtobuf(peerId);
        const peerIdBase64 = Buffer.from(peerIdBuf).toString('base64'); // Convert to base64
        const addresses = [
            '/ip4/0.0.0.0/tcp/9090',
            '/ip4/0.0.0.0/tcp/10000/ws',
            // Add WebRTC & WebRTC Direct addresses here
        ];
        console.log('Peer ID:', peerId);
        const config = {
            peerId: peerIdBase64,
            addresses
        };
        fs.writeFileSync(path, JSON.stringify(config, null, 2));
        return config;
    }
};
const config = await loadOrCreateConfig(configPath);
const createNode = async (config) => {
    const peerIDBuf = Buffer.from(config.peerId, 'base64');
    const peerID = await createFromProtobuf(peerIDBuf);
    return await createLibp2p({
        peerId: peerID,
        addresses: {
            listen: config.addresses
        },
        transports: [
            webRTCDirect(),
            tcp(),
            webSockets()
        ],
        connectionEncryption: [
            noise()
        ],
        streamMuxers: [
            yamux()
        ],
        services: {
            kadDHT: kadDHT({
                clientMode: false,
                kBucketSize: 20,
            }),
            upnpNAT: uPnPNAT(),
            identify: identify(),
            relay: circuitRelayServer(),
            pubsub: gossipsub()
        }
    });
};
const main = async () => {
    const node = await createNode(config);
    console.log(`Node started with id ${node.peerId.toString()}`);
    console.log('Listening on:');
    node.getMultiaddrs().forEach((ma) => console.log(ma.toString()));
    node.addEventListener('peer:discovery', (evt) => {
        console.log(`Discovered peer: ${evt.detail.id.toString()}`);
    });
    node.addEventListener('peer:connect', (evt) => {
        console.log(`Connected to peer: ${evt.detail.toString()}`);
    });
    // @ts-ignore
    node.services.pubsub.subscribe('audio-stream');
    // @ts-ignore
    node.services.pubsub.addEventListener('message', (message) => {
        console.log('Received message:', message);
    });
    // node.services.pubsub.addEventListener('message', (message) => {
    //
    // });
};
main().catch(console.error);
