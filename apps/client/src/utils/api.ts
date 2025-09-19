import type {
  ClassificationsRow,
  StringsRow,
  ValidationResult,
} from "../types/csv";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface UploadResponse {
  success: boolean;
  data: {
    strings: StringsRow[];
    classifications: ClassificationsRow[];
    validation: ValidationResult;
    fileUrls: {
      strings: string;
      classifications: string;
    };
  };
}

export interface ExportResponse {
  success: boolean;
  downloadUrls: Array<{
    filename: string;
    url: string;
  }>;
}

class ApiService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async uploadFiles(
    stringsFile: File,
    classificationsFile: File
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("strings", stringsFile);
    formData.append("classifications", classificationsFile);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    return this.handleResponse<UploadResponse>(response);
  }

  async validateData(
    stringsData: StringsRow[],
    classificationsData: ClassificationsRow[]
  ): Promise<{ validation: ValidationResult }> {
    const response = await fetch(`${API_BASE_URL}/api/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stringsData,
        classificationsData,
      }),
    });

    return this.handleResponse<{ validation: ValidationResult }>(response);
  }

  async exportFiles(
    stringsData: StringsRow[],
    classificationsData: ClassificationsRow[],
    format: string = "csv"
  ): Promise<ExportResponse> {
    const response = await fetch(`${API_BASE_URL}/api/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stringsData,
        classificationsData,
        format,
      }),
    });

    return this.handleResponse<ExportResponse>(response);
  }

  async exportSingle(
    which: "strings" | "classifications",
    payload: {
      stringsData?: StringsRow[];
      classificationsData?: ClassificationsRow[];
      format?: string;
    }
  ): Promise<ExportResponse> {
    const response = await fetch(`${API_BASE_URL}/api/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        which,
        format: payload.format ?? "csv",
        stringsData: payload.stringsData,
        classificationsData: payload.classificationsData,
      }),
    });

    return this.handleResponse<ExportResponse>(response);
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return this.handleResponse<{ status: string; timestamp: string }>(response);
  }
}

export const apiService = new ApiService();
