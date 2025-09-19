import React, { useCallback, useState } from "react";
import {
  useDropzone,
  type FileError,
  type FileRejection,
} from "react-dropzone";
import type { UploadedFiles } from "../types/csv";

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFiles) => void;
  onUploadStart: () => void;
  uploading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  onUploadStart,
  uploading,
}) => {
  const [files, setFiles] = useState<UploadedFiles>({
    strings: null,
    classifications: null,
  });
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setErrors([]);

      if (rejectedFiles.length > 0) {
        const newErrors = rejectedFiles.map(
          ({ file, errors }) =>
            `${file.name}: ${errors.map((e: FileError) => e.message).join(", ")}`
        );
        setErrors(newErrors);
        return;
      }

      if (acceptedFiles.length > 2) {
        setErrors([
          "Please upload only 2 CSV files: strings and classifications",
        ]);
        return;
      }

      const updatedFiles = { ...files };
      let hasUpdates = false;

      if (acceptedFiles.length === 2) {
        // Deterministic assignment: first -> strings, second -> classifications
        updatedFiles.strings = acceptedFiles[0];
        updatedFiles.classifications = acceptedFiles[1];
        hasUpdates = true;
      } else {
        acceptedFiles.forEach((file) => {
          const fileName = file.name.toLowerCase();
          if (
            fileName.includes("classification") ||
            fileName.includes("class")
          ) {
            updatedFiles.classifications = file;
            hasUpdates = true;
            return;
          }
          if (!updatedFiles.strings) {
            updatedFiles.strings = file;
            hasUpdates = true;
            return;
          }
          if (!updatedFiles.classifications) {
            updatedFiles.classifications = file;
            hasUpdates = true;
          }
        });
      }

      if (hasUpdates) {
        setFiles(updatedFiles);
      }
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 2,
    disabled: uploading,
  });

  const handleUpload = () => {
    if (files.strings && files.classifications) {
      onUploadStart();
      onFilesUploaded(files);
    }
  };

  const removeFile = (type: keyof UploadedFiles) => {
    setFiles((prev) => ({ ...prev, [type]: null }));
  };

  const canUpload = files.strings && files.classifications && !uploading;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-800">
            Upload CSV Files
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Please upload two CSV files, strings.csv first and
            classifications.csv second:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>
              <span className="font-medium text-slate-700">Strings CSV:</span>{" "}
              Tier, Industry, Topic, Subtopic, Prefix, Fuzzing-Idx, Prompt,
              Risks, Keywords
            </li>
            <li>
              <span className="font-medium text-slate-700">
                Classifications CSV:
              </span>{" "}
              Topic, SubTopic, Industry, Classification
            </li>
          </ul>
        </div>

        <div
          {...getRootProps()}
          className={`group relative flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-8 transition ${
            isDragActive
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-300 hover:border-slate-400"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex items-center gap-3 text-slate-600">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p>Uploading and processing files...</p>
            </div>
          ) : isDragActive ? (
            <p className="text-sm font-medium text-indigo-700">
              Drop the files here...
            </p>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                Drag and drop CSV files here, or click to select files
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Only CSV files are accepted (max 2 files)
              </p>
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <div className="mt-4 space-y-2">
            {errors.map((error, index) => (
              <div
                key={index}
                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {error}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {files.strings && (
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  Strings
                </span>
                <span className="font-medium text-slate-700">
                  {files.strings.name}
                </span>
              </div>
              <button
                onClick={() => removeFile("strings")}
                className="inline-flex h-7 items-center rounded-md border border-slate-300 bg-white px-2 text-slate-700 shadow-sm hover:bg-slate-50"
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          )}
          {files.classifications && (
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Classifications
                </span>
                <span className="font-medium text-slate-700">
                  {files.classifications.name}
                </span>
              </div>
              <button
                onClick={() => removeFile("classifications")}
                className="inline-flex h-7 items-center rounded-md border border-slate-300 bg-white px-2 text-slate-700 shadow-sm hover:bg-slate-50"
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {canUpload && (
          <div className="mt-6">
            <button
              onClick={handleUpload}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={!canUpload}
            >
              Upload and Process Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
