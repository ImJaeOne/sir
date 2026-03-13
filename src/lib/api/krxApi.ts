export interface KrxCompany {
  name: string;
  ticker: string;
  isinCd: string;
  market: string;
}

/** 클라이언트용: route handler를 통해 검색 */
export async function getCompanies(query: string, type: 'name' | 'code'): Promise<KrxCompany[]> {
  const params = new URLSearchParams({ query, type });
  const res = await fetch(`/api/companies?${params.toString()}`);
  const data = await res.json();
  return data.items ?? [];
}
