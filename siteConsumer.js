import { Connection, Consumer } from 'amqplib-plus'

const connection = new Connection({connectionString: 'amqp://localhost'}, console);
const queue = "sites_to_process";

class CustomConsumer extends Consumer {

	constructor(conn, prepareFn) {
		super(conn, prepareFn, false, console);
	}

	processMessage(msg, channel) {
		// Your own messages process logic
		console.log("Message headers:", JSON.stringify(msg.properties.headers));
		console.log("Message body:", msg.content.toString(), "\n");

		channel.ack(msg);
	}

}

async function runConsumer() {
	await connection.connect();

	const prepareConsumer = async (channel) => {
		await channel.assertQueue(queue, { durable: true});
		await channel.prefetch(5);
	};

	const consumer = new CustomConsumer(connection, prepareConsumer);
	console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

	await consumer.consume(queue, {});
	console.log("Started consuming: %s", queue);

}

export default runConsumer;