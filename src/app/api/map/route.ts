// src/app/api/map/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { co_texts } = await req.json()
    if (!co_texts || !Array.isArray(co_texts) || co_texts.length === 0) {
      return NextResponse.json({ error: 'At least one CO text is required' }, { status: 400 })
    }
    const response = await fetch('https://makpr016-co-po-bloom-api.hf.space/map/batch/hybrid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ co_texts, include_bloom: true, max_cos: 50 }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to map COs to POs')
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
