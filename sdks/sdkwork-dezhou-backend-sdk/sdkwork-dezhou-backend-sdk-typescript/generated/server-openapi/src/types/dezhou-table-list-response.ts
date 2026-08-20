import type { DezhouTableItem } from './dezhou-table-item';
import type { PageInfo } from './page-info';

export interface DezhouTableListResponse {
  code: 0;
  data: unknown & { items: DezhouTableItem[]; pageInfo: PageInfo; };
  traceId: string;
}
