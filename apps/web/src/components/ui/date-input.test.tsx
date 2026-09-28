import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { DateInput } from "./date-input";

function Harness({ initial = "", onChange = vi.fn(), onBlur }: {
  initial?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="d">date</label>
      <DateInput
        id="d"
        name="due"
        value={value}
        onBlur={onBlur}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
      <button type="button" onClick={() => setValue("2030-01-05")}>
        external
      </button>
      <span>value:{value}</span>
    </>
  );
}

describe("DateInput", () => {
  it("shows the stored date as DD/MM/YYYY", () => {
    render(<Harness initial="2027-03-14" />);
    expect(screen.getByLabelText("date")).toHaveValue("14/03/2027");
    expect(screen.getByLabelText("date")).toHaveAttribute("name", "due");
  });

  it("emits YYYY-MM-DD once a complete date is typed, and nothing before", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByLabelText("date");

    fireEvent.change(input, { target: { value: "1403" } });
    expect(input).toHaveValue("14/03");
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "14032027" } });
    expect(input).toHaveValue("14/03/2027");
    expect(onChange).toHaveBeenLastCalledWith("2027-03-14");
  });

  it("clears the value when the field is emptied", () => {
    const onChange = vi.fn();
    render(<Harness initial="2027-03-14" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("date"), { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith("");
    expect(screen.getByText("value:")).toBeInTheDocument();
  });

  it("restores the stored date when leaving a half-typed or impossible date", () => {
    const onBlur = vi.fn();
    render(<Harness initial="2027-03-14" onBlur={onBlur} />);
    const input = screen.getByLabelText("date");

    fireEvent.change(input, { target: { value: "31022027" } });
    expect(input).toHaveValue("31/02/2027");
    fireEvent.blur(input);
    expect(input).toHaveValue("14/03/2027");
    expect(onBlur).toHaveBeenCalledTimes(1);

    // A valid date is left as typed on blur.
    fireEvent.change(input, { target: { value: "01012028" } });
    fireEvent.blur(input);
    expect(input).toHaveValue("01/01/2028");
  });

  it("follows value changes made outside the field", () => {
    render(<Harness initial="2027-03-14" />);
    fireEvent.click(screen.getByRole("button", { name: "external" }));
    expect(screen.getByLabelText("date")).toHaveValue("05/01/2030");
  });

  it("keeps a partially typed date while the stored value is unchanged elsewhere", () => {
    const { rerender } = render(<DateInput value="" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "12" } });
    rerender(<DateInput value="bad" onChange={vi.fn()} />);
    expect(input).toHaveValue("");
  });

  it("picks a date from the calendar", () => {
    const onChange = vi.fn();
    render(<Harness initial="2027-03-14" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "open_calendar" }));
    const day = screen.getAllByRole("button").find((button) =>
      /March 20(th)?,? 2027/.test(button.getAttribute("aria-label") ?? ""),
    ) as HTMLElement;
    fireEvent.click(day);

    expect(onChange).toHaveBeenLastCalledWith("2027-03-20");
    expect(screen.getByLabelText("date")).toHaveValue("20/03/2027");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("ignores deselecting the chosen day", () => {
    const onChange = vi.fn();
    render(<Harness initial="2027-03-14" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "open_calendar" }));
    const selected = screen.getAllByRole("button").find((button) =>
      /March 14(th)?,? 2027/.test(button.getAttribute("aria-label") ?? ""),
    ) as HTMLElement;
    fireEvent.click(selected);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables typing and the calendar button", () => {
    render(<DateInput value="2027-03-14" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "open_calendar" })).toBeDisabled();
  });
});
