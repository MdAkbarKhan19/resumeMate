/**
 * Resume Orchestrator
 * Coordinates all specialized agents in the agentic pipeline
 * Provides progress callbacks for real-time UI updates
 */

import { ResumeParserAgent } from './resume-parser-agent';
import { JDParserAgent } from './jd-parser-agent';
import { ATSScorerAgent } from './ats-scorer-agent';
import { ResumeBuilderAgent } from './resume-builder-agent';
import { FormatterAgent } from './formatter-agent';
import {
  AgentProgress,
  ProgressCallback,
  ResumeJSON,
  JDAnalysis,
  ATSScoreResult,
  EnhancementResult,
  OrchestratorRequest,
  OrchestratorResponse,
} from './types';
import { TemplateCustomization } from '@/types/template';

export class ResumeOrchestrator {
  private progressHistory: AgentProgress[] = [];
  private onProgress?: ProgressCallback;

  constructor(onProgress?: ProgressCallback) {
    this.onProgress = onProgress;
  }

  private emitProgress(progress: AgentProgress): void {
    this.progressHistory.push(progress);
    this.onProgress?.(progress);
  }

  /**
   * Parse a resume document into structured JSON
   */
  async parseResume(text: string, fileName?: string): Promise<ResumeJSON> {
    this.emitProgress({ agent: 'orchestrator', status: 'running', message: 'Starting resume parsing...' });

    const agent = new ResumeParserAgent();
    agent.setProgressCallback(p => this.emitProgress(p));

    const result = await agent.run({ text, fileName });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to parse resume');
    }

