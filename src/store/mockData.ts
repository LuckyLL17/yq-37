import type {
  User,
  Project,
  ProjectMember,
  Chapter,
  ChapterVersion,
  Character,
  PlotPoint,
  ConflictWarning,
  StructureTemplate,
  BeatCard,
  ChapterOutline,
  NarrativeStructureType,
} from '@shared/types';

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
    members: [mockMembers[1], mockMembers[0]],
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
        target: {} as any,
        type: '恋人',
        description: '与苏婉是恋人关系，在航行中相互扶持',
      },
      {
        id: 'rel-2',
        characterId: 'char-1',
        targetId: 'char-3',
        target: {} as any,
        type: '上下级',
        description: '舰长对林远十分信任，常采纳他的建议',
      },
    ],
    appearances: [
      {
        id: 'app-1',
        characterId: 'char-1',
        chapterId: 'chapter-1',
        chapter: mockChapters[0],
        context: '第一章主角出场',
        createdAt: new Date('2025-06-10'),
      },
      {
        id: 'app-2',
        characterId: 'char-1',
        chapterId: 'chapter-2',
        chapter: mockChapters[1],
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
        target: {} as any,
        type: '恋人',
        description: '与林远是恋人关系',
      },
    ],
    appearances: [
      {
        id: 'app-3',
        characterId: 'char-2',
        chapterId: 'chapter-1',
        chapter: mockChapters[0],
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
        chapter: mockChapters[1],
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
        chapter: mockChapters[1],
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

mockCharacters[0].relationships[0].target = mockCharacters[1];
mockCharacters[0].relationships[1].target = mockCharacters[2];
mockCharacters[1].relationships[0].target = mockCharacters[0];

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
        chapter: mockChapters[0],
        hintText: '林远望着星空，"总觉得有什么东西在那里，在等待着我们"',
        locationDescription: '第一章中段，林远与苏婉对话时的心理活动',
        createdAt: new Date('2025-06-10'),
      },
      {
        id: 'hint-2',
        plotPointId: 'plot-1',
        chapterId: 'chapter-2',
        chapter: mockChapters[1],
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
        chapter: mockChapters[2],
        hintText: '林远认出遗迹符文与西藏古格壁画相似',
        locationDescription: '第三章中段，发现遗迹符文时',
        createdAt: new Date('2025-08-20'),
      },
      {
        id: 'hint-4',
        plotPointId: 'plot-2',
        chapterId: 'chapter-3',
        chapter: mockChapters[2],
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
    message: '本章中陈舰长主持了紧急会议。人物设定中提到陈舰长"外表严厉，内心关心船员"，当前描写符合设定。',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    resolved: true,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60),
  },
];

export const currentUser: User = mockUsers[0];

