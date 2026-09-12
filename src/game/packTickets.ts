import type { PackTicketArchetype, PackTicketType } from "./types";

export const PACK_TICKET_ARCHETYPES: PackTicketArchetype[] = [
  "fanatic",
  "knight",
  "poison",
  "outer",
  "elder",
  "deep",
  "offering",
  "shadow",
  "greatold",
];

export const PACK_TICKET_LABELS: Record<PackTicketType, string> = {
  fanatic: "狂信",
  knight: "騎士",
  poison: "毒",
  outer: "外宇宙",
  elder: "旧神",
  deep: "深き者",
  offering: "供物",
  shadow: "影",
  greatold: "大いなるもの",
  all: "全",
};

export function packTicketArt(ticket: PackTicketType): string {
  return `art/pixel/tickets/ticket_${ticket}.png`;
}
