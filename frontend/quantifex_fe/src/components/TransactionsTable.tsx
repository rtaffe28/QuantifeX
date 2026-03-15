import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    Table,
    Text,
    Spinner,
    Flex,
    Input,
    Button,
    IconButton,
} from "@chakra-ui/react";
import transactionsService from "@/api/transactions";
import type { Transaction } from "@/models/Transaction";

const EMPTY_FORM = { date: "", type: "", description: "", amount: "" };

function exportToCsv(transactions: Transaction[]) {
    const header = "date,type,description,amount";
    const rows = transactions.map(
        (t) => `${t.date},${t.type},"${t.description.replace(/"/g, '""')}",${t.amount}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function parseDate(raw: string): string {
    const cleaned = raw.replace(/['"]/g, "").trim();
    const parts = cleaned.split("/");
    if (parts.length !== 3) return cleaned;
    let [month, day, year] = parts;
    month = month.padStart(2, "0");
    day = day.padStart(2, "0");
    if (year.length === 2) {
        const num = parseInt(year, 10);
        year = (num > 50 ? "19" : "20") + year;
    }
    return `${year}-${month}-${day}`;
}

function parseCsv(text: string): { date: string; type: string; description: string; amount: number }[] {
    const lines = text.trim().split("\n");
    // skip header if present
    const start = lines[0]?.toLowerCase().includes("date") ? 1 : 0;
    const results: { date: string; type: string; description: string; amount: number }[] = [];
    for (let i = start; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // simple CSV parse handling quoted fields
        const parts: string[] = [];
        let current = "";
        let inQuotes = false;
        for (const ch of line) {
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === "," && !inQuotes) {
                parts.push(current.trim());
                current = "";
            } else {
                current += ch;
            }
        }
        parts.push(current.trim());
        if (parts.length >= 3) {
            const amountStr = parts[3]?.replace(/[$ ,]/g, "") || "0";
            results.push({
                date: parseDate(parts[0]),
                type: parts[1],
                description: parts[2],
                amount: Number(amountStr) || 0,
            });
        }
    }
    return results;
}

export const TransactionsTable: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const text = await file.text();
            const rows = parseCsv(text);
            for (const row of rows) {
                await transactionsService.addTransaction(row);
            }
            await fetchTransactions();
        } catch (err) {
            console.error("Failed to import CSV:", err);
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await transactionsService.getTransactions();
            setTransactions(res.data);
        } catch (err) {
            console.error("Failed to fetch transactions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await transactionsService.addTransaction({
                date: form.date,
                type: form.type,
                description: form.description,
                amount: Number(form.amount),
            });
            setForm(EMPTY_FORM);
            setShowForm(false);
            await fetchTransactions();
        } catch (err) {
            console.error("Failed to add transaction:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await transactionsService.deleteTransaction(id);
            setTransactions((prev) => prev.filter((t) => t.id !== id));
        } catch (err) {
            console.error("Failed to delete transaction:", err);
        }
    };

    const totalPnl = transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
    );

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);

    if (loading) {
        return (
            <Flex justify="center" align="center" minH="200px">
                <Spinner size="xl" color="primary.default" />
            </Flex>
        );
    }

    const isFormValid =
        form.date && form.type && form.description && form.amount;

    return (
        <Box p={6}>
            {/* PnL Summary */}
            <Flex justify="space-between" align="center" mb={6}>
                <Box
                    p={4}
                    bg="bg.subtle"
                    rounded="lg"
                    borderWidth="1px"
                    borderColor="border.default"
                    flex={1}
                >
                    <Text fontSize="sm" color="fg.muted" mb={1}>
                        Total PnL
                    </Text>
                    <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color={totalPnl >= 0 ? "green.400" : "red.400"}
                    >
                        {formatCurrency(totalPnl)}
                    </Text>
                </Box>
                <Flex gap={2} ml={4}>
                    <Button
                        colorPalette="gray"
                        variant="outline"
                        onClick={() => exportToCsv(transactions)}
                        disabled={transactions.length === 0}
                    >
                        Export CSV
                    </Button>
                    <Button
                        colorPalette="gray"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        loading={importing}
                    >
                        Import CSV
                    </Button>
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleImportCsv}
                        style={{ display: "none" }}
                    />
                    <Button
                        colorPalette={showForm ? "gray" : "blue"}
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? "Cancel" : "+ Add Transaction"}
                    </Button>
                </Flex>
            </Flex>

            {/* Add Transaction Form */}
            {showForm && (
                <Box
                    as="form"
                    onSubmit={handleAdd}
                    mb={6}
                    p={4}
                    bg="bg.subtle"
                    rounded="lg"
                    borderWidth="1px"
                    borderColor="border.default"
                >
                    <Text fontWeight="bold" mb={3} color="fg.default">
                        New Transaction
                    </Text>
                    <Flex gap={3} flexWrap="wrap">
                        <Input
                            type="date"
                            placeholder="Date"
                            value={form.date}
                            onChange={(e) =>
                                setForm({ ...form, date: e.target.value })
                            }
                            size="sm"
                            flex="1"
                            minW="140px"
                        />
                        <Input
                            placeholder="Type (e.g. buy, sell)"
                            value={form.type}
                            onChange={(e) =>
                                setForm({ ...form, type: e.target.value })
                            }
                            size="sm"
                            flex="1"
                            minW="120px"
                        />
                        <Input
                            placeholder="Description"
                            value={form.description}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value,
                                })
                            }
                            size="sm"
                            flex="2"
                            minW="160px"
                        />
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={form.amount}
                            onChange={(e) =>
                                setForm({ ...form, amount: e.target.value })
                            }
                            size="sm"
                            flex="1"
                            minW="120px"
                        />
                        <Button
                            type="submit"
                            colorPalette="blue"
                            size="sm"
                            disabled={!isFormValid || submitting}
                            loading={submitting}
                        >
                            Add
                        </Button>
                    </Flex>
                </Box>
            )}

            {/* Transactions Table */}
            {transactions.length === 0 ? (
                <Text color="fg.muted" textAlign="center" py={10}>
                    No transactions yet.
                </Text>
            ) : (
                <Table.Root size="md" variant="outline">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>Date</Table.ColumnHeader>
                            <Table.ColumnHeader>Type</Table.ColumnHeader>
                            <Table.ColumnHeader>Description</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">
                                Amount
                            </Table.ColumnHeader>
                            <Table.ColumnHeader
                                textAlign="center"
                                width="60px"
                            />
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {transactions.map((t) => (
                            <Table.Row key={t.id}>
                                <Table.Cell>
                                    {new Date(t.date).toLocaleDateString(
                                        "en-US"
                                    )}
                                </Table.Cell>
                                <Table.Cell>{t.type}</Table.Cell>
                                <Table.Cell>{t.description}</Table.Cell>
                                <Table.Cell
                                    textAlign="right"
                                    color={
                                        Number(t.amount) >= 0
                                            ? "green.400"
                                            : "red.400"
                                    }
                                >
                                    {formatCurrency(Number(t.amount))}
                                </Table.Cell>
                                <Table.Cell textAlign="center">
                                    <IconButton
                                        aria-label="Delete transaction"
                                        size="xs"
                                        variant="ghost"
                                        colorPalette="red"
                                        onClick={() => handleDelete(t.id)}
                                    >
                                        ✕
                                    </IconButton>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            )}
        </Box>
    );
};