    this.emitProgress({ agent: 'orchestrator', status: 'complete', message: 'Resume parsed successfully' });
    return result.data;
  }

  /**
   * Analyze a job description
   */
  async analyzeJD(jdText: string): Promise<JDAnalysis> {
    this.emitProgress({ agent: 'orchestrator', status: 'running', message: 'Analyzing job description...' });

    const agent = new JDParserAgent();
    agent.setProgressCallback(p => this.emitProgress(p));

    const result = await agent.run(jdText);

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to analyze job description');
    }

    this.emitProgress({ agent: 'orchestrator', status: 'complete', message: 'JD analyzed successfully' });
    return result.data;
  }

  /**
   * Score a resume against a JD analysis
   */
  async scoreResume(resume: ResumeJSON, jdAnalysis: JDAnalysis): Promise<ATSScoreResult> {
    this.emitProgress({ agent: 'orchestrator', status: 'running', message: 'Scoring resume against JD...' });

    const agent = new ATSScorerAgent();
    agent.setProgressCallback(p => this.emitProgress(p));

    const result = await agent.run({ resume, jdAnalysis });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to score resume');
    }

    this.emitProgress({ agent: 'orchestrator', status: 'complete', message: `ATS Score: ${result.data.overall}` });
    return result.data;
  }

  /**
   * Enhance resume to improve ATS score
   */
  async enhanceResume(
    resume: ResumeJSON,
    jdAnalysis: JDAnalysis,
    targetScore?: number
  ): Promise<EnhancementResult> {
    this.emitProgress({ agent: 'orchestrator', status: 'running', message: 'Enhancing resume...' });

    const agent = new ResumeBuilderAgent();
    agent.setProgressCallback(p => this.emitProgress(p));

    const result = await agent.run({ resume, jdAnalysis, targetScore });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to enhance resume');
    }

    this.emitProgress({
      agent: 'orchestrator',
      status: 'complete',
      message: `Resume enhanced: ${result.data.beforeScore} -> ${result.data.afterScore}`,
    });
    return result.data;
  }

  /**
   * Generate a document (PDF/DOCX) from resume data
   */
  async generateDocument(
    resume: ResumeJSON,
    templateId: string,
    format: 'pdf' | 'docx',
    customization?: TemplateCustomization
  ): Promise<Buffer> {
    this.emitProgress({ agent: 'orchestrator', status: 'running', message: `Generating ${format.toUpperCase()}...` });

    const agent = new FormatterAgent();
    agent.setProgressCallback(p => this.emitProgress(p));

    const result = await agent.run({ resume, templateId, format, customization });

    if (!result.success || !result.data) {
      throw new Error(result.error || `Failed to generate ${format}`);
    }

    this.emitProgress({ agent: 'orchestrator', status: 'complete', message: `${format.toUpperCase()} generated` });
    return result.data.buffer;
  }

  /**
   * Full pipeline: Parse resume -> Analyze JD -> Score -> Enhance -> Score again
   */
  async fullPipeline(params: {
    resumeText?: string;
    resumeData?: ResumeJSON;
    jdText: string;
    targetScore?: number;
  }): Promise<{
    resume: ResumeJSON;
    jdAnalysis: JDAnalysis;
    initialScore: ATSScoreResult;
    enhancement: EnhancementResult;
    finalScore: ATSScoreResult;
  }> {
    this.emitProgress({ agent: 'orchestrator', status: 'running', message: 'Starting full pipeline...' });

    // Step 1: Parse resume (if text provided)
    let resume: ResumeJSON;
    if (params.resumeData) {
      resume = params.resumeData;
    } else if (params.resumeText) {
      resume = await this.parseResume(params.resumeText);
    } else {
      throw new Error('Either resumeText or resumeData is required');
    }

    // Step 2: Analyze JD
    const jdAnalysis = await this.analyzeJD(params.jdText);

    // Step 3: Initial Score
    const initialScore = await this.scoreResume(resume, jdAnalysis);

    // Step 4: Enhance
    const enhancement = await this.enhanceResume(resume, jdAnalysis, params.targetScore);

    // Step 5: Final Score
    const finalScore = await this.scoreResume(enhancement.enhancedResume, jdAnalysis);

    this.emitProgress({
      agent: 'orchestrator',
      status: 'complete',
      message: `Pipeline complete: ${initialScore.overall} -> ${finalScore.overall}`,
    });

    return { resume, jdAnalysis, initialScore, enhancement, finalScore };
  }

  /**
   * Handle orchestrator requests (for API endpoint)
   */
  async handleRequest(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    let totalTokens = 0;
    const results: Record<string, unknown> = {};

    try {
      switch (request.action) {
        case 'parse-resume': {
          if (!request.fileBuffer) throw new Error('fileBuffer is required for parse-resume');
          const text = request.fileBuffer.toString('utf-8');
          results.resume = await this.parseResume(text);
          break;
        }

        case 'analyze-jd': {
          if (!request.jdText) throw new Error('jdText is required for analyze-jd');
          results.jdAnalysis = await this.analyzeJD(request.jdText);
          break;
        }

        case 'score-ats': {
          if (!request.resumeData || !request.jdAnalysis) {
            throw new Error('resumeData and jdAnalysis are required for score-ats');
          }
          results.score = await this.scoreResume(request.resumeData, request.jdAnalysis);
          break;
        }

        case 'enhance-resume': {
          if (!request.resumeData || !request.jdAnalysis) {
            throw new Error('resumeData and jdAnalysis are required for enhance-resume');
          }
          results.enhancement = await this.enhanceResume(
            request.resumeData,
            request.jdAnalysis,
            request.targetScore
          );
          break;
        }

        case 'full-pipeline': {
          if (!request.jdText) throw new Error('jdText is required for full-pipeline');
          results.pipeline = await this.fullPipeline({
            resumeData: request.resumeData,
            jdText: request.jdText,
            targetScore: request.targetScore,
          });
          break;
        }

        default:
          throw new Error(`Unknown action: ${request.action}`);
      }

      return {
        success: true,
        action: request.action,
        results,
        totalTokensUsed: totalTokens,
        totalDurationMs: Date.now() - startTime,
        agentResults: this.progressHistory,
      };
    } catch (error) {
      return {
        success: false,
        action: request.action,
        results: { error: error instanceof Error ? error.message : 'Unknown error' },
        totalTokensUsed: totalTokens,
        totalDurationMs: Date.now() - startTime,
        agentResults: this.progressHistory,
      };
    }
  }
}
