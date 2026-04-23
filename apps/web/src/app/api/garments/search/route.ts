import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const occasion = searchParams.get('occasion');

    if (!occasion) {
      return NextResponse.json({ error: 'Missing occasion parameter' }, { status: 400 });
    }

    const garments = await prisma.garment.findMany({
      where: {
        occasionTags: {
          has: occasion,
        },
      },
    });

    return NextResponse.json({ data: garments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
