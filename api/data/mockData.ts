import type {
  User,
  Project,
  ProjectMember,
  Chapter,
  ChapterVersion,
  Character,
  PlotPoint,
  ConflictWarning,
  StickyNote,
  ChapterBranch,
  BranchVersion,
  NoteConnection,
  CustomRule,
  TimelineEvent,
  GeographyLocation,
} from '../../shared/types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: '墨雨堂主',
    email: 'moyu@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=moyu',
    createdAt: new Date('2025-01-15'),
  },
  {
    id: 'user-2',
    username: '清风剑客',
    email: 'qingfeng@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qingfeng',
    createdAt: new Date('2025-02-10'),
  },
  {
    id: 'user-3',
    username: '烟雨楼主',
    email: 'yanyu@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yanyu',
    createdAt: new Date('2025-03-05'),
  },
];

export const mockMembers: ProjectMember[] = [
  {
    userId: 'user-1',
    user: mockUsers[0],
    role: 'creator',
    joinedAt: new Date('2025-06-01'),
  },
  {
    userId: 'user-2',
    user: mockUsers[1],
    role: 'author',
    joinedAt: new Date('2025-06-05'),
  },
  {
    userId: 'user-3',
    user: mockUsers[2],
    role: 'author',
    joinedAt: new Date('2025-06-10'),
  },
];

export const mockProjects: Project[] = [
  {
    id: 'project-1',
    title: '星辰之海',
    description: '一部关于星际航行与人类命运的长篇科幻小说。在遥远的未来，人类踏上了寻找新家园的旅程，却在宇宙深处发现了改变文明走向的秘密……',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=epic%20space%20ocean%20with%20stars%20and%20galaxy%20scifi%20fantasy%20book%20cover&image_size=landscape_16_9',
    creatorId: 'user-1',
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2026-06-10'),
    members: mockMembers,
  },
  {
    id: 'project-2',
    title: '长安异闻录',
    description: '盛唐长安，暗流涌动。大理寺少卿与神秘少女联手破解一桩桩离奇案件，却发现背后隐藏着动摇王朝根基的惊天阴谋。',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20chinese%20tang%20dynasty%20city%20of%20changan%20mystery%20detective%20book%20cover&image_size=landscape_16_9',
    creatorId: 'user-2',
    createdAt: new Date('2025-08-15'),
    updatedAt: new Date('2026-05-20'),
    members: [
      {
        userId: 'user-2',
        user: mockUsers[1],
        role: 'author' as const,
        joinedAt: new Date('2025-06-05'),
      },
      {
        userId: 'user-1',
        user: mockUsers[0],
        role: 'creator' as const,
        joinedAt: new Date('2025-06-01'),
      },
    ],
  },
];

