// import {createLibp2p} from 'libp2p';
// import Websockets from 'libp2p-websockets';
// import WebRTCStar from 'libp2p-webrtc-star';
// import Mplex from 'libp2p-mplex';
// import {NOISE} from 'libp2p-noise';
// import Relay from 'libp2p-circuit';
//
// async function createRelayNode() {
//     const node = await createLibp2p({
//         modules: {
//             transport: [Websockets, WebRTCStar],
//             streamMuxer: [Mplex],
//             connEncryption: [NOISE],
//             relay: Relay
//         },
//         config: {
//             relay: {
//                 enabled: true,
//                 hop: {
//                     enabled: true,
//                     active: true
//                 }
//             }
//         }
//     });
//
//     await node.start();
//     console.log(`Node started. Peer ID: ${node.peerId.toB58String()}`);
//     node.multiaddrs.forEach(addr => {
//         console.log(`Listening on: ${addr.toString()}/p2p/${node.peerId.toB58String()}`);
//     });
// }
//
// createRelayNode();
