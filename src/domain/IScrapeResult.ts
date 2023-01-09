export interface IScrapeResult {
    title: string,
    vegetables: string[],
    fruits: string[]

    toJson(): string
    toPlainText(): string
}

