import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PIPELINE_STATUSES, normalizeLeadStatus } from '@/lib/leadConstants';

function LeadCard({ lead, onOpen }) {
  const displayName = lead.full_name?.trim() || lead.email || 'Unnamed lead';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(lead)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(lead)}
      className="bg-kg-input border border-green-500/20 rounded-xl p-4 cursor-pointer hover:border-green-500/50 transition-colors"
      title={displayName}
    >
      <p className="text-[16px] font-medium text-white truncate leading-snug">
        {displayName}
      </p>
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
    <div className="bg-kg-card rounded-xl border border-green-500/25 p-6 md:p-8 overflow-hidden mb-8">
      <h2 className="text-[18px] font-medium text-gray-300 uppercase tracking-wide mb-5">
        Pipeline
      </h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-custom">
          {columns.map((col) => (
            <div key={col.id} className="flex-shrink-0 w-[220px] flex flex-col">
              <div
                className={`flex items-center justify-between mb-2 px-2 py-1 rounded-md border shrink-0 ${col.border} bg-kg-input`}
              >
                <span className="text-[18px] font-medium text-white">{col.label}</span>
                <span className={`text-[18px] px-2 py-0.5 rounded-full text-white ${col.color}`}>
                  {col.leads.length}
                </span>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`pipeline-column-scroll scrollbar-pipeline min-h-[120px] max-h-[min(420px,50vh)] space-y-2 rounded-lg p-2 transition-colors border border-green-500/15 overflow-y-auto ${
                      snapshot.isDraggingOver
                        ? 'bg-green-500/10 border-green-500/35'
                        : 'bg-kg-input'
                    }`}
                  >
                    {col.leads.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={dragSnapshot.isDragging ? 'opacity-90' : ''}
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
