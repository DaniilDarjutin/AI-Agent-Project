const fs = await import("node:fs/promises");
const path = await import("node:path");
const { Presentation, PresentationFile } = await import("@oai/artifact-tool");

const W = 1280;
const H = 720;

const OUT_DIR = "/Users/daniil/dev/AI-Agent-Project/outputs/ai-task-tracker-presentation";
const DECK_ID = "ai-task-tracker-presentation";
const SCRATCH_DIR = path.resolve("/Users/daniil/dev/AI-Agent-Project/tmp/slides/ai-task-tracker-presentation");
const PREVIEW_DIR = path.join(SCRATCH_DIR, "preview");
const INSPECT_PATH = path.join(SCRATCH_DIR, "inspect.ndjson");
const LOOP_LOG = path.join(SCRATCH_DIR, "render_verify_loops.ndjson");
const MAX_RENDER_VERIFY_LOOPS = 3;

const BG = "#F5F1E9";
const PANEL = "#FFFDF8";
const PANEL_SOFT = "#FAF5EB";
const INK = "#121518";
const SUBTLE = "#5F676F";
const BORDER = "#171A1D";
const ACCENT = "#1E8E61";
const ACCENT_SOFT = "#DDEFE6";
const SAND = "#D2B165";
const CORAL = "#D96E59";
const WHITE = "#FFFFFF";
const TRANSPARENT = "#00000000";

const TITLE_FACE = "Aptos";
const BODY_FACE = "Aptos";
const MONO_FACE = "Aptos Mono";

