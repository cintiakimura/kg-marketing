import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PIPELINE_STATUSES } from '@/lib/leadConstants';
import { Trash2, Calendar, Tag } from 'lucide-react';

export default function LeadsBulkBar({
  count,
  onApplyStatus,
  onApplyFollowUpDate,
  onDelete,
  isBusy,
}) {
  const [status, setStatus] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-3 px-5 py-3 rounded-xl bg-kg-surface border border-kg-green/40 shadow-2xl shadow-black/50">
      <span className="text-sm text-white font-medium">{count} selected</span>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[180px] bg-kg-raised border-kg-green/20 text-white h-9">
          <Tag className="w-4 h-4 mr-2 text-kg-green" />
          <SelectValue placeholder="Change status" />
        </SelectTrigger>
        <SelectContent>
          {PIPELINE_STATUSES.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        disabled={!status || isBusy}
        onClick={() => {
          onApplyStatus(status);
          setStatus('');
        }}
        className="bg-kg-raised hover:bg-[#444444] text-white"
      >
        Apply status
      </Button>

      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-kg-green" />
        <Input
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
          className="w-[160px] h-9 bg-kg-raised border-kg-green/20 text-white"
        />
        <Button
          type="button"
          size="sm"
          disabled={!followUpDate || isBusy}
          onClick={() => {
            onApplyFollowUpDate(followUpDate);
            setFollowUpDate('');
          }}
          className="bg-kg-raised hover:bg-[#444444] text-white"
        >
          Set follow-up
        </Button>
      </div>

      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={isBusy}
        onClick={onDelete}
        className="bg-red-600/90 hover:bg-red-600"
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete
      </Button>
    </div>
  );
}
