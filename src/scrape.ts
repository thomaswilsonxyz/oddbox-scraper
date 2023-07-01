import axios from 'axios'
import { load as cheerioLoad, Element } from 'cheerio'
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
    const pageTitle = $('h1').first().text().replace(`ODDBOX contents`, 'oddbox:').trim();

    const allChildren = $('h2:contains("Small")').parent().children('p').toArray()
    const allChildrenAsText = allChildren.map((element: Element) => $(element).text()).filter((text) => text.trim().length > 0)

    interface ProcessingResult { fruits: string[], vegetables: string[], currentlyFinding: 'fruits' | 'vegetables'}
    const processingResult: ProcessingResult = {
        currentlyFinding: 'vegetables',
        fruits: [],
        vegetables: [],
    }
    
	allChildrenAsText.forEach((text: string) => {
        const textAsLowercase = text.toLowerCase()
        const vegetablesHeader = 'vegetables'
        const fruitsHeader = 'fruits'
        if (textAsLowercase === vegetablesHeader) {
            processingResult.currentlyFinding = 'vegetables'
            return;
        } else if (textAsLowercase === fruitsHeader) {
            processingResult.currentlyFinding = 'fruits'
            return;
        } 
        
        if (processingResult.currentlyFinding === 'vegetables') {
            processingResult.vegetables.push(text)
        } else if (processingResult.currentlyFinding === 'fruits') {
            processingResult.fruits.push(text)
        }
    });
    
    return new ScrapeResult({
        title: pageTitle,
        vegetables: processingResult.vegetables,
        fruits: processingResult.fruits,
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

/** Cowboy Debug Mode 🤠 */
// async function main() {
//     const resultsOne = await scrapeUpcomingOddboxPage('https://www.oddbox.co.uk/box-contents1')
//     const resultsTwo = await scrapeUpcomingOddboxPage('https://www.oddbox.co.uk/box-contents2')

//     console.log(resultsOne.toJson())
//     console.log(resultsTwo.toJson())
// }

// main()
//     .then(() => console.log('Done'))
//     .then(() => process.exit(0))
//     .catch((err) => console.error(err))