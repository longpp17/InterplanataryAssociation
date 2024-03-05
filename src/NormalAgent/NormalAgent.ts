import {setupLibp2p} from './NormalNode.js';
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from 'process';
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import record from 'node-record-lpcm16';
import {Libp2p} from "libp2p";
import {RPC} from "@chainsafe/libp2p-gossipsub/message";
import Message = RPC.Message;
import { Readable } from 'stream';

function createAudioStream(): Readable {
    // TODO: Allow selecting devices
    const audioStream: NodeJS.ReadableStream = record.record({
        sampleRate: 16000,
        channels: 2,
    }).stream();

    return audioStream as Readable;
}

const broadcastAudioStream = async (audioStream: any, node: Libp2p<any>) => {
   const topic = 'audio-stream';

    for await (const data of audioStream) {
       node.services.pubsub.publish(topic, data);
   }
}

const getAudioStream = async (node: Libp2p<any>, callback: (msg: Message) => void ) => {
    const topic = 'audio-stream';
    node.services.pubsub.subscribe(topic, (msg: Message) => {
       callback(msg);
    });
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
    const CLInterface = readline.createInterface({input, output})
    const bootstrapLink : string = await CLInterface.question('Enter the bootstrap link: ');

    const clientNode = await setupLibp2p([bootstrapLink]);

    console.log('Libp2p has been set up')
    console.log(`Node started with id ${clientNode.peerId.toString()}`)

    const startBroadcast = await CLInterface.question('As broadcaster or as listener? (b/l): ');
    if (startBroadcast === 'b') {
        const audioStream = createAudioStream();

        retryOperation(() => {
            return broadcastAudioStream(audioStream, clientNode);
        })
            .then(() => {
              console.log('Audio stream broadcasted');
            })
            .catch(console.error)

    }
    else{
        await getAudioStream(clientNode, (msg: Message) => {
            console.log(msg);
        });
    }

    // Cleanup and exit function
    const cleanupAndExit = () => {
        console.log('Cleaning up before exit...');
        // Perform any necessary cleanup here
        CLInterface.close(); // Close the readline interface
        process.exit(); // Exit the process
    };

    // Listen for SIGINT signal (Ctrl+C)
    process.on('SIGINT', cleanupAndExit);

}

main().catch(console.error);