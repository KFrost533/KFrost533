import * as fs from 'fs';
import type {
  CareerSummaryItem,
  CertificationGroup,
  Experience,
  FutureLearningPlanItem,
  FutureWorkRoadmapItem,
  LanguageSkillItem,
  LearningTechnology,
  PersonalProjectItem,
  TechnologyDuration,
  YearMonth,
} from './types';
import {
  enLanguageSkillsTableSchema,
  enLearningPlanTableSchema,
  enTechnologyTableSchemas,
  jpLanguageSkillsTableSchema,
  jpLearningPlanTableSchema,
  jpTechnologyTableSchemas,
  type TableColumn,
} from './table-schemas';

type AggregatedTechnology = {
  name: string;
  totalMonths: number;
  workMonths: number;
  learningMonths: number;
  learning: boolean;
  hasWorkExperience: boolean;
  certifications: string[];
};

type AggregatedLearning = {
  name: string;
  totalMonths: number;
  certifications: string[];
};

function parseYm(value: string): YearMonth {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid YYYY-MM format: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in YYYY-MM: ${value}`);
  }

  return { year, month };
}

function compareYm(a: YearMonth, b: YearMonth): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  return a.month - b.month;
}

function monthsInclusive(start: YearMonth, end: YearMonth): number {
  return (end.year - start.year) * 12 + (end.month - start.month) + 1;
}

function monthsToNow(start: YearMonth, now: Date): number {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const months = (currentYear - start.year) * 12 + (currentMonth - start.month);
  return Math.max(months, 0);
}

export function formatDurationJp(totalMonths: number): string {
  const normalized = Math.max(0, totalMonths);
  const years = Math.floor(normalized / 12);
  const months = normalized % 12;

  if (years > 0 && months > 0) {
    return `${years}年${months}か月`;
  }
  if (years > 0) {
    return `${years}年`;
  }
  return `${months}か月`;
}

export function formatDurationEn(totalMonths: number): string {
  const normalized = Math.max(0, totalMonths);
  const years = Math.floor(normalized / 12);
  const months = normalized % 12;

  const yearPart = years > 0 ? `${years} year${years > 1 ? 's' : ''}` : '';
  const monthPart = `${months} month${months !== 1 ? 's' : ''}`;

  if (yearPart && months > 0) {
    return `${yearPart} ${monthPart}`;
  }
  if (yearPart && months === 0) {
    return yearPart;
  }
  return monthPart;
}

function toTotalMonths(item: TechnologyDuration): number {
  const normalizedYears = Math.max(0, item.years);
  const normalizedMonths = Math.max(0, item.months);
  return normalizedYears * 12 + normalizedMonths;
}

function formatTechJp(item: TechnologyDuration): string {
  const notes = item.notes ? `：${item.notes}` : '';
  return `${item.name}（${formatDurationJp(toTotalMonths(item))}）${notes}`;
}

function formatTechEn(item: TechnologyDuration): string {
  const notes = item.notes ? `: ${item.notes}` : '';
  return `${item.name} (${formatDurationEn(toTotalMonths(item))})${notes}`;
}

function toStars(totalMonths: number, isLearning: boolean): string {
  if (isLearning) {
    return '⭐';
  }
  if (totalMonths >= 36) {
    return '⭐⭐⭐⭐';
  }
  if (totalMonths >= 24) {
    return '⭐⭐⭐';
  }
  if (totalMonths >= 12) {
    return '⭐⭐';
  }
  return '⭐';
}

function renderMarkdownTableHeader(columns: TableColumn[]): string {
  const labels = columns.map((column) => column.label).join(' | ');
  const separators = columns.map(() => '---').join('|');
  return `| ${labels} |\n|${separators}|`;
}

function monthName(month: number): string {
  const names = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return names[month - 1];
}

export function formatDateForFrontMatter(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatFooterLastUpdatedJp(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `*最終更新: ${year}年${month}月${day}日 | このページは定期的に更新されます*`;
}

function formatFooterLastUpdatedEn(now: Date): string {
  const fullDate = formatDateForFrontMatter(now);
  return `*Last Updated: ${fullDate} | This page is updated regularly*`;
}

export function updateLastModifiedAt(filePath: string, dateText: string): void {
  const content = fs.readFileSync(filePath, 'utf8');
  const replaced = content.replace(
    /^last_modified_at:\s*\d{4}-\d{2}-\d{2}$/m,
    `last_modified_at: ${dateText}`
  );

  if (replaced !== content) {
    fs.writeFileSync(filePath, replaced, 'utf8');
  }
}

export function updateFooterLastUpdated(filePath: string, locale: 'jp' | 'en', now: Date): void {
  const content = fs.readFileSync(filePath, 'utf8');
  const replacement = locale === 'jp'
    ? formatFooterLastUpdatedJp(now)
    : formatFooterLastUpdatedEn(now);

  const pattern = locale === 'jp'
    ? /^\*最終更新:.*\*$/m
    : /^\*Last Updated:.*\*$/m;

  const replaced = content.replace(pattern, replacement);
  if (replaced !== content) {
    fs.writeFileSync(filePath, replaced, 'utf8');
  }
}

export function aggregateTechnologyDurations(
  experiences: Experience[],
  locale: 'jp' | 'en'
): AggregatedTechnology[] {
  const totals = new Map<string, {
    name: string;
    totalMonths: number;
    workMonths: number;
    learningMonths: number;
    learning: boolean;
    hasWorkExperience: boolean;
    certifications: Set<string>;
  }>();

  experiences.forEach((exp) => {
    const list = locale === 'jp' ? exp.jp.technologies : exp.en.technologies;
    list.forEach((tech) => {
      const key = tech.name.trim().toLowerCase();
      const totalMonths = toTotalMonths(tech);
      const isLearning = Boolean(tech.learning);
      const workMonths = totalMonths;
      const learningMonths = isLearning ? totalMonths : 0;
      const current = totals.get(key);
      const certs = new Set((tech.certifications || []).map((item) => item.trim()).filter(Boolean));

      if (current) {
        current.totalMonths += totalMonths;
        current.workMonths += workMonths;
        current.learningMonths += learningMonths;
        current.learning = current.learning || isLearning;
        current.hasWorkExperience = true;
        certs.forEach((c) => current.certifications.add(c));
      } else {
        totals.set(key, {
          name: tech.name,
          totalMonths,
          workMonths,
          learningMonths,
          learning: isLearning,
          hasWorkExperience: true,
          certifications: certs,
        });
      }
    });
  });

  return [...totals.values()]
    .map((item) => ({
      name: item.name,
      totalMonths: item.totalMonths,
      workMonths: item.workMonths,
      learningMonths: item.learningMonths,
      learning: item.learning,
      hasWorkExperience: item.hasWorkExperience,
      certifications: [...item.certifications].sort(),
    }))
    .sort((a, b) => {
      if (a.workMonths !== b.workMonths) {
        return b.workMonths - a.workMonths;
      }
      return a.name.localeCompare(b.name);
    });
}

export function aggregateLearningTechnologies(
  learningItems: LearningTechnology[],
  locale: 'jp' | 'en'
): AggregatedLearning[] {
  const totals = new Map<string, {
    name: string;
    totalMonths: number;
    certifications: Set<string>;
  }>();

  learningItems.forEach((item) => {
    const name = locale === 'jp' ? item.jpName : item.enName;
    const key = name.trim().toLowerCase();
    const totalMonths = Math.max(0, item.years) * 12 + Math.max(0, item.months);
    const certs = new Set((item.certifications || []).map((c) => c.trim()).filter(Boolean));
    const current = totals.get(key);

    if (current) {
      current.totalMonths += totalMonths;
      certs.forEach((c) => current.certifications.add(c));
    } else {
      totals.set(key, {
        name,
        totalMonths,
        certifications: certs,
      });
    }
  });

  return [...totals.values()]
    .map((item) => ({
      name: item.name,
      totalMonths: item.totalMonths,
      certifications: [...item.certifications].sort(),
    }))
    .sort((a, b) => {
      if (a.totalMonths !== b.totalMonths) {
        return b.totalMonths - a.totalMonths;
      }
      return a.name.localeCompare(b.name);
    });
}

export function renderJpTechnologyTotals(experiences: Experience[], learningItems: LearningTechnology[]): string {
  const readyHeader = renderMarkdownTableHeader(jpTechnologyTableSchemas[0].columns);
  const underOneYearHeader = renderMarkdownTableHeader(jpTechnologyTableSchemas[1].columns);
  const learningHeader = renderMarkdownTableHeader(jpTechnologyTableSchemas[2].columns);
  const totals = aggregateTechnologyDurations(experiences, 'jp');
  const workOverOneYear = totals.filter((item) => item.hasWorkExperience && item.workMonths >= 12);
  const workUnderOneYear = totals.filter((item) => item.hasWorkExperience && item.workMonths > 0 && item.workMonths < 12);
  const learningOnly = aggregateLearningTechnologies(learningItems, 'jp');
  const workMonthsMap = new Map(totals.map((item) => [item.name.trim().toLowerCase(), item.workMonths]));

  const workOverOneYearRows = workOverOneYear
    .map((item) => {
      const stars = toStars(item.workMonths, false);
      const certNote = item.certifications.length > 0 ? `※${item.certifications.join('、')}取得済み` : '-';
      return `| ${item.name} | ${formatDurationJp(item.workMonths)} | ${stars} | ${certNote} |`;
    })
    .join('\n');

  const workUnderOneYearRows = workUnderOneYear
    .map((item) => {
      const stars = toStars(item.workMonths, false);
      const certNote = item.certifications.length > 0 ? `※${item.certifications.join('、')}取得済み` : '-';
      return `| ${item.name} | ${formatDurationJp(item.workMonths)} | ${stars} | ${certNote} |`;
    })
    .join('\n');

  const learningRows = learningOnly
    .map((item) => {
      const stars = toStars(item.totalMonths, true);
      const notes: string[] = [];
      const workMonths = workMonthsMap.get(item.name.trim().toLowerCase()) || 0;
      if (workMonths > 0) notes.push(`業務でも使用: ${formatDurationJp(workMonths)}`);
      if (item.certifications.length > 0) notes.push(`※${item.certifications.join('、')}取得済み`);
      const noteText = notes.length > 0 ? notes.join(' / ') : '-';
      return `| ${item.name} | ${formatDurationJp(item.totalMonths)} | ${stars} | ${noteText} |`;
    })
    .join('\n');

  return `### 主要技術の累計経験（職歴合算）\n\n#### 戦力になれる分野（実務経験 1年以上）\n\n${readyHeader}\n${workOverOneYearRows || '| - | - | - | - |'}\n\n#### 業務経験あり（実務経験 1年未満）\n\n${underOneYearHeader}\n${workUnderOneYearRows || '| - | - | - | - |'}\n\n#### 学習中の技術\n\n${learningHeader}\n${learningRows || '| - | - | - | - |'}`;
}

