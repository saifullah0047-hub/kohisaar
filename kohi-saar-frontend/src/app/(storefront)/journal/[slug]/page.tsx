import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { notFound } from "next/navigation";
import { API_BASE_URL, absoluteUrl, DEFAULT_DESCRIPTION } from "@/lib/seo";
import { journalArticle } from "@/data/journalArticle";

interface Article { slug: string; title: string; excerpt?: string; body: string; publishedAt?: string; updatedAt?: string }
const getArticle = cache(async (slug: string) => { const response = await fetch(`${API_BASE_URL}/content/articles/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } }).catch(() => null); if (response?.ok) return (await response.json() as { data: Article }).data; return slug === journalArticle.slug ? journalArticle : null; });
function renderBody(body: string) { return body.split(/\n\s*\n/).map((block) => { if (block.startsWith("## ")) return <h2 key={block}>{block.slice(3)}</h2>; if (block.split("\n").every((line) => line.startsWith("- "))) return <ul key={block}>{block.split("\n").map((line) => <li key={line}>{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</li>)}</ul>; return <p key={block}>{block}</p>; }); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const article = await getArticle(slug); if (!article) return { title: "Article unavailable", robots: { index: false, follow: true } }; const description = article.excerpt || DEFAULT_DESCRIPTION; return { title: article.title, description, alternates: { canonical: `/journal/${article.slug}` }, openGraph: { type: "article", title: article.title, description, url: absoluteUrl(`/journal/${article.slug}`) }, twitter: { card: "summary", title: article.title, description } }; }
export const revalidate = 300;
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) { const article = await getArticle((await params).slug); if (!article) notFound(); return <><Navbar /><main className="article-page page-shell"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/journal">Journal</Link><span aria-hidden="true">/</span><span aria-current="page">{article.title}</span></nav><p className="eyebrow">Field notes</p><h1>{article.title}</h1>{article.publishedAt ? <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString("en-US", { dateStyle: "long" })}</time> : null}<p className="article-page__excerpt">{article.excerpt}</p><div className="article-page__body">{renderBody(article.body)}</div></main><Footer /></>; }
