import React, { useRef, useState } from 'react';
import { Subscription } from '../types/subscription';
import { exportToCSV, exportToJSON, parseSubscriptionsJSON } from '../utils/exportUtils';
import {
  X,
  FileSpreadsheet,
  FileCode,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  onImport: (subscriptions: Subscription[]) => void;
  onResetSampleData: () => void;
  onClearAll: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  subscriptions,
  onImport,
  onResetSampleData,
  onClearAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const parsed = parseSubscriptionsJSON(content);
      if (parsed) {
        onImport(parsed);
        setImportSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setImportError('Invalid backup file. Please upload a valid SubVault JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Data Management & Backup
            </h3>
            <p className="text-xs text-neutral-500">
              Export your subscriptions, generate spreadsheets, or restore data.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Export section */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-2">Export Data</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => exportToCSV(subscriptions)}
                className="p-3 border border-neutral-200 hover:border-neutral-300 rounded-xl bg-neutral-50 hover:bg-neutral-100/70 text-left transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 text-neutral-800 font-semibold mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>CSV Spreadsheet</span>
                </div>
                <span className="text-[11px] text-neutral-500">
                  Open in Excel, Numbers, or Google Sheets.
                </span>
              </button>

              <button
                onClick={() => exportToJSON(subscriptions)}
                className="p-3 border border-neutral-200 hover:border-neutral-300 rounded-xl bg-neutral-50 hover:bg-neutral-100/70 text-left transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 text-neutral-800 font-semibold mb-1">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span>JSON Backup</span>
                </div>
                <span className="text-[11px] text-neutral-500">
                  Full fidelity backup file for restore.
                </span>
              </button>
            </div>
          </div>

          {/* Import section */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-2">Restore & Import</h4>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 border border-dashed border-neutral-300 hover:border-neutral-400 rounded-xl bg-neutral-50/50 hover:bg-neutral-50 text-center transition-colors flex items-center justify-center gap-2 text-neutral-700 font-medium"
            >
              <Upload className="w-4 h-4 text-neutral-500" />
              <span>Upload and restore JSON file</span>
            </button>

            {importSuccess && (
              <div className="mt-2 text-emerald-700 flex items-center gap-1.5 text-[11px]">
                <Check className="w-3.5 h-3.5" />
                <span>Successfully restored subscriptions!</span>
              </div>
            )}

            {importError && (
              <div className="mt-2 text-rose-600 flex items-center gap-1.5 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{importError}</span>
              </div>
            )}
          </div>

          {/* Preset Reset & Danger Zone */}
          <div className="pt-3 border-t border-neutral-100 space-y-2">
            <h4 className="font-semibold text-neutral-900">Preset Tools</h4>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  onResetSampleData();
                  onClose();
                }}
                className="px-3 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-lg text-neutral-700 flex items-center gap-1.5 font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
                <span>Restore Sample Dataset</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete all saved subscriptions?')) {
                    onClearAll();
                    onClose();
                  }
                }}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