export const mockChapters: Chapter[] = [
  {
    id: 'chapter-1',
    projectId: 'project-1',
    title: '第一章 启航',
    content: `公元2157年，地球轨道。

"星辰号"静静停泊在联合太空站的三号船坞，这艘长达三公里的星际殖民舰是人类有史以来建造的最伟大的工程奇迹。它承载着十万名精选的殖民者，以及人类文明延续的全部希望。

林远站在观景窗前，望着那颗蓝色的星球，心中百感交集。作为"星辰号"的首席天文官，他知道这一去，便是永别。

"在想什么？"身后传来熟悉的声音。

林远没有回头，轻声说道："在想我们这一走，地球上的人会怎么看我们。是勇士，还是逃兵？"

苏婉走到他身边，和他并肩而立。这位"星辰号"的医疗主管有着一双温柔却坚定的眼睛。

"历史会给出答案的，"她轻轻说，"而我们的使命，是让人类这个名字，不再局限于这颗星球。"

通讯器突然响起，舰长的声音传遍全舰："所有人员请注意，启航倒计时十分钟。请各部门做好最终检查。"

林深深吸了一口气，握住了苏婉的手。

"走吧，"他说，"该去创造历史了。"

随着倒计时的结束，"星辰号"的引擎发出低沉的轰鸣。在亿万地球人的注视下，这艘承载着人类未来的巨舰，缓缓驶向了那片无垠的星海。

前方，是未知；身后，是故乡。

而属于他们的传奇，才刚刚开始。`,
    order: 1,
    wordCount: 587,
    createdAt: new Date('2025-06-10'),
    updatedAt: new Date('2026-06-12'),
  },
  {
    id: 'chapter-2',
    projectId: 'project-1',
    title: '第二章 异常信号',
    content: `航行第三年，深空。

"星辰号"已经离开太阳系，进入了真正的星际空间。船上的殖民者大多进入了低温休眠状态，只有几百名船员保持清醒，负责日常维护。

林远正在天文观测室例行扫描深空背景辐射，突然，监测屏幕上出现了一个奇怪的波形。

"嗯？"他皱起眉头，调整了接收频率。

那个信号再次出现了——有规律的脉冲，间隔精确到毫秒，绝不可能是自然现象。

"苏婉，你来看一下，"林远呼叫道，"我收到了一个奇怪的信号。"

苏婉很快赶到，她看着屏幕上的波形，脸色也变得凝重起来。

"这是……人工信号？"

"可能性超过90%，"林远飞快地计算着，"信号源距离我们大约12光年，方向是……天琴座方向。"

"我们的航线正好要经过那里！"苏婉惊道。

林远点了点头，神色复杂："是的。而且根据信号强度分析……发出信号的文明，技术水平可能不在我们之下。"

这个发现让整个船员都震动了。舰长召开了紧急会议。

"我们有两个选择，"舰长指着星图，"一是改变航线，避开这个区域；二是继续前进，尝试接触。"

大副立刻反对："太危险了！我们对这个文明一无所知，万一有敌意怎么办？我们肩负着人类延续的使命，不能冒险！"

"但如果是友好的呢？"苏婉反驳道，"我们在宇宙中不再孤独，这对人类文明的意义是无法估量的。"

争论持续了很久。最终，舰长看向林远："林首席，你的意见？"

林远沉默了片刻，缓缓说道："舰长，各位。我们之所以踏上这条旅程，不就是为了探索未知吗？如果遇到一点未知就退缩，那人类永远也走不出太阳系。"

他顿了顿，目光坚定："我建议，继续前进。但是，保持最高警戒。"

会议最终决定：保持原航线，同时进入一级战备状态。

消息传开，有人兴奋，有人担忧。而林远站在观测窗前，望着那片无尽的星空，心中既期待又不安。

他不知道，这个决定，将把人类带向一个从未想象过的未来。

而那个神秘的信号，仿佛是宇宙对人类的第一声问候。

或者，是警告。`,
    order: 2,
    wordCount: 723,
    lock: {
      userId: 'user-2',
      user: mockUsers[1],
      lockedAt: new Date(Date.now() - 1000 * 60 * 15),
      expiresAt: new Date(Date.now() + 1000 * 60 * 15),
    },
    createdAt: new Date('2025-07-15'),
    updatedAt: new Date('2026-06-14'),
  },
  {
    id: 'chapter-3',
    projectId: 'project-1',
    title: '第三章 神秘遗迹',
    content: `航行第五年，距离信号源还有三天航程。

"星辰号"已经进入了一个异常的星域。这里的星图与数据库中的记录完全不符，仿佛有什么东西改变了这片区域的空间结构。

"舰长，前方发现异常！"领航员突然喊道。

所有人都看向主屏幕。在那里，一个巨大的、不规则的金属结构静静地漂浮在虚空中。它的直径超过了一百公里，表面布满了复杂到令人窒息的符文。

"这是什么？"有人失声问道。

林远的脸色苍白："根据碳14测年……这个遗迹的年龄，至少有五十万年。"

整个舰桥陷入了死寂。

五十万年。人类文明才不过五千年。

"启动探测器，"舰长的声音有些颤抖，"小心靠近。"

探测器缓缓靠近那座古老的遗迹。当镜头对准表面的符文时，林远的瞳孔骤然收缩。

"等等……这些符号……"他站起来，凑近屏幕，"我见过类似的！"

"什么？"苏婉惊讶地看着他。

"在西藏的古格王朝遗址，我参与过一次考古发掘，"林远快速地说，"那里的壁画上，就有类似的符号！"

所有人都惊呆了。

地球西藏的古代壁画，和五十万年前的外星遗迹，竟然有相同的符号？

"这不可能……"大副喃喃道。

探测器传回了更多数据。遗迹内部似乎已经废弃，但核心区域仍然有微弱的能量反应。更令人震惊的是，在遗迹的一个舱室里，探测器发现了壁画——

画面上，一群身材高大的人形生物，正在向另一个星球播撒着什么。而那颗星球，赫然就是地球。

"我的上帝……"苏婉捂住了嘴。

林远感到一阵眩晕。一个可怕的猜想在他脑海中形成——

人类的起源，或许并不在地球。

或者说，人类文明的发展，从一开始就被某种力量干预过。

"舰长，"林远的声音有些沙哑，"我建议……我们进去看看。"

舰长看着屏幕上那座古老的遗迹，又看了看舰桥上那些震惊的船员。

五十万年的秘密，就在眼前。

而他们，将成为第一批触碰真相的人类。

"准备登陆舱，"舰长深吸一口气，"林远、苏婉，你们跟我来。"`,
    order: 3,
    wordCount: 689,
    createdAt: new Date('2025-08-20'),
    updatedAt: new Date('2026-06-10'),
  },
  {
    id: 'chapter-4',
    projectId: 'project-1',
    title: '第四章 造物主',
    content: `（本章正在创作中……）

林远踏入遗迹的那一刻，仿佛走进了时间的洪流。

五十万年的光阴在这座巨大的建筑中凝固，每一步都像是踩在历史的脉搏上。`,
    order: 4,
    wordCount: 86,
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-06-15'),
  },
];

export const mockChapterVersions: ChapterVersion[] = [
  {
    id: 'version-1-1',
    chapterId: 'chapter-1',
    content: `公元2157年，地球。

"星辰号"准备启航。林远作为首席天文官，心情复杂。

苏婉安慰他，历史会给出答案。

他们启航了。`,
    authorId: 'user-1',
    author: mockUsers[0],
    changeSummary: '创建初稿',
    createdAt: new Date('2025-06-10T10:00:00'),
  },
  {
    id: 'version-1-2',
    chapterId: 'chapter-1',
    content: `公元2157年，地球轨道。

"星辰号"静静停泊在联合太空站的三号船坞，这艘长达三公里的星际殖民舰是人类有史以来建造的最伟大的工程奇迹。

林远站在观景窗前，望着那颗蓝色的星球，心中百感交集。

"在想什么？"身后传来熟悉的声音。

林远没有回头，轻声说道："在想我们这一走，地球上的人会怎么看我们。是勇士，还是逃兵？"

苏婉走到他身边，和他并肩而立。

"历史会给出答案的，"她轻轻说，"而我们的使命，是让人类这个名字，不再局限于这颗星球。"

启航倒计时开始。

林远深深吸了一口气，握住了苏婉的手。

"走吧，"他说，"该去创造历史了。"

随着倒计时的结束，"星辰号"缓缓驶向了那片无垠的星海。

前方，是未知；身后，是故乡。

而属于他们的传奇，才刚刚开始。`,
    authorId: 'user-1',
    author: mockUsers[0],
    changeSummary: '丰富场景描写和人物对话',
    createdAt: new Date('2025-06-10T15:30:00'),
  },
  {
    id: 'version-1-3',
    chapterId: 'chapter-1',
    content: mockChapters[0].content,
    authorId: 'user-2',
    author: mockUsers[1],
    changeSummary: '完善启航场景，增加细节描写',
    createdAt: new Date('2026-06-12T09:15:00'),
  },
  {
    id: 'version-2-1',
    chapterId: 'chapter-2',
    content: `航行第三年。

林远发现了一个奇怪的信号。

苏婉来查看，确认是人工信号。

信号源在天琴座方向，距离12光年。

他们的航线正好经过那里。`,
    authorId: 'user-2',
    author: mockUsers[1],
    changeSummary: '创建第二章初稿',
    createdAt: new Date('2025-07-15T11:00:00'),
  },
  {
    id: 'version-2-2',
    chapterId: 'chapter-2',
    content: mockChapters[1].content,
    authorId: 'user-2',
    author: mockUsers[1],
    changeSummary: '完善章节内容，增加会议争论情节',
    createdAt: new Date('2026-06-14T16:45:00'),
  },
];

