import { Lead } from '@/api/entities';
import { uploadFile, extractDataFromUploadedFile } from '@/api/integrations';
import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImportLeadsModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log('File selected:', selectedFile);
    setFile(selectedFile);
    setStatusMessage('');
  };

  const handleImport = async () => {
    if (!file) {
      setStatusMessage('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Uploading file...');
    
    try {
      console.log('Starting upload...', file.name);
      const uploadResult = await uploadFile({ file });
      console.log('Upload result:', uploadResult);
      
      setStatusMessage('Extracting lead data with AI...');
      
      const extractResult = await extractDataFromUploadedFile({
        file_url: uploadResult.file_url,
        json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              full_name: { type: "string" },
              email: { type: "string" },
              company: { type: "string" },
              language_preference: { type: "string" },
              notes: { type: "string" }
            }
          }
        }
      });

      console.log('Extract result:', extractResult);

      if (extractResult.status === 'error') {
        setStatusMessage(`Error: ${extractResult.details}`);
        setIsProcessing(false);
        return;
      }

      if (!extractResult.output) {
        setStatusMessage('No data could be extracted from the file');
        setIsProcessing(false);
        return;
      }

      const leadsArray = Array.isArray(extractResult.output) ? extractResult.output : [extractResult.output];
      
      if (leadsArray.length === 0) {
        setStatusMessage('No leads found in the file');
        setIsProcessing(false);
        return;
      }

      setStatusMessage(`Creating ${leadsArray.length} leads...`);

      let createdCount = 0;
      for (const leadData of leadsArray) {
        if (leadData.full_name && leadData.email) {
          await Lead.create({
            full_name: leadData.full_name,
            email: leadData.email,
            company: leadData.company || '',
            language_preference: leadData.language_preference || 'English',
            notes: leadData.notes || '',
            status: 'new'
          });
          createdCount++;
        }
      }

      setStatusMessage(`Successfully imported ${createdCount} leads!`);
      setTimeout(() => {
        onSuccess();
        onClose();
        setFile(null);
        setStatusMessage('');
      }, 1500);

    } catch (error) {
      console.error('Import error:', error);
      setStatusMessage(`Error: ${error.message || 'Import failed. Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] rounded-xl max-w-lg w-full">
        <div className="border-b border-[#333333] p-6 flex items-center justify-between">
          <h2 className="text-xl font-medium text-white">Import Leads</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isProcessing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="border-2 border-dashed border-[#444444] rounded-lg p-8 text-center hover:border-[#00c600] transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-[#00c600] mx-auto mb-4" />
            <p className="text-gray-300 mb-4">Upload CSV, Excel, or Image file</p>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls,.png,.jpg,.jpeg,.pdf"
              className="hidden"
              id="file-upload-input"
              disabled={isProcessing}
            />
            <label 
              htmlFor="file-upload-input"
              className={`inline-flex items-center gap-2 px-4 py-2 bg-[#333333] hover:bg-[#444444] text-white rounded-md transition-colors font-medium ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <Upload className="w-4 h-4" />
              Choose File
            </label>
            {file && (
              <p className="text-[#00c600] mt-3 text-sm font-medium">{file.name}</p>
            )}
          </div>

          {statusMessage && (
            <div className={`p-4 rounded-lg ${
              statusMessage.includes('Error') || statusMessage.includes('failed') 
                ? 'bg-red-500 bg-opacity-10 border border-red-500 text-red-400'
                : statusMessage.includes('Success')
                ? 'bg-green-500 bg-opacity-10 border border-green-500 text-green-400'
                : 'bg-blue-500 bg-opacity-10 border border-blue-500 text-blue-400'
            }`}>
              <p className="text-sm">{statusMessage}</p>
            </div>
          )}

          <div className="bg-[#333333] rounded-lg p-4">
            <p className="text-gray-400 text-sm">
              <strong className="text-white">AI-Powered Import:</strong> Upload a file with lead information. The system will automatically extract names, emails, companies, and notes.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={!file || isProcessing}
              variant="kg" className="flex-1 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Leads
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              disabled={isProcessing}
              variant="outline"
              className="border-[#444444] text-gray-300 hover:bg-[#333333]"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}