const SLIDES = [
  {
    type: "cover",
    eyebrow: "PROJECT REVIEW",
    title: "AI Task Tracker",
    subtitle: "AI-ассистент для управления задачами через чат, канбан и историю изменений",
    chips: ["Chat", "FastAPI", "React", "SQLite", "GigaChat"],
    note:
      "Открыть презентацию как обзор AI-first task tracker. Подчеркнуть, что продукт уже связывает natural language интерфейс и классическую task board модель.",
  },
  {
    type: "cards",
    eyebrow: "01",
    title: "Что это такое",
    lead: "Один продуктовый контур вместо разрозненных действий.",
    cards: [
      ["Chat-first", "Пользователь пишет задачу обычным языком, без отдельной формы и ручного поиска полей."],
      ["Task board", "Все задачи видны в канбане: статус, приоритет, дедлайн, быстрый доступ к редактированию."],
      ["History", "Каждое изменение сохраняется как отдельное событие и собирается в понятный таймлайн."],
    ],
    note:
      "Слайд нужен, чтобы быстро зафиксировать three-part model: чат, доска, история. Это и есть базовая продуктовая идея.",
  },
  {
    type: "cards",
    eyebrow: "02",
    title: "Какие проблемы решает",
    lead: "Смысл проекта не в еще одном todo-list, а в сокращении операционной нагрузки.",
    cards: [
      ["Много кликов", "Часть CRUD-операций уходит в естественный язык: создать, найти, обновить, удалить."],
      ["Потеря контекста", "Ассистент помнит последнюю обсуждаемую задачу и умеет работать с ссылками вроде «эту» или «последнюю»."],
      ["Низкая прозрачность", "Изменения по задаче фиксируются по времени, поэтому легче понять, что именно уже менялось."],
    ],
    note:
      "Озвучить, что продукт снимает friction вокруг task management, особенно для быстрых правок и уточнений.",
  },
  {
    type: "flow",
    eyebrow: "03",
    title: "Как это работает",
    lead: "Поток от сообщения пользователя до сохраненной задачи.",
    steps: [
      ["1. Запрос", "Пользователь пишет запрос в `/chat`."],
      ["2. Intent", "GigaChat возвращает JSON с intent и entities."],
      ["3. Подтверждение", "Создание, изменение и удаление проходят через явное подтверждение."],
      ["4. Действие", "ActionService и TaskService исполняют доменную операцию."],
      ["5. Состояние", "SQLite, чат-история и task context синхронизируют результат."],
    ],
    note:
      "Подчеркнуть structured prompt и слой подтверждения как ключ к контролируемому AI CRUD-потоку.",
  },
  {
    type: "cards",
    eyebrow: "04",
    title: "Что уже реализовано",
    lead: "Это не концепт на словах, а рабочий prototype contour.",
    cards: [
      ["AI CRUD", "Чат умеет создавать, получать, обновлять и удалять задачи через intent routing."],
      ["Safe actions", "Подтверждение хранится в chat state и автоматически истекает через 10 минут."],
      ["Kanban UX", "На доске уже есть поиск, фильтры, сортировка, модалка редактирования и переход в историю."],
    ],
    note:
      "Сделать акцент на том, что у проекта есть end-to-end контур: UI, API, storage и AI parsing.",
  },
  {
    type: "pages",
    eyebrow: "05",
    title: "Страницы продукта",
    lead: "Сейчас продукт состоит из трех основных пользовательских экранов.",
    pages: [
      ["/chat", "Диалог с ассистентом", ["история чата", "новый чат", "natural language commands"]],
      ["/tasks", "Канбан и управление", ["поиск и фильтры", "сортировка", "редактирование задачи"]],
      ["/tasks/:taskId/history", "История изменений", ["таймлайн событий", "старые и новые значения", "контекст по задаче"]],
    ],
    note:
      "Озвучить маршруты из реального роутера. При необходимости быстро показать, что `/` редиректит на `/chat`.",
  },
  {
    type: "architecture",
    eyebrow: "06",
    title: "Архитектура",
    lead: "Слои разделены достаточно чисто для дальнейшего роста.",
    layers: [
      ["Frontend", "React SPA, локальный chat id, отдельные экраны и API-клиенты."],
      ["FastAPI routes", "Чат, задачи, история задач и health-check как отдельные endpoints."],
      ["Services", "AIService, ActionService, TaskService, chat history/state services."],
      ["Storage + LLM", "SQLite для состояния и GigaChat для извлечения intent/entities."],
    ],
    note:
      "Хорошо подчеркнуть service/repository разделение. Это уже не монолитный handler, а более читаемая backend-структура.",
  },
  {
    type: "stack",
    eyebrow: "07",
    title: "Стек проекта",
    lead: "Стек небольшой, но прагматичный под прототип и локальную разработку.",
    columns: [
      ["Frontend", ["React 19", "TypeScript", "Vite", "React Router 7", "Axios", "SCSS Modules"]],
      ["Backend", ["FastAPI", "SQLModel", "Pydantic Settings", "Uvicorn", "Service/Repository pattern"]],
      ["Infra & Data", ["SQLite", "Docker", "docker-compose", ".env config", "GigaChat API"]],
    ],
    note:
      "Показать, что стек собран без лишней тяжести и соответствует текущему масштабу продукта.",
  },
  {
    type: "cards",
    eyebrow: "08",
    title: "Что важно улучшить",
    lead: "Следующий шаг уже не в базовом CRUD, а в зрелости продукта.",
    cards: [
      ["Пользователи и роли", "Сейчас нет пользователей, ролей, владения задачами и командного режима работы."],
      ["Надежность", "Нужны тесты, CI, более строгая обработка ошибок, логирование и мониторинг AI-ошибок."],
      ["Глубина продукта", "Не хватает создания задач из UI, уведомлений, массовых действий и более глубокой аналитики."],
    ],
    note:
      "Это честный слайд про ограничения текущей версии. Он помогает управлять ожиданиями коллег.",
  },
  {
    type: "roadmap",
    eyebrow: "09",
    title: "Планы развития",
    lead: "Логичное развитие от прототипа к рабочему внутреннему инструменту.",
    horizons: [
      ["Сразу", ["авторизация", "создание задачи из UI", "лучшее разрешение неоднозначных задач"]],
      ["Следом", ["уведомления", "интеграции с календарем и мессенджерами", "командные сценарии"]],
      ["Дальше", ["аналитика по задачам", "дашборды", "несколько AI workflows поверх задач"]],
    ],
    note:
      "Финал нужен как переход к обсуждению: во что вкладываться дальше, если проект покажется полезным.",
  },
];

