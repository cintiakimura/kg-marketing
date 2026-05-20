import { EmailMessage } from '@/api/entities';
import { sendEmail } from '@/api/integrations';
import { invokeFunction } from '@/api/functions';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Inbox, Send, FileText, Trash2, Plus, X, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function Webmail() {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({
    to_email: '',
    subject: '',
    body: ''
  });
  const queryClient = useQueryClient();

  const { data: emails = [] } = useQuery({
    queryKey: ['emails'],
    queryFn: () => EmailMessage.list('-created_date')
  });

  const syncGmailMutation = useMutation({
    mutationFn: () => invokeFunction('syncGmail', { action: 'sync' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['emails']);
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data) => invokeFunction('syncGmail', {
      action: 'send',
      to: data.to_email,
      subject: data.subject,
      body: data.body
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['emails']);
      setIsComposeOpen(false);
      setComposeData({ to_email: '', subject: '', body: '' });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (emailId) => EmailMessage.update(emailId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['emails']);
    }
  });

  const folders = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'draft', label: 'Drafts', icon: FileText },
  { id: 'trash', label: 'Trash', icon: Trash2 }];


  const filteredEmails = emails.filter((e) => e.folder === activeFolder);

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    if (!email.is_read && email.folder === 'inbox') {
      markAsReadMutation.mutate(email.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Webmail</h1>
          <p className="text-gray-400">Synced with info@kgprotech.com</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => syncGmailMutation.mutate()}
            disabled={syncGmailMutation.isPending}
            className="bg-[#333333] hover:bg-[#444444] text-white">
            <RefreshCw className={`w-5 h-5 mr-2 ${syncGmailMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Gmail
          </Button>
          <Button
            onClick={() => setIsComposeOpen(true)}
            className="bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-medium">
            <Plus className="w-5 h-5 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-[#2a2a2a] rounded-xl border border-[#333333] p-4">
            <nav className="space-y-1">
              {folders.map((folder) => {
                const Icon = folder.icon;
                const count = emails.filter((e) => e.folder === folder.id).length;
                const unreadCount = emails.filter((e) => e.folder === folder.id && !e.is_read).length;

                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setActiveFolder(folder.id);
                      setSelectedEmail(null);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    activeFolder === folder.id ?
                    'bg-[#00c600] text-[#212121]' :
                    'text-gray-300 hover:bg-[#333333]'}`
                    }>

                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{folder.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 &&
                      <Badge className="bg-red-500 text-white border-0 text-xs px-2">
                          {unreadCount}
                        </Badge>
                      }
                      <span className="text-sm">{count}</span>
                    </div>
                  </button>);

              })}
            </nav>
          </div>
        </div>

        {/* Email List */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-[#2a2a2a] rounded-xl border border-[#333333] overflow-hidden">
            <div className="p-4 border-b border-[#333333]">
              <h2 className="text-lg font-bold text-white">
                {folders.find((f) => f.id === activeFolder)?.label}
              </h2>
            </div>
            <div className="divide-y divide-[#333333] max-h-[600px] overflow-y-auto scrollbar-custom">
              {filteredEmails.length === 0 ?
              <div className="p-8 text-center">
                  <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No emails in this folder</p>
                </div> :

              filteredEmails.map((email) =>
              <button
                key={email.id}
                onClick={() => handleEmailClick(email)}
                className={`w-full p-4 text-left hover:bg-[#333333] transition-colors ${
                selectedEmail?.id === email.id ? 'bg-[#333333]' : ''} ${
                !email.is_read ? 'border-l-4 border-[#00c600]' : ''}`}>

                    <div className="flex items-start justify-between mb-1">
                      <p className={`text-sm ${!email.is_read ? 'text-white font-bold' : 'text-gray-300'}`}>
                        {activeFolder === 'sent' ? email.to_email : email.from_email}
                      </p>
                      <span className="text-xs text-gray-500">
                        {email.date ? format(new Date(email.date), 'MMM dd') : format(new Date(email.created_date), 'MMM dd')}
                      </span>
                    </div>
                    <p className={`text-sm mb-1 ${!email.is_read ? 'text-white font-semibold' : 'text-gray-400'}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {email.body}
                    </p>
                  </button>
              )
              }
            </div>
          </div>
        </div>

        {/* Email Detail */}
        <div className="col-span-12 lg:col-span-5">
          {selectedEmail ?
          <div className="bg-[#2a2a2a] rounded-xl border border-[#333333] p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">{selectedEmail.subject}</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">From:</span>
                    <span className="text-gray-300">{selectedEmail.from_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">To:</span>
                    <span className="text-gray-300">{selectedEmail.to_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Date:</span>
                    <span className="text-gray-300">
                      {selectedEmail.date ?
                    format(new Date(selectedEmail.date), 'MMM dd, yyyy HH:mm') :
                    format(new Date(selectedEmail.created_date), 'MMM dd, yyyy HH:mm')
                    }
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t border-[#333333] pt-6">
                <p className="text-gray-300 whitespace-pre-wrap">{selectedEmail.body}</p>
              </div>
            </div> :

          <div className="bg-[#2a2a2a] rounded-xl border border-[#333333] p-12 text-center">
              <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Select an email to view</p>
            </div>
          }
        </div>
      </div>

      {/* Compose Modal */}
      {isComposeOpen &&
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-xl max-w-2xl w-full">
            <div className="border-b border-[#333333] p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">New Message</h2>
              <button onClick={() => setIsComposeOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label className="text-gray-300 mb-2">To</Label>
                <Input
                value={composeData.to_email}
                onChange={(e) => setComposeData((prev) => ({ ...prev, to_email: e.target.value }))}
                placeholder="recipient@example.com"
                className="bg-[#333333] border-[#444444] text-white" />

              </div>

              <div>
                <Label className="text-gray-300 mb-2">Subject</Label>
                <Input
                value={composeData.subject}
                onChange={(e) => setComposeData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
                className="bg-[#333333] border-[#444444] text-white" />

              </div>

              <div>
                <Label className="text-gray-300 mb-2">Message</Label>
                <Textarea
                value={composeData.body}
                onChange={(e) => setComposeData((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Type your message here..."
                rows={10}
                className="bg-[#333333] border-[#444444] text-white" />

              </div>

              <div className="flex gap-3">
                <Button
                onClick={() => sendEmailMutation.mutate(composeData)}
                disabled={!composeData.to_email || !composeData.subject || sendEmailMutation.isPending}
                className="flex-1 bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-medium">

                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button
                onClick={() => setIsComposeOpen(false)}
                variant="outline" className="bg-[#00c600] text-[#212121] px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-9 border-[#444444] hover:bg-[#333333]">


                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}