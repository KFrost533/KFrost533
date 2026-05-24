import * as fs from 'fs';
import {
  dataPath,
  futureLearningPlanPath,
  futureWorkRoadmapPath,
  careerDir,
  languageSkillsPath,
  learningDataPath,
  certificationsPath,
  personalProjectsPath,
  careerSummaryPath,
  outputFutureWorkRoadmapEn,
  outputFutureWorkRoadmapJp,
  outputLanguageBarsEn,
  outputLanguageBarsJp,
  outputLanguageSkillsEn,
  outputLanguageSkillsJp,
  outputLearningPlanEn,
  outputLearningPlanJp,
  outputTechBarsEn,
  outputTechBarsJp,
  outputTechSummaryEn,
  outputTechSummaryJp,
  outputTechTotalsEn,
  outputTechTotalsJp,
  outputTotalEn,
  outputTotalJp,
  outputWorkEn,
  outputWorkJp,
  rootDir,
} from './career/paths';
import {
  buildTotals,
  formatDateForFrontMatter,
  renderEnCareerSummary,
  renderEnCertifications,
  renderEnFutureWorkRoadmap,
  renderEnLanguageSkills,
  renderEnLearningPlan,
  renderEnPersonalProjects,
  renderEnTechnologyTotals,
  renderEnWorkSection,
  renderJpCareerSummary,
  renderJpCertifications,
  renderJpFutureWorkRoadmap,
  renderJpLanguageSkills,
  renderJpLearningPlan,
  renderJpPersonalProjects,
  renderJpTechnologyTotals,
  renderJpWorkTable,
  updateFooterLastUpdated,
  updateLastModifiedAt,
} from './career/tables';
import {
  renderLanguageBars,
  renderTechnologyBars,
  renderTechnologySummary,
} from './career/charts';
import {
  EXPERIENCE_CATEGORY_LABELS,
  EXPERIENCE_CATEGORY_ORDER,
  resolveCodingLanguage,
  resolveExperienceCategory,
  resolveTechnologyCategory,
  TECH_CATEGORY_LABELS,
  type ExperienceCategory,
  type TechCategory,
} from './career/technology-category-mapping';
import type {
  CareerSummaryItem,
  CertificationGroup,
  Experience,
  FutureLearningPlanItem,
  FutureWorkRoadmapItem,
  LanguageSkillItem,
  LearningTechnology,
  PersonalProjectItem,
} from './career/types';
import * as path from 'path';

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function stripHtmlTags(input: string): string {
  return input.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').trim();
}

function renderBarChart(
  ariaLabel: string,
  caption: string,
  rows: Array<{ label: string; valueLabel: string; numericValue: number }>
): string {
  if (rows.length === 0) {
    return `<div class="career-chart"><p class="career-chart-caption">${caption}</p></div>`;
  }

  const max = Math.max(...rows.map((row) => row.numericValue), 1);
  const rowHtml = rows
    .map((row) => {
      const width = Math.max(12, Math.round((row.numericValue / max) * 100));
      return [
        '  <div class="career-chart-row">',
        '    <div class="career-chart-meta">',
        `      <span class="career-chart-name">${row.label}</span>`,
        `      <span class="career-chart-value">${row.valueLabel}</span>`,
        '    </div>',
        '    <div class="career-chart-track">',
        `      <div class="career-chart-fill" style="width:${width}%"></div>`,
        '    </div>',
        '  </div>',
      ].join('\n');
    })
    .join('\n');

  return `<div class="career-chart" role="img" aria-label="${ariaLabel}">\n${rowHtml}\n  <p class="career-chart-caption">${caption}</p>\n</div>`;
}

function formatMonthsAsLabel(totalMonths: number, locale: 'jp' | 'en'): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (locale === 'jp') {
    if (years > 0 && months > 0) {
      return `${years}年${months}か月`;
    }
    if (years > 0) {
      return `${years}年`;
    }
    return `${months}か月`;
  }

  if (years > 0 && months > 0) {
    return `${years}y ${months}m`;
  }
  if (years > 0) {
    return `${years}y`;
  }
  return `${months}m`;
}

