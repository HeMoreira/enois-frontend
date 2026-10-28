import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { subListErrors } from "./sub-list-errors";

const fields = [
  { key: "title", label: "Cargo", required: true },
  { key: "company", label: "Empresa", required: true },
  { key: "startDate", label: "Início", type: "date" },
  { key: "endDate", label: "Fim", type: "date" },
];

const experiencia = {
  title: "Analista",
  company: "Empresa",
  startDate: "2022-11-01",
  endDate: "",
};

describe("subListErrors", () => {
  it("recusa encerrar sem data de fim (o backend gravaria como atual)", () => {
    expect(
      subListErrors({ fields, form: experiencia, invalidDates: new Set(), currentlyHere: false }),
    ).toEqual({ endDate: texts.profile.edit.endDateRequired });
  });

  it("aponta a data que o navegador recusou (31/11 chega como valor vazio)", () => {
    expect(
      subListErrors({
        fields,
        form: experiencia,
        invalidDates: new Set(["endDate"]),
        currentlyHere: false,
      }),
    ).toEqual({ endDate: texts.profile.edit.invalidDate });
  });

  it("aceita atual sem data de fim e encerrada com data de fim", () => {
    expect(
      subListErrors({ fields, form: experiencia, invalidDates: new Set(), currentlyHere: true }),
    ).toEqual({});
    expect(
      subListErrors({
        fields,
        form: { ...experiencia, endDate: "2024-11-30" },
        invalidDates: new Set(),
        currentlyHere: false,
      }),
    ).toEqual({});
  });

  it("cobra os campos obrigatórios, ignorando espaço em branco", () => {
    expect(
      subListErrors({
        fields,
        form: { ...experiencia, title: "  ", company: "" },
        invalidDates: new Set(),
        currentlyHere: true,
      }),
    ).toEqual({
      title: texts.profile.edit.requiredField,
      company: texts.profile.edit.requiredField,
    });
  });

  it("sem “Atualmente aqui” (certificações), data de fim vazia é permitida", () => {
    expect(subListErrors({ fields, form: experiencia, invalidDates: new Set() })).toEqual({});
  });

  it("data inválida é apontada mesmo em lista sem “Atualmente aqui”", () => {
    expect(
      subListErrors({ fields, form: experiencia, invalidDates: new Set(["startDate"]) }),
    ).toEqual({ startDate: texts.profile.edit.invalidDate });
  });
});
