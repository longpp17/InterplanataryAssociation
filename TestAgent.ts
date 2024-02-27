// import { createLibp2p } from 'libp2p'
// import { webSockets } from '@libp2p/websockets'
// import { noise } from '@chainsafe/libp2p-noise'
// import { yamux } from '@chainsafe/libp2p-yamux'
//
// const node = await createLibp2p({
//     // libp2p nodes are started by default, pass false to override this
//     start: false,
//     addresses: {
//         listen: ['/ip4/127.0.0.1/tcp/8000/ws']
//     },
//     transports: [webSockets()],
//     connectionEncryption: [noise()],
//     streamMuxers: [yamux()]
// })
//
// // start libp2p
// await node.start()
// console.log('libp2p has started')
//
// const listenAddrs = node.getMultiaddrs()
// console.log('libp2p is listening on the following addresses: ', listenAddrs)
//
// // stop libp2p
// await node.stop()
// console.log('libp2p has stopped')

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
    console.log('Libp2p has been set up');
    // Here you can start libp2p or do other operations with it
});
