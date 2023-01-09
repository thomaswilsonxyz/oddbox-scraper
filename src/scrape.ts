import axios from 'axios'
import { load as cheerioLoad } from 'cheerio'
import { SQS } from '@aws-sdk/client-sqs'
import { ScrapeResult} from './domain'

const putResultOnSqsQueue = async (
    sqsClient: SQS,
    scrapeResult: ScrapeResult,
    queueUrl: string,
    ): Promise<void> => {

    await sqsClient.sendMessage({
        QueueUrl: queueUrl,
        MessageBody: scrapeResult.toJson(),
    });
}

export async function scrapeUpcomingOddboxPage(url: string): Promise<ScrapeResult> {
    const response = await axios.get(url)

    const htmlText = response.data
    const $ = cheerioLoad(htmlText)
    const pageTitle = $('h1').first().text()

    const [vegetables, fruit] = $('h2:contains("Small")').parent().children('p').toArray()
    const vegetablesArray = $(vegetables).text().split(', ')
    const fruitArray = $(fruit).text().split(', ')

    return new ScrapeResult({
        title: pageTitle,
        vegetables: vegetablesArray,
        fruits: fruitArray
    })
}    

export const handler = async() => {
    console.log('Scraping Oddbox')
    const { AWS_REGION, SQS_QUEUE_URL } = process.env as any;
    const sqs = new SQS({region: AWS_REGION});
    const resultsOne = await scrapeUpcomingOddboxPage('https://www.oddbox.co.uk/box-contents1')
    const resultsTwo = await scrapeUpcomingOddboxPage('https://www.oddbox.co.uk/box-contents2')

    await putResultOnSqsQueue(sqs, resultsOne, SQS_QUEUE_URL)
    await putResultOnSqsQueue(sqs, resultsTwo, SQS_QUEUE_URL)
}


