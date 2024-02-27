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

import {createLibp2p} from 'libp2p';
import {bootstrap} from '@libp2p/bootstrap';

async function setupLibp2p() {
    const libp2p = await createLibp2p({
        peerDiscovery: [
            bootstrap({
                list: [
                    // a list of bootstrap peer multiaddrs to connect to on node startup
                    '/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
                    '/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                    '/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
                ]
            })
        ]
    });

    libp2p.addEventListener('peer:discovery', (evt) => {
        console.log('found peer: ', evt.detail.id.toString());
    });

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
