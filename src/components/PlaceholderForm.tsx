import { Hash, ArrowRight, FileText } from 'lucide-react';

interface PlaceholderFormProps {
  placeholders: string[];
  values: Record<string, string>;
  onChange: (placeholder: string, value: string) => void;
}

export function PlaceholderForm({ placeholders, values, onChange }: PlaceholderFormProps) {
  return (
    <div className="space-y-6">
      <p className="text-gray-600 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-blue-600" />
        Fyll ut verdiene som skal erstatte placeholders i dokumentet:
      </p>
      
      <div className="grid gap-4 lg:grid-cols-2">
        {placeholders.map((placeholder) => (
          <div key={placeholder} className="space-y-2">
            <label 
              htmlFor={placeholder}
              className="flex items-center text-sm font-medium text-gray-700"
            >
              <Hash className="w-4 h-4 text-blue-600 mr-2" />
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-700">
                [{placeholder}]
              </span>
            </label>
            <input
              id={placeholder}
              type="text"
              value={values[placeholder] || ''}
              onChange={(e) => onChange(placeholder, e.target.value)}
              placeholder={`Skriv inn verdi for ${placeholder}`}
              className="input-field"
            />
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <ArrowRight className="w-5 h-5 mr-2 text-blue-600" />
          Forhåndsvisning av erstatninger:
        </h4>
        <div className="grid gap-3 lg:grid-cols-2">
          {placeholders.map((placeholder) => (
            <div key={placeholder} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
              <span className="font-mono text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                [{placeholder}]
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900 bg-green-100 px-2 py-1 rounded flex-1 text-sm">
                {values[placeholder] || <span className="text-gray-400 italic">(ikke utfylt)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}