const inspectRecords = [];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirs() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(SCRATCH_DIR, { recursive: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
}

function lineConfig(fill = TRANSPARENT, width = 0) {
  return { style: "solid", fill, width };
}

function normalizeText(text) {
  if (Array.isArray(text)) {
    return text.map((item) => String(item ?? "")).join("\n");
  }
  return String(text ?? "");
}

function textLineCount(text) {
  const value = normalizeText(text);
  if (!value.trim()) return 0;
  return Math.max(1, value.split(/\n/).length);
}

function recordShape(slideNo, shape, role, x, y, w, h) {
  inspectRecords.push({
    kind: "shape",
    slide: slideNo,
    id: shape?.id || `shape-${slideNo}-${inspectRecords.length + 1}`,
    role,
    bbox: [x, y, w, h],
  });
}

function recordText(slideNo, shape, role, text, x, y, w, h) {
  const value = normalizeText(text);
  inspectRecords.push({
    kind: "textbox",
    slide: slideNo,
    id: shape?.id || `text-${slideNo}-${inspectRecords.length + 1}`,
    role,
    text: value,
    textChars: value.length,
    textLines: textLineCount(value),
    bbox: [x, y, w, h],
  });
}

function addShape(slide, slideNo, geometry, x, y, w, h, fill = TRANSPARENT, line = TRANSPARENT, lineWidth = 0, role = geometry) {
  const shape = slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: lineConfig(line, lineWidth),
  });
  recordShape(slideNo, shape, role, x, y, w, h);
  return shape;
}

function addText(
  slide,
  slideNo,
  text,
  x,
  y,
  w,
  h,
  {
    size = 18,
    color = INK,
    bold = false,
    face = BODY_FACE,
    align = "left",
    valign = "top",
    fill = TRANSPARENT,
    line = TRANSPARENT,
    lineWidth = 0,
    role = "text",
    autoFit = "shrinkText",
  } = {},
) {
  const shape = addShape(slide, slideNo, "rect", x, y, w, h, fill, line, lineWidth, role);
  shape.text = text;
  shape.text.fontSize = size;
  shape.text.color = color;
  shape.text.bold = bold;
  shape.text.typeface = face;
  shape.text.alignment = align;
  shape.text.verticalAlignment = valign;
  shape.text.insets = { left: 0, right: 0, top: 0, bottom: 0 };
  if (autoFit) {
    shape.text.autoFit = autoFit;
  }
  recordText(slideNo, shape, role, text, x, y, w, h);
  return shape;
}

function wrapText(text, widthChars) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > widthChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.join("\n");
}

function addBackground(slide, slideNo) {
  slide.background.fill = BG;
  addShape(slide, slideNo, "ellipse", -120, -130, 360, 360, "#E8F2EC", TRANSPARENT, 0, "bg blob");
  addShape(slide, slideNo, "ellipse", 1080, 520, 260, 260, "#F5E8E1", TRANSPARENT, 0, "bg blob");
  addShape(slide, slideNo, "ellipse", 930, -40, 180, 180, "#EFE4C9", TRANSPARENT, 0, "bg blob");
}

function addHeader(slide, slideNo, eyebrow) {
  addText(slide, slideNo, eyebrow, 72, 36, 180, 20, {
    size: 13,
    color: ACCENT,
    bold: true,
    face: MONO_FACE,
    role: "eyebrow",
    autoFit: null,
  });
  addText(slide, slideNo, `${String(slideNo).padStart(2, "0")} / ${String(SLIDES.length).padStart(2, "0")}`, 1080, 36, 128, 20, {
    size: 13,
    color: SUBTLE,
    bold: true,
    face: MONO_FACE,
    align: "right",
    role: "slide index",
    autoFit: null,
  });
  addShape(slide, slideNo, "rect", 72, 62, 1136, 2, BORDER, TRANSPARENT, 0, "header rule");
}

function addTitle(slide, slideNo, title, lead) {
  addText(slide, slideNo, title, 72, 92, 720, 90, {
    size: 34,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "title",
  });
  if (lead) {
    addText(slide, slideNo, lead, 72, 188, 760, 54, {
      size: 18,
      color: SUBTLE,
      face: BODY_FACE,
      role: "lead",
    });
  }
}

