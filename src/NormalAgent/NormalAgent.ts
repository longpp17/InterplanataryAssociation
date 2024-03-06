import {setupLibp2p} from './NormalNode.js';
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from 'process';
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import record from 'node-record-lpcm16';
import {Libp2p} from "libp2p";
import {RPC} from "@chainsafe/libp2p-gossipsub/message";
import Message = RPC.Message;
import { Readable } from 'stream';
import { Server } from "socket.io";
import { createServer } from "http";
import {Libp2pNode} from "libp2p/libp2p";

function createAudioIOServer(): Server {
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

// deprecated
function createAudioStream(): Readable {
    // TODO: Allow selecting devices
    const audioStream: NodeJS.ReadableStream = record.record({
        sampleRate: 16000,
        channels: 2,
        // device: 'MacBook Pro Microphone'
    }).stream();
    return audioStream as Readable;
}

// deprecated
const broadcastAudioStream =  (audioStream: Readable, node: Libp2p<any>) => {
    audioStream
        .on('data', (chunk) => {
            publishChunk(chunk, node);
        })
}

function publishChunk(chunk: any,  node: Libp2p<any>){
    const topic = 'audio-stream';
    node.services.pubsub.publish(topic, chunk)
        .catch((error: any) => { // Catching the error from the asynchronous operation
            console.error('Error publishing to topic:', error);
        });
}




const getAudioStream =  (node: Libp2p<any> | null, callback: (msg: Message) => void ) => {
    console.log("subscribe to audio stream")
    if (node != null) {
        const topic = 'audio-stream';
        node.services.pubsub.subscribe(topic);
        node.services.pubsub.addEventListener('message', (message: any) => {
            if (topic === message.detail.topic) {
                callback(message.detail.data);
            }
        })
    }
}

let retryOperation: (operation: () => any, maxAttempts?: number, delay?: number) => Promise<any>;
retryOperation = async (operation: () => any, maxAttempts = 5, delay = 1000) => {
    try {
        // Attempt the operation
        return await operation();
    } catch (error) {
        console.error(error);
        if (maxAttempts <= 1) {
            throw error; // Rethrow error after max attempts reached
        }
        // Wait for a delay before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        // Retry with one less attempt and double the delay
        return retryOperation(operation, maxAttempts - 1, delay * 2);
    }
};



const main = async () => {
    const ioServer = createAudioIOServer();
    var clientNode : Libp2p | null = null;

    ioServer.on("connection", (socket) => {
        console.log("connected")
        socket.on("setup-bootstrap", async (data: string[]) => {
            console.log("setup-bootstrap", data);
            clientNode = await setupLibp2p(data);
        })
        socket.on("audio-buffer", async (buffer: any) => {
            console.log("audio-buffer", buffer)
            if (clientNode != null) {
                publishChunk(buffer, clientNode);
            }
        })
        getAudioStream(clientNode, (msg: Message) => {
            ioServer.emit("audio-buffer", msg.data);
        })

    })




    // ioServer.on("setup-bootstrap",  async (data: string[]) => {
    //     console.log("setup-bootstrap", data);
    //
    //     const clientNode = await setupLibp2p(data);
    //
    //     await retryOperation(async () => {
    //         publishToNet(ioServer, clientNode);
    //     })
    //
    //     await getAudioStream(clientNode, (msg: Message) => {
    //         ioServer.emit("audio-buffer", msg.data);
    //     });
    // })

    const cleanupAndExit = () => {
        console.log('Cleaning up before exit...');
        // Perform any necessary cleanup here
        process.exit(); // Exit the process
    };

    // Listen for SIGINT signal (Ctrl+C)
    process.on('SIGINT', cleanupAndExit);

}

main().catch(console.error);