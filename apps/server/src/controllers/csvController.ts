import { NextFunction, Request, Response } from "express";
import {
  ClassificationsRow,
  csvService,
  StringsRow,
} from "../services/csvService";
import { r2Service } from "../services/r2Service";
import { validationService } from "../services/validationService";

export const csvController = {
  async uploadFiles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files?.strings?.[0] || !files?.classifications?.[0]) {
        return res.status(400).json({
          error: "Both strings and classifications CSV files are required",
        });
      }

      const stringsFile = files.strings[0];
      const classificationsFile = files.classifications[0];

      const [stringsData, classificationsData] = await Promise.all([
        csvService.parseCSV(stringsFile.buffer, "strings"),
        csvService.parseCSV(classificationsFile.buffer, "classifications"),
      ]);

      const validation = validationService.validateDataIntegrity(
        stringsData as StringsRow[],
        classificationsData as ClassificationsRow[]
      );

      const fileUrls = await Promise.all([
        r2Service.uploadFile(stringsFile, "strings"),
        r2Service.uploadFile(classificationsFile, "classifications"),
      ]);

      res.json({
        success: true,
        data: {
          strings: stringsData,
          classifications: classificationsData,
          validation,
          fileUrls: {
            strings: fileUrls[0],
            classifications: fileUrls[1],
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async validateData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { stringsData, classificationsData } = req.body;

      if (!stringsData || !classificationsData) {
        return res.status(400).json({
          error: "Both strings and classifications data are required",
        });
      }

      const validation = validationService.validateDataIntegrity(
        stringsData,
        classificationsData
      );

      res.json({ validation });
    } catch (error) {
      next(error);
    }
  },

  async exportFiles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const {
        stringsData,
        classificationsData,
        format = "csv",
        which = "both",
      } = req.body as {
        stringsData?: StringsRow[];
        classificationsData?: ClassificationsRow[];
        format?: string;
        which?: "strings" | "classifications" | "both";
      };

      // Validate presence based on requested export
      if (which === "both") {
        if (!stringsData || !classificationsData) {
          return res.status(400).json({
            error: "Both strings and classifications data are required",
          });
        }
      } else if (which === "strings") {
        if (!stringsData || !classificationsData) {
          return res.status(400).json({
            error:
              "Both strings and classifications data are required to export strings",
          });
        }
      } else if (which === "classifications") {
        if (!classificationsData) {
          return res.status(400).json({
            error: "classificationsData is required to export classifications",
          });
        }
      }

      // Only enforce cross-file validation when exporting strings (alone or both)
      if (which !== "classifications") {
        const validation = validationService.validateDataIntegrity(
          (stringsData || []) as StringsRow[],
          (classificationsData || []) as ClassificationsRow[]
        );
        if (!validation.isValid) {
          return res.status(400).json({
            error: "Data validation failed",
            validation,
          });
        }
      }

      const filesToUpload: { filename: string; buffer: Buffer }[] = [];
      const timestamp = new Date().toISOString().split("T")[0];

      if (which === "strings" || which === "both") {
        const stringsBuffer = await csvService.generateCSV(
          (stringsData || []) as StringsRow[]
        );
        filesToUpload.push({
          filename: `strings-${timestamp}.csv`,
          buffer: stringsBuffer,
        });
      }
      if (which === "classifications" || which === "both") {
        const classificationsBuffer = await csvService.generateCSV(
          (classificationsData || []) as ClassificationsRow[]
        );
        filesToUpload.push({
          filename: `classifications-${timestamp}.csv`,
          buffer: classificationsBuffer,
        });
      }

      const downloadUrls = await Promise.all(
        filesToUpload.map((f) =>
          r2Service.uploadGeneratedFile(f.buffer, f.filename)
        )
      );

      res.json({
        success: true,
        downloadUrls: filesToUpload.map((f, i) => ({
          filename: f.filename,
          url: downloadUrls[i],
        })),
      });
    } catch (error) {
      next(error);
    }
  },
};
