import { formatBRL } from "../currency";

// Intl.NumberFormat('pt-BR') insere um espaço não separável (U+00A0) entre
// "R$" e o valor, não um espaço comum — por isso as expectativas usam
// "R$" + " " + valor, montado explicitamente com o escape unicode, em
// vez de um literal com espaço normal (pareceria igual no terminal, mas
// falharia por toBe comparar código a código).
const NBSP = String.fromCharCode(160); // espaço não separável (U+00A0)

describe("formatBRL", () => {
  it("formata valores em Real no padrão pt-BR (vírgula decimal, separador de milhar)", () => {
    expect(formatBRL(1234.56)).toBe(`R$${NBSP}1.234,56`);
  });

  it("formata valores sem centavos com ,00", () => {
    expect(formatBRL(100)).toBe(`R$${NBSP}100,00`);
  });

  it("arredonda para duas casas decimais", () => {
    expect(formatBRL(19.999)).toBe(`R$${NBSP}20,00`);
  });

  it("formata zero corretamente", () => {
    expect(formatBRL(0)).toBe(`R$${NBSP}0,00`);
  });
});
