"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  getArticleById, getArticleComments, addComment,
  ArticleData, CommentData
} from "@/lib/services/articleService";
import { format } from "date-fns";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.articleId as string;
  const { user, profile } = useAuth();

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const [art, comms] = await Promise.all([
        getArticleById(articleId),
        getArticleComments(articleId),
      ]);
      setArticle(art);
      setComments(comms);
      setLoading(false);
    }
    load();
  }, [articleId]);

  async function handleComment() {
    if (!user || !commentText.trim()) return;
    setSubmitting(true);
    const newComment: Omit<CommentData, "id" | "createdAt"> = {
      articleId,
      authorId: user.uid,
      authorName: profile?.displayName || user.displayName || "Anonymous",
      authorPhotoURL: user.photoURL || undefined,
      text: commentText.trim(),
    };
    const id = await addComment(articleId, newComment);
    setComments(prev => [...prev, { ...newComment, id, createdAt: undefined }]);
    setCommentText("");
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 max-w-3xl space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <div className="space-y-3 mt-8">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto py-20 text-center text-muted-foreground">
        <p className="text-xl font-medium">Article not found.</p>
        <Link href="/articles" className="text-primary underline mt-4 block">Back to Articles</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{article.category}</Badge>
          {article.tags?.map(tag => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">{article.title}</h1>

        <div className="flex items-center gap-3 mb-8 pb-8 border-b border-border/50">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/20 text-primary font-medium">
              {article.authorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{article.authorName}</p>
            <p className="text-xs text-muted-foreground">
              {article.createdAt ? format(article.createdAt.toDate(), "MMMM d, yyyy") : ""}
            </p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {article.content}
        </div>
      </motion.article>

      {/* Comments */}
      <div className="mt-16 pt-8 border-t border-border/50">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          Comments ({comments.length})
        </h2>

        {user ? (
          <div className="mb-8 space-y-3">
            <Textarea
              placeholder="Share your thoughts..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              rows={3}
            />
            <Button onClick={handleComment} disabled={submitting || !commentText.trim()}>
              {submitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        ) : (
          <div className="mb-8 p-4 rounded-xl border border-border/50 bg-secondary/20 text-center">
            <p className="text-muted-foreground text-sm">
              <Link href="/login" className="text-primary font-medium hover:underline">Log in</Link>
              {" "}to leave a comment.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No comments yet. Be the first!</p>
          ) : (
            comments.map(comment => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 p-4 rounded-xl bg-secondary/20 border border-border/30"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                    {comment.authorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{comment.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {comment.createdAt ? format(comment.createdAt.toDate(), "MMM d, yyyy") : "just now"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80">{comment.text}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