export const mockCharacters: Character[] = [
  {
    id: 'char-1',
    projectId: 'project-1',
    name: '林远',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linyuan',
    description: '"星辰号"首席天文官，35岁。性格冷静理智，观察力敏锐，是团队中的智囊。出生于天文学世家，从小就对星空充满向往。',
    traits: {
      age: '35岁',
      occupation: '首席天文官',
      personality: '冷静、理智、执着',
      background: '天文学世家',
      speciality: '深空观测、数据分析',
    },
    voiceSettings: {
      pitch: 1.0,
      rate: 1.0,
      voiceName: '默认男声',
      lang: 'zh-CN',
    },
    relationships: [
      {
        id: 'rel-1',
        characterId: 'char-1',
        targetId: 'char-2',
        target: undefined as any,
        type: '恋人',
        description: '与苏婉是恋人关系，在航行中相互扶持',
      },
      {
        id: 'rel-2',
        characterId: 'char-1',
        targetId: 'char-3',
        target: undefined as any,
        type: '上下级',
        description: '舰长对林远十分信任，常采纳他的建议',
      },
    ],
    appearances: [
      {
        id: 'app-1',
        characterId: 'char-1',
        chapterId: 'chapter-1',
        chapter: undefined,
        context: '第一章主角出场',
        createdAt: new Date('2025-06-10'),
      },
      {
        id: 'app-2',
        characterId: 'char-1',
        chapterId: 'chapter-2',
        chapter: undefined,
        context: '发现异常信号',
        createdAt: new Date('2025-07-15'),
      },
    ],
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2026-06-10'),
  },
  {
    id: 'char-2',
    projectId: 'project-1',
    name: '苏婉',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suwan',
    description: '"星辰号"医疗主管，32岁。温柔善良，但外柔内刚，在关键时刻总能保持镇定。她不仅是团队的医生，更是大家的心灵支柱。',
    traits: {
      age: '32岁',
      occupation: '医疗主管',
      personality: '温柔、坚定、有同情心',
      background: '医学世家',
      speciality: '太空医学、心理学',
    },
    voiceSettings: {
      pitch: 1.3,
      rate: 0.95,
      voiceName: '默认女声',
      lang: 'zh-CN',
    },
    relationships: [
      {
        id: 'rel-3',
        characterId: 'char-2',
        targetId: 'char-1',
        target: undefined as any,
        type: '恋人',
        description: '与林远是恋人关系',
      },
    ],
    appearances: [
      {
        id: 'app-3',
        characterId: 'char-2',
        chapterId: 'chapter-1',
        chapter: undefined,
        context: '与林远在观景台对话',
        createdAt: new Date('2025-06-10'),
      },
    ],
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2026-05-20'),
  },
  {
    id: 'char-3',
    projectId: 'project-1',
    name: '陈舰长',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen',
    description: '"星辰号"舰长，50岁。经验丰富的太空老兵，曾指挥过多次深空探测任务。外表严厉，内心却十分关心每一位船员。',
    traits: {
      age: '50岁',
      occupation: '舰长',
      personality: '沉稳、果断、有担当',
      background: '海军出身，转入太空军',
      speciality: '舰艇指挥、危机处理',
    },
    voiceSettings: {
      pitch: 0.8,
      rate: 0.9,
      voiceName: '默认男声',
      lang: 'zh-CN',
    },
    relationships: [],
    appearances: [
      {
        id: 'app-4',
        characterId: 'char-3',
        chapterId: 'chapter-2',
        chapter: undefined,
        context: '主持紧急会议',
        createdAt: new Date('2025-07-15'),
      },
    ],
    createdAt: new Date('2025-06-05'),
    updatedAt: new Date('2026-04-15'),
  },
  {
    id: 'char-4',
    projectId: 'project-1',
    name: '大副王磊',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wanglei',
    description: '"星辰号"大副，40岁。行事谨慎，注重安全。与林远在决策上常有分歧，但都是为了船员的安全着想。',
    traits: {
      age: '40岁',
      occupation: '大副',
      personality: '谨慎、务实、保守',
      background: '工程师出身',
      speciality: '舰船维护、安全管理',
    },
    voiceSettings: {
      pitch: 0.9,
      rate: 1.05,
      voiceName: '默认男声',
      lang: 'zh-CN',
    },
    relationships: [],
    appearances: [
      {
        id: 'app-5',
        characterId: 'char-4',
        chapterId: 'chapter-2',
        chapter: undefined,
        context: '反对接触外星文明',
        createdAt: new Date('2025-07-15'),
      },
    ],
    createdAt: new Date('2025-06-10'),
    updatedAt: new Date('2026-03-10'),
  },
  {
    id: 'char-5',
    projectId: 'project-1',
    name: '神秘文明',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mystery',
    description: '五十万年前的古老文明，在银河系中留下了无数遗迹。他们与人类的起源似乎有着千丝万缕的联系……',
    traits: {
      age: '五十万年前',
      occupation: '未知',
      personality: '神秘、未知',
      background: '可能创造了人类',
      speciality: '超级科技',
    },
    voiceSettings: {
      pitch: 0.6,
      rate: 0.8,
      voiceName: '默认男声',
      lang: 'zh-CN',
    },
    relationships: [],
    appearances: [],
    createdAt: new Date('2025-08-20'),
    updatedAt: new Date('2026-06-10'),
  },
];



