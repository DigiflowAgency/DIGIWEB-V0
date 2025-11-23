import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const {
      // Contact
      firstName,
      lastName,
      email,
      phone,
      // Company
      companyName,
      city,
      siret,
      website,
      instagram,
      // Deal
      assignedTo,
      stage = 'A_CONTACTER',
      product,
      value,
      meetingDate,
      nextFollowUp: _nextFollowUp,
      origin,
      emailReminderSent,
      smsReminderSent,
      comments,
    } = body;

    // Validation
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Prénom et nom sont requis' },
        { status: 400 }
      );
    }

    // 1. Créer ou trouver l'entreprise
    let company = null;
    if (companyName) {
      company = await prisma.companies.create({
        data: {
          id: `company_${Date.now()}`,
          name: companyName,
          city: city || null,
          siret: siret || null,
          website: website || null,
          socialMedia: instagram ? JSON.stringify({ instagram }) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // 2. Créer le contact
    const contact = await prisma.contacts.create({
      data: {
        id: `contact_${Date.now()}`,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        companyId: company?.id || null,
        status: 'LEAD',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 3. Créer le deal
    const deal = await prisma.deals.create({
      data: {
        id: `deal_${Date.now()}`,
        title: companyName || `${firstName} ${lastName}`,
        description: comments || product || null,
        value: value ? parseFloat(value) : 0,
        currency: 'EUR',
        stage: stage as any,
        probability: stage === 'A_CONTACTER' ? 10 : 50,
        expectedCloseDate: meetingDate ? new Date(meetingDate) : null,
        contactId: contact.id,
        companyId: company?.id || null,
        ownerId: assignedTo || session.user.id,
        product: product || null,
        origin: origin || null,
        emailReminderSent: emailReminderSent || null,
        smsReminderSent: smsReminderSent || null,
        comments: comments || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Retourner le deal avec les relations
    const createdDeal = await prisma.deals.findUnique({
      where: { id: deal.id },
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        companies: {
          select: {
            id: true,
            name: true,
            city: true,
            siret: true,
            website: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(createdDeal, { status: 201 });
  } catch (error) {
    console.error('Erreur création CRM unifiée:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
