exports.checkRequiredFields = function (arr, body) {
  const requiredFields = [...arr];
  const leftFields = requiredFields.filter((field) => {
    if (!body[field]) return field;
  });

  return leftFields;
};
