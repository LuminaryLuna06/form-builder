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
  ComboboxItem,
  Flex,
  ActionIcon,
  Tooltip,
  Notification,
  Modal,
} from "@mantine/core";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { PieChart, DonutChart } from "@mantine/charts";
import { DefaultMantineColor } from "@mantine/core";
import {
  MantineReactTable,
  MRT_Cell,
  MRT_Row,
  useMantineReactTable,
  type MRT_ColumnDef,
} from "mantine-react-table";
import { MRT_Localization_VI } from "mantine-react-table/locales/vi/index.cjs";
import { mkConfig, generateCsv, download } from "export-to-csv";
import { ResponseData, FormData, QuestionType } from "../types/form";
import { IconAlertCircle, IconDownload, IconTrash } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { useAuth } from "../context/authContext";
import { notifications } from "@mantine/notifications";

interface QuestionStats {
  title: string;
  type: string;
  answers: (string | string[] | number | Date | Timestamp | null)[];
  numericAnswers: number[];
  options: Set<string>;
  totalAnswers: number;
  average?: number;
  min?: number;
  max?: number;
  optionDistribution?: {
    name: string;
    value: number;
    percentage: number;
    color: DefaultMantineColor;
  }[];
}
// Map QuestionType to MRT filter variants
const getFilterVariant = (
  type: QuestionType
): "range" | "multi-select" | "select" | "text" => {
  switch (type) {
    case "rating":
      return "range";
    case "multiple_choice":
      return "select";
    default:
      return "text";
  }
};

const csvConfig = mkConfig({
  fieldSeparator: ";",
  decimalSeparator: ".",
  useKeysAsHeaders: true,
});

