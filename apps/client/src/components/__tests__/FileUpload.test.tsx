import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FileUpload from "../FileUpload";

describe("FileUpload", () => {
  function setup(uploading = false) {
    const onFilesUploaded = vi.fn();
    const onUploadStart = vi.fn();
    render(
      <FileUpload
        onFilesUploaded={onFilesUploaded}
        onUploadStart={onUploadStart}
        uploading={uploading}
      />
    );
    return { onFilesUploaded, onUploadStart };
  }

  it("shows disabled state when uploading", () => {
    setup(true);
    expect(
      screen.getByText(/Uploading and processing files/i)
    ).toBeInTheDocument();
  });

  it("enables upload when two files are selected and triggers callbacks", async () => {
    const { onFilesUploaded, onUploadStart } = setup();
    const user = userEvent.setup();

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file1 = new File(["a"], "strings.csv", { type: "text/csv" });
    const file2 = new File(["b"], "classifications.csv", { type: "text/csv" });

    // The dropzone uses a hidden input type=file; use label click fallback by firing change on input
    await user.upload(input as HTMLInputElement, [file1, file2]);

    // Upload button should appear
    const btn = await screen.findByRole("button", {
      name: /upload and process files/i,
    });
    await user.click(btn);

    expect(onUploadStart).toHaveBeenCalled();
    expect(onFilesUploaded).toHaveBeenCalled();
  });
});