function addChip(slide, slideNo, text, x, y, w) {
  addShape(slide, slideNo, "roundRect", x, y, w, 32, WHITE, BORDER, 1, "chip");
  addText(slide, slideNo, text, x + 16, y + 8, w - 32, 16, {
    size: 12,
    color: INK,
    face: MONO_FACE,
    bold: true,
    role: "chip text",
    autoFit: null,
  });
}

function addCard(slide, slideNo, x, y, w, h, accent, label, body) {
  addShape(slide, slideNo, "roundRect", x, y, w, h, PANEL, BORDER, 1.2, `card ${label}`);
  addShape(slide, slideNo, "rect", x, y, 10, h, accent, TRANSPARENT, 0, `card accent ${label}`);
  addText(slide, slideNo, label, x + 26, y + 24, w - 46, 24, {
    size: 14,
    color: accent === SAND ? INK : ACCENT,
    bold: true,
    face: MONO_FACE,
    role: `card label ${label}`,
    autoFit: null,
  });
  addText(slide, slideNo, wrapText(body, Math.max(25, Math.floor(w / 12))), x + 26, y + 74, w - 48, h - 98, {
    size: 19,
    color: INK,
    face: BODY_FACE,
    role: `card body ${label}`,
  });
}

function addRouteCard(slide, slideNo, x, y, w, h, route, title, tags) {
  addShape(slide, slideNo, "roundRect", x, y, w, h, PANEL, BORDER, 1.2, `route ${route}`);
  addText(slide, slideNo, route, x + 22, y + 22, w - 44, 22, {
    size: 12,
    color: ACCENT,
    bold: true,
    face: MONO_FACE,
    role: `route path ${route}`,
    autoFit: null,
  });
  addText(slide, slideNo, title, x + 22, y + 58, w - 44, 66, {
    size: 28,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: `route title ${route}`,
  });

  let chipY = y + 138;
  for (const tag of tags) {
    addShape(slide, slideNo, "roundRect", x + 22, chipY, w - 44, 34, PANEL_SOFT, TRANSPARENT, 0, `route tag ${tag}`);
    addText(slide, slideNo, tag, x + 36, chipY + 9, w - 72, 16, {
      size: 13,
      color: SUBTLE,
      face: MONO_FACE,
      role: `route tag text ${tag}`,
      autoFit: null,
    });
    chipY += 42;
  }
}

function addArrow(slide, slideNo, x, y, w = 36, h = 18) {
  addShape(slide, slideNo, "rightArrow", x, y, w, h, ACCENT_SOFT, BORDER, 1, "arrow");
}

function addNotes(slide, body) {
  slide.speakerNotes.setText(body);
}

async function slideCover(presentation, slideNo, data) {
  const slide = presentation.slides.add();
  addBackground(slide, slideNo);
  addShape(slide, slideNo, "roundRect", 64, 92, 1152, 548, PANEL, BORDER, 1.2, "cover panel");
  addShape(slide, slideNo, "rect", 64, 92, 14, 548, ACCENT, TRANSPARENT, 0, "cover accent");
  addText(slide, slideNo, data.eyebrow, 98, 118, 220, 18, {
    size: 13,
    color: ACCENT,
    bold: true,
    face: MONO_FACE,
    role: "cover eyebrow",
    autoFit: null,
  });
  addText(slide, slideNo, data.title, 98, 168, 620, 128, {
    size: 56,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "cover title",
  });
  addText(slide, slideNo, data.subtitle, 100, 322, 630, 88, {
    size: 22,
    color: SUBTLE,
    face: BODY_FACE,
    role: "cover subtitle",
  });

  addShape(slide, slideNo, "roundRect", 98, 462, 330, 96, PANEL_SOFT, BORDER, 1, "cover insight");
  addText(slide, slideNo, "Chat -> Action -> Board", 124, 488, 282, 30, {
    size: 24,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "cover insight text",
  });
  addText(slide, slideNo, "AI-слой поверх управления задачами", 124, 524, 260, 18, {
    size: 12,
    color: SUBTLE,
    face: MONO_FACE,
    role: "cover insight caption",
    autoFit: null,
  });

  addShape(slide, slideNo, "roundRect", 794, 146, 352, 372, WHITE, BORDER, 1, "cover right panel");
  addText(slide, slideNo, "Core blocks", 826, 180, 130, 18, {
    size: 12,
    color: SUBTLE,
    bold: true,
    face: MONO_FACE,
    role: "cover right eyebrow",
    autoFit: null,
  });
  addText(slide, slideNo, "Chat\nKanban\nHistory", 826, 218, 220, 160, {
    size: 36,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "cover right title",
  });
  addText(slide, slideNo, "Прототип уже соединяет AI-интерфейс, backend действия и локальное хранение состояния.", 826, 386, 256, 72, {
    size: 17,
    color: SUBTLE,
    face: BODY_FACE,
    role: "cover right body",
  });

  const chipWidths = [78, 104, 88, 90, 104];
  let chipX = 98;
  for (let index = 0; index < data.chips.length; index += 1) {
    addChip(slide, slideNo, data.chips[index], chipX, 548, chipWidths[index]);
    chipX += chipWidths[index] + 12;
  }

  addNotes(slide, data.note);
}

