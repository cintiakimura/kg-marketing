import { Webinar } from '@/api/entities';
import { sendEmail } from '@/api/integrations';
import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, Building2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ScheduleWebinar() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const getNextTwoWeeks = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !formData.name || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const webinarDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const endDateTime = new Date(webinarDateTime.getTime() + 15 * 60000);

      await Webinar.create({
        title: `Webinar with ${formData.company || formData.name}`,
        description: formData.notes,
        start_time: webinarDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        host_name: 'Cintia Kimura',
        meeting_link: '',
        attendees: [{
          name: formData.name,
          email: formData.email,
          registered_at: new Date().toISOString()
        }]
      });

      await sendEmail({
        to: 'cintia@kgprotech.com',
        subject: '🎯 New Webinar Scheduled',
        body: `A new webinar has been scheduled!\n\nDate: ${selectedDate}\nTime: ${selectedTime}\n\nAttendee Details:\nName: ${formData.name}\nEmail: ${formData.email}\nCompany: ${formData.company || 'Not provided'}\n\nNotes: ${formData.notes || 'None'}`
      });

      await sendEmail({
        to: 'georg@gmail.com',
        subject: '🎯 New Webinar Scheduled',
        body: `A new webinar has been scheduled!\n\nDate: ${selectedDate}\nTime: ${selectedTime}\n\nAttendee Details:\nName: ${formData.name}\nEmail: ${formData.email}\nCompany: ${formData.company || 'Not provided'}\n\nNotes: ${formData.notes || 'None'}`
      });

      await sendEmail({
        to: formData.email,
        subject: '✅ Your Webinar is Confirmed - KG PROTECH',
        body: `Dear ${formData.name},\n\nThank you for scheduling a webinar with KG PROTECH!\n\nYour 15-minute session is confirmed for:\n📅 ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n🕐 ${selectedTime}\n\nWe'll send you the meeting link 24 hours before the session.\n\nLooking forward to showing you how our IoT automotive training solutions can save you days in setup time and up to 60% in training costs.\n\nBest regards,\nCintia Kimura\nFounder and COO\ncintia@kgprotech.com\nTel: +33 07 68 62 07 04`
      });

      setIsBooked(true);
    } catch (error) {
      alert('Failed to schedule webinar. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBooked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#212121] to-[#2a2a2a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-[#00c600] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">You're All Set!</h1>
          <p className="text-gray-600 mb-2">Your 15-minute webinar has been scheduled.</p>
          <p className="text-gray-600 mb-6">Check your email for confirmation details.</p>
          <div className="bg-[#00c600] bg-opacity-10 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong>Time:</strong> {selectedTime}
            </p>
          </div>
          <p className="text-xs text-gray-500">We'll send you the meeting link 24 hours before.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212121] to-[#2a2a2a] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#00c600] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">KG</span>
            </div>
            <h1 className="text-4xl font-bold text-white">Schedule Your Webinar</h1>
          </div>
          <p className="text-gray-400 text-lg">15-minute demo of IoT automotive training solutions</p>
          <p className="text-[#00c600] font-medium mt-2">Save days in setup • Reduce training costs by 60%</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="bg-gradient-to-br from-[#00c600] to-[#00dd00] p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">What to Expect</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Clock className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">15 Minutes</h3>
                    <p className="text-sm opacity-90">Quick, focused demo tailored to your needs</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Your Schedule</h3>
                    <p className="text-sm opacity-90">Pick a time that works best for you</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <User className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Personal Demo</h3>
                    <p className="text-sm opacity-90">Direct session with our founder</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                <div>
                  <Label className="text-gray-700 font-medium mb-2">Select Date *</Label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00c600] focus:border-transparent"
                  >
                    <option value="">Choose a date</option>
                    {getNextTwoWeeks().map(date => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium mb-2">Select Time *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          selectedTime === time
                            ? 'bg-[#00c600] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium mb-2">Your Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="border-gray-300 focus:ring-[#00c600] focus:border-transparent"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-medium mb-2">Email Address *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="border-gray-300 focus:ring-[#00c600] focus:border-transparent"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-medium mb-2">Company</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="border-gray-300 focus:ring-[#00c600] focus:border-transparent"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-medium mb-2">Anything you'd like us to know?</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="border-gray-300 focus:ring-[#00c600] focus:border-transparent"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedDate || !selectedTime}
                  className="w-full bg-[#00c600] hover:bg-[#00dd00] text-white font-semibold py-3 text-lg"
                >
                  {isSubmitting ? 'Scheduling...' : 'Confirm Webinar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}