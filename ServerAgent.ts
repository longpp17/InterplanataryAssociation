// import {createLibp2p} from 'libp2p';
//
//
// import TCP from '@libp2p/tcp';
// import {noise} from '@libp2p/noise';
// import MPLEX from '@libp2p/mplex';
// import Bootstrap from '@libp2p/bootstrap';
//
// async function createNode() {
//     const node = await createLibp2p({
//         addresses: {
//             listen: ['/ip4/0.0.0.0/tcp/0']
//         },
//         modules: {
//             transport: [TCP],
//             connEncryption: [noise],
//             streamMuxer: [MPLEX]
//         },
//         config: {
//             peerDiscovery: {
//                 bootstrap: {
//                     enabled: true,
//                     list: [
//                         '/ip4/.../tcp/.../p2p/Qm...'
//                     ]
//                 }
//             }
//         }
//     });
//
//     await node.start();
//     console.log(`Node started with peer ID ${node.peerId.toB58String()}`);
//     node.multiaddrs.forEach(addr => {
//         console.log(`Listening on ${addr.toString()}/p2p/${node.peerId.toB58String()}`)
//     });
// }
//
// createNode();
