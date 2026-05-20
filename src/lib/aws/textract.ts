/**
 * AWS Textract OCR fallback.
 *
 * COST NOTE — this used to call AnalyzeDocument with [TABLES, FORMS] which is
 * the most expensive Textract endpoint ($50–65 per 1000 pages, with only 100
 * free pages/month for 3 months). We only ever consume the raw text, so it's
 * now switched to DetectDocumentText ($1.50 per 1000 pages, 1000 free pages
 * per month). Even cheaper: don't call Textract at all unless explicitly
 * enabled via ENABLE_AWS_TEXTRACT=true — pdf-parse handles ~99% of PDFs.
 */
import {
  TextractClient,
  DetectDocumentTextCommand,
} from '@aws-sdk/client-textract';
import { awsConfig } from '@/config';

const textractClient = new TextractClient(awsConfig);

export interface TextractResult {
  text: string;
  blocks: any[];
  confidence: number;
}

export class TextractService {
  /** Default OFF. Set ENABLE_AWS_TEXTRACT=true to allow the OCR fallback. */
  static isEnabled(): boolean {
    return process.env.ENABLE_AWS_TEXTRACT === 'true';
  }

  /**
   * Extract text from a document using AWS Textract (cheap DetectDocumentText API).
   * Throws if disabled so callers fall back to a non-OCR error path.
   */
  static async extractText(fileBuffer: Buffer): Promise<TextractResult> {
    if (!this.isEnabled()) {
      throw new Error(
        'AWS Textract is disabled. Set ENABLE_AWS_TEXTRACT=true to enable the OCR fallback for scanned PDFs.'
      );
    }

    try {
      const command = new DetectDocumentTextCommand({
        Document: { Bytes: fileBuffer },
      });

      const response = await textractClient.send(command);

      if (!response.Blocks) {
        throw new Error('No blocks returned from Textract');
      }

      const textBlocks = response.Blocks.filter((block) => block.BlockType === 'LINE');
      const text = textBlocks.map((block) => block.Text).join('\n');

      const confidences = textBlocks
        .map((block) => block.Confidence || 0)
        .filter((conf) => conf > 0);

      const avgConfidence = confidences.length > 0
        ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
        : 0;

      return {
        text,
        blocks: response.Blocks,
        confidence: avgConfidence,
      };
    } catch (error) {
      console.error('Textract extraction error:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  static async extractResumeData(fileBuffer: Buffer): Promise<any> {
    const textractResult = await this.extractText(fileBuffer);
    return {
      rawText: textractResult.text,
      confidence: textractResult.confidence,
      blocks: textractResult.blocks,
    };
  }
}

export default TextractService;