export const mockPlotPoints: PlotPoint[] = [
  {
    id: 'plot-1',
    projectId: 'project-1',
    title: '神秘信号伏笔',
    description: '第一章中林远在观景台时，隐约感到星空中有什么在注视着他们，但他当时以为是错觉。这个伏笔在第二章揭示为外星信号。',
    type: 'foreshadow',
    status: 'resolved',
    relatedChapterIds: ['chapter-1', 'chapter-2'],
    relatedCharacterIds: ['char-1'],
    hints: [
      {
        id: 'hint-1',
        plotPointId: 'plot-1',
        chapterId: 'chapter-1',
        chapter: undefined,
        hintText: '林远望着星空，"总觉得有什么东西在那里，在等待着我们"',
        locationDescription: '第一章中段，林远与苏婉对话时的心理活动',
        createdAt: new Date('2025-06-10'),
      },
      {
        id: 'hint-2',
        plotPointId: 'plot-1',
        chapterId: 'chapter-2',
        chapter: undefined,
        hintText: '林远发现了规律的脉冲信号',
        locationDescription: '第二章开头',
        createdAt: new Date('2025-07-15'),
      },
    ],
    createdAt: new Date('2025-06-10'),
  },
  {
    id: 'plot-2',
    projectId: 'project-1',
    title: '人类起源之谜',
    description: '西藏古格王朝的壁画与外星遗迹符号相同，暗示人类文明与外星文明有着千丝万缕的联系。这个悬念将贯穿整部小说。',
    type: 'foreshadow',
    status: 'active',
    relatedChapterIds: ['chapter-3'],
    relatedCharacterIds: ['char-1', 'char-5'],
    hints: [
      {
        id: 'hint-3',
        plotPointId: 'plot-2',
        chapterId: 'chapter-3',
        chapter: undefined,
        hintText: '林远认出遗迹符文与西藏古格壁画相似',
        locationDescription: '第三章中段，发现遗迹符文时',
        createdAt: new Date('2025-08-20'),
      },
      {
        id: 'hint-4',
        plotPointId: 'plot-2',
        chapterId: 'chapter-3',
        chapter: undefined,
        hintText: '遗迹壁画显示人形生物向地球播撒生命',
        locationDescription: '第三章后半段',
        createdAt: new Date('2025-08-20'),
      },
    ],
    createdAt: new Date('2025-08-20'),
  },
  {
    id: 'plot-3',
    projectId: 'project-1',
    title: '林远的秘密',
    description: '林远身上有一个连他自己都不知道的秘密——他的基因中含有外星DNA。这将在第四章中揭晓。',
    type: 'foreshadow',
    status: 'pending',
    relatedChapterIds: ['chapter-4'],
    relatedCharacterIds: ['char-1', 'char-5'],
    hints: [
      {
        id: 'hint-5',
        plotPointId: 'plot-3',
        hintText: '林远从小就对天文有着超越常人的直觉，总能看到别人看不到的星象',
        locationDescription: '人物设定中的隐藏信息',
        createdAt: new Date('2026-01-10'),
      },
    ],
    createdAt: new Date('2026-01-10'),
  },
  {
    id: 'plot-4',
    projectId: 'project-1',
    title: '陈舰长的抉择',
    description: '作为舰长，陈舰长一直将船员的安全放在第一位。但在发现外星遗迹后，他将面临一个艰难的抉择：是保守秘密，还是告诉所有人真相？',
    type: 'turning',
    status: 'pending',
    relatedChapterIds: ['chapter-3', 'chapter-4'],
    relatedCharacterIds: ['char-3'],
    hints: [],
    createdAt: new Date('2025-08-20'),
  },
  {
    id: 'plot-5',
    projectId: 'project-1',
    title: '小说高潮：真相大白',
    description: '最终揭开人类起源的真相，以及神秘文明留下遗迹的真正目的。',
    type: 'climax',
    status: 'pending',
    relatedChapterIds: [],
    relatedCharacterIds: ['char-1', 'char-2', 'char-3', 'char-5'],
    hints: [],
    createdAt: new Date('2025-06-15'),
  },
];

export const mockConflictWarnings: ConflictWarning[] = [
  {
    id: 'conflict-1',
    chapterId: 'chapter-4',
    plotPointId: 'plot-2',
    plotPoint: mockPlotPoints[1],
    severity: 'warning',
    category: 'foreshadow',
    message: '本章正在创作关于林远身世的内容。请注意：已有的伏笔"人类起源之谜"中提到林远在西藏见过类似符文，建议在本章中呼应这一设定，避免人物行为逻辑出现矛盾。',
    lineNumber: 5,
    columnNumber: 10,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    resolved: false,
  },
  {
    id: 'conflict-2',
    chapterId: 'chapter-2',
    characterId: 'char-3',
    character: mockCharacters[2],
    severity: 'info',
    category: 'character_trait',
    message: '本章中陈舰长主持了紧急会议。人物设定中提到陈舰长"外表严厉，内心关心船员"，当前描写符合设定。',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    resolved: true,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60),
  },
];

