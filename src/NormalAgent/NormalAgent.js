import { setupLibp2p } from './NormalNode.js';
import { Server } from "socket.io";
import { createServer } from "http";
// @ts-ignore
import { subscribeToStream, initAudioStreamToPeer } from "./Libp2pIO.js";
// Creating a libp2p node with:
//   transport: websockets + tcp
//   stream-muxing: mplex
//   crypto-channel: noise
//   discovery: multicast-dns
//   dht: kad-dht
//   pubsub: gossipsub
// milestones:
// stage 1
// 1. create a libp2p node DONE
// 2. create a always on relay node on the server DONE
// 3. create agent on local machines to default use that relay node as bootstrap node DONE
// 4. connect with other node in other NAT (requires punching holes) DONE
// 5. sending messages DONE
// 6. broadcast messages DONE
// 7. capture local sound DONE
// 8. broadcast sound TESTING
// 9. merge sound together
function createAudioIOServer() {
    const httpServer = createServer();
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    httpServer.listen(3000, () => {
        console.log("listening on http://localhost:3000");
    });
    return io;
}
const DIAL_PROTOCOL = '/audio-stream/1.0.0';
const PUSHABLE_AUDIO_STREAMS = [];
const main = async () => {
    const ioServer = createAudioIOServer();
    var clientNode = null;
    ioServer.on("connection", (socket) => {
        console.log("connected");
        socket.on("setup-bootstrap", async (data) => {
            console.log("setup-bootstrap", data);
            clientNode = await setupLibp2p(data);
            await subscribeToStream(clientNode, DIAL_PROTOCOL, (msg) => {
                console.log("recv-audio-buffer", msg);
                ioServer.emit("audio-buffer", msg);
            });
        });
        socket.on("audio-buffer", async (buffer) => {
            console.log("audio-buffer", buffer);
            PUSHABLE_AUDIO_STREAMS.forEach((pushable) => {
                pushable.push(buffer);
            });
            // publish to gossipsub
            // if (clientNode != null) {
            //     publishChunkToGossip(buffer, clientNode);
            // }
            // else{
            //     console.log("failed to publish chunk, client node is null")
            // }
        });
        socket.on("get-peers", async () => {
            if (clientNode != null) {
                const peers = clientNode.getConnections()
                    .map((connection) => {
                    const peerInfo = {
                        peerID: connection.remotePeer.toString(),
                        address: connection.remoteAddr.toString()
                    };
                    return peerInfo;
                });
                console.log("get-peers", peers);
                socket.emit("get-peers", JSON.stringify(peers));
            }
            else {
                console.log("failed to get peers, client node is null");
            }
        });
        socket.on("stream-to-peer", async (peerId) => {
            if (clientNode != null) {
                // setup peer to stream
                const peersToConnect = clientNode.getPeers().filter((peer) => peer.toString() === peerId);
                for (let peer in peersToConnect) {
                    const pushable = await initAudioStreamToPeer(peersToConnect[peer], DIAL_PROTOCOL, clientNode);
                    PUSHABLE_AUDIO_STREAMS.push(pushable);
                }
                // const audioStream = await initAudioStreamToPeer(peer, clientNode);
                // console.log("stream-to-peer", peerId);
                // socket.emit("audio-stream", audioStream);
            }
            else {
                console.log("failed to stream to peer, client node is null");
            }
        });
    });
    const cleanupAndExit = () => {
        console.log('Cleaning up before exit...');
        // Perform any necessary cleanup here
        process.exit(); // Exit the process
    };
    // Listen for SIGINT signal (Ctrl+C)
    process.on('SIGINT', cleanupAndExit);
};
main().catch(console.error);
