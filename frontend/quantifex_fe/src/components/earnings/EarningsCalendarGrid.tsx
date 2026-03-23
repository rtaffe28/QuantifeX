import React, { useState } from "react";
import { Box, Flex, Grid, Text, Badge, VStack } from "@chakra-ui/react";
import type { EarningsEvent } from "@/models/EarningsCalendar";
import { EarningsEventCard } from "./EarningsEventCard";

interface Props {
  events: EarningsEvent[];
  watchlistTickers: string[];
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export const EarningsCalendarGrid: React.FC<Props> = ({ events, watchlistTickers }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  // Week starts Monday: 0=Mon..6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map events by date string
  const eventsByDate: Record<string, EarningsEvent[]> = {};
  for (const ev of events) {
    const d = new Date(ev.earnings_date + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = ev.earnings_date;
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push(ev);
    }
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = Array(totalCells).fill(null);
  for (let i = 0; i < daysInMonth; i++) {
    cells[startOffset + i] = i + 1;
  }

  const selectedEvents = selectedDay ? eventsByDate[selectedDay] ?? [] : [];

  return (
    <Box>
      {/* Month navigation */}
      <Flex align="center" justify="space-between" mb={4}>
        <Box
          as="button"
          px={3} py={1}
          borderRadius="md"
          border="1px solid"
          borderColor="border.default"
          cursor="pointer"
          onClick={prevMonth}
          _hover={{ bg: "bg.muted" }}
        >
          ‹
        </Box>
        <Text fontWeight="semibold">{monthLabel}</Text>
        <Box
          as="button"
          px={3} py={1}
          borderRadius="md"
          border="1px solid"
          borderColor="border.default"
          cursor="pointer"
          onClick={nextMonth}
          _hover={{ bg: "bg.muted" }}
        >
          ›
        </Box>
      </Flex>

      {/* Day headers */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={1}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <Box key={d} textAlign="center" py={1}>
            <Text fontSize="xs" fontWeight={600} color="fg.muted">{d}</Text>
          </Box>
        ))}
      </Grid>

      {/* Calendar cells */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <Box key={`empty-${idx}`} minH="80px" />;
          }

          const cellDate = new Date(year, month, day);
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = isSameDay(cellDate, today);
          const dayEvents = eventsByDate[dateStr] ?? [];
          const isSelected = selectedDay === dateStr;

          return (
            <Box
              key={dateStr}
              minH="80px"
              p={1}
              borderRadius="md"
              border="1px solid"
              borderColor={isSelected ? "teal.500" : isToday ? "teal.300" : "border.default"}
              bg={isSelected ? "bg.muted" : "bg.subtle"}
              cursor={dayEvents.length > 0 ? "pointer" : "default"}
              onClick={() => {
                if (dayEvents.length > 0) {
                  setSelectedDay(isSelected ? null : dateStr);
                }
              }}
              _hover={dayEvents.length > 0 ? { borderColor: "teal.400" } : {}}
              transition="all 0.15s"
            >
              <Text fontSize="xs" fontWeight={isToday ? 700 : 400} color={isToday ? "teal.500" : "fg.default"} mb={1}>
                {day}
              </Text>
              <VStack align="stretch" gap={0.5}>
                {dayEvents.slice(0, 3).map((ev) => (
                  <Badge key={ev.ticker} colorPalette="teal" fontSize="10px" px={1}>
                    {ev.ticker}
                  </Badge>
                ))}
                {dayEvents.length > 3 && (
                  <Text fontSize="10px" color="fg.muted">+{dayEvents.length - 3} more</Text>
                )}
              </VStack>
            </Box>
          );
        })}
      </Grid>

      {/* Day detail popover */}
      {selectedDay && selectedEvents.length > 0 && (
        <Box mt={4} p={4} bg="bg.subtle" borderRadius="lg" border="1px solid" borderColor="border.default">
          <Text fontWeight="semibold" mb={3}>
            {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric"
            })}
          </Text>
          <VStack align="stretch" gap={2}>
            {selectedEvents.map((ev) => (
              <EarningsEventCard key={ev.ticker} event={ev} watchlistTickers={watchlistTickers} />
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};