export default function FormResponses() {
  const { id: formId } = useParams();
  const { currentUser } = useAuth();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<ResponseData | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  // Modified export functions for FormResponses.tsx
  const handleExportRows = (rows: MRT_Row<ResponseData>[]) => {
    const questionKeys = Object.keys(questionMap).sort(
      (a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1))
    );

    const rowData = rows.map((row) => {
      const original = row.original;
      const responseData: Record<string, any> = {
        Timestamp: original.createdAt.toDate().toISOString(),
      };

      // Add question columns (using question title as key)
      questionKeys.forEach((qKey) => {
        const questionTitle = questionMap[qKey]?.title || qKey; // Fallback to qKey if title missing
        const answer = original.responses[qKey];
        responseData[questionTitle] = Array.isArray(answer)
          ? answer.join(", ")
          : answer instanceof Timestamp
          ? answer.toDate().toLocaleDateString("en-GB")
          : answer ?? "";
      });

      // Add Score column if form is a quiz
      if (formData?.isQuiz) {
        responseData["Score"] =
          typeof original.totalScore === "number"
            ? `${(original.totalScore * 100).toFixed(2)}%`
            : "";
      }

      return responseData;
    });

    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const handleExportData = () => {
    const questionKeys = Object.keys(questionMap).sort(
      (a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1))
    );

    const transformedData = tableData.map((item) => {
      const responseData: Record<string, any> = {
        Timestamp: item.createdAt.toDate().toISOString(),
      };

      // Add question columns (using question title as key)
      questionKeys.forEach((qKey) => {
        const questionTitle = questionMap[qKey]?.title || qKey; // Fallback to qKey if title missing
        const answer = item.responses[qKey];
        responseData[questionTitle] = Array.isArray(answer)
          ? answer.join(", ")
          : answer instanceof Timestamp
          ? answer.toDate().toLocaleDateString("en-GB")
          : answer ?? "";
      });

      // Add Score column if form is a quiz
      if (formData?.isQuiz) {
        responseData["Score"] =
          typeof item.totalScore === "number"
            ? `${(item.totalScore * 100).toFixed(2)}%`
            : "";
      }

      return responseData;
    });

    const csv = generateCsv(csvConfig)(transformedData);
    download(csvConfig)(csv);
  };

  const [formSnapshot, formLoading, formError] = useDocument(
    doc(db, "forms", formId || "")
  );

  const [snapshot, loading, error] = useCollection(
    query(
      collection(db, "responses", formId || "", "submissions"),
      orderBy("createdAt", "desc")
    )
  );

  const formData = formSnapshot?.data() as FormData | undefined;

  const questionMap = useMemo(() => {
    if (!formData) return {};
    const map: Record<string, { title: string; type: string }> = {};
    formData.pages.forEach((page: any) => {
      page.elements.forEach((q: any) => {
        map[q.name] = { title: q.title ?? "(Untitled question)", type: q.type };
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
      return {
        questionStats: {} as Record<string, QuestionStats>,
        responseCount: 0,
      };

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
            totalAnswers: 0,
          };
        }
        if (Array.isArray(answer)) {
          stats[qKey].answers.push(...answer);
          answer.forEach((item) => {
            if (typeof item === "number") stats[qKey].numericAnswers.push(item);
            if (typeof item === "string") stats[qKey].options.add(item);
          });
        } else {
          stats[qKey].answers.push(answer);
          if (typeof answer === "number")
            stats[qKey].numericAnswers.push(answer);
          if (typeof answer === "string") stats[qKey].options.add(answer);
        }
      });
    });

    Object.keys(stats).forEach((qKey) => {
      const question = stats[qKey];
      question.totalAnswers = question.answers.length;

      if (question.type === "rating" || question.type === "number") {
        question.average =
          question.numericAnswers.length > 0
            ? question.numericAnswers.reduce(
                (a: number, b: number) => a + b,
                0
              ) / question.numericAnswers.length
            : undefined;
        question.min =
          question.numericAnswers.length > 0
            ? Math.min(...question.numericAnswers)
            : undefined;
        question.max =
          question.numericAnswers.length > 0
            ? Math.max(...question.numericAnswers)
            : undefined;
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
      const response = doc.data() as ResponseData;
      const rating = response.responses?.[ratingQuestionKey];
      if (typeof rating === "number" && rating >= 0 && rating <= 10) {
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

  const tableData = useMemo(
    () =>
      (snapshot?.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ResponseData[]) || [],
    [snapshot]
  );
  const columns = useMemo<MRT_ColumnDef<ResponseData>[]>(() => {
    if (!questionMap) return [];

    const baseColumns: MRT_ColumnDef<ResponseData>[] = [
      {
        accessorFn: (row) => {
          const value = row.createdAt;
          if (!value) return null;
          if (value instanceof Timestamp) return value.toDate();
          if (typeof value === "string" || typeof value === "number") {
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date;
          }
          if (
            typeof value === "object" &&
            value !== null &&
            "getTime" in value &&
            value
          ) {
            return value;
          }
          return null;
        },
        accessorKey: "createdAt",
        header: "Submission Time",
        Cell: ({ cell }) => {
          const value = cell.getValue<Date | null>();
          return (
            <Text>
              {value
                ? value.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "Invalid date"}
            </Text>
          );
        },
        size: 200,
        filterVariant: "date-range",
        sortingFn: "datetime",
      },
      ...Object.keys(questionStats)
        .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)))
        .map((qKey) => {
          const questionType = questionStats[qKey].type;
          const isCheckbox = questionType === "checkbox";
          const isMultipleChoice = questionType === "multiple_choice";
          return {
            accessorKey: `responses.${qKey}`,
            header: questionStats[qKey].title,
            Cell: ({ cell }: { cell: MRT_Cell<ResponseData> }) => {
              const value = cell.getValue<
                string | string[] | number | Date | Timestamp | null
              >();

              if (value === undefined || value === null) return <Text>-</Text>;
              if (questionType === "date") {
                try {
                  const date =
                    value instanceof Date
                      ? value
                      : value instanceof Timestamp
                      ? value.toDate()
                      : typeof value === "string" || typeof value === "number"
                      ? new Date(value)
                      : null;
                  return date ? (
                    <Text>{date.toLocaleDateString("en-GB")}</Text>
                  ) : (
                    <Text>Invalid date</Text>
                  );
                } catch {
                  return <Text>Invalid date</Text>;
                }
              } else if (questionType === "checkbox") {
                return (
                  <Text>
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </Text>
                );
              } else if (Array.isArray(value)) {
                return <Text>{value.join(", ")}</Text>;
              } else if (typeof value === "string" && value.length > 50) {
                return <Text lineClamp={1}>{value.substring(0, 50)}...</Text>;
              } else {
                return <Text>{String(value)}</Text>;
              }
            },
            size: 200,
            filterVariant: isCheckbox
              ? "multi-select"
              : getFilterVariant(questionStats[qKey].type),
            filterFn: isCheckbox
              ? "arrIncludesSome"
              : isMultipleChoice
              ? "arrIncludes"
              : "betweenInclusive",
            mantineFilterSelectProps:
              questionStats[qKey].type === "multiple_choice"
                ? {
                    data: Array.from(questionStats[qKey].options).map(
                      (option): ComboboxItem => ({
                        label: option as string,
                        value: option as string,
                      })
                    ),
                  }
                : undefined,
            mantineFilterMultiSelectProps:
              questionStats[qKey].type === "checkbox"
                ? {
                    data: Array.from(questionStats[qKey].options).map(
                      (option): ComboboxItem => ({
                        label: option as string,
                        value: option as string,
                      })
                    ),
                  }
                : undefined,
          };
        }),
    ];

    // Conditionally add Score column if form is a quiz
    if (formData?.isQuiz) {
      baseColumns.push({
        accessorKey: "totalScore",
        header: "Score",
        Cell: ({ cell }) => (
          <Text>
            {typeof cell.getValue() === "number"
              ? `${(cell.getValue<number>() * 100).toFixed(2)}%`
              : "-"}
          </Text>
        ),
        size: 150,
        filterVariant: "range",
      });
    }

    return baseColumns;
  }, [questionMap, questionStats, formData]);

  const handleDeleteRow = async (row: MRT_Row<ResponseData>) => {
    if (!currentUser || !formId) return;

    modals.openConfirmModal({
      title: "Xác nhận xóa phản hồi",
      children: (
        <Text>
          Bạn có chắc chắn muốn xóa phản hồi này? Hành động này không thể hoàn
          tác.
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteDoc(
            doc(db, "responses", formId, "submissions", row.original.id)
          );
          notifications.show({
            title: "Thành công",
            message: "Phản hồi đã được xóa.",
            color: "green",
          });
        } catch (error: any) {
          setDeleteError(error.message || "Lỗi khi xóa phản hồi");
          console.error("Error deleting response:", error);
        }
      },
    });
  };
  const handleDeleteSelectedRows = (rows: MRT_Row<ResponseData>[]) => {
    if (!currentUser || !formId) return;

    modals.openConfirmModal({
      title: "Xác nhận xóa nhiều phản hồi",
      children: (
        <Text>
          Bạn có chắc chắn muốn xóa {rows.length} phản hồi đã chọn? Hành động
          này không thể hoàn tác.
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          const deletePromises = rows.map((row) =>
            deleteDoc(
              doc(db, "responses", formId, "submissions", row.original.id)
            )
          );
          await Promise.all(deletePromises);
          notifications.show({
            title: "Thành công",
            message: `${rows.length} phản hồi đã được xóa.`,
            color: "green",
          });
        } catch (error: any) {
          setDeleteError(error.message || "Lỗi khi xóa các phản hồi");
          console.error("Error deleting responses:", error);
        }
      },
    });
  };

  const handleRowClick = (row: MRT_Row<ResponseData>) => {
    setSelectedRow(row.original);
    setModalOpened(true);
  };

  const table = useMantineReactTable<ResponseData>({
    columns,
    data: tableData,
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      density: "xs",
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    enableColumnResizing: true,
    enableColumnOrdering: true,
    enableDensityToggle: false,
    enableFullScreenToggle: true,
    enableTopToolbar: true,
    columnFilterDisplayMode: "popover",
    mantinePaperProps: {
      shadow: "sm",
      withBorder: true,
      p: "md",
      mt: "xl",
      mb: "xl",
    },
    mantineTableProps: {
      striped: "odd",
      highlightOnHover: true,
      withTableBorder: true,
      withColumnBorders: true,
    },
    enableStickyHeader: true,
    localization: MRT_Localization_VI,
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      style: {
        cursor: "pointer",
      },
    }),
    renderRowActions: ({ row }) => (
      <Flex gap="md">
        <Tooltip label="Delete">
          <ActionIcon color="red" onClick={() => handleDeleteRow(row)}>
            <IconTrash />
          </ActionIcon>
        </Tooltip>
      </Flex>
    ),
    renderTopToolbarCustomActions: ({ table }) => (
      <Box
        style={{
          display: "flex",
          gap: "16px",
          padding: "8px",
          flexWrap: "wrap",
        }}
      >
        <Button
          color="lightblue"
          //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
          onClick={handleExportData}
          leftSection={<IconDownload />}
          variant="filled"
        >
          Xuất Tất Cả Dữ Liệu
        </Button>
        <Button
          disabled={table.getPrePaginationRowModel().rows.length === 0}
          //export all rows, including from the next page, (still respects filtering and sorting)
          onClick={() =>
            handleExportRows(table.getPrePaginationRowModel().rows)
          }
          leftSection={<IconDownload />}
          variant="filled"
        >
          Xuất Tất Cả Hàng
        </Button>
        <Button
          disabled={table.getRowModel().rows.length === 0}
          //export all rows as seen on the screen (respects pagination, sorting, filtering, etc.)
          onClick={() => handleExportRows(table.getRowModel().rows)}
          leftSection={<IconDownload />}
          variant="filled"
        >
          Xuất Các Hàng Trong Trang
        </Button>
        <Button
          disabled={
            !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
          }
          //only export selected rows
          onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
          leftSection={<IconDownload />}
          variant="filled"
        >
          Xuất Hàng Được Chọn
        </Button>
        <Button
          color="red"
          disabled={
            !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
          }
          onClick={() =>
            handleDeleteSelectedRows(table.getSelectedRowModel().rows)
          }
          leftSection={<IconTrash />}
          variant="filled"
        >
          Xóa Các Hàng Được Chọn
        </Button>
      </Box>
    ),
  });

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
      </Group>
      {deleteError && (
        <Notification
          icon={<IconAlertCircle size={18} />}
          color="red"
          onClose={() => setDeleteError(null)}
          withCloseButton
          mb="md"
        >
          {deleteError}
        </Notification>
      )}
      <Paper withBorder p="md" mb="xl" style={{ display: "flex", gap: 10 }}>
        <Text fw={500}>Total Responses:</Text>
        <Badge size="lg" fw={700}>{responseCount}</Badge>
      </Paper>

      {/* {showAllResponses && ( */}
      <Box mt="xl" mb="xl">
        <MantineReactTable table={table} />
      </Box>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Chi tiết phản hồi"
        size="lg"
      >
        {selectedRow && (
          <Stack>
            <Text>
              Thời gian gửi:{" "}
              {selectedRow.createdAt instanceof Timestamp
                ? selectedRow.createdAt.toDate().toLocaleString("en-GB")
                : "Invalid date"}
            </Text>
            {formData?.isQuiz && (
              <Text>
                Điểm số:{" "}
                {typeof selectedRow.totalScore === "number"
                  ? `${(selectedRow.totalScore * 100).toFixed(2)}%`
                  : "-"}
              </Text>
            )}
            <Divider />
            {Object.keys(questionMap)
              .sort(
                (a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1))
              )
              .map((qKey) => {
                const answer = selectedRow.responses[qKey];
                const questionType = questionMap[qKey].type;
                let displayAnswer: string;

                if (answer === undefined || answer === null) {
                  displayAnswer = "-";
                } else if (questionType === "date") {
                  try {
                    const date =
                      answer instanceof Timestamp
                        ? answer.toDate()
                        : answer instanceof Date
                        ? answer
                        : Array.isArray(answer)
                        ? new Date()
                        : new Date(answer);
                    displayAnswer = date.toLocaleDateString("en-GB");
                  } catch {
                    displayAnswer = "Invalid date";
                  }
                } else if (Array.isArray(answer)) {
                  displayAnswer = answer.join(", ");
                } else {
                  displayAnswer = String(answer);
                }

                return (
                  <Box key={qKey}>
                    <Text fw={700}>{questionMap[qKey].title}</Text>
                    <Text>{displayAnswer}</Text>
                  </Box>
                );
              })}
          </Stack>
        )}
      </Modal>

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