async function slideCards(presentation, slideNo, data) {
  const slide = presentation.slides.add();
  addBackground(slide, slideNo);
  addHeader(slide, slideNo, data.eyebrow);
  addTitle(slide, slideNo, data.title, data.lead);

  const accents = [ACCENT, SAND, CORAL];
  const cardY = 326;
  const cardW = 348;
  const gap = 24;
  const startX = 92;
  for (let index = 0; index < data.cards.length; index += 1) {
    const [label, body] = data.cards[index];
    addCard(slide, slideNo, startX + index * (cardW + gap), cardY, cardW, 246, accents[index % accents.length], label, body);
  }

  addNotes(slide, data.note);
}

async function slideFlow(presentation, slideNo, data) {
  const slide = presentation.slides.add();
  addBackground(slide, slideNo);
  addHeader(slide, slideNo, data.eyebrow);
  addTitle(slide, slideNo, data.title, data.lead);

  const boxY = 360;
  const boxW = 206;
  const gap = 20;
  const startX = 52;
  const accents = [ACCENT, SAND, CORAL, ACCENT, SAND];

  for (let index = 0; index < data.steps.length; index += 1) {
    const [stepTitle, stepBody] = data.steps[index];
    const x = startX + index * (boxW + gap);
    addShape(slide, slideNo, "roundRect", x, boxY, boxW, 180, PANEL, BORDER, 1.2, `flow ${stepTitle}`);
    addShape(slide, slideNo, "rect", x, boxY, boxW, 8, accents[index], TRANSPARENT, 0, `flow accent ${stepTitle}`);
    addText(slide, slideNo, stepTitle, x + 18, boxY + 26, boxW - 36, 22, {
      size: 14,
      color: SUBTLE,
      bold: true,
      face: MONO_FACE,
      role: `flow title ${stepTitle}`,
      autoFit: null,
    });
    addText(slide, slideNo, wrapText(stepBody, 18), x + 18, boxY + 66, boxW - 36, 82, {
      size: 18,
      color: INK,
      face: BODY_FACE,
      role: `flow body ${stepTitle}`,
    });
    if (index < data.steps.length - 1) {
      addArrow(slide, slideNo, x + boxW + 2, boxY + 80, 34, 18);
    }
  }

  addShape(slide, slideNo, "roundRect", 92, 594, 1096, 54, PANEL_SOFT, TRANSPARENT, 0, "flow footer");
  addText(slide, slideNo, "Ключевой контрольный слой: структурированный prompt и confirmation state перед изменяющими действиями.", 120, 612, 1040, 18, {
    size: 13,
    color: SUBTLE,
    face: MONO_FACE,
    role: "flow footer text",
    autoFit: null,
  });

  addNotes(slide, data.note);
}

async function slidePages(presentation, slideNo, data) {
  const slide = presentation.slides.add();
  addBackground(slide, slideNo);
  addHeader(slide, slideNo, data.eyebrow);
  addTitle(slide, slideNo, data.title, data.lead);

  const y = 304;
  const w = 350;
  const gap = 24;
  const x0 = 92;
  for (let index = 0; index < data.pages.length; index += 1) {
    const [route, title, tags] = data.pages[index];
    addRouteCard(slide, slideNo, x0 + index * (w + gap), y, w, 286, route, title, tags);
  }

  addNotes(slide, data.note);
}

