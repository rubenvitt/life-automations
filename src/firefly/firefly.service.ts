import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Axios, AxiosError } from 'axios';
import * as https from 'https';
import * as fs from 'fs';
import { CreateFireflyRule, FireflyCreateBill } from './firefly.types';
import { NotionService } from '../services/notion/notion.service';
import {
  mapNotionBillsToFireflyCreateRequests,
  mapNotionDbResultToBill,
} from './firefly.utils';
import { TodoistService } from '../services/todoist/todoist.service';

@Injectable()
export class FireflyService {
  private readonly axios: Axios;
  private readonly logger: Logger = new Logger(FireflyService.name);

  constructor(
    configService: ConfigService,
    private readonly notionService: NotionService,
    private readonly todoistService: TodoistService,
  ) {
    this.axios = axios.create({
      headers: {
        Authorization: 'Bearer ' + configService.getOrThrow('FIREFLY_API_KEY'),
      },
      baseURL: configService.getOrThrow('FIREFLY_BASE_URI') + '/api/v1',
      httpsAgent: new https.Agent({
        ca: fs.readFileSync('./ca.pem'),
      }),
    });
    this.logger.log(FireflyService.name + ' finished constructing');
  }

  async collectAllNotionBills(onlyFresh: boolean) {
    this.logger.log('Collection all Notion bills');
    return this.notionService
      .findContracts(onlyFresh)
      .then((dbQuery) => dbQuery.results)
      .then((value) => {
        this.logger.verbose(`Found ${value.length} bills in Notion`);
        return value;
      })
      .then((results) =>
        results
          .map((r) => [r['id'], r['properties']])
          .map(mapNotionDbResultToBill),
      );
  }

  // create invoice and a rule for Notion money-items
  async findAllRules() {
    return await this.axios.get('/rules').then((value) => value.data);
  }

  async findAllBills() {
    return await this.axios.get('/bills').then((value) => value.data);
  }

  async syncBills() {
    const idPromise = mapNotionBillsToFireflyCreateRequests(
      await this.collectAllNotionBills(true),
    ).map(async (request) => {
      const billId = await this.createBill(request[1]);
      if (billId) {
        await this.createRule(billId, request[1], request[2]);
        await this.notionService.updateBillId(request[0], billId);
      }
      return billId;
    });
    const billIds = (await Promise.all(idPromise)).filter((value) => value);
    if (billIds.length > 0) {
      await this.todoistService.createTask(
        'Neue Rechnungen prüfen',
        `Es wurden ${billIds.length} neue Rechnungen angelegt, bitte überprüfen: https://money.rubeen/bills`,
      );
    }
    return billIds;
  }

  async createBill(bill: FireflyCreateBill): Promise<string> {
    this.logger.log('Creating bill in Firefly', bill.name);
    return await this.axios
      .post('/bills', bill)
      .then((res) => res.data)
      .then((d) => {
        return d['data']['id'];
      })
      .catch((reason: AxiosError) => {
        this.logger.warn(reason.response?.data ?? reason.response);
      });
  }

  private async createRule(
    billId: string,
    bill: FireflyCreateBill,
    meta: { paymentPartner: string },
  ) {
    this.logger.log('Creating rule for bill in Firefly', bill.name);
    const rule: CreateFireflyRule = {
      title: `Regel für Rechnung "${bill.name}"`,
      description:
        'Diese Regel kennzeichnet Buchungen für die Rechnung.\nErstellt mit life-automations',
      actions: [
        {
          type: 'link_to_bill',
          value: bill.name,
        },
        {
          type: 'set_budget',
          value: 'Monatliche Rechnungen',
        },
      ],
      strict: true,
      trigger: 'store-journal',
      rule_group_title: '[Automatisch angelegt]: Rechnungen',
      triggers: [
        {
          type: 'destination_account_is',
          value: meta.paymentPartner,
        },
      ],
    };
    await this.axios.post('/rules', rule).catch((reason: AxiosError) => {
      this.logger.error(
        'Error while creating rule for bill',
        reason.response.data,
      );
    });
  }
}
