import {Libp2p} from "libp2p";
import {RPC} from "@chainsafe/libp2p-gossipsub/message";
import Message = RPC.Message;
import {PeerId} from "@libp2p/interface" ;
import {Uint8ArrayList} from "uint8arraylist";
import {pipe} from "it-pipe";
import { pushable, Pushable } from 'it-pushable';
// @ts-ignore


export function publishToGossip(topic: String, data: any, node: Libp2p<any>){
    node.services.pubsub.publish(topic, data)
        .catch((error: any) => { // Catching the error from the asynchronous operation
            console.error('Error publishing to topic:', error);
        });
}

// async function sendDataToMultiplePeers(peers: Multiaddr[], data: any, node: Libp2p<any>){
//     try{
//         const {stream} = await node.dialProtocol(peers[0], '/audio-stream');
//         await stream.write(data);
//     } catch (error){
//         console.log("failed to send data to multiple peers", error)
//     }
// }

export function subscribeToGossipSub(topic: String, node: Libp2p<any>, callback: (msg: Message) => void){
    node.services.pubsub.subscribe(topic);
    node.services.pubsub.addEventListener('message', (message: any) => {
        if (topic === message.detail.topic) {
            callback(message.detail.data);
        }
    })
}

export async function subscribeToStream(node: Libp2p<any>,dial_protocol: string, callback: (msg: Uint8ArrayList) => void){
    await node.handle(dial_protocol, async ({stream}) => {
        await pipe(
            stream.source,
            async (source: any) => {
                for await (const chunk of source) {
                    // Emit the audio chunk to all connected Socket.IO clients
                    callback(chunk)
                }
            }
        );
    });
}


// Function to initialize a streaming connection to a specific peer
// and return a pushable stream that you can use to send audio data continuously
export async function initAudioStreamToPeer(peerId: PeerId, dial_protocol: string, node: Libp2p<any>): Promise<Pushable<Uint8Array>> {

    // Dial the peer using the audio stream protocol
    const  stream  = await node.dialProtocol(peerId, dial_protocol, {runOnTransientConnection: true});
    console.log("dialed peer", peerId.toString())
    // Create a pushable stream where you can push audio data chunks
    const audioDataStream: Pushable<Uint8Array> = pushable();

    // Use the pipe utility to send audio data through the stream
    pipe(
        audioDataStream,
        consumeSource,
        // The stream is already in the correct format, so we can directly pipe it
        stream.sink
    ).catch(err => {
        console.error('Stream error:', err);
        audioDataStream.end(err);
    });



    // Return the pushable stream so you can push audio data to it later
    return audioDataStream;
}

export async function* consumeSource(source: any ) {
    // for test
    for await (const chunk of source) {
        console.log("chunk", chunk)
        yield chunk;
    }
}


export function publishChunkToGossip(chunk: any,  node: Libp2p<any>){
    publishToGossip('audio-stream', chunk, node);
}

export function getAudioStreamFromGossip(node: Libp2p<any> | null, callback: (msg: Message) => void )  {
    console.log("subscribe to audio stream")
    if (node != null) {
        subscribeToGossipSub('audio-stream', node, callback);
    }
    else{
        console.log("failed to subscribe to audio stream, client node is null")
    }
}

export async function setupStreamWithPeers(node: Libp2p<any>, peerid: string, dial_protocol: string ): Promise<Pushable<Uint8Array>[]>{
    const promises: Promise<Pushable<Uint8Array>>[] = node.getPeers()
        .filter((peer) => peer.toString() === peerid)
        .map(async peerid => {
            return await initAudioStreamToPeer(peerid, dial_protocol, node)
        });

    return await Promise.all(promises);
}

let retryOperation: (operation: () => any, maxAttempts?: number, delay?: number) => Promise<any>;
retryOperation = async (operation: () => any, maxAttempts = 5, delay = 1000) => {
    try {
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