async function slideArchitecture(presentation, slideNo, data) {
  const slide = presentation.slides.add();
  addBackground(slide, slideNo);
  addHeader(slide, slideNo, data.eyebrow);
  addTitle(slide, slideNo, data.title, data.lead);

  const w = 248;
  const y = 350;
  const gap = 24;
  const startX = 86;
  const accents = [ACCENT, SAND, CORAL, ACCENT];

  for (let index = 0; index < data.layers.length; index += 1) {
    const [label, body] = data.layers[index];
    const x = startX + index * (w + gap);
    addShape(slide, slideNo, "roundRect", x, y, w, 188, PANEL, BORDER, 1.2, `layer ${label}`);
    addShape(slide, slideNo, "ellipse", x + 24, y + 22, 42, 42, accents[index], BORDER, 1, `layer marker ${label}`);
    addText(slide, slideNo, label, x + 82, y + 28, w - 106, 22, {
      size: 15,
      color: INK,
      bold: true,
      face: MONO_FACE,
      role: `layer label ${label}`,
      autoFit: null,
    });
    addText(slide, slideNo, wrapText(body, 21), x + 24, y + 84, w - 48, 82, {
      size: 17,
      color: INK,
      face: BODY_FACE,
      role: `layer body ${label}`,
    });
    if (index < data.layers.length - 1) {
      addArrow(slide, slideNo, x + w + 6, y + 84, 30, 18);
    }
  }

  addNotes(slide, data.note);
}

function addListColumn(slide, slideNo, x, y, w, h, title, items, accent) {
  addShape(slide, slideNo, "roundRect", x, y, w, h, PANEL, BORDER, 1.2, `list ${title}`);
  addShape(slide, slideNo, "rect", x, y, w, 8, accent, TRANSPARENT, 0, `list accent ${title}`);
  addText(slide, slideNo, title, x + 24, y + 24, w - 48, 26, {
    size: 18,
    color: INK,
    bold: true,
    face: MONO_FACE,
    role: `list title ${title}`,
    autoFit: null,
  });
  const body = items.map((item) => `• ${item}`).join("\n");
  addText(slide, slideNo, body, x + 24, y + 76, w - 48, h - 100, {
    size: 18,
    color: INK,
    face: BODY_FACE,
    role: `list body ${title}`,
  });
}

async function slideStack(presentation, slideNo, data) {
  const slide = presentation.slides.add();
  addBackground(slide, slideNo);
  addHeader(slide, slideNo, data.eyebrow);
  addTitle(slide, slideNo, data.title, data.lead);

  const y = 320;
  const h = 292;
  const w = 350;
  const gap = 24;
  const startX = 92;
  const accents = [ACCENT, SAND, CORAL];
  for (let index = 0; index < data.columns.length; index += 1) {
    const [title, items] = data.columns[index];
    addListColumn(slide, slideNo, startX + index * (w + gap), y, w, h, title, items, accents[index]);
  }

  addNotes(slide, data.note);
}

async function slideRoadmap(presentation, slideNo, data) {
  const slide = presentation.slides.add();
  addBackground(slide, slideNo);
  addHeader(slide, slideNo, data.eyebrow);
  addTitle(slide, slideNo, data.title, data.lead);

  const y = 330;
  const w = 350;
  const h = 250;
  const gap = 24;
  const startX = 92;
  const accents = [ACCENT, SAND, CORAL];

  for (let index = 0; index < data.horizons.length; index += 1) {
    const [title, items] = data.horizons[index];
    addShape(slide, slideNo, "roundRect", startX + index * (w + gap), y, w, h, PANEL, BORDER, 1.2, `roadmap ${title}`);
    addShape(slide, slideNo, "ellipse", startX + 26 + index * (w + gap), y + 26, 38, 38, accents[index], BORDER, 1, `roadmap dot ${title}`);
    addText(slide, slideNo, title, startX + 82 + index * (w + gap), y + 34, 120, 18, {
      size: 16,
      color: INK,
      bold: true,
      face: MONO_FACE,
      role: `roadmap title ${title}`,
      autoFit: null,
    });
    const body = items.map((item) => `• ${item}`).join("\n");
    addText(slide, slideNo, body, startX + 26 + index * (w + gap), y + 88, w - 52, 128, {
      size: 18,
      color: INK,
      face: BODY_FACE,
      role: `roadmap body ${title}`,
    });
  }

  addShape(slide, slideNo, "roundRect", 92, 620, 1096, 36, PANEL_SOFT, TRANSPARENT, 0, "roadmap footer");
  addText(slide, slideNo, "Сейчас это сильный внутренний прототип: следующий прирост ценности дадут командный режим и надежный production-контур.", 122, 630, 1030, 14, {
    size: 12,
    color: SUBTLE,
    face: MONO_FACE,
    role: "roadmap footer text",
    autoFit: null,
  });

  addNotes(slide, data.note);
}