export const structureTemplates: StructureTemplate[] = [
  {
    type: 'three-act',
    name: '三幕式结构',
    description: '经典的开端-发展-结局结构，适用于大多数故事类型',
    acts: [
      {
        key: 'act1',
        name: '第一幕：铺垫',
        description: '建立世界观、人物关系和核心冲突',
        beats: [
          {
            key: 'opening',
            name: '开篇场景',
            description: '展示主角的日常生活和初始状态',
            suggestedGoal: '展示主角的日常世界和内在渴望',
            suggestedConflict: '暗示潜在的不平衡或问题',
            suggestedTurningPoint: '一个打破日常的小事件',
            defaultEmotion: [{ position: 0, intensity: 0.3 }, { position: 1, intensity: 0.4 }],
            color: '#627d98',
          },
          {
            key: 'inciting-incident',
            name: '激励事件',
            description: '打破主角平衡生活的关键事件',
            suggestedGoal: '引入改变一切的核心事件',
            suggestedConflict: '主角被迫面对问题',
            suggestedTurningPoint: '主角意识到必须采取行动',
            defaultEmotion: [{ position: 0, intensity: 0.4 }, { position: 1, intensity: 0.6 }],
            color: '#486581',
          },
          {
            key: 'plot-point-1',
            name: '第一转折点',
            description: '主角做出关键决定，故事正式进入第二幕',
            suggestedGoal: '主角跨过不可回头的门槛',
            suggestedConflict: '内心挣扎与外部阻力',
            suggestedTurningPoint: '主角正式踏上冒险',
            defaultEmotion: [{ position: 0, intensity: 0.6 }, { position: 1, intensity: 0.7 }],
            color: '#334e68',
          },
        ],
      },
      {
        key: 'act2',
        name: '第二幕：对抗',
        description: '主角面对重重挑战，逐渐成长',
        beats: [
          {
            key: 'rising-action',
            name: '上升动作',
            description: '一系列逐步升级的挑战和障碍',
            suggestedGoal: '主角学习新技能，结识盟友',
            suggestedConflict: '遭遇挫折和失败',
            suggestedTurningPoint: '获得重要线索或能力',
            defaultEmotion: [{ position: 0, intensity: 0.5 }, { position: 0.5, intensity: 0.7 }, { position: 1, intensity: 0.6 }],
            color: '#829ab1',
          },
          {
            key: 'midpoint',
            name: '中点',
            description: '故事的重大转折，主角或局势发生根本性变化',
            suggestedGoal: '揭示重要真相或假胜利/假失败',
            suggestedConflict: '真相带来的震撼和冲击',
            suggestedTurningPoint: '主角从被动应对转为主动出击',
            defaultEmotion: [{ position: 0, intensity: 0.6 }, { position: 1, intensity: 0.8 }],
            color: '#d4af37',
          },
          {
            key: 'dark-night',
            name: '至暗时刻',
            description: '主角遭受最大的挫折，看似一切都已失去',
            suggestedGoal: '主角陷入最低谷',
            suggestedConflict: '信心崩溃、盟友背离、希望渺茫',
            suggestedTurningPoint: '从绝望中找到新的力量',
            defaultEmotion: [{ position: 0, intensity: 0.8 }, { position: 0.5, intensity: 0.1 }, { position: 1, intensity: 0.4 }],
            color: '#1e3a5f',
          },
        ],
      },
      {
        key: 'act3',
        name: '第三幕：结局',
        description: '高潮与收尾，解决所有冲突',
        beats: [
          {
            key: 'climax',
            name: '高潮',
            description: '主角与反派或核心矛盾的最终对决',
            suggestedGoal: '最终决战，胜负在此一举',
            suggestedConflict: '最激烈的对抗，生死攸关',
            suggestedTurningPoint: '主角展现最终蜕变，取得胜利',
            defaultEmotion: [{ position: 0, intensity: 0.6 }, { position: 0.5, intensity: 1.0 }, { position: 1, intensity: 0.8 }],
            color: '#c0392b',
          },
          {
            key: 'resolution',
            name: '结局',
            description: '展示新世界的状态和主角的最终变化',
            suggestedGoal: '交代各条线索的收尾',
            suggestedConflict: '余波和内心的最终选择',
            suggestedTurningPoint: '故事的最后画面或余韵',
            defaultEmotion: [{ position: 0, intensity: 0.7 }, { position: 1, intensity: 0.5 }],
            color: '#9a7b25',
          },
        ],
      },
    ],
  },
  {
    type: 'hero-journey',
    name: '英雄之旅',
    description: '约瑟夫·坎贝尔的经典十二阶段叙事模型',
    acts: [
      {
        key: 'departure',
        name: '启程',
        description: '英雄离开平凡世界',
        beats: [
          {
            key: 'ordinary-world',
            name: '平凡世界',
            description: '英雄的日常生活',
            suggestedGoal: '展示英雄在正常世界中的状态',
            suggestedConflict: '暗示英雄内心的不满足',
            suggestedTurningPoint: '对现状的隐约不安',
            defaultEmotion: [{ position: 0, intensity: 0.3 }, { position: 1, intensity: 0.35 }],
            color: '#627d98',
          },
          {
            key: 'call-to-adventure',
            name: '冒险召唤',
            description: '挑战出现在英雄面前',
            suggestedGoal: '外部事件打破平衡',
            suggestedConflict: '英雄第一次面对未知',
            suggestedTurningPoint: '命运的敲门声',
            defaultEmotion: [{ position: 0, intensity: 0.35 }, { position: 1, intensity: 0.55 }],
            color: '#486581',
          },
          {
            key: 'refusal-of-call',
            name: '拒绝召唤',
            description: '英雄因恐惧或责任而犹豫',
            suggestedGoal: '展示英雄的软弱和恐惧',
            suggestedConflict: '内心的恐惧与外部压力',
            suggestedTurningPoint: '迫使英雄面对恐惧的事件',
            defaultEmotion: [{ position: 0, intensity: 0.55 }, { position: 1, intensity: 0.4 }],
            color: '#829ab1',
          },
          {
            key: 'meeting-mentor',
            name: '遇见导师',
            description: '英雄获得指引和帮助',
            suggestedGoal: '引入智慧角色，给予英雄工具',
            suggestedConflict: '英雄需要建立信任',
            suggestedTurningPoint: '导师赠予关键物品或智慧',
            defaultEmotion: [{ position: 0, intensity: 0.4 }, { position: 1, intensity: 0.6 }],
            color: '#9a7b25',
          },
          {
            key: 'crossing-threshold',
            name: '跨越门槛',
            description: '英雄正式踏上冒险',
            suggestedGoal: '英雄进入特殊世界',
            suggestedConflict: '第一道考验',
            suggestedTurningPoint: '不可回头的决定',
            defaultEmotion: [{ position: 0, intensity: 0.6 }, { position: 1, intensity: 0.75 }],
            color: '#334e68',
          },
        ],
      },
      {
        key: 'initiation',
        name: '启蒙',
        description: '英雄在特殊世界中的考验和成长',
        beats: [
          {
            key: 'tests-allies-enemies',
            name: '考验、盟友、敌人',
            description: '英雄面临一系列挑战',
            suggestedGoal: '学习特殊世界的规则',
            suggestedConflict: '结交朋友，遭遇敌人',
            suggestedTurningPoint: '建立核心团队',
            defaultEmotion: [{ position: 0, intensity: 0.6 }, { position: 0.5, intensity: 0.7 }, { position: 1, intensity: 0.65 }],
            color: '#b8942d',
          },
          {
            key: 'approach',
            name: '接近洞穴深处',
            description: '英雄准备面对最大的恐惧',
            suggestedGoal: '逼近核心冲突',
            suggestedConflict: '团队内部的分歧和紧张',
            suggestedTurningPoint: '发现真正的威胁',
            defaultEmotion: [{ position: 0, intensity: 0.65 }, { position: 1, intensity: 0.8 }],
            color: '#c0392b',
          },
          {
            key: 'ordeal',
            name: '考验/死亡与重生',
            description: '英雄面对死亡，经历蜕变',
            suggestedGoal: '英雄在危机中浴火重生',
            suggestedConflict: '直面最大的恐惧或死亡',
            suggestedTurningPoint: '奇迹般的逆转或觉醒',
            defaultEmotion: [{ position: 0, intensity: 0.8 }, { position: 0.5, intensity: 0.1 }, { position: 1, intensity: 0.7 }],
            color: '#1e3a5f',
          },
          {
            key: 'reward',
            name: '获得嘉奖',
            description: '英雄获得追求的宝藏或知识',
            suggestedGoal: '胜利的果实，但危机仍未解除',
            suggestedConflict: '奖励的代价或隐藏的危险',
            suggestedTurningPoint: '发现宝藏的真正意义',
            defaultEmotion: [{ position: 0, intensity: 0.7 }, { position: 1, intensity: 0.85 }],
            color: '#d4af37',
          },
        ],
      },
      {
        key: 'return',
        name: '归来',
        description: '英雄带着礼物回到平凡世界',
        beats: [
          {
            key: 'road-back',
            name: '归途',
            description: '英雄踏上归途，面对最后的挑战',
            suggestedGoal: '带着奖励返回平凡世界',
            suggestedConflict: '敌人的最后反扑',
            suggestedTurningPoint: '选择是否归来',
            defaultEmotion: [{ position: 0, intensity: 0.85 }, { position: 1, intensity: 0.6 }],
            color: '#486581',
          },
          {
            key: 'resurrection',
            name: '复活',
            description: '英雄经历最终的考验和蜕变',
            suggestedGoal: '最后一次与死亡擦肩而过',
            suggestedConflict: '终极对决，英雄的最终证明',
            suggestedTurningPoint: '英雄彻底蜕变，获得新生',
            defaultEmotion: [{ position: 0, intensity: 0.5 }, { position: 0.5, intensity: 1.0 }, { position: 1, intensity: 0.9 }],
            color: '#e8c459',
          },
          {
            key: 'return-with-elixir',
            name: '带着灵丹归来',
            description: '英雄完成使命，带回改变世界的礼物',
            suggestedGoal: '故事的最终收尾',
            suggestedConflict: '英雄在新世界中的位置',
            suggestedTurningPoint: '英雄与世界都获得新生',
            defaultEmotion: [{ position: 0, intensity: 0.9 }, { position: 1, intensity: 0.7 }],
            color: '#f6db7d',
          },
        ],
      },
    ],
  },
  {
    type: 'freytag',
    name: '弗赖塔格金字塔',
    description: '德国剧作家古斯塔夫·弗赖塔格的五幕悲剧结构',
    acts: [
      {
        key: 'exposition',
        name: '展示',
        description: '背景、人物和初始状态的介绍',
        beats: [
          {
            key: 'introduction',
            name: '背景介绍',
            description: '交代故事背景和主要人物',
            suggestedGoal: '让读者理解故事发生的世界',
            suggestedConflict: '展示潜在的矛盾种子',
            suggestedTurningPoint: '暗示即将发生的变化',
            defaultEmotion: [{ position: 0, intensity: 0.2 }, { position: 1, intensity: 0.3 }],
            color: '#627d98',
          },
        ],
      },
      {
        key: 'rising-action',
        name: '上升动作',
        description: '冲突逐步升级',
        beats: [
          {
            key: 'complication',
            name: '复杂化',
            description: '事件开始变得复杂',
            suggestedGoal: '引入冲突和障碍',
            suggestedConflict: '主角面临第一个真正的挑战',
            suggestedTurningPoint: '问题的规模超出预期',
            defaultEmotion: [{ position: 0, intensity: 0.3 }, { position: 1, intensity: 0.5 }],
            color: '#486581',
          },
        ],
      },
      {
        key: 'climax',
        name: '高潮',
        description: '故事的最高点，命运的转折点',
        beats: [
          {
            key: 'turning-point',
            name: '命运转折点',
            description: '无法逆转的关键事件',
            suggestedGoal: '冲突达到顶峰',
            suggestedConflict: '主角做出无法撤回的决定',
            suggestedTurningPoint: '命运的天平彻底倾斜',
            defaultEmotion: [{ position: 0, intensity: 0.5 }, { position: 0.5, intensity: 1.0 }, { position: 1, intensity: 0.7 }],
            color: '#c0392b',
          },
        ],
      },
      {
        key: 'falling-action',
        name: '下降动作',
        description: '高潮之后的连锁反应',
        beats: [
          {
            key: 'reversal',
            name: '逆转',
            description: '事件开始走向不可避免的结局',
            suggestedGoal: '展示高潮带来的后果',
            suggestedConflict: '主角试图挽回却无力回天',
            suggestedTurningPoint: '最后一丝希望破灭',
            defaultEmotion: [{ position: 0, intensity: 0.7 }, { position: 1, intensity: 0.4 }],
            color: '#1e3a5f',
          },
        ],
      },
      {
        key: 'denouement',
        name: '结局/解开',
        description: '所有谜团揭晓，故事收尾',
        beats: [
          {
            key: 'resolution-final',
            name: '最终结局',
            description: '展示最终结果和人物命运',
            suggestedGoal: '完成故事的情感弧线',
            suggestedConflict: '最后的心理抉择或和解',
            suggestedTurningPoint: '定格的最后画面',
            defaultEmotion: [{ position: 0, intensity: 0.4 }, { position: 1, intensity: 0.5 }],
            color: '#9a7b25',
          },
        ],
      },
    ],
  },
  {
    type: 'save-the-cat',
    name: '救猫咪节拍表',
    description: '布莱克·斯奈德的商业电影剧本结构',
    acts: [
      {
        key: 'act1-stc',
        name: '第一幕 (1-25%)',
        description: '铺垫与世界观建立',
        beats: [
          {
            key: 'opening-image-stc',
            name: '开篇画面',
            description: '故事的第一个镜头，暗示主题',
            suggestedGoal: '通过视觉或场景暗示故事核心',
            suggestedConflict: '展示主角的初始缺陷',
            suggestedTurningPoint: '暗示变化即将到来',
            defaultEmotion: [{ position: 0, intensity: 0.2 }, { position: 1, intensity: 0.3 }],
            color: '#627d98',
          },
          {
            key: 'theme-stated',
            name: '主题呈现',
            description: '通过对话或事件暗示故事主题',
            suggestedGoal: '让观众隐约感知故事要讲什么',
            suggestedConflict: '主题以反讽或质疑的方式出现',
            suggestedTurningPoint: '某人说出主角后来才理解的话',
            defaultEmotion: [{ position: 0, intensity: 0.3 }, { position: 1, intensity: 0.35 }],
            color: '#829ab1',
          },
          {
            key: 'setup-stc',
            name: '铺垫',
            description: '介绍主角世界的所有元素',
            suggestedGoal: '建立主角的日常和需求',
            suggestedConflict: '展示主角生活中的所有缺失',
            suggestedTurningPoint: '主角的缺陷显而易见',
            defaultEmotion: [{ position: 0, intensity: 0.3 }, { position: 1, intensity: 0.4 }],
            color: '#486581',
          },
          {
            key: 'catalyst',
            name: '催化剂',
            description: '彻底改变主角生活的事件',
            suggestedGoal: '故事真正开始的时刻',
            suggestedConflict: '旧世界再也回不去了',
            suggestedTurningPoint: '主角的选择将改变一切',
            defaultEmotion: [{ position: 0, intensity: 0.4 }, { position: 1, intensity: 0.6 }],
            color: '#d4af37',
          },
          {
            key: 'debate',
            name: '辩论',
            description: '主角的犹豫和内心挣扎',
            suggestedGoal: '主角对是否前行的最后犹豫',
            suggestedConflict: '恐惧与渴望的激烈交锋',
            suggestedTurningPoint: '做出冒险的决定',
            defaultEmotion: [{ position: 0, intensity: 0.5 }, { position: 1, intensity: 0.65 }],
            color: '#334e68',
          },
          {
            key: 'break-into-two',
            name: '进入第二幕',
            description: '主角跨过门槛，进入新世界',
            suggestedGoal: '正式进入特殊世界',
            suggestedConflict: '新世界的规则完全不同',
            suggestedTurningPoint: '主角的第一个主动选择',
            defaultEmotion: [{ position: 0, intensity: 0.65 }, { position: 1, intensity: 0.7 }],
            color: '#1e3a5f',
          },
        ],
      },
      {
        key: 'act2-stc',
        name: '第二幕 (25-75%)',
        description: '对抗与成长',
        beats: [
          {
            key: 'b-story',
            name: 'B故事',
            description: '次要情节，通常是爱情或友情线',
            suggestedGoal: '引入帮助主角成长的角色',
            suggestedConflict: 'B故事与A故事开始交织',
            suggestedTurningPoint: 'B故事提供关键线索',
            defaultEmotion: [{ position: 0, intensity: 0.6 }, { position: 1, intensity: 0.65 }],
            color: '#b8942d',
          },
          {
            key: 'fun-and-games',
            name: '趣味与游戏',
            description: '兑现预告片的承诺，展现类型片核心乐趣',
            suggestedGoal: '展示类型片的标志性场景',
            suggestedConflict: '主角在新世界中的探索',
            suggestedTurningPoint: '看似顺利实则暗藏危机',
            defaultEmotion: [{ position: 0, intensity: 0.65 }, { position: 0.5, intensity: 0.8 }, { position: 1, intensity: 0.7 }],
            color: '#e8c459',
          },
          {
            key: 'midpoint-stc',
            name: '中点',
            description: '假胜利或假失败，故事重心转移',
            suggestedGoal: '提高赌注或揭示真相',
            suggestedConflict: '胜利带来更大的问题',
            suggestedTurningPoint: '主角从被动变主动',
            defaultEmotion: [{ position: 0, intensity: 0.7 }, { position: 1, intensity: 0.85 }],
            color: '#f6db7d',
          },
          {
            key: 'bad-guys-close-in',
            name: '坏人逼近',
            description: '反派开始反击，内外压力上升',
            suggestedGoal: '主角的团队和计划开始瓦解',
            suggestedConflict: '内部矛盾与外部威胁',
            suggestedTurningPoint: '团队出现裂痕',
            defaultEmotion: [{ position: 0, intensity: 0.7 }, { position: 1, intensity: 0.5 }],
            color: '#c0392b',
          },
          {
            key: 'all-is-lost',
            name: '一切尽失',
            description: '主角达到最低点，看似彻底失败',
            suggestedGoal: '虚假的死亡或彻底的失败',
            suggestedConflict: '所有的努力都付诸东流',
            suggestedTurningPoint: '导师死亡或象征死亡的事件',
            defaultEmotion: [{ position: 0, intensity: 0.5 }, { position: 1, intensity: 0.1 }],
            color: '#102a43',
          },
          {
            key: 'dark-night-of-soul',
            name: '灵魂黑夜',
            description: '主角沉浸在绝望中，反思一切',
            suggestedGoal: '主角在黑暗中寻找意义',
            suggestedConflict: '彻底的自我怀疑',
            suggestedTurningPoint: '顿悟，理解主题的真正含义',
            defaultEmotion: [{ position: 0, intensity: 0.1 }, { position: 0.5, intensity: 0.05 }, { position: 1, intensity: 0.3 }],
            color: '#0a1929',
          },
        ],
      },
      {
        key: 'act3-stc',
        name: '第三幕 (75-100%)',
        description: '高潮与结局',
        beats: [
          {
            key: 'break-into-three',
            name: '进入第三幕',
            description: '主角顿悟后找到新的解决方案',
            suggestedGoal: '主角带着新的理解行动',
            suggestedConflict: 'B故事的经验解决A故事',
            suggestedTurningPoint: '找到看似不可能的突破口',
            defaultEmotion: [{ position: 0, intensity: 0.3 }, { position: 1, intensity: 0.6 }],
            color: '#486581',
          },
          {
            key: 'finale',
            name: '终局',
            description: '最终对决和问题的解决',
            suggestedGoal: '主角用新获得的力量解决所有问题',
            suggestedConflict: '与反派的最终决战',
            suggestedTurningPoint: '主角彻底蜕变，击败敌人',
            defaultEmotion: [{ position: 0, intensity: 0.6 }, { position: 0.5, intensity: 1.0 }, { position: 1, intensity: 0.9 }],
            color: '#d4af37',
          },
          {
            key: 'final-image',
            name: '终画面',
            description: '与开篇画面形成对比的结尾镜头',
            suggestedGoal: '展示主角和世界的变化',
            suggestedConflict: '展示主题如何被证明',
            suggestedTurningPoint: '与开篇形成呼应，体现成长',
            defaultEmotion: [{ position: 0, intensity: 0.8 }, { position: 1, intensity: 0.6 }],
            color: '#9a7b25',
          },
        ],
      },
    ],
  },
];

