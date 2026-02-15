const amqp = require("amqplib");

const QUEUE = "submit_queue";

async function start() {
  try {
    console.log("Connecting to RabbitMQ...");
    const connection = await amqp.connect("amqp://rabbitmq");
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE, { durable: true });

    console.log("Worker connected to RabbitMQ");

    channel.consume(QUEUE, (msg) => {
      if (msg) {
        const start = Date.now();
        while (Date.now() - start < 20) {}
        channel.ack(msg);
      }
    });

  } catch (err) {
    console.error("RabbitMQ not ready. Retrying in 5 seconds...");
    setTimeout(start, 5000);
  }
}

start();
