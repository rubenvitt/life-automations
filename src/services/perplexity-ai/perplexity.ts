export type Model =
  | 'sonar-small-chat'
  | 'sonar-small-online'
  | 'sonar-medium-chat'
  | 'sonar-medium-online';

export type Role = 'assistant' | 'user' | 'system';

export const systemPrompts = {
  default: {
    content:
      'Always respond in the language of the user. Try to fullfill his request as best as you can.',
    role: 'system',
  },
};

export type Prompt = {
  content: string;
  role: Role;
};

export type Payload = {
  messages: Prompt[];
  model: Model;
};
