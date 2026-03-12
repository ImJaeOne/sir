import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MOCK_CRAWL_RESULTS } from '@/constants/crawlResults';
import { MOCK_ANALYSIS_RESULTS } from '@/constants/analysisResults';
import { MOCK_CONTENT_STRATEGIES } from '@/constants/contentStrategies';
import { PLATFORM_CATEGORIES } from '@/constants/platforms';

// TODO: AI API 연동 — 보고서 내용을 Claude API로 생성하여 더 구체적인 인사이트 포함

// 한글 폰트 미포함 시 영문 fallback — 추후 한글 폰트 임베딩 필요
// TODO: 한글 폰트(NotoSansKR 등) 임베딩하여 PDF 한글 깨짐 해결

function calcCategoryScore(category: string): number {
  const items = MOCK_ANALYSIS_RESULTS.filter((p) => p.category === category);
  if (items.length === 0) return 0;
  return Math.round(items.reduce((sum, p) => sum + p.sirScore, 0) / items.length);
}

function calcCategorySentiment(category: string) {
  const items = MOCK_ANALYSIS_RESULTS.filter((p) => p.category === category);
  if (items.length === 0) return { positive: 0, neutral: 0, negative: 0 };
  return {
    positive: Math.round(items.reduce((s, p) => s + p.positive, 0) / items.length),
    neutral: Math.round(items.reduce((s, p) => s + p.neutral, 0) / items.length),
    negative: Math.round(items.reduce((s, p) => s + p.negative, 0) / items.length),
  };
}

export function generateReportPdf(company: string, dateRange: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // === Title ===
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SIR Analysis Report', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Company: ${company}`, pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.text(`Period: ${dateRange}`, pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.text(`Generated: ${new Date().toLocaleDateString('ko-KR')}`, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // === Divider ===
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // === 1. Crawling Summary ===
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Crawling Summary', 20, y);
  y += 8;

  const totalArticles = MOCK_CRAWL_RESULTS.reduce((sum, p) => sum + p.articles.length, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total articles collected: ${totalArticles}`, 20, y);
  y += 8;

  const crawlTableData = PLATFORM_CATEGORIES.map((category) => {
    const items = MOCK_CRAWL_RESULTS.filter((p) => p.category === category);
    const count = items.reduce((sum, p) => sum + p.articles.length, 0);
    const platformNames = items.map((p) => p.platformLabel).join(', ');
    return [category, String(count), platformNames];
  }).filter((row) => row[1] !== '0');

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Articles', 'Platforms']],
    body: crawlTableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 20, right: 20 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // === 2. Analysis Summary ===
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Sentiment Analysis', 20, y);
  y += 8;

  const totalScore = Math.round(
    MOCK_ANALYSIS_RESULTS.reduce((sum, p) => sum + p.sirScore, 0) / MOCK_ANALYSIS_RESULTS.length
  );
  const totalFlagged = MOCK_ANALYSIS_RESULTS.reduce((sum, p) => sum + p.flagged.length, 0);
  const overallSentiment = {
    positive: Math.round(MOCK_ANALYSIS_RESULTS.reduce((s, p) => s + p.positive, 0) / MOCK_ANALYSIS_RESULTS.length),
    neutral: Math.round(MOCK_ANALYSIS_RESULTS.reduce((s, p) => s + p.neutral, 0) / MOCK_ANALYSIS_RESULTS.length),
    negative: Math.round(MOCK_ANALYSIS_RESULTS.reduce((s, p) => s + p.negative, 0) / MOCK_ANALYSIS_RESULTS.length),
  };

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Overall SIR Score: ${totalScore}`, 20, y);
  y += 5;
  doc.text(`Sentiment: Positive ${overallSentiment.positive}% / Neutral ${overallSentiment.neutral}% / Negative ${overallSentiment.negative}%`, 20, y);
  y += 5;
  doc.text(`Flagged content: ${totalFlagged} items`, 20, y);
  y += 8;

  // Category breakdown table
  const analysisTableData = PLATFORM_CATEGORIES.map((category) => {
    const score = calcCategoryScore(category);
    const sentiment = calcCategorySentiment(category);
    const flagged = MOCK_ANALYSIS_RESULTS.filter((p) => p.category === category)
      .reduce((sum, p) => sum + p.flagged.length, 0);
    return [category, String(score), `${sentiment.positive}%`, `${sentiment.neutral}%`, `${sentiment.negative}%`, String(flagged)];
  }).filter((row) => row[1] !== '0');

  autoTable(doc, {
    startY: y,
    head: [['Category', 'SIR Score', 'Positive', 'Neutral', 'Negative', 'Flagged']],
    body: analysisTableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 20, right: 20 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // Platform detail table
  const platformTableData = MOCK_ANALYSIS_RESULTS.map((p) => [
    p.category,
    p.platformLabel,
    String(p.sirScore),
    `${p.positive}%`,
    `${p.neutral}%`,
    `${p.negative}%`,
    String(p.flagged.length),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Platform', 'SIR', 'Positive', 'Neutral', 'Negative', 'Flagged']],
    body: platformTableData,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 20, right: 20 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // === New page for content strategy ===
  doc.addPage();
  y = 20;

  // === 3. Content Strategy ===
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Content Strategy & Report Actions', 20, y);
  y += 10;

  // Response strategies
  const responseItems = MOCK_CONTENT_STRATEGIES.filter((s) => !s.reportable);
  const reportableItems = MOCK_CONTENT_STRATEGIES.filter((s) => s.reportable);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`3-1. Response Strategy (${responseItems.length} items)`, 20, y);
  y += 8;

  const responseTableData = responseItems.map((item) => [
    item.category,
    item.platform,
    item.title,
    item.strategy ?? '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Platform', 'Content', 'Strategy']],
    body: responseTableData,
    theme: 'grid',
    headStyles: { fillColor: [217, 119, 6], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      2: { cellWidth: 45 },
      3: { cellWidth: 60 },
    },
    margin: { left: 20, right: 20 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // Reportable items
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`3-2. Reportable Content (${reportableItems.length} items)`, 20, y);
  y += 8;

  const reportableTableData = reportableItems.map((item) => [
    item.category,
    item.platform,
    item.title,
    item.reportReason ?? '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Platform', 'Content', 'Report Reason']],
    body: reportableTableData,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      2: { cellWidth: 45 },
      3: { cellWidth: 60 },
    },
    margin: { left: 20, right: 20 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // === Flagged Content Detail ===
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3-3. Flagged Content Detail', 20, y);
  y += 8;

  const flaggedData: string[][] = [];
  MOCK_ANALYSIS_RESULTS.forEach((p) => {
    p.flagged.forEach((f) => {
      flaggedData.push([p.category, p.platformLabel, f.title, f.sentiment, f.reason, f.url]);
    });
  });

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Platform', 'Title', 'Sentiment', 'Reason', 'URL']],
    body: flaggedData,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      5: { cellWidth: 35 },
    },
    margin: { left: 20, right: 20 },
  });

  // === Footer ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `SIR Report - ${company} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
}
