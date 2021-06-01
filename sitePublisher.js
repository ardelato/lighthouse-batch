import { Connection, Publisher} from 'amqplib-plus'

const connection = new Connection({connectionString: 'amqp://localhost'});
const queue = "sites_to_process";
const msgContent = "HelloWorld";

function run() {
	connection.connect();

    console.log('Now preparing Publisher')
	// Method to be called before instance is created and after every connection auto-reconnect
	const preparePublisher = (channel) => {
		channel.assertQueue(queue, { durable: true });
		console.log("Publisher ready");
	};

	// Creates the instance
	const publisher = new Publisher(connection, preparePublisher);

	// Send messages to message broker
	publisher.sendToQueue(queue, Buffer.from(msgContent), { persistent: true
    });
	console.log(' [x] Sent %s',msgContent);
}

export default run;