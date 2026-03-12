import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
} from 'docx';
import { MOCK_CRAWL_RESULTS } from '@/constants/crawlResults';
import { MOCK_ANALYSIS_RESULTS } from '@/constants/analysisResults';
import { MOCK_CONTENT_STRATEGIES } from '@/constants/contentStrategies';
import { PLATFORM_CATEGORIES } from '@/constants/platforms';

// TODO: AI API 연동 — 보고서 본문 및 인사이트를 Claude API로 생성

function headerCell(text: string, color = '3B82F6'): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { type: ShadingType.SOLID, fill: color },
    width: { size: 0, type: WidthType.AUTO },
  });
}

function cell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 18, font: 'Arial', bold })],
      }),
    ],
    width: { size: 0, type: WidthType.AUTO },
  });
}

function divider(): Paragraph {
  return new Paragraph({
    children: [],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
    spacing: { before: 200, after: 200 },
  });
}

export function generateReportDocx(company: string, dateRange: string): Document {
  const totalArticles = MOCK_CRAWL_RESULTS.reduce((sum, p) => sum + p.articles.length, 0);
  const totalScore = Math.round(
    MOCK_ANALYSIS_RESULTS.reduce((sum, p) => sum + p.sirScore, 0) / MOCK_ANALYSIS_RESULTS.length
  );
  const totalFlagged = MOCK_ANALYSIS_RESULTS.reduce((sum, p) => sum + p.flagged.length, 0);
  const overallPositive = Math.round(MOCK_ANALYSIS_RESULTS.reduce((s, p) => s + p.positive, 0) / MOCK_ANALYSIS_RESULTS.length);
  const overallNeutral = Math.round(MOCK_ANALYSIS_RESULTS.reduce((s, p) => s + p.neutral, 0) / MOCK_ANALYSIS_RESULTS.length);
  const overallNegative = Math.round(MOCK_ANALYSIS_RESULTS.reduce((s, p) => s + p.negative, 0) / MOCK_ANALYSIS_RESULTS.length);

  const responseItems = MOCK_CONTENT_STRATEGIES.filter((s) => !s.reportable);
  const reportableItems = MOCK_CONTENT_STRATEGIES.filter((s) => s.reportable);

  return new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22 } },
      },
    },
    sections: [
      {
        children: [
          // === Title ===
          new Paragraph({
            children: [new TextRun({ text: 'SIR Analysis Report', bold: true, size: 44, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Company: ${company}`, color: '666666', size: 22 }),
              new TextRun({ text: `    |    Period: ${dateRange}`, color: '666666', size: 22 }),
              new TextRun({ text: `    |    Generated: ${new Date().toLocaleDateString('ko-KR')}`, color: '666666', size: 22 }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          divider(),

          // === 1. Crawling ===
          new Paragraph({
            text: '1. Crawling Summary',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Total articles collected: ', size: 22 }),
              new TextRun({ text: String(totalArticles), bold: true, size: 22 }),
            ],
            spacing: { after: 200 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [headerCell('Category'), headerCell('Articles'), headerCell('Platforms')],
              }),
              ...PLATFORM_CATEGORIES.map((category) => {
                const items = MOCK_CRAWL_RESULTS.filter((p) => p.category === category);
                const count = items.reduce((sum, p) => sum + p.articles.length, 0);
                if (count === 0) return null;
                return new TableRow({
                  children: [
                    cell(category, true),
                    cell(String(count)),
                    cell(items.map((p) => p.platformLabel).join(', ')),
                  ],
                });
              }).filter(Boolean) as TableRow[],
            ],
          }),

          divider(),

          // === 2. Analysis ===
          new Paragraph({
            text: '2. Sentiment Analysis',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Overall SIR Score: `, size: 22 }),
              new TextRun({ text: String(totalScore), bold: true, size: 28, color: totalScore >= 70 ? '16A34A' : totalScore >= 50 ? 'CA8A04' : 'DC2626' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Sentiment Distribution: `, size: 22 }),
              new TextRun({ text: `Positive ${overallPositive}%`, color: '16A34A', size: 22 }),
              new TextRun({ text: ` / Neutral ${overallNeutral}%`, color: '666666', size: 22 }),
              new TextRun({ text: ` / Negative ${overallNegative}%`, color: 'DC2626', size: 22 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Flagged Content: `, size: 22 }),
              new TextRun({ text: `${totalFlagged} items`, bold: true, color: 'DC2626', size: 22 }),
            ],
            spacing: { after: 200 },
          }),

          // Category table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  headerCell('Category'),
                  headerCell('SIR Score'),
                  headerCell('Positive'),
                  headerCell('Neutral'),
                  headerCell('Negative'),
                  headerCell('Flagged'),
                ],
              }),
              ...PLATFORM_CATEGORIES.map((category) => {
                const items = MOCK_ANALYSIS_RESULTS.filter((p) => p.category === category);
                if (items.length === 0) return null;
                const score = Math.round(items.reduce((sum, p) => sum + p.sirScore, 0) / items.length);
                const pos = Math.round(items.reduce((s, p) => s + p.positive, 0) / items.length);
                const neu = Math.round(items.reduce((s, p) => s + p.neutral, 0) / items.length);
                const neg = Math.round(items.reduce((s, p) => s + p.negative, 0) / items.length);
                const flagged = items.reduce((sum, p) => sum + p.flagged.length, 0);
                return new TableRow({
                  children: [
                    cell(category, true),
                    cell(String(score)),
                    cell(`${pos}%`),
                    cell(`${neu}%`),
                    cell(`${neg}%`),
                    cell(String(flagged)),
                  ],
                });
              }).filter(Boolean) as TableRow[],
            ],
          }),

          new Paragraph({ children: [], spacing: { before: 200 } }),

          // Platform detail table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  headerCell('Category', '475569'),
                  headerCell('Platform', '475569'),
                  headerCell('SIR', '475569'),
                  headerCell('Pos', '475569'),
                  headerCell('Neu', '475569'),
                  headerCell('Neg', '475569'),
                  headerCell('Flag', '475569'),
                ],
              }),
              ...MOCK_ANALYSIS_RESULTS.map(
                (p) =>
                  new TableRow({
                    children: [
                      cell(p.category),
                      cell(p.platformLabel),
                      cell(String(p.sirScore)),
                      cell(`${p.positive}%`),
                      cell(`${p.neutral}%`),
                      cell(`${p.negative}%`),
                      cell(String(p.flagged.length)),
                    ],
                  })
              ),
            ],
          }),

          divider(),

          // === 3. Content Strategy ===
          new Paragraph({
            text: '3. Content Strategy & Report Actions',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 100 },
          }),

          new Paragraph({
            text: `3-1. Response Strategy (${responseItems.length} items)`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [headerCell('Category', 'D97706'), headerCell('Platform', 'D97706'), headerCell('Content', 'D97706'), headerCell('Strategy', 'D97706')],
              }),
              ...responseItems.map(
                (item) =>
                  new TableRow({
                    children: [
                      cell(item.category),
                      cell(item.platform),
                      cell(item.title),
                      cell(item.strategy ?? ''),
                    ],
                  })
              ),
            ],
          }),

          new Paragraph({
            text: `3-2. Reportable Content (${reportableItems.length} items)`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [headerCell('Category', 'DC2626'), headerCell('Platform', 'DC2626'), headerCell('Content', 'DC2626'), headerCell('Reason', 'DC2626')],
              }),
              ...reportableItems.map(
                (item) =>
                  new TableRow({
                    children: [
                      cell(item.category),
                      cell(item.platform),
                      cell(item.title),
                      cell(item.reportReason ?? ''),
                    ],
                  })
              ),
            ],
          }),

          // === Flagged detail ===
          new Paragraph({
            text: '3-3. Flagged Content Detail',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  headerCell('Category', 'DC2626'),
                  headerCell('Platform', 'DC2626'),
                  headerCell('Title', 'DC2626'),
                  headerCell('Type', 'DC2626'),
                  headerCell('Reason', 'DC2626'),
                ],
              }),
              ...MOCK_ANALYSIS_RESULTS.flatMap((p) =>
                p.flagged.map(
                  (f) =>
                    new TableRow({
                      children: [
                        cell(p.category),
                        cell(p.platformLabel),
                        cell(f.title),
                        cell(f.sentiment === 'negative' ? 'Negative' : 'Caution'),
                        cell(f.reason),
                      ],
                    })
                )
              ),
            ],
          }),
        ],
      },
    ],
  });
}
