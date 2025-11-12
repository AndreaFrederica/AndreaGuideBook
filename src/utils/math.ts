export function evaluateExpression(expr: string): number {
  if (!/^[\d+\-*/.()\s]+$/.test(expr)) throw new Error('invalid');
  const tokens = tokenize(expr);
  type Operator = '+' | '-' | '*' | '/';
  const output: (number | string)[] = [];
  const ops: string[] = [];
  const prec: Record<Operator, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const apply = () => {
    const op = ops.pop() as Operator | undefined;
    const b = output.pop() as number;
    const a = output.pop() as number;
    if (op === '+') output.push(a + b);
    else if (op === '-') output.push(a - b);
    else if (op === '*') output.push(a * b);
    else if (op === '/') output.push(b === 0 ? NaN : a / b);
  };
  for (const t of tokens) {
    if (typeof t === 'number') {
      output.push(t);
    } else if (typeof t === 'string' && (t as Operator) in prec) {
      const op = t as Operator;
      while (ops.length) {
        const top = ops[ops.length - 1]!;
        if ((top === '+' || top === '-' || top === '*' || top === '/') && prec[top as Operator] >= prec[op]) apply();
        else break;
      }
      ops.push(op);
    } else if (t === '(') {
      ops.push(t);
    } else if (t === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') apply();
      ops.pop();
    }
  }
  while (ops.length) apply();
  const res = output.pop();
  if (typeof res !== 'number' || output.length) throw new Error('invalid');
  return res;
}

export function tokenize(expr: string): (number | string)[] {
  const out: (number | string)[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr.charAt(i);
    if (ch === ' ') { i++; continue; }
    if ('()+-*/'.includes(ch)) { out.push(ch); i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr.charAt(j))) j++;
      const num = Number(expr.slice(i, j));
      if (!Number.isFinite(num)) throw new Error('invalid');
      out.push(num);
      i = j;
      continue;
    }
    throw new Error('invalid');
  }
  return out;
}
