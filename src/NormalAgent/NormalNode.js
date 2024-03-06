
// todo: peer routing
// DO NOT COMMIT PEER LINK INTO GIT!!!
import { createLibp2p } from 'libp2p';
import { bootstrap } from '@libp2p/bootstrap';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { uPnPNAT } from '@libp2p/upnp-nat';
import { autoNAT } from '@libp2p/autonat';
import { webRTC, webRTCDirect } from '@libp2p/webrtc';
import { tcp } from "@libp2p/tcp";
import { kadDHT, removePrivateAddressesMapper } from "@libp2p/kad-dht";
import { webSockets } from "@libp2p/websockets";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
export async function setupLibp2p(bootstarps = []) {
    const libp2p = await createLibp2p({
        addresses: {
            listen: [
                '/ip4/0.0.0.0/tcp/0'
            ]
        },
        transports: [
            tcp(),
            webRTCDirect(),
            webRTC(),
            webSockets(),
            circuitRelayTransport({
                discoverRelays: 2
            })
        ],
        connectionEncryption: [noise()],
        streamMuxers: [yamux()],
        services: {
            upnpNAT: uPnPNAT(),
            identify: identify(),
            autoNAT: autoNAT(),
            kadDHT: kadDHT({
                protocol: '/ipfs/kad/1.0.0',
                peerInfoMapper: removePrivateAddressesMapper
            }),
            pubsub: gossipsub()
        },
        peerDiscovery: [
            bootstrap({
                list: bootstarps
            })
        ],
    });
    libp2p.addEventListener('peer:discovery', (evt) => {
        console.log('found peer: ', evt.detail.id.toString());
    });
    libp2p.addEventListener('self:peer:update', (evt) => {
        console.log(`Advertising with a relay address of ${libp2p.getMultiaddrs()[0].toString()}`);
    });
    return libp2p;
}
