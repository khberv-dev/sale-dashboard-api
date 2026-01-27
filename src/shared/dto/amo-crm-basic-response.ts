export interface AmoCrmPaginateLinks {
  self: { href: string };
  next: { href: string };
}

export abstract class AmoCrmBasicResponse<T> {
  _total_items: number;
  _page: number;
  _page_count: number;
  _links: AmoCrmPaginateLinks;
  _embedded: T;
}
