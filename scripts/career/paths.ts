import * as fs from 'fs';
import * as path from 'path';

export const rootDir = path.resolve(__dirname, '../../doc/');
const careerDataDir = path.join(rootDir, 'career-data');

function resolveCareerDataPath(fileName: string): string {
  const basePath = path.join(careerDataDir, fileName);
  const localOverride = basePath.replace(/\.json$/i, '.local.json');
  return fs.existsSync(localOverride) ? localOverride : basePath;
}

export const careerJpPath = path.join(rootDir, 'Career_JP.md');
export const careerEnPath = path.join(rootDir, 'Career_EN.md');

export const dataPath = resolveCareerDataPath('work-experiences.json');
export const learningDataPath = resolveCareerDataPath('learning-technologies.json');
export const futureLearningPlanPath = resolveCareerDataPath('future-learning-plan.json');
export const futureWorkRoadmapPath = resolveCareerDataPath('future-work-roadmap.json');
export const languageSkillsPath = resolveCareerDataPath('language-skills.json');
export const certificationsPath = resolveCareerDataPath('certifications.json');
export const personalProjectsPath = resolveCareerDataPath('personal-projects.json');
export const careerSummaryPath = resolveCareerDataPath('career-summary.json');

export const includeDir = path.join(rootDir, '_includes', 'career');
export const outputTotalJp = path.join(includeDir, 'total-experience-jp.txt');
export const outputTotalEn = path.join(includeDir, 'total-experience-en.txt');
export const outputWorkJp = path.join(includeDir, 'work-experience-jp.html');
export const outputWorkEn = path.join(includeDir, 'work-experience-en.md');
export const outputTechTotalsJp = path.join(includeDir, 'technology-totals-jp.md');
export const outputTechTotalsEn = path.join(includeDir, 'technology-totals-en.md');
export const outputTechBarsJp = path.join(includeDir, 'technology-bars-jp.html');
export const outputTechBarsEn = path.join(includeDir, 'technology-bars-en.html');
export const outputTechSummaryJp = path.join(includeDir, 'technology-summary-jp.html');
export const outputTechSummaryEn = path.join(includeDir, 'technology-summary-en.html');
export const outputLearningPlanJp = path.join(includeDir, 'learning-plan-jp.md');
export const outputLearningPlanEn = path.join(includeDir, 'learning-plan-en.md');
export const outputFutureWorkRoadmapJp = path.join(includeDir, 'future-work-roadmap-jp.html');
export const outputFutureWorkRoadmapEn = path.join(includeDir, 'future-work-roadmap-en.html');
export const outputLanguageSkillsJp = path.join(includeDir, 'language-skills-jp.md');
export const outputLanguageSkillsEn = path.join(includeDir, 'language-skills-en.md');
export const outputLanguageBarsJp = path.join(includeDir, 'language-bars-jp.html');
export const outputLanguageBarsEn = path.join(includeDir, 'language-bars-en.html');
export const outputCertificationsJp = path.join(includeDir, 'certifications-jp.html');
export const outputCertificationsEn = path.join(includeDir, 'certifications-en.html');
export const outputPersonalProjectsJp = path.join(includeDir, 'personal-projects-jp.html');
export const outputPersonalProjectsEn = path.join(includeDir, 'personal-projects-en.html');
export const outputCareerSummaryJp = path.join(includeDir, 'career-summary-jp.html');
export const outputCareerSummaryEn = path.join(includeDir, 'career-summary-en.html');

