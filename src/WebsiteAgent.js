
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { identify } from '@libp2p/identify';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';

async function setupLibp2p() {
    const libp2p = await createLibp2p({
        transports: [
            tcp(),
            webSockets(),
            circuitRelayTransport()
        ],
        connectionEncryption: [noise()],
        streamMuxers: [yamux()],
        services: {
            identify: identify()
        },
        peerDiscovery: [
            bootstrap({
                list: [
                    '/ip4/136.244.110.156/tcp/42271/p2p/12D3KooWCixWLW5pEtExWpA8Zfo3gJXmsgvSBH1q1XVS9AcfrySy',
                   '/ip4/145.49.97.36/tcp/55122/p2p/12D3KooWR5u3Z4gzosybFN6C3g8X8zJ9UNhV5zWgjGa3eysjGJWi'
                ]
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

setupLibp2p().then(libp2p => {
    console.log('Libp2p has been set up');
    console.log(`Node started with id ${libp2p.peerId.toString()}`);
    console.log('Listening on:');
    libp2p.getMultiaddrs().forEach(addr => {
        console.log(`libp2p node is listening on address ${addr.toString()}`);
    });
});
