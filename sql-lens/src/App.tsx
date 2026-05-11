import React, { useState } from 'react';
import { Database, Play, Code2, Info, Loader2, Share2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { parseSQLToGraph, SQLGraph } from './services/sqlService';
import SQLVisualizer from './components/SQLVisualizer';

const DEFAULT_SQL = `SELECT 
    u.name, 
    o.order_date, 
    p.product_name,
    sub.total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
JOIN (
    SELECT user_id, SUM(amount) as total_spent
    FROM payments
    GROUP BY user_id
) sub ON u.id = sub.user_id
WHERE o.status = 'completed'`;

export default function App() {
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [graph, setGraph] = useState<SQLGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVisualize = async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await parseSQLToGraph(sql);
      setGraph(result);
    } catch (err: any) {
      setError(err.message || "An error occurred while parsing the SQL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Database className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SQL Lens</h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">Visual Query Architect</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <div className="h-6 w-[1px] bg-slate-200 mx-2" />
            <button 
              onClick={handleVisualize}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              Visualize
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
        {/* Editor Section */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-full">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SQL Editor</span>
              </div>
              <button 
                onClick={() => setSql('')}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                title="Clear Editor"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              spellCheck={false}
              className="flex-1 p-6 font-mono text-sm bg-white focus:outline-none resize-none leading-relaxed text-slate-700"
              placeholder="Paste your complex SQL here..."
            />
          </div>

          {/* Explanation Section */}
          <AnimatePresence mode="wait">
            {graph && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6 flex-shrink-0"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Query Breakdown</span>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    Working Backwards
                  </span>
                </div>
                <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-p:text-slate-600 prose-headings:text-slate-800 prose-headings:font-bold prose-strong:text-slate-800">
                  <Markdown>{graph.explanation}</Markdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Visualization Section */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Query Map</span>
            </div>
            {graph && (
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Live View
              </span>
            )}
          </div>
          
          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-500 animate-pulse">Deconstructing Query Architecture...</p>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <Info className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Visualization Failed</h3>
                <p className="text-slate-500 max-w-md">{error}</p>
                <button 
                  onClick={handleVisualize}
                  className="mt-6 text-blue-600 font-semibold hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : graph ? (
              <SQLVisualizer graph={graph} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
                  <Code2 className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Map</h3>
                <p className="text-slate-500 max-w-sm">
                  Enter your SQL query on the left and click visualize to see the data flow and relationships.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