function buildCategoryTotalsByExperience(experiences: Experience[]): Map<ExperienceCategory, number> {
  const totals = new Map<ExperienceCategory, number>();
  EXPERIENCE_CATEGORY_ORDER.forEach((category) => totals.set(category, 0));

  experiences.forEach((experience) => {
    const perExperienceCategoryMax = new Map<ExperienceCategory, number>();

    // Use a single locale side to avoid double-counting the same technology entry.
    experience.en.technologies.forEach((tech) => {
      const category = resolveExperienceCategory(tech.name);
      if (!category) {
        return;
      }

      const months = Math.max(0, tech.years * 12 + tech.months);
      const currentMax = perExperienceCategoryMax.get(category) || 0;
      if (months > currentMax) {
        perExperienceCategoryMax.set(category, months);
      }
    });

    perExperienceCategoryMax.forEach((months, category) => {
      totals.set(category, (totals.get(category) || 0) + months);
    });
  });

  return totals;
}

function buildTechnologyExperience(experiences: Experience[]):
  Array<{ name: string; totalMonths: number; category: ExperienceCategory }> {
  const techTotals = new Map<string, { name: string; totalMonths: number; category: ExperienceCategory }>();

  experiences.forEach((experience) => {
    experience.en.technologies.forEach((tech) => {
      const category = resolveExperienceCategory(tech.name);
      if (!category) {
        return;
      }

      const name = tech.name.trim();
      if (!name) {
        return;
      }

      const months = Math.max(0, tech.years * 12 + tech.months);
      const existing = techTotals.get(name);
      if (!existing) {
        techTotals.set(name, { name, totalMonths: months, category });
        return;
      }

      existing.totalMonths += months;
    });
  });

  return [...techTotals.values()];
}

function topItemsHtml(
  items: Array<{ name: string; totalMonths: number }>,
  locale: 'jp' | 'en',
  limit = 5
): string {
  const top = items
    .sort((a, b) => b.totalMonths - a.totalMonths || a.name.localeCompare(b.name))
    .slice(0, limit);

  if (top.length === 0) {
    return locale === 'jp' ? '-' : '-';
  }

  return top
    .map((item) => `${item.name} (${formatMonthsAsLabel(item.totalMonths, locale)})`)
    .join('<br>');
}

function classifyTechForTable(tech: string): 'language' | 'framework' | 'cloud' | null {
  const key = tech.trim().toLowerCase();

  // Framework check first (before coding-language check)
  if (['spring', 'wicket', 'react', 'vue', 'angular', 'django', 'flask', 'fastapi', 'node.js', 'next.js'].some((kw) => key.includes(kw))) {
    return 'framework';
  }

  // AWS cloud services
  const awsKeywords = ['ec2', 'vpc', 'iam', 'cloudformation', 'lambda', 's3', 'dynamodb', 'sns', 'eventbridge', 'systems manager', 'cloudwatch', 'security hub', 'aws health', 'amazon bedrock', 'quicksight'];
  if (key === 'aws' || awsKeywords.some((kw) => key.includes(kw))) {
    return 'cloud';
  }

  // Programming and scripting languages
  if (resolveCodingLanguage(tech) || ['vba', 'powershell', 'bash', 'batch'].some((kw) => key.includes(kw))) {
    return 'language';
  }

  return null;
}

