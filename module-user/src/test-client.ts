import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';
import {v4 as uuidv4} from 'uuid';

// Load environment variables
dotenv.config();

// Configure RabbitMQ connection
const rabbitMqHost = process.env.RABBITMQ_HOST_NAME || 'localhost';
const rabbitMqPort = process.env.RABBITMQ_PORT || '5672';
const queueName = process.env.USER_QUEUE_NAME || 'user_queue';

async function testUserMicroservice() {
    console.log('Starting test client for User Microservice...');
    console.log(`Connecting to RabbitMQ at ${rabbitMqHost}:${rabbitMqPort}`);

    try {
        // Connect to RabbitMQ
        const connection = await amqp.connect(`amqp://${rabbitMqHost}:${rabbitMqPort}`);
        const channel = await connection.createChannel();

        // Create response queue with unique name for this client
        const replyQueueName = `response_queue_${uuidv4()}`;
        await channel.assertQueue(replyQueueName, {exclusive: true});

        console.log(`Created response queue: ${replyQueueName}`);

        // Listen for responses
        channel.consume(replyQueueName, (msg) => {
            if (msg) {
                const response = JSON.parse(msg.content.toString());
                console.log('Received response:');
                console.log(JSON.stringify(response, null, 2));
                channel.ack(msg);
            }
        });

        // Select test to run
        const testFunction = process.argv[2] || 'getUser';
        const userId = process.argv[3] || 'some-user-id'; // Supply your own user ID as argument

        // Run selected test
        switch (testFunction) {
            case 'getUser':
                await testGetUser(channel, replyQueueName, userId);
                break;
            case 'getUserEvents':
                await testGetUserEvents(channel, replyQueueName, userId);
                break;
            case 'updateBio': {
                const bio = process.argv[4] || 'This is a test biography';
                await testUpdateBiography(channel, replyQueueName, userId, bio);
                break;
            }
            case 'addEvent': {
                const event = process.argv[4] || 'Test Event Trigger';
                await testAddUserEvent(channel, replyQueueName, userId, [event]);
                break;
            }
            default:
                console.log(`Unknown test function: ${testFunction}`);
                await connection.close();
                process.exit(1);
        }

        console.log('Test message sent. Waiting for response...');

        // Keep the connection open for responses
        setTimeout(() => {
            console.log('Closing connection after timeout');
            connection.close();
            process.exit(0);
        }, 10000); // Wait 10 seconds for response
    } catch (error) {
        console.error('Error testing microservice:', error);
        process.exit(1);
    }
}

async function testGetUser(channel: amqp.Channel, replyQueue: string, userId: string) {
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify({pattern: 'GetByIdUserCommand', data: {id: userId}})), {
        replyTo: replyQueue,
    });
}

async function testGetUserEvents(channel: amqp.Channel, replyQueue: string, userId: string) {
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify({pattern: 'GetUserEventsUserCommand', data: {userId}})), {
        replyTo: replyQueue,
    });
}

async function testUpdateBiography(channel: amqp.Channel, replyQueue: string, userId: string, biography: string) {
    channel.sendToQueue(
        queueName,
        Buffer.from(JSON.stringify({pattern: 'UpdateBiographyUserCommand', data: {userId, biography}})),
        {replyTo: replyQueue}
    );
}

async function testAddUserEvent(channel: amqp.Channel, replyQueue: string, userId: string, events: string[]) {
    channel.sendToQueue(
        queueName,
        Buffer.from(JSON.stringify({pattern: 'UpdateUserEventsUserCommand', data: {userId, events}})),
        {replyTo: replyQueue}
    );
}

// Run the test client
testUserMicroservice();