export function renderEnTechnologyTotals(experiences: Experience[], learningItems: LearningTechnology[]): string {
  const readyHeader = renderMarkdownTableHeader(enTechnologyTableSchemas[0].columns);
  const underOneYearHeader = renderMarkdownTableHeader(enTechnologyTableSchemas[1].columns);
  const learningHeader = renderMarkdownTableHeader(enTechnologyTableSchemas[2].columns);
  const totals = aggregateTechnologyDurations(experiences, 'en');
  const workOverOneYear = totals.filter((item) => item.hasWorkExperience && item.workMonths >= 12);
  const workUnderOneYear = totals.filter((item) => item.hasWorkExperience && item.workMonths > 0 && item.workMonths < 12);
  const learningOnly = aggregateLearningTechnologies(learningItems, 'en');
  const workMonthsMap = new Map(totals.map((item) => [item.name.trim().toLowerCase(), item.workMonths]));

  const workOverOneYearRows = workOverOneYear
    .map((item) => {
      const stars = toStars(item.workMonths, false);
      const certNote = item.certifications.length > 0 ? `* Certified: ${item.certifications.join(', ')}` : '-';
      return `| ${item.name} | ${formatDurationEn(item.workMonths)} | ${stars} | ${certNote} |`;
    })
    .join('\n');

  const workUnderOneYearRows = workUnderOneYear
    .map((item) => {
      const stars = toStars(item.workMonths, false);
      const certNote = item.certifications.length > 0 ? `* Certified: ${item.certifications.join(', ')}` : '-';
      return `| ${item.name} | ${formatDurationEn(item.workMonths)} | ${stars} | ${certNote} |`;
    })
    .join('\n');

  const learningRows = learningOnly
    .map((item) => {
      const stars = toStars(item.totalMonths, true);
      const notes: string[] = [];
      const workMonths = workMonthsMap.get(item.name.trim().toLowerCase()) || 0;
      if (workMonths > 0) notes.push(`Also used in work: ${formatDurationEn(workMonths)}`);
      if (item.certifications.length > 0) notes.push(`* Certified: ${item.certifications.join(', ')}`);
      const noteText = notes.length > 0 ? notes.join(' / ') : '-';
      return `| ${item.name} | ${formatDurationEn(item.totalMonths)} | ${stars} | ${noteText} |`;
    })
    .join('\n');

  return `### Combined Technology Experience (Across Work History)\n\n#### Ready-To-Contribute Areas (1+ Year Work Experience)\n\n${readyHeader}\n${workOverOneYearRows || '| - | - | - | - |'}\n\n#### Work Experience Under 1 Year\n\n${underOneYearHeader}\n${workUnderOneYearRows || '| - | - | - | - |'}\n\n#### Learning Technologies\n\n${learningHeader}\n${learningRows || '| - | - | - | - |'}`;
}

