import { IScrapeResult } from "./IScrapeResult";

interface IScrapeResultParams {
    title: string,
    vegetables: string[],
    fruits: string[]
}


export class ScrapeResult implements IScrapeResult {
    readonly title: string;
    readonly vegetables: string[];
    readonly fruits: string[];


    

    constructor({title, vegetables, fruits}: IScrapeResultParams) {
        this.title = title;
        this.vegetables = vegetables;
        this.fruits = fruits;
    }

    static fromJson(json: string): ScrapeResult {
        const {title, vegetables, fruits} = JSON.parse(json);
        return new ScrapeResult({title, vegetables, fruits});
    }

    toJson(): string {
        return JSON.stringify({
            title: this.title,
            vegetables: this.vegetables,
            fruits: this.fruits
        });
    }

    toPlainText(): string {
        const lines: string[] = [
            `Upcoming Oddbox Delivery: ${this.title}.`,
            '',
            '*Vegetables*:',
            ...this.vegetables.map((vegetable) => `- ${vegetable}`),
            '',
            '*Fruits*:',
            ...this.fruits.map((fruit) => `- ${fruit}`),
        ]
        
        return lines.join('\n');
    }
}