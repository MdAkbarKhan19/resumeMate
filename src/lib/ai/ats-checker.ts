/**
 * ATS (Applicant Tracking System) Compatibility Checker
 * Analyzes resumes for ATS optimization and keyword matching
 */
export class ATSCheckerService {
  /**
   * Extract keywords from job description
   */
  static extractKeywords(text: string): {
    skills: string[];
    tools: string[];
    qualifications: string[];
    actionVerbs: string[];
    all: string[];
  } {
    const normalizedText = text.toLowerCase();

    // Common technical skills patterns (2025 expanded)
    const skillPatterns = [
      /\b(javascript|typescript|python|java|c\+\+|c#|ruby|php|swift|kotlin|go|rust|scala|r|dart|elixir|haskell)\b/gi,
      /\b(react|angular|vue|next\.?js|nuxt|svelte|solid\.?js|remix|gatsby|node\.js|express|nest\.?js|fastify|django|flask|fastapi|spring|\.net|rails|laravel)\b/gi,
      /\b(aws|azure|gcp|docker|kubernetes|k8s|jenkins|ci\/cd|github actions|gitlab ci|terraform|ansible|pulumi|cloudflare)\b/gi,
      /\b(sql|mysql|postgresql|postgres|mongodb|redis|elasticsearch|dynamodb|cassandra|supabase|firebase|prisma|drizzle|typeorm|sequelize|graphql|grpc)\b/gi,
      /\b(git|agile|scrum|jira|rest|api|microservices|event-driven|kafka|rabbitmq|sqs|serverless|lambda)\b/gi,
      /\b(html|css|sass|scss|tailwind|tailwindcss|bootstrap|material-ui|mui|chakra|shadcn|radix|styled-components)\b/gi,
      /\b(testing|jest|vitest|pytest|selenium|cypress|playwright|junit|tdd|bdd|mocha|chai|storybook)\b/gi,
      /\b(machine learning|ml|ai|artificial intelligence|data science|analytics|tensorflow|pytorch|llm|langchain|openai|hugging face|rag|vector database|embeddings|generative ai|deep learning|nlp|computer vision)\b/gi,
      /\b(linux|unix|shell|bash|powershell|nginx|apache|load balancing|cdn|caching|monitoring|observability|grafana|prometheus|datadog|new relic)\b/gi,
      /\b(figma|sketch|adobe xd|ux|ui design|wireframing|prototyping|accessibility|wcag|aria|responsive design)\b/gi,
      /\b(oauth|jwt|sso|saml|authentication|authorization|encryption|security|owasp|penetration testing|soc2|gdpr)\b/gi,
      /\b(webpack|vite|esbuild|turbopack|rollup|parcel|babel|swc|npm|yarn|pnpm|bun|deno)\b/gi,
    ];

    // Extract skills
    const skills = new Set<string>();
    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => skills.add(match.toLowerCase().trim()));
      }
    });

    // Common tools and platforms (2025 expanded)
    const toolPatterns = [
      /\b(slack|teams|confluence|notion|figma|sketch|adobe|photoshop|illustrator|miro|lucidchart|whimsical)\b/gi,
      /\b(salesforce|hubspot|tableau|powerbi|power bi|excel|sheets|looker|metabase|dbt|snowflake|bigquery|redshift|airflow|spark|databricks)\b/gi,
      /\b(vscode|intellij|eclipse|pycharm|visual studio|xcode|android studio|postman|insomnia|cursor)\b/gi,
      /\b(jira|trello|asana|monday|clickup|linear|shortcut|basecamp|github|gitlab|bitbucket)\b/gi,
      /\b(vercel|netlify|heroku|railway|render|fly\.io|digital ocean|linode|cloudflare pages|aws amplify)\b/gi,
      /\b(stripe|twilio|sendgrid|auth0|okta|clerk|supabase|firebase|appwrite|convex|neon)\b/gi,
      /\b(datadog|new relic|sentry|splunk|elastic|kibana|logstash|pagerduty|opsgenie)\b/gi,
    ];

    const tools = new Set<string>();
    toolPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => tools.add(match.toLowerCase().trim()));
      }
    });

    // Qualifications and requirements
    const qualificationPatterns = [
      /\b(bachelor|master|phd|degree|diploma|certification|certified)\b/gi,
      /\b(\d+\+?\s*years?(?:\s+of)?\s+experience)\b/gi,
      /\b(experience with|proficiency in|knowledge of|familiarity with)\b/gi,
    ];

    const qualifications = new Set<string>();
    qualificationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => qualifications.add(match.toLowerCase().trim()));
      }
    });

    // Strong action verbs commonly sought (expanded)
    const actionVerbPatterns = [
      /\b(develop|design|implement|manage|lead|create|build|optimize|improve|architect|engineer)\b/gi,
      /\b(analyze|research|coordinate|collaborate|facilitate|establish|mentor|train|coach)\b/gi,
      /\b(increase|decrease|reduce|enhance|streamline|automate|scale|accelerate|transform)\b/gi,
      /\b(deliver|deploy|migrate|integrate|configure|troubleshoot|resolve|diagnose|debug)\b/gi,
      /\b(spearhead|pioneer|launch|execute|negotiate|influence|present|communicate)\b/gi,
      /\b(plan|strategize|prioritize|delegate|supervise|evaluate|assess|audit|review)\b/gi,
    ];

    const actionVerbs = new Set<string>();
    actionVerbPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => actionVerbs.add(match.toLowerCase().trim()));
      }
    });

    // Extract important phrases (2-3 word combinations)
    const phrases = this.extractPhrases(text);

    // Soft skills detection
    const softSkills = this.extractSoftSkills(text);

    const allKeywords = new Set([
      ...skills,
      ...tools,
      ...qualifications,
      ...phrases,
      ...softSkills,
    ]);

    return {
      skills: Array.from(skills),
      tools: Array.from(tools),
      qualifications: Array.from(qualifications),
      actionVerbs: Array.from(actionVerbs),
      all: Array.from(allKeywords),
    };
  }

  /**
   * Extract important multi-word phrases from text
   */
  private static extractPhrases(text: string): string[] {
    const phrases = new Set<string>();

    // Important phrase patterns (expanded for 2025)
    const phrasePatterns = [
      /\b[a-z]+\s+(?:development|engineering|management|design|analysis|testing|integration|architecture|optimization)\b/gi,
      /\b(?:project|product|team|technical|software|system|data|quality|cloud|full[\s-]?stack|front[\s-]?end|back[\s-]?end)\s+[a-z]+\b/gi,
      /\b[a-z]+\s+(?:skills|experience|knowledge|expertise|proficiency|background)\b/gi,
      /\b(?:cross[\s-]?functional|end[\s-]?to[\s-]?end|real[\s-]?time|high[\s-]?performance|large[\s-]?scale|data[\s-]?driven)\b/gi,
      /\b(?:continuous integration|continuous deployment|continuous delivery|test automation|code review|pair programming)\b/gi,
      /\b(?:distributed systems|system design|design patterns|clean code|technical debt|tech lead|engineering manager)\b/gi,
      /\b(?:stakeholder management|sprint planning|release management|incident response|on[\s-]?call|site reliability)\b/gi,
    ];

    phrasePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const normalized = match.toLowerCase().trim();
          if (normalized.length > 3) {
            phrases.add(normalized);
          }
        });
      }
    });

    return Array.from(phrases);
  }

  /**
   * Extract soft skills from text
   */
  private static extractSoftSkills(text: string): string[] {
    const softSkills = new Set<string>();

    const softSkillPatterns = [
      /\b(leadership|communication|teamwork|problem[\s-]?solving|critical thinking|adaptability|time management)\b/gi,
      /\b(collaboration|creativity|innovation|decision[\s-]?making|conflict resolution|emotional intelligence)\b/gi,
      /\b(attention to detail|self[\s-]?motivated|proactive|results[\s-]?oriented|customer[\s-]?focused|detail[\s-]?oriented)\b/gi,
      /\b(interpersonal|organizational|analytical|strategic thinking|multitasking|negotiation|presentation)\b/gi,
      /\b(mentoring|coaching|stakeholder management|cross[\s-]?functional|remote work|distributed team)\b/gi,
    ];

    softSkillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => softSkills.add(match.toLowerCase().trim()));
      }
    });

    return Array.from(softSkills);
  }

  /**
   * Analyze resume content against job description
   */
  static analyzeMatch(
    resumeContent: {
      summary: string;
      experience: Array<{ bullets: string[] }>;
      skills: Array<{ name: string }>;
      education: Array<{ degree: string }>;
    },
    jobDescription: string
  ): {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    recommendations: Array<{
      type: 'critical' | 'important' | 'suggested';
      message: string;
      action: string;
    }>;
    breakdown: {
      keywords: { matched: number; total: number; percentage: number };
      skills: { matched: number; total: number; percentage: number };
      experience: { score: number; notes: string[] };
      formatting: { score: number; issues: string[] };
    };
  } {
    // Extract keywords from job description
    const jdKeywords = this.extractKeywords(jobDescription);

    // Build resume text for analysis. Guard every field — resume JSON from the
    // DB can carry missing/odd shapes (e.g. an experience entry without bullets)
    // and an unguarded `.toLowerCase()` on undefined 500s the whole check.
    const resumeText = [
      resumeContent.summary || '',
      ...resumeContent.experience.flatMap(exp => Array.isArray(exp?.bullets) ? exp.bullets : []),
      ...resumeContent.skills.map(s => s?.name ?? ''),
      ...resumeContent.education.map(e => e?.degree ?? ''),
    ].join(' ').toLowerCase();

    // Find matched and missing keywords (with fuzzy matching)
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    jdKeywords.all.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (
        resumeText.includes(keywordLower) ||
        this.fuzzyMatch(resumeText, keywordLower)
      ) {
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });

    // Skills matching
    const resumeSkills = resumeContent.skills.map(s => (s?.name ?? '').toLowerCase());
    const matchedSkills = jdKeywords.skills.filter(skill => 
      resumeSkills.some(rs => rs.includes(skill) || skill.includes(rs))
    );

    // Calculate scores
    const keywordMatchPercentage = jdKeywords.all.length > 0
      ? (matchedKeywords.length / jdKeywords.all.length) * 100
      : 0;

    const skillMatchPercentage = jdKeywords.skills.length > 0
      ? (matchedSkills.length / jdKeywords.skills.length) * 100
      : 0;

    // Experience analysis
    const experienceScore = this.analyzeExperience(resumeContent.experience, jdKeywords);

    // Formatting check
    const formattingAnalysis = this.checkFormatting(resumeContent);

    // Overall score (weighted average)
    const overallScore = Math.round(
      keywordMatchPercentage * 0.35 +
      skillMatchPercentage * 0.30 +
      experienceScore.score * 0.25 +
      formattingAnalysis.score * 0.10
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      matchedKeywords,
      missingKeywords,
      jdKeywords,
      skillMatchPercentage,
      keywordMatchPercentage,
      formattingAnalysis
    );

    return {
      score: overallScore,
      matchedKeywords,
      missingKeywords: missingKeywords.slice(0, 20), // Top 20 missing
      recommendations,
      breakdown: {
        keywords: {
          matched: matchedKeywords.length,
          total: jdKeywords.all.length,
          percentage: Math.round(keywordMatchPercentage),
        },
        skills: {
          matched: matchedSkills.length,
          total: jdKeywords.skills.length,
          percentage: Math.round(skillMatchPercentage),
        },
        experience: {
          score: experienceScore.score,
          notes: experienceScore.notes,
        },
        formatting: {
          score: formattingAnalysis.score,
          issues: formattingAnalysis.issues,
        },
      },
    };
  }

  /**
   * Analyze experience section for relevance and quality
   */
  private static analyzeExperience(
    experience: Array<{ bullets: string[] }>,
    jdKeywords: ReturnType<typeof ATSCheckerService.extractKeywords>
  ): { score: number; notes: string[] } {
    const notes: string[] = [];
    let score = 100;

    if (experience.length === 0) {
      return { score: 0, notes: ['No experience entries found'] };
    }

    // Check for quantifiable results (numbers, percentages, dollar amounts).
    // Tolerate entries with missing/non-array bullets so a stray shape can't
    // crash the analysis (e.g. an experience row saved without any bullets).
    const allBullets = experience
      .flatMap(exp => (Array.isArray(exp?.bullets) ? exp.bullets : []))
      .filter((b): b is string => typeof b === 'string');
    const bulletsWithMetrics = allBullets.filter(bullet => /\d+[%$kKmM]|\$\d|reduced|increased|improved.*\d/.test(bullet));
    const metricRatio = allBullets.length > 0 ? bulletsWithMetrics.length / allBullets.length : 0;

    if (metricRatio === 0) {
      notes.push('Add quantifiable metrics to demonstrate impact (e.g., "Increased performance by 40%")');
      score -= 15;
    } else if (metricRatio < 0.3) {
      notes.push('Only a few bullets have metrics - aim for at least 50% with quantifiable results');
      score -= 8;
    }

    // Check for action verbs at bullet start
    const bulletTexts = allBullets.join(' ').toLowerCase();
    const actionVerbCount = jdKeywords.actionVerbs.filter(verb =>
      bulletTexts.includes(verb)
    ).length;

    if (actionVerbCount < 3) {
      notes.push('Use more strong action verbs that match the job description');
      score -= 10;
    }

    // Check bullets start with action verbs
    const startsWithVerb = allBullets.filter(b => /^[A-Z][a-z]+ed\b|^[A-Z][a-z]+ing\b|^[A-Z][a-z]+s?\b/.test(b.trim()));
    if (allBullets.length > 0 && startsWithVerb.length < allBullets.length * 0.5) {
      notes.push('Start each bullet point with a strong action verb (e.g., "Developed", "Led", "Implemented")');
      score -= 5;
    }

    // Check bullet point length
    const bulletLengths = allBullets.filter(b => b.trim()).map(b => b.length);
    const averageBulletLength = bulletLengths.length > 0
      ? bulletLengths.reduce((s, l) => s + l, 0) / bulletLengths.length
      : 0;

    if (averageBulletLength < 50) {
      notes.push('Bullet points are too brief - add more detail about your impact and contributions');
      score -= 10;
    } else if (averageBulletLength > 200) {
      notes.push('Bullet points are too long - be more concise (aim for 1-2 lines)');
      score -= 5;
    }

    // Check bullet count per experience
    const lowBulletCount = experience.filter(exp =>
      (Array.isArray(exp?.bullets) ? exp.bullets : []).filter(b => typeof b === 'string' && b.trim()).length < 2);
    if (lowBulletCount.length > 0) {
      notes.push(`${lowBulletCount.length} experience entries have fewer than 2 bullet points - add more detail`);
      score -= 5;
    }

    return { score: Math.max(0, score), notes };
  }

  /**
   * Check resume formatting for ATS compatibility
   */
  private static checkFormatting(resumeContent: any): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;

    // Check for professional summary
    if (!resumeContent.summary || resumeContent.summary.length < 50) {
      issues.push('Professional summary is missing or too short (aim for 150-300 characters)');
      score -= 15;
    } else if (resumeContent.summary.length > 500) {
      issues.push('Professional summary is too long - keep it to 2-3 concise sentences');
      score -= 5;
    }

    // Check skills section
    if (!resumeContent.skills || resumeContent.skills.length < 5) {
      issues.push('Add more relevant skills (aim for 8-15 key skills)');
      score -= 10;
    } else if (resumeContent.skills.length > 25) {
      issues.push('Too many skills listed - focus on the most relevant 10-15');
      score -= 3;
    }

    // Check experience section
    if (!resumeContent.experience || resumeContent.experience.length === 0) {
      issues.push('Experience section is empty');
      score -= 30;
    }

    // Check education section
    if (!resumeContent.education || resumeContent.education.length === 0) {
      issues.push('Education section is missing');
      score -= 10;
    }

    // Check for contact information completeness
    const personalInfo = resumeContent.personalInfo || resumeContent.summary;
    if (typeof personalInfo === 'object' && personalInfo) {
      if (!personalInfo.email) {
        issues.push('Email address is missing - essential for ATS');
        score -= 10;
      }
      if (!personalInfo.phone) {
        issues.push('Phone number is missing - recommended for ATS');
        score -= 5;
      }
      if (!personalInfo.location) {
        issues.push('Location is missing - many ATS filter by location');
        score -= 3;
      }
    }

    return { score: Math.max(0, score), issues };
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(
    matched: string[],
    missing: string[],
    jdKeywords: ReturnType<typeof ATSCheckerService.extractKeywords>,
    skillMatch: number,
    keywordMatch: number,
    formatting: { score: number; issues: string[] }
  ): Array<{
    type: 'critical' | 'important' | 'suggested';
    message: string;
    action: string;
  }> {
    const recommendations: Array<{
      type: 'critical' | 'important' | 'suggested';
      message: string;
      action: string;
    }> = [];

    // Critical recommendations
    if (keywordMatch < 30) {
      recommendations.push({
        type: 'critical',
        message: 'Very low keyword match with job description',
        action: `Add these critical keywords: ${missing.slice(0, 5).join(', ')}`,
      });
    }

    if (skillMatch < 30) {
      recommendations.push({
        type: 'critical',
        message: 'Missing most required technical skills',
        action: `Include these skills if you have them: ${jdKeywords.skills.slice(0, 5).join(', ')}`,
      });
    }

    // Important recommendations
    if (keywordMatch < 60) {
      recommendations.push({
        type: 'important',
        message: 'Moderate keyword alignment - room for improvement',
        action: `Incorporate more of these keywords naturally: ${missing.slice(0, 8).join(', ')}`,
      });
    }

    if (formatting.issues.length > 0) {
      formatting.issues.forEach(issue => {
        recommendations.push({
          type: 'important',
          message: issue,
          action: 'Update the relevant section to improve ATS compatibility',
        });
      });
    }

    // Suggested improvements
    if (missing.length > 0 && keywordMatch >= 60) {
      recommendations.push({
        type: 'suggested',
        message: 'Good keyword coverage, but could be enhanced',
        action: `Consider adding: ${missing.slice(0, 5).join(', ')}`,
      });
    }

    recommendations.push({
      type: 'suggested',
      message: 'Optimize bullet points with action verbs',
      action: `Use strong action verbs like: ${jdKeywords.actionVerbs.slice(0, 5).join(', ')}`,
    });

    return recommendations;
  }

  /**
   * Fuzzy match a keyword against text
   * Handles variations like "node.js" vs "nodejs", "c#" vs "csharp", hyphens vs spaces
   */
  private static fuzzyMatch(text: string, keyword: string): boolean {
    // Normalize: remove dots, hyphens, spaces for comparison
    const normalize = (s: string) => s.replace(/[\s.\-\/]+/g, '').toLowerCase();
    const normalizedText = normalize(text);
    const normalizedKeyword = normalize(keyword);

    if (normalizedText.includes(normalizedKeyword)) return true;

    // Check for common aliases
    const aliases: Record<string, string[]> = {
      'javascript': ['js'],
      'typescript': ['ts'],
      'node.js': ['nodejs', 'node'],
      'next.js': ['nextjs', 'next'],
      'react.js': ['reactjs', 'react'],
      'vue.js': ['vuejs', 'vue'],
      'nest.js': ['nestjs', 'nest'],
      'c#': ['csharp', 'c sharp'],
      'c++': ['cpp', 'cplusplus'],
      'postgresql': ['postgres'],
      'kubernetes': ['k8s'],
      'ci/cd': ['cicd', 'ci cd'],
      'machine learning': ['ml'],
      'artificial intelligence': ['ai'],
      'natural language processing': ['nlp'],
      'user interface': ['ui'],
      'user experience': ['ux'],
      'amazon web services': ['aws'],
      'google cloud platform': ['gcp'],
      'tailwindcss': ['tailwind'],
      'material-ui': ['mui'],
    };

    const keywordLower = keyword.toLowerCase();
    if (aliases[keywordLower]) {
      return aliases[keywordLower].some(alias => text.includes(alias));
    }

    // Check reverse aliases
    for (const [canonical, aliasList] of Object.entries(aliases)) {
      if (aliasList.includes(keywordLower) && text.includes(canonical)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate similarity score between two texts
   */
  static calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return (intersection.size / union.size) * 100;
  }
}
