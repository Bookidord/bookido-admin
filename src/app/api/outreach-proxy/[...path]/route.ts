import { NextRequest, NextResponse } from 'next/server';

const V2_URL = process.env.BOOKIDO_V2_URL || 'http://localhost:4000';
const V2_KEY = process.env.BOOKIDO_V2_KEY || process.env.ADMIN_API_KEY || '';

function buildTarget(path: string[], search: string) {
  return `${V2_URL}/api/outreach/${path.join('/')}${search}`;
}

async function proxy(req: NextRequest, method: string, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const url = buildTarget(path, req.nextUrl.search);
  const init: RequestInit = {
    method,
    headers: { 'x-api-key': V2_KEY, 'Content-Type': 'application/json' },
    cache: 'no-store',
  };
  if (method !== 'GET') init.body = await req.text();
  try {
    const r = await fetch(url, init);
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, 'GET', params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, 'POST', params);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, 'PATCH', params);
}
