
// https://toucantoco.com/en/tech-blog/tech/capture-your-html
// brutish....

// Set Inline Styles method
function setInlineStyles(svg) {

  function explicitlySetStyle (element) {
    var cSSStyleDeclarationComputed = getComputedStyle(element);
    var i, len, key, value;
    var svgExcludedValues = ['height', 'width', 'min-height', 'min-width'];
    var computedStyleStr = "";
    for (i=0, len=cSSStyleDeclarationComputed.length; i<len; i++) {
      key=cSSStyleDeclarationComputed[i];
      if (!((element instanceof SVGElement) && svgExcludedValues.indexOf(key) >= 0)) {
        value=cSSStyleDeclarationComputed.getPropertyValue(key);
        computedStyleStr+=key+":"+value+";";
      }
    }
    element.setAttribute('style', computedStyleStr);
  }
  function traverse(obj){
    var tree = [];
    tree.push(obj);
    visit(obj);
    function visit(node) {
      if (node && node.hasChildNodes()) {
        var child = node.firstChild;
        while (child) {
          if (child.nodeType === 1 && child.nodeName != 'SCRIPT'){
            tree.push(child);
            visit(child);
          }
          child = child.nextSibling;
        }
      }
    }
    return tree;
  }
  // hardcode computed css styles inside SVG
  var allElements = traverse(svg);
  var i = allElements.length;
  while (i--){
    explicitlySetStyle(allElements[i]);
  }
}
