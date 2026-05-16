"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getAllArticles, ArticleData } from "@/lib/services/articleService";
import { format } from "date-fns";

const CATEGORIES = ["All", "Guide", "Analysis", "Tips", "News"] as const;
type Category = typeof CATEGORIES[number];

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category>("All");

  useEffect(() => {
    getAllArticles().then(data => {
      setArticles(data);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "All" ? articles : articles.filter(a => a.category === filter);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Articles & Study Guides</h1>
          <p className="text-muted-foreground mt-2">Read insights, analysis, and preparation material for your next MUN.</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-4" />
                <Skeleton className="h-9 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-xl font-medium">No articles found</p>
          <p className="mt-1">Try a different category or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(article => (
            <Card key={article.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{article.title}</CardTitle>
                    <CardDescription>
                      By {article.authorName} &bull;{" "}
                      {article.createdAt
                        ? format(article.createdAt.toDate(), "MMM d, yyyy")
                        : ""}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{article.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {article.excerpt || article.content.slice(0, 200)}
                </p>
                <Link href={`/articles/${article.id}`} className={buttonVariants({ variant: "outline" })}>
                  Read More
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
