const TOKEN = /\s*(?:(\d+(?:\.\d+)?)|([()+\-*/^]))/y;

export function calculate(expression: string): number {
  if (!expression.trim() || expression.length > 160) {
    throw new Error("Expression is empty or too long.");
  }

  let index = 0;
  let current = "";
  let numberValue: number | null = null;

  function next(): void {
    TOKEN.lastIndex = index;
    const match = TOKEN.exec(expression);
    if (!match) {
      if (expression.slice(index).trim() === "") {
        current = "EOF";
        numberValue = null;
        index = expression.length;
        return;
      }
      throw new Error("Expression contains unsupported characters.");
    }
    index = TOKEN.lastIndex;
    current = match[2] ?? "NUMBER";
    numberValue = match[1] ? Number(match[1]) : null;
  }

  function primary(): number {
    if (current === "NUMBER") {
      const value = numberValue as number;
      next();
      return value;
    }
    if (current === "(") {
      next();
      const value = addSubtract();
      if (String(current) !== ")") {
        throw new Error("Missing closing parenthesis.");
      }
      next();
      return value;
    }
    if (current === "+" || current === "-") {
      const sign = current;
      next();
      const value = primary();
      return sign === "-" ? -value : value;
    }
    throw new Error("Expected a number.");
  }

  function power(): number {
    let value = primary();
    if (current === "^") {
      next();
      value **= power();
    }
    return value;
  }

  function multiplyDivide(): number {
    let value = power();
    while (current === "*" || current === "/") {
      const operator = current;
      next();
      const right = power();
      if (operator === "/" && right === 0) throw new Error("Division by zero.");
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }

  function addSubtract(): number {
    let value = multiplyDivide();
    while (current === "+" || current === "-") {
      const operator = current;
      next();
      const right = multiplyDivide();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  next();
  const result = addSubtract();
  if (current !== "EOF") throw new Error("Unexpected trailing input.");
  if (!Number.isFinite(result)) throw new Error("Result is not finite.");
  return result;
}
