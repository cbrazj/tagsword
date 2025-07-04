import React, { useRef, useState } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  uploadedFile: File | null;
}

export function FileUpload({ onFileUpload, uploadedFile }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      onFileUpload(file);
    } else {
      alert('Vennligst velg en gyldig .docx-fil');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`upload-area ${isDragOver ? 'dragover' : ''} ${uploadedFile ? 'border-green-300 bg-green-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {uploadedFile ? (
          <div className="flex items-center justify-center space-x-4">
            <div className="bg-green-600 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-lg text-gray-900">{uploadedFile.name}</p>
              <p className="text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Klar for prosessering
              </p>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200 text-red-600"
              title="Fjern fil"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-16 h-16 text-gray-400 mx-auto" />
            <div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Dra og slipp Word-dokument her
              </p>
              <p className="text-gray-500">eller klikk for å velge fil</p>
            </div>
            <p className="text-sm text-gray-400">Kun .docx-filer støttes</p>
          </div>
        )}
      </div>
      
      {uploadedFile && (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <span className="text-green-800 font-medium">Fil lastet opp</span>
              <p className="text-green-600 text-sm">Klar for prosessering</p>
            </div>
          </div>
          <button
            onClick={() => handleClick()}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            Velg annen fil
          </button>
        </div>
      )}
    </div>
  );
}