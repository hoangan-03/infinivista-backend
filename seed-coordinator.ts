import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedCoordinator() {
  console.log('Starting coordinated seeding process...');
  
  // Connect to RabbitMQ
  const connection = await amqp.connect(
    `amqp://${process.env.RABBITMQ_HOST_NAME}:${process.env.RABBITMQ_PORT}`
  );
  const channel = await connection.createChannel();
  
  try {
    // 1. First seed the user module (central entity)
    console.log('Step 1: Seeding user module...');
    await channel.assertQueue('USER_SEED_QUEUE', { durable: false });
    await channel.sendToQueue('USER_SEED_QUEUE', Buffer.from(JSON.stringify({ command: 'seed', count: 10 })));
    
    // Wait for user module to complete seeding
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 2. Get the created users
    console.log('Step 2: Fetching created users...');
    await channel.assertQueue('USER_EXPORT_QUEUE', { durable: false });
    
    const usersPromise = new Promise<any[]>(resolve => {
      channel.consume('USER_EXPORT_RESULT', (msg) => {
        if (msg) {
          const users = JSON.parse(msg.content.toString());
          channel.ack(msg);
          resolve(users);
        }
      }, { noAck: false });
    });
    
    await channel.sendToQueue('USER_EXPORT_QUEUE', Buffer.from(JSON.stringify({ command: 'export' })));
    const users = await usersPromise;
    
    // 3. Send the user references to other modules
    console.log('Step 3: Distributing user references to other modules...');
    const userReferences = users.map(user => ({
      id: user.id,
      username: user.username,
      profileImageUrl: user.profileImageUrl
    }));
    
    // Send to feed module
    await channel.assertQueue('FEED_SEED_QUEUE', { durable: false });
    await channel.sendToQueue('FEED_SEED_QUEUE', 
      Buffer.from(JSON.stringify({ command: 'seed', userReferences }))
    );
    
    // Send to communication module
    await channel.assertQueue('COMMUNICATION_SEED_QUEUE', { durable: false });
    await channel.sendToQueue('COMMUNICATION_SEED_QUEUE', 
      Buffer.from(JSON.stringify({ command: 'seed', userReferences }))
    );
    
    console.log('Seeding coordination complete!');
  } finally {
    await channel.close();
    await connection.close();
  }
}

seedCoordinator().catch(console.error);