export const mockNoteConnections: NoteConnection[] = [
  {
    id: 'conn-1',
    projectId: 'project-1',
    sourceNoteId: 'note-1',
    targetNoteId: 'note-5',
    type: 'causal',
    label: '引出',
    description: '林远发现的符号坐标引出第三章结尾的记忆闪回场景',
    color: '#d97706',
    createdAt: new Date('2026-06-10'),
    updatedAt: new Date('2026-06-15'),
  },
  {
    id: 'conn-2',
    projectId: 'project-1',
    sourceNoteId: 'note-2',
    targetNoteId: 'note-7',
    type: 'reference',
    label: '呼应',
    description: '苏婉的外星药物与新角色AI守护者可能有关联',
    color: '#dc2626',
    createdAt: new Date('2026-06-12'),
    updatedAt: new Date('2026-06-14'),
  },
  {
    id: 'conn-3',
    projectId: 'project-1',
    sourceNoteId: 'note-3',
    targetNoteId: 'note-5',
    type: 'extension',
    label: '延伸',
    description: '陈舰长的秘密背景可以延伸到第三章的决策场景',
    color: '#2563eb',
    createdAt: new Date('2026-06-13'),
    updatedAt: new Date('2026-06-13'),
  },
  {
    id: 'conn-4',
    projectId: 'project-1',
    sourceNoteId: 'note-6',
    targetNoteId: 'note-8',
    type: 'inspiration',
    label: '启发',
    description: '神秘文明的进化设定启发了小说结尾的主题表达',
    color: '#7c3aed',
    createdAt: new Date('2026-06-14'),
    updatedAt: new Date('2026-06-15'),
  },
  {
    id: 'conn-5',
    projectId: 'project-1',
    sourceNoteId: 'note-1',
    targetNoteId: 'note-6',
    type: 'reference',
    label: '关联',
    description: '星际坐标与神秘文明的世界观设定直接相关',
    color: '#059669',
    createdAt: new Date('2026-06-15'),
    updatedAt: new Date('2026-06-15'),
  },
];

export const mockStickyNotes: StickyNote[] = [
  {
    id: 'note-1',
    projectId: 'project-1',
    content: '林远在遗迹中发现的符号，其实是一种星际坐标，指向人类真正的起源星球。',
    color: 'yellow',
    tags: ['伏笔', '世界观', '林远'],
    positionX: 100,
    positionY: 80,
    zIndex: 1,
    width: 240,
    height: 160,
    rotation: -2,
    createdAt: new Date('2026-05-10'),
    updatedAt: new Date('2026-06-15'),
  },
  {
    id: 'note-2',
    projectId: 'project-1',
    content: '苏婉的医疗包里有一瓶特殊的药物，是她父亲留给她的，这种药物的成分来自外星。',
    color: 'pink',
    tags: ['人物', '苏婉', '伏笔'],
    positionX: 400,
    positionY: 100,
    zIndex: 2,
    width: 260,
    height: 140,
    rotation: 1,
    createdAt: new Date('2026-05-12'),
    updatedAt: new Date('2026-06-14'),
  },
  {
    id: 'note-3',
    projectId: 'project-1',
    content: '陈舰长其实早就知道外星文明的存在，他的家人在一次外星接触事件中失踪。',
    color: 'blue',
    tags: ['人物', '陈舰长', '悬念'],
    positionX: 680,
    positionY: 80,
    zIndex: 3,
    width: 250,
    height: 150,
    rotation: -1,
    createdAt: new Date('2026-05-15'),
    updatedAt: new Date('2026-06-13'),
  },
  {
    id: 'note-4',
    projectId: 'project-1',
    content: '大副王磊的保守是有原因的——他的弟弟在一次深空探测任务中牺牲。',
    color: 'green',
    tags: ['人物', '王磊', '背景'],
    positionX: 150,
    positionY: 300,
    zIndex: 1,
    width: 240,
    height: 140,
    rotation: 2,
    createdAt: new Date('2026-05-20'),
    updatedAt: new Date('2026-06-10'),
  },
  {
    id: 'note-5',
    projectId: 'project-1',
    content: '第三章结尾可以加一个场景：林远触碰遗迹符文时，脑海中闪过一段陌生的记忆——五十万年前的画面。',
    color: 'orange',
    tags: ['情节', '第三章', '建议'],
    positionX: 450,
    positionY: 320,
    zIndex: 2,
    width: 280,
    height: 160,
    rotation: -3,
    createdAt: new Date('2026-05-25'),
    updatedAt: new Date('2026-06-12'),
  },
  {
    id: 'note-6',
    projectId: 'project-1',
    content: '神秘文明并非消失了，而是进化成了纯能量形态，他们一直在观察人类。',
    color: 'purple',
    tags: ['世界观', '设定', '核心'],
    positionX: 750,
    positionY: 300,
    zIndex: 1,
    width: 260,
    height: 150,
    rotation: 1,
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-15'),
  },
  {
    id: 'note-7',
    projectId: 'project-1',
    content: '可以在第四章引入一个新角色：神秘文明留下的AI守护者，以全息影像的形式出现。',
    color: 'yellow',
    tags: ['人物', '第四章', '新角色'],
    positionX: 300,
    positionY: 520,
    zIndex: 3,
    width: 250,
    height: 140,
    rotation: -1,
    createdAt: new Date('2026-06-05'),
    updatedAt: new Date('2026-06-14'),
  },
  {
    id: 'note-8',
    projectId: 'project-1',
    content: '小说结尾：人类选择不回归起源星球，而是继续向前探索，因为真正的家园是旅途本身。',
    color: 'pink',
    tags: ['结局', '主题', '核心'],
    positionX: 600,
    positionY: 540,
    zIndex: 2,
    width: 270,
    height: 150,
    rotation: 2,
    createdAt: new Date('2026-06-10'),
    updatedAt: new Date('2026-06-15'),
  },
];

const chapter1Content = `深夜，"星辰号"空间站的观测室里，林远正盯着全息屏幕上的星图。

三十二年了，从地球出发已经三十二年。

"舰长，"林远的声音平静，"前方三光时处探测到异常能量波动，频率...和起源信号高度相似。"

苏婉走进观测室，她的脚步很轻。这位生命科学主管总是这样，像猫一样安静。

"确定吗？"她问。

林远点头，手指在屏幕上滑动，调出一组复杂的波形图。"百分之九十七的匹配度。我们找了这么久的起源星球，可能就在那里。"

苏婉走到他身边，目光落在那些跳动的波形上。她的心跳有些加速，但脸上依然保持着科学家的冷静。

"通知舰长了吗？"

"正在通知。"

话音刚落，通讯器里传来舰长的声音："林远，苏婉，到指挥室来。"`;

