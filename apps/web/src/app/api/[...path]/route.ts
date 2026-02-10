import { NextRequest, NextResponse } from 'next/server';

// Backend API URL (HTTP) - This proxy converts HTTPS requests to HTTP
const API_URL = process.env.API_URL || 'http://65.2.31.27';

async function proxyRequest(
  request: NextRequest,
  method: string,
  path: string[]
) {
  try {
    const pathString = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${API_URL}/api/${pathString}${searchParams ? `?${searchParams}` : ''}`;

    console.log(`[Proxy] ${method} ${url}`);

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': request.headers.get('content-type') || 'application/json',
    };
    
    // Forward authentication headers
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward CSRF token
    const csrfToken = request.headers.get('x-csrf-token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    // Forward cookies
    const cookie = request.headers.get('cookie');
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    // Get request body for POST/PUT/PATCH/DELETE
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && request.body) {
      try {
        body = await request.text();
      } catch (e) {
        console.error('[Proxy] Failed to read request body:', e);
      }
    }

    // Make request to backend API
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    // Get response body
    let responseBody: string;
    try {
      responseBody = await response.text();
    } catch (e) {
      responseBody = '';
    }

    // Prepare response headers
    const responseHeaders = new Headers();
    
    // Forward content-type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }

    // Forward set-cookie headers
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      responseHeaders.set('Set-Cookie', setCookie);
    }

    // Forward CSRF token
    const responseCsrfToken = response.headers.get('x-csrf-token');
    if (responseCsrfToken) {
      responseHeaders.set('X-CSRF-Token', responseCsrfToken);
    }

    console.log(`[Proxy] Response ${response.status}`);

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, 'GET', params.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, 'POST', params.path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, 'PUT', params.path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, 'DELETE', params.path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, 'PATCH', params.path);
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, Cookie',
    },
  });
}
