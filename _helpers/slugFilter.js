module.exports.slugFilter = async (slug) => {
  // let slugtext = "this is text with: & and s'pace symbol?5% hello%";
  let slugtext = slug;
  if (slug) {
    let replaceSpace = slugtext.replace(/ /g, "-");

    let replaceAnd = replaceSpace.replace(/&/g, "and");

    let replaceQmark = replaceAnd.replace(/\?/g, "");

    let replaceColumn = replaceQmark.replace(/:/g, "");

    let replaceSingleQuote = replaceColumn.replace(/'/g, "-");
    // Step 4: Replace '%' with '-percent' or 'percent'
    let replacePercent = replaceSingleQuote
      .replace(/(\d+)%/g, "$1-percent")
      .replace(/%/g, "");

    let fullSlug = replacePercent.toLowerCase();
    return fullSlug;
  }
};
