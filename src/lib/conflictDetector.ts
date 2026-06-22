import type {
  Character,
  ConflictWarning,
  ConflictFixSuggestion,
  Chapter,
  PlotPoint,
  TimelineEvent,
  GeographyLocation,
  CustomRule,
  ConflictCategory,
  ConflictSeverity,
} from '@shared/types';

const generateId = () => `detector-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const PERSONALITY_OPPOSITES: Record<string, string[]> = {
  '冷静': ['冲动', '暴躁', '激动', '急躁', '惊慌'],
  '理智': ['冲动', '感情用事', '情绪化', '失去理智'],
  '温柔': ['粗暴', '凶狠', '冷酷', '残忍', '刻薄'],
  '坚定': ['动摇', '犹豫', '退缩', '软弱', '优柔寡断'],
  '善良': ['邪恶', '残忍', '恶毒', '狠毒', '冷酷'],
  '勇敢': ['胆小', '怯懦', '懦弱', '害怕', '畏惧'],
  '聪明': ['愚蠢', '愚笨', '迟钝', '笨拙', '傻'],
  '谨慎': ['鲁莽', '草率', '粗心', '冒失', '轻率'],
  '乐观': ['悲观', '消极', '沮丧', '绝望', '消沉'],
  '开朗': ['孤僻', '沉默', '阴郁', '内向', '冷漠'],
  '大方': ['吝啬', '小气', '抠门', '自私'],
  '诚实': ['虚伪', '撒谎', '欺骗', '狡诈', '狡猾'],
  '正直': ['邪恶', '狡诈', '阴险', '卑鄙', '无耻'],
  '执着': ['放弃', '退缩', '半途而废', '动摇'],
  '沉稳': ['浮躁', '急躁', '冲动', '慌乱'],
  '保守': ['激进', '冒进', '冲动', '创新过度'],
  '害羞': ['大胆', '主动', '外向', '张扬'],
  '勤奋': ['懒惰', '懒散', '懈怠', '偷懒'],
  '谦虚': ['骄傲', '傲慢', '自大', '狂妄'],
  '宽容': ['狭隘', '刻薄', '斤斤计较', '记仇'],
};

const TIME_PATTERNS = [
  /公元\s*(\d+)\s*年/g,
  /(\d+)\s*年/g,
  /第\s*([一二三四五六七八九十百千零两\d]+)\s*[章节天周月年]/g,
  /(\d+)\s*月\s*(\d+)\s*日/g,
  /(春天|夏天|秋天|冬天|春季|夏季|秋季|冬季)/g,
  /(清晨|早晨|上午|中午|下午|傍晚|晚上|深夜|凌晨|黎明|黄昏)/g,
  /(第二天|次日|当天|当晚|昨夜|昨日|昨天|今天|明天|后天|前天)/g,
  /(\d+)\s*(小时|分钟|天|周|月|年)\s*(前|后|之后|之前)/g,
];

const CHINESE_NUM_MAP: Record<string, number> = {
  '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '百': 100, '千': 1000,
};

function parseChineseNumber(str: string): number | null {
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  let result = 0;
  let section = 0;
  let current = 0;
  for (const char of str) {
    const val = CHINESE_NUM_MAP[char];
    if (val === undefined) return null;
    if (val >= 10) {
      section += (current || 1) * val;
      current = 0;
    } else {
      current = val;
    }
  }
  return section + current;
}

function createFixSuggestion(
  title: string,
  description: string,
  type: ConflictFixSuggestion['type'],
  options: Partial<ConflictFixSuggestion> = {}
): ConflictFixSuggestion {
  return {
    id: generateId(),
    title,
    description,
    type,
    autoApplicable: ['replace_text', 'add_text', 'delete_text'].includes(type),
    ...options,
  };
}

export function extractTimeExpressions(text: string): Array<{ expression: string; line: number; normalized?: string }> {
  const results: Array<{ expression: string; line: number; normalized?: string }> = [];
  const lines = text.split('\n');

  lines.forEach((line, lineIdx) => {
    for (const pattern of TIME_PATTERNS) {
      const matches = line.matchAll(new RegExp(pattern.source, pattern.flags));
      for (const match of matches) {
        results.push({
          expression: match[0],
          line: lineIdx + 1,
        });
      }
    }
  });

  return results;
}

export function extractLocationExpressions(
  text: string,
  knownLocations: GeographyLocation[] = []
): Array<{ name: string; line: number; isKnown: boolean }> {
  const results: Array<{ name: string; line: number; isKnown: boolean }> = [];
  const lines = text.split('\n');

  const knownNames = new Set<string>();
  knownLocations.forEach(loc => {
    knownNames.add(loc.name);
    loc.aliases.forEach(a => knownNames.add(a));
  });

  const locationPatterns = [
    /(在|到|去|往|来|回|离开|抵达|到达)\s*([\u4e00-\u9fa5A-Za-z]{2,20}(城|市|镇|村|山|河|海|湖|岛|国|家|宫殿|府|宅|楼|阁|殿|院|园|港|站|机场|基地|中心|区|街|路|道))/g,
    /([\u4e00-\u9fa5]{2,10}(星|星系|星云|星区|星域|太空站|空间站|殖民舰|基地))/g,
  ];

  lines.forEach((line, lineIdx) => {
    for (const pattern of locationPatterns) {
      const matches = line.matchAll(new RegExp(pattern.source, pattern.flags));
      for (const match of matches) {
        const name = match[2] || match[1];
        if (name && name.length >= 2) {
          results.push({
            name,
            line: lineIdx + 1,
            isKnown: knownNames.has(name),
          });
        }
      }
    }

    knownLocations.forEach(loc => {
      if (line.includes(loc.name)) {
        results.push({ name: loc.name, line: lineIdx + 1, isKnown: true });
      }
      loc.aliases.forEach(alias => {
        if (line.includes(alias)) {
          results.push({ name: alias, line: lineIdx + 1, isKnown: true });
        }
      });
    });
  });

  return results;
}

export function detectPersonalityConflicts(
  chapterContent: string,
  character: Character
): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  const lines = chapterContent.split('\n');

  const personalityStr = character.traits?.personality || '';
  const traits = personalityStr.split(/[、,，;；]/).map(t => t.trim()).filter(Boolean);

  if (traits.length === 0) return warnings;

  const namePattern = new RegExp(character.name, 'g');

  lines.forEach((line, lineIdx) => {
    if (!namePattern.test(line)) return;

    for (const trait of traits) {
      const opposites = PERSONALITY_OPPOSITES[trait];
      if (!opposites) continue;

      for (const opposite of opposites) {
        if (line.includes(opposite)) {
          const contextWindow = 30;
          const matchIdx = line.indexOf(opposite);
          const start = Math.max(0, matchIdx - contextWindow);
          const end = Math.min(line.length, matchIdx + opposite.length + contextWindow);
          const conflictingText = line.slice(start, end);

          const suggestions: ConflictFixSuggestion[] = [
            createFixSuggestion(
              `修改行为描述以符合「${trait}」的性格`,
              `人物${character.name}的设定性格是「${trait}」，但这段描写中的「${opposite}」与之矛盾。建议修改行为或对话，使其更符合人物设定。`,
              'replace_text',
              {
                targetLine: lineIdx + 1,
                originalText: conflictingText,
              }
            ),
            createFixSuggestion(
              `更新人物设定，增加「${opposite}」的性格维度`,
              `如果这是人物的有意转变，请在人物百科中更新${character.name}的性格描述，说明性格变化的原因和背景。`,
              'update_character'
            ),
          ];

          warnings.push({
            id: generateId(),
            chapterId: '',
            characterId: character.id,
            character,
            severity: 'warning',
            category: 'character_personality',
            message: `人物「${character.name}」的性格可能存在矛盾：设定为「${trait}」，但文中出现了「${opposite}」的描写。`,
            detailedDescription: `在第${lineIdx + 1}行检测到与人物设定性格相矛盾的描述。${character.name}的官方设定性格是「${personalityStr}」，其中「${trait}」与「${opposite}」是反义词或语义冲突。请确认这是有意的人物转变，还是需要修改的写作失误。`,
            lineNumber: lineIdx + 1,
            conflictingText,
            evidence: [
              { text: `人物设定：${personalityStr}`, source: '人物百科' },
              { text: conflictingText, source: `第${lineIdx + 1}行`, line: lineIdx + 1 },
            ],
            suggestions,
            createdAt: new Date(),
            resolved: false,
          });
        }
      }
    }
  });

  return warnings;
}

export function detectTimelineConflicts(
  chapterContent: string,
  chapter: Chapter,
  allChapters: Chapter[],
  timelineEvents: TimelineEvent[] = []
): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  const lines = chapterContent.split('\n');

  const chapterTimes = extractTimeExpressions(chapterContent);
  if (chapterTimes.length < 2) return warnings;

  const chapterOrder = chapter.order;

  allChapters
    .filter(c => c.projectId === chapter.projectId && c.id !== chapter.id)
    .forEach(otherChapter => {
      const otherTimes = extractTimeExpressions(otherChapter.content);
      if (otherTimes.length === 0) return;

      const hasYearPattern = /公元\s*\d+\s*年|\d+\s*年/;
      const thisYearMatch = chapterContent.match(hasYearPattern);
      const otherYearMatch = otherChapter.content.match(hasYearPattern);

      if (thisYearMatch && otherYearMatch) {
        const thisYearStr = thisYearMatch[0].replace(/[^\d]/g, '');
        const otherYearStr = otherYearMatch[0].replace(/[^\d]/g, '');
        const thisYear = parseInt(thisYearStr, 10);
        const otherYear = parseInt(otherYearStr, 10);

        const isEarlier = chapter.order < otherChapter.order;
        const timeEarlier = thisYear < otherYear;

        if (isEarlier && !timeEarlier && thisYear !== otherYear) {
          const matchIdx = chapterContent.indexOf(thisYearMatch[0]);
          const lineNum = chapterContent.slice(0, matchIdx).split('\n').length;

          const suggestions: ConflictFixSuggestion[] = [
            createFixSuggestion(
              `调整本章时间表述`,
              `将「${thisYearMatch[0]}」修改为早于「${otherYearMatch[0]}」的年份，以符合章节顺序。`,
              'replace_text',
              {
                targetLine: lineNum,
                originalText: thisYearMatch[0],
                suggestedText: `公元${otherYear - (otherChapter.order - chapter.order) * 10}年`,
              }
            ),
            createFixSuggestion(
              `调整章节顺序`,
              `如果本章确实发生在${otherChapter.title}之后，请在章节管理中调整两个章节的排列顺序。`,
              'custom'
            ),
          ];

          warnings.push({
            id: generateId(),
            chapterId: chapter.id,
            severity: 'error',
            category: 'timeline',
            message: `时间线可能存在矛盾：本章（第${chapter.order}章）设定为「${thisYearMatch[0]}」，但排在后面的「${otherChapter.title}」（第${otherChapter.order}章）却是「${otherYearMatch[0]}」，时间出现倒流。`,
            detailedDescription: `根据章节排列顺序，「${chapter.title}」应该发生在「${otherChapter.title}」之前。但检测到本章的年份标注（${thisYearMatch[0]}）晚于或等于后一章（${otherYearMatch[0]}），这会导致时间线上的逻辑矛盾。`,
            lineNumber: lineNum,
            conflictingText: thisYearMatch[0],
            evidence: [
              { text: `本章：${thisYearMatch[0]}`, source: chapter.title, line: lineNum },
              { text: `后一章：${otherYearMatch[0]}`, source: otherChapter.title },
              { text: `章节顺序：本章 (${chapter.order}) → ${otherChapter.title} (${otherChapter.order})`, source: '章节列表' },
            ],
            suggestions,
            createdAt: new Date(),
            resolved: false,
          });
        }
      }
    });

  const relativeTimes = lines
    .map((line, idx) => ({ line: idx + 1, text: line }))
    .filter(({ text }) => /(第二天|次日|当天|当晚|昨夜|昨日|昨天|今天|明天|后天|前天)/.test(text));

  for (let i = 0; i < relativeTimes.length - 1; i++) {
    const first = relativeTimes[i];
    const second = relativeTimes[i + 1];
    const backwards = ['第二天', '次日', '明天', '后天'];
    const forwards = ['昨天', '昨日', '昨夜', '前天'];

    const firstBack = backwards.some(b => first.text.includes(b));
    const secondBack = forwards.some(f => second.text.includes(f));

    if (firstBack && secondBack && first.line < second.line) {
      const suggestions: ConflictFixSuggestion[] = [
        createFixSuggestion(
          `检查并修正时间表述顺序`,
          `文中先提到"未来时间"（第二天/明天），后又提到"过去时间"（昨天/前天），请确认时间流向是否正确。`,
          'custom',
          { targetLine: second.line }
        ),
      ];

      warnings.push({
        id: generateId(),
        chapterId: chapter.id,
        severity: 'warning',
        category: 'timeline',
        message: `章节内时间流向可能存在矛盾：先出现未来时间表述，后出现过去时间表述。`,
        detailedDescription: `在第${first.line}行检测到指向未来的时间（如"第二天"、"明天"），但在第${second.line}行又出现了指向过去的时间（如"昨天"、"前天"）。如果不是闪回或插叙手法，请检查时间表述是否有误。`,
        lineNumber: first.line,
        endLineNumber: second.line,
        evidence: [
          { text: first.text.trim().slice(0, 50), source: `第${first.line}行`, line: first.line },
          { text: second.text.trim().slice(0, 50), source: `第${second.line}行`, line: second.line },
        ],
        suggestions,
        createdAt: new Date(),
        resolved: false,
      });
    }
  }

  return warnings;
}

export function detectGeographyConflicts(
  chapterContent: string,
  chapter: Chapter,
  allChapters: Chapter[],
  locations: GeographyLocation[] = []
): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  const lines = chapterContent.split('\n');

  const foundLocations = extractLocationExpressions(chapterContent, locations);

  const travelPatterns = [
    /从\s*([\u4e00-\u9fa5A-Za-z0-9]{2,20})\s*(到|去|往|抵达|到达)\s*([\u4e00-\u9fa5A-Za-z0-9]{2,20})/g,
    /离开\s*([\u4e00-\u9fa5A-Za-z0-9]{2,20})\s*(前往|去往|到达|抵达)\s*([\u4e00-\u9fa5A-Za-z0-9]{2,20})/g,
  ];

  lines.forEach((line, lineIdx) => {
    for (const pattern of travelPatterns) {
      const matches = line.matchAll(new RegExp(pattern.source, pattern.flags));
      for (const match of matches) {
        const from = match[1];
        const to = match[3] || match[2];
        if (from && to && from === to) {
          const suggestions: ConflictFixSuggestion[] = [
            createFixSuggestion(
              `修正地点名称`,
              `出发地「${from}」与目的地「${to}」相同，请检查是否存在笔误。`,
              'replace_text',
              {
                targetLine: lineIdx + 1,
                originalText: match[0],
              }
            ),
          ];

          warnings.push({
            id: generateId(),
            chapterId: chapter.id,
            severity: 'warning',
            category: 'geography',
            message: `地理逻辑矛盾：出发地「${from}」与目的地「${to}」相同。`,
            detailedDescription: `在第${lineIdx + 1}行检测到"从${from}到${to}"的表述，出发地和目的地完全相同，可能是笔误或逻辑错误。`,
            lineNumber: lineIdx + 1,
            conflictingText: match[0],
            evidence: [
              { text: match[0], source: `第${lineIdx + 1}行`, line: lineIdx + 1 },
            ],
            suggestions,
            createdAt: new Date(),
            resolved: false,
          });
        }
      }
    }
  });

  if (foundLocations.length >= 2) {
    const chapterTimes = extractTimeExpressions(chapterContent);
    const hasShortTimeTravel = chapterTimes.some(t =>
      /(瞬间|刹那|立刻|马上|同时|就在这时|转眼间|一眨眼|顷刻)/.test(t.expression)
    );

    if (!hasShortTimeTravel) {
      const uniqueLocations = [...new Set(foundLocations.map(l => l.name))];
      if (uniqueLocations.length >= 3) {
        const linesList = [...new Set(foundLocations.map(l => l.line))].sort((a, b) => a - b);
        if (linesList.length >= 3) {
          const lineDiff = linesList[linesList.length - 1] - linesList[0];
          if (lineDiff <= 50) {
            const suggestions: ConflictFixSuggestion[] = [
              createFixSuggestion(
                `检查场景跳转是否合理`,
                `在较短篇幅内（${lineDiff}行内）切换了${uniqueLocations.length}个地点：${uniqueLocations.join('、')}。请确认是否有足够的过渡描写，或是否存在地点描述错误。`,
                'custom'
              ),
            ];

            warnings.push({
              id: generateId(),
              chapterId: chapter.id,
              severity: 'info',
              category: 'geography',
              message: `场景切换过于频繁：在${lineDiff}行内切换了${uniqueLocations.length}个地点（${uniqueLocations.slice(0, 3).join('、')}${uniqueLocations.length > 3 ? '...' : ''}）。`,
              detailedDescription: `检测到本章在较近的文本跨度内切换了多个场景地点。频繁的场景跳转可能会让读者感到困惑。请确认：1. 是否有足够的过渡描写说明空间移动；2. 是否存在地点描述的笔误。`,
              lineNumber: linesList[0],
              endLineNumber: linesList[linesList.length - 1],
              evidence: uniqueLocations.map((name, idx) => ({
                text: name,
                source: `第${foundLocations.find(l => l.name === name)?.line}行`,
                line: foundLocations.find(l => l.name === name)?.line,
              })),
              suggestions,
              createdAt: new Date(),
              resolved: false,
            });
          }
        }
      }
    }
  }

  const unknownLocations = foundLocations.filter(l => !l.isKnown && l.name.length >= 2);
  const unknownUnique = [...new Map(unknownLocations.map(l => [l.name, l])).values()];

  if (unknownUnique.length > 0 && locations.length > 0) {
    unknownUnique.slice(0, 3).forEach(loc => {
      const suggestions: ConflictFixSuggestion[] = [
        createFixSuggestion(
          `将「${loc.name}」添加到地理设定库`,
          `这是一个新出现的地点，建议在地理百科中添加该地点的详细描述，便于后续统一管理。`,
          'custom'
        ),
      ];

      warnings.push({
        id: generateId(),
        chapterId: chapter.id,
        severity: 'info',
        category: 'geography',
        message: `发现新地点「${loc.name}」，尚未在地理设定库中登记。`,
        detailedDescription: `在第${loc.line}行出现了未在项目地理设定中登记的地点「${loc.name}」。如果这是重要场景，建议补充到地理设定库中，以保持全作品的一致性。`,
        lineNumber: loc.line,
        evidence: [
          { text: loc.name, source: `第${loc.line}行`, line: loc.line },
        ],
        suggestions,
        createdAt: new Date(),
        resolved: false,
      });
    });
  }

  return warnings;
}

export function detectTraitConflicts(
  chapterContent: string,
  character: Character
): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  const lines = chapterContent.split('\n');
  const traitEntries = Object.entries(character.traits || {});

  for (const [key, value] of traitEntries) {
    if (key === 'personality' || !value) continue;
    const knownValues = String(value).split(/[、,，;；]/).map(t => t.trim()).filter(Boolean);

    for (const trait of knownValues) {
      if (trait.length < 2) continue;

      const negatePatterns = [
        `不${trait}`, `非${trait}`, `没有${trait}`, `无${trait}`,
        `并非${trait}`, `不是${trait}`, `从未${trait}`,
      ];

      lines.forEach((line, lineIdx) => {
        if (!line.includes(character.name)) return;

        for (const negate of negatePatterns) {
          if (line.includes(negate)) {
            const matchIdx = line.indexOf(negate);
            const contextWindow = 30;
            const start = Math.max(0, matchIdx - contextWindow);
            const end = Math.min(line.length, matchIdx + negate.length + contextWindow);
            const conflictingText = line.slice(start, end);

            const suggestions: ConflictFixSuggestion[] = [
              createFixSuggestion(
                `删除否定表述以符合人物设定`,
                `「${negate}」与人物设定的「${key}: ${trait}」矛盾，建议修改或删除这段否定描述。`,
                'replace_text',
                {
                  targetLine: lineIdx + 1,
                  originalText: conflictingText,
                }
              ),
              createFixSuggestion(
                `更新人物属性「${key}」`,
                `如果这是有意的剧情设定（人物状态改变），请在人物百科中将「${key}」的设定更新为新的描述。`,
                'update_character'
              ),
            ];

            warnings.push({
              id: generateId(),
              chapterId: '',
              characterId: character.id,
              character,
              severity: 'warning',
              category: 'character_trait',
              message: `人物「${character.name}」的属性可能存在矛盾：「${key}」设定为「${trait}」，但文中出现了「${negate}」的描述。`,
              detailedDescription: `在第${lineIdx + 1}行检测到与人物属性设定相矛盾的否定描述。${character.name}的「${key}」设定为「${trait}」，而原文使用了否定表达「${negate}」。`,
              lineNumber: lineIdx + 1,
              conflictingText,
              evidence: [
                { text: `${key}：${trait}`, source: '人物百科' },
                { text: conflictingText, source: `第${lineIdx + 1}行`, line: lineIdx + 1 },
              ],
              suggestions,
              createdAt: new Date(),
              resolved: false,
            });
            break;
          }
        }
      });
    }
  }

  return warnings;
}

export function applyCustomRules(
  chapterContent: string,
  chapter: Chapter,
  rules: CustomRule[]
): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  const lines = chapterContent.split('\n');

  const enabledRules = rules.filter(r => r.isEnabled && r.projectId === chapter.projectId);

  for (const rule of enabledRules) {
    const matches: boolean[] = rule.conditions.map(cond => {
      switch (cond.type) {
        case 'keyword_present':
          return chapterContent.includes(cond.value);
        case 'keyword_absent':
          return !chapterContent.includes(cond.value);
        case 'regex_match':
          try {
            const regex = new RegExp(cond.value, 'g');
            return regex.test(chapterContent);
          } catch {
            return false;
          }
        default:
          return false;
      }
    });

    const ruleTriggered = rule.conditionOperator === 'and'
      ? matches.every(m => m)
      : matches.some(m => m);

    if (ruleTriggered) {
      let lineNumber: number | undefined;
      let conflictingText = '';

      for (const cond of rule.conditions) {
        if (cond.type === 'keyword_present' || cond.type === 'regex_match') {
          for (let i = 0; i < lines.length; i++) {
            if (cond.type === 'keyword_present' ? lines[i].includes(cond.value) :
              new RegExp(cond.value).test(lines[i])) {
              lineNumber = i + 1;
              conflictingText = lines[i].trim().slice(0, 80);
              break;
            }
          }
          if (lineNumber) break;
        }
      }

      const category: ConflictCategory = rule.category;
      const severity: ConflictSeverity = rule.severity;

      warnings.push({
        id: generateId(),
        chapterId: chapter.id,
        severity,
        category,
        message: rule.customMessage || `[自定义规则] ${rule.name}：${rule.description}`,
        detailedDescription: `触发自定义规则「${rule.name}」。规则描述：${rule.description}。匹配条件：${rule.conditions.map(c => `${c.type}(${c.value})`).join(rule.conditionOperator === 'and' ? ' 且 ' : ' 或 ')}。`,
        lineNumber,
        conflictingText: conflictingText || undefined,
        customRuleId: rule.id,
        evidence: rule.conditions.map(c => ({
          text: `${c.type}: ${c.value}`,
          source: `规则「${rule.name}」`,
        })),
        suggestions: rule.suggestions,
        createdAt: new Date(),
        resolved: false,
      });
    }
  }

  return warnings;
}

export function generateFixForForeshadowRemoved(
  plotPoint: PlotPoint,
  hintText: string,
  chapter: Chapter
): ConflictFixSuggestion[] {
  const chapterLines = chapter.content.split('\n');
  const insertLine = Math.min(chapterLines.length - 1, Math.max(0, Math.floor(chapterLines.length / 2)));

  return [
    createFixSuggestion(
      `恢复伏笔线索`,
      `将被删除的伏笔线索重新插入到章节内容中。`,
      'add_text',
      {
        targetLine: insertLine,
        suggestedText: hintText,
      }
    ),
    createFixSuggestion(
      `更新伏笔线索为新的表述`,
      `如果原线索不再适用，可以修改伏笔描述以匹配新的章节内容。`,
      'update_plot'
    ),
    createFixSuggestion(
      `标记伏笔状态为已修改`,
      `如果这是有意的情节调整，请将伏笔「${plotPoint.title}」的相关线索同步更新。`,
      'custom'
    ),
  ];
}
