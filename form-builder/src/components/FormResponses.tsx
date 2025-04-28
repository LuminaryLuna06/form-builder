import {
  Table,
  Text,
  Title,
  Container,
  Stack,
  Paper,
  Progress,
  Box,
  Group,
  Divider,
  Badge,
  Space,
  Button,
  LoadingOverlay,
  SimpleGrid,
} from "@mantine/core";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useParams } from "react-router-dom";
import { IconDownload } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { BarChart, PieChart } from "@mantine/charts";

export default function FormResponses() {
  const { id: formId } = useParams();
  const [showAllResponses, setShowAllResponses] = useState(false);
  const [snapshot, loading, error] = useCollection(
    query(
      collection(db, "responses", formId || "", "submissions"),
      orderBy("createdAt", "desc")
    )
  );

  // Process response data
  const { questionStats, responseCount, latestResponses } = useMemo(() => {
    if (!snapshot)
      return { questionStats: {}, responseCount: 0, latestResponses: [] };

    const stats: Record<string, any> = {};
    const responses = snapshot.docs.map((doc) => doc.data());

    // Initialize stats for each question
    responses.forEach((response) => {
      Object.entries(response.responses).forEach(([qKey, qData]) => {
        const { title, answer } = qData as { title: string; answer: any };

        if (!stats[qKey]) {
          stats[qKey] = {
            title,
            type: typeof answer,
            answers: [],
            numericAnswers: [],
            options: new Set(),
          };
        }

        stats[qKey].answers.push(answer);
        if (typeof answer === "number") stats[qKey].numericAnswers.push(answer);
        if (typeof answer === "string" && answer.length < 50)
          stats[qKey].options.add(answer);
      });
    });
    // Calculate statistics for each question
    Object.keys(stats).forEach((qKey) => {
      const question = stats[qKey];
      question.totalAnswers = question.answers.length;

      if (question.type === "number") {
        question.average =
          question.numericAnswers.reduce((a: number, b: number) => a + b, 0) /
          question.numericAnswers.length;
        question.min = Math.min(...question.numericAnswers);
        question.max = Math.max(...question.numericAnswers);
      }

      if (question.options.size > 0 && question.options.size < 10) {
        question.optionDistribution = Array.from(question.options).map(
          (option) => ({
            name: option,
            value: question.answers.filter((a: any) => a === option).length,
            percentage:
              (question.answers.filter((a: any) => a === option).length /
                question.totalAnswers) *
              100,
          })
        );
      }
    });
    // const toggleAllResponses = () => setShowAllResponses(!showAllResponses);

    return {
      questionStats: stats,
      responseCount: responses.length,
      latestResponses: responses.slice(0, 5),
    };
  }, [snapshot]);

  if (loading)
    return (
      <Box pos="relative" h="100vh">
        <LoadingOverlay visible />
      </Box>
    );
  if (error)
    return <Text c="red">Error loading responses: {error.message}</Text>;
  if (!responseCount) return <Text>No responses yet</Text>;

  const exportToCSV = () => {
    if (!snapshot || snapshot.empty) {
      alert("No responses to export");
      return;
    }

    // Get all question keys sorted in order
    const questionKeys = Object.keys(snapshot.docs[0].data().responses).sort(
      (a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1))
    );

    // Create CSV header row
    const headers = [
      "Timestamp",
      ...questionKeys.map((qKey) => {
        const question = snapshot.docs[0].data().responses[qKey];
        return `${qKey}: ${question.title} (${question.type})`;
      }),
    ];

    // Create CSV data rows
    const rows = snapshot.docs.map((doc) => {
      const response = doc.data();
      return [
        response.createdAt?.toDate().toISOString(),
        ...questionKeys.map((qKey) => {
          const answer = response.responses[qKey]?.answer;
          // Format the answer for CSV
          if (answer === null || answer === undefined) return "";
          if (typeof answer === "string") {
            const escaped = answer.replace(/"/g, '""');
            return answer.includes(",") ? `"${escaped}"` : escaped;
          }
          return JSON.stringify(answer);
        }),
      ];
    });

    // Create and trigger download
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `form-responses-${formId}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Form Responses Analysis</Title>
        <Group>
          <Button
            variant={showAllResponses ? "filled" : "outline"}
            onClick={() => setShowAllResponses(!showAllResponses)}
          >
            {showAllResponses ? "Hide Full Responses" : "Show All Responses"}
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={exportToCSV}
          >
            Export to CSV
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="md" mb="xl">
        <Text fw={500}>
          Total Responses: <Badge size="lg">{responseCount}</Badge>
        </Text>
      </Paper>

      {/* Full Responses Table - Only shown when toggled */}
      {showAllResponses && (
        <Paper withBorder p="md" mt="xl" mb="xl">
          <Title order={4} mb="md">
            All Responses ({responseCount})
          </Title>
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Submission Time</Table.Th>
                  {Object.keys(questionStats)
                    .sort(
                      (a, b) =>
                        parseInt(a.substring(1)) - parseInt(b.substring(1))
                    )
                    .map((qKey) => (
                      <Table.Th key={qKey}>
                        {questionStats[qKey].title}
                      </Table.Th>
                    ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {snapshot?.docs.map((doc) => {
                  const response = doc.data();
                  return (
                    <Table.Tr key={doc.id}>
                      <Table.Td>
                        {response.createdAt?.toDate().toLocaleString()}
                      </Table.Td>
                      {Object.keys(questionStats)
                        .sort(
                          (a, b) =>
                            parseInt(a.substring(1)) - parseInt(b.substring(1))
                        )
                        .map((qKey) => {
                          const answer = response.responses[qKey]?.answer;
                          const type = response.responses[qKey]?.type;

                          // Format based on question type
                          let displayValue = "";
                          if (answer === null || answer === undefined) {
                            displayValue = "-";
                          } else if (type === "date") {
                            displayValue = new Date(
                              answer
                            ).toLocaleDateString();
                          } else if (typeof answer === "string") {
                            displayValue =
                              answer.length > 50
                                ? `${answer.substring(0, 50)}...`
                                : answer;
                          } else {
                            displayValue = JSON.stringify(answer);
                          }

                          return (
                            <Table.Td key={qKey}>
                              <Text lineClamp={1}>{displayValue}</Text>
                            </Table.Td>
                          );
                        })}
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}

      <Stack gap="xl">
        {Object.entries(questionStats).map(([qKey, stats]) => (
          <Paper key={qKey} withBorder p="md">
            <Text fw={500} mb="sm">
              {stats.title} ({qKey})
            </Text>

            {stats.type === "number" && (
              <>
                <SimpleGrid cols={3} mb="md">
                  <Box>
                    <Text size="sm" c="dimmed">
                      Average
                    </Text>
                    <Text fw={700}>{stats.average?.toFixed(2)}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">
                      Min
                    </Text>
                    <Text fw={700}>{stats.min}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">
                      Max
                    </Text>
                    <Text fw={700}>{stats.max}</Text>
                  </Box>
                </SimpleGrid>

                <BarChart
                  pb={10}
                  h={300}
                  data={Array.from(
                    { length: stats.max - stats.min + 1 },
                    (_, i) => {
                      const value = stats.min + i;
                      const count = stats.numericAnswers.filter(
                        (v: number) => v === value
                      ).length;
                      return { value, count };
                    }
                  )}
                  dataKey="value"
                  series={[{ name: "count", color: "indigo.6" }]}
                  orientation="vertical"
                  yAxisProps={{
                    width: 80,
                    tickCount: stats.max - stats.min + 1,
                    domain: [stats.min - 0.5, stats.max + 0.5],
                  }}
                  barProps={{
                    radius: 4,
                    stroke: "#fff",
                    strokeWidth: 1,
                  }}
                  gridAxis="xy"
                  referenceLines={[
                    {
                      y: stats.average,
                      color: "red.5",
                      label: `Average: ${stats.average.toFixed(1)}`,
                      labelPosition: "insideTopRight",
                    },
                  ]}
                  tooltipProps={{
                    content: ({ payload }) => (
                      <Paper p="sm" shadow="md" withBorder>
                        <Text size="sm">
                          {payload?.[0]?.payload.count}{" "}
                          {payload?.[0]?.payload.count === 1
                            ? "response"
                            : "responses"}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Rating value: {payload?.[0]?.payload.value}
                        </Text>
                      </Paper>
                    ),
                  }}
                />
              </>
            )}

            {stats.optionDistribution && (
              <>
                <Divider my="md" />
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <Box>
                    <Text size="sm" mb="sm">
                      Option Distribution:
                    </Text>
                    {stats.optionDistribution.map((option: any) => (
                      <Box key={option.name} mb="xs">
                        <Group justify="space-between">
                          <Text>{option.name}</Text>
                          <Text fw={500}>
                            {option.value} ({option.percentage.toFixed(1)}%)
                          </Text>
                        </Group>
                        <Progress value={option.percentage} size="sm" mt={4} />
                      </Box>
                    ))}
                  </Box>
                  <PieChart
                    data={stats.optionDistribution}
                    withTooltip
                    tooltipDataSource="segment"
                    mx="auto"
                  />
                </SimpleGrid>
              </>
            )}

            {stats.type === "string" && !stats.optionDistribution && (
              <>
                <Divider my="md" />
                <Text size="sm" mb="sm">
                  Sample Responses:
                </Text>
                <Stack gap={4}>
                  {stats.answers
                    .slice(0, 5)
                    .map((answer: string, i: number) => (
                      <Text key={i} size="sm" c="dimmed">
                        "{answer}"
                      </Text>
                    ))}
                  {stats.answers.length > 5 && (
                    <Text size="sm" c="blue">
                      + {stats.answers.length - 5} more
                    </Text>
                  )}
                </Stack>
              </>
            )}
          </Paper>
        ))}

        <Paper withBorder p="md">
          <Title order={4} mb="md">
            Latest Responses
          </Title>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Time</Table.Th>
                {Object.keys(questionStats).map((qKey) => (
                  <Table.Th key={qKey}>{questionStats[qKey].title}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {latestResponses.map((response, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    {response.createdAt?.toDate().toLocaleString()}
                  </Table.Td>
                  {Object.keys(questionStats).map((qKey) => (
                    <Table.Td key={qKey}>
                      {typeof response.responses[qKey]?.answer === "string"
                        ? response.responses[qKey]?.answer?.slice(0, 30) +
                          (response.responses[qKey]?.answer?.length > 30
                            ? "..."
                            : "")
                        : JSON.stringify(response.responses[qKey]?.answer)}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    </Container>
  );
}