function renderWorkTechTypeTable(experiences: Experience[], locale: 'jp' | 'en'): string {
  const monthsByTech = new Map<string, number>();

  // Use EN tech names as single source; aggregate months; exclude learning items
  experiences.forEach((exp) => {
    exp.en.technologies.forEach((tech) => {
      if (tech.learning) return;
      const name = tech.name.trim();
      const totalMonths = (tech.years || 0) * 12 + (tech.months || 0);
      monthsByTech.set(name, (monthsByTech.get(name) || 0) + totalMonths);
    });
  });

  const allTechs = [...monthsByTech.entries()].map(([name, totalMonths]) => ({ name, totalMonths }));

  const langTechs = allTechs
    .filter((t) => classifyTechForTable(t.name) === 'language')
    .sort((a, b) => b.totalMonths - a.totalMonths);
  const frameworkTechs = allTechs
    .filter((t) => classifyTechForTable(t.name) === 'framework')
    .sort((a, b) => b.totalMonths - a.totalMonths);
  const cloudTechs = allTechs
    .filter((t) => classifyTechForTable(t.name) === 'cloud')
    .sort((a, b) => b.totalMonths - a.totalMonths);

  const techHeader = locale === 'jp' ? '技術名' : 'Technology';
  const durationHeader = locale === 'jp' ? '経験量' : 'Experience';
  const sectionTitle = locale === 'jp' ? '使用技術（カテゴリ別）' : 'Technologies Used (by Category)';

  function singleTable(title: string, techs: Array<{ name: string; totalMonths: number }>): string {
    const rows = techs
      .map((t) => `  <tr>\n    <td>${t.name}</td>\n    <td>${formatMonthsAsLabel(t.totalMonths, locale)}</td>\n  </tr>`)
      .join('\n');
    return [
      `<h3>${title}</h3>`,
      '<table>',
      '  <thead>',
      `    <tr><th>${techHeader}</th><th>${durationHeader}</th></tr>`,
      '  </thead>',
      '  <tbody>',
      rows || `  <tr><td colspan="2">—</td></tr>`,
      '  </tbody>',
      '</table>',
    ].join('\n');
  }

  const langTitle = locale === 'jp' ? 'プログラミング言語' : 'Programming Languages';
  const fwTitle = locale === 'jp' ? 'フレームワーク' : 'Frameworks';
  const cloudTitle = locale === 'jp' ? 'クラウド技術（AWS）' : 'Cloud Technologies (AWS)';

  return [
    '<style>',
    '.career-tech-type-grid { display: grid; grid-template-columns: repeat(3, minmax(240px, 1fr)); gap: 16px; align-items: start; }',
    '.career-tech-type-panel h3 { margin: 0 0 8px; }',
    '.career-tech-type-panel table { width: 100%; margin: 0; }',
    '@media (max-width: 1100px) { .career-tech-type-grid { grid-template-columns: repeat(2, minmax(240px, 1fr)); } }',
    '@media (max-width: 760px) { .career-tech-type-grid { grid-template-columns: 1fr; } }',
    '</style>',
    `<h3>${sectionTitle}</h3>`,
    '<div class="career-tech-type-grid">',
    `  <section class="career-tech-type-panel">${singleTable(langTitle, langTechs)}</section>`,
    `  <section class="career-tech-type-panel">${singleTable(fwTitle, frameworkTechs)}</section>`,
    `  <section class="career-tech-type-panel">${singleTable(cloudTitle, cloudTechs)}</section>`,
    '</div>',
  ].join('\n\n');
}

