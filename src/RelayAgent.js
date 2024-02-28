import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { circuitRelayServer } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import { createLibp2p } from 'libp2p';
import { webRTC } from "@libp2p/webrtc";
import { tcp } from "@libp2p/tcp";
import { kadDHT, removePrivateAddressesMapper } from "@libp2p/kad-dht";
import { webRTCDirect } from "@libp2p/webrtc-direct";
const node = await createLibp2p({
    addresses: {
        listen: ['/ip4/0.0.0.0/tcp/0']
        // TODO check "What is next?" section
        // announce: ['/dns4/auto-relay.libp2p.io/tcp/443/wss/p2p/QmWDn2LY8nannvSWJzruUYoLZ4vV83vfCBwd8DipvdgQc3']
    },
    transports: [
        webRTCDirect(),
        webRTC(),
        tcp(),
    ],
    connectionEncryption: [
        noise()
    ],
    streamMuxers: [
        yamux()
    ],
    services: {
        kadDHT: kadDHT({
            protocol: '/ipfs/kad/1.0.0',
            peerInfoMapper: removePrivateAddressesMapper
        }),
        identify: identify(),
        relay: circuitRelayServer()
    }
});
console.log(`Node started with id ${node.peerId.toString()}`);
console.log('Listening on:');
node.getMultiaddrs().forEach((ma) => console.log(ma.toString()));
node.addEventListener('peer:discovery', (evt) => {
    console.log(`Discovered peer: ${evt.detail.id.toString()}`);
});
node.addEventListener('peer:connect', (evt) => {
    console.log(`Connected to peer: ${evt.detail.toString()}`);
});