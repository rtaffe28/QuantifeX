import React, { useEffect, useState } from "react";
import { Box, Table, Text, Spinner, Flex } from "@chakra-ui/react";
import transactionsService from "@/api/transactions";
import { Transaction } from "@/models/Transaction";

export const TransactionsTable: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchTransactions();
    }, []);

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

    return (
        <Box p={6}>
            <Box
                mb={6}
                p={4}
                bg="bg.subtle"
                rounded="lg"
                borderWidth="1px"
                borderColor="border.default"
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
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            )}
        </Box>
    );
};
