import { SendEmailCommand, SendEmailCommandInput, SES } from '@aws-sdk/client-ses'
import { IScrapeResult }from '../domain'

export class EmailNotifier {
    private ses: SES;

    constructor(region: string, private readonly fromEmailAddress: string, private readonly replyToEmailAddress: string) {
        this.ses = new SES({region});
    }

    public async sendUpcomingDeliveryNotification(
        toEmailAddress: string,
        scrapeResult: IScrapeResult
    ): Promise<void> {
        const sendEmailCommand: SendEmailCommandInput = {
            Destination: {
                ToAddresses: [toEmailAddress],
            },
            Source: this.fromEmailAddress, 
            ReplyToAddresses: [this.replyToEmailAddress],
            Message: {
                Body: {
                    Text: {
                        Data: scrapeResult.toPlainText(),
                    },
                },
                Subject: {
                    Data: 'Upcoming Oddbox Delivery',
                },
            }
        };

        await this.ses.send(new SendEmailCommand(sendEmailCommand));
    }

}