export function renderJpLearningPlan(items: FutureLearningPlanItem[]): string {
  const header = renderMarkdownTableHeader(jpLearningPlanTableSchema.columns);
  const rows = items
    .map((item) => `| ${item.priorityJp} | ${item.domainJp} | ${item.technologiesJp} | ${item.timelineJp} | ${item.purposeJp} |`)
    .join('\n');
  return `${header}\n${rows}`;
}

export function renderEnLearningPlan(items: FutureLearningPlanItem[]): string {
  const header = renderMarkdownTableHeader(enLearningPlanTableSchema.columns);
  const rows = items
    .map((item) => `| ${item.priorityEn} | ${item.domainEn} | ${item.technologiesEn} | ${item.timelineEn} | ${item.purposeEn} |`)
    .join('\n');
  return `${header}\n${rows}`;
}

export function renderJpLanguageSkills(items: LanguageSkillItem[]): string {
  const header = renderMarkdownTableHeader(jpLanguageSkillsTableSchema.columns);
  const rows = items.map((item) => `| ${item.jpName} | ${item.jpLevel} | ${item.jpExperience} | ${item.jpUsage} |`).join('\n');
  return `${header}\n${rows}`;
}

export function renderEnLanguageSkills(items: LanguageSkillItem[]): string {
  const header = renderMarkdownTableHeader(enLanguageSkillsTableSchema.columns);
  const rows = items.map((item) => `| ${item.enName} | ${item.enLevel} | ${item.enExperience} | ${item.enUsage} |`).join('\n');
  return `${header}\n${rows}`;
}

