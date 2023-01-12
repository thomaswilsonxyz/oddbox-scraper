import { DeleteMessageCommand, DeleteMessageCommandOutput } from '@aws-sdk/client-sqs';
import { SQS } from '@aws-sdk/client-sqs';
import { SQSHandler } from 'aws-lambda'
import { ScrapeResult } from './domain';
import { EmailNotifier, ScrapeResultDynamoDb } from './aws-services'

const deleteMessageFromSqs = async(sqs: SQS, queueUrl: string, receiptHandle: string): Promise<void> => { 
    console.log(`Deleting with receiptHandle '${receiptHandle}' message from SQS queue`)
    await sqs.send(new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
    }))
}

interface IEnvironmentVariables {
    AWS_REGION: string,
    DYNAMODB_TABLE_NAME: string,
    SQS_QUEUE_URL: string,
    EMAIL_ADDRESS_FROM: string,
    EMAIL_ADDRESS_TO: string,
    EMAIL_ADDRESS_REPLY_TO: string
}

export const handler: SQSHandler = async(event) => {
    const { 
        AWS_REGION, 
        DYNAMODB_TABLE_NAME, 
        SQS_QUEUE_URL,
        EMAIL_ADDRESS_FROM,
        EMAIL_ADDRESS_TO,
        EMAIL_ADDRESS_REPLY_TO
     } = process.env as any as IEnvironmentVariables;

    const sqs = new SQS({region: process.env.AWS_REGION });
    const emailNotifier = new EmailNotifier(AWS_REGION, EMAIL_ADDRESS_FROM, EMAIL_ADDRESS_REPLY_TO);
    const scrapeResultDynamoDb = new ScrapeResultDynamoDb(AWS_REGION, DYNAMODB_TABLE_NAME);

    console.log(`Received ${event.Records.length} ${event.Records.length === 1 ? 'message' : 'messages'}`)
    
    for (const record of event.Records) {
        try {
            const scrapeResult = ScrapeResult.fromJson(record.body);
            
            console.log(`Found Scrape Result with title: ${scrapeResult.title}`)
    
            const hasAlreadyBeenPersisted = await scrapeResultDynamoDb.getIsScrapedResultAlreadyPersisted(scrapeResult);
    
            if (!hasAlreadyBeenPersisted) {
                console.log(`Persisting ${scrapeResult.title} to DynamoDB`)
                await scrapeResultDynamoDb.putResultOnDynamoDb(scrapeResult);
                await emailNotifier.sendUpcomingDeliveryNotification(EMAIL_ADDRESS_TO, scrapeResult);
            } else {
                console.log(`Skipping ${scrapeResult.title} as it has already been persisted`)
            }
        } catch (e) {
            console.error(`Error while processing record with body: ${JSON.stringify(record.body)}`)
            console.error(e)
        }
        

        await deleteMessageFromSqs(sqs, SQS_QUEUE_URL, record.receiptHandle);
    }
}