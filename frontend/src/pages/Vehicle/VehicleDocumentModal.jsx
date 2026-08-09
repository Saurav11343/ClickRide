import React, { useState } from 'react';
import { FileText, X, Download, Loader2 } from 'lucide-react';

const VehicleDocumentModal = ({ documentUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const openModal = () => {
    setIsOpen(true);
    setIsLoading(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  // Create a Google Docs viewer URL
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`;

  // Function to handle download as PDF
  const handleDownload = async (e) => {
    e.preventDefault();

    try {
      // Show loading state
      setIsLoading(true);

      // Fetch the file
      const response = await fetch(documentUrl);
      const blob = await response.blob();

      // Create a new blob with PDF mime type
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });

      // Create a download link
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');

      // Set link properties
      link.href = downloadUrl;
      link.download = 'vehicle_document.pdf'; // Set the filename with .pdf extension

      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to direct download if the above method fails
      window.open(documentUrl, '_blank');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <>
      {/* View Document Button */}
      <button
        onClick={openModal}
        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm transition-colors duration-200 w-full sm:w-auto"
        aria-label="View vehicle document"
      >
        <FileText className="w-4 h-4" />
        <span className="whitespace-nowrap">View Document</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gray-50">
              <h3 className="text-base sm:text-lg font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Vehicle Document
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-800 rounded-full p-1 hover:bg-gray-200 transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Using Google Docs Viewer */}
            <div className="flex-1 p-0 overflow-hidden relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="mt-2 text-sm text-gray-600">Loading document...</p>
                  </div>
                </div>
              )}
              <iframe
                src={googleDocsViewerUrl}
                className="w-full h-full"
                title="Vehicle Document"
                frameBorder="0"
                onLoad={handleIframeLoad}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end items-center p-3 sm:p-4 border-t bg-gray-50">
              <button
                onClick={closeModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-3 sm:px-4 rounded-md transition-colors duration-200 text-sm sm:text-base flex items-center gap-1"
                aria-label="Close document"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={isLoading}
                className={`ml-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 sm:px-4 rounded-md transition-colors duration-200 text-sm sm:text-base flex items-center gap-1 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Download document as PDF"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add styles for animation */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default VehicleDocumentModal;
