import csv from "csv-parser";
import * as fastCsv from "fast-csv";
import { Readable } from "stream";

export interface StringsRow {
  Tier: string;
  Industry: string;
  Topic: string;
  Subtopic: string;
  Prefix: string;
  "Fuzzing-Idx": string;
  Prompt: string;
  Risks: string;
  Keywords: string;
}

export interface ClassificationsRow {
  Topic: string;
  SubTopic: string;
  Industry: string;
  Classification: string;
}

export interface ExportFile {
  filename: string;
  buffer: Buffer;
  mimetype: string;
}

class CSVService {
  async parseCSV(
    buffer: Buffer,
    type: "strings" | "classifications"
  ): Promise<StringsRow[] | ClassificationsRow[]> {
    return new Promise((resolve, reject) => {
      const results: (StringsRow | ClassificationsRow)[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(csv())
        .on("data", (data) => {
          if (type === "strings") {
            results.push(this.validateStringsRow(data));
          } else {
            results.push(this.validateClassificationsRow(data));
          }
        })
        .on("end", () => {
          if (type === "strings") {
            resolve(results as StringsRow[]);
          } else {
            resolve(results as ClassificationsRow[]);
          }
        })
        .on("error", (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        });
    });
  }

  private validateStringsRow(data: Record<string, unknown>): StringsRow {
    // Get all available keys for debugging
    const availableKeys = Object.keys(data);

    // Create a map for flexible field matching
    const fieldMap = this.createFieldMap(data, [
      ["Tier", ["tier", "Tier", "TIER"]],
      ["Industry", ["industry", "Industry", "INDUSTRY"]],
      ["Topic", ["topic", "Topic", "TOPIC"]],
      [
        "Subtopic",
        ["subtopic", "Subtopic", "SUBTOPIC", "sub_topic", "Sub_Topic"],
      ],
      ["Prefix", ["prefix", "Prefix", "PREFIX"]],
      [
        "Fuzzing-Idx",
        [
          "fuzzing-idx",
          "Fuzzing-Idx",
          "FUZZING-IDX",
          "fuzzing_idx",
          "Fuzzing_Idx",
        ],
      ],
      ["Prompt", ["prompt", "Prompt", "PROMPT"]],
      ["Risks", ["risks", "Risks", "RISKS", "risk", "Risk"]],
      ["Keywords", ["keywords", "Keywords", "KEYWORDS", "keyword", "Keyword"]],
    ]);

    const requiredFields = [
      "Tier",
      "Industry",
      "Topic",
      "Subtopic",
      "Prefix",
      "Fuzzing-Idx",
      "Prompt",
      "Risks",
      "Keywords",
    ];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!fieldMap[field] && fieldMap[field] !== "") {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required field in strings CSV: ${missingFields.join(", ")}. ` +
          `Available columns: ${availableKeys.join(", ")}`
      );
    }

    return {
      Tier: String(fieldMap.Tier || "").trim(),
      Industry: String(fieldMap.Industry || "").trim(),
      Topic: String(fieldMap.Topic || "").trim(),
      Subtopic: String(fieldMap.Subtopic || "").trim(),
      Prefix: String(fieldMap.Prefix || "").trim(),
      "Fuzzing-Idx": String(fieldMap["Fuzzing-Idx"] || "").trim(),
      Prompt: String(fieldMap.Prompt || "").trim(),
      Risks: String(fieldMap.Risks || "").trim(),
      Keywords: String(fieldMap.Keywords || "").trim(),
    };
  }

  private validateClassificationsRow(
    data: Record<string, unknown>
  ): ClassificationsRow {
    const availableKeys = Object.keys(data);

    // Create a map for flexible field matching
    const fieldMap = this.createFieldMap(data, [
      ["Topic", ["topic", "Topic", "TOPIC"]],
      [
        "SubTopic",
        ["subtopic", "SubTopic", "SUBTOPIC", "sub_topic", "Sub_Topic"],
      ],
      ["Industry", ["industry", "Industry", "INDUSTRY"]],
      [
        "Classification",
        ["classification", "Classification", "CLASSIFICATION"],
      ],
    ]);

    const requiredFields = ["Topic", "SubTopic", "Industry", "Classification"];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!fieldMap[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields in classifications CSV: ${missingFields.join(", ")}. ` +
          `Available columns: ${availableKeys.join(", ")}`
      );
    }

    return {
      Topic: String(fieldMap.Topic || "").trim(),
      SubTopic: String(fieldMap.SubTopic || "").trim(),
      Industry: String(fieldMap.Industry || "").trim(),
      Classification: String(fieldMap.Classification || "").trim(),
    };
  }

  private createFieldMap(
    data: Record<string, unknown>,
    fieldMappings: [string, string[]][]
  ): Record<string, unknown> {
    const fieldMap: Record<string, unknown> = {};

    // Create a map of trimmed keys to original keys for matching
    const trimmedKeyMap: Record<string, string> = {};
    for (const key of Object.keys(data)) {
      trimmedKeyMap[key.trim().toLowerCase()] = key;
    }

    for (const [targetField, possibleNames] of fieldMappings) {
      for (const possibleName of possibleNames) {
        // Try exact match first
        if (possibleName in data) {
          fieldMap[targetField] = (data as Record<string, unknown>)[
            possibleName
          ];
          break;
        }

        // Try trimmed lowercase match
        const trimmedName = possibleName.toLowerCase();
        if (trimmedName in trimmedKeyMap) {
          fieldMap[targetField] = (data as Record<string, unknown>)[
            trimmedKeyMap[trimmedName]
          ];
          break;
        }
      }
    }

    return fieldMap;
  }

  async generateCSV(
    data: StringsRow[] | ClassificationsRow[]
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = fastCsv.format({ headers: true });

      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);

      data.forEach((row) => stream.write(row));
      stream.end();
    });
  }

  async generateExportFiles(
    stringsData: StringsRow[],
    classificationsData: ClassificationsRow[],
    format: string = "csv"
  ): Promise<ExportFile[]> {
    if (format !== "csv") {
      throw new Error("Only CSV format is currently supported");
    }

    const [stringsBuffer, classificationsBuffer] = await Promise.all([
      this.generateCSV(stringsData),
      this.generateCSV(classificationsData),
    ]);

    const timestamp = new Date().toISOString().split("T")[0];

    return [
      {
        filename: `strings-${timestamp}.csv`,
        buffer: stringsBuffer,
        mimetype: "text/csv",
      },
      {
        filename: `classifications-${timestamp}.csv`,
        buffer: classificationsBuffer,
        mimetype: "text/csv",
      },
    ];
  }

  getUniqueValues(
    data: StringsRow[] | ClassificationsRow[],
    field: keyof StringsRow | keyof ClassificationsRow
  ): string[] {
    const values = data
      .map((row) =>
        String((row as unknown as Record<string, unknown>)[field] ?? "")
      )
      .filter((v) => v.length > 0);
    return [...new Set(values)].sort();
  }
}

export const csvService = new CSVService();