function renderWorkCategoryTable(experiences: Experience[], locale: 'jp' | 'en'): string {
  const categoryTotals = buildCategoryTotalsByExperience(experiences);
  const techExperience = buildTechnologyExperience(experiences);

  const categoryRows = EXPERIENCE_CATEGORY_ORDER.map((category) => {
    const label = locale === 'jp'
      ? EXPERIENCE_CATEGORY_LABELS[category].labelJp
      : EXPERIENCE_CATEGORY_LABELS[category].labelEn;
    const totalMonths = categoryTotals.get(category) || 0;
    const categoryTechs = techExperience.filter((item) => item.category === category);

    return `  <tr>\n    <td>${label}</td>\n    <td>${formatMonthsAsLabel(totalMonths, locale)}</td>\n    <td>${topItemsHtml(categoryTechs, locale, 5)}</td>\n  </tr>`;
  }).join('\n');

  const overallTopRows = techExperience
    .sort((a, b) => b.totalMonths - a.totalMonths || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((item, index) => {
      const categoryLabel = locale === 'jp'
        ? EXPERIENCE_CATEGORY_LABELS[item.category].labelJp
        : EXPERIENCE_CATEGORY_LABELS[item.category].labelEn;
      return `  <tr>\n    <td>${index + 1}</td>\n    <td>${item.name}</td>\n    <td>${categoryLabel}</td>\n    <td>${formatMonthsAsLabel(item.totalMonths, locale)}</td>\n  </tr>`;
    })
    .join('\n');

  const categoryTitle = locale === 'jp' ? 'カテゴリ別サマリー（表）' : 'Category Summary Table';
  const overallTitle = locale === 'jp' ? '経験技術 TOP5（全体）' : 'Top 5 Technologies by Experience (Overall)';
  const categoryHeaderRow = locale === 'jp'
    ? '<tr><th>カテゴリ</th><th>経験量</th><th>経験TOP5（カテゴリ内）</th></tr>'
    : '<tr><th>Category</th><th>Experience</th><th>Top 5 by experience (within category)</th></tr>';
  const overallHeaderRow = locale === 'jp'
    ? '<tr><th>順位</th><th>技術</th><th>カテゴリ</th><th>経験量</th></tr>'
    : '<tr><th>Rank</th><th>Technology</th><th>Category</th><th>Experience</th></tr>';

  return [
    '<style>',
    '.career-category-summary-grid { display: grid; grid-template-columns: repeat(2, minmax(320px, 1fr)); gap: 16px; align-items: start; }',
    '.career-category-summary-panel h3 { margin: 0 0 8px; }',
    '.career-category-summary-panel table { width: 100%; margin: 0; }',
    '@media (max-width: 900px) { .career-category-summary-grid { grid-template-columns: 1fr; } }',
    '</style>',
    '<div class="career-category-summary-grid">',
    '  <section class="career-category-summary-panel">',
    `    <h3>${categoryTitle}</h3>`,
    '    <table>',
    '      <thead>',
    `      ${categoryHeaderRow}`,
    '      </thead>',
    '      <tbody>',
    categoryRows,
    '      </tbody>',
    '    </table>',
    '  </section>',
    '  <section class="career-category-summary-panel">',
    `    <h3>${overallTitle}</h3>`,
    '    <table>',
    '      <thead>',
    `      ${overallHeaderRow}`,
    '      </thead>',
    '      <tbody>',
    overallTopRows,
    '      </tbody>',
    '    </table>',
    '  </section>',
    '</div>',
  ].join('\n');
}

function renderWorkCategoryVisual(experiences: Experience[], locale: 'jp' | 'en'): string {
  const totals = buildCategoryTotalsByExperience(experiences);

  const rows = EXPERIENCE_CATEGORY_ORDER.map((category) => {
    const total = totals.get(category) || 0;
    return {
      label: locale === 'jp' ? EXPERIENCE_CATEGORY_LABELS[category].labelJp : EXPERIENCE_CATEGORY_LABELS[category].labelEn,
      valueLabel: formatMonthsAsLabel(total, locale),
      numericValue: total,
    };
  }).filter((row) => row.numericValue > 0);

  return renderBarChart(
    locale === 'jp' ? '職務経験のカテゴリ別サマリー' : 'Work experience summary by category',
    locale === 'jp'
      ? 'クラウド・コーディング・インフラ・サーバーの経験年数（work-experiences集計）'
      : 'Years/months of experience across Cloud, Coding, Infrastructure, and Server (from work-experiences)',
    rows
  );
}

function renderCertificationVisual(
  groups: CertificationGroup[],
  locale: 'jp' | 'en'
): string {
  const byCategory = groups.map((group) => ({
    label: locale === 'jp' ? stripHtmlTags(group.categoryJp) : stripHtmlTags(group.categoryEn),
    count: group.items.length,
  }));

  const categoryChart = renderBarChart(
    locale === 'jp' ? '資格カテゴリ件数サマリー' : 'Certification count by category',
    locale === 'jp'
      ? `資格カテゴリ別の件数（合計${byCategory.reduce((a, b) => a + b.count, 0)}件）`
      : `Certification count by category (total: ${byCategory.reduce((a, b) => a + b.count, 0)})`,
    byCategory.map((item) => ({
      label: item.label,
      valueLabel: locale === 'jp' ? `${item.count}件` : `${item.count}`,
      numericValue: item.count,
    }))
  );

  const yearCounts = new Map<string, number>();
  groups.forEach((group) => {
    group.items.forEach((item) => {
      const raw = locale === 'jp' ? item.obtainedJp : item.obtainedEn;
      const m = raw.match(/(\d{4})/);
      if (!m) {
        return;
      }
      const y = m[1];
      yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
    });
  });

  const yearRows = [...yearCounts.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, count]) => ({
      label: year,
      valueLabel: locale === 'jp' ? `${count}件` : `${count}`,
      numericValue: count,
    }));

  const yearChart = renderBarChart(
    locale === 'jp' ? '資格の取得年推移' : 'Certification timeline by year',
    locale === 'jp' ? '取得年ごとの件数' : 'Certifications by obtained year',
    yearRows
  );

  return `${categoryChart}\n\n${yearChart}`;
}

