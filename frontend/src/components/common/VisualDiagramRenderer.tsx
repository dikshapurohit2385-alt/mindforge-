import React from 'react';
import type { VisualComponentData } from '../../types';
import { ArrowRight, CheckCircle2, Grid, Sparkles, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface VisualDiagramRendererProps {
  component: VisualComponentData;
}

export const VisualDiagramRenderer: React.FC<VisualDiagramRendererProps> = ({ component }) => {
  if (!component) return null;

  const { type, title, headers, rows, steps, nodes } = component;

  return (
    <div className="my-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/30 overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -top-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5 pb-3.5 border-b border-indigo-800/50">
        <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          {type === 'flow_diagram' ? <Activity className="w-5 h-5 text-sky-400" /> : <Grid className="w-5 h-5 text-indigo-400" />}
        </div>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 block">Visual Learning Representation</span>
          <h4 className="text-base font-bold text-white">{title}</h4>
        </div>
      </div>

      {/* Flow Diagram Rendering */}
      {(type === 'flow_diagram' || (steps && steps.length > 0)) && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {steps?.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl bg-slate-800/80 border border-indigo-500/20 hover:border-indigo-400/50 transition-all flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                      {step.step_number || idx + 1}
                    </span>
                    <Sparkles className="w-4 h-4 text-sky-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h5 className="font-bold text-sm text-slate-100 mb-1">{step.title}</h5>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">{step.description}</p>
                </div>
                {idx < (steps.length - 1) && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-900 border border-indigo-500/40 items-center justify-center text-sky-400 shadow-md">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Table Rendering */}
      {(type === 'comparison_table' || (headers && rows)) && (
        <div className="overflow-x-auto rounded-xl border border-indigo-500/20 bg-slate-950/60">
          <table className="w-full text-left text-xs text-slate-200">
            {headers && headers.length > 0 && (
              <thead className="bg-indigo-950/80 text-sky-300 uppercase tracking-wider font-extrabold border-b border-indigo-800/50">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-indigo-950/40 font-medium">
              {rows?.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/10'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className={`py-3 px-4 ${cIdx === 0 ? 'font-bold text-slate-100' : 'text-slate-300'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Concept Map Nodes Rendering */}
      {(type === 'concept_map' || (nodes && nodes.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {nodes?.map((node, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-sky-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm text-white block">{node.label}</span>
                {node.details && <span className="text-xs text-slate-300 mt-0.5 block leading-relaxed">{node.details}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
