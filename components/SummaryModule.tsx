
import React, { useState, useEffect } from 'react';
import { Download, Printer, Loader2, Edit2, Plus, Trash2, FileText } from 'lucide-react';
import { generatePinkBrief } from '../geminiService.ts';
import { BriefData, PinkBriefContent, Deliverable } from '../types.ts';

const MagentaHeader = ({ title }: { title: string }) => (
  <div className="bg-[#c2185b] text-white px-6 py-2 mb-4">
    <h3 className="text-lg font-black tracking-tight uppercase">{title}</h3>
  </div>
);

const EditableWrapper = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <div className={`group relative ${className}`}>
    {children}
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <Edit2 size={14} className="text-slate-300" />
    </div>
  </div>
);

interface Props {
  briefData: BriefData;
  onReset: () => void;
  onProcessing: (val: boolean) => void;
}

const SummaryModule: React.FC<Props> = ({ briefData, onReset, onProcessing }) => {
  const [content, setContent] = useState<PinkBriefContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generate = async () => {
      setIsLoading(true);
      onProcessing(true);
      try {
        const result = await generatePinkBrief(briefData);
        setContent(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
        onProcessing(false);
      }
    };
    generate();
  }, [briefData]);

  const updateField = (field: keyof PinkBriefContent, value: string) => {
    if (!content) return;
    setContent({ ...content, [field]: value });
  };

  const updateDeliverable = (idx: number, field: keyof Deliverable, value: any) => {
    if (!content) return;
    const next = [...(content.deliverables || [])];
    next[idx] = { ...next[idx], [field]: value };
    setContent({ ...content, deliverables: next });
  };

  const addDeliverableRow = () => {
    if (!content) return;
    const next = [...(content.deliverables || []), { touchpoint: 'New Touchpoint', messages: ['New Message'] }];
    setContent({ ...content, deliverables: next });
  };

  const removeDeliverableRow = (idx: number) => {
    if (!content) return;
    const next = (content.deliverables || []).filter((_, i) => i !== idx);
    setContent({ ...content, deliverables: next });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-6 h-full">
        <Loader2 className="animate-spin text-[#c2185b]" size={64} />
        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-sm">Architecting Pink Brief...</p>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6">
      <div className="flex justify-between items-start border-b pb-6">
        <div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Superior Communication Brief</p>
          <EditableWrapper>
            <input 
              value={content.locationBrandProject}
              onChange={(e) => updateField('locationBrandProject', e.target.value)}
              className="text-[#c2185b] text-2xl font-black focus:ring-0 border-none p-0 w-[500px] bg-transparent whitespace-normal"
            />
          </EditableWrapper>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-rose-50 border border-rose-100 rounded text-[10px] font-black text-rose-600 uppercase tracking-widest">Highly Restricted</div>
          <div className="flex gap-2">
             <div className="w-8 h-8 rounded-full bg-slate-200" />
             <div className="w-8 h-8 rounded-full bg-blue-600" />
             <div className="w-8 h-8 rounded-full bg-rose-400" />
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <section>
          <MagentaHeader title="Business Objective" />
          <div className="space-y-4 px-4 py-2">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[#c2185b] shrink-0">To grow</span>
              <EditableWrapper className="flex-1">
                <input 
                  value={content.toGrow}
                  onChange={(e) => updateField('toGrow', e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-800"
                />
              </EditableWrapper>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[#c2185b] shrink-0">we need to prevent</span>
              <EditableWrapper className="flex-1">
                <input 
                  value={content.needToPrevent}
                  onChange={(e) => updateField('needToPrevent', e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-800"
                />
              </EditableWrapper>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[#c2185b] shrink-0">And</span>
              <EditableWrapper className="flex-1">
                <input 
                  value={content.andObjective}
                  onChange={(e) => updateField('andObjective', e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-800"
                />
              </EditableWrapper>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[#c2185b] shrink-0">by forming the new consumer habit of</span>
              <EditableWrapper className="flex-1">
                <input 
                  value={content.byForming}
                  onChange={(e) => updateField('byForming', e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-800"
                />
              </EditableWrapper>
            </div>
          </div>
        </section>

        <section>
          <MagentaHeader title="Our Opportunity - The Consumer’s Problem to Solve:" />
          <div className="space-y-4 px-2">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[#c2185b] shrink-0">This consumers' JTBD</span>
              <EditableWrapper className="flex-1">
                <input 
                  value={content.jtbd}
                  onChange={(e) => updateField('jtbd', e.target.value)}
                  className="w-full bg-transparent border-b border-slate-100 p-1 focus:ring-0 italic"
                />
              </EditableWrapper>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[#c2185b] shrink-0">This consumer currently</span>
              <EditableWrapper className="flex-1">
                <input 
                  value={content.consumerCurrently}
                  onChange={(e) => updateField('consumerCurrently', e.target.value)}
                  className="w-full bg-transparent border-b border-slate-100 p-1 focus:ring-0"
                />
              </EditableWrapper>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[#c2185b] shrink-0">But this leads them to struggle with</span>
              <EditableWrapper className="flex-1">
                <input 
                  value={content.struggleWith}
                  onChange={(e) => updateField('struggleWith', e.target.value)}
                  className="w-full bg-transparent border-b border-slate-100 p-1 focus:ring-0"
                />
              </EditableWrapper>
            </div>
          </div>
        </section>

        <section>
          <MagentaHeader title="So Our Communication Challenge is:" />
          <EditableWrapper>
            <textarea 
              value={content.commChallenge}
              onChange={(e) => updateField('commChallenge', e.target.value)}
              className="w-full p-4 border-none bg-slate-50 rounded-xl focus:ring-1 focus:ring-slate-200 text-slate-800 text-base leading-relaxed h-20 resize-none whitespace-normal break-words"
            />
          </EditableWrapper>
        </section>

        <section className="bg-rose-50/50 p-6 rounded-2xl">
          <MagentaHeader title="Our Communication Message Strategy that Solves the Problem:" />
          <div className="space-y-4 px-2">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[#c2185b] shrink-0">Benefit:</span>
              <EditableWrapper className="flex-1">
                <input 
                  value={content.benefit}
                  onChange={(e) => updateField('benefit', e.target.value)}
                  className="w-full bg-transparent border-b border-[#c2185b]/20 p-1 focus:ring-0"
                />
              </EditableWrapper>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[#c2185b] shrink-0">RTB:</span>
              <EditableWrapper className="flex-1">
                <input 
                  value={content.rtb}
                  onChange={(e) => updateField('rtb', e.target.value)}
                  className="w-full bg-transparent border-b border-[#c2185b]/20 p-1 focus:ring-0"
                />
              </EditableWrapper>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[#c2185b] shrink-0">Brand Character:</span>
              <EditableWrapper className="flex-1">
                <input 
                  value={content.brandCharacter}
                  onChange={(e) => updateField('brandCharacter', e.target.value)}
                  className="w-full bg-transparent border-b border-[#c2185b]/20 p-1 focus:ring-0"
                />
              </EditableWrapper>
            </div>
          </div>
        </section>

        <section>
          <MagentaHeader title="Insight(s) or Truth(s) That Could Inspire Heart and/or Mind-Opening Advertising" />
          <div className="space-y-6 px-2 italic text-slate-700">
             <div className="flex gap-4">
               <span className="font-bold text-[#c2185b] shrink-0">Insight 1:</span>
               <EditableWrapper className="flex-1">
                 <textarea 
                   value={content.insight1}
                   onChange={(e) => updateField('insight1', e.target.value)}
                   className="w-full bg-transparent border-none p-0 focus:ring-0 h-16 resize-none whitespace-normal break-words"
                 />
               </EditableWrapper>
             </div>
             <div className="flex gap-4">
               <span className="font-bold text-[#c2185b] shrink-0">Insight 2:</span>
               <EditableWrapper className="flex-1">
                 <textarea 
                   value={content.insight2}
                   onChange={(e) => updateField('insight2', e.target.value)}
                   className="w-full bg-transparent border-none p-0 focus:ring-0 h-16 resize-none whitespace-normal break-words"
                 />
               </EditableWrapper>
             </div>
          </div>
        </section>

        <section className="pt-12 border-t">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-slate-800">Deliverables</h3>
            <button 
              onClick={addDeliverableRow}
              className="flex items-center gap-2 px-4 py-2 bg-[#c2185b] text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#a0134d] transition-colors"
            >
              <Plus size={16} /> Add Row
            </button>
          </div>
          <table className="w-full border-collapse border-2 border-slate-900 table-fixed">
            <thead>
              <tr className="bg-slate-50">
                <th className="border-2 border-slate-900 p-4 text-left font-black uppercase text-sm w-1/3">Touchpoint</th>
                <th className="border-2 border-slate-900 p-4 text-left font-black uppercase text-sm">Message(s)</th>
                <th className="border-2 border-slate-900 p-4 text-center font-black uppercase text-sm w-16"></th>
              </tr>
            </thead>
            <tbody>
              {(content.deliverables || []).map((d, i) => (
                <tr key={i}>
                  <td className="border-2 border-slate-900 p-4">
                    <EditableWrapper>
                      <input 
                        value={d.touchpoint}
                        onChange={(e) => updateDeliverable(i, 'touchpoint', e.target.value)}
                        className="w-full bg-transparent border-none font-bold p-0 focus:ring-0 whitespace-normal overflow-hidden overflow-ellipsis"
                      />
                    </EditableWrapper>
                  </td>
                  <td className="border-2 border-slate-900 p-4">
                    <EditableWrapper>
                      <textarea 
                        value={(d.messages || []).join('\n')}
                        onChange={(e) => updateDeliverable(i, 'messages', e.target.value.split('\n'))}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm leading-relaxed h-20 resize-none whitespace-normal break-words"
                      />
                    </EditableWrapper>
                  </td>
                  <td className="border-2 border-slate-900 p-4 text-center">
                    <button 
                      onClick={() => removeDeliverableRow(i)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#c2185b]">Key Media</h4>
            <EditableWrapper>
              <input 
                value={content.keyMedia}
                onChange={(e) => updateField('keyMedia', e.target.value)}
                className="w-full bg-transparent border-none font-bold text-slate-800 p-0 focus:ring-0 text-sm"
              />
            </EditableWrapper>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#c2185b]">Budget</h4>
            <EditableWrapper>
              <input 
                value={content.budget}
                onChange={(e) => updateField('budget', e.target.value)}
                className="w-full bg-transparent border-none font-bold text-slate-800 p-0 focus:ring-0 text-sm"
              />
            </EditableWrapper>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#c2185b]">In-Market Date</h4>
            <EditableWrapper>
              <input 
                value={content.inMarketDate}
                onChange={(e) => updateField('inMarketDate', e.target.value)}
                className="w-full bg-transparent border-none font-bold text-slate-800 p-0 focus:ring-0 text-sm"
              />
            </EditableWrapper>
          </div>
          <div className="space-y-4">
            <h4 className="bg-[#c2185b] text-white px-2 py-1 text-[10px] font-black uppercase tracking-widest inline-block">Success Measures</h4>
            <div className="space-y-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-400">Business</span>
                <EditableWrapper>
                  <input 
                    value={content.successMeasuresBusiness}
                    onChange={(e) => updateField('successMeasuresBusiness', e.target.value)}
                    className="bg-transparent border-none font-bold text-slate-800 p-0 focus:ring-0 text-sm"
                  />
                </EditableWrapper>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-400">Equity</span>
                <EditableWrapper>
                  <input 
                    value={content.successMeasuresEquity}
                    onChange={(e) => updateField('successMeasuresEquity', e.target.value)}
                    className="bg-transparent border-none font-bold text-slate-800 p-0 focus:ring-0 text-sm"
                  />
                </EditableWrapper>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-6 pt-12 border-t mt-12">
        <div className="flex gap-4">
          <button className="flex items-center gap-3 px-8 py-4 bg-[#003da5] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 shadow-xl shadow-blue-200 transition-all">
            <FileText size={18} /> Save to Word
          </button>
          <button className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
            <Printer size={18} /> Print to PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryModule;
