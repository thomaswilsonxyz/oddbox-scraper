import { DynamoDBClient, PutItemCommand, ScanCommand, ScanCommandInput, ScanCommandOutput } from "@aws-sdk/client-dynamodb";
import { IScrapeResult } from "../domain";
import { v4 as uuid } from 'uuid'

export class ScrapeResultDynamoDb {
    private dynamoDbClient: DynamoDBClient;

    constructor(
        awsRegion: string,
        private readonly tableName: string, 
    ) {
        this.dynamoDbClient = new DynamoDBClient({region: awsRegion});
    }

    private static makeId(): string {
        return uuid();
    }

    public async putResultOnDynamoDb (scrapeResult: IScrapeResult): Promise<void> {
        const {title, vegetables, fruits} = scrapeResult;
        const params = {
            TableName: this.tableName,
            Item: {
                title: {S: title},
                vegetables: {S: JSON.stringify(vegetables)},
                fruits: {S: JSON.stringify(fruits)},
                created_at: {S: new Date().toISOString()},
                id: { S: ScrapeResultDynamoDb.makeId() }
            }
        }
        
        const putItemCommand = new PutItemCommand(params);
        await this.dynamoDbClient.send(putItemCommand);
        console.log(`Successfully put ${title} on DynamoDB`)
    }
    
    public async getIsScrapedResultAlreadyPersisted (scrapeResult: IScrapeResult): Promise<boolean> { 
        const {title} = scrapeResult;
        
        const params: ScanCommandInput = {
            TableName: this.tableName,
            IndexName: 'title-index',
            FilterExpression: 'title = :title',
            ExpressionAttributeValues: {
                ':title': {S: title}
            }
        }
    
        const scanCommand = new ScanCommand(params);
        const result: ScanCommandOutput = await this.dynamoDbClient.send(scanCommand);
        return (result.Count ?? 0) > 0;
    }
}