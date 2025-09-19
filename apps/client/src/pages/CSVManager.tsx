import React, { useState } from "react";
import EditableTable from "../components/EditableTable";
import FileUpload from "../components/FileUpload";
import type {
  ClassificationsRow,
  CSVData,
  StringsRow,
  UploadedFiles,
} from "../types/csv";
import { apiService } from "../utils/api";

const CSVManager: React.FC = () => {
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFilesUploaded = async (files: UploadedFiles) => {
    if (!files.strings || !files.classifications) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.uploadFiles(
        files.strings,
        files.classifications
      );
      setCsvData({
        strings: response.data.strings,
        classifications: response.data.classifications,
        validation: response.data.validation,
      });
      setSuccess("Files uploaded and processed successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDataChange = async (
    type: "strings" | "classifications",
    updatedData: StringsRow[] | ClassificationsRow[]
  ) => {
    if (!csvData) return;

    const newCsvData = {
      ...csvData,
      [type]: updatedData,
    };

    try {
      const response = await apiService.validateData(
        newCsvData.strings,
        newCsvData.classifications
      );
      newCsvData.validation = response.validation;
      setCsvData(newCsvData);
    } catch (err) {
      console.error("Validation failed:", err);
    }
  };

  const handleExportSingle = async (which: "strings" | "classifications") => {
    if (!csvData) return;

    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.exportSingle(which, {
        stringsData: which === "strings" ? csvData.strings : csvData.strings,
        classificationsData:
          which === "classifications"
            ? csvData.classifications
            : csvData.classifications,
      });

      response.downloadUrls.forEach(({ filename, url }) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      setSuccess("File exported successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleReset = () => {
    setCsvData(null);
    setError(null);
    setSuccess(null);
  };

  const canExport = csvData?.validation?.isValid;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-sm text-rose-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="text-sm font-medium">{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-sm text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {!csvData ? (
        <FileUpload
          onFilesUploaded={handleFilesUploaded}
          onUploadStart={() => setUploading(true)}
          uploading={uploading}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
            <div>
              {csvData.validation?.isValid ? (
                <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                  <span>✅</span>
                  <span>
                    Data is valid ({csvData.validation.summary.validRows}/
                    {csvData.validation.summary.totalRows} rows)
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-md bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
                  <span>❌</span>
                  <span>
                    Data has validation errors (
                    {csvData.validation?.summary.invalidRows || 0} invalid rows)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={!canExport || exporting}
                onClick={() => handleExportSingle("strings")}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Export Strings
              </button>
              <button
                onClick={() => handleExportSingle("classifications")}
                disabled={!csvData.classifications?.length || exporting}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Export Classifications
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Upload New Files
              </button>
            </div>
          </div>

          {csvData.validation && !csvData.validation.isValid && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-amber-900">
                Validation Summary
              </h3>
              <div className="mt-3 grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-center">
                  <span className="block text-xs text-slate-500">
                    Total Rows
                  </span>
                  <span className="text-base font-semibold text-slate-800">
                    {csvData.validation.summary.totalRows}
                  </span>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-center">
                  <span className="block text-xs text-slate-500">
                    Valid Rows
                  </span>
                  <span className="text-base font-semibold text-emerald-700">
                    {csvData.validation.summary.validRows}
                  </span>
                </div>
                <div className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-center">
                  <span className="block text-xs text-slate-500">
                    Invalid Rows
                  </span>
                  <span className="text-base font-semibold text-rose-700">
                    {csvData.validation.summary.invalidRows}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm text-amber-900">
                Fix all validation errors in the strings table to enable export.
                Invalid rows are highlighted in red.
              </p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2">
              <EditableTable
                data={csvData.strings}
                type="strings"
                validationErrors={csvData.validation?.errors}
                onDataChange={(updatedData) =>
                  handleDataChange("strings", updatedData as StringsRow[])
                }
              />
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <EditableTable
                data={csvData.classifications}
                type="classifications"
                validationErrors={[]}
                onDataChange={(updatedData) =>
                  handleDataChange(
                    "classifications",
                    updatedData as ClassificationsRow[]
                  )
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVManager;
