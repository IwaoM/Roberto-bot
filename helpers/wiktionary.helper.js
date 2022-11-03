const { htmlToPlainText, trimAll } = require("./misc.helper.js");
const { logError, logAction } = require("../helpers/logs.helper.js");

module.exports = {
  async bodyToListFrench (body) {
    try {
      const result = [];

      const frSections = body.childNodes.find(node => node.childNodes[0]?.id === "Français").getElementsByTagName("section");

      // * 1. Get all grammar class sections
      const allGrammarClasses = frSections.filter(elem => (
        elem.getElementsByTagName("h3").length &&
        elem.getElementsByTagName("h3")[0].getElementsByTagName("span").length &&
        elem.getElementsByTagName("h3")[0].getElementsByTagName("span").filter(span => span.id.startsWith("fr-")).length
      ));


      // * 2. For each grammar class section, construct an object and push it in the result list
      for (let grammarClass of allGrammarClasses) {
        const resultEntry = {};

        // entry title
        resultEntry.title = trimAll(htmlToPlainText(grammarClass.getElementsByTagName("h3")[0].toString()), "fr");

        // grammatical gender
        while (grammarClass.getElementsByTagName("p")[0].childNodes.length && !grammarClass.getElementsByTagName("p")[0].childNodes[0].classList?.value?.length) {
          grammarClass.getElementsByTagName("p")[0].childNodes.splice(0, 1);
        }
        if (grammarClass.getElementsByTagName("p")[0].childNodes.length) {
          resultEntry.gender = trimAll(htmlToPlainText(grammarClass.getElementsByTagName("p")[0].toString()), "fr");
        }

        // definition list (filter out empty text nodes)
        const definitionTexts = [];
        const definitionList = grammarClass.getElementsByTagName("ol")[0].childNodes.filter(definition => definition.nodeType === 1);
        for (let i = 0; i < definitionList.length; i++) {
          // remove lists of examples
          definitionList[i].childNodes = definitionList[i].childNodes.filter(elem => elem.rawTagName !== "ol" && elem.rawTagName !== "ul" && elem.rawTagName !== "ul");
          if (trimAll(htmlToPlainText(definitionList[i].toString()), "fr").length) {
            definitionTexts.push(trimAll(htmlToPlainText(definitionList[i].toString()), "fr"));
          }
        }
        resultEntry.definitions = definitionTexts;

        result.push(resultEntry);
      }

      await logAction({ name: "parse FR wiktionary page" });
      return result;
    } catch (err) {
      await logError({
        name: `fr wiktionary parsing error`,
        description: `Failed to parse the html file of the fetched french wiktionary page`,
        function: { name: "bodyToListFrench", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },

  async bodyToListEnglish (body) {
    try {
      const result = [];
      const grammarClassNames = ["Noun", "Verb", "Adjective", "Adverb", "Preposition", "Conjunction", "Pronoun", "Determiner", "Interjection"];

      const enSections = body.childNodes.find(node => node.childNodes[0]?.id === "English").getElementsByTagName("section");

      // * 1. Get all grammar class sections
      // their layout in the page depends on how many etymologies are listed
      const etymologies = enSections.filter(elem => (
        elem.getElementsByTagName("h3").length &&
        elem.getElementsByTagName("h3")[0].id.startsWith("Etymology")
      ));

      const allGrammarClasses = [];
      let titleLevel;
      if (etymologies.length <= 1) {

        // if 0 or 1 etymology, grammar class sections are at the same level (h3)
        titleLevel = "h3";

        // get all sections from the English paragraph, the title's id of which corresponds to a grammar class
        for (let className of grammarClassNames) {
          allGrammarClasses.push(...enSections.filter(section => (
            section.getElementsByTagName("h3").length &&
            section.getElementsByTagName("h3")[0].id.startsWith(className)
          ))
          );
        }

      } else if (etymologies.length > 1) {

        // if multiple etymologies, grammar class sections are one level below (h4) for each etymology
        titleLevel = "h4";

        for (let etymology of etymologies) {
          const grammarClasses = [];

          // Get all subsections of the current etymology section, the title's id of which corresponds to a grammar class
          for (let className of grammarClassNames) {
            grammarClasses.push(...etymology.getElementsByTagName("section").filter(section => (
              section.getElementsByTagName("h4").length &&
              section.getElementsByTagName("h4")[0].id.startsWith(className)
            )));
          }

          // put all grammar class subsections in the array
          for (let grammarClass of grammarClasses) {
            allGrammarClasses.push(grammarClass);
          }
        }

      }

      // * 2. For each grammar class section, construct an object and push it in the result list
      for (let grammarClass of allGrammarClasses) {
        const resultEntry = {};

        // entry title
        // number occurrences of the same grammar class within different etymologies if there are more than 1
        if (allGrammarClasses.filter(entry => trimAll(htmlToPlainText(entry.getElementsByTagName(titleLevel)[0].toString()), "en") === trimAll(htmlToPlainText(grammarClass.getElementsByTagName(titleLevel)[0].toString()), "en")).length > 1) {
          let grammarClassIndex = 1;
          while (result.findIndex(entry => entry.title === trimAll(htmlToPlainText(grammarClass.getElementsByTagName(titleLevel)[0].toString()), "en") + " " + grammarClassIndex) >= 0) {
            grammarClassIndex++;
          }
          resultEntry.title = trimAll(htmlToPlainText(grammarClass.getElementsByTagName(titleLevel)[0].toString()), "en") + " " + grammarClassIndex;
        } else {
          resultEntry.title = trimAll(htmlToPlainText(grammarClass.getElementsByTagName(titleLevel)[0].toString()), "en");
        }

        // definition list (filter out empty text nodes)
        const definitionTexts = [];
        const definitionList = grammarClass.getElementsByTagName("ol")[0].childNodes.filter(definition => definition.nodeType === 1);
        for (let i = 0; i < definitionList.length; i++) {
          // remove lists of examples
          definitionList[i].childNodes = definitionList[i].childNodes.filter(elem =>
            elem.rawTagName !== "ol" && elem.rawTagName !== "ul" && elem.rawTagName !== "dl" &&
            !(elem.rawTagName === "span" && elem.classList?.value?.includes("defdate")) // those aren't needed, plus they cause parsing errors
          );
          if (trimAll(htmlToPlainText(definitionList[i].toString()), "en").length) {
            definitionTexts.push(trimAll(htmlToPlainText(definitionList[i].toString()), "en"));
          }
        }
        resultEntry.definitions = definitionTexts;

        result.push(resultEntry);
      }

      await logAction({ name: "parse EN wiktionary page" });
      return result;
    } catch (err) {
      await logError({
        name: `en wiktionary parsing error`,
        description: `Failed to parse the html file of the fetched english wiktionary page`,
        function: { name: "bodyToListEnglish", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  }
};