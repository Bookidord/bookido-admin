import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservar cita · Bookido",
  description: "Elige día y hora para tu cita.",
};

export default function ReservaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
