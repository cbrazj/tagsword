import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { PlaceholderForm } from './components/PlaceholderForm';
import { DocumentProcessor } from './utils/DocumentProcessor';
import { FileText, Download, AlertCircle, CheckCircle, Settings, Shield, Zap } from 'lucide-react';

interface ProcessedDocument {
  name: string;
  blob: Blob;
}

function App() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({});
  const [detectedPlaceholders, setDetectedPlaceholders] = useState<string[]>([]);
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setProcessedDocument(null);
    setError(null);
    setSuccess(null);
    
    try {
      const processor = new DocumentProcessor();
      const detected = await processor.detectPlaceholders(file);
      setDetectedPlaceholders(detected);
      
      // Initialize placeholders object
      const initialPlaceholders: Record<string, string> = {};
      detected.forEach(placeholder => {
        initialPlaceholders[placeholder] = '';
      });
      setPlaceholders(initialPlaceholders);
      
      setSuccess(`Dokument lastet opp. Fant ${detected.length} placeholder(s): ${detected.join(', ')}`);
    } catch (err) {
      setError('Kunne ikke lese Word-dokumentet. Sørg for at det er en gyldig .docx-fil.');
      console.error('Error detecting placeholders:', err);
    }
  };

  const handlePlaceholderChange = (placeholder: string, value: string) => {
    setPlaceholders(prev => ({
      ...prev,
      [placeholder]: value
    }));
  };

  const handleProcessDocument = async () => {
    if (!uploadedFile) {
      setError('Ingen fil er lastet opp');
      return;
    }

    // Check if all placeholders are filled
    const emptyPlaceholders = detectedPlaceholders.filter(p => !placeholders[p]?.trim());
    if (emptyPlaceholders.length > 0) {
      setError(`Vennligst fyll ut alle felt: ${emptyPlaceholders.join(', ')}`);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const processor = new DocumentProcessor();
      const processedBlob = await processor.processDocument(uploadedFile, placeholders);
      
      const originalName = uploadedFile.name.replace('.docx', '');
      const processedName = `GENERERT_${originalName}.docx`;
      
      setProcessedDocument({
        name: processedName,
        blob: processedBlob
      });
      
      setSuccess('Dokument er prosessert og klart for nedlasting');
    } catch (err) {
      setError('Feil ved prosessering av dokument. Prøv igjen.');
      console.error('Error processing document:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedDocument) {
      const url = URL.createObjectURL(processedDocument.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = processedDocument.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setPlaceholders({});
    setDetectedPlaceholders([]);
    setProcessedDocument(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-xl shadow-lg">
              <FileText className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">EP Dokument Prosessor</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Profesjonell dokumentbehandling for Word-filer med placeholders. 
            Last opp, fyll ut verdier og få et ferdig dokument tilbake.
          </p>
          <div className="flex items-center justify-center space-x-6 mt-6">
            <div className="flex items-center text-gray-600">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              <span>Rask prosessering</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              <span>Sikker behandling</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Settings className="w-5 h-5 mr-2 text-purple-600" />
              <span>Automatisk deteksjon</span>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-8 p-4 status-error rounded-lg flex items-center fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-8 p-4 status-success rounded-lg flex items-center fade-in">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
            <span className="font-medium">{success}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* File Upload Section */}
          <div className="card fade-in">
            <div className="section-header">
              <div className="section-number">1</div>
              <h2 className="section-title">Last opp Word-dokument</h2>
            </div>
            <FileUpload onFileUpload={handleFileUpload} uploadedFile={uploadedFile} />
          </div>

          {/* Placeholder Form Section */}
          {detectedPlaceholders.length > 0 && (
            <div className="card fade-in">
              <div className="section-header">
                <div className="section-number">2</div>
                <h2 className="section-title">Fyll ut placeholders</h2>
                <span className="badge badge-blue">
                  {detectedPlaceholders.length} felt funnet
                </span>
              </div>
              <PlaceholderForm
                placeholders={detectedPlaceholders}
                values={placeholders}
                onChange={handlePlaceholderChange}
              />
            </div>
          )}

          {/* Process & Download Section */}
          {uploadedFile && detectedPlaceholders.length > 0 && (
            <div className="card fade-in">
              <div className="section-header">
                <div className="section-number">3</div>
                <h2 className="section-title">Prosesser og last ned</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleProcessDocument}
                  disabled={isProcessing}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Prosesserer...
                    </>
                  ) : (
                    <>
                      <Settings className="w-5 h-5 mr-2" />
                      Prosesser dokument
                    </>
                  )}
                </button>

                {processedDocument && (
                  <button
                    onClick={handleDownload}
                    className="btn-success flex-1 flex items-center justify-center pulse-subtle"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Last ned dokument
                  </button>
                )}

                <button
                  onClick={handleReset}
                  className="btn-secondary sm:w-auto"
                >
                  Start på nytt
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              Bruksanvisning
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Støttede formater:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Microsoft Word (.docx)</li>
                  <li>• Placeholders i format [NAVN]</li>
                  <li>• Alle standard Word-funksjoner</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Eksempler på placeholders:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• <code className="bg-gray-200 px-2 py-1 rounded text-sm">[NAVN]</code></li>
                  <li>• <code className="bg-gray-200 px-2 py-1 rounded text-sm">[PROSJEKT]</code></li>
                  <li>• <code className="bg-gray-200 px-2 py-1 rounded text-sm">[DATO]</code></li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
              <p className="text-blue-800 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                <strong>Personvern:</strong> Alle dokumenter prosesseres lokalt i nettleseren. 
                Ingen data sendes til eksterne servere.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;