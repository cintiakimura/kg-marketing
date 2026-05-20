import { Webinar } from '@/api/entities';
import { invokeFunction } from '@/api/functions';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Plus, ExternalLink, Video, X, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function Calendar() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    host_name: '',
    meeting_link: '',
    max_attendees: 100
  });
  const queryClient = useQueryClient();

  const { data: webinars = [], isLoading } = useQuery({
    queryKey: ['webinars'],
    queryFn: () => Webinar.list('-start_time')
  });

  const syncCalendarMutation = useMutation({
    mutationFn: () => invokeFunction('syncGoogleCalendar', { action: 'sync' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['webinars']);
    }
  });

  const createWebinarMutation = useMutation({
    mutationFn: (data) => invokeFunction('syncGoogleCalendar', {
      action: 'create',
      event: {
        title: data.title,
        description: data.description,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
        host_name: data.host_name,
        attendees: []
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['webinars']);
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        host_name: '',
        meeting_link: '',
        max_attendees: 100
      });
    }
  });

  const generateGoogleCalendarLink = (webinar) => {
    const startDate = new Date(webinar.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(webinar.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(webinar.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(webinar.description || '')}&location=${encodeURIComponent(webinar.meeting_link || '')}`;
  };

  const upcomingWebinars = webinars.filter((w) => new Date(w.start_time) > new Date());
  const pastWebinars = webinars.filter((w) => new Date(w.start_time) <= new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-white mb-2">Calendar & Webinars</h1>
          <p className="text-gray-400">Synced with info@kgprotech.com</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => syncCalendarMutation.mutate()}
            disabled={syncCalendarMutation.isPending}
            className="bg-kg-raised hover:bg-[#444444] text-white">
            <RefreshCw className={`w-5 h-5 mr-2 ${syncCalendarMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Calendar
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="kg">
            <Plus className="w-5 h-5 mr-2" />
            Schedule Webinar
          </Button>
        </div>
      </div>

      {/* Upcoming Webinars */}
      <div>
        <h2 className="text-xl font-medium text-white mb-4">Upcoming Sessions</h2>
        {upcomingWebinars.length === 0 ?
        <div className="bg-kg-surface rounded-xl border border-kg-green/25 p-8 text-center">
            <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No upcoming webinars scheduled</p>
          </div> :

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingWebinars.map((webinar) =>
          <div key={webinar.id} className="bg-kg-surface rounded-xl border border-kg-green/25 p-6 hover:border-kg-green/40 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-medium text-white">{webinar.title}</h3>
                  <Badge className="bg-kg-green text-white border-0">Upcoming</Badge>
                </div>
                
                <p className="text-gray-400 text-sm mb-4">{webinar.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 text-kg-green" />
                    <span className="text-gray-300">
                      {format(new Date(webinar.start_time), 'MMM dd, yyyy • HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Host:</span>
                    <span className="text-gray-300">{webinar.host_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Attendees:</span>
                    <span className="text-kg-green font-medium">
                      {webinar.attendees?.length || 0} / {webinar.max_attendees}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {webinar.meeting_link &&
              <Button
                size="sm"
                className="flex-1 bg-kg-raised hover:bg-[#444444] text-white"
                onClick={() => window.open(webinar.meeting_link, '_blank')}>

                      <Video className="w-4 h-4 mr-2" />
                      Join Meeting
                    </Button>
              }
                  <Button
                size="sm"
                variant="outline" className="bg-kg-green text-white px-3 text-xs font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-8 border-kg-green/20 hover:bg-kg-raised"

                onClick={() => window.open(generateGoogleCalendarLink(webinar), '_blank')}>

                    <ExternalLink className="w-4 h-4 mr-2" />
                    Add to Calendar
                  </Button>
                </div>
              </div>
          )}
          </div>
        }
      </div>

      {/* Past Webinars */}
      {pastWebinars.length > 0 &&
      <div>
          <h2 className="text-xl font-medium text-white mb-4">Past Sessions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pastWebinars.map((webinar) =>
          <div key={webinar.id} className="bg-kg-surface rounded-xl border border-kg-green/25 p-6 opacity-75">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-medium text-white">{webinar.title}</h3>
                  <Badge className="bg-gray-500 text-white border-0">Completed</Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">
                    {format(new Date(webinar.start_time), 'MMM dd, yyyy')}
                  </span>
                  <span className="text-gray-500 ml-auto">
                    {webinar.attendees?.length || 0} attended
                  </span>
                </div>
              </div>
          )}
          </div>
        </div>
      }

      {/* Create Webinar Modal */}
      {isCreateModalOpen &&
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-kg-surface rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-custom">
            <div className="sticky top-0 bg-kg-surface border-b border-kg-green/25 p-6 flex items-center justify-between">
              <h2 className="text-xl font-medium text-white">Schedule Webinar</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label className="text-gray-300 mb-2">Title</Label>
                <Input
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="IoT Automotive Training Session"
                className="bg-kg-raised border-kg-green/20 text-white" />

              </div>

              <div>
                <Label className="text-gray-300 mb-2">Description</Label>
                <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Session overview and topics covered"
                rows={3}
                className="bg-kg-raised border-kg-green/20 text-white" />

              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300 mb-2">Start Time</Label>
                  <Input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                  className="bg-kg-raised border-kg-green/20 text-white" />

                </div>
                <div>
                  <Label className="text-gray-300 mb-2">End Time</Label>
                  <Input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                  className="bg-kg-raised border-kg-green/20 text-white" />

                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300 mb-2">Host Name</Label>
                  <Input
                  value={formData.host_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, host_name: e.target.value }))}
                  placeholder="John Doe"
                  className="bg-kg-raised border-kg-green/20 text-white" />

                </div>
                <div>
                  <Label className="text-gray-300 mb-2">Max Attendees</Label>
                  <Input
                  type="number"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData((prev) => ({ ...prev, max_attendees: parseInt(e.target.value) }))}
                  className="bg-kg-raised border-kg-green/20 text-white" />

                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2">Meeting Link (Optional)</Label>
                <Input
                value={formData.meeting_link}
                onChange={(e) => setFormData((prev) => ({ ...prev, meeting_link: e.target.value }))}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                className="bg-kg-raised border-kg-green/20 text-white" />

                <p className="text-gray-500 text-xs mt-1">Google Meet, Zoom, or any meeting platform link</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                onClick={() => createWebinarMutation.mutate(formData)}
                disabled={!formData.title || !formData.start_time || createWebinarMutation.isPending}
                variant="kg" className="flex-1">

                  Schedule Webinar
                </Button>
                <Button
                onClick={() => setIsCreateModalOpen(false)}
                variant="outline"
                className="border-kg-green/20 text-gray-300 hover:bg-kg-raised">

                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}