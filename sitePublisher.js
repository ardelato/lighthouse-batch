import { Connection, Publisher} from 'amqplib-plus'
import { readFileSync, } from 'fs';


const connection = new Connection({connectionString: 'amqp://localhost'}, console);
const queue = "sites_to_process";

function runPublisher(){

	connection.connect();

	const preparePublisher = (channel) =>{
		channel.assertQueue(queue,{durable: true});
		channel.assertExchange("test-exchange","x-message-deduplication", {
			durable: true,
			arguments: {
				"x-cache-size": 10,
			}
		});
		channel.bindQueue(queue,"test-exchange",'')
		console.log("Publisher Ready");
	}

	const publisher = new Publisher(connection,preparePublisher);
	
	let sites = readFileSync('./sample_sites.txt','utf8').trim().split('\n');

	let count = 0;

	for(let site of sites) {
		console.log("Sending: " + site);
		publisher.publish("test-exchange",'',Buffer.from(site), {
			headers: {
				"x-deduplication-header": count
			}
		});
		count++;
	}

	console.log(' [x] Sent %s',sites);

	setTimeout(() => {
		connection.close();
		process.exit(0);
	}, 500);
}





export default runPublisher;