export const mockBeats: BeatCard[] = [
  {
    id: 'beat-1-1',
    chapterId: 'chapter-1',
    structureType: 'three-act' as NarrativeStructureType,
    act: 'act1',
    beatKey: 'opening',
    title: '太空港的清晨',
    description: '林远在"星辰号"的观景窗前，望着即将离开的地球',
    goal: '展示林远的身份、内心的矛盾和对地球的眷恋',
    conflict: '作为天文官，他渴望探索宇宙，但也深知这一去便是永别',
    turningPoint: '苏婉的出现打破了他的沉思',
    emotionCurve: [{ position: 0, intensity: 0.3 }, { position: 0.5, intensity: 0.5 }, { position: 1, intensity: 0.4 }],
    order: 1,
    color: '#627d98',
    relatedCharacterIds: ['char-1'],
    relatedPlotPointIds: [],
    estimatedWords: 200,
    createdAt: new Date('2025-06-10'),
    updatedAt: new Date('2026-06-12'),
  },
  {
    id: 'beat-1-2',
    chapterId: 'chapter-1',
    structureType: 'three-act' as NarrativeStructureType,
    act: 'act1',
    beatKey: 'rising-action',
    title: '历史的重量',
    description: '苏婉与林远的对话，关于使命与离别',
    goal: '通过对话展现两位主角的性格和关系',
    conflict: '林远的消极与苏婉的积极形成对比',
    turningPoint: '苏婉的话让林远重新审视这次旅程的意义',
    emotionCurve: [{ position: 0, intensity: 0.4 }, { position: 0.5, intensity: 0.6 }, { position: 1, intensity: 0.7 }],
    order: 2,
    color: '#829ab1',
    relatedCharacterIds: ['char-1', 'char-2'],
    relatedPlotPointIds: [],
    estimatedWords: 250,
    createdAt: new Date('2025-06-10'),
    updatedAt: new Date('2026-06-12'),
  },
  {
    id: 'beat-1-3',
    chapterId: 'chapter-1',
    structureType: 'three-act' as NarrativeStructureType,
    act: 'act1',
    beatKey: 'plot-point-1',
    title: '启航',
    description: '倒计时结束，"星辰号"正式启航',
    goal: '完成第一幕的关键转折点，主角正式踏上旅程',
    conflict: '全舰的紧张气氛与个人情感的碰撞',
    turningPoint: '林远握住苏婉的手，决定勇敢面对未来',
    emotionCurve: [{ position: 0, intensity: 0.6 }, { position: 0.5, intensity: 0.9 }, { position: 1, intensity: 0.8 }],
    order: 3,
    color: '#d4af37',
    relatedCharacterIds: ['char-1', 'char-2', 'char-3'],
    relatedPlotPointIds: ['plot-1'],
    estimatedWords: 150,
    createdAt: new Date('2025-06-10'),
    updatedAt: new Date('2026-06-12'),
  },
  {
    id: 'beat-2-1',
    chapterId: 'chapter-2',
    structureType: 'three-act' as NarrativeStructureType,
    act: 'act2',
    beatKey: 'rising-action',
    title: '深空扫描',
    description: '航行第三年，林远例行扫描发现异常信号',
    goal: '引入本章的核心发现',
    conflict: '日常工作中突然出现的异常',
    turningPoint: '信号规律到不像是自然现象',
    emotionCurve: [{ position: 0, intensity: 0.3 }, { position: 0.5, intensity: 0.5 }, { position: 1, intensity: 0.7 }],
    order: 1,
    color: '#486581',
    relatedCharacterIds: ['char-1'],
    relatedPlotPointIds: ['plot-1'],
    estimatedWords: 200,
    createdAt: new Date('2025-07-15'),
    updatedAt: new Date('2026-06-14'),
  },
  {
    id: 'beat-2-2',
    chapterId: 'chapter-2',
    structureType: 'three-act' as NarrativeStructureType,
    act: 'act2',
    beatKey: 'midpoint',
    title: '紧急会议',
    description: '舰长召开紧急会议，讨论是否继续前进',
    goal: '展示不同人物面对未知的态度',
    conflict: '谨慎派与探索派的激烈争论',
    turningPoint: '林远的发言打破僵局',
    emotionCurve: [{ position: 0, intensity: 0.6 }, { position: 0.5, intensity: 0.85 }, { position: 1, intensity: 0.75 }],
    order: 2,
    color: '#d4af37',
    relatedCharacterIds: ['char-1', 'char-2', 'char-3', 'char-4'],
    relatedPlotPointIds: ['plot-1'],
    estimatedWords: 350,
    createdAt: new Date('2025-07-15'),
    updatedAt: new Date('2026-06-14'),
  },
  {
    id: 'beat-2-3',
    chapterId: 'chapter-2',
    structureType: 'three-act' as NarrativeStructureType,
    act: 'act2',
    beatKey: 'dark-night',
    title: '未知的呼唤',
    description: '林远独自站在观测窗前，思考这个决定的意义',
    goal: '加深主角的内心刻画',
    conflict: '对未知的期待与恐惧',
    turningPoint: '林远意识到这个决定可能改变人类命运',
    emotionCurve: [{ position: 0, intensity: 0.7 }, { position: 0.5, intensity: 0.3 }, { position: 1, intensity: 0.6 }],
    order: 3,
    color: '#1e3a5f',
    relatedCharacterIds: ['char-1'],
    relatedPlotPointIds: ['plot-1', 'plot-2'],
    estimatedWords: 150,
    createdAt: new Date('2025-07-15'),
    updatedAt: new Date('2026-06-14'),
  },
];