export function renderJpFutureWorkRoadmap(items: FutureWorkRoadmapItem[]): string {
  const rows = items
    .map((item) => {
      const initiatives = item.initiativesJp.map((entry) => `・${entry}`).join('<br/>');
      return `  <tr>\n    <td align="left"><strong>${item.periodJp}</strong></td>\n    <td align="left"><strong>${item.objectiveJp}</strong></td>\n    <td>${initiatives}</td>\n    <td align="left">${item.metricsJp}</td>\n  </tr>`;
    })
    .join('\n\n');

  return `<table>\n  <tr>\n    <th align="left">期間</th>\n    <th align="left">主要目標</th>\n    <th align="left">具体的な取り組み</th>\n    <th align="left">成果指標</th>\n  </tr>\n\n${rows}\n</table>`;
}

export function renderEnFutureWorkRoadmap(items: FutureWorkRoadmapItem[]): string {
  const rows = items
    .map((item) => {
      const initiatives = item.initiativesEn.map((entry) => `• ${entry}`).join('<br/>');
      return `  <tr>\n    <td align="left"><strong>${item.periodEn}</strong></td>\n    <td align="left"><strong>${item.objectiveEn}</strong></td>\n    <td>${initiatives}</td>\n    <td align="left">${item.metricsEn}</td>\n  </tr>`;
    })
    .join('\n\n');

  return `<table style="width: 100%; table-layout: auto; border-collapse: collapse;">\n  <tr>\n    <th align="left" style="width: 20%; word-wrap: break-word;">Period</th>\n    <th align="left" style="width: 25%; word-wrap: break-word;">Main Objectives</th>\n    <th align="left" style="width: 35%; word-wrap: break-word;">Specific Initiatives</th>\n    <th align="left" style="width: 20%; word-wrap: break-word;">Success Metrics</th>\n  </tr>\n\n${rows}\n</table>`;
}

