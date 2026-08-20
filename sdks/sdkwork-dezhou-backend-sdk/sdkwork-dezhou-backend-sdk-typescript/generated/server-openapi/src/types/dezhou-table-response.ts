import type { DezhouTableItem } from './dezhou-table-item';

export interface DezhouTableResponse {
  code: 0;
  data: unknown & { item: DezhouTableItem; };
  traceId: string;
}
