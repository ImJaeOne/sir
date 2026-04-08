'use client';

interface StrategySection {
  title: string;
  content: string;
}

function parseStrategy(strategy: string): StrategySection[] {
  const sections: StrategySection[] = [];
  const parts = strategy.split(/^(#{1,3}\s+.+)$/m);

  let currentTitle = '';
  let currentBody = '';

  for (const part of parts) {
    if (/^#{1,3}\s+/.test(part)) {
      if (currentTitle || currentBody.trim()) {
        sections.push({ title: currentTitle, content: currentBody.trim() });
      }
      currentTitle = part.replace(/^#{1,3}\s+/, '');
      currentBody = '';
    } else {
      currentBody += part;
    }
  }
  if (currentTitle || currentBody.trim()) {
    sections.push({ title: currentTitle, content: currentBody.trim() });
  }

  return sections;
}

function getSectionStyle(title: string): { bg: string; text: string } {
  const lower = title.toLowerCase();
  if (lower.includes('핵심') || lower.includes('전략 제안') || lower.includes('핵심 전략')) {
    return { bg: 'bg-bg-accent', text: 'text-white' };
  }
  return { bg: 'bg-bg-light', text: 'text-text-dark' };
}

interface StrategySectionsProps {
  strategy: string;
}

export function StrategySections({ strategy }: StrategySectionsProps) {
  const sections = parseStrategy(strategy);

  if (sections.length === 0) {
    return (
      <div className="rounded-xl px-5 py-4 bg-bg-light">
        <p className="text-sm text-text-dark leading-relaxed whitespace-pre-line">{strategy}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-3">
      {sections.map((section, i) => {
        const style = getSectionStyle(section.title);
        return (
          <div key={i} className="flex flex-col gap-2">
            <h4 className="text-sm font-bold text-text-accent">{section.title}</h4>
            <div className={`rounded-xl px-5 py-4 ${style.bg}`}>
              <p className={`text-sm leading-relaxed whitespace-pre-line ${style.text}`}>
                {section.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
