import {
  addYears,
  endOfISOWeek,
  endOfMonth,
  endOfYear,
  format,
  formatISO,
  getMonth,
  getYear,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
  subYears,
} from 'date-fns';

export function createNotionPropertiesForDailyReview(
  currentWeeklyReview: string,
  specialText: string,
) {
  return {
    'Wöchentliches Review': {
      relation: [{ id: currentWeeklyReview }],
    },
    Datum: {
      date: {
        start: isoDateOf(),
      },
    },
    'Informationen zum Tag': {
      rich_text: [
        {
          text: {
            content: convertMarkdownToNotionRichText(specialText),
          },
          type: 'text',
        },
      ],
    },
    Tag: {
      title: [
        {
          text: {
            content: format(new Date(), 'dd.MM.yyyy'),
          },
          type: 'text',
        },
      ],
    },
  };
}

export function createNotionPropertiesForWeeklyReview(
  currentMonthlyReview: string,
) {
  const startOfWeek = startOfISOWeek(new Date());
  const endOfWeek = endOfISOWeek(new Date());
  return {
    'Monatliches Review': {
      relation: [{ id: currentMonthlyReview }],
    },
    'Bereich der Woche': {
      date: {
        start: isoDateOf(startOfWeek),
        end: isoDateOf(endOfWeek),
      },
    },
    Name: {
      title: [
        {
          text: {
            content: `${format(startOfWeek, 'dd.MM.yyyy')} - ${format(
              endOfWeek,
              'dd.MM.yyyy',
            )}`,
          },
          type: 'text',
        },
      ],
    },
  };
}

export function createNotionPropertiesForMonthlyReview(
  currentYearlyReview: string,
) {
  const startDate = startOfMonth(new Date());
  const endDate = endOfMonth(new Date());
  return {
    'Jährliches Review': {
      relation: [{ id: currentYearlyReview }],
    },
    'Bereich des Monats': {
      date: {
        start: isoDateOf(startDate),
        end: isoDateOf(endDate),
      },
    },
    Name: {
      title: [
        {
          text: {
            content: format(startDate, 'yyyy-MM'),
          },
          type: 'text',
        },
      ],
    },
  };
}

export function createNotionPropertiesForYearlyReview(
  currentLongtermReview: string,
) {
  const startDate = startOfYear(new Date());
  const endDate = endOfYear(new Date());
  return {
    'Langfristiges Review': {
      relation: [{ id: currentLongtermReview }],
    },
    'Bereich des Jahres': {
      date: {
        start: isoDateOf(startDate),
        end: isoDateOf(endDate),
      },
    },
    Name: {
      title: [
        {
          text: {
            content: format(startDate, 'yyyy'),
          },
          type: 'text',
        },
      ],
    },
  };
}

export function createNotionPropertiesForLongtermReview() {
  const startDate = startOfYear(floor5Years());
  const endDate = endOfYear(subYears(ceil5Years(), 1));
  return {
    'Bereich des Reviews': {
      date: {
        start: isoDateOf(startDate),
        end: isoDateOf(endDate),
      },
    },
    Name: {
      title: [
        {
          text: {
            content: `${format(startDate, 'yyyy')} - ${format(
              endDate,
              'yyyy',
            )}`,
          },
          type: 'text',
        },
      ],
    },
  };
}

export function isoDateOf(startOfWeek: Date = new Date()) {
  return formatISO(startOfWeek, {
    representation: 'date',
  });
}

export function floor5Years(date = new Date()) {
  return subYears(date, getYear(date) % 5);
}

export function ceil5Years(date = new Date()) {
  return addYears(date, 5 - (getYear(date) % 5));
}

type SeasonEmoji =
  | '🌸'
  | '🌷'
  | '🌱'
  | '🌦️'
  | '🐣'
  | '🌞'
  | '🌻'
  | '🍦'
  | '🏖️'
  | '🕶️'
  | '🍂'
  | '🍁'
  | '🌬️'
  | '🎃'
  | '🌧️'
  | '❄️'
  | '⛄'
  | '🧣'
  | '🎿'
  | '🌨️';

type YearEmoji =
  | '🌟'
  | '🔮'
  | '🎲'
  | '🎨'
  | '🌍'
  | '💡'
  | '🚀'
  | '🎭'
  | '🔑'
  | '📚'
  | '🎵'
  | '🌈'
  | '💎'
  | '🛠️'
  | '🖼️'
  | '🔔'
  | '⏳'
  | '🌿'
  | '🍀'
  | '🔥';

function randomElement<T>(...elements: T[]): T {
  return elements[Math.floor(Math.random() * elements.length)];
}

function seasonEmoji(): SeasonEmoji {
  const month = getMonth(new Date());
  if (month >= 2 && month <= 4) {
    return randomElement('🌸', '🌷', '🌱', '🌦️', '🐣');
  }
  if (month >= 5 && month <= 7) {
    return randomElement('🌞', '🌻', '🍦', '🏖️', '🕶️');
  }
  if (month >= 8 && month <= 10) {
    return randomElement('🍂', '🍁', '🌬️', '🎃', '🌧️');
  }
  return randomElement('❄️', '⛄', '🧣', '🎿', '🌨️');
}

export function genericEmoji(): YearEmoji {
  const emojis: YearEmoji[] = [
    '🌟',
    '🔮',
    '🎲',
    '🎨',
    '🌍',
    '💡',
    '🚀',
    '🎭',
    '🔑',
    '📚',
    '🎵',
    '🌈',
    '💎',
    '🛠️',
    '🖼️',
    '🔔',
    '⏳',
    '🌿',
    '🍀',
    '🔥',
  ];

  return randomElement(...emojis);
}

function icon<T>(emoji: T): { emoji: T; type: 'emoji' } {
  return {
    emoji,
    type: 'emoji',
  };
}

export function genericIcon() {
  return icon(genericEmoji());
}

export function seasonalIcon() {
  return icon(seasonEmoji());
}

function convertMarkdownToNotionRichText(markdownText: string) {
  const boldPattern = /\*\*(.*?)\*\*/g;
  const parts = markdownText.split(boldPattern);
  const richTextItems = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Regular text
      if (parts[i]) {
        richTextItems.push({
          text: {
            content: parts[i],
          },
        });
      }
    } else {
      // Bold text
      richTextItems.push({
        text: {
          content: parts[i],
        },
        annotations: {
          bold: true,
        },
      });
    }
  }

  return richTextItems;
}