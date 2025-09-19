import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  ClassificationsRow,
  StringsRow,
  ValidationError,
} from "../../types/csv";
import EditableTable from "../EditableTable";

function setupStrings(opts?: {
  data?: StringsRow[];
  errors?: ValidationError[];
  readonly?: boolean;
  onChange?: (d: StringsRow[]) => void;
}) {
  const data: StringsRow[] = opts?.data ?? [
    {
      Tier: "1",
      Industry: "Software",
      Topic: "Tech",
      Subtopic: "AI",
      Prefix: "PRE",
      "Fuzzing-Idx": "1",
      Prompt: "P",
      Risks: "R",
      Keywords: "K",
    },
  ];
  const onDataChange = vi.fn(opts?.onChange);
  render(
    <EditableTable
      data={data}
      type="strings"
      validationErrors={opts?.errors}
      onDataChange={onDataChange}
      readonly={opts?.readonly ?? false}
    />
  );
  return { onDataChange };
}

function setupClassifications(opts?: {
  data?: ClassificationsRow[];
  readonly?: boolean;
  onChange?: (d: ClassificationsRow[]) => void;
}) {
  const data: ClassificationsRow[] = opts?.data ?? [
    {
      Topic: "Tech",
      SubTopic: "AI",
      Industry: "Software",
      Classification: "A",
    },
  ];
  const onDataChange = vi.fn(opts?.onChange);
  render(
    <EditableTable
      data={data}
      type="classifications"
      validationErrors={[]}
      onDataChange={onDataChange}
      readonly={opts?.readonly ?? false}
    />
  );
  return { onDataChange };
}

describe("EditableTable (strings)", () => {
  it("edits a cell and calls onDataChange", async () => {
    const { onDataChange } = setupStrings();
    const user = userEvent.setup();

    const table = screen.getByRole("table");
    const body = within(table).getAllByRole("rowgroup")[1];
    const firstRow = within(body).getAllByRole("row")[0];
    const cells = within(firstRow).getAllByRole("cell");

    const tierInput = within(cells[0]).getByRole("textbox");
    await user.clear(tierInput);
    await user.type(tierInput, "2");
    await user.tab();

    expect(onDataChange).toHaveBeenCalled();
    const updated = onDataChange.mock.calls.at(-1)?.[0] as StringsRow[];
    expect(updated[0].Tier).toBe("2");
  });

  it("adds a row to the top", async () => {
    const { onDataChange } = setupStrings();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /add row/i }));

    expect(onDataChange).toHaveBeenCalled();
    const updated = onDataChange.mock.calls.at(-1)?.[0] as StringsRow[];
    expect(updated[0]).toMatchObject({ Tier: "", Industry: "", Topic: "" });
  });

  it("deletes a row", async () => {
    const { onDataChange } = setupStrings();
    const user = userEvent.setup();

    const deleteBtn = screen.getAllByRole("button", { name: /delete/i })[0];
    await user.click(deleteBtn);

    expect(onDataChange).toHaveBeenCalled();
    const updated = onDataChange.mock.calls.at(-1)?.[0] as StringsRow[];
    expect(updated.length).toBe(0);
  });

  it("shows validation error styling and messages", async () => {
    setupStrings({
      errors: [{ row: 1, field: "Tier", value: "", message: "Tier required" }],
    });

    // row highlighted
    const table = screen.getByRole("table");
    const body = within(table).getAllByRole("rowgroup")[1];
    const firstRow = within(body).getAllByRole("row")[0];
    expect(firstRow.className).toMatch(/bg-rose-50/);

    // cell message visible
    const tierCell = within(firstRow).getAllByRole("cell")[0];
    expect(within(tierCell).getByText(/Tier required/i)).toBeInTheDocument();
  });

  it("filters rows via search", async () => {
    setupStrings({
      data: [
        {
          Tier: "1",
          Industry: "A",
          Topic: "X",
          Subtopic: "",
          Prefix: "",
          "Fuzzing-Idx": "",
          Prompt: "",
          Risks: "",
          Keywords: "",
        },
        {
          Tier: "2",
          Industry: "B",
          Topic: "Y",
          Subtopic: "",
          Prefix: "",
          "Fuzzing-Idx": "",
          Prompt: "",
          Risks: "",
          Keywords: "",
        },
      ],
    });
    const user = userEvent.setup();

    const search = screen.getByPlaceholderText(/search all columns/i);
    await user.type(search, "B");

    const table = screen.getByRole("table");
    const allRows = within(table).getAllByRole("row");
    // first row is header; body rows follow
    const bodyRows = allRows.slice(1);
    expect(bodyRows.length).toBe(1);
  });
});

describe("EditableTable (classifications)", () => {
  it("edits a cell and calls onDataChange", async () => {
    const { onDataChange } = setupClassifications();
    const user = userEvent.setup();

    const table = screen.getByRole("table");
    const body = within(table).getAllByRole("rowgroup")[1];
    const firstRow = within(body).getAllByRole("row")[0];
    const cells = within(firstRow).getAllByRole("cell");

    const topicInput = within(cells[0]).getByRole("textbox");
    await user.clear(topicInput);
    await user.type(topicInput, "New");
    await user.tab();

    expect(onDataChange).toHaveBeenCalled();
    const updated = onDataChange.mock.calls.at(-1)?.[0] as ClassificationsRow[];
    expect(updated[0].Topic).toBe("New");
  });

  it("adds and deletes rows", async () => {
    const { onDataChange } = setupClassifications();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /add row/i }));
    const afterAdd = onDataChange.mock.calls.at(
      -1
    )?.[0] as ClassificationsRow[];
    expect(afterAdd[0]).toMatchObject({ Topic: "", SubTopic: "" });

    const delBtn = screen.getAllByRole("button", { name: /delete/i })[0];
    await user.click(delBtn);
    const afterDel = onDataChange.mock.calls.at(
      -1
    )?.[0] as ClassificationsRow[];
    expect(afterDel.length).toBe(0);
  });
});
