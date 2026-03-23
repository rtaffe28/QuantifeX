import React from "react";
import { Box, Text, VStack } from "@chakra-ui/react";
import type { EarningsEvent } from "@/models/EarningsCalendar";
import { EarningsEventCard } from "./EarningsEventCard";

interface Props {
  events: EarningsEvent[];
  watchlistTickers: string[];
}

function getWeekLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(dateStr + "T00:00:00");
  const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return "Past";
  if (diffDays < 7) return "This Week";
  if (diffDays < 14) return "Next Week";

  const monthYear = eventDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return monthYear;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export const EarningsListView: React.FC<Props> = ({ events, watchlistTickers }) => {
  if (events.length === 0) {
    return (
      <Box py={12} textAlign="center">
        <Text color="fg.muted">No earnings reports found in the selected window.</Text>
      </Box>
    );
  }

  // Group by week label, then by date
  const groups: { label: string; dates: { dateStr: string; events: EarningsEvent[] }[] }[] = [];
  const seenWeeks: Record<string, number> = {};
  const seenDates: Record<string, number> = {};

  for (const event of events) {
    const weekLabel = getWeekLabel(event.earnings_date);

    if (seenWeeks[weekLabel] === undefined) {
      seenWeeks[weekLabel] = groups.length;
      groups.push({ label: weekLabel, dates: [] });
    }
    const groupIdx = seenWeeks[weekLabel];
    const group = groups[groupIdx];

    const dateKey = weekLabel + "|" + event.earnings_date;
    if (seenDates[dateKey] === undefined) {
      seenDates[dateKey] = group.dates.length;
      group.dates.push({ dateStr: event.earnings_date, events: [] });
    }
    group.dates[seenDates[dateKey]].events.push(event);
  }

  return (
    <VStack align="stretch" gap={6}>
      {groups.map((group) => (
        <Box key={group.label}>
          <Text
            fontSize="xs"
            fontWeight={700}
            textTransform="uppercase"
            letterSpacing="wider"
            color="fg.muted"
            mb={3}
          >
            {group.label}
          </Text>
          <VStack align="stretch" gap={4}>
            {group.dates.map(({ dateStr, events: dayEvents }) => (
              <Box key={dateStr}>
                <Text fontSize="sm" fontWeight="semibold" color="fg.default" mb={2}>
                  {formatDateLabel(dateStr)}
                </Text>
                <VStack align="stretch" gap={2}>
                  {dayEvents.map((ev) => (
                    <EarningsEventCard key={ev.ticker} event={ev} watchlistTickers={watchlistTickers} />
                  ))}
                </VStack>
              </Box>
            ))}
          </VStack>
        </Box>
      ))}
    </VStack>
  );
};
