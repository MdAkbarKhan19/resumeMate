import {
  TextractClient,
  AnalyzeDocumentCommand,
  FeatureType,
} from '@aws-sdk/client-textract';
import { awsConfig } from '@/config';

const textractClient = new TextractClient(awsConfig);

export interface TextractResult {
  text: string;
  blocks: any[];
  confidence: number;
}

export class TextractService {
  /**
   * Extract text from a document using AWS Textract
   */
  static async extractText(fileBuffer: Buffer): Promise<TextractResult> {
    try {
      const command = new AnalyzeDocumentCommand({
        Document: {
          Bytes: fileBuffer,
        },
        FeatureTypes: [FeatureType.TABLES, FeatureType.FORMS],
      });

      const response = await textractClient.send(command);

      if (!response.Blocks) {
        throw new Error('No blocks returned from Textract');
      }

      // Extract text from blocks
      const textBlocks = response.Blocks.filter((block) => block.BlockType === 'LINE');
      const text = textBlocks.map((block) => block.Text).join('\n');

      // Calculate average confidence
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

  /**
   * Extract structured data from resume
   * This is a helper that combines Textract with basic parsing
   */
  static async extractResumeData(fileBuffer: Buffer): Promise<any> {
    const textractResult = await this.extractText(fileBuffer);
    
    // TODO: Implement resume parsing logic using the extracted text
    // This will be enhanced with NLP in the resume parser service
    
    return {
      rawText: textractResult.text,
      confidence: textractResult.confidence,
      blocks: textractResult.blocks,
    };
  }
}

export default TextractService;
