import { NextRequest, NextResponse } from 'next/server';

const KRX_EXTERNAL_URL =
  'https://apis.data.go.kr/1160100/service/GetKrxListedInfoService/getItemInfo';

const KRX_NUMBER_OF_ROWS = '20';

export async function GET(request: NextRequest) {
  const serviceKey = process.env.KRX_API_SERVICE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'KRX_API_SERVICE_KEY is not configured' }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query')?.trim();
  const type = (searchParams.get('type') ?? 'name') as 'name' | 'code';

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  const queryParams = new URLSearchParams();
  queryParams.append('serviceKey', serviceKey);
  queryParams.append('numOfRows', KRX_NUMBER_OF_ROWS);
  queryParams.append('resultType', 'json');

  if (type === 'code') {
    queryParams.append('likeIsinCd', query);
  } else {
    queryParams.append('likeItmsNm', query);
  }

  const endpoint = `${KRX_EXTERNAL_URL}?${queryParams.toString()}`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    return NextResponse.json({ error: 'KRX API request failed' }, { status: res.status });
  }

  const data = await res.json();
  const rawItems = data?.response?.body?.items?.item;

  if (!rawItems) {
    return NextResponse.json({ items: [] });
  }

  const seen = new Set<string>();
  const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).reduce<
    { name: string; ticker: string; isinCd: string; market: string }[]
  >((acc, item: Record<string, string>) => {
    if (!seen.has(item.isinCd)) {
      seen.add(item.isinCd);
      acc.push({
        name: item.itmsNm,
        ticker: (item.srtnCd ?? '').replace(/^[A-Za-z]/, ''),
        isinCd: item.isinCd,
        market: item.mrktCtg,
      });
    }
    return acc;
  }, []);

  return NextResponse.json({ items });
}
