import * as fs from 'fs';
import * as path from 'path';

export const rootDir = path.resolve(__dirname, '../../doc/_includes');
const careerDataDir = path.join(rootDir, 'career-data');
export const careerDir = path.join(rootDir, 'career');
  
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


export const outputTotalJp = path.join(careerDir, 'total-experience-jp.txt');
export const outputTotalEn = path.join(careerDir, 'total-experience-en.txt');
export const outputWorkJp = path.join(careerDir, 'work-experience-jp.html');
export const outputWorkEn = path.join(careerDir, 'work-experience-en.html');
export const outputTechTotalsJp = path.join(careerDir, 'technology-totals-jp.html');
export const outputTechTotalsEn = path.join(careerDir, 'technology-totals-en.html');
export const outputTechBarsJp = path.join(careerDir, 'technology-bars-jp.html');
export const outputTechBarsEn = path.join(careerDir, 'technology-bars-en.html');
export const outputTechSummaryJp = path.join(careerDir, 'technology-summary-jp.html');
export const outputTechSummaryEn = path.join(careerDir, 'technology-summary-en.html');
export const outputLearningPlanJp = path.join(careerDir, 'learning-plan-jp.html');
export const outputLearningPlanEn = path.join(careerDir, 'learning-plan-en.html');
export const outputFutureWorkRoadmapJp = path.join(careerDir, 'future-work-roadmap-jp.html');
export const outputFutureWorkRoadmapEn = path.join(careerDir, 'future-work-roadmap-en.html');
export const outputLanguageSkillsJp = path.join(careerDir, 'language-skills-jp.html');
export const outputLanguageSkillsEn = path.join(careerDir, 'language-skills-en.html');
export const outputLanguageBarsJp = path.join(careerDir, 'language-bars-jp.html');
export const outputLanguageBarsEn = path.join(careerDir, 'language-bars-en.html');
export const outputCertificationsJp = path.join(careerDir, 'certifications-jp.html');
export const outputCertificationsEn = path.join(careerDir, 'certifications-en.html');
export const outputPersonalProjectsJp = path.join(careerDir, 'personal-projects-jp.html');
export const outputPersonalProjectsEn = path.join(careerDir, 'personal-projects-en.html');
export const outputCareerSummaryJp = path.join(careerDir, 'career-summary-jp.html');
export const outputCareerSummaryEn = path.join(careerDir, 'career-summary-en.html');

