import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser(request.headers);

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHENTICATED",
          message: "Χρειάζεται σύνδεση."
        }
      },
      { status: 401 }
    );
  }

  if (user.userType !== "customer") {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Αυτό το account είναι για πελάτες."
        }
      },
      { status: 403 }
    );
  }

  const now = new Date();
  const view = request.nextUrl.searchParams.get("view") === "past"
    ? "past"
    : "upcoming";
  const appointments = await prisma.appointment.findMany({
    orderBy: {
      startsAt: view === "past" ? "desc" : "asc"
    },
    take: 50,
    where: {
      customer: {
        userId: user.id
      },
      startsAt: view === "past" ? { lt: now } : { gte: now }
    },
    select: {
      id: true,
      startsAt: true,
      status: true,
      business: {
        select: {
          name: true,
          timezone: true
        }
      },
      service: {
        select: {
          name: true
        }
      }
    }
  });

  return NextResponse.json({
    appointments: appointments.map((appointment) => ({
      business_name: appointment.business.name,
      id: appointment.id,
      service_name: appointment.service.name,
      starts_at: appointment.startsAt.toISOString(),
      status: appointment.status,
      timezone: appointment.business.timezone
    }))
  });
}
