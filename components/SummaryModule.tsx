
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Printer, Loader2, RotateCcw, Edit2, X, ChevronDown, FileText, File, Save, Trash2, Check, Cpu, RefreshCw } from 'lucide-react';
import { generatePinkBrief, StrategyContext } from '../aiService';
import { BriefData, PinkBriefContent } from '../types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useBriefFlowStore } from '../lib/stores/briefFlowStore';
import { useAIProviderStore } from '../lib/stores/aiProviderStore';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { briefService } from '../lib/services/briefService';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  briefData: BriefData;
  onReset: () => void;
  onProcessing: (val: boolean) => void;
  isAlreadySaved?: boolean; // true when viewing from BriefView (already complete)
  storedModelUsed?: string | null; // model from database when viewing saved brief
}

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-1 h-6 bg-[#0f62fe]" />
    <h3 className="text-sm font-medium text-[#161616] uppercase tracking-wider">{title}</h3>
  </div>
);

const FieldRow = ({
  label,
  value,
  onChange,
  isEditing
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  isEditing: boolean;
}) => (
  <div className="flex items-baseline gap-3 py-2">
    <span className="text-sm font-medium text-[#0f62fe] shrink-0 w-48">{label}</span>
    {isEditing ? (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-sm text-[#161616] bg-[#f4f4f4] border border-[#e0e0e0] px-2 py-1 focus:border-[#0f62fe] focus:outline-none"
      />
    ) : (
      <span className="flex-1 text-sm text-[#161616]">{value}</span>
    )}
  </div>
);

const SummaryModule: React.FC<Props> = ({ briefData, onReset, onProcessing, isAlreadySaved = false, storedModelUsed }) => {
  const navigate = useNavigate();

  const dbConfigured = isSupabaseConfigured();
  const {
    briefId,
    completeBrief,
    setPinkBrief,
    reset: resetStore,
    sourceDocuments,
    marketingSummary,
    pinkBrief: storePinkBrief,
    insights: storeInsights,
    selectedInsightId: storeSelectedInsightId,
  } = useBriefFlowStore();

  // Get pinkBrief from props OR store (fallback for when sync didn't complete)
  // IMPORTANT: Only use store fallback when briefData.pinkBrief is undefined (not provided)
  // If it's explicitly null, that means regeneration was requested - don't fall back to store
  const effectivePinkBrief = briefData.pinkBrief !== undefined
    ? briefData.pinkBrief
    : (storePinkBrief ? {
        business_objective: storePinkBrief.business_objective,
        consumer_problem: storePinkBrief.consumer_problem,
        communication_challenge: storePinkBrief.communication_challenge,
        message_strategy: storePinkBrief.message_strategy,
        insights: storePinkBrief.insights,
        execution: storePinkBrief.execution,
      } : null);

  // Get selectedInsight from props OR derive from store (fallback)
  const effectiveSelectedInsight = briefData.selectedInsight || (() => {
    if (storeSelectedInsightId != null && storeInsights.length > 0) {
      const found = storeInsights.find(i => Number(i.id) === Number(storeSelectedInsightId));
      if (found) {
        return {
          id: found.id,
          insight_headline: found.insight_headline,
          insight_text: found.insight_text,
          verbatims: found.verbatims,
          relevance_score: found.relevance_score,
          tension_type: found.tension_type,
          jtbd: found.jtbd,
        };
      }
    }
    return null;
  })();

  const [content, setContent] = useState<PinkBriefContent | null>(effectivePinkBrief);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<PinkBriefContent | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingBrief, setIsSavingBrief] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [hasSavedThisSession, setHasSavedThisSession] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Get source filename from store or briefData
  const sourceFilename = sourceDocuments?.[0]?.filename || null;

  // Get model used - prefer stored value (for saved briefs), fall back to current provider
  const currentProvider = useAIProviderStore((state) => state.provider);
  const modelUsed = storedModelUsed
    ? (storedModelUsed.includes('claude') ? 'claude' : 'gemini')
    : currentProvider;

  // Sync content when pinkBrief changes (from props or store)
  useEffect(() => {
    setContent(effectivePinkBrief);
  }, [effectivePinkBrief]);

  const TIMEOUT_MS = 90000; // 90 seconds

  const runGeneration = async () => {
    // Use effective insight (from props or store fallback)
    if (!effectiveSelectedInsight) return;

    setIsLoading(true);
    setError(null);
    onProcessing(true);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Generation timed out. Please try again.')), TIMEOUT_MS)
    );

    // Build strategy context from store's marketing summary or briefData
    const strategyContext: StrategyContext | undefined = marketingSummary ? {
      redThreadEssence: marketingSummary.red_thread_essence || '',
      redThreadUnlock: marketingSummary.red_thread_unlock || '',
      sections: marketingSummary.sections || [],
    } : briefData.marketingSummarySections.length > 0 ? {
      redThreadEssence: briefData.redThreadEssence || '',
      redThreadUnlock: '',
      sections: briefData.marketingSummarySections,
    } : undefined;

    try {
      const result = await Promise.race([
        generatePinkBrief(
          effectiveSelectedInsight,
          briefData.categoryContext,
          briefData.researchText,
          strategyContext
        ),
        timeoutPromise
      ]);
      setContent(result);
      // Sync to store so it can be saved to database
      if (result) {
        setPinkBrief(result);
      }
    } catch (err: any) {
      console.error('Pink Brief generation failed:', err);
      setError(err.message || 'Failed to generate brief. Please try again.');
    } finally {
      setIsLoading(false);
      onProcessing(false);
    }
  };

  // Auto-generate when content is null and we have an insight
  useEffect(() => {
    if (content) return;
    if (!effectiveSelectedInsight) return;
    runGeneration();
  }, [effectiveSelectedInsight, content]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Export to Word document
  const exportToWord = async () => {
    if (!content) return;
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({ text: "P&G PINK BRIEF", bold: true, size: 48, color: "0f62fe" }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "CONFIDENTIAL", size: 20, color: "da1e28", italics: true })],
              spacing: { after: 400 },
            }),

            // Business Objective
            new Paragraph({
              text: "WHO-INSPIRED BUSINESS OBJECTIVE",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "To grow: ", bold: true }),
                new TextRun(content.business_objective.to_grow),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "We need to get: ", bold: true }),
                new TextRun(content.business_objective.we_need_to_get),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "To: ", bold: true }),
                new TextRun(content.business_objective.to),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "By forming the habit of: ", bold: true }),
                new TextRun(content.business_objective.by_forming_new_habit),
              ],
              spacing: { after: 300 },
            }),

            // Consumer Problem
            new Paragraph({
              text: "CONSUMER'S PROBLEM TO SOLVE",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Job To Be Done: ", bold: true }),
                new TextRun(content.consumer_problem.jtbd),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Current Behavior: ", bold: true }),
                new TextRun(content.consumer_problem.current_behavior),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Struggle: ", bold: true }),
                new TextRun(content.consumer_problem.struggle),
              ],
              spacing: { after: 300 },
            }),

            // Communication Challenge
            new Paragraph({
              text: "COMMUNICATION CHALLENGE",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "FROM", bold: true, color: "da1e28" })] }),
                        new Paragraph({ children: [new TextRun({ text: content.communication_challenge.from_state, italics: true })] }),
                      ],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "TO", bold: true, color: "24a148" })] }),
                        new Paragraph({ children: [new TextRun({ text: content.communication_challenge.to_state, italics: true })] }),
                      ],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Bridge/Analogy: ", bold: true }),
                new TextRun(content.communication_challenge.analogy_or_device),
              ],
              spacing: { before: 200, after: 300 },
            }),

            // Message Strategy
            new Paragraph({
              text: "COMMUNICATION MESSAGE STRATEGY",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Benefit: ", bold: true }),
                new TextRun({ text: content.message_strategy.benefit, size: 28 }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Reason To Believe: ", bold: true }),
                new TextRun(content.message_strategy.rtb),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Brand Character: ", bold: true }),
                new TextRun({ text: content.message_strategy.brand_character, italics: true }),
              ],
              spacing: { after: 300 },
            }),

            // Insights
            new Paragraph({
              text: "CONSUMER INSIGHTS",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            ...content.insights.map(insight => new Paragraph({
              children: [
                new TextRun({ text: `Insight ${insight.insight_number}: `, bold: true }),
                new TextRun({ text: `"${insight.insight_text}"`, italics: true }),
              ],
              spacing: { after: 150 },
            })),

            // Execution
            new Paragraph({
              text: "EXECUTION GUIDANCE",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Key Media: ", bold: true }),
                new TextRun(content.execution.key_media.join(", ")),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Campaign Pillars: ", bold: true }),
                new TextRun(content.execution.campaign_pillars.join(", ")),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Key Considerations: ", bold: true }),
                new TextRun(content.execution.key_considerations),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Business Success: ", bold: true }),
                new TextRun(content.execution.success_measures.business),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Equity Success: ", bold: true }),
                new TextRun(content.execution.success_measures.equity),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "PG-Pink-Brief.docx");
    } catch (err) {
      console.error("Word export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Word document (Full - includes insights, strategy, and brief)
  const exportToWordFull = async () => {
    if (!content) return;
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const children: any[] = [];

      // Title
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "P&G CREATIVE BRIEF PACKAGE", bold: true, size: 48, color: "0f62fe" }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "CONFIDENTIAL", size: 20, color: "da1e28", italics: true })],
          spacing: { after: 600 },
        })
      );

      // ========== SECTION 1: CONSUMER INSIGHT ==========
      if (effectiveSelectedInsight) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "PART 1: CONSUMER INSIGHT", bold: true, size: 32, color: "6929c4" })],
            spacing: { before: 400, after: 300 },
          })
        );

        if (effectiveSelectedInsight.insight_headline) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: "Insight Headline: ", bold: true }),
                new TextRun({ text: effectiveSelectedInsight.insight_headline, size: 28 }),
              ],
              spacing: { after: 200 },
            })
          );
        }

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Consumer Voice: ", bold: true }),
              new TextRun({ text: `"${effectiveSelectedInsight.insight_text}"`, italics: true }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Tension Type: ", bold: true }),
              new TextRun(effectiveSelectedInsight.tension_type || 'functional'),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Job To Be Done: ", bold: true }),
              new TextRun(effectiveSelectedInsight.jtbd || ''),
            ],
            spacing: { after: 200 },
          })
        );

        // Verbatims
        if (effectiveSelectedInsight.verbatims?.length > 0) {
          children.push(
            new Paragraph({
              text: "Supporting Verbatims:",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            })
          );
          effectiveSelectedInsight.verbatims.forEach((v, idx) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${idx + 1}. `, bold: true }),
                  new TextRun({ text: `"${v.quote}"`, italics: true }),
                ],
                spacing: { after: 100 },
              })
            );
          });
        }

        children.push(
          new Paragraph({ text: "", spacing: { after: 400 } }) // Spacer
        );
      }

      // ========== SECTION 2: STRATEGIC FRAMEWORK ==========
      if (marketingSummary) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "PART 2: STRATEGIC FRAMEWORK", bold: true, size: 32, color: "6929c4" })],
            spacing: { before: 400, after: 300 },
          })
        );

        // Red Thread
        if (marketingSummary.red_thread_essence || marketingSummary.red_thread_unlock) {
          children.push(
            new Paragraph({
              text: "THE RED THREAD",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 },
            })
          );

          if (marketingSummary.red_thread_essence) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: "Strategic Essence: ", bold: true }),
                  new TextRun({ text: marketingSummary.red_thread_essence, size: 28 }),
                ],
                spacing: { after: 100 },
              })
            );
          }

          if (marketingSummary.red_thread_unlock) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: "The Unlock: ", bold: true }),
                  new TextRun(marketingSummary.red_thread_unlock),
                ],
                spacing: { after: 300 },
              })
            );
          }
        }

        // Strategic Sections
        if (marketingSummary.sections?.length > 0) {
          marketingSummary.sections.forEach((section) => {
            children.push(
              new Paragraph({
                text: section.title.toUpperCase(),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 100 },
              })
            );

            if (section.summary) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: "Summary: ", bold: true, color: "0f62fe" }),
                    new TextRun(section.summary),
                  ],
                  spacing: { after: 100 },
                })
              );
            }

            children.push(
              new Paragraph({
                children: [new TextRun(section.content)],
                spacing: { after: 200 },
              })
            );
          });
        }

        children.push(
          new Paragraph({ text: "", spacing: { after: 400 } }) // Spacer
        );
      }

      // ========== SECTION 3: PINK BRIEF ==========
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "PART 3: PINK BRIEF", bold: true, size: 32, color: "6929c4" })],
          spacing: { before: 400, after: 300 },
        }),
        // Business Objective
        new Paragraph({
          text: "WHO-INSPIRED BUSINESS OBJECTIVE",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "To grow: ", bold: true }),
            new TextRun(content.business_objective.to_grow),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "We need to get: ", bold: true }),
            new TextRun(content.business_objective.we_need_to_get),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "To: ", bold: true }),
            new TextRun(content.business_objective.to),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "By forming the habit of: ", bold: true }),
            new TextRun(content.business_objective.by_forming_new_habit),
          ],
          spacing: { after: 300 },
        }),
        // Consumer Problem
        new Paragraph({
          text: "CONSUMER'S PROBLEM TO SOLVE",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Job To Be Done: ", bold: true }),
            new TextRun(content.consumer_problem.jtbd),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Current Behavior: ", bold: true }),
            new TextRun(content.consumer_problem.current_behavior),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Struggle: ", bold: true }),
            new TextRun(content.consumer_problem.struggle),
          ],
          spacing: { after: 300 },
        }),
        // Communication Challenge
        new Paragraph({
          text: "COMMUNICATION CHALLENGE",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "FROM", bold: true, color: "da1e28" })] }),
                    new Paragraph({ children: [new TextRun({ text: content.communication_challenge.from_state, italics: true })] }),
                  ],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "TO", bold: true, color: "24a148" })] }),
                    new Paragraph({ children: [new TextRun({ text: content.communication_challenge.to_state, italics: true })] }),
                  ],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Bridge/Analogy: ", bold: true }),
            new TextRun(content.communication_challenge.analogy_or_device),
          ],
          spacing: { before: 200, after: 300 },
        }),
        // Message Strategy
        new Paragraph({
          text: "COMMUNICATION MESSAGE STRATEGY",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Benefit: ", bold: true }),
            new TextRun({ text: content.message_strategy.benefit, size: 28 }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Reason To Believe: ", bold: true }),
            new TextRun(content.message_strategy.rtb),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Brand Character: ", bold: true }),
            new TextRun({ text: content.message_strategy.brand_character, italics: true }),
          ],
          spacing: { after: 300 },
        }),
        // Insights
        new Paragraph({
          text: "CONSUMER INSIGHTS",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        ...content.insights.map(insight => new Paragraph({
          children: [
            new TextRun({ text: `Insight ${insight.insight_number}: `, bold: true }),
            new TextRun({ text: `"${insight.insight_text}"`, italics: true }),
          ],
          spacing: { after: 150 },
        })),
        // Execution
        new Paragraph({
          text: "EXECUTION GUIDANCE",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Key Media: ", bold: true }),
            new TextRun(content.execution.key_media.join(", ")),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Campaign Pillars: ", bold: true }),
            new TextRun(content.execution.campaign_pillars.join(", ")),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Key Considerations: ", bold: true }),
            new TextRun(content.execution.key_considerations),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Business Success: ", bold: true }),
            new TextRun(content.execution.success_measures.business),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Equity Success: ", bold: true }),
            new TextRun(content.execution.success_measures.equity),
          ],
        })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "PG-Creative-Brief-Package.docx");
    } catch (err) {
      console.error("Word export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!content || !contentRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f4f4f4',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('PG-Pink-Brief.pdf');
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to update nested fields
  const updateNestedField = (
    section: keyof PinkBriefContent,
    field: string,
    value: string
  ) => {
    if (!content) return;
    setContent({
      ...content,
      [section]: {
        ...(content[section] as Record<string, any>),
        [field]: value
      }
    });
  };

  const updateInsight = (index: number, value: string) => {
    if (!content) return;
    const newInsights = [...content.insights];
    newInsights[index] = { ...newInsights[index], insight_text: value };
    setContent({ ...content, insights: newInsights });
  };

  const updateExecutionArray = (field: 'key_media' | 'campaign_pillars', value: string) => {
    if (!content) return;
    setContent({
      ...content,
      execution: {
        ...content.execution,
        [field]: value.split(',').map(s => s.trim())
      }
    });
  };

  const startEdit = (section: string) => {
    // Save original content before editing
    if (content) {
      setOriginalContent({ ...content });
    }
    setEditingSection(section);
  };

  const saveEdit = () => {
    // Sync to store and close edit mode
    if (content) {
      setPinkBrief(content);
    }
    setEditingSection(null);
    setOriginalContent(null);
  };

  const cancelEdit = () => {
    // Restore original content and close edit mode
    if (originalContent) {
      setContent(originalContent);
    }
    setEditingSection(null);
    setOriginalContent(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Save brief (mark as complete)
  const handleSaveBrief = async () => {
    if (!dbConfigured || !briefId) return;

    setIsSavingBrief(true);
    try {
      // Sync current content to store before saving (in case edits weren't closed)
      if (content) {
        setPinkBrief(content);
      }
      // Close any open editing section
      setEditingSection(null);

      await completeBrief();
      setHasSavedThisSession(true);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save brief:', err);
    } finally {
      setIsSavingBrief(false);
    }
  };

  // Discard brief
  const handleDiscardBrief = async () => {
    if (dbConfigured && briefId) {
      try {
        await briefService.archive(briefId);
      } catch (err) {
        console.error('Failed to archive brief:', err);
      }
    }
    resetStore();
    onReset();
  };

  // Regenerate brief (for drafts)
  const handleRegenerateBrief = () => {
    setShowRegenerateDialog(true);
  };

  const confirmRegenerate = () => {
    setShowRegenerateDialog(false);
    setContent(null);
    runGeneration();
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-[#edf5ff] flex items-center justify-center mx-auto mb-6">
          <Loader2 size={32} className="text-[#0f62fe] animate-spin" />
        </div>
        <h3 className="text-2xl font-light text-[#161616] mb-2">Generating brief</h3>
        <p className="text-sm text-[#525252]">
          Creating your Pink Brief document...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-[#fff1f1] flex items-center justify-center mx-auto mb-6">
          <FileText size={32} className="text-[#da1e28]" />
        </div>
        <h3 className="text-2xl font-light text-[#161616] mb-2">Generation failed</h3>
        <p className="text-sm text-[#525252] mb-6">{error}</p>
        {effectiveSelectedInsight && (
          <button
            onClick={runGeneration}
            className="h-10 px-6 bg-[#0f62fe] text-white text-sm font-medium hover:bg-[#0353e9] transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-[#fff8e1] flex items-center justify-center mx-auto mb-6">
          <FileText size={32} className="text-[#f57f17]" />
        </div>
        <h3 className="text-2xl font-light text-[#161616] mb-2">Brief content not available</h3>
        <p className="text-sm text-[#525252] mb-6">
          {effectiveSelectedInsight
            ? 'The brief content was not saved. Click below to regenerate it.'
            : 'This brief is missing required data to display.'}
        </p>
        {effectiveSelectedInsight && (
          <button
            onClick={runGeneration}
            className="h-10 px-6 bg-[#0f62fe] text-white text-sm font-medium hover:bg-[#0353e9] transition-colors"
          >
            Regenerate Brief
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div ref={contentRef}>
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-[#e0e0e0]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
                Step 5 — Final Output
              </p>
              <h2 className="text-3xl font-light text-[#161616] tracking-tight">
                P&G Pink Brief
              </h2>
            </div>
            <span className="text-xs font-mono px-3 py-1 bg-[#fff1f1] text-[#da1e28]">
              Confidential
            </span>
          </div>

          {/* Source & Model Info */}
          <div className="flex items-center gap-4 mt-4 text-xs text-[#6f6f6f]">
            {sourceFilename && (
              <span className="flex items-center gap-1.5">
                <File size={12} />
                <span>Source: <span className="text-[#161616]">{sourceFilename}</span></span>
              </span>
            )}
            {modelUsed && (
              <span className="flex items-center gap-1.5">
                <Cpu size={12} />
                <span>Generated with: <span className="px-1.5 py-0.5 bg-[#e8daff] text-[#6929c4] rounded font-medium">{modelUsed === 'claude' ? 'Claude' : 'Gemini'}</span></span>
              </span>
            )}
          </div>
        </div>

        {/* Business Objective */}
        <section className="mb-6 p-6 bg-white border border-[#e0e0e0]">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Who-Inspired Business Objective" />
            {editingSection === 'business' ? (
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-xs text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-3 py-1.5 text-xs bg-[#0f62fe] text-white hover:bg-[#0353e9] transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEdit('business')}
                className="p-2 text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors print:hidden"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-1">
            <FieldRow
              label="To grow"
              value={content.business_objective.to_grow}
              onChange={(v) => updateNestedField('business_objective', 'to_grow', v)}
              isEditing={editingSection === 'business'}
            />
            <FieldRow
              label="We need to get"
              value={content.business_objective.we_need_to_get}
              onChange={(v) => updateNestedField('business_objective', 'we_need_to_get', v)}
              isEditing={editingSection === 'business'}
            />
            <FieldRow
              label="To"
              value={content.business_objective.to}
              onChange={(v) => updateNestedField('business_objective', 'to', v)}
              isEditing={editingSection === 'business'}
            />
            <FieldRow
              label="By forming the habit of"
              value={content.business_objective.by_forming_new_habit}
              onChange={(v) => updateNestedField('business_objective', 'by_forming_new_habit', v)}
              isEditing={editingSection === 'business'}
            />
          </div>
        </section>

        {/* Consumer Problem */}
        <section className="mb-6 p-6 bg-white border border-[#e0e0e0]">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Consumer's Problem to Solve" />
            {editingSection === 'consumer' ? (
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-xs text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-3 py-1.5 text-xs bg-[#0f62fe] text-white hover:bg-[#0353e9] transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEdit('consumer')}
                className="p-2 text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors print:hidden"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-1">
            <FieldRow
              label="Job To Be Done"
              value={content.consumer_problem.jtbd}
              onChange={(v) => updateNestedField('consumer_problem', 'jtbd', v)}
              isEditing={editingSection === 'consumer'}
            />
            <FieldRow
              label="Current Behavior"
              value={content.consumer_problem.current_behavior}
              onChange={(v) => updateNestedField('consumer_problem', 'current_behavior', v)}
              isEditing={editingSection === 'consumer'}
            />
            <FieldRow
              label="Struggle"
              value={content.consumer_problem.struggle}
              onChange={(v) => updateNestedField('consumer_problem', 'struggle', v)}
              isEditing={editingSection === 'consumer'}
            />
          </div>
        </section>

        {/* Communication Challenge */}
        <section className="mb-6 p-6 bg-white border border-[#e0e0e0]">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Communication Challenge" />
            {editingSection === 'comm' ? (
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-xs text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-3 py-1.5 text-xs bg-[#0f62fe] text-white hover:bg-[#0353e9] transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEdit('comm')}
                className="p-2 text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors print:hidden"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#f4f4f4] border-l-2 border-[#da1e28]">
              <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">From</p>
              {editingSection === 'comm' ? (
                <textarea
                  value={content.communication_challenge.from_state}
                  onChange={(e) => updateNestedField('communication_challenge', 'from_state', e.target.value)}
                  className="w-full p-2 bg-white border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe] resize-none h-20"
                />
              ) : (
                <p className="text-sm text-[#525252] italic">{content.communication_challenge.from_state}</p>
              )}
            </div>
            <div className="p-4 bg-[#f4f4f4] border-l-2 border-[#24a148]">
              <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">To</p>
              {editingSection === 'comm' ? (
                <textarea
                  value={content.communication_challenge.to_state}
                  onChange={(e) => updateNestedField('communication_challenge', 'to_state', e.target.value)}
                  className="w-full p-2 bg-white border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe] resize-none h-20"
                />
              ) : (
                <p className="text-sm text-[#525252] italic">{content.communication_challenge.to_state}</p>
              )}
            </div>
          </div>
          <div className="mt-4 p-4 bg-[#edf5ff]">
            <p className="text-xs font-mono text-[#0f62fe] uppercase tracking-wider mb-2">Bridge / Analogy</p>
            {editingSection === 'comm' ? (
              <input
                value={content.communication_challenge.analogy_or_device}
                onChange={(e) => updateNestedField('communication_challenge', 'analogy_or_device', e.target.value)}
                className="w-full p-2 bg-white border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
              />
            ) : (
              <p className="text-sm text-[#161616] font-medium">{content.communication_challenge.analogy_or_device}</p>
            )}
          </div>
        </section>

        {/* Message Strategy */}
        <section className="mb-6 p-6 bg-[#161616] text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#0f62fe]" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Communication Message Strategy</h3>
            </div>
            {editingSection === 'message' ? (
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-xs text-[#a8a8a8] hover:text-white hover:bg-[#393939] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-3 py-1.5 text-xs bg-[#0f62fe] text-white hover:bg-[#0353e9] transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEdit('message')}
                className="p-2 text-[#a8a8a8] hover:text-white transition-colors print:hidden"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-1">Benefit</p>
              {editingSection === 'message' ? (
                <input
                  value={content.message_strategy.benefit}
                  onChange={(e) => updateNestedField('message_strategy', 'benefit', e.target.value)}
                  className="w-full p-2 bg-[#393939] border border-[#525252] text-white text-lg focus:outline-none focus:border-[#0f62fe]"
                />
              ) : (
                <p className="text-xl font-medium">{content.message_strategy.benefit}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-1">Reason To Believe</p>
              {editingSection === 'message' ? (
                <input
                  value={content.message_strategy.rtb}
                  onChange={(e) => updateNestedField('message_strategy', 'rtb', e.target.value)}
                  className="w-full p-2 bg-[#393939] border border-[#525252] text-white focus:outline-none focus:border-[#0f62fe]"
                />
              ) : (
                <p className="text-sm text-[#c6c6c6]">{content.message_strategy.rtb}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-1">Brand Character</p>
              {editingSection === 'message' ? (
                <input
                  value={content.message_strategy.brand_character}
                  onChange={(e) => updateNestedField('message_strategy', 'brand_character', e.target.value)}
                  className="w-full p-2 bg-[#393939] border border-[#525252] text-white focus:outline-none focus:border-[#0f62fe]"
                />
              ) : (
                <p className="text-sm text-[#c6c6c6] italic">{content.message_strategy.brand_character}</p>
              )}
            </div>
          </div>
        </section>

        {/* Insights */}
        <section className="mb-6 p-6 bg-white border border-[#e0e0e0]">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Consumer Insights" />
            {editingSection === 'insights' ? (
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-xs text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-3 py-1.5 text-xs bg-[#0f62fe] text-white hover:bg-[#0353e9] transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEdit('insights')}
                className="p-2 text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors print:hidden"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-4">
            {content.insights.map((insight, idx) => (
              <div key={idx} className="p-4 bg-[#f4f4f4] border-l-2 border-[#0f62fe]">
                <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
                  Insight {insight.insight_number}
                </p>
                {editingSection === 'insights' ? (
                  <textarea
                    value={insight.insight_text}
                    onChange={(e) => updateInsight(idx, e.target.value)}
                    className="w-full p-2 bg-white border border-[#e0e0e0] text-sm text-[#161616] italic focus:outline-none focus:border-[#0f62fe] resize-none h-20"
                  />
                ) : (
                  <p className="text-sm text-[#161616] italic">"{insight.insight_text}"</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Execution */}
        <section className="mb-6 p-6 bg-white border border-[#e0e0e0]">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Execution Guidance" />
            {editingSection === 'execution' ? (
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-xs text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-3 py-1.5 text-xs bg-[#0f62fe] text-white hover:bg-[#0353e9] transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEdit('execution')}
                className="p-2 text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors print:hidden"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-[#f4f4f4]">
              <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">Key Media</p>
              {editingSection === 'execution' ? (
                <input
                  value={content.execution.key_media.join(', ')}
                  onChange={(e) => updateExecutionArray('key_media', e.target.value)}
                  className="w-full p-2 bg-white border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
                  placeholder="Separate with commas"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {content.execution.key_media.map((media, idx) => (
                    <span key={idx} className="px-2 py-1 bg-[#e0e0e0] text-xs font-medium text-[#161616]">
                      {media}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-[#f4f4f4]">
              <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">Campaign Pillars</p>
              {editingSection === 'execution' ? (
                <input
                  value={content.execution.campaign_pillars.join(', ')}
                  onChange={(e) => updateExecutionArray('campaign_pillars', e.target.value)}
                  className="w-full p-2 bg-white border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
                  placeholder="Separate with commas"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {content.execution.campaign_pillars.map((pillar, idx) => (
                    <span key={idx} className="px-2 py-1 bg-[#0f62fe] text-xs font-medium text-white">
                      {pillar}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-[#f4f4f4] mb-4">
            <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">Key Considerations</p>
            {editingSection === 'execution' ? (
              <textarea
                value={content.execution.key_considerations}
                onChange={(e) => updateNestedField('execution', 'key_considerations', e.target.value)}
                className="w-full p-2 bg-white border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe] resize-none h-16"
              />
            ) : (
              <p className="text-sm text-[#525252]">{content.execution.key_considerations}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#edf5ff]">
              <p className="text-xs font-mono text-[#0f62fe] uppercase tracking-wider mb-2">Business Success</p>
              {editingSection === 'execution' ? (
                <input
                  value={content.execution.success_measures.business}
                  onChange={(e) => setContent({
                    ...content,
                    execution: {
                      ...content.execution,
                      success_measures: {
                        ...content.execution.success_measures,
                        business: e.target.value
                      }
                    }
                  })}
                  className="w-full p-2 bg-white border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
                />
              ) : (
                <p className="text-sm font-medium text-[#161616]">{content.execution.success_measures.business}</p>
              )}
            </div>
            <div className="p-4 bg-[#defbe6]">
              <p className="text-xs font-mono text-[#24a148] uppercase tracking-wider mb-2">Equity Success</p>
              {editingSection === 'execution' ? (
                <input
                  value={content.execution.success_measures.equity}
                  onChange={(e) => setContent({
                    ...content,
                    execution: {
                      ...content.execution,
                      success_measures: {
                        ...content.execution.success_measures,
                        equity: e.target.value
                      }
                    }
                  })}
                  className="w-full p-2 bg-white border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
                />
              ) : (
                <p className="text-sm font-medium text-[#161616]">{content.execution.success_measures.equity}</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Success message */}
      {showSaveSuccess && (
        <div className="mb-6 p-4 bg-[#defbe6] border-l-4 border-[#24a148] flex items-center gap-3">
          <Save size={16} className="text-[#24a148]" />
          <p className="text-sm text-[#161616]">Brief saved successfully!</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-[#e0e0e0] print:hidden">
        <div className="flex gap-3">
          {!isAlreadySaved && (
            <button
              onClick={() => setShowDiscardDialog(true)}
              className="h-10 px-4 text-[#da1e28] text-sm font-medium flex items-center gap-2 hover:bg-[#fff1f1] transition-colors"
            >
              <Trash2 size={14} /> Discard
            </button>
          )}
          <button
            onClick={onReset}
            className="h-10 px-4 text-[#525252] text-sm font-medium flex items-center gap-2 hover:bg-[#f4f4f4] transition-colors"
          >
            <RotateCcw size={14} /> {isAlreadySaved ? 'Back to Repository' : 'Start over'}
          </button>
        </div>

        <div className="flex gap-3">
          {/* Regenerate button for drafts */}
          {!isAlreadySaved && effectiveSelectedInsight && (
            <button
              onClick={handleRegenerateBrief}
              className="h-10 px-4 bg-[#f4f4f4] text-[#161616] text-sm font-medium flex items-center gap-2 hover:bg-[#e0e0e0] transition-colors"
            >
              <RefreshCw size={14} /> Regenerate
            </button>
          )}

          <button
            onClick={handlePrint}
            className="h-10 px-4 bg-[#f4f4f4] text-[#161616] text-sm font-medium flex items-center gap-2 hover:bg-[#e0e0e0] transition-colors"
          >
            <Printer size={14} /> Print
          </button>

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="h-10 px-4 bg-[#f4f4f4] text-[#161616] text-sm font-medium flex items-center gap-2 hover:bg-[#e0e0e0] transition-colors disabled:bg-[#c6c6c6]"
            >
              {isExporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Export
              <ChevronDown size={14} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-[#e0e0e0] shadow-lg z-10">
                {/* Brief Only Section */}
                <div className="px-3 py-2 bg-[#f4f4f4] border-b border-[#e0e0e0]">
                  <p className="text-xs font-medium text-[#6f6f6f] uppercase tracking-wider">Brief Only</p>
                </div>
                <button
                  onClick={exportToWord}
                  className="w-full px-4 py-3 text-left text-sm text-[#161616] hover:bg-[#f4f4f4] flex items-center gap-3 transition-colors"
                >
                  <FileText size={16} className="text-[#0f62fe]" />
                  <div>
                    <p className="font-medium">Word Document</p>
                    <p className="text-xs text-[#6f6f6f]">Pink Brief only (.docx)</p>
                  </div>
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full px-4 py-3 text-left text-sm text-[#161616] hover:bg-[#f4f4f4] flex items-center gap-3 border-b border-[#e0e0e0] transition-colors"
                >
                  <File size={16} className="text-[#da1e28]" />
                  <div>
                    <p className="font-medium">PDF Document</p>
                    <p className="text-xs text-[#6f6f6f]">Pink Brief only (.pdf)</p>
                  </div>
                </button>

                {/* Full Package Section */}
                <div className="px-3 py-2 bg-[#f4f4f4] border-b border-[#e0e0e0]">
                  <p className="text-xs font-medium text-[#6f6f6f] uppercase tracking-wider">Full Package</p>
                </div>
                <button
                  onClick={exportToWordFull}
                  className="w-full px-4 py-3 text-left text-sm text-[#161616] hover:bg-[#f4f4f4] flex items-center gap-3 transition-colors"
                >
                  <FileText size={16} className="text-[#6929c4]" />
                  <div>
                    <p className="font-medium">Word Document</p>
                    <p className="text-xs text-[#6f6f6f]">Insight + Strategy + Brief (.docx)</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Save button */}
          {dbConfigured && (
            <button
              onClick={handleSaveBrief}
              disabled={isSavingBrief || showSaveSuccess}
              className={`h-10 px-4 text-white text-sm font-medium flex items-center gap-2 transition-colors ${
                showSaveSuccess
                  ? 'bg-[#24a148] cursor-default'
                  : 'bg-[#24a148] hover:bg-[#198038] disabled:bg-[#c6c6c6]'
              }`}
            >
              {isSavingBrief ? (
                <Loader2 size={14} className="animate-spin" />
              ) : showSaveSuccess ? (
                <Check size={14} />
              ) : (
                <Save size={14} />
              )}
              {showSaveSuccess ? 'Saved' : (isAlreadySaved || hasSavedThisSession) ? 'Update Brief' : 'Save Brief'}
            </button>
          )}
        </div>
      </div>

      {/* Discard confirmation dialog */}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        title="Discard Brief"
        message="Are you sure you want to discard this brief? This action cannot be undone and all your work will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep Working"
        variant="danger"
        onConfirm={handleDiscardBrief}
        onCancel={() => setShowDiscardDialog(false)}
      />

      {/* Regenerate confirmation dialog */}
      <ConfirmDialog
        isOpen={showRegenerateDialog}
        title="Regenerate Brief"
        message="This will generate a new Pink Brief using your current insight and strategy. Your current brief content will be replaced."
        confirmLabel="Regenerate"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={confirmRegenerate}
        onCancel={() => setShowRegenerateDialog(false)}
      />
    </div>
  );
};

export default SummaryModule;
