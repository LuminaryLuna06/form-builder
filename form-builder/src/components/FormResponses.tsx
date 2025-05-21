import {
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
  Button,
  LoadingOverlay,
  SimpleGrid,
} from "@mantine/core";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { collection, query, orderBy, doc, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useParams } from "react-router-dom";
import { IconDownload } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { PieChart, DonutChart } from "@mantine/charts";
import { DefaultMantineColor } from "@mantine/core";
import {
  MantineReactTable,
  MRT_Cell,
  useMantineReactTable,
  type MRT_ColumnDef,
} from "mantine-react-table";

export default function FormResponses() {
  const { id: formId } = useParams();
  const [showAllResponses, setShowAllResponses] = useState(false);

  const [formSnapshot, formLoading, formError] = useDocument(
    doc(db, "forms", formId || "")
  );

  const [snapshot, loading, error] = useCollection(
    query(
      collection(db, "responses", formId || "", "submissions"),
      orderBy("createdAt", "desc")
    )
  );

  const formData = formSnapshot?.data();

  const questionMap = useMemo(() => {
    if (!formData) return {};
    const map: Record<string, { title: string; type: string }> = {};
    formData.pages.forEach((page: any) => {
      page.elements.forEach((q: any) => {
        map[q.name] = { title: q.title, type: q.type };
      });
    });
    return map;
  }, [formData]);

  const mantineColorNames: DefaultMantineColor[] = [
    "blue.6",
    "teal.6",
    "cyan.6",
    "indigo.6",
    "violet.6",
    "grape.6",
    "green.6",
    "lime.6",
    "orange.6",
    "red.6",
  ];

  const { questionStats, responseCount } = useMemo(() => {
    if (!snapshot || !questionMap)
      return { questionStats: {}, responseCount: 0, latestResponses: [] };

    const stats: Record<string, any> = {};
    const responses = snapshot.docs.map((doc) => doc.data());

    responses.forEach((response) => {
      Object.entries(response.responses).forEach(([qKey, answer]) => {
        const meta = questionMap[qKey];
        if (!meta) return;

        if (!stats[qKey]) {
          stats[qKey] = {
            title: meta.title,
            type: meta.type,
            answers: [],
            numericAnswers: [],
            options: new Set(),
          };
        }
        if (Array.isArray(answer)) {
          stats[qKey].answers.push(...answer);
          answer.forEach((item) => {
            if (typeof item === "number") stats[qKey].numericAnswers.push(item);
            if (typeof item === "string" && item.length < 50)
              stats[qKey].options.add(item);
          });
        } else {
          stats[qKey].answers.push(answer);
          if (typeof answer === "number")
            stats[qKey].numericAnswers.push(answer);
          if (typeof answer === "string" && answer.length < 50)
            stats[qKey].options.add(answer);
        }
      });
    });

    Object.keys(stats).forEach((qKey) => {
      const question = stats[qKey];
      question.totalAnswers = question.answers.length;

      if (question.type === "rating" || question.type === "number") {
        question.average =
          question.numericAnswers.reduce((a: number, b: number) => a + b, 0) /
          question.numericAnswers.length;
        question.min = Math.min(...question.numericAnswers);
        question.max = Math.max(...question.numericAnswers);
      }

      if (question.options.size > 0 && question.options.size < 10) {
        question.optionDistribution = Array.from(question.options).map(
          (option, index) => ({
            name: option,
            value: question.answers.filter((a: any) =>
              Array.isArray(a) ? a.includes(option) : a === option
            ).length,
            percentage:
              (question.answers.filter((a: any) =>
                Array.isArray(a) ? a.includes(option) : a === option
              ).length /
                question.totalAnswers) *
              100,
            color: mantineColorNames[index % mantineColorNames.length],
          })
        );
      }
    });

    return {
      questionStats: stats,
      responseCount: responses.length,
      latestResponses: responses.slice(0, 5),
    };
  }, [snapshot, questionMap]);

  const ratingData: {
    title?: string;
    data?: { name: string; value: number; color: DefaultMantineColor }[];
  } = {
    data: [],
  };
  const ratingQuestionKey = Object.keys(questionStats).find(
    (qKey) => questionStats[qKey].type === "rating"
  );

  if (ratingQuestionKey) {
    const counts = Array(11).fill(0); // Assuming ratings are 0-10

    snapshot?.docs.forEach((doc) => {
      const response = doc.data();
      const rating = response.responses?.[ratingQuestionKey];
      if (rating >= 0 && rating <= 10) {
        counts[rating]++;
      }
    });

    ratingData.title = questionStats[ratingQuestionKey].title;
    ratingData.data = counts
      .map((count, index) => ({
        name: `${index} ★`,
        value: count,
        color: mantineColorNames[index % mantineColorNames.length],
      }))
      .filter((item) => item.value > 0);
  }
  const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
    if (!questionMap) return [];

    return [
      {
        accessorKey: "createdAt",
        header: "Submission Time",
        Cell: ({ cell }) => {
          const value = cell.getValue() as Timestamp;
          return (
            <Text>
              {value?.toDate().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
          );
        },
        size: 180,
      },
      ...Object.keys(questionStats)
        .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)))
        .map((qKey) => ({
          accessorKey: `responses.${qKey}`,
          header: questionStats[qKey].title,
          Cell: ({ cell }: { cell: MRT_Cell<any> }) => {
            const value = cell.getValue();
            const questionType = questionStats[qKey].type;

            if (value === undefined || value === null) return "-";

            // Custom rendering based on question type
            if (questionType === "date") {
              return (
                <Text>
                  {(value as Timestamp)?.toDate?.()?.toLocaleDateString() ||
                    "Invalid date"}
                </Text>
              );
            } else if (Array.isArray(value)) {
              return <Text>{value.join(", ")}</Text>;
            } else if (typeof value === "object") {
              return <Text>{JSON.stringify(value)}</Text>;
            } else if (typeof value === "string" && value.length > 50) {
              return <Text lineClamp={1}>{value.substring(0, 50)}...</Text>;
            } else {
              return <Text>{String(value)}</Text>;
            }
          },
          size: 200,
        })),
    ];
  }, [questionMap, questionStats]);

  const tableData = useMemo(
    () =>
      snapshot?.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) || [],
    [snapshot]
  );

  const table = useMantineReactTable({
    columns,
    data: tableData,
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      density: "xs",
    },
    enableColumnResizing: true,
    enableColumnOrdering: true,
    enableRowSelection: false,
    enableFullScreenToggle: false,
    enableTopToolbar: true,
    mantinePaperProps: {
      shadow: "sm",
      withBorder: true,
    },
  });
  const exportToCSV = () => {
    if (!snapshot || snapshot.empty || !questionMap) {
      alert("No responses to export");
      return;
    }

    const questionKeys = Object.keys(questionMap);

    const headers = [
      "Timestamp",
      ...questionKeys.map(
        (qKey) =>
          `${qKey}: ${questionMap[qKey]?.title || "Unknown"} (${
            questionMap[qKey]?.type || "-"
          })`
      ),
      "Score",
    ];

    const rows = snapshot.docs.map((doc) => {
      const response = doc.data();
      return [
        response.createdAt?.toDate().toISOString(),
        ...questionKeys.map((qKey) => {
          const answer = response.responses[qKey];
          if (answer === null || answer === undefined) return "";
          if (typeof answer === "string") {
            const escaped = answer.replace(/"/g, '""');
            return answer.includes(",") ? `"${escaped}"` : escaped;
          }
          return JSON.stringify(answer);
        }),
        `${response.totalScore * 100}%`,
      ];
    });

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `form-responses-${formId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadResponsesTxt = () => {
    if (!snapshot || !formData) return;

    let txtContent = `Form Title: ${formData.title}\n`;
    txtContent += `Total Responses: ${snapshot.docs.length}\n\n`;
    txtContent += "=== ALL RESPONSES ===\n\n";

    snapshot.docs.forEach((doc, index) => {
      const responseData = doc.data();
      txtContent += `Response #${index + 1}\n`;
      txtContent += `Submitted: ${new Date(
        responseData.createdAt?.seconds * 1000
      ).toLocaleString()}\n`;

      Object.entries(responseData.responses).forEach(([qKey, answer]) => {
        const questionMeta = questionMap[qKey];
        if (!questionMeta) return;

        txtContent += `Q: ${questionMeta.title}\n`;

        if (Array.isArray(answer)) {
          txtContent += `A: ${answer.join(", ")}\n`;
        } else if (typeof answer === "object" && answer !== null) {
          txtContent += `A: ${JSON.stringify(answer)}\n`;
        } else {
          txtContent += `A: ${answer}\n`;
        }
      });

      txtContent += "\n";
    });

    txtContent += "\n=== STATISTICS ===\n\n";
    Object.entries(questionStats).forEach(([_, stat]) => {
      txtContent += `Question: ${stat.title} (${stat.type})\n`;
      txtContent += `Total answers: ${stat.totalAnswers}\n`;

      if (stat.average !== undefined) {
        txtContent += `Average: ${stat.average.toFixed(2)}\n`;
        txtContent += `Range: ${stat.min} - ${stat.max}\n`;
      }

      if (stat.optionDistribution) {
        txtContent += "Options:\n";
        stat.optionDistribution.forEach((option: any) => {
          txtContent += `- ${option.name}: ${
            option.value
          } (${option.percentage.toFixed(1)}%)\n`;
        });
      }

      txtContent += "\n";
    });

    const blob = new Blob([txtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FormResponses_${formData.title.replace(
      /[^a-z0-9]/gi,
      "_"
    )}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || formLoading)
    return (
      <Box pos="relative" h="100vh">
        <LoadingOverlay visible />
      </Box>
    );
  if (error || formError)
    return (
      <Text c="red">
        Error: {error?.message || formError?.message || "Unknown error"}
      </Text>
    );

  if (!responseCount)
    return (
      <Container>
        <Text ta="center" size="xl" fw={500}>
          No responses yet
        </Text>
      </Container>
    );

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
          <button
            onClick={downloadResponsesTxt}
            disabled={!snapshot || snapshot.docs.length === 0}
            className="download-btn"
          >
            Download All Responses as TXT
          </button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={exportToCSV}
          >
            Export to CSV
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="md" mb="xl" style={{ display: "flex", gap: 10 }}>
        <Text fw={500}>Total Responses:</Text>
        <Badge size="lg">{responseCount}</Badge>
      </Paper>

      {showAllResponses && (
        <Box mt="xl" mb="xl">
          <Title order={4} mb="md">
            All Responses ({responseCount})
          </Title>
          <MantineReactTable table={table} />
        </Box>
      )}

      <Stack gap="xl">
        {Object.entries(questionStats).map(([qKey, stats]) => (
          <Paper key={qKey} withBorder p="md">
            <Text fw={500} mb="sm">
              {stats.title} ({qKey})
            </Text>
            {stats.type === "short_text" && stats.answers.length > 0 && (
              <>
                <Text size="sm" mb="md">
                  Total Responses: {stats.answers.length}
                </Text>
                {stats.frequentTerms && stats.frequentTerms.length > 0 && (
                  <Box mb="md">
                    <Text size="sm" fw={500}>
                      Frequent Terms:
                    </Text>
                    <Group gap="xs" mt="xs">
                      {stats.frequentTerms.map((term: any) => (
                        <Badge key={term.text} variant="outline">
                          {term.text} ({term.value})
                        </Badge>
                      ))}
                    </Group>
                  </Box>
                )}
                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    Sample Responses:
                  </Text>
                  <Stack gap="xs">
                    {stats.answers
                      .slice(0, 5)
                      .map((answer: string, index: number) => (
                        <Paper key={index} p="xs" withBorder>
                          <Text size="sm">
                            {answer || <Text c="dimmed">[Empty response]</Text>}
                          </Text>
                        </Paper>
                      ))}
                    {stats.answers.length > 5 && (
                      <Text size="sm" c="dimmed">
                        + {stats.answers.length - 5} more responses...
                      </Text>
                    )}
                  </Stack>
                </Box>
              </>
            )}

            {stats.type === "date" && stats.answers.length > 0 && (
              <>
                <Text size="sm" mb="md">
                  Total Responses: {stats.answers.length}
                </Text>
                {stats.frequentTerms && stats.frequentTerms.length > 0 && (
                  <Box mb="md">
                    <Text size="sm" fw={500}>
                      Frequent Terms:
                    </Text>
                    <Group gap="xs" mt="xs">
                      {stats.frequentTerms.map((term: any) => (
                        <Badge key={term.text} variant="outline">
                          {term.text} ({term.value})
                        </Badge>
                      ))}
                    </Group>
                  </Box>
                )}
                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    Sample Responses:
                  </Text>
                  <Stack gap="xs">
                    {stats.answers
                      .slice(0, 5)
                      .map((answer: string, index: number) => (
                        <Paper key={index} p="xs" withBorder>
                          <Text size="sm">
                            {answer || <Text c="dimmed">[Empty response]</Text>}
                          </Text>
                        </Paper>
                      ))}
                    {stats.answers.length > 5 && (
                      <Text size="sm" c="dimmed">
                        + {stats.answers.length - 5} more responses...
                      </Text>
                    )}
                  </Stack>
                </Box>
              </>
            )}

            {stats.type === "rating" && stats.answers.length > 0 && (
              <>
                <Text size="sm" mb="md">
                  Average: {stats.average?.toFixed(2)} (Min: {stats.min}, Max:{" "}
                  {stats.max})
                </Text>
                {ratingData.data && ratingData.data.length > 0 ? (
                  <DonutChart
                    data={ratingData.data}
                    withTooltip
                    withLabels
                    size={300}
                    thickness={40}
                    paddingAngle={10}
                    mx="auto"
                    chartLabel="Rating Distribution"
                  />
                ) : (
                  <Text size="sm">No data available for this chart.</Text>
                )}
              </>
            )}

            {stats.optionDistribution && stats.type === "multiple_choice" && (
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
                    size={250}
                    strokeWidth={0.6}
                  />
                </SimpleGrid>
              </>
            )}

            {stats.optionDistribution && stats.type === "checkbox" && (
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
                    size={250}
                    strokeWidth={0.6}
                  />
                </SimpleGrid>
              </>
            )}
          </Paper>
        ))}
      </Stack>
    </Container>
  );
}
