interface FireflyLinks {
  self: string;
}

interface FireflyMeta {}

interface ListLinks extends FireflyLinks {
  first: string;
  last: string;
}

interface ListMeta extends FireflyMeta {
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

export type FireflyResponse<
  T,
  L extends FireflyLinks,
  M extends FireflyMeta,
> = {
  data: T;
  links: L;
  meta: M;
};

export type FireflyListResponse<T> = FireflyResponse<T[], ListLinks, ListMeta>;

type TriggerType = string;
type ActionType = string;
type RuleAction = {
  id: string;
  created_at: string;
  updated_at: string;
  type: ActionType;
  value: string;
  order: number;
  active: boolean;
  stop_processing: boolean;
};

type CreateRuleAction = Pick<RuleAction, 'type' | 'value'> &
  Partial<Pick<RuleAction, 'stop_processing'>>;

type RuleTrigger = {
  id: string;
  created_at: string;
  updated_at: string;
  type: TriggerType;
  value: string;
  order: number;
  active: boolean;
  stop_processing: boolean;
};

type CreateRuleTrigger = Pick<RuleTrigger, 'type' | 'value'> &
  Partial<Pick<RuleTrigger, 'stop_processing' | 'active'>>;

type ListItemLinks = {
  '0': {
    rel: string;
    uri: string;
  };
  self: string;
};

export type RuleAttributes = {
  created_at: string;
  updated_at: string;
  rule_group_ai: string;
  rule_group_title: string;
  title: string;
  description: string;
  order: number;
  active: boolean;
  strict: boolean;
  stop_processing: boolean;
  trigger: string;
  triggers: RuleTrigger[];
  actions: RuleAction[];
  links: ListItemLinks;
};

export interface FireflyRule {
  type: 'rules';
  id: string;
  attributes: RuleAttributes;
}

export type CreateFireflyRule = Pick<
  RuleAttributes,
  'rule_group_title' | 'title' | 'description' | 'trigger'
> &
  Partial<Pick<RuleAttributes, 'strict' | 'stop_processing' | 'active'>> & {
    actions: CreateRuleAction[];
    triggers: CreateRuleTrigger[];
  };

export type BillAttributes = {
  created_at: string;
  updated_at: string;
  currency_id: number;
  currency_code: string;
  currency_symbol: string;
  currency_decimal_places: number;
  name: string;
  amount_min: string;
  amount_max: string;
  date: string;
  end_date: string | null;
  extension_date: string | null;
  repeat_freq: string;
  skip: number;
  active: boolean;
  order: number;
  notes: string;
  object_group_id: string;
  object_group_order: number;
  object_group_title: string;
  next_expected_match: string | null;
  next_expected_match_diff: string | null;
  pay_dates: string[];
  paid_dates: string[];
};

export interface FireflyBill {
  type: 'bills';
  id: string;
  attributes: BillAttributes;
  links: ListItemLinks;
}

export type FireflyCreateBill = Pick<
  BillAttributes,
  'amount_min' | 'amount_max' | 'date' | 'repeat_freq' | 'name'
> &
  Partial<
    Pick<BillAttributes, 'active' | 'skip' | 'notes' | 'object_group_title'>
  >;

export type NotionBill = {
  notionId: string;
  title: string;
  status: string;
  amount: number;
  cancelled: string;
  type: string;
  repeated:
    | 'Jährlich'
    | 'Monatlich'
    | 'Quartalsweise'
    | 'Halbjährlich'
    | 'on demand';
  paymentPartner: string;
  fireflyId?: string;
};
