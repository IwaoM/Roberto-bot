const { htmlToPlainText, trimAll } = require("./misc.helper.js");

module.exports = {
  bodyToJsonFrench (body) {
    const result = [];

    const frSections = body.childNodes.find(node => node.childNodes[0]?.id === "Français").getElementsByTagName("section");
    const grammarClassSections = frSections.filter(elem => (
      elem.getElementsByTagName("h3").length &&
      elem.getElementsByTagName("h3")[0].getElementsByTagName("span").length &&
      elem.getElementsByTagName("h3")[0].getElementsByTagName("span").filter(span => span.id.startsWith("fr-")).length
    ));


    for (let section of grammarClassSections) {
      const resultSection = {};

      // section title
      resultSection.title = trimAll(htmlToPlainText(section.getElementsByTagName("h3")[0].toString()), "fr");

      // grammatical gender
      while (section.getElementsByTagName("p")[0].childNodes.length && !section.getElementsByTagName("p")[0].childNodes[0].classList?.value?.length) {
        section.getElementsByTagName("p")[0].childNodes.splice(0, 1);
      }
      if (section.getElementsByTagName("p")[0].childNodes.length) {
        resultSection.gender = trimAll(htmlToPlainText(section.getElementsByTagName("p")[0].toString()), "fr");
      }

      // definition list (filter out empty text nodes)
      const definitionTexts = [];
      const definitionList = section.getElementsByTagName("ol")[0].childNodes.filter(definition => definition.nodeType === 1);
      for (let i = 0; i < definitionList.length; i++) {
        // remove lists of examples
        definitionList[i].childNodes = definitionList[i].childNodes.filter(elem => elem.rawTagName !== "ol" && elem.rawTagName !== "ul");
        definitionTexts.push(trimAll(htmlToPlainText(definitionList[i].toString()), "fr"));
      }
      resultSection.definitions = definitionTexts;

      result.push(resultSection);
    }

    return result;
  }
};