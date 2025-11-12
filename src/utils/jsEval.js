export function runJS(code, vars, outputName, paramsObj) {
  const names = Object.keys(vars || {});
  const values = names.map((k) => vars[k]);
  const argList = [...names, 'params'].join(',');
  const src = `
    return (function(${argList}){
      ${code}
      return typeof ${outputName} !== 'undefined' ? ${outputName} : undefined;
    })`;
  const fn = new Function(src)();
  return fn(...values, paramsObj && typeof paramsObj === 'object' ? paramsObj : {});
}
