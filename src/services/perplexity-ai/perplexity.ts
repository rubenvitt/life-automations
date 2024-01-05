export type Model =
  | 'pplx-7b-online'
  | 'pplx-70b-online'
  | 'pplx-7b-chat'
  | 'pplx-70b-chat';

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