const chapter1SuspenseContent = `深夜，"星辰号"空间站的观测室里，林远正盯着全息屏幕上的星图。

三十二年了，从地球出发已经三十二年。

空间站的环形走廊里，应急灯忽明忽暗，投下诡异的阴影。空气循环系统发出低沉的嗡鸣，像是某种巨大生物的呼吸。

"舰长，"林远的声音有些发紧，"前方三光时处探测到异常能量波动，频率...和起源信号高度相似。"

苏婉走进观测室，她的脚步很轻，但在这死寂的空间站里，每一步都像是踩在人的神经上。

"确定吗？"她的声音压得很低，仿佛害怕惊动什么。

林远点头，手指在屏幕上滑动，调出一组复杂的波形图。那些波形像脉搏一样跳动，带着一种诡异的生命力。

"百分之九十七的匹配度。我们找了这么久的起源星球，可能就在那里。"

苏婉走到他身边，目光落在那些跳动的波形上。她的心跳有些加速，手心渗出冷汗。

"你有没有觉得..."她咽了口唾沫，"这些波形...像是在看着我们？"

林远愣了一下，随即苦笑："你最近科幻小说看多了吧。"

话虽这么说，但当他再次看向屏幕时，那些波形确实像是有意识般地改变了频率。

"通知舰长了吗？"苏婉问。

"正在通知。"

话音刚落，通讯器里传来舰长的声音，但那声音...有些不对劲。

"林远...苏婉...到...指挥室...来..."

声音断断续续，夹杂着刺耳的杂音。不像是通讯干扰，倒像是...有人在模仿舰长的声音。

两人对视一眼，都从对方眼中看到了恐惧。`;

const chapter1SuWanContent = `我是苏婉，"星辰号"的生命科学主管。

深夜，我从休眠舱中醒来，心脏还在怦怦直跳。

又是那个梦。梦里有一颗蓝色的星球，有风吹过麦浪的声音，还有一个模糊的身影在向我招手。

我知道那是起源星球——我们这趟旅程的目的地。但为什么梦里的感觉如此熟悉？仿佛我曾经去过那里。

我走到观测室，想找林远说说话。他总是在深夜还待在那里，像个守夜人。

"林远，"我轻轻叫他的名字。

他转过身，脸上带着我熟悉的那种专注神情。"苏婉？你怎么醒了？"

"睡不着。"我走到他身边，看着全息屏幕上的星图，"又梦到起源星了。"

林远沉默了一下，然后说："我也是。最近越来越频繁了。"

我们对视了一眼，都没有继续说下去。有些事情，说出来就变味了。

"舰长呢？"我换了个话题。

"在他的舱室里吧。最近他的状态不太好。"林远的声音里有些担忧。

我点点头。舰长的状态，全船的人都看在眼里。三十二年的旅程，对任何人都是煎熬。

就在这时，林远的屏幕突然亮了起来，一组数据跳了出来。

他的表情立刻变了。

"怎么了？"我问。

"前方三光时处，"他的声音有些颤抖，"探测到异常能量波动，和起源信号的匹配度...百分之九十七。"

我感觉自己的呼吸停了一拍。

三十二年。我们找了三十二年的答案，终于要出现了吗？

"通知舰长吧。"我听到自己的声音在发抖。

林远点头，接通了通讯。

"舰长，我们有发现了。"`;

const chapter2Content = `指挥室里，舰长背对着他们，站在巨大的观景窗前。

窗外是无尽的星海。

"你们确定？"舰长的声音低沉。

"数据不会错。"林远说。

舰长转过身来。这位曾经意气风发的舰长，如今两鬓已经斑白。三十二年的时间，在他身上留下了深刻的痕迹。

"调整航线，"他说，"向着信号源前进。"

"可是舰长，"苏婉犹豫了一下，"我们的燃料储备..."

"我知道。"舰长打断她，"但这是我们唯一的机会。如果起源星球真的在那里，一切都是值得的。"

林远和苏婉对视一眼，都看到了对方眼中的坚定。

"明白。"

"星辰号"开始转向，向着未知的方向前进。

在他们看不见的黑暗中，有什么东西正在苏醒。`;

const chapter2MergedContent = `指挥室里，舰长背对着他们，站在巨大的观景窗前。

窗外是无尽的星海，冰冷而沉默。

"你们确定？"舰长的声音低沉，带着一丝不易察觉的颤抖。

"数据不会错。"林远说，他的声音也有些沙哑。

舰长转过身来。这位曾经意气风发的舰长，如今两鬓已经斑白。三十二年的时间，在他身上留下了深刻的痕迹。

他的眼睛里布满血丝，看起来已经很久没有好好休息了。

"调整航线，"他终于开口，"向着信号源前进。"

"可是舰长，"苏婉犹豫了一下，"我们的燃料储备...只够一次减速了。"

"我知道。"舰长打断她，语气不容置疑，"但这是我们唯一的机会。如果起源星球真的在那里，一切都是值得的。"

林远和苏婉对视一眼，都看到了对方眼中的坚定。三十二年的等待，不就是为了这一刻吗？

"明白。"

"星辰号"开始转向，庞大的船体在惯性中缓缓转动，像一头沉睡的巨兽终于苏醒。

向着未知的方向，向着传说中的起源，前进。

在他们看不见的黑暗深处，有什么东西...正在苏醒。`;

