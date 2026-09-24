export interface Review {
  id: string;
  quote: string;
  author: string;
}

export interface JournalArticle {
  id: string;
  title: string;
  excerpt: string;
  href: string;
  image?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const reviews: Review[] = [];
export const journalArticles: JournalArticle[] = [];
export const faqs: FaqItem[] = [];
