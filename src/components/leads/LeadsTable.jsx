import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getStatusMeta, isSmartFinderLead } from '@/lib/leadConstants';
import { Sparkles } from 'lucide-react';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function notesPreview(notes) {
  if (!notes) return '—';
  const line = notes.split('\n').find((l) => l.trim() && !l.startsWith('---'));
  return line?.slice(0, 60) || '—';
}

function fitBadgeClass(score) {
  if (score >= 9) return 'bg-kg-green text-white font-semibold';
  if (score >= 7) return 'bg-emerald-600/90 text-white';
  return 'bg-gray-600 text-white';
}

export default function LeadsTable({
  leads,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenLead,
  allSelected,
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-kg-green/25 hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
                className="border-[#555] data-[state=checked]:bg-kg-green"
              />
            </TableHead>
            <TableHead className="text-gray-400">Name</TableHead>
            <TableHead className="text-gray-400">Title</TableHead>
            <TableHead className="text-gray-400">Company</TableHead>
            <TableHead className="text-gray-400">Status</TableHead>
            <TableHead className="text-gray-400">Next Follow-up</TableHead>
            <TableHead className="text-gray-400">Fit Score</TableHead>
            <TableHead className="text-gray-400">Last Contact</TableHead>
            <TableHead className="text-gray-400">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const statusMeta = getStatusMeta(lead.status);
            const isOverdue =
              lead.next_followup_date &&
              new Date(lead.next_followup_date) < new Date(new Date().toDateString());

            return (
              <TableRow
                key={lead.id}
                className="border-kg-green/25 hover:bg-kg-raised/80 cursor-pointer"
                onClick={() => onOpenLead(lead)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(lead.id)}
                    onCheckedChange={() => onToggleSelect(lead.id)}
                    className="border-[#555] data-[state=checked]:bg-kg-green"
                  />
                </TableCell>
                <TableCell className="text-white font-medium">
                  <div className="flex items-center gap-2">
                    {lead.full_name}
                    {isSmartFinderLead(lead) && (
                      <Sparkles className="w-3.5 h-3.5 text-kg-green shrink-0" title="Smart Lead Finder" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-400 text-sm">{lead.title || '—'}</TableCell>
                <TableCell className="text-gray-300 text-sm">{lead.company || '—'}</TableCell>
                <TableCell>
                  <Badge className={`${statusMeta.color} text-white border-0 text-xs`}>
                    {statusMeta.label}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-sm ${isOverdue ? 'text-red-400 font-medium' : 'text-gray-400'}`}
                >
                  {formatDate(lead.next_followup_date)}
                </TableCell>
                <TableCell>
                  {lead.fit_score != null ? (
                    <Badge className={`${fitBadgeClass(lead.fit_score)} border-0 text-xs`}>
                      {lead.fit_score}/10
                    </Badge>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </TableCell>
                <TableCell className="text-gray-400 text-sm">
                  {formatDate(lead.last_contact_at || lead.last_status_change)}
                </TableCell>
                <TableCell className="text-gray-500 text-xs max-w-[200px] truncate">
                  {notesPreview(lead.notes)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