export function renderJpCertifications(groups: CertificationGroup[]): string {
  const rows = groups
    .map((group) => group.items.map((item, itemIndex) => {
      const categoryCell = itemIndex === 0
        ? `    <td rowspan="${group.items.length}" align="left"><strong>${group.categoryJp}</strong></td>\n`
        : '';
      return `  <tr>\n${categoryCell}    <td align="left"><strong>${item.name}</strong></td>\n    <td align="left">${item.obtainedJp}</td>\n    <td align="left">${item.usageJp}</td>\n  </tr>`;
    }).join('\n'))
    .join('\n\n');

  return `<table>\n  <tr>\n    <th align="left">カテゴリ</th>\n    <th align="left">資格名</th>\n    <th align="left">取得日</th>\n    <th align="left">関連技術・用途</th>\n  </tr>\n\n${rows}\n</table>`;
}

export function renderEnCertifications(groups: CertificationGroup[]): string {
  const rows = groups
    .map((group) => group.items.map((item, itemIndex) => {
      const categoryCell = itemIndex === 0
        ? `    <td rowspan="${group.items.length}" align="left"><strong>${group.categoryEn}</strong></td>\n`
        : '';
      return `  <tr>\n${categoryCell}    <td align="left"><strong>${item.name}</strong></td>\n    <td align="left">${item.obtainedEn}</td>\n    <td align="left">${item.usageEn}</td>\n  </tr>`;
    }).join('\n'))
    .join('\n\n');

  return `<table style="width: 100%; table-layout: auto; border-collapse: collapse;">\n  <tr>\n    <th align="left" style="width: 15%; word-wrap: break-word;">Category</th>\n    <th align="left" style="width: 30%; word-wrap: break-word;">Certification Name</th>\n    <th align="left" style="width: 15%; word-wrap: break-word;">Obtained</th>\n    <th align="left" style="width: 40%; word-wrap: break-word;">Related Technologies & Usage</th>\n  </tr>\n\n${rows}\n</table>`;
}

export function renderJpPersonalProjects(items: PersonalProjectItem[]): string {
  const rows = items
    .map((item) => {
      const technologies = item.technologiesJp.join('<br/>');
      const achievements = item.achievementsJp.map((entry) => `・${entry}`).join('<br/>');
      const progress = item.linkUrl
        ? `<strong>${item.progressJp}</strong><br/><a href="${item.linkUrl}">${item.linkLabelJp || '関連リンク'}</a>`
        : `<strong>${item.progressJp}</strong>`;
      return `  <tr>\n    <td><strong>${item.nameJp}</strong></td>\n    <td>${item.periodJp}</td>\n    <td>${technologies}</td>\n    <td>${achievements}</td>\n    <td>${progress}</td>\n  </tr>`;
    })
    .join('\n\n');

  return `<table style="width: 100%; table-layout: auto; border-collapse: collapse;">\n  <tr>\n    <th align="left" style="width: 20%; word-wrap: break-word;">プロジェクト名</th>\n    <th align="left" style="width: 15%; word-wrap: break-word;">期間</th>\n    <th align="left" style="width: 20%; word-wrap: break-word;">主要技術</th>\n    <th align="left" style="width: 35%; word-wrap: break-word;">機能・成果</th>\n    <th align="left" style="width: 10%; word-wrap: break-word;">進捗</th>\n  </tr>\n\n${rows}\n</table>`;
}

