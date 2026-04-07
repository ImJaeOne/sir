'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SentimentIcon } from '@/components/report/reputation/SentimentIcon';
import { SentimentFilter } from '@/components/report/reputation/SentimentFilter';
import type { ChannelItem, NewsCluster } from '@/lib/api/reportApi';

function ClusterItem({ cluster }: { cluster: NewsCluster }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative border-b border-border-light last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex gap-2 py-4 text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <SentimentIcon sentiment={cluster.sentiment ?? 'neutral'} />
        <div className="flex-1 min-w-0 px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-dark font-semibold">
              {cluster.representative_title}
            </span>
            <span className="text-[10px] text-text-muted bg-bg-light px-2 rounded-[10px] shrink-0">
              {cluster.items.length}건
            </span>
          </div>
          {cluster.summary && <p className="text-sm text-text-muted mt-0.5">{cluster.summary}</p>}
        </div>
        <div className="flex items-center">
          {open ? (
            <ChevronUp size={14} className="text-text-muted shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-text-muted shrink-0" />
          )}
        </div>
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 ml-[38px] mr-5 z-10 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
          {cluster.items.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline gap-2 hover:bg-slate-50 rounded px-2 py-1.5 transition-colors"
            >
              <p className="text-sm text-text-dark group-hover:text-blue-600 transition-colors flex-1 min-w-0">
                {item.title}
              </p>
              {item.source && (
                <span className="text-[10px] text-slate-400 shrink-0">{item.source}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

interface NewsClusterContentProps {
  clusters: NewsCluster[];
  unclustered: ChannelItem[];
}

export function NewsClusterContent({ clusters, unclustered }: NewsClusterContentProps) {
  const [filter, setFilter] = useState<string>('all');

  const sortedClusters = [...clusters].sort((a, b) => b.items.length - a.items.length);
  const filteredClusters =
    filter === 'all' ? sortedClusters : sortedClusters.filter((c) => c.sentiment === filter);
  const filteredUnclustered =
    filter === 'all' ? unclustered : unclustered.filter((i) => i.sentiment === filter);

  return (
    <>
      <SentimentFilter value={filter} onChange={setFilter} />
      {filteredClusters.map((cluster) => (
        <ClusterItem key={cluster.id} cluster={cluster} />
      ))}
      {filteredUnclustered.length > 0 && (
        <>
          <p className="text-xs text-text-muted pt-3">미분류 기사</p>
          {filteredUnclustered.map((item, i) => (
            <div key={i} className="border-b border-slate-50 last:border-0">
              <div className="flex gap-2 py-4">
                <SentimentIcon sentiment={item.sentiment} />
                <div className="flex-1 min-w-0 pl-4">
                  <div className="flex items-center gap-2">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-text-dark font-semibold hover:text-blue-600 hover:underline transition-colors"
                    >
                      {item.title}
                    </a>
                    {item.source && (
                      <span className="text-[10px] text-text-muted shrink-0">{item.source}</span>
                    )}
                  </div>
                  {item.summary && <p className="text-sm text-text-muted mt-0.5">{item.summary}</p>}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