export const mockChapterBranches: ChapterBranch[] = [
  {
    id: 'branch-ch1-main',
    chapterId: 'chapter-1',
    name: '主线',
    description: '第一章主线剧情分支',
    isMain: true,
    status: 'active',
    creatorId: 'user-1',
    creator: mockUsers[0],
    currentContent: chapter1Content,
    wordCount: chapter1Content.replace(/\s/g, '').length,
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-06-15'),
    color: '#d4af37',
  },
  {
    id: 'branch-ch1-suspense',
    chapterId: 'chapter-1',
    name: '悬疑氛围强化',
    description: '尝试在第一章加入更多悬疑和惊悚元素，探索不同的叙事风格',
    parentBranchId: 'branch-ch1-main',
    isMain: false,
    status: 'active',
    creatorId: 'user-2',
    creator: mockUsers[1],
    currentContent: chapter1SuspenseContent,
    wordCount: chapter1SuspenseContent.replace(/\s/g, '').length,
    createdAt: new Date('2026-06-05'),
    updatedAt: new Date('2026-06-18'),
    color: '#7c3aed',
  },
  {
    id: 'branch-ch1-suwan-pov',
    chapterId: 'chapter-1',
    name: '苏婉视角',
    description: '以苏婉为第一人称重新叙述第一章，探索不同视角的叙事效果',
    parentBranchId: 'branch-ch1-main',
    isMain: false,
    status: 'active',
    creatorId: 'user-3',
    creator: mockUsers[2],
    currentContent: chapter1SuWanContent,
    wordCount: chapter1SuWanContent.replace(/\s/g, '').length,
    createdAt: new Date('2026-06-10'),
    updatedAt: new Date('2026-06-19'),
    color: '#059669',
  },
  {
    id: 'branch-ch2-main',
    chapterId: 'chapter-2',
    name: '主线',
    description: '第二章主线剧情分支',
    isMain: true,
    status: 'active',
    creatorId: 'user-1',
    creator: mockUsers[0],
    currentContent: chapter2Content,
    wordCount: chapter2Content.replace(/\s/g, '').length,
    createdAt: new Date('2026-05-03'),
    updatedAt: new Date('2026-06-10'),
    color: '#d4af37',
  },
  {
    id: 'branch-ch2-tone-exp',
    chapterId: 'chapter-2',
    name: '氛围深化实验',
    description: '已合并的实验分支，用于深化第二章的沉重氛围',
    parentBranchId: 'branch-ch2-main',
    isMain: false,
    status: 'merged',
    creatorId: 'user-2',
    creator: mockUsers[1],
    currentContent: chapter2MergedContent,
    wordCount: chapter2MergedContent.replace(/\s/g, '').length,
    createdAt: new Date('2026-05-20'),
    updatedAt: new Date('2026-06-08'),
    mergedAt: new Date('2026-06-08'),
    color: '#2563eb',
  },
];

export const mockBranchVersions: BranchVersion[] = [
  {
    id: 'bv-1',
    branchId: 'branch-ch1-main',
    content: chapter1Content,
    authorId: 'user-1',
    author: mockUsers[0],
    changeSummary: '创建初始版本',
    createdAt: new Date('2026-05-01'),
    wordCount: chapter1Content.replace(/\s/g, '').length,
  },
  {
    id: 'bv-2',
    branchId: 'branch-ch1-main',
    content: chapter1Content,
    authorId: 'user-1',
    author: mockUsers[0],
    changeSummary: '优化对话节奏',
    createdAt: new Date('2026-05-15'),
    wordCount: chapter1Content.replace(/\s/g, '').length,
  },
  {
    id: 'bv-3',
    branchId: 'branch-ch1-main',
    content: chapter1Content,
    authorId: 'user-1',
    author: mockUsers[0],
    changeSummary: '完善结尾悬念',
    createdAt: new Date('2026-06-15'),
    wordCount: chapter1Content.replace(/\s/g, '').length,
  },
  {
    id: 'bv-4',
    branchId: 'branch-ch1-suspense',
    content: chapter1SuspenseContent,
    authorId: 'user-2',
    author: mockUsers[1],
    changeSummary: '创建悬疑版第一章',
    createdAt: new Date('2026-06-05'),
    wordCount: chapter1SuspenseContent.replace(/\s/g, '').length,
  },
  {
    id: 'bv-5',
    branchId: 'branch-ch1-suspense',
    content: chapter1SuspenseContent,
    authorId: 'user-2',
    author: mockUsers[1],
    changeSummary: '增强结尾恐怖氛围',
    createdAt: new Date('2026-06-18'),
    wordCount: chapter1SuspenseContent.replace(/\s/g, '').length,
  },
  {
    id: 'bv-6',
    branchId: 'branch-ch1-suwan-pov',
    content: chapter1SuWanContent,
    authorId: 'user-3',
    author: mockUsers[2],
    changeSummary: '苏婉视角初稿',
    createdAt: new Date('2026-06-10'),
    wordCount: chapter1SuWanContent.replace(/\s/g, '').length,
  },
  {
    id: 'bv-7',
    branchId: 'branch-ch1-suwan-pov',
    content: chapter1SuWanContent,
    authorId: 'user-3',
    author: mockUsers[2],
    changeSummary: '完善内心独白',
    createdAt: new Date('2026-06-19'),
    wordCount: chapter1SuWanContent.replace(/\s/g, '').length,
  },
  {
    id: 'bv-8',
    branchId: 'branch-ch2-main',
    content: chapter2Content,
    authorId: 'user-1',
    author: mockUsers[0],
    changeSummary: '创建初始版本',
    createdAt: new Date('2026-05-03'),
    wordCount: chapter2Content.replace(/\s/g, '').length,
  },
  {
    id: 'bv-9',
    branchId: 'branch-ch2-main',
    content: chapter2MergedContent,
    authorId: 'user-1',
    author: mockUsers[0],
    changeSummary: '合并氛围深化实验分支',
    createdAt: new Date('2026-06-08'),
    wordCount: chapter2MergedContent.replace(/\s/g, '').length,
  },
  {
    id: 'bv-10',
    branchId: 'branch-ch2-tone-exp',
    content: chapter2MergedContent,
    authorId: 'user-2',
    author: mockUsers[1],
    changeSummary: '深化氛围实验完成',
    createdAt: new Date('2026-06-07'),
    wordCount: chapter2MergedContent.replace(/\s/g, '').length,
  },
];

