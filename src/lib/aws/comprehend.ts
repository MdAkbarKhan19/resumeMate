import {
  ComprehendClient,
  DetectEntitiesCommand,
  DetectKeyPhrasesCommand,
  DetectSentimentCommand,
} from '@aws-sdk/client-comprehend';
import { awsConfig } from '@/config';

const comprehendClient = new ComprehendClient(awsConfig);

export interface Entity {
  text: string;
  type: string;
  score: number;
}

export interface KeyPhrase {
  text: string;
  score: number;
}

export class ComprehendService {
  /**
   * Detect entities in text (names, organizations, locations, dates, etc.)
   */
  static async detectEntities(text: string): Promise<Entity[]> {
    try {
      const command = new DetectEntitiesCommand({
        Text: text,
        LanguageCode: 'en',
      });

      const response = await comprehendClient.send(command);

      return (response.Entities || []).map((entity) => ({
        text: entity.Text || '',
        type: entity.Type || '',
        score: entity.Score || 0,
      }));
    } catch (error) {
      console.error('Comprehend detect entities error:', error);
      throw new Error('Failed to detect entities');
    }
  }

  /**
   * Detect key phrases in text
   */
  static async detectKeyPhrases(text: string): Promise<KeyPhrase[]> {
    try {
      const command = new DetectKeyPhrasesCommand({
        Text: text,
        LanguageCode: 'en',
      });

      const response = await comprehendClient.send(command);

      return (response.KeyPhrases || []).map((phrase) => ({
        text: phrase.Text || '',
        score: phrase.Score || 0,
      }));
    } catch (error) {
      console.error('Comprehend detect key phrases error:', error);
      throw new Error('Failed to detect key phrases');
    }
  }

  /**
   * Analyze sentiment of text
   */
  static async detectSentiment(text: string): Promise<{
    sentiment: string;
    scores: any;
  }> {
    try {
      const command = new DetectSentimentCommand({
        Text: text,
        LanguageCode: 'en',
      });

      const response = await comprehendClient.send(command);

      return {
        sentiment: response.Sentiment || 'NEUTRAL',
        scores: response.SentimentScore || {},
      };
    } catch (error) {
      console.error('Comprehend detect sentiment error:', error);
      throw new Error('Failed to detect sentiment');
    }
  }

  /**
   * Extract skills and keywords from job description
   */
  static async analyzeJobDescription(jdText: string): Promise<{
    keywords: string[];
    requiredSkills: string[];
    entities: Entity[];
  }> {
    try {
      // Get key phrases (these often represent requirements)
      const keyPhrases = await this.detectKeyPhrases(jdText);
      
      // Get entities (companies, technologies, qualifications)
      const entities = await this.detectEntities(jdText);

      // Filter and deduplicate keywords
      const keywords = keyPhrases
        .filter((phrase) => phrase.score > 0.8)
        .map((phrase) => phrase.text.toLowerCase())
        .filter((text, index, self) => self.indexOf(text) === index)
        .slice(0, 30); // Top 30 keywords

      // Extract skills (this is a simple heuristic, can be enhanced)
      const skillIndicators = [
        'experience', 'proficiency', 'knowledge', 'skills',
        'ability', 'expertise', 'familiar', 'understanding'
      ];
      
      const requiredSkills = keyPhrases
        .filter((phrase) => {
          const text = phrase.text.toLowerCase();
          return skillIndicators.some((indicator) => 
            jdText.toLowerCase().includes(`${indicator} in ${text}`) ||
            jdText.toLowerCase().includes(`${indicator} with ${text}`)
          );
        })
        .map((phrase) => phrase.text)
        .filter((text, index, self) => self.indexOf(text) === index);

      return {
        keywords,
        requiredSkills,
        entities,
      };
    } catch (error) {
      console.error('Comprehend analyze JD error:', error);
      throw new Error('Failed to analyze job description');
    }
  }
}

export default ComprehendService;
