import { BillAttributes, FireflyCreateBill, NotionBill } from './firefly.types';
import { format, formatISO } from 'date-fns';

export function mapNotionDbResultToBill(
  plainResult: [string, unknown],
): NotionBill {
  const id = plainResult[0];
  // noinspection JSNonASCIINames
  return {
    notionId: id,
    title: plainResult[1]['Name']['title'][0]['plain_text'],
    status: plainResult[1]['Status']['status']['name'],
    amount: plainResult[1]['Betrag']['number'],
    cancelled: plainResult[1]['Gekündigt']['checkbox'],
    type: plainResult[1]['Art']['select']['name'],
    repeated: plainResult[1]['Zahlungsturnus']['select']['name'],
    paymentPartner: plainResult[1]['Vertragspartner']['select']['name'],
    fireflyId: plainResult[1]['Firefly id']['rich_text'][0]?.['plain_text'],
  };
}

function mapNotionRepeatToFireflyRepeat(
  bill: NotionBill,
): Pick<BillAttributes, 'repeat_freq' | 'skip'> {
  let repeat_freq: string = 'monthly';
  let skip: number = 0;
  switch (bill.repeated) {
    case 'Jährlich':
      repeat_freq = 'yearly';
      break;
    case 'Monatlich':
      break;
    case 'Quartalsweise':
      skip = 2;
      break;
    case 'Halbjährlich':
      skip = 5;
      break;
    case 'on demand':
      break;
  }
  return {
    skip,
    repeat_freq,
  };
}

export function mapNotionBillsToFireflyCreateRequests(
  bills: NotionBill[],
): [string, FireflyCreateBill, { paymentPartner: string }][] {
  return bills.map((bill) => [
    bill.notionId,
    {
      active: !bill.cancelled,
      amount_min: String(Math.round(100 * bill.amount * 0.9) / 100),
      amount_max: String(Math.round(100 * bill.amount * 1.1) / 100),
      name: bill.title,
      notes: `Created by life-automations on ${format(new Date(), 'dd.MM.yyyy')}
Notion id: ${bill.notionId}`,
      object_group_title: '#life-automations',
      date: formatISO(new Date(), {
        format: 'basic',
      }),
      ...mapNotionRepeatToFireflyRepeat(bill),
    },
    {
      paymentPartner: bill.paymentPartner,
    },
  ]);
}
