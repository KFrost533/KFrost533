export type LocalizedExperience = {
  role: string;
  scope: string;
  technologies: TechnologyDuration[];
  achievements: string[];
  notes?: string[];
};

export type TechnologyDuration = {
  name: string;
  years: number;
  months: number;
  notes?: string;
  learning?: boolean;
  certifications?: string[];
};

export type Experience = {
  id: string;
  startYm: string;
  endYm: string | null;
  isCurrent: boolean;
  jp: LocalizedExperience;
  en: LocalizedExperience;
};

export type LearningTechnology = {
  jpName: string;
  enName: string;
  years: number;
  months: number;
  certifications?: string[];
};

export type FutureLearningPlanItem = {
  priorityJp: string;
  priorityEn: string;
  domainJp: string;
  domainEn: string;
  technologiesJp: string;
  technologiesEn: string;
  timelineJp: string;
  timelineEn: string;
  purposeJp: string;
  purposeEn: string;
};

export type FutureWorkRoadmapItem = {
  periodJp: string;
  periodEn: string;
  objectiveJp: string;
  objectiveEn: string;
  initiativesJp: string[];
  initiativesEn: string[];
  metricsJp: string;
  metricsEn: string;
};

export type LanguageSkillItem = {
  jpName: string;
  enName: string;
  jpLevel: string;
  enLevel: string;
  jpExperience: string;
  enExperience: string;
  jpUsage: string;
  enUsage: string;
};

export type CertificationItem = {
  name: string;
  obtainedJp: string;
  obtainedEn: string;
  usageJp: string;
  usageEn: string;
};

export type CertificationGroup = {
  categoryJp: string;
  categoryEn: string;
  items: CertificationItem[];
};

export type PersonalProjectItem = {
  nameJp: string;
  nameEn: string;
  periodJp: string;
  periodEn: string;
  technologiesJp: string[];
  technologiesEn: string[];
  achievementsJp: string[];
  achievementsEn: string[];
  progressJp: string;
  progressEn: string;
  linkUrl?: string;
  linkLabelJp?: string;
  linkLabelEn?: string;
};

export type CareerSummaryItem = {
  keyJp: string;
  keyEn: string;
  valueJp: string;
  valueEn: string;
  listJp?: string[];
  listEn?: string[];
};

export type YearMonth = { year: number; month: number };