export function renderEnPersonalProjects(items: PersonalProjectItem[]): string {
  const rows = items
    .map((item) => {
      const technologies = item.technologiesEn.join('<br/>');
      const achievements = item.achievementsEn.map((entry) => `• ${entry}`).join('<br/>');
      const progress = item.linkUrl
        ? `<strong>${item.progressEn}</strong><br/><a href="${item.linkUrl}">${item.linkLabelEn || 'Related Link'}</a>`
        : `<strong>${item.progressEn}</strong>`;
      return `  <tr>\n    <td><strong>${item.nameEn}</strong></td>\n    <td>${item.periodEn}</td>\n    <td>${technologies}</td>\n    <td>${achievements}</td>\n    <td>${progress}</td>\n  </tr>`;
    })
    .join('\n\n');

  return `<table style="width: 100%; table-layout: auto; border-collapse: collapse;">\n  <tr>\n    <th align="left" style="width: 20%; word-wrap: break-word;">Project Name</th>\n    <th align="left" style="width: 15%; word-wrap: break-word;">Period</th>\n    <th align="left" style="width: 20%; word-wrap: break-word;">Key Technologies</th>\n    <th align="left" style="width: 35%; word-wrap: break-word;">Features & Achievements</th>\n    <th align="left" style="width: 10%; word-wrap: break-word;">Progress</th>\n  </tr>\n\n${rows}\n</table>`;
}

export function renderJpCareerSummary(items: CareerSummaryItem[]): string {
  const rows = items
    .map((item) => {
      const base = item.valueJp.trim();
      const listText = item.listJp && item.listJp.length > 0 ? item.listJp.map((entry) => `・${entry}`).join('<br/>') : '';
      const content = [base, listText].filter(Boolean).join('<br/>');
      return `    <tr>\n      <td style="border:1px solid #ddd; padding:8px;"><strong>${item.keyJp}</strong></td>\n      <td style="border:1px solid #ddd; padding:8px;">${content}</td>\n    </tr>`;
    })
    .join('\n');

  return `<table style="width:100%; border-collapse:collapse;">\n  <thead>\n    <tr>\n      <th align="left" style="width:20%; border:1px solid #ddd; padding:8px;">項目</th>\n      <th align="left" style="border:1px solid #ddd; padding:8px;">内容</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td style="border:1px solid #ddd; padding:8px;"><strong>総経験年数</strong></td>\n      <td style="border:1px solid #ddd; padding:8px;">{% include career/total-experience-jp.txt %}</td>\n    </tr>\n${rows}\n  </tbody>\n</table>`;
}

export function renderEnCareerSummary(items: CareerSummaryItem[]): string {
  const rows = items
    .map((item) => {
      const base = item.valueEn.trim();
      const listText = item.listEn && item.listEn.length > 0 ? item.listEn.map((entry) => `- ${entry}`).join('<br/>') : '';
      const content = [base, listText].filter(Boolean).join('<br/>');
      return `    <tr>\n      <td style="border:1px solid #ddd; padding:8px;"><strong>${item.keyEn}</strong></td>\n      <td style="border:1px solid #ddd; padding:8px;">${content}</td>\n    </tr>`;
    })
    .join('\n');

  return `<table style="width:100%; border-collapse:collapse;">\n  <thead>\n    <tr>\n      <th align="left" style="width:20%; border:1px solid #ddd; padding:8px;">Item</th>\n      <th align="left" style="border:1px solid #ddd; padding:8px;">Details</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td style="border:1px solid #ddd; padding:8px;"><strong>Total Experience</strong></td>\n      <td style="border:1px solid #ddd; padding:8px;">{% include career/total-experience-en.txt %}</td>\n    </tr>\n${rows}\n  </tbody>\n</table>`;
}

