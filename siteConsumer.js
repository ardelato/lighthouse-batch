import { Connection, Consumer } from 'amqplib-plus'

const connection = new Connection({connectionString: 'amqp://localhost'}, console);
const queue = "sites_to_process";
const msgContent = "HelloWorld";

/*
 *
 * Using Custom consumer example
 *
 */

async function runCustomConsumer() {
	await connection.connect();

	const prepareConsumer = (ch) => {
		ch.assertQueue(queue, { durable: false });
		ch.prefetch(5);
	};

	const customConsumer = new CustomConsumer(connection, prepareConsumer);
	await customConsumer.consume("my-queue", {});

	console.log("Started consuming 'my-queue'");
}

runCustomConsumer();