async function createDeck() {
  await ensureDirs();
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });

  for (let index = 0; index < SLIDES.length; index += 1) {
    const slideNo = index + 1;
    const data = SLIDES[index];
    if (data.type === "cover") {
      await slideCover(presentation, slideNo, data);
    } else if (data.type === "cards") {
      await slideCards(presentation, slideNo, data);
    } else if (data.type === "flow") {
      await slideFlow(presentation, slideNo, data);
    } else if (data.type === "pages") {
      await slidePages(presentation, slideNo, data);
    } else if (data.type === "architecture") {
      await slideArchitecture(presentation, slideNo, data);
    } else if (data.type === "stack") {
      await slideStack(presentation, slideNo, data);
    } else if (data.type === "roadmap") {
      await slideRoadmap(presentation, slideNo, data);
    } else {
      throw new Error(`Unknown slide type: ${data.type}`);
    }
  }

  return presentation;
}

async function saveBlobToFile(blob, filePath) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await fs.writeFile(filePath, bytes);
}

async function writeInspectArtifact(presentation) {
  const records = [
    {
      kind: "deck",
      id: DECK_ID,
      slideCount: presentation.slides.count,
      slideSize: { width: W, height: H },
    },
    ...presentation.slides.items.map((slide, index) => ({
      kind: "slide",
      slide: index + 1,
      id: slide?.id || `slide-${index + 1}`,
    })),
    ...inspectRecords,
  ];
  await fs.writeFile(INSPECT_PATH, records.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");
}

async function renderLoopCount() {
  if (!(await pathExists(LOOP_LOG))) return 0;
  const content = await fs.readFile(LOOP_LOG, "utf8");
  return content.split(/\r?\n/).filter((line) => line.trim()).length;
}

async function verifyAndExport(presentation) {
  const nextLoop = (await renderLoopCount()) + 1;
  if (nextLoop > MAX_RENDER_VERIFY_LOOPS) {
    throw new Error(`Render loop cap exceeded: ${MAX_RENDER_VERIFY_LOOPS}`);
  }

  await writeInspectArtifact(presentation);

  const previewPaths = [];
  for (let index = 0; index < presentation.slides.items.length; index += 1) {
    const slide = presentation.slides.items[index];
    const previewBlob = await presentation.export({ slide, format: "png", scale: 1 });
    const previewPath = path.join(PREVIEW_DIR, `slide-${String(index + 1).padStart(2, "0")}.png`);
    await saveBlobToFile(previewBlob, previewPath);
    previewPaths.push(previewPath);
  }

  const pptxBlob = await PresentationFile.exportPptx(presentation);
  const pptxPath = path.join(OUT_DIR, "output.pptx");
  await pptxBlob.save(pptxPath);

  const loopRecord = {
    kind: "render_verify_loop",
    deckId: DECK_ID,
    loop: nextLoop,
    timestamp: new Date().toISOString(),
    slideCount: presentation.slides.count,
    previewCount: previewPaths.length,
    pptxPath,
  };
  await fs.appendFile(LOOP_LOG, JSON.stringify(loopRecord) + "\n", "utf8");

  return { pptxPath, previewPaths };
}

const presentation = await createDeck();
const result = await verifyAndExport(presentation);
console.log(result.pptxPath);
