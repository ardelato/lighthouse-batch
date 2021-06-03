import { Connection, Publisher} from 'amqplib-plus'
import { readFileSync, existsSync, appendFileSync } from 'fs';
import { join, resolve, dirname } from 'path';


const connection = new Connection({connectionString: 'amqp://localhost'});
const queue = "sites_to_process";
const msgContent = "HelloWorld";

function runPublisher() {
	connection.connect();

	// Method to be called before instance is created and after every connection auto-reconnect
	const preparePublisher = (channel) => {
		channel.assertQueue(queue, { durable: true });
		console.log("Publisher ready");
	};

	// Creates the instance
	const publisher = new Publisher(connection, preparePublisher);

	let sites = readFileSync('./sample_sites.txt','utf8').trim().split('\n');

	for(let site of sites) {
		// Send messages to message broker
		console.log("Sending: " + site);
		publisher.sendToQueue(queue, Buffer.from(site), { persistent: true
    	});
	}

	console.log(' [x] Sent %s',sites);

	setTimeout(() => {
		connection.close();
		process.exit(0);
	}, 500);
}

export default runPublisher;