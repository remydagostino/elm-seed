module.exports = {
  lines: highlightLines
};

function highlightLines(lines, region, subregion) {
  var regionLines = lines.slice(region.start.line - 1, region.end.line);

  return regionLines.map(function(lineText, index) {
    var lineNum = region.start.line + index;

    return {
      lineNum: region.start.line + index,
      text: lineText,
      markup: markupLine(lineNum, lineText, region, subregion)
    };
  });
}

function markupLine(lineNum, lineText, region, subregion) {
  var startsInRegion = lineNum > region.start.line && lineNum <= region.end.line;
  var startsInSubregion = lineNum > subregion.start.line && lineNum <= subregion.end.line;
  var endsInRegion = lineNum >= region.start.line && lineNum < region.end.line;
  var endsInSubregion = lineNum >= subregion.start.line && lineNum < subregion.end.line;

  var innerLine = lineText.split('').reduce(function(memo, char, index) {
    if (lineNum === region.start.line && index === region.start.column - 1) {
      memo += '<strong>';
    }

    if (lineNum === subregion.start.line && index === subregion.start.column - 1) {
      memo += '<em>';
    }

    memo += char;

    if (lineNum === subregion.end.line && index === Math.max(subregion.start.column - 1, subregion.end.column - 2)) {
      memo += '</em>';
    }

    if (lineNum === region.end.line && index === Math.max(region.start.column - 1, region.end.column - 2)) {
      memo += '</strong>';
    }

    return memo;
  }, '');

  return [
    startsInRegion ? '<strong>' : '',
    startsInSubregion ? '<em>' : '',
    innerLine,
    endsInSubregion ? '</em>' : '',
    endsInRegion ? '</strong>' : ''
  ].join('');
}
