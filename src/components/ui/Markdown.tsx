'use client';

import ReactMarkdown from 'react-markdown';

export function Md({ children, className = '' }: { children: string; className?: string }) {
  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) => <h3 className="text-sm font-bold text-slate-700 mt-4 mb-2 first:mt-0">{children}</h3>,
        h3: ({ children }) => <h4 className="text-xs font-bold text-slate-600 mt-3 mb-1.5">{children}</h4>,
        p: ({ children }) => <p className={`text-sm leading-relaxed mb-2 last:mb-0 ${className}`}>{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-sm ml-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-sm ml-1">{children}</ol>,
        li: ({ children }) => <li className={`leading-relaxed ${className}`}>{children}</li>,
        table: ({ children }) => <div className="overflow-x-auto my-2"><table className="text-xs w-full border-collapse">{children}</table></div>,
        thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
        th: ({ children }) => <th className="text-left px-2 py-1.5 border-b border-slate-200 font-semibold text-slate-600">{children}</th>,
        td: ({ children }) => <td className="px-2 py-1.5 border-b border-slate-100 text-slate-600">{children}</td>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
