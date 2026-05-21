"use client";

import { MessageSquare, Check, X, Trash2, ArrowLeft, Loader2, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { getComments, deleteComment, updateCommentStatus } from "./actions";
import Link from "next/link";

export default function AdminComments() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dbSource, setDbSource] = useState("");

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    setLoading(true);
    const res = await getComments();
    if (res.success) {
      setComments(res.data);
      setDbSource(res.source || "mock");
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (commentId: string, newStatus: string) => {
    setUpdatingId(commentId);
    const res = await updateCommentStatus(commentId, newStatus);
    if (res.success) {
      setComments(comments.map(c => c.id === commentId ? { ...c, status: newStatus } : c));
    }
    setUpdatingId(null);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setUpdatingId(commentId);
    const res = await deleteComment(commentId);
    if (res.success) {
      setComments(comments.filter(c => c.id !== commentId));
    }
    setUpdatingId(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Moderate Comments & Reviews</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Approve, reject, or mark product reviews and blog comments as spam.</p>
          {dbSource && (
            <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">
              Database Mode: {dbSource === "supabase" ? "Supabase Cloud" : "Local Mock Fallback"}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                <span>Loading submissions...</span>
              </div>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div 
                key={comment.id} 
                className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors ${
                  comment.status === "pending" ? "bg-amber-50/20 dark:bg-amber-950/5" : ""
                }`}
              >
                <div className="flex-1 space-y-3">
                  {/* Metadata header */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      User: {comment.user?.name || comment.user?.email || "Anonymous"}
                    </span>
                    
                    {comment.product && (
                      <span className="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 px-2.5 py-1 rounded-lg">
                        Product: {comment.product.name}
                      </span>
                    )}

                    {comment.blog && (
                      <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 rounded-lg">
                        Blog: {comment.blog.title}
                      </span>
                    )}

                    <span className="text-slate-400 flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Comment Content */}
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    "{comment.content}"
                  </p>
                </div>

                {/* Moderate Actions */}
                <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                  <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full ${
                    comment.status === "approved"
                      ? "bg-green-50 text-green-600 dark:bg-green-950/20"
                      : comment.status === "rejected"
                      ? "bg-red-50 text-red-600 dark:bg-red-950/20"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 animate-pulse"
                  }`}>
                    {comment.status || "pending"}
                  </span>

                  <button 
                    disabled={updatingId === comment.id}
                    onClick={() => handleUpdateStatus(comment.id, "approved")}
                    className="p-2 bg-green-50 hover:bg-green-600 hover:text-white dark:bg-green-950/20 text-green-600 dark:hover:bg-green-600 dark:hover:text-white rounded-xl transition-all disabled:opacity-50"
                    title="Approve Comment"
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <button 
                    disabled={updatingId === comment.id}
                    onClick={() => handleUpdateStatus(comment.id, "rejected")}
                    className="p-2 bg-amber-50 hover:bg-amber-600 hover:text-white dark:bg-amber-950/20 text-amber-600 dark:hover:bg-amber-600 dark:hover:text-white rounded-xl transition-all disabled:opacity-50"
                    title="Reject Comment"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button 
                    disabled={updatingId === comment.id}
                    onClick={() => handleDelete(comment.id)}
                    className="p-2 bg-red-50 hover:bg-red-600 hover:text-white dark:bg-red-950/20 text-red-600 dark:hover:bg-red-600 dark:hover:text-white rounded-xl transition-all disabled:opacity-50"
                    title="Delete Comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500">No comment submissions found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
