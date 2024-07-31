export type Model =
  | 'llama-3-sonar-small-32k-chat'
  | 'llama-3-sonar-small-32k-online'
  | 'llama-3-sonar-large-32k-chat'
  | 'llama-3-sonar-large-32k-online';

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