function renderProjectVisual(
  projects: PersonalProjectItem[],
  locale: 'jp' | 'en'
): string {
  const progressCounts = new Map<string, number>();
  projects.forEach((project) => {
    const key = (locale === 'jp' ? project.progressJp : project.progressEn).trim();
    progressCounts.set(key, (progressCounts.get(key) || 0) + 1);
  });

  const progressRows = [...progressCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      valueLabel: locale === 'jp' ? `${count}件` : `${count}`,
      numericValue: count,
    }));

  const progressChart = renderBarChart(
    locale === 'jp' ? '個人開発の進捗サマリー' : 'Project progress summary',
    locale === 'jp'
      ? `進捗ステータス別の件数（合計${projects.length}件）`
      : `Project count by progress status (total: ${projects.length})`,
    progressRows
  );

  return progressChart;
}

function main(): void {
  const now = new Date();
  const dateText = formatDateForFrontMatter(now);

  if (!fs.existsSync(careerDir)) {
    fs.mkdirSync(careerDir, { recursive: true });
  }

  const experiences = readJson<Experience[]>(dataPath);
  const learningItems = readJson<LearningTechnology[]>(learningDataPath);
  const futureLearningPlan = readJson<FutureLearningPlanItem[]>(futureLearningPlanPath);
  const futureWorkRoadmap = readJson<FutureWorkRoadmapItem[]>(futureWorkRoadmapPath);
  const languageSkills = readJson<LanguageSkillItem[]>(languageSkillsPath);
  const certifications = readJson<CertificationGroup[]>(certificationsPath);
  const personalProjects = readJson<PersonalProjectItem[]>(personalProjectsPath);
  const careerSummary = readJson<CareerSummaryItem[]>(careerSummaryPath);

  const totals = buildTotals(experiences, now);
  writeFile(outputTotalJp, totals.jp);
  writeFile(outputTotalEn, totals.en);

  writeFile(outputWorkJp, renderJpWorkTable(experiences, now));
  writeFile(outputWorkEn, renderEnWorkSection(experiences, now));

  writeFile(outputTechTotalsJp, renderJpTechnologyTotals(experiences, learningItems));
  writeFile(outputTechTotalsEn, renderEnTechnologyTotals(experiences, learningItems));

  writeFile(outputTechBarsJp, renderTechnologyBars(experiences, 'jp'));
  writeFile(outputTechBarsEn, renderTechnologyBars(experiences, 'en'));

  writeFile(outputTechSummaryJp, renderTechnologySummary(experiences, learningItems, 'jp'));
  writeFile(outputTechSummaryEn, renderTechnologySummary(experiences, learningItems, 'en'));

  writeFile(outputLearningPlanJp, renderJpLearningPlan(futureLearningPlan));
  writeFile(outputLearningPlanEn, renderEnLearningPlan(futureLearningPlan));

  writeFile(outputFutureWorkRoadmapJp, renderJpFutureWorkRoadmap(futureWorkRoadmap));
  writeFile(outputFutureWorkRoadmapEn, renderEnFutureWorkRoadmap(futureWorkRoadmap));

  writeFile(outputLanguageSkillsJp, renderJpLanguageSkills(languageSkills));
  writeFile(outputLanguageSkillsEn, renderEnLanguageSkills(languageSkills));

  writeFile(outputLanguageBarsJp, renderLanguageBars(languageSkills, 'jp'));
  writeFile(outputLanguageBarsEn, renderLanguageBars(languageSkills, 'en'));

  const certsJpPath = path.join(careerDir, 'certifications-jp.html');
  const certsEnPath = path.join(careerDir, 'certifications-en.html');
  writeFile(certsJpPath, renderJpCertifications(certifications));
  writeFile(certsEnPath, renderEnCertifications(certifications));

  const projectsJpPath = path.join(careerDir, 'personal-projects-jp.html');
  const projectsEnPath = path.join(careerDir, 'personal-projects-en.html');
  writeFile(projectsJpPath, renderJpPersonalProjects(personalProjects));
  writeFile(projectsEnPath, renderEnPersonalProjects(personalProjects));

  const summaryJpPath = path.join(careerDir, 'career-summary-jp.html');
  const summaryEnPath = path.join(careerDir, 'career-summary-en.html');
  writeFile(summaryJpPath, renderJpCareerSummary(careerSummary));
  writeFile(summaryEnPath, renderEnCareerSummary(careerSummary));

  const certificationsVisualJpPath = path.join(careerDir, 'certifications-visual-jp.html');
  const certificationsVisualEnPath = path.join(careerDir, 'certifications-visual-en.html');
  writeFile(certificationsVisualJpPath, renderCertificationVisual(certifications, 'jp'));
  writeFile(certificationsVisualEnPath, renderCertificationVisual(certifications, 'en'));

  const projectsVisualJpPath = path.join(careerDir, 'projects-visual-jp.html');
  const projectsVisualEnPath = path.join(careerDir, 'projects-visual-en.html');
  writeFile(projectsVisualJpPath, renderProjectVisual(personalProjects, 'jp'));
  writeFile(projectsVisualEnPath, renderProjectVisual(personalProjects, 'en'));

  const workTechTypeTableJpPath = path.join(careerDir, 'work-tech-type-table-jp.html');
  const workTechTypeTableEnPath = path.join(careerDir, 'work-tech-type-table-en.html');
  writeFile(workTechTypeTableJpPath, renderWorkTechTypeTable(experiences, 'jp'));
  writeFile(workTechTypeTableEnPath, renderWorkTechTypeTable(experiences, 'en'));

  const workCategoryVisualJpPath = path.join(careerDir, 'work-category-visual-jp.html');
  const workCategoryVisualEnPath = path.join(careerDir, 'work-category-visual-en.html');
  writeFile(workCategoryVisualJpPath, renderWorkCategoryVisual(experiences, 'jp'));
  writeFile(workCategoryVisualEnPath, renderWorkCategoryVisual(experiences, 'en'));

  const workCategoryTableJpPath = path.join(careerDir, 'work-category-table-jp.html');
  const workCategoryTableEnPath = path.join(careerDir, 'work-category-table-en.html');
  writeFile(workCategoryTableJpPath, renderWorkCategoryTable(experiences, 'jp'));
  writeFile(workCategoryTableEnPath, renderWorkCategoryTable(experiences, 'en'));

  const careerJpDoc = path.join(rootDir, 'Career_JP.md');
  const careerEnDoc = path.join(rootDir, 'Career_EN.md');

  if (fs.existsSync(careerJpDoc)) {
    updateLastModifiedAt(careerJpDoc, dateText);
    updateFooterLastUpdated(careerJpDoc, 'jp', now);
  }
  
  if (fs.existsSync(careerEnDoc)) {
    updateLastModifiedAt(careerEnDoc, dateText);
    updateFooterLastUpdated(careerEnDoc, 'en', now);
  }

  console.log('[career:update] Career sections generated successfully.');
}

main();