export const mockChapterOutlines: ChapterOutline[] = [
  {
    id: 'outline-1',
    chapterId: 'chapter-1',
    projectId: 'project-1',
    structureType: 'three-act' as NarrativeStructureType,
    beats: mockBeats.filter(b => b.chapterId === 'chapter-1'),
    summary: '第一章"启航"采用三幕式结构：从林远的个人沉思（铺垫），到与苏婉的深入对话（上升动作），最终以"星辰号"正式启航完成第一幕的关键转折。整章情感从淡淡的离愁逐渐过渡到对未来的坚定决心，为整部小说奠定了探索与勇气的基调。',
    createdAt: new Date('2025-06-10'),
    updatedAt: new Date('2026-06-12'),
  },
  {
    id: 'outline-2',
    chapterId: 'chapter-2',
    projectId: 'project-1',
    structureType: 'three-act' as NarrativeStructureType,
    beats: mockBeats.filter(b => b.chapterId === 'chapter-2'),
    summary: '第二章"异常信号"聚焦于发现与抉择：从日常工作中发现神秘信号，到舰桥会议上的激烈争论，再到林远独自面对未知的内心独白。本章在故事结构中起到承上启下的作用，既延续了前一章的探索主题，又为后续发现外星遗迹埋下伏笔。',
    createdAt: new Date('2025-07-15'),
    updatedAt: new Date('2026-06-14'),
  },
];
