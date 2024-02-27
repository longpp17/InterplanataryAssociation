// Creating a libp2p node with:
//   transport: websockets + tcp
//   stream-muxing: mplex
//   crypto-channel: noise
//   discovery: multicast-dns
//   dht: kad-dht
//   pubsub: gossipsub


// milestones:
// stage 1
// 1. create a libp2p node
// 2. create a always on relay node on the server
// 3. create agent on local machines to default use that relay node as bootstrap node
// 4. connect with other node in other NAT (requires punching holes)
// 5. sending messages
// 6. broadcast messages
// 7. capture local sound
// 8. broadcast sound
// 9. merge sound together


// todo: peer routing

import { createLibp2p } from 'libp2p';
import { bootstrap } from '@libp2p/bootstrap';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from "@chainsafe/libp2p-yamux";
import { webSockets } from '@libp2p/websockets';
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { multiaddr } from '@multiformats/multiaddr';
import { uPnPNAT } from '@libp2p/upnp-nat';
import { autoNAT } from '@libp2p/autonat';
import { webRTCDirect } from '@libp2p/webrtc-direct';
import { webRTC } from '@libp2p/webrtc';
import { tcp} from "@libp2p/tcp";

async function setupLibp2p() {
    const libp2p = await createLibp2p({
        transports: [
            tcp(),
            webRTCDirect(),
            circuitRelayTransport({
                discoverRelays: 2
            })
        ],
        connectionEncryption: [noise()],
        streamMuxers: [yamux],
        services: {
            upnpNAT: uPnPNAT(),
            identify: identify(),
            autoNAT: autoNAT()
        },

        peerDiscovery: [
            bootstrap({
                list: [
                    // a list of bootstrap peer multiaddrs to connect to on node startup
                    // adding relay node in here
                    '/ip4/127.0.0.1/tcp/54323/p2p/12D3KooWHk7WDTK27Bkx2GzB2mfowQvcuU7pHwRByFK6Eo3u5yxn',
                    '/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
                    '/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                    '/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
                ]
            })
        ],
    });

    libp2p.addEventListener('peer:discovery', (evt) => {
        console.log('found peer: ', evt.detail.id.toString());
    });
    libp2p.addEventListener('self:peer:update', (evt) => {
        console.log(`Advertising with a relay address of ${libp2p.getMultiaddrs()[0].toString()}`)
    })

    return libp2p;
}

setupLibp2p().then(libp2p => {
    console.log('Libp2p has been set up')
    // Here you can start libp2p or do other operations with it
    libp2p.getMultiaddrs().forEach(addr => {
        console.log(`libp2p node is listening on address ${addr.toString()}`);
        console.log('Peer Id: ', libp2p.peerId.toString());
    })
});