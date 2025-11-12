export function runJS(code, vars, outputName) {
  const names = Object.keys(vars || {});
  const values = names.map((k) => vars[k]);
  const src = `
    return (function(${names.join(',')}){
      ${code}
      return typeof ${outputName} !== 'undefined' ? ${outputName} : undefined;
    })`;
  const fn = new Function(src)();
  return fn(...values);
}