export function renderJpWorkTable(experiences: Experience[], now: Date): string {
  const rows = experiences.map((exp) => {
    const start = parseYm(exp.startYm);
    const end = exp.isCurrent ? null : parseYm(String(exp.endYm));
    const durationMonths = exp.isCurrent ? monthsToNow(start, now) : monthsInclusive(start, end as YearMonth);
    const durationLabel = formatDurationJp(durationMonths);
    const periodLabel = exp.isCurrent
      ? `${start.year}.${String(start.month).padStart(2, '0')}〜現在`
      : `${start.year}.${String(start.month).padStart(2, '0')}〜${(end as YearMonth).year}.${String((end as YearMonth).month).padStart(2, '0')}`;

    const tech = exp.jp.technologies.map((item) => formatTechJp(item)).join(' / ');
    const achievements = exp.jp.achievements.map((item) => `・${item}`).join('<br/>\n        ');
    const notes = (exp.jp.notes ?? []).map((item) => `・${item}`).join('<br/>\n        ');

    return `    <tr>\n      <td style="border:1px solid #ddd; padding:8px;">${periodLabel}<br/>（${durationLabel}${exp.isCurrent ? '・継続中' : ''}）</td>\n      <td style="border:1px solid #ddd; padding:8px;">${exp.jp.role}</td>\n      <td style="border:1px solid #ddd; padding:8px;">${exp.jp.scope}</td>\n      <td style="border:1px solid #ddd; padding:8px;">${tech}</td>\n      <td style="border:1px solid #ddd; padding:8px;">${achievements}</td>\n      <td style="border:1px solid #ddd; padding:8px;">${notes}</td>\n    </tr>`;
  }).join('\n');

  return `<table style="width:100%; border-collapse:collapse;">\n  <thead>\n    <tr>\n      <th align="left" style="width:12%; border:1px solid #ddd; padding:8px;">期間</th>\n      <th align="left" style="width:20%; border:1px solid #ddd; padding:8px;">職種</th>\n      <th align="left" style="width:22%; border:1px solid #ddd; padding:8px;">業務範囲</th>\n      <th align="left" style="width:20%; border:1px solid #ddd; padding:8px;">主要技術</th>\n      <th align="left" style="width:20%; border:1px solid #ddd; padding:8px;">主な実績</th>\n      <th align="left" style="width:14%; border:1px solid #ddd; padding:8px;">備考</th>\n    </tr>\n  </thead>\n  <tbody>\n${rows}\n  </tbody>\n</table>`;
}

export function renderEnWorkSection(experiences: Experience[], now: Date): string {
  return experiences.map((exp) => {
    const start = parseYm(exp.startYm);
    const end = exp.isCurrent ? null : parseYm(String(exp.endYm));
    const durationMonths = exp.isCurrent ? monthsToNow(start, now) : monthsInclusive(start, end as YearMonth);
    const durationLabel = formatDurationEn(durationMonths);
    const periodLabel = exp.isCurrent
      ? `${monthName(start.month)} ${start.year} – Present`
      : `${monthName(start.month)} ${start.year} – ${monthName((end as YearMonth).month)} ${(end as YearMonth).year}`;

    const tech = exp.en.technologies.map((item) => formatTechEn(item)).join('<br/>');
    const achievements = exp.en.achievements.join('<br/>   ');
    const notes = (exp.en.notes ?? []).join('<br/>');

    return `### ${exp.en.role} (${periodLabel})\n\n| **Duration** | ${durationLabel}${exp.isCurrent ? ', Ongoing' : ''} |\n|------|------|\n| **Scope** | ${exp.en.scope} |\n| **Key Technologies** | ${tech} |\n| **Main Achievements** | ${achievements} |\n| **Notes** | ${notes} |\n\n<br/>`;
  }).join('\n\n');
}

export function buildTotals(experiences: Experience[], now: Date): { jp: string; en: string } {
  const sortedByStart = [...experiences].sort((a, b) => {
    const ay = parseYm(a.startYm);
    const by = parseYm(b.startYm);
    return compareYm(ay, by);
  });

  const first = parseYm(sortedByStart[0].startYm);
  const totalMonths = monthsToNow(first, now);

  const jp = `${formatDurationJp(totalMonths)}（${first.year}年${first.month}月〜現在）`;
  const en = `${formatDurationEn(totalMonths)} (${monthName(first.month)} ${first.year} – Present)`;
  return { jp, en };
}
