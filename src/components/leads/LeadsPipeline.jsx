import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PIPELINE_STATUSES, normalizeLeadStatus, isSmartFinderLead } from '@/lib/leadConstants';
import { Badge } from '@/components/ui/badge';
import { Sparkles, GripVertical } from 'lucide-react';

function formatShortDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function LeadCard({ lead, onOpen }) {
  const followUp = lead.next_followup_date;
  const isOverdue =
    followUp && new Date(followUp) < new Date(new Date().toDateString());

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(lead)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(lead)}
      className="bg-[#333333] border border-[#444444] rounded-xl p-4 cursor-pointer hover:border-[#00c600]/50 transition-colors"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{lead.full_name}</p>
          <p className="text-xs text-gray-400 truncate">{lead.title || '—'}</p>
          <p className="text-xs text-[#00c600]/90 truncate">{lead.company || '—'}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {lead.fit_score != null && (
              <Badge className="bg-[#00c600]/20 text-[#00c600] border-0 text-[10px]">
                Fit {lead.fit_score}
              </Badge>
            )}
            {isSmartFinderLead(lead) && (
              <Badge
                variant="outline"
                className="text-[10px] border-[#00c600]/40 text-[#00c600] px-1"
              >
                <Sparkles className="w-2.5 h-2.5 mr-0.5 inline" />
                Smart Finder
              </Badge>
            )}
            {followUp && (
              <Badge
                className={`text-[10px] border-0 ${
                  isOverdue ? 'bg-red-500/80' : 'bg-amber-500/30 text-amber-200'
                }`}
              >
                {formatShortDate(followUp)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeadsPipeline({ leads, onStatusChange, onOpenLead }) {
  const columns = PIPELINE_STATUSES.map((status) => ({
    ...status,
    leads: leads.filter((l) => normalizeLeadStatus(l.status) === status.id),
  }));

  const handleDragEnd = (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newStatus = destination.droppableId;
    const lead = leads.find((l) => l.id === draggableId);
    if (!lead || normalizeLeadStatus(lead.status) === newStatus) return;
    onStatusChange(lead.id, newStatus);
  };

  return (
    <div className="bg-[#2a2a2a] rounded-xl border border-[#333333] p-6 md:p-8 overflow-hidden mb-8">
      <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-5">
        Pipeline
      </h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-custom">
          {columns.map((col) => (
            <div key={col.id} className="flex-shrink-0 w-[220px]">
              <div
                className={`flex items-center justify-between mb-2 px-2 py-1 rounded-md border ${col.border} bg-[#252525]`}
              >
                <span className="text-xs font-medium text-white">{col.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full text-white ${col.color}`}>
                  {col.leads.length}
                </span>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[120px] space-y-2 rounded-lg p-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-[#00c600]/5' : 'bg-[#1f1f1f]'
                    }`}
                  >
                    {col.leads.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={dragSnapshot.isDragging ? 'opacity-90 rotate-1' : ''}
                          >
                            <LeadCard lead={lead} onOpen={onOpenLead} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