export const mockCustomRules: CustomRule[] = [
  {
    id: 'rule-1',
    projectId: 'project-1',
    name: '禁止出现网络用语',
    description: '小说正文中不应出现现代网络用语，保持文风统一',
    severity: 'warning',
    category: 'custom_rule',
    conditions: [
      { id: 'cond-1', type: 'keyword_present', value: 'yyds', description: 'yyds' },
      { id: 'cond-2', type: 'keyword_present', value: '绝绝子', description: '绝绝子' },
      { id: 'cond-3', type: 'keyword_present', value: 'emo', description: 'emo' },
    ],
    conditionOperator: 'or',
    action: 'warn',
    customMessage: '检测到现代网络用语，可能影响小说的年代感和沉浸感。',
    suggestions: [
      {
        id: 'sug-rule-1',
        title: '替换为符合文风的表达',
        description: '将网络用语替换为更符合小说背景的传统表述。',
        type: 'replace_text',
        autoApplicable: true,
      },
    ],
    isEnabled: true,
    isBuiltIn: false,
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
    createdBy: 'user-1',
  },
  {
    id: 'rule-2',
    projectId: 'project-1',
    name: '对话引号规范',
    description: '确保对话使用中文引号「」而非英文引号""',
    severity: 'info',
    category: 'custom_rule',
    conditions: [
      { id: 'cond-4', type: 'regex_match', value: '"[^"]*"', description: '英文双引号' },
    ],
    conditionOperator: 'or',
    action: 'suggest_fix',
    customMessage: '检测到对话中使用了英文双引号，建议使用中文引号「」。',
    suggestions: [
      {
        id: 'sug-rule-2',
        title: '替换为中文引号',
        description: '将英文双引号替换为中文直角引号「」。',
        type: 'replace_text',
        autoApplicable: true,
      },
    ],
    isEnabled: true,
    isBuiltIn: false,
    createdAt: new Date('2026-05-10'),
    updatedAt: new Date('2026-05-10'),
    createdBy: 'user-1',
  },
  {
    id: 'rule-3',
    projectId: 'project-1',
    name: '主角名字一致性',
    description: '检测主角"林远"的名字是否被误写',
    severity: 'error',
    category: 'character_trait',
    conditions: [
      { id: 'cond-5', type: 'keyword_present', value: '林苑', description: '林苑（错误写法）' },
      { id: 'cond-6', type: 'keyword_present', value: '林源', description: '林源（错误写法）' },
    ],
    conditionOperator: 'or',
    action: 'error',
    customMessage: '检测到主角"林远"的名字可能被误写。',
    suggestions: [
      {
        id: 'sug-rule-3',
        title: '更正为主角正确姓名',
        description: '将名字替换为"林远"。',
        type: 'replace_text',
        autoApplicable: true,
        suggestedText: '林远',
      },
    ],
    isEnabled: true,
    isBuiltIn: true,
    createdAt: new Date('2026-04-20'),
    updatedAt: new Date('2026-04-20'),
    createdBy: 'system',
  },
];

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'tl-1',
    projectId: 'project-1',
    chapterId: 'chapter-1',
    eventName: '星辰号启航',
    timeDescription: '公元2157年',
    year: 2157,
    orderInStory: 1,
    relatedCharacterIds: ['char-1', 'char-2', 'char-3'],
    location: '地球轨道联合太空站',
    description: '星辰号搭载十万名殖民者，从地球轨道联合太空站启航，前往天琴座方向。',
    createdAt: new Date('2025-06-10'),
  },
  {
    id: 'tl-2',
    projectId: 'project-1',
    chapterId: 'chapter-2',
    eventName: '发现异常信号',
    timeDescription: '航行第三年 / 公元2160年',
    year: 2160,
    orderInStory: 2,
    relatedCharacterIds: ['char-1', 'char-2'],
    description: '林远在例行深空扫描中发现规律的人工脉冲信号。',
    createdAt: new Date('2025-07-15'),
  },
  {
    id: 'tl-3',
    projectId: 'project-1',
    chapterId: 'chapter-3',
    eventName: '发现外星遗迹',
    timeDescription: '航行第五年 / 公元2162年',
    year: 2162,
    orderInStory: 3,
    relatedCharacterIds: ['char-1', 'char-2', 'char-3', 'char-4'],
    description: '在信号源附近发现五十万年前的外星巨型遗迹。',
    createdAt: new Date('2025-08-20'),
  },
];

export const mockGeographyLocations: GeographyLocation[] = [
  {
    id: 'loc-1',
    projectId: 'project-1',
    name: '地球',
    aliases: ['故乡', '母星', '蓝色星球'],
    description: '人类的起源星球，位于太阳系第三轨道。',
    relatedChapterIds: ['chapter-1'],
    createdAt: new Date('2025-06-01'),
  },
  {
    id: 'loc-2',
    projectId: 'project-1',
    name: '联合太空站',
    aliases: ['三号船坞', '地球轨道太空站'],
    description: '环绕地球轨道的巨型空间站，星辰号从这里启航。',
    parentLocationId: 'loc-1',
    relatedChapterIds: ['chapter-1'],
    createdAt: new Date('2025-06-01'),
  },
  {
    id: 'loc-3',
    projectId: 'project-1',
    name: '星辰号',
    aliases: ['殖民舰', '巨舰'],
    description: '长达三公里的星际殖民舰，承载人类文明延续的希望。',
    relatedChapterIds: ['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4'],
    createdAt: new Date('2025-06-01'),
  },
  {
    id: 'loc-4',
    projectId: 'project-1',
    name: '外星遗迹',
    aliases: ['神秘遗迹', '五十万年前的建筑'],
    description: '悬浮在虚空中的巨型金属结构，直径超过一百公里。',
    relatedChapterIds: ['chapter-3', 'chapter-4'],
    createdAt: new Date('2025-08-20'),
  },
  {
    id: 'loc-5',
    projectId: 'project-1',
    name: '天琴座星域',
    aliases: [],
    description: '距离地球约12光年的星域，神秘信号的来源方向。',
    relatedChapterIds: ['chapter-2', 'chapter-3'],
    createdAt: new Date('2025-07-15'),
  },
];
