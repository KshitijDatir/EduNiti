const express = require("express");
const amqp = require("amqplib");

const fs = require("fs");
const path = require("path");
const LOG_PATH = path.join(__dirname, "../request.log");

const app = express();
app.use(express.json());

const QUEUE = "submit_queue";
let channel;

async function connect() {
  try {
    const connection = await amqp.connect("amqp://rabbitmq");
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    console.log("Connected to RabbitMQ");
  } catch (err) {
    console.log("Retrying RabbitMQ connection...");
    setTimeout(connect, 5000);
  }
}

connect();

app.post("/submit", async (req, res) => {
  if (!channel) return res.status(500).send("RabbitMQ not ready");

  const msg = JSON.stringify({
    data: req.body,
    timestamp: Date.now()
  });

  // Log the request
  const logEntry = `[${new Date().toISOString()}] /submit: ${JSON.stringify(req.body)}\n`;
  fs.appendFile(LOG_PATH, logEntry, (err) => { if (err) console.error("Log error:", err); });

  channel.sendToQueue(QUEUE, Buffer.from(msg), { persistent: true });

  res.json({ status: "queued" });
});

app.listen(3000, () => console.